#!/usr/bin/env node
/**
 * Wait for an authenticated Chrome CDP session, then run devnet-e2e-certification.mjs.
 * No manual PRIVY_TOKEN_COOKIE replacement — reads/refreshes privy-token from Chrome.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { ensureFreshE2EAuthToken, isE2ETokenExpired } from './lib/resolve-e2e-auth.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const MAX_MS = 10 * 60 * 1000;
const INTERVAL_MS = 30_000;

function runE2E() {
  const r = spawnSync('node', ['scripts/devnet-e2e-certification.mjs'], {
    cwd: join(here, '..'),
    stdio: 'inherit',
    env: process.env,
  });
  process.exit(r.status ?? 1);
}

const start = Date.now();
let attempt = 0;

while (Date.now() - start < MAX_MS) {
  attempt += 1;
  const ts = new Date().toTimeString().slice(0, 8);
  const elapsed = Math.round((Date.now() - start) / 1000);

  try {
    const token = await ensureFreshE2EAuthToken(process.env);
    if (token && !isE2ETokenExpired(token)) {
      console.log(`[${ts}] Poll #${attempt}: authenticated Chrome session ready — starting E2E`);
      runE2E();
    }
  } catch {
    // CDP not ready yet — keep polling
  }

  console.log(
    `[${ts}] Poll #${attempt} (${elapsed}s): waiting for Chrome CDP session — ` +
    'launch Chrome with --remote-debugging-port=9222 and log in to Fun.Run',
  );
  await new Promise((r) => setTimeout(r, INTERVAL_MS));
}

console.log(
  'Stopped after 10 minutes — launch Chrome with --remote-debugging-port=9222, ' +
  'log in to Fun.Run, then re-run this script.',
);
process.exit(1);
