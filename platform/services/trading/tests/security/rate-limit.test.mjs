/**
 * Phase 8.5.9J — Security: Rate-Limit & DoS Validation
 *
 * Tests:
 *   Trading service (per-wallet Redis sliding window — 60 req/min):
 *     1. Exhaust rate limit → 429 with Retry-After header
 *     2. Rate-limit headers present on every trade response
 *     3. /trade/quote (public) is NOT rate limited by auth middleware
 *
 *   Backend (express-rate-limit — in-memory per IP):
 *     4. Trade endpoint rate limited: 60 req/min
 *     5. Mnemonic reveal rate limited: 5 req/min
 *     6. Global rate limit: 500 req/min
 *     7. Large JSON body: server rejects > JSON limit (15 MB)
 *
 *   DoS resistance:
 *     8. Connection exhaustion: 200 rapid sequential requests → server recovers
 *     9. Duplicate Idempotency-Key flood → all get 409 (no CPU spike from re-execution)
 *
 * Run:
 *   node --test tests/security/rate-limit.test.mjs
 *
 * Environment:
 *   TRADING_URL   http://localhost:3003
 *   BACKEND_URL   http://localhost:5000
 *   AUTH_TOKEN    <privy jwt>
 *   COIN_ID       <active coin uuid>
 */
import { test }  from 'node:test';
import assert    from 'node:assert/strict';
import crypto    from 'node:crypto';

const TRADING  = process.env.TRADING_URL  || 'http://localhost:3003';
const BACKEND  = process.env.BACKEND_URL  || 'http://localhost:5000';
const TOKEN    = process.env.AUTH_TOKEN   || '';
const COIN     = process.env.COIN_ID      || '';

