#!/usr/bin/env node
/**
 * Sprint 1 Task 18 — Staging smoke test.
 *
 * Verifies gateway + trading health after `docker compose -f docker-compose.prod.yml up`.
 *
 * Usage:
 *   node scripts/smoke-staging.mjs
 *   GATEWAY_URL=http://localhost:3000 TRADING_URL=http://localhost:3003 node scripts/smoke-staging.mjs
 */

const GATEWAY_URL = (process.env.GATEWAY_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const TRADING_URL = (process.env.TRADING_URL ?? 'http://trading:3003').replace(/\/$/, '');
const MAX_WAIT_MS = Number(process.env.SMOKE_MAX_WAIT_MS ?? 120_000);
const POLL_MS = Number(process.env.SMOKE_POLL_MS ?? 3_000);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

async function waitFor(name, url, predicate) {
  const deadline = Date.now() + MAX_WAIT_MS;
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt += 1;
    try {
      const result = await fetchJson(url);
      if (predicate(result)) {
        console.log(`✓ ${name} ready (${url}) after ${attempt} attempt(s)`);
        return result;
      }
      console.log(`… ${name} not ready (HTTP ${result.status}) — retry ${attempt}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`… ${name} unreachable (${msg}) — retry ${attempt}`);
    }
    await sleep(POLL_MS);
  }

  throw new Error(`${name} did not become ready within ${MAX_WAIT_MS}ms (${url})`);
}

async function main() {
  console.log('FUN.RUN staging smoke test');
  console.log(`Gateway: ${GATEWAY_URL}`);
  console.log(`Trading: ${TRADING_URL}`);

  await waitFor('gateway /healthz', `${GATEWAY_URL}/healthz`, (r) => r.status === 200 && r.data.ok === true);

  const readyz = await waitFor(
    'gateway /readyz',
    `${GATEWAY_URL}/readyz`,
    (r) => r.status === 200 && r.data.status === 'healthy',
  );

  if (readyz.data.checks?.trading?.status !== 'healthy') {
    console.warn('⚠ gateway /readyz trading check not healthy — trying direct trading /healthz');
    await waitFor(
      'trading /healthz',
      `${TRADING_URL}/healthz`,
      (r) => r.status === 200 && r.data.status === 'ok',
    );
  } else {
    console.log('✓ gateway reports trading healthy');
  }

  const quote = await fetchJson(
    `${GATEWAY_URL}/api/v1/trade/quote?coinId=smoke-test&direction=buy&amountIn=1000000&slippageBps=100`,
  );
  if (quote.status === 502) {
    throw new Error('Gateway proxy returned 502 — trading upstream unreachable');
  }
  console.log(`✓ gateway proxy /api/v1/trade/quote responded HTTP ${quote.status} (not 502)`);

  console.log('\nStaging smoke test PASSED');
}

main().catch((err) => {
  console.error('\nStaging smoke test FAILED');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
