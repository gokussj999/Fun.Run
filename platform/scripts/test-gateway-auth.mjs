import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, '../.env');

function loadToken() {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*PRIVY_TOKEN_COOKIE=(.*)$/);
    if (!m) continue;
    let t = m[1].trim().replace(/^["']|["']$/g, '');
    try { t = decodeURIComponent(t); } catch { /**/ }
    return t;
  }
  return '';
}

const token = loadToken();
const res = await fetch('http://127.0.0.1:3000/api/v1/rewards/claim', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ kind: 'CREATOR' }),
});
const json = await res.json().catch(() => ({}));
console.log(JSON.stringify({
  status: res.status,
  code: json?.error?.code ?? json?.code ?? null,
  message: json?.error?.message ?? json?.message ?? null,
}));