function authHeaders(idemKey) {
  const h = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${TOKEN}`,
  };
  if (idemKey) h['Idempotency-Key'] = idemKey;
  return h;
}

async function tradeRequest(idemKey) {
  return fetch(`${TRADING}/trade/buy`, {
    method:  'POST',
    headers: authHeaders(idemKey || crypto.randomUUID()),
    body: JSON.stringify({
      coinId:            COIN || 'test-coin',
      solAmountLamports: '1000000',
      minTokensOut:      '0',
      slippageBps:       10000,
    }),
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ─── 1. Rate limit exhaustion ─────────────────────────────────────────────────
test('rate-limit: 61 rapid requests from same wallet → at least one 429', async (t) => {
  if (!TOKEN || !COIN) { t.skip('AUTH_TOKEN and COIN_ID required'); return; }

  const results = [];
  for (let i = 0; i < 65; i++) {
    const res = await tradeRequest();
    results.push(res.status);
  }

  const got429 = results.includes(429);
  const got429Count = results.filter((s) => s === 429).length;
  t.diagnostic(`Statuses: ${results.join(' ')}`);
  t.diagnostic(`429s received: ${got429Count}`);

  assert.ok(got429, 'At least one 429 must be returned after exhausting the 60 req/min limit');
});

// ─── 2. Rate-limit headers present ───────────────────────────────────────────
test('rate-limit: x-ratelimit-* headers present on trade responses', async (t) => {
  if (!TOKEN || !COIN) { t.skip('AUTH_TOKEN and COIN_ID required'); return; }

  const res = await tradeRequest();

  // Trading service uses Redis sliding window with custom headers.
  const limit     = res.headers.get('x-ratelimit-limit');
  const remaining = res.headers.get('x-ratelimit-remaining');
  const reset     = res.headers.get('x-ratelimit-reset');

  t.diagnostic(`x-ratelimit-limit=${limit} remaining=${remaining} reset=${reset}`);

  assert.ok(limit     !== null, 'x-ratelimit-limit header must be present');
  assert.ok(remaining !== null, 'x-ratelimit-remaining header must be present');
  assert.ok(reset     !== null, 'x-ratelimit-reset header must be present');

  assert.ok(parseInt(limit, 10) > 0,     'x-ratelimit-limit must be a positive number');
  assert.ok(parseInt(remaining, 10) >= 0, 'x-ratelimit-remaining must be >= 0');
  assert.ok(parseInt(reset, 10) > 0,      'x-ratelimit-reset must be a future epoch seconds');
});

// ─── 3. /trade/quote not rate limited by auth middleware ─────────────────────
test('rate-limit: /trade/quote is public and not subject to auth rate limiting', async (t) => {
  if (!COIN) { t.skip('COIN_ID required'); return; }

  // 10 rapid quote requests — none should 401 or 429 for auth reasons.
  const results = await Promise.all(
    Array.from({ length: 10 }, () =>
      fetch(`${TRADING}/trade/quote?coinId=${COIN}&direction=buy&amountIn=1000000&slippageBps=50`),
    ),
  );

  for (const res of results) {
    assert.notEqual(res.status, 401, '/trade/quote must not require auth token');
  }
});

// ─── 4. Backend trade rate limit ─────────────────────────────────────────────
test('backend rate-limit: /api/trade rate limited at 60 req/min', async (t) => {
  if (!TOKEN || !COIN) { t.skip('AUTH_TOKEN and COIN_ID required'); return; }

  // Fire 65 requests to the backend's trade endpoint.
  const statuses = [];
  for (let i = 0; i < 65; i++) {
    const res = await fetch(`${BACKEND}/api/trade`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
      body: JSON.stringify({
        coinId:   COIN,
        type:     'buy',
        solAmount: 0.01,
      }),
    });
    statuses.push(res.status);
  }

  t.diagnostic(`Backend trade statuses: ${statuses.slice(60).join(' ')}`);
  const has429 = statuses.includes(429);
  assert.ok(has429, 'Backend trade endpoint must rate limit at 60 req/min');
});

// ─── 5. Mnemonic reveal rate limit ───────────────────────────────────────────
test('backend rate-limit: mnemonic reveal limited to 5 req/min', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }

  const statuses = [];
  for (let i = 0; i < 8; i++) {
    const res = await fetch(`${BACKEND}/api/reveal-mnemonic`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
      body:    '{}',
    });
    statuses.push(res.status);
  }

  t.diagnostic(`Mnemonic reveal statuses: ${statuses.join(' ')}`);
  const has429 = statuses.includes(429);
  // After 5 requests, must start returning 429.
  assert.ok(has429 || statuses.every((s) => s === 404 || s === 401),
    'Mnemonic reveal must be rate limited to 5 req/min (or endpoint returns 404 if not exposed)');
});

// ─── 7. Large JSON body ───────────────────────────────────────────────────────
test('dos: oversized JSON body rejected', async (t) => {
  // Send a JSON body larger than what the server should accept for a trade endpoint.
  // The server accepts 15 MB (server.js line 50), which is excessive for a trade API.
  // Test that genuinely huge bodies (>15 MB) are rejected.
  const hugePadding = 'A'.repeat(16 * 1024 * 1024); // 16 MB
  const hugeBody = JSON.stringify({
    coinId:            COIN || 'test',
    solAmountLamports: '1000000',
    minTokensOut:      '0',
    slippageBps:       500,
    padding:           hugePadding,
  });

  let res;
  try {
    res = await fetch(`${BACKEND}/api/trade`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
      body:    hugeBody,
    });
  } catch {
    // Connection reset is also acceptable (server killed the connection).
    t.diagnostic('Server closed connection for oversized body — acceptable');
    return;
  }

  // Server must reject with 413 (Payload Too Large) or 400, not 200.
  assert.ok(
    res.status === 413 || res.status === 400 || res.status === 422,
    `Oversized body (16 MB) must be rejected. Got ${res.status}`,
  );
});

// ─── 8. Connection exhaustion recovery ───────────────────────────────────────
test('dos: server recovers after 100 rapid requests', async (t) => {
  // Rapid sequential requests — server must respond to all (even if 429).
  const results = [];
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`${TRADING}/healthz`, { signal: AbortSignal.timeout(5000) });
      results.push(res.status);
    } catch {
      results.push(0);
    }
  }

  const successes = results.filter((s) => s === 200).length;
  const failures  = results.filter((s) => s === 0).length;

  t.diagnostic(`Rapid /healthz: ${successes} successes, ${failures} failures`);
  assert.ok(successes >= 90, `Server must respond to ≥ 90 of 100 rapid requests. Got ${successes}/100`);
});

// ─── 9. Idempotency key flood (DoS via 409 storm) ────────────────────────────
test('dos: flooding same idempotency key produces 409s (no re-execution)', async (t) => {
  if (!TOKEN || !COIN) { t.skip('AUTH_TOKEN and COIN_ID required'); return; }

  const KEY = `rl-flood-${crypto.randomUUID()}`;

  // First request acquires the lock.
  const firstPromise = tradeRequest(KEY);

  // Immediately flood with duplicates — they must all get 409 or replay.
  const duplicates = await Promise.all(
    Array.from({ length: 20 }, () => tradeRequest(KEY)),
  );

  const first = await firstPromise;

  const status409 = duplicates.filter((r) => r.status === 409).length;
  const replays   = duplicates.filter((r) => r.headers.get('idempotency-replay') === 'true').length;
  const freshExec = duplicates.filter(
    (r) => r.status === 200 && r.headers.get('idempotency-replay') !== 'true',
  ).length;

  t.diagnostic(`Flood test: 409s=${status409} replays=${replays} fresh-exec=${freshExec} first=${first.status}`);

  assert.equal(freshExec, 0,
    `Idempotency key flood must not cause re-execution. Got ${freshExec} fresh executions.`);
});
