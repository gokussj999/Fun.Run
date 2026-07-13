/**
 * E2E-only auth resolver — maps Privy browser session material to Bearer JWT.
 * Does not change production auth; only used by certification scripts.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_COOKIES_FILE = join(here, '../.e2e-cookies.json');
const DEFAULT_TOKEN_TMP = join(here, '../.privy-token-cookie.tmp');
const DEFAULT_BROWSER_PROFILE = join(here, '../.e2e-browser-profile');

function normalizePrivyToken(value) {
  let token = String(value).trim().replace(/^["']|["']$/g, '');
  token = token.replace(/^[<]+|[>]+$/g, '');
  try { token = decodeURIComponent(token); } catch { /**/ }
  token = token.replace(/^[<]+|[>]+$/g, '');
  return token;
}

function extractPrivyTokenFromCookieHeader(header) {
  const m = String(header).match(/(?:^|;\s*)privy-token=([^;]+)/);
  return m?.[1] ? normalizePrivyToken(m[1]) : '';
}

function persistE2EAuthToken(token) {
  const normalized = normalizePrivyToken(token);
  if (!normalized) return;
  try {
    writeFileSync(DEFAULT_COOKIES_FILE, JSON.stringify([{ name: 'privy-token', value: normalized }]));
  } catch { /**/ }
}

/** @returns {number|null} JWT exp claim (unix seconds) */
export function parseJwtExp(token) {
  const parts = String(token).split('.');
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

/** True when token is missing, unreadable, or within skewSeconds of expiry. */
export function isE2ETokenExpired(token, skewSeconds = 30) {
  if (!token) return true;
  const exp = parseJwtExp(token);
  if (!exp) return false;
  return Date.now() / 1000 >= exp - skewSeconds;
}

let sessionToken = '';

export function getE2EAuthToken() {
  return sessionToken;
}

export function setE2EAuthToken(token) {
  sessionToken = normalizePrivyToken(token);
  if (sessionToken) persistE2EAuthToken(sessionToken);
  return sessionToken;
}

function extractPrivyTokenFromCookiesJson(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return '';
  }

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.cookies)
      ? data.cookies
      : [];

  const hit = list.find((c) => c?.name === 'privy-token' && c?.value);
  return hit?.value ? normalizePrivyToken(hit.value) : '';
}

async function readTokenFromPlaywrightProfile(frontendUrl, profileDir = DEFAULT_BROWSER_PROFILE) {
  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    throw new Error(
      'E2E_USE_BROWSER=1 requires playwright — run: pnpm add -D playwright -w (platform root)',
    );
  }

  const { chromium } = playwright;
  const launchOpts = {
    headless: false,
    viewport: { width: 1280, height: 800 },
  };
  // Prefer system Chrome/Edge — avoids ~180MB Playwright browser download
  if (process.platform === 'win32') {
    launchOpts.channel = 'chrome';
  }

  let context;
  try {
    context = await chromium.launchPersistentContext(profileDir, launchOpts);
  } catch {
    if (launchOpts.channel) {
      delete launchOpts.channel;
      context = await chromium.launchPersistentContext(profileDir, launchOpts);
    } else {
      throw new Error('Playwright browser launch failed — install Chrome or run: npx playwright install chromium');
    }
  }

  try {
    // Step 1: try to read existing cookies from the profile WITHOUT navigating.
    // If the user was previously logged in, the cookie is already stored in the profile.
    const existingCookies = await context.cookies().catch(() => []);
    const existingHit = existingCookies.find((c) => c.name === 'privy-token' && c.value);
    if (existingHit?.value) {
      const token = normalizePrivyToken(existingHit.value);
      try { writeFileSync(DEFAULT_COOKIES_FILE, JSON.stringify([{ name: 'privy-token', value: token }])); } catch { /**/ }
      return token;
    }

    // Step 2: navigate to the frontend and read the cookie — DO NOT attempt Google login.
    // If the user is not logged in, we wait up to 120 s for them to log in
    // in a SEPARATE real Chrome window (not this automated one).
    const page = context.pages()[0] ?? (await context.newPage());
    let captured = '';

    page.on('request', (req) => {
      const auth = req.headers()?.authorization || req.headers()?.Authorization || '';
      const m = String(auth).match(/^Bearer\s+(eyJ\S+)$/i);
      if (m?.[1]) captured = m[1];
    });

    // Navigate only to check if already logged in — no Google login attempted here.
    await page.goto(frontendUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => {});

    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      if (captured) {
        try { writeFileSync(DEFAULT_COOKIES_FILE, JSON.stringify([{ name: 'privy-token', value: captured }])); } catch { /**/ }
        return captured;
      }

      const cookies = await context.cookies(frontendUrl).catch(() => []);
      const hit = cookies.find((c) => c.name === 'privy-token' && c.value);
      if (hit?.value) {
        const token = normalizePrivyToken(hit.value);
        try { writeFileSync(DEFAULT_COOKIES_FILE, JSON.stringify([{ name: 'privy-token', value: token }])); } catch { /**/ }
        return token;
      }

      const fromPage = await page.evaluate(async () => {
        const m = document.cookie.match(/(?:^|;\s*)privy-token=([^;]+)/);
        if (m?.[1]) return m[1];
        try {
          const privy = window.__PRIVY__ || window.privy;
          if (privy?.getAccessToken) return await privy.getAccessToken();
        } catch { /**/ }
        return '';
      }).catch(() => '');
      if (fromPage) {
        const token = normalizePrivyToken(fromPage);
        try { writeFileSync(DEFAULT_COOKIES_FILE, JSON.stringify([{ name: 'privy-token', value: token }])); } catch { /**/ }
        return token;
      }

      await new Promise((r) => setTimeout(r, 3000));
    }

    throw new Error(
      'No privy-token found in persistent profile within 120 s.\n' +
      'Launch Chrome with --remote-debugging-port=9222, log in to Fun.Run, then re-run E2E.',
    );
  } finally {
    await context.close();
  }
}

