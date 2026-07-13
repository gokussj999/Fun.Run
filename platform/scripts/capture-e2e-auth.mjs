#!/usr/bin/env node
/**
 * E2E-only: capture privy-token and run devnet-e2e-certification.mjs.
 *
 * Auth modes (in priority order, no Google login ever attempted):
 *  1. PRIVY_TOKEN_COOKIE env / platform/.env  — use directly
 *  2. scripts/.e2e-cookies.json               — use existing file
 *  3. CDP: connect to real Chrome at CHROME_REMOTE_DEBUGGING_PORT (default 9222)
 *  4. Playwright persistent profile            — read existing session cookie only
 *
 * How to get a token without automated Google login:
 *  Option A (easiest): DevTools → Application → Cookies → privy-token → copy Value
 *    Add to platform/.env:  PRIVY_TOKEN_COOKIE=eyJ...
 *
 *  Option B (CDP): run Chrome with --remote-debugging-port=9222, log in normally, then run:
 *    node scripts/extract-chrome-token.mjs
 *    (or just run this script — it checks CDP automatically)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const COOKIES_FILE = join(here, '.e2e-cookies.json');
const PROFILE = join(here, '.e2e-browser-profile');
const FRONTEND = (process.env.E2E_FRONTEND_URL || 'http://localhost:5173/?app=1').trim();
const WAIT_MS = Number(process.env.E2E_AUTH_WAIT_MS || 120_000);

function loadEnv() {
  const envPath = join(here, '../.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    const val = m[2].trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

/** Try to get token from real Chrome via CDP — no Google login, no new browser. */
async function captureViaCDP() {
  const port = process.env.CHROME_REMOTE_DEBUGGING_PORT || '9222';
  const cdpUrl = `http://localhost:${port}`;
  let playwright;
  try { playwright = await import('playwright'); } catch { return ''; }

  let browser;
  try {
    browser = await playwright.chromium.connectOverCDP(cdpUrl, { timeout: 4_000 });
    console.log(`[capture] CDP connected to Chrome at ${cdpUrl}`);
  } catch {
    return ''; // Chrome not running with --remote-debugging-port — skip
  }

  try {
    for (const ctx of browser.contexts()) {
      const cookies = await ctx.cookies().catch(() => []);
      const hit = cookies.find((c) => c.name === 'privy-token' && c.value);
      if (hit?.value) {
        writeFileSync(COOKIES_FILE, JSON.stringify([{ name: 'privy-token', value: hit.value }]));
        console.log(`[capture] privy-token captured via CDP (len=${hit.value.length})`);
        return hit.value;
      }
    }
    console.log('[capture] CDP connected but no privy-token found — are you logged in to Fun.Run in that Chrome window?');
    return '';
  } finally {
    await browser.close().catch(() => {});
  }
}

