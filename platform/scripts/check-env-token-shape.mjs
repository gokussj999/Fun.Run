import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(here, '../.env'), 'utf8');
const idx = env.indexOf('PRIVY_TOKEN_COOKIE=');
if (idx < 0) {
  console.log('missing');
  process.exit(0);
}
const rest = env.slice(idx + 'PRIVY_TOKEN_COOKIE='.length);
const line = rest.split(/\r?\n/)[0];
const val = line.trim().replace(/^["']|["']$/g, '');
let decoded = val;
try { decoded = decodeURIComponent(val); } catch { /**/ }
const invalid = [...decoded].filter((ch) => !/[A-Za-z0-9._-]/.test(ch));
console.log(JSON.stringify({
  lineLen: line.length,
  valLen: val.length,
  decodedLen: decoded.length,
  newlineInLine: /\n|\r/.test(line),
  invalidCharCount: invalid.length,
  invalidCharCodes: [...new Set(invalid.map((c) => c.charCodeAt(0)))],
  percentEncoded: val.includes('%'),
}));