async function readTokenFromBrowserContexts(browser) {
  for (const ctx of browser.contexts()) {
    const cookies = await ctx.cookies().catch(() => []);
    const hit = cookies.find((c) => c.name === 'privy-token' && c.value);
    if (hit?.value) return normalizePrivyToken(hit.value);
  }
  return '';
}

async function readTokenFromBrowserPages(browser, frontendOrigin, { reload = false } = {}) {
  let capturedBearer = '';

  for (const ctx of browser.contexts()) {
    for (const page of ctx.pages()) {
      const url = page.url();
      if (frontendOrigin && !url.startsWith(frontendOrigin) && !url.includes('localhost')) continue;

      if (reload) {
        page.on('request', (req) => {
          const auth = req.headers()?.authorization || req.headers()?.Authorization || '';
          const m = String(auth).match(/^Bearer\s+(eyJ\S+)$/i);
          if (m?.[1]) capturedBearer = m[1];
        });
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => {});
        await new Promise((r) => setTimeout(r, 3000));
        if (capturedBearer) return normalizePrivyToken(capturedBearer);
      }

      const fromPage = await page.evaluate(async () => {
        const m = document.cookie.match(/(?:^|;\s*)privy-token=([^;]+)/);
        if (m?.[1]) return m[1];
        try {
          const privy = window.__PRIVY__ || window.privy;
          if (privy?.getAccessToken) return await privy.getAccessToken();
        } catch { /**/ }
        return '';
      }).catch(() => '');

      if (fromPage) return normalizePrivyToken(fromPage);
    }
  }
  return '';
}

/**
 * Try to extract privy-token from a real Chrome instance running with
 * --remote-debugging-port. Does NOT launch a new browser or attempt Google login.
 *
 * @param {string} cdpUrl  e.g. 'http://localhost:9222'
 */
async function readTokenViaCDP(cdpUrl) {
  let playwright;
  try { playwright = await import('playwright'); } catch { return ''; }

  let browser;
  try {
    browser = await playwright.chromium.connectOverCDP(cdpUrl, { timeout: 4_000 });
  } catch {
    return ''; // Chrome not running with CDP — silently skip
  }

  try {
    const token = await readTokenFromBrowserContexts(browser);
    if (token) {
      persistE2EAuthToken(token);
      return token;
    }
    return '';
  } finally {
    // connectOverCDP — close the Playwright handle only, leaves Chrome running
    await browser.close().catch(() => {});
  }
}

/**
 * Reconnect to authenticated Chrome via CDP and read the latest privy-token.
 * Polls briefly so Privy can rotate an expired cookie in-session.
 */
