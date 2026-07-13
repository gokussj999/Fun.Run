import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function parseJwtExp(token) {
  const parts = String(token).split('.');
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch { return null; }
}
function isExpired(token, skew = 30) {
  const exp = parseJwtExp(token);
  if (!exp) return false;
  return Date.now() / 1000 >= exp - skew;
}

const here = dirname(fileURLToPath(import.meta.url));
const cookieFile = join(here, '.e2e-cookies.json');
const deadline = Date.now() + 120_000;
console.log('Polling CDP for privy-token up to 120s (login in open Chrome if needed)...');

while (Date.now() < deadline) {
  let browser;
  try {
    browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 5000 });
    let token = '';
    for (const ctx of browser.contexts()) {
      const cookies = await ctx.cookies().catch(() => []);
      const hit = cookies.find((c) => c.name === 'privy-token' && c.value);
      if (hit?.value) { token = hit.value; break; }
      for (const page of ctx.pages()) {
        if (!/localhost:5173|127\.0\.0\.1:5173/.test(page.url())) continue;
        const fromPage = await page.evaluate(async () => {
          const m = document.cookie.match(/(?:^|;\s*)privy-token=([^;]+)/);
          if (m?.[1]) return m[1];
          try {
            const privy = window.__PRIVY__ || window.privy;
            if (privy?.getAccessToken) return (await privy.getAccessToken()) || '';
          } catch {}
          return '';
        }).catch(() => '');
        if (fromPage) { token = fromPage; break; }
      }
      if (token) break;
    }
    await browser.close().catch(() => {});
    if (token && !isExpired(token)) {
      writeFileSync(cookieFile, JSON.stringify([{ name: 'privy-token', value: token }]));
      console.log('TOKEN_FOUND=true exp=' + parseJwtExp(token));
      process.exit(0);
    }
    console.log('WAITING remaining_s=' + Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
  } catch (e) {
    console.log('CDP_ERR=' + String(e.message || e).slice(0, 100));
  }
  await new Promise((r) => setTimeout(r, 5000));
}
console.log('TOKEN_FOUND=false');
process.exit(2);
