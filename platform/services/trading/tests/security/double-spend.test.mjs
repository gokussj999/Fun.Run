/**
 * Phase 8.5.9J — Security: Double-Spend & Transaction Replay Prevention
 *
 * Tests:
 *   1. Idempotency TOCTOU (SEC-02 fix validation)
 *      - 10 concurrent requests with identical Idempotency-Key
 *      - Exactly ONE must succeed (200 with real txId)
 *      - All others must be 409 (PENDING lock) or 200 replay (idempotency-replay header)
 *      - ZERO additional independent 200 responses = no double-spend
 *
 *   2. Same Idempotency-Key on retry after success → replayed result (200 + header)
 *
 *   3. Replay with modified body (different amount) → same cached result as original
 *      (idempotency key pins the response regardless of body differences)
 *
 *   4. Key uniqueness: two different keys → two independent trades
 *
 * Run:
 *   node --test tests/security/double-spend.test.mjs
 *
 * Environment:
 *   TRADING_URL   http://localhost:3003
 *   AUTH_TOKEN    <privy jwt>
 *   COIN_ID       <active coin uuid>
 */
import { test }  from 'node:test';
import assert    from 'node:assert/strict';
import { assertValidTradeResponse } from './trade-response-assert.mjs';
import crypto    from 'node:crypto';

const BASE   = process.env.TRADING_URL || 'http://localhost:3003';
const TOKEN  = process.env.AUTH_TOKEN  || '';
const COIN   = process.env.COIN_ID     || '';