/** Try to read token from Playwright persistent profile — no Google login. */
async function captureViaProfile() {
  const { chromium } = await import('playwright');
  const launchOpts = { headless: false, viewport: { width: 1280, height: 800 } };
  if (process.platform === 'win32') launchOpts.channel = 'chrome';

  let context;
  try {
    context = await chromium.launchPersistentContext(PROFILE, launchOpts);
  } catch {
    if (launchOpts.channel) {
      delete launchOpts.channel;
      context = await chromium.launchPersistentContext(PROFILE, launchOpts);
    } else { throw new Error('Playwright browser launch failed'); }
  }

  try {
    // First: check existing profile cookies without any navigation
    const existing = await context.cookies().catch(() => []);
    const existingHit = existing.find((c) => c.name === 'privy-token' && c.value);
    if (existingHit?.value) {
      writeFileSync(COOKIES_FILE, JSON.stringify([{ name: 'privy-token', value: existingHit.value }]));
      console.log(`[capture] privy-token found in persistent profile (len=${existingHit.value.length})`);
      return existingHit.value;
    }

    // Navigate to check — still no Google login prompted here
    const page = context.pages()[0] ?? (await context.newPage());
    let bearer = '';

    page.on('request', (req) => {
      const auth = req.headers()?.authorization || '';
      const m = String(auth).match(/^Bearer\s+(eyJ\S+)$/i);
      if (m?.[1]) bearer = m[1];
    });

    console.log(`[capture] Opening ${FRONTEND} in persistent profile — checking for existing session`);
    await page.goto(FRONTEND, { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => {});

    const deadline = Date.now() + WAIT_MS;
    while (Date.now() < deadline) {
      if (bearer) {
        writeFileSync(COOKIES_FILE, JSON.stringify([{ name: 'privy-token', value: bearer }]));
        console.log(`[capture] privy-token captured via network interception (len=${bearer.length})`);
        return bearer;
      }

      const cookies = await context.cookies(FRONTEND).catch(() => []);
      const hit = cookies.find((c) => c.name === 'privy-token' && c.value);
      if (hit?.value) {
        writeFileSync(COOKIES_FILE, JSON.stringify([{ name: 'privy-token', value: hit.value }]));
        console.log(`[capture] privy-token captured via profile cookie (len=${hit.value.length})`);
        return hit.value;
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    return '';
  } finally {
    await context.close();
  }
}

async function capture() {
  loadEnv();

  // 1. Direct env / .env file
  const direct = process.env.PRIVY_TOKEN_COOKIE?.trim();
  if (direct) {
    writeFileSync(COOKIES_FILE, JSON.stringify([{ name: 'privy-token', value: direct }]));
    console.log(`[capture] Using PRIVY_TOKEN_COOKIE from env (len=${direct.length})`);
    return direct;
  }

  // 2. Existing cookie file
  if (existsSync(COOKIES_FILE)) {
    try {
      const data = JSON.parse(readFileSync(COOKIES_FILE, 'utf8'));
      const list = Array.isArray(data) ? data : (data?.cookies ?? []);
      const hit = list.find((c) => c?.name === 'privy-token' && c?.value);
      if (hit?.value) {
        console.log(`[capture] Using existing .e2e-cookies.json (len=${hit.value.length})`);
        return hit.value;
      }
    } catch { /**/ }
  }

  // 3. CDP — real Chrome, no Google login
  const fromCDP = await captureViaCDP();
  if (fromCDP) return fromCDP;

  // 4. Playwright persistent profile — reads existing session, no Google login
  console.log('[capture] CDP not available. Trying persistent Playwright profile (no Google login)...');
  const fromProfile = await captureViaProfile();
  if (fromProfile) return fromProfile;

  throw new Error(
    '[capture] Could not obtain privy-token.\n\n' +
    'Option A (easiest):\n' +
    '  1. Open Chrome DevTools on Fun.Run → Application → Cookies → privy-token\n' +
    '  2. Copy the Value\n' +
    '  3. Add to platform/.env:  PRIVY_TOKEN_COOKIE=<value>\n' +
    '  4. Re-run this script\n\n' +
    'Option B (CDP — reuses existing Chrome session):\n' +
    '  1. Close all Chrome windows\n' +
    '  2. Launch:  chrome.exe --remote-debugging-port=9222\n' +
    '  3. Log in to Fun.Run normally in that window\n' +
    '  4. Re-run this script',
  );
}

const token = await capture().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

if (token && token.length > 20) {
  const run = spawnSync('node', ['scripts/devnet-e2e-certification.mjs'], {
    cwd: join(here, '..'),
    stdio: 'inherit',
    // E2E_SKIP_CDP=0 so certification can try CDP too if cookie file expires
    env: { ...process.env, E2E_USE_BROWSER: '0', E2E_SKIP_CDP: '0' },
  });
  process.exit(run.status ?? 1);
}

console.error('[capture] Token too short or empty — check the error above.');
process.exit(1);