export async function refreshE2EAuthTokenViaCDP(env = process.env) {
  if (env.E2E_SKIP_CDP === '1') return '';

  let playwright;
  try { playwright = await import('playwright'); } catch { return ''; }

  const cdpPort = env.CHROME_REMOTE_DEBUGGING_PORT || '9222';
  const cdpHost = env.CHROME_REMOTE_DEBUGGING_HOST || '127.0.0.1';
  const cdpUrl = `http://${cdpHost}:${cdpPort}`;
  const frontendUrl = (env.E2E_FRONTEND_URL || 'http://localhost:5173/?app=1').trim();
  let frontendOrigin = '';
  try { frontendOrigin = new URL(frontendUrl).origin; } catch { /**/ }

  let browser;
  try {
    browser = await playwright.chromium.connectOverCDP(cdpUrl, { timeout: 8_000 });
  } catch {
    return '';
  }

  try {
    let token = await readTokenFromBrowserContexts(browser);
    if (token && !isE2ETokenExpired(token)) {
      persistE2EAuthToken(token);
      return token;
    }

    token = await readTokenFromBrowserPages(browser, frontendOrigin, { reload: true });
    if (token && !isE2ETokenExpired(token)) {
      persistE2EAuthToken(token);
      return token;
    }

    const deadline = Date.now() + Number(env.E2E_TOKEN_REFRESH_WAIT_MS || 45_000);
    while (Date.now() < deadline) {
      token = await readTokenFromBrowserContexts(browser);
      if (!token) token = await readTokenFromBrowserPages(browser, frontendOrigin);
      if (token && !isE2ETokenExpired(token)) {
        persistE2EAuthToken(token);
        return token;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (token) {
      persistE2EAuthToken(token);
      return token;
    }
    return '';
  } finally {
    await browser.close().catch(() => {});
  }
}

/**
 * Ensure the in-memory E2E token is present and not expired.
 * Reuses the user's normal Chrome Fun.Run session (no Google login in automation).
 *
 * Chrome v20 cookies cannot be decrypted from disk; we attach to the real Chrome
 * profile via CDP cookie read only (session already logged in).
 */
export async function ensureFreshE2EAuthToken(env = process.env, { force = false } = {}) {
  if (!sessionToken) {
    sessionToken = await resolveE2EAuthToken(env);
    if (sessionToken) persistE2EAuthToken(sessionToken);
  }

  if (force || isE2ETokenExpired(sessionToken)) {
    const label = force ? 'forcing' : 'expired';
    console.log(`[e2e-auth] Token ${label} — reusing normal Chrome session (no automation login)...`);

    let fresh = '';

    // 1) Best-effort disk read (works for older v10 cookies only)
    try {
      const { readPrivyTokenFromSystemChrome } = await import('./read-chrome-privy-token.mjs');
      fresh = normalizePrivyToken(readPrivyTokenFromSystemChrome(env) || '');
    } catch { /**/ }

    // 2) CDP cookie read against the real Chrome profile that already has privy-token
    if (!fresh || isE2ETokenExpired(fresh)) {
      fresh = normalizePrivyToken(await refreshFromNormalChromeSession(env) || '');
    }

    if (!fresh || isE2ETokenExpired(fresh)) {
      throw new Error(
        'E2E token refresh failed.\n' +
        'Close ALL Chrome windows once, then re-run. The harness will reopen your ' +
        'existing Chrome profile with remote debugging to read privy-token ' +
        '(no Google login — session cookies stay on disk).\n' +
        'Or start Chrome yourself:\n' +
        '  chrome.exe --remote-debugging-port=9222 --profile-directory="<profile-with-funrun>"',
      );
    }

    sessionToken = fresh;
    persistE2EAuthToken(sessionToken);
    console.log('[e2e-auth] Token refreshed from normal Chrome session');
  }

  return sessionToken;
}

/**
 * Attach to the user's real Chrome profile and read privy-token via CDP.
 * Does not perform Google login. May relaunch Chrome with --remote-debugging-port
 * using the profile that already stores localhost privy-token.
 */
async function refreshFromNormalChromeSession(env = process.env) {
  const cdpPort = env.CHROME_REMOTE_DEBUGGING_PORT || '9222';
  const cdpHost = env.CHROME_REMOTE_DEBUGGING_HOST || '127.0.0.1';
  const cdpUrl = `http://${cdpHost}:${cdpPort}`;

  let token = await readTokenViaCDP(cdpUrl);
  if (token && !isE2ETokenExpired(token)) return token;

  // One short page/cookie refresh — do NOT loop 45s polls (hangs certification)
  token = await refreshE2EAuthTokenViaCDP({
    ...env,
    E2E_SKIP_CDP: '0',
    E2E_TOKEN_REFRESH_WAIT_MS: env.E2E_TOKEN_REFRESH_WAIT_MS || '8000',
  });
  if (token && !isE2ETokenExpired(token)) return token;

  // Discover which profile already has Fun.Run auth cookies
  let profiles = [];
  try {
    const { findChromeProfilesWithPrivyToken } = await import('./find-chrome-privy-profile.mjs');
    profiles = findChromeProfilesWithPrivyToken(env);
  } catch { /**/ }

  const profile = env.CHROME_PROFILE_DIRECTORY?.trim() || profiles[0] || '';
  if (!profile) {
    console.log('[e2e-auth] No Chrome profile with localhost privy-token found');
    return '';
  }

  console.log(`[e2e-auth] Using Chrome profile "${profile}" (existing Fun.Run session)`);

  const launched = await launchChromeProfileWithDebugging(env, profile, cdpPort);
  if (!launched) return '';

  for (let i = 0; i < 10; i++) {
    token = await readTokenViaCDP(cdpUrl);
    if (token && !isE2ETokenExpired(token)) return token;
    await new Promise((r) => setTimeout(r, 1000));
  }

  return '';
}

async function launchChromeProfileWithDebugging(env, profile, cdpPort) {
  if (env.E2E_SKIP_CHROME_LAUNCH === '1') return false;
  if (process.platform !== 'win32') return false;

  // If CDP already answers WITH a usable token, keep it.
  try {
    const res = await fetch(`http://127.0.0.1:${cdpPort}/json/version`, {
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const existing = await readTokenViaCDP(`http://127.0.0.1:${cdpPort}`);
      if (existing && !isE2ETokenExpired(existing)) return true;
      // CDP is up but wrong/empty session — cannot switch profile while Chrome holds the port
      console.log(
        '[e2e-auth] CDP is up but no valid privy-token. Close ALL Chrome windows, then re-run ' +
        'so profile "' + profile + '" can open with debugging (no Google login needed).',
      );
      return false;
    }
  } catch { /**/ }

  const chrome =
    env.CHROME_PATH?.trim() ||
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const { chromeUserDataDir } = await import('./find-chrome-privy-profile.mjs');
  const userDataDir = chromeUserDataDir(env);
  const frontend = (env.E2E_FRONTEND_URL || 'http://localhost:5173/?app=1').trim();

  console.log('[e2e-auth] Launching normal Chrome profile with debugging (no Google login)...');

  // Use PowerShell Start-Process so the GUI Chrome stays up independently.
  const ps = `
Start-Process -FilePath '${chrome.replace(/'/g, "''")}' -ArgumentList @(
  '--remote-debugging-port=${cdpPort}',
  '--user-data-dir=${userDataDir.replace(/'/g, "''")}',
  '--profile-directory=${String(profile).replace(/'/g, "''")}',
  '--no-first-run',
  '--no-default-browser-check',
  '${frontend.replace(/'/g, "''")}'
)
`;
  const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 15_000,
  });
  if (r.status !== 0) {
    console.log(`[e2e-auth] Chrome launch failed: ${(r.stderr || r.stdout || 'error').slice(0, 120)}`);
    return false;
  }

  await new Promise((r) => setTimeout(r, 5000));
  try {
    const res = await fetch(`http://127.0.0.1:${cdpPort}/json/version`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    console.log(
      '[e2e-auth] Chrome did not open debugging port (is Chrome already running?). ' +
      'Close all Chrome windows and re-run — your Fun.Run login stays saved.',
    );
    return false;
  }
}

export async function resolveE2EAuthToken(env = process.env) {
  // 1. Direct env var
  const direct = normalizePrivyToken(env.PRIVY_TOKEN_COOKIE || '');
  if (direct && !isE2ETokenExpired(direct)) return direct;

  // 2. Raw Cookie header
  const fromHeader = env.COOKIE ? extractPrivyTokenFromCookieHeader(env.COOKIE) : '';
  if (fromHeader && !isE2ETokenExpired(fromHeader)) return fromHeader;

  // 3. Cookie file / tmp (skip expired)
  const cookieFile = env.E2E_COOKIES_FILE?.trim() || DEFAULT_COOKIES_FILE;
  if (existsSync(cookieFile)) {
    const fromFile = extractPrivyTokenFromCookiesJson(readFileSync(cookieFile, 'utf8'));
    if (fromFile && !isE2ETokenExpired(fromFile)) return fromFile;
  }
  if (existsSync(DEFAULT_TOKEN_TMP)) {
    const tmp = normalizePrivyToken(readFileSync(DEFAULT_TOKEN_TMP, 'utf8'));
    if (tmp.length > 20 && !isE2ETokenExpired(tmp)) return tmp;
  }

  // 4. Reuse normal Chrome session (disk v10 best-effort, then real profile via CDP read)
  const fromChrome = await refreshFromNormalChromeSession(env);
  if (fromChrome) return fromChrome;

  // 5. Playwright persistent profile — opt-in only, cookies only (no Google login)
  if (env.E2E_USE_BROWSER === '1') {
    const frontendUrl = (env.E2E_FRONTEND_URL || 'http://localhost:5173/?app=1').trim();
    return await readTokenFromPlaywrightProfile(frontendUrl, DEFAULT_BROWSER_PROFILE);
  }

  return '';
}

export function e2eAuthHelpText() {
  return [
    'Privy JWT required for authenticated E2E steps.',
    'Harness reuses your normal Chrome Fun.Run session (no Google login in automation).',
    '',
    'If Chrome is already open without debugging, close ALL Chrome windows once and re-run.',
    'Session cookies stay on disk — you will NOT need to Google-login again.',
    '',
    'Profiles with localhost privy-token are auto-detected.',
    'Optional: CHROME_PROFILE_DIRECTORY=Profile 99',
  ].join('\n');
}