function tradingHeaders(idemKey) {
  const h = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${TOKEN}`,
  };
  if (idemKey) h['Idempotency-Key'] = idemKey;
  return h;
}

async function buy(solLamports, idemKey) {
  const res = await fetch(`${BASE}/trade/buy`, {
    method:  'POST',
    headers: tradingHeaders(idemKey),
    body: JSON.stringify({
      coinId:            COIN,
      solAmountLamports: String(solLamports),
      minTokensOut:      '0',
      slippageBps:       500,
    }),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, headers: res.headers };
}

// ─── 1. Concurrent TOCTOU test ───────────────────────────────────────────────
test('double-spend: 10 concurrent requests same key → at most 1 executes', async (t) => {
  if (!TOKEN || !COIN) { t.skip('AUTH_TOKEN and COIN_ID required'); return; }

  const key = `ds-toctou-${crypto.randomUUID()}`;
  const CONCURRENCY = 10;

  // Fire all requests simultaneously.
  const results = await Promise.allSettled(
    Array.from({ length: CONCURRENCY }, () => buy(10_000_000, key)),
  );

  const responses = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value);

  const originals = responses.filter(
    (r) => r.status === 200 && r.headers.get('idempotency-replay') !== 'true',
  );
  const replays   = responses.filter(
    (r) => r.status === 200 && r.headers.get('idempotency-replay') === 'true',
  );
  const conflicts = responses.filter((r) => r.status === 409);
  const errors    = responses.filter(
    (r) => r.status !== 200 && r.status !== 409 && r.status !== 422 && r.status !== 429,
  );

  t.diagnostic(`originals=${originals.length} replays=${replays.length} conflicts=${conflicts.length} errors=${errors.length}`);

  // Critical assertion: at most ONE non-replay 200 must exist.
  assert.ok(
    originals.length <= 1,
    `DOUBLE-SPEND DETECTED: ${originals.length} independent executions for the same idempotency key. Expected ≤ 1.`,
  );

  // All originals must have a valid trade response (offchain or onchain).
  for (const r of originals) {
    const mode = assertValidTradeResponse(r.data, 'original');
    t.diagnostic(`trade mode: ${mode}, txId: ${r.data.txId}`);
  }

  // Replays must have the same txId as the original (if original succeeded).
  if (originals.length === 1 && replays.length > 0) {
    const originalTxId = originals[0].data.txId;
    for (const r of replays) {
      assert.equal(r.data.txId, originalTxId, 'replay must return same txId as original');
    }
  }

  // Conflicts (409) are correct behaviour when original is still processing.
  for (const r of conflicts) {
    assert.equal(r.data.error, 'IDEMPOTENCY_CONFLICT', '409 body must have IDEMPOTENCY_CONFLICT error code');
  }

  // No unexpected errors.
  assert.equal(errors.length, 0, `Unexpected error responses: ${JSON.stringify(errors.map((r) => ({ status: r.status, data: r.data })))}`);
});

// ─── 2. Retry after success → replay ─────────────────────────────────────────
test('double-spend: retry with same key after success → idempotency-replay header', async (t) => {
  if (!TOKEN || !COIN) { t.skip('AUTH_TOKEN and COIN_ID required'); return; }

  const key = `ds-retry-${crypto.randomUUID()}`;

  // First request.
  const first = await buy(10_000_000, key);
  if (first.status !== 200) {
    t.skip(`First request returned ${first.status} — cannot test replay`);
    return;
  }
  const firstTxId = first.data.txId;

  // Wait for the result to be stored.
  await new Promise((r) => setTimeout(r, 200));

  // Second request with same key → must be a replay.
  const second = await buy(10_000_000, key);
  assert.equal(second.status, 200);
  assert.equal(second.headers.get('idempotency-replay'), 'true');
  assert.equal(second.data.txId, firstTxId);
  assertValidTradeResponse(second.data, 'replay');
});

// ─── 3. Replay ignores modified body ─────────────────────────────────────────
test('double-spend: same key with different body → same cached result', async (t) => {
  if (!TOKEN || !COIN) { t.skip('AUTH_TOKEN and COIN_ID required'); return; }

  const key = `ds-body-${crypto.randomUUID()}`;

  const first = await buy(10_000_000, key);
  if (first.status !== 200) {
    t.skip(`First request returned ${first.status}`);
    return;
  }

  await new Promise((r) => setTimeout(r, 200));

  // Second request: same key, DIFFERENT amount — must still return the original result.
  const second = await fetch(`${BASE}/trade/buy`, {
    method:  'POST',
    headers: tradingHeaders(key),
    body: JSON.stringify({
      coinId:            COIN,
      solAmountLamports: '99999999', // different amount
      minTokensOut:      '0',
      slippageBps:       500,
    }),
  });
  const secondData = await second.json().catch(() => ({}));

  assert.equal(second.status, 200);
  assert.equal(second.headers.get('idempotency-replay'), 'true');
  // Amount in response must match the FIRST request's result, not the second body.
  assert.equal(secondData.txId, first.data.txId, 'cached result must be returned regardless of body change');
});

// ─── 4. Different keys → independent trades ───────────────────────────────────
test('double-spend: two different idempotency keys → two independent executions', async (t) => {
  if (!TOKEN || !COIN) { t.skip('AUTH_TOKEN and COIN_ID required'); return; }

  const keyA = `ds-uniq-A-${crypto.randomUUID()}`;
  const keyB = `ds-uniq-B-${crypto.randomUUID()}`;

  const [a, b] = await Promise.all([buy(10_000_000, keyA), buy(10_000_000, keyB)]);

  // Both may fail due to slippage or balance — that's OK.
  // What matters: if both succeed, txIds must be DIFFERENT.
  if (a.status === 200 && b.status === 200) {
    assert.notEqual(
      a.data.txId,
      b.data.txId,
      'two different idempotency keys must produce two different txIds',
    );
    assert.notEqual(a.headers.get('idempotency-replay'), 'true', 'key A must not be a replay');
    assert.notEqual(b.headers.get('idempotency-replay'), 'true', 'key B must not be a replay');
  }
});

// ─── 5. No key → no replay protection (by design), verify behaviour ───────────
test('double-spend: no idempotency key → two requests may both execute (expected)', async (t) => {
  if (!TOKEN || !COIN) { t.skip('AUTH_TOKEN and COIN_ID required'); return; }

  const [a, b] = await Promise.all([buy(5_000_000, null), buy(5_000_000, null)]);

  // Without a key, idempotency is not enforced — both may succeed.
  // This test documents the KNOWN behaviour, not a bug.
  t.diagnostic(
    `Without Idempotency-Key: A=${a.status} B=${b.status}. ` +
    'Both executing is expected — clients must supply a key for protection.',
  );

  // Neither response should be a replay (no key → no replay header).
  assert.notEqual(a.headers.get('idempotency-replay'), 'true', 'no key → no replay header on A');
  assert.notEqual(b.headers.get('idempotency-replay'), 'true', 'no key → no replay header on B');
});
