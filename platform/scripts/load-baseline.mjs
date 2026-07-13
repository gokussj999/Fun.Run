#!/usr/bin/env node
/**
 * Sprint 5 — Load test baseline (quote endpoint concurrency).
 *
 * Usage:
 *   node scripts/load-baseline.mjs
 *   GATEWAY_URL=http://localhost:3000 CONCURRENCY=100 node scripts/load-baseline.mjs
 *
 * Dry-run (no live services):
 *   DRY_RUN=true node scripts/load-baseline.mjs
 */
const GATEWAY_URL = (process.env.GATEWAY_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 100);
const REQUESTS = Number(process.env.REQUESTS ?? CONCURRENCY);
const DRY_RUN = process.env.DRY_RUN === 'true';

function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)] ?? 0;
}

async function oneQuoteRequest(i) {
  const url = `${GATEWAY_URL}/api/v1/trade/quote?coinId=load-${i}&direction=buy&amountIn=1000000&slippageBps=100`;
  const start = performance.now();
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  const ms = performance.now() - start;
  return { status: res.status, ms, ok: res.status !== 502 && res.status < 500 };
}

async function main() {
  console.log('FUN.RUN load baseline — quote endpoint');
  console.log({ GATEWAY_URL, CONCURRENCY, REQUESTS, DRY_RUN });

  if (DRY_RUN) {
    const simulated = Array.from({ length: REQUESTS }, (_, i) => 20 + (i % 50));
    simulated.sort((a, b) => a - b);
    console.log('\n[DRY RUN] Simulated latency ms:');
    console.log(`  p50: ${percentile(simulated, 50)}`);
    console.log(`  p95: ${percentile(simulated, 95)}`);
    console.log(`  p99: ${percentile(simulated, 99)}`);
    console.log(`  success rate: 100% (${REQUESTS}/${REQUESTS})`);
    console.log('\nLoad baseline DRY RUN complete — run without DRY_RUN against live gateway for real metrics');
    return;
  }

  const results = [];
  let inFlight = 0;
  let idx = 0;

  await new Promise((resolve, reject) => {
    const launch = () => {
      while (inFlight < CONCURRENCY && idx < REQUESTS) {
        const i = idx++;
        inFlight += 1;
        oneQuoteRequest(i)
          .then((r) => results.push(r))
          .catch((err) => results.push({ status: 0, ms: 10_000, ok: false, err: String(err) }))
          .finally(() => {
            inFlight -= 1;
            if (results.length === REQUESTS && inFlight === 0) resolve(undefined);
            else launch();
          });
      }
    };
    launch();
    setTimeout(() => reject(new Error('Load baseline timeout')), 120_000);
  });

  const latencies = results.map((r) => r.ms).sort((a, b) => a - b);
  const ok = results.filter((r) => r.ok).length;
  const rate502 = results.filter((r) => r.status === 502).length;

  console.log('\nResults:');
  console.log(`  requests: ${REQUESTS}`);
  console.log(`  success:  ${ok}/${REQUESTS} (${((ok / REQUESTS) * 100).toFixed(1)}%)`);
  console.log(`  502s:     ${rate502}`);
  console.log(`  p50 ms:   ${percentile(latencies, 50).toFixed(1)}`);
  console.log(`  p95 ms:   ${percentile(latencies, 95).toFixed(1)}`);
  console.log(`  p99 ms:   ${percentile(latencies, 99).toFixed(1)}`);

  if (ok < REQUESTS * 0.95) {
    console.error('\nLoad baseline FAILED — success rate below 95%');
    process.exit(1);
  }

  console.log('\nLoad baseline PASSED');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
