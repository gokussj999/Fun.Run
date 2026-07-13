import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 8000 });
try {
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find((p) => /localhost:5173/.test(p.url())) || ctx.pages()[0];
  const info = await page.evaluate(async () => {
    const out = {
      textSample: (document.body?.innerText || '').replace(/\s+/g, ' ').slice(0, 300),
      lsKeys: [],
      idbDbs: [],
    };
    try {
      out.lsKeys = Object.keys(localStorage).map((k) => ({ k, len: String(localStorage.getItem(k) || '').length }));
    } catch {}
    try {
      if (indexedDB.databases) {
        const dbs = await indexedDB.databases();
        out.idbDbs = dbs.map((d) => d.name);
      }
    } catch {}
    return out;
  });
  console.log(JSON.stringify(info, null, 2));

  // Capture bearer from API traffic
  let bearerLen = 0;
  page.on('request', (req) => {
    const auth = req.headers()['authorization'] || '';
    const m = auth.match(/^Bearer\s+(eyJ\S+)/i);
    if (m) bearerLen = m[1].length;
  });
  await page.reload({ waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 5000));
  console.log('BEARER_CAPTURED_LEN=' + bearerLen);
  const cookies = await ctx.cookies();
  console.log('COOKIES=' + cookies.map((c) => c.name + '@' + c.domain).join(','));
} finally {
  await browser.close().catch(() => {});
}
