/**
 * E2E-only: discover which Chrome profile has a localhost privy-token cookie
 * (name/host only — does not decrypt values).
 */
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

export function chromeUserDataDir(env = process.env) {
  if (env.CHROME_USER_DATA_DIR?.trim()) return env.CHROME_USER_DATA_DIR.trim();
  return join(env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data');
}

export function findChromeProfilesWithPrivyToken(env = process.env) {
  const userData = chromeUserDataDir(env);
  if (!existsSync(userData)) return [];

  const profiles = readdirSync(userData).filter((name) => {
    try {
      if (!statSync(join(userData, name)).isDirectory()) return false;
    } catch { return false; }
    return name === 'Default' || name.startsWith('Profile ');
  });

  const tmp = mkdtempSync(join(tmpdir(), 'e2e-privy-scan-'));
  const pyPath = join(tmp, 'q.py');
  writeFileSync(
    pyPath,
    `
import sqlite3, sys
con = sqlite3.connect(f"file:{sys.argv[1]}?mode=ro", uri=True)
n = con.execute(
  "SELECT COUNT(*) FROM cookies WHERE name='privy-token' AND (host_key LIKE '%localhost%' OR host_key LIKE '%127.0.0.1%')"
).fetchone()[0]
print(int(n or 0))
con.close()
`,
  );

  const hits = [];
  try {
    for (const profile of profiles) {
      const modern = join(userData, profile, 'Network', 'Cookies');
      const legacy = join(userData, profile, 'Cookies');
      const src = existsSync(modern) ? modern : existsSync(legacy) ? legacy : '';
      if (!src) continue;
      const db = join(tmp, profile.replace(/\s+/g, '_') + '.db');
      try {
        writeFileSync(db, readFileSync(src));
      } catch {
        continue;
      }
      let r = spawnSync('python', [pyPath, db], { encoding: 'utf8', windowsHide: true, timeout: 10_000 });
      if (r.status !== 0) {
        r = spawnSync('py', ['-3', pyPath, db], { encoding: 'utf8', windowsHide: true, timeout: 10_000 });
      }
      const count = Number(String(r.stdout || '').trim() || '0');
      if (count > 0) hits.push(profile);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  // Prefer last_used when it is a hit
  try {
    const ls = JSON.parse(readFileSync(join(userData, 'Local State'), 'utf8'));
    const last = ls?.profile?.last_used;
    if (last && hits.includes(last)) {
      return [last, ...hits.filter((h) => h !== last)];
    }
  } catch { /**/ }

  return hits;
}
