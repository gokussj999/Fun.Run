#!/usr/bin/env node
/**
 * Extract privy-token from your REAL Chrome browser via CDP.
 * No Google login. No Playwright browser launch. Just reads cookies.
 *
 * ── How to use ──────────────────────────────────────────────────────
 *
 * Step 1 — Launch Chrome with remote debugging (do this ONCE):
 *   Windows:
 *     "C:\Program Files\Google\Chrome\Application\chrome.exe" ^
 *       --remote-debugging-port=9222 ^
 *       --user-data-dir=%TEMP%\chrome-e2e
 *
 *   macOS:
 *     /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
 *       --remote-debugging-port=9222 \
 *       --user-data-dir=/tmp/chrome-e2e
 *
 *   Important: if Chrome is already running, close all windows first —
 *   Chrome shares a single process and --remote-debugging-port only
 *   takes effect when the process starts fresh.
 *
 * Step 2 — Log in to Fun.Run in that Chrome window (Google auth works
 *   normally in a real browser — only fails in automated Playwright).
 *
 * Step 3 — Run this script:
 *   node scripts/extract-chrome-token.mjs
 *
 * Step 4 — The token is written to scripts/.e2e-cookies.json and
 *   PRIVY_TOKEN_COOKIE= is appended to platform/.env.
 *   Then run:  node scripts/devnet-e2e-certification.mjs
 *
 * ── Environment variables ────────────────────────────────────────────
 *   CHROME_REMOTE_DEBUGGING_PORT   CDP port (default: 9222)
 *   E2E_FRONTEND_URL               Frontend to check (default: http://localhost:5173)
 */

import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, join }                                           from 'node:path';
import { fileURLToPath }                                           from 'node:url';

const here         = dirname(fileURLToPath(import.meta.url));
const COOKIES_FILE = join(here, '.e2e-cookies.json');
const ENV_FILE     = join(here, '../.env');
const CDP_PORT     = process.env.CHROME_REMOTE_DEBUGGING_PORT || '9222';
const CDP_URL      = `http://localhost:${CDP_PORT}`;

function decodeJwt(value) {
  try { return decodeURIComponent(String(value).trim()); }
  catch { return String(value).trim(); }
}

/** Append or update PRIVY_TOKEN_COOKIE= in platform/.env */
function writeEnvVar(token) {
  const line = `PRIVY_TOKEN_COOKIE=${token}`;
  if (!existsSync(ENV_FILE)) {
    writeFileSync(ENV_FILE, line + '\n', 'utf8');
    return;
  }
  const content = readFileSync(ENV_FILE, 'utf8');
  if (/^PRIVY_TOKEN_COOKIE=/m.test(content)) {
    const updated = content.replace(/^PRIVY_TOKEN_COOKIE=.*/m, line);
    writeFileSync(ENV_FILE, updated, 'utf8');
  } else {
    appendFileSync(ENV_FILE, '\n' + line + '\n', 'utf8');
  }
}

async function main() {
  console.log(`[extract] Connecting to Chrome via CDP at ${CDP_URL} ...`);
  console.log('[extract] (Chrome must be running with --remote-debugging-port=' + CDP_PORT + ')');

  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    console.error(
      '[extract] playwright not installed.\n' +
      '  Run: cd platform && pnpm add -D playwright',
    );
    process.exit(1);
  }

  let browser;
  try {
    browser = await playwright.chromium.connectOverCDP(CDP_URL, { timeout: 5_000 });
  } catch (err) {
    console.error(
      `[extract] Could not connect to Chrome at ${CDP_URL}.\n\n` +
      'Make sure Chrome is running with --remote-debugging-port=' + CDP_PORT + '.\n' +
      'See the usage instructions at the top of this file.\n\n' +
      `Details: ${err.message}`,
    );
    process.exit(1);
  }

  console.log('[extract] Connected to Chrome. Reading cookies...');

  try {
    const contexts = browser.contexts();
    if (contexts.length === 0) {
      console.error('[extract] No browser contexts found — open Fun.Run in Chrome first.');
      process.exit(1);
    }

    for (const ctx of contexts) {
      const cookies = await ctx.cookies().catch(() => []);
      const hit = cookies.find((c) => c.name === 'privy-token' && c.value);

      if (hit?.value) {
        const token = decodeJwt(hit.value);
        writeFileSync(COOKIES_FILE, JSON.stringify([{ name: 'privy-token', value: token }], null, 2));
        writeEnvVar(token);

        console.log('\n[extract] ✓ privy-token extracted successfully!');
        console.log(`          Token length : ${token.length} chars`);
        console.log(`          Cookie file  : ${COOKIES_FILE}`);
        console.log(`          .env updated : PRIVY_TOKEN_COOKIE=<value>`);
        console.log('\nNext step:');
        console.log('  node scripts/devnet-e2e-certification.mjs');
        return;
      }
    }

    // Cookie not found — print all cookie names for debugging
    const allCookies = [];
    for (const ctx of contexts) {
      const cookies = await ctx.cookies().catch(() => []);
      allCookies.push(...cookies.map((c) => c.name));
    }
    const uniqueNames = [...new Set(allCookies)].sort();

    console.error(
      '[extract] Connected to Chrome but no privy-token cookie found.\n\n' +
      'Cookies found: ' + (uniqueNames.length ? uniqueNames.join(', ') : '(none)') + '\n\n' +
      'Make sure you are logged in to Fun.Run in that Chrome window.\n' +
      '  URL: ' + (process.env.E2E_FRONTEND_URL || 'http://localhost:5173') + '\n\n' +
      'If Fun.Run is on a different domain, Privy stores the cookie on that domain.\n' +
      'Navigate to the Fun.Run tab, complete Google login, then re-run this script.',
    );
    process.exit(1);
  } finally {
    // connectOverCDP — closing the Playwright handle does NOT close Chrome
    await browser.close().catch(() => {});
  }
}

main().catch((err) => {
  console.error('[extract] Unexpected error:', err.message);
  process.exit(1);
});
