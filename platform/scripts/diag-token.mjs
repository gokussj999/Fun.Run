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

let token = process.env.PRIVY_TOKEN_COOKIE?.trim() || '';
token = token.replace(/^["']|["']$/g, '');
try { token = decodeURIComponent(token); } catch { /**/ }

const parts = token.split('.');
let exp = null;
try {
  const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
  const header = JSON.parse(Buffer.from(parts[0].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
  exp = payload.exp;
  console.log(JSON.stringify({
    len: token.length,
    parts: parts.length,
    headerAlg: header.alg,
    headerKid: !!header.kid,
    sigLen: parts[2]?.length ?? 0,
    exp,
    expIso: exp ? new Date(exp * 1000).toISOString() : null,
    now: new Date().toISOString(),
    notExpired: exp ? Date.now() / 1000 < exp : false,
    audMatch: payload.aud === process.env.PRIVY_APP_ID,
    hasWhitespace: /\s/.test(token),
  }));
} catch {
  console.log(JSON.stringify({ len: token.length, parts: parts.length, payload: 'invalid' }));
}

try {
  const privy = new PrivyClient(process.env.PRIVY_APP_ID, process.env.PRIVY_APP_SECRET);
  await privy.verifyAuthToken(token);
  console.log('verify:ok');
} catch (e) {
  console.log('verify:fail', e.message);
}
