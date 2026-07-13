import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 8000 });
try {
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find((p) => /localhost:5173/.test(p.url())) || (await ctx.newPage());
  if (!/localhost:5173/.test(page.url())) {
    await page.goto('http://localhost:5173/?app=1', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  }
  for (let i = 0; i < 12; i++) {
    const probe = await page.evaluate(async () => {
      const keys = Object.keys(window).filter((k) => /privy/i.test(k));
      const cookieHit = /(?:^|;\s*)privy-token=/.test(document.cookie);
      let accessLen = 0;
      let authed = false;
      try {
        const el = document.body?.innerText?.slice(0, 200) || '';
        authed = /log\s*out|wallet|portfolio|balance/i.test(el);
      } catch {}
      try {
        const privy = window.__PRIVY__ || window.privy;
        if (privy?.getAccessToken) {
          const t = await privy.getAccessToken();
          accessLen = t ? String(t).length : 0;
        }
      } catch {}
      return { cookieHit, accessLen, keys, authed, href: location.href };
    }).catch((e) => ({ err: String(e.message || e) }));
    const cookies = await ctx.cookies();
    const privyNames = cookies.filter((c) => /privy/i.test(c.name)).map((c) => c.name);
    console.log('T' + i + ' ' + JSON.stringify({ ...probe, privyNames, cookieCount: cookies.length }));
    if (probe.accessLen > 0 || probe.cookieHit || privyNames.includes('privy-token')) break;
    await new Promise((r) => setTimeout(r, 2500));
  }
} finally {
  await browser.close().catch(() => {});
}
