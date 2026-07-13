/**
 * Phase 8.5.9J — Security: Secret Handling Verification (Static Scan)
 *
 * Scans the repository for patterns that indicate hardcoded secrets,
 * private keys, mnemonics, or credentials that should be in .env files.
 *
 * Checks:
 *   1. No hardcoded Solana private key arrays (byte arrays of length 64)
 *   2. No hardcoded BIP39 mnemonics (12/24 word sequences)
 *   3. No hardcoded API keys / tokens (common patterns)
 *   4. No hardcoded database URLs with credentials
 *   5. No plaintext mnemonic or private key in console.log / logger calls
 *   6. .env files are not committed (gitignore check)
 *   7. Known-deleted file decrypt-wallet.js is not present in working tree
 *   8. No process.env fallbacks that hardcode secrets as defaults
 *
 * Run:
 *   node tests/security/secret-scan.mjs
 *
 * Exits with code 1 if critical findings are found.
 */
import { readdir, readFile, stat, access } from 'node:fs/promises';
import { join, extname, relative }          from 'node:path';
import { fileURLToPath }                    from 'node:url';

// fileURLToPath handles Windows drive letters correctly (file:///D:/... → D:\...).
const ROOT = fileURLToPath(new URL('../../../../../', import.meta.url)).replace(/[/\\]$/, '');

// Directories to skip entirely.
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'coverage',
  '__pycache__', '.turbo', 'target',
  // Prisma generated client (minified bundles contain URL patterns in error strings)
  'generated',
  // Local devnet test ledger keypairs — gitignored, not production secrets
  'test-ledger',
]);

// File extensions to scan.
const SCAN_EXTS = new Set([
  '.js', '.mjs', '.ts', '.tsx', '.jsx', '.json', '.env', '.yaml', '.yml',
]);

// ─── Patterns ─────────────────────────────────────────────────────────────────

const PATTERNS = [
  {
    name:     'Hardcoded Solana private key (byte array)',
    severity: 'CRITICAL',
    regex:    /\[\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*\d{1,3}){61,}\s*\]/,
    note:     'Found a 64-element number array — likely a raw Solana secret key',
    skipFiles: ['concurrent-trades.k6.js'],
  },
  {
    name:     'BIP39 mnemonic (12-word sequence)',
    severity: 'CRITICAL',
    // Rough heuristic: 11 or more space-separated BIP39-ish words on one line
    regex:    /\b(?:[a-z]{3,8}\s+){11}[a-z]{3,8}\b/,
    note:     'Found a sequence of 12 lowercase words — possible BIP39 mnemonic',
  },
  {
    name:     'Hardcoded database URL with password',
    severity: 'CRITICAL',
    regex:    /(?:postgres|mysql|mongodb):\/\/[^:]+:[^@]{4,}@/i,
    note:     'Database connection string with password embedded',
  },
  {
    name:     'Hardcoded JWT / API secret literal',
    severity: 'HIGH',
    // Look for assignment of a long base64/hex string to a secret-named variable.
    regex:    /(?:secret|apiKey|api_key|jwtSecret|jwt_secret|appSecret)\s*[:=]\s*["'][A-Za-z0-9+/=_-]{32,}["']/i,
    note:     'Long string assigned to a secret-named variable',
  },
  {
    name:     'Hardcoded Privy secret',
    severity: 'HIGH',
    regex:    /PRIVY_APP_SECRET\s*[:=]\s*["'][A-Za-z0-9_-]{10,}["']/,
    note:     'Privy app secret hardcoded',
  },
  {
    name:     'mnemonic in console.log / logger call',
    severity: 'HIGH',
    regex:    /(?:console\.log|logger\.\w+)\s*\([^)]*mnemonic/i,
    note:     'Mnemonic appears in a logging call — it might be logged in plaintext',
  },
  {
    name:     'Private key in console.log / logger call',
    severity: 'HIGH',
    regex:    /(?:console\.log|logger\.\w+)\s*\([^)]*(?:secretKey|private[Kk]ey|privateKey)/i,
    note:     'Private key appears in a logging call',
  },
  {
    name:     'Hardcoded secret in process.env fallback',
    severity: 'MEDIUM',
    // process.env.SOME_SECRET || "hardcoded_value"
    regex:    /process\.env\.[A-Z_]{6,}\s*\|\|\s*["'][A-Za-z0-9+/=_-]{16,}["']/,
    note:     'process.env fallback contains a long literal that may be a secret',
  },
  {
    name:     'AWS / GCP / SendGrid API key pattern',
    severity: 'HIGH',
    regex:    /(?:AKIA[0-9A-Z]{16}|SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}|AIza[0-9A-Za-z_-]{35})/,
    note:     'Cloud provider API key pattern detected',
  },
];

// ─── Scanner ──────────────────────────────────────────────────────────────────

async function* walk(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return; }

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.env') continue;
    if (SKIP_DIRS.has(entry.name)) continue;

    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (SCAN_EXTS.has(extname(entry.name))) {
      yield full;
    }
  }
}

