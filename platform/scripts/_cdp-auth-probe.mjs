import { chromium } from 'playwright';

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

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 8000 });
try {
  const contexts = browser.contexts();
  console.log('CONTEXTS=' + contexts.length);
  for (const [i, ctx] of contexts.entries()) {
    const cookies = await ctx.cookies().catch(() => []);
    const privy = cookies.filter((c) => /privy/i.test(c.name));
    console.log('CTX' + i + '_COOKIES=' + cookies.length + ' PRIVY_NAMES=' + privy.map((c) => c.name).join(','));
    for (const c of privy) {
      const exp = c.name === 'privy-token' ? parseJwtExp(c.value) : null;
      console.log('  name=' + c.name + ' domain=' + c.domain + ' valueLen=' + String(c.value||'').length + (exp != null ? (' exp=' + exp + ' expired=' + isExpired(c.value)) : ''));
    }
    for (const p of ctx.pages()) console.log('  PAGE ' + p.url().slice(0, 140));
  }

  const ctx0 = contexts[0];
  let page = null;
  for (const ctx of contexts) {
    for (const p of ctx.pages()) {
      if (/localhost:5173|127\.0\.0\.1:5173/.test(p.url())) { page = p; break; }
    }
    if (page) break;
  }
  if (!page) {
    page = await ctx0.newPage();
    const resp = await page.goto('http://localhost:5173/?app=1', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch((e) => { console.log('GOTO_ERR=' + e.message); return null; });
    console.log('GOTO_STATUS=' + (resp ? resp.status() : 'null'));
  } else {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  }
  await new Promise((r) => setTimeout(r, 5000));
  console.log('ACTIVE_PAGE=' + page.url().slice(0, 140));

  const probe = await page.evaluate(async () => {
    const cookieHit = /(?:^|;\s*)privy-token=/.test(document.cookie);
    let accessLen = 0;
    let accessErr = '';
    try {
      const privy = window.__PRIVY__ || window.privy;
      if (privy?.getAccessToken) {
        const t = await privy.getAccessToken();
        accessLen = t ? String(t).length : 0;
      } else accessErr = 'no_getAccessToken';
    } catch (e) {
      accessErr = String(e && e.message ? e.message : e).slice(0, 80);
    }
    return { cookieHit, accessLen, accessErr, cookieLen: document.cookie.length };
  }).catch((e) => ({ err: String(e.message || e) }));
  console.log('PROBE=' + JSON.stringify(probe));

  const cookies2 = await ctx0.cookies().catch(() => []);
  const hit = cookies2.find((c) => c.name === 'privy-token' && c.value);
  if (hit) console.log('AFTER_NAV_TOKEN_PRESENT=true expired=' + isExpired(hit.value) + ' exp=' + parseJwtExp(hit.value));
  else console.log('AFTER_NAV_TOKEN_PRESENT=false');
} finally {
  await browser.close().catch(() => {});
}
