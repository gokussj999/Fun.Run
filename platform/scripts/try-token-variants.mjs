import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, '../services/trading/package.json'));
const { PrivyClient } = require('@privy-io/server-auth');

const envPath = join(here, '../.env');
for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([^#=]+)=(.*)$/);
  if (!m) continue;
  if (!process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
}

const raw = process.env.PRIVY_TOKEN_COOKIE?.trim() || '';
function norm(v) {
  let t = v.trim().replace(/^["']|["']$/g, '');
  t = t.replace(/^[<]+|[>]+$/g, '');
  try { t = decodeURIComponent(t); } catch { /**/ }
  return t.replace(/^[<]+|[>]+$/g, '');
}
const variants = [
  ['raw', raw],
  ['normalized', norm(raw)],
];

const privy = new PrivyClient(process.env.PRIVY_APP_ID, process.env.PRIVY_APP_SECRET);
for (const [name, token] of variants) {
  if (!token || token.length < 20) {
    console.log(`${name}:skip`);
    continue;
  }
  try {
    await privy.verifyAuthToken(token);
    console.log(`${name}:ok len=${token.length}`);
  } catch (e) {
    console.log(`${name}:fail len=${token.length} ${e.message}`);
  }
}