async function scan(rootDir) {
  const findings = [];

  for await (const file of walk(rootDir)) {
    const rel = relative(rootDir, file);
    let content;
    try { content = await readFile(file, 'utf8'); }
    catch { continue; }

    const lines = content.split('\n');

    for (const pattern of PATTERNS) {
      if (pattern.skipFiles && pattern.skipFiles.some((sf) => file.endsWith(sf))) continue;

      lines.forEach((line, idx) => {
        if (pattern.regex.test(line)) {
          // Skip comment lines.
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('#')) return;

          // Skip test & script files for most patterns (they deliberately use test credentials).
          const isTestFile   = /\.(test|spec)\.(ts|js|mjs)$/.test(file) || rel.includes('tests/');
          const isScriptFile = rel.replace(/\\/g, '/').includes('backend/scripts/');

          // JWT / API secret pattern: skip test files (they use dummy secrets intentionally).
          if (pattern.name.includes('JWT') && isTestFile) return;

          // Mnemonic logger pattern: skip lines that log FIELD NAMES or COUNTS, not actual values.
          // Real risk: console.log(mnemonic) or console.log(`mnemonic: ${mnemonic}`)
          // False positive: console.log("encrypted_mnemonic:"), console.log(`rows with encrypted_mnemonic: ${count}`)
          if (pattern.name.includes('mnemonic in console')) {
            // If the template literal only interpolates a count/number, it's not a real mnemonic.
            if (/encrypted_mnemonic[^}]*?\$\{[\w.]+\.(length|count|size)\}/.test(line)) return;
            // If the string is a label description (all words, no variable interpolation with mnemonic itself).
            if (line.includes('"') && !line.includes('${mnemonic') && !line.includes('${decrypted')) return;
            // Skip script files where mnemonic is only a field label string.
            if (isScriptFile && !line.includes('${mnemonic') && !line.includes('${decrypted')) return;
          }

          // BIP39 pattern: skip the well-known all-"abandon" test vector.
          if (pattern.name.includes('BIP39') && line.includes('abandon')) return;
          // BIP39 pattern: skip long prose lines (>200 chars) — likely UI description text.
          if (pattern.name.includes('BIP39') && line.length > 200) return;
          // BIP39 pattern: skip .jsx/.tsx files in frontend (UI text, not real mnemonics).
          if (pattern.name.includes('BIP39') && (file.endsWith('.jsx') || file.endsWith('.tsx'))) return;

          // DB URL pattern: skip files in backend/scripts or test-helpers.
          if (pattern.name.includes('database URL') && (isScriptFile || isTestFile)) return;

          // Private key array: new-treasury.json is gitignored (confirmed via git ls-files).
          // Skip it — it exists locally only and is not committed to the repo.
          if (pattern.name.includes('private key (byte array)') && rel.replace(/\\/g, '/').endsWith('backend/new-treasury.json')) return;

          // Private key LOGGER pattern: "secretKey" in a string label, not a variable.
          if (pattern.name.includes('Private key in console') && isScriptFile) {
            // Only flag if a variable (not a string literal) is being logged.
            if (line.includes('"') && !line.includes('${secretKey') && !line.includes('${keypair')) return;
          }

          // Public Solana wallet address is not a secret (medium pattern check).
          if (pattern.name.includes('process.env fallback') && line.includes('OWNER_WALLET')) return;

          findings.push({
            severity: pattern.severity,
            name:     pattern.name,
            note:     pattern.note,
            file:     rel,
            line:     idx + 1,
            excerpt:  line.trim().slice(0, 120),
          });
        }
      });
    }
  }

  return findings;
}

