/**
 * E2E-only: read privy-token from the user's normal Chrome profile cookie DB.
 * No CDP. No Google login. No automation browser.
 *
 * Windows Chrome v80+: Local State DPAPI key + Cookies AES-GCM (v10).
 */
import { copyFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDecipheriv, createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function chromeUserDataDir(env = process.env) {
  if (env.CHROME_USER_DATA_DIR?.trim()) return env.CHROME_USER_DATA_DIR.trim();
  if (process.platform === 'win32') {
    return join(env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data');
  }
  if (process.platform === 'darwin') {
    return join(env.HOME || '', 'Library', 'Application Support', 'Google', 'Chrome');
  }
  return join(env.HOME || '', '.config', 'google-chrome');
}

function chromeProfileDir(env = process.env) {
  if (env.CHROME_PROFILE_DIRECTORY?.trim()) return env.CHROME_PROFILE_DIRECTORY.trim();

  // Prefer Chrome's last-used profile when Default has no cookie DB.
  try {
    const userDataDir = chromeUserDataDir(env);
    const localStatePath = join(userDataDir, 'Local State');
    if (existsSync(localStatePath)) {
      const localState = JSON.parse(readFileSync(localStatePath, 'utf8'));
      const last = localState?.profile?.last_used;
      if (last && typeof last === 'string') return last;
    }
  } catch { /**/ }

  return 'Default';
}

function listChromeProfilesWithCookies(userDataDir) {
  const profiles = [];
  try {
    for (const name of readdirSync(userDataDir)) {
      try {
        if (!statSync(join(userDataDir, name)).isDirectory()) continue;
      } catch { continue; }
      if (!(name === 'Default' || name.startsWith('Profile '))) continue;
      if (cookiesDbPath(userDataDir, name)) profiles.push(name);
    }
  } catch { /**/ }
  return profiles;
}

function cookiesDbPath(userDataDir, profile) {
  const modern = join(userDataDir, profile, 'Network', 'Cookies');
  if (existsSync(modern)) return modern;
  const legacy = join(userDataDir, profile, 'Cookies');
  return existsSync(legacy) ? legacy : '';
}

function dpapiUnprotectBase64(encryptedKeyB64) {
  if (process.platform !== 'win32') return null;
  const ps = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$raw = [Convert]::FromBase64String('${encryptedKeyB64}')
if ($raw.Length -lt 6) { throw 'key too short' }
# Chrome prefixes DPAPI blob with ASCII "DPAPI"
$dpapi = $raw[5..($raw.Length-1)]
$plain = [System.Security.Cryptography.ProtectedData]::Unprotect(
  [byte[]]$dpapi, $null,
  [System.Security.Cryptography.DataProtectionScope]::CurrentUser
)
[Convert]::ToBase64String($plain)
`.trim();

  const r = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', ps],
    { encoding: 'utf8', windowsHide: true, timeout: 15_000 },
  );
  if (r.status !== 0) return null;
  const out = String(r.stdout || '').trim();
  return out.length > 20 ? out : null;
}

function getChromeAesKey(userDataDir) {
  const localStatePath = join(userDataDir, 'Local State');
  if (!existsSync(localStatePath)) return null;
  let localState;
  try {
    localState = JSON.parse(readFileSync(localStatePath, 'utf8'));
  } catch {
    return null;
  }
  const encryptedKeyB64 = localState?.os_crypt?.encrypted_key;
  if (!encryptedKeyB64) return null;

  if (process.platform === 'win32') {
    const plainB64 = dpapiUnprotectBase64(encryptedKeyB64);
    if (!plainB64) return null;
    return Buffer.from(plainB64, 'base64');
  }
  return null;
}

function decryptChromeCookieValue(encryptedValue, aesKey) {
  if (!encryptedValue || !aesKey) return '';
  const buf = Buffer.isBuffer(encryptedValue) ? encryptedValue : Buffer.from(encryptedValue);
  if (buf.length < 31) return '';

  const prefix = buf.subarray(0, 3).toString('utf8');
  if (prefix !== 'v10' && prefix !== 'v11') {
    // Older DPAPI-only payload (rare on modern Chrome)
    if (process.platform === 'win32') {
      const b64 = buf.toString('base64');
      const plainB64 = dpapiUnprotectBase64(
        // fake "DPAPI" prefix path won't work for raw blobs — skip
        Buffer.concat([Buffer.from('DPAPI'), buf]).toString('base64'),
      );
      if (plainB64) return Buffer.from(plainB64, 'base64').toString('utf8');
    }
    return '';
  }

  const iv = buf.subarray(3, 15);
  const ciphertext = buf.subarray(15, buf.length - 16);
  const tag = buf.subarray(buf.length - 16);
  try {
    const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}

function copyCookiesDb(srcDb, tmpDb) {
  // Chrome often exclusive-locks Cookies. Prefer shared read + write, then copyFile fallbacks.
  try {
    writeFileSync(tmpDb, readFileSync(srcDb));
    return true;
  } catch { /**/ }
  try {
    copyFileSync(srcDb, tmpDb);
    return true;
  } catch { /**/ }
  const r = spawnSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `Copy-Item -LiteralPath '${srcDb.replace(/'/g, "''")}' -Destination '${tmpDb.replace(/'/g, "''")}' -Force`,
    ],
    { encoding: 'utf8', windowsHide: true, timeout: 10_000 },
  );
  return r.status === 0 && existsSync(tmpDb);
}

function queryPrivyTokenRows(dbPath) {
  // Python sqlite3 is the reliable Windows fallback (node:sqlite may be unavailable).
  const py = [
    'import sqlite3,sys,base64',
    'db=sys.argv[1]',
    'con=sqlite3.connect(f\"file:{db}?mode=ro\", uri=True)',
    'cur=con.execute(\"SELECT host_key, name, encrypted_value, expires_utc FROM cookies WHERE name=? ORDER BY expires_utc DESC\", (\"privy-token\",))',
    'for host,name,val,exp in cur.fetchall():',
    '  print(host+\"\\t\"+base64.b64encode(val).decode(\"ascii\")+\"\\t\"+str(exp or 0))',
    'con.close()',
  ].join('; ');

  let r = spawnSync('python', ['-c', py, dbPath], {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 15_000,
  });
  if (r.status !== 0) {
    r = spawnSync('py', ['-3', '-c', py, dbPath], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 15_000,
    });
  }
  if (r.status !== 0) {
    // Last resort: Node built-in sqlite when present
    try {
      const sqlite = require('node:sqlite');
      const db = new sqlite.DatabaseSync(dbPath, { readOnly: true });
      try {
        return db
          .prepare(
            `SELECT host_key, name, encrypted_value, expires_utc
             FROM cookies WHERE name = 'privy-token' ORDER BY expires_utc DESC`,
          )
          .all();
      } finally {
        db.close();
      }
    } catch {
      return [];
    }
  }

  return String(r.stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [host_key, b64, expires_utc] = line.split('\t');
      return {
        host_key,
        name: 'privy-token',
        encrypted_value: Buffer.from(b64, 'base64'),
        expires_utc: Number(expires_utc || 0),
      };
    });
}

function hostLooksLocal(host) {
  const h = String(host || '').toLowerCase();
  return (
    h.includes('localhost') ||
    h.includes('127.0.0.1') ||
    h.includes('[::1]') ||
    h.endsWith('5173') ||
    h.endsWith('5174') ||
    h.endsWith('5175')
  );
}

/**
 * @returns {string} normalized privy-token JWT or ''
 */
export function readPrivyTokenFromSystemChrome(env = process.env) {
  if (env.E2E_SKIP_SYSTEM_CHROME === '1') return '';
  if (process.platform !== 'win32') {
    // Non-Windows cookie crypto differs (Keychain/libsecret) — not implemented here.
    return '';
  }

  const userDataDir = chromeUserDataDir(env);
  if (!existsSync(userDataDir)) return '';

  const aesKey = getChromeAesKey(userDataDir);
  if (!aesKey) return '';

  const preferred = chromeProfileDir(env);
  const profiles = [
    preferred,
    ...listChromeProfilesWithCookies(userDataDir).filter((p) => p !== preferred),
  ];

  for (const profile of profiles) {
    const srcDb = cookiesDbPath(userDataDir, profile);
    if (!srcDb) continue;

    const tmpDir = mkdtempSync(join(tmpdir(), 'e2e-chrome-cookies-'));
    const tmpDb = join(tmpDir, 'Cookies');
    try {
      if (!copyCookiesDb(srcDb, tmpDb)) continue;
      for (const side of ['-journal', '-wal', '-shm']) {
        const p = srcDb + side;
        if (existsSync(p)) {
          try { copyCookiesDb(p, tmpDb + side); } catch { /**/ }
        }
      }

      const rows = queryPrivyTokenRows(tmpDb);
      if (!rows.length) continue;

      const ordered = [
        ...rows.filter((r) => hostLooksLocal(r.host_key)),
        ...rows.filter((r) => !hostLooksLocal(r.host_key)),
      ];

      for (const row of ordered) {
        const raw = decryptChromeCookieValue(row.encrypted_value, aesKey);
        if (raw && raw.length > 20 && raw.includes('.')) return raw;
      }
    } catch {
      // try next profile
    } finally {
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /**/ }
    }
  }

  return '';
}

// Create a stable fingerprint for logs (not the token).
export function chromeTokenFingerprint(token) {
  if (!token) return 'none';
  return createHash('sha256').update(token).digest('hex').slice(0, 8);
}
