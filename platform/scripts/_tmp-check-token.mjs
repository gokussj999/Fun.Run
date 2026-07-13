import { existsSync, readFileSync } from 'fs';
import { isE2ETokenExpired, parseJwtExp } from './lib/resolve-e2e-auth.mjs';
const env = {};
if (existsSync('../.env') || existsSync('.env')) {
  const p = existsSync('.env') ? '.env' : '../.env';
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (!m) continue;
    env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}
const t = (env.PRIVY_TOKEN_COOKIE || '').replace(/^[<]+|[>]+$/g, '').trim();
console.log({
  hasPrivyEnv: !!t,
  len: t.length,
  expired: t ? isE2ETokenExpired(t) : null,
  exp: t && parseJwtExp(t) ? new Date(parseJwtExp(t) * 1000).toISOString() : null,
});