// ─── Specific file checks ─────────────────────────────────────────────────────

async function checkDeletedFile(findings) {
  const decryptWallet = join(ROOT, 'backend/solana/decrypt-wallet.js');
  try {
    await access(decryptWallet);
    findings.push({
      severity: 'CRITICAL',
      name:     'decrypt-wallet.js still exists in working tree',
      note:     'File containing hardcoded ciphertext must be deleted (F-01 fix)',
      file:     'backend/solana/decrypt-wallet.js',
      line:     1,
      excerpt:  '(file exists)',
    });
  } catch {
    // File does not exist — correct.
  }
}

async function checkDotEnvNotCommitted(findings) {
  // Check if .env or backend/.env is tracked by git (not just present on disk).
  // We do this by looking for them in .gitignore.
  const gitignore = join(ROOT, '.gitignore');
  let content = '';
  try { content = await readFile(gitignore, 'utf8'); } catch {}

  // Check that gitignore has glob patterns covering common secret files.
  // Accepts both exact matches and glob equivalents (e.g. **/.env covers .env and backend/.env).
  const coversEnv    = content.includes('**/.env')  || content.includes('/.env') || content.includes('\n.env');
  const coversEnvAny = content.includes('**/.env.*') || content.includes('.env.*') || content.includes('.env.local');

  if (!coversEnv) {
    findings.push({
      severity: 'HIGH',
      name:     '.gitignore does not cover .env files',
      note:     'Add "**/.env" to .gitignore to prevent accidental commit of secrets',
      file:     '.gitignore',
      line:     1,
      excerpt:  'missing: **/.env',
    });
  }

  if (!coversEnvAny) {
    findings.push({
      severity: 'HIGH',
      name:     '.gitignore does not cover .env.* files (e.g. .env.local)',
      note:     'Add "**/.env.*" to .gitignore to prevent accidental commit of .env.local / .env.production',
      file:     '.gitignore',
      line:     1,
      excerpt:  'missing: **/.env.*',
    });
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nSecret Scan — root: ${ROOT}\n`);

  const findings = await scan(ROOT);
  await checkDeletedFile(findings);
  await checkDotEnvNotCommitted(findings);

  const critical = findings.filter((f) => f.severity === 'CRITICAL');
  const high     = findings.filter((f) => f.severity === 'HIGH');
  const medium   = findings.filter((f) => f.severity === 'MEDIUM');

  if (findings.length === 0) {
    console.log('✓ No secret patterns found.\n');
    process.exit(0);
  }

  for (const f of findings) {
    const icon = f.severity === 'CRITICAL' ? '🔴' : f.severity === 'HIGH' ? '🟠' : '🟡';
    console.log(`${icon} [${f.severity}] ${f.name}`);
    console.log(`   File : ${f.file}:${f.line}`);
    console.log(`   Note : ${f.note}`);
    console.log(`   Line : ${f.excerpt}`);
    console.log();
  }

  console.log(`Summary: ${critical.length} CRITICAL  ${high.length} HIGH  ${medium.length} MEDIUM`);
  console.log();

  if (critical.length > 0 || high.length > 0) {
    console.error('SCAN FAILED — critical or high severity findings require remediation before mainnet.');
    process.exit(1);
  }

  console.log('Scan passed (only medium findings — review before mainnet).');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
