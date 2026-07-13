#!/usr/bin/env node
/**
 * Sprint 5 — Cross-system smoke test (extended).
 * Verifies gateway, trading, indexer, and ws-gateway health endpoints.
 */
const GATEWAY_URL = (process.env.GATEWAY_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const TRADING_URL = (process.env.TRADING_URL ?? 'http://localhost:3003').replace(/\/$/, '');
const INDEXER_URL = (process.env.INDEXER_URL ?? 'http://localhost:9091').replace(/\/$/, '');
const WS_HTTP_URL = (process.env.WS_HTTP_URL ?? 'http://localhost:3002').replace(/\/$/, '');
const MAX_WAIT_MS = Number(process.env.SMOKE_MAX_WAIT_MS ?? 60_000);

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
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
        console.log(`✓ ${name} (${url})`);
        return result;
      }
      console.log(`… ${name} HTTP ${result.status} — retry ${attempt}`);
    } catch (err) {
      console.log(`… ${name} unreachable — retry ${attempt}`);
    }
    await sleep(2_000);
  }
  throw new Error(`${name} not ready within ${MAX_WAIT_MS}ms`);
}

async function main() {
  console.log('FUN.RUN Sprint 5 cross-system smoke');
  console.log({ GATEWAY_URL, TRADING_URL, INDEXER_URL, WS_HTTP_URL });

  await waitFor('gateway /healthz', `${GATEWAY_URL}/healthz`, (r) => r.status === 200);
  await waitFor('trading /healthz', `${TRADING_URL}/healthz`, (r) => r.status === 200 && r.data.alive === true);
  await waitFor('indexer /readyz', `${INDEXER_URL}/readyz`, (r) => r.status === 200 || r.status === 503);
  await waitFor('ws-gateway /readyz', `${WS_HTTP_URL}/readyz`, (r) => r.status === 200 || r.status === 503);

  const quote = await fetchJson(
    `${GATEWAY_URL}/api/v1/trade/quote?coinId=smoke&direction=buy&amountIn=1000000&slippageBps=100`,
  );
  if (quote.status === 502) throw new Error('Gateway trade quote returned 502');

  console.log(`✓ gateway quote proxy HTTP ${quote.status}`);
  console.log('\nSprint 5 cross-system smoke PASSED');
}

main().catch((err) => {
  console.error('\nSprint 5 cross-system smoke FAILED');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
