#!/usr/bin/env node
/**
 * E2E-only CDP diagnostic — reports the first failing step only.
 * Does not print token values.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isE2ETokenExpired, parseJwtExp } from './lib/resolve-e2e-auth.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const CDP_HOST = process.env.CHROME_REMOTE_DEBUGGING_HOST || '127.0.0.1';
const CDP_PORT = process.env.CHROME_REMOTE_DEBUGGING_PORT || '9222';
const CDP_URL = `http://${CDP_HOST}:${CDP_PORT}`;
const FRONTEND_URL = (process.env.E2E_FRONTEND_URL || 'http://localhost:5173/?app=1').trim();
let frontendOrigin = '';
try { frontendOrigin = new URL(FRONTEND_URL).origin; } catch { /**/ }

function fail(step, detail) {
  console.log(`FAIL step ${step}: ${detail}`);
  process.exit(1);
}

function pass(step, detail = 'ok') {
  console.log(`PASS step ${step}: ${detail}`);
}

async function main() {
  console.log('CDP auth diagnostic');
  console.log({ CDP_URL, FRONTEND_URL, frontendOrigin });

  // Step 1 — Connect to Chrome
  let playwright;
  try {
    playwright = await import('playwright');
  } catch (err) {
    fail(1, `playwright import failed — ${err.message}`);
  }

  let browser;
  try {
    browser = await playwright.chromium.connectOverCDP(CDP_URL, { timeout: 8_000 });
    pass(1, `connected (${browser.contexts().length} context(s))`);
  } catch (err) {
    fail(1, `connectOverCDP failed — ${err.message}`);
  }

  try {
    // Step 2 — List targets
    let targets = [];
    try {
      const res = await fetch(`${CDP_URL}/json/list`, { signal: AbortSignal.timeout(5_000) });
      if (!res.ok) fail(2, `GET /json/list returned HTTP ${res.status}`);
      targets = await res.json();
      const summary = targets.map((t) => `${t.type}:${t.title || '(no title)'}:${t.url || '(no url)'}`).join(' | ');
      pass(2, `${targets.length} target(s) — ${summary.slice(0, 500)}`);
    } catch (err) {
      fail(2, `/json/list failed — ${err.message}`);
    }

    // Step 3 — Attach to Fun.Run tab
    let page = null;
    let attachDetail = '';
    try {
      const contexts = browser.contexts();
      if (contexts.length === 0) fail(3, 'no browser contexts from Playwright CDP attachment');

      const pageCandidates = [];
      for (const ctx of contexts) {
        for (const p of ctx.pages()) {
          pageCandidates.push(p);
        }
      }

      const funRunPage = pageCandidates.find((p) => {
        const url = p.url();
        return (
          (frontendOrigin && url.startsWith(frontendOrigin)) ||
          url.includes('localhost:5173') ||
          url.includes('localhost:5174') ||
          url.includes('localhost:5175') ||
          url.includes('fun.run') ||
          url.includes('Fun.Run')
        );
      });

      page = funRunPage || pageCandidates[0] || null;
      if (!page) {
        const targetPages = targets.filter((t) => t.type === 'page');
        fail(3, `no attachable page — Playwright pages=${pageCandidates.length}, CDP page targets=${targetPages.length}`);
      }

      attachDetail = `url=${page.url()} title=${await page.title().catch(() => '(unknown)')}`;
      pass(3, attachDetail);
    } catch (err) {
      fail(3, `attach to Fun.Run tab failed — ${err.message}`);
    }

    // Step 4 — Read cookies
    let privyCookieFound = false;
    let privyCookieExpired = null;
    try {
      const ctx = page.context();
      const allCookies = await ctx.cookies();
      const names = allCookies.map((c) => c.name).sort();
      const hit = allCookies.find((c) => c.name === 'privy-token' && c.value);
      privyCookieFound = Boolean(hit?.value);
      if (hit?.value) {
        const exp = parseJwtExp(hit.value);
        privyCookieExpired = isE2ETokenExpired(hit.value);
        pass(4, `privy-token present (len=${hit.value.length}, exp=${exp ?? 'unknown'}, expired=${privyCookieExpired}); cookie names: ${names.join(', ')}`);
      } else {
        fail(4, `privy-token missing; cookie names: ${names.join(', ') || '(none)'}`);
      }
    } catch (err) {
      fail(4, `read cookies failed — ${err.message}`);
    }

    // Step 5 — Execute Runtime.evaluate
    let evalOk = false;
    let evalDetail = '';
    try {
      const result = await page.evaluate(() => ({
        href: location.href,
        hasPrivyGlobal: Boolean(window.__PRIVY__ || window.privy),
        cookieHasPrivy: /(?:^|;\s*)privy-token=/.test(document.cookie),
      }));
      evalOk = true;
      evalDetail = JSON.stringify(result);
      pass(5, evalDetail);
    } catch (err) {
      fail(5, `Runtime.evaluate failed — ${err.message}`);
    }

    // Step 6 — Call privy.getAccessToken()
    try {
      const tokenResult = await page.evaluate(async () => {
        try {
          const privy = window.__PRIVY__ || window.privy;
          if (!privy?.getAccessToken) return { ok: false, reason: 'getAccessToken unavailable' };
          const token = await privy.getAccessToken();
          if (!token) return { ok: false, reason: 'getAccessToken returned empty' };
          return { ok: true, len: String(token).length };
        } catch (err) {
          return { ok: false, reason: err?.message || 'getAccessToken threw' };
        }
      });

      if (!tokenResult?.ok) {
        fail(6, tokenResult?.reason || 'getAccessToken failed');
      }

      pass(6, `getAccessToken returned token (len=${tokenResult.len}, cookieWasExpired=${privyCookieExpired})`);
    } catch (err) {
      fail(6, `privy.getAccessToken() failed — ${err.message}`);
    }

    console.log('ALL STEPS PASSED');
  } finally {
    await browser.close().catch(() => {});
  }
}

main().catch((err) => {
  console.error('Unexpected diagnostic error:', err.message);
  process.exit(1);
});
