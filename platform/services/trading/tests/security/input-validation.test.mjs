/**
 * Phase 8.5.9J — Security: Input Validation
 *
 * Tests:
 *   1. SQL injection attempt in coinId → rejected by Zod schema or ORM parameterization
 *   2. XSS payload in string fields → not reflected in error messages
 *   3. Negative amounts → 400 validation error
 *   4. Zero amounts → 400 or 422 depending on route
 *   5. BigInt overflow (amounts larger than u64 max) → 400
 *   6. Wrong types (string where number expected) → 400
 *   7. Missing required fields → 400
 *   8. Extra unknown fields → silently stripped (no crash)
 *   9. Unicode / null byte injection in string fields → 400 or safely ignored
 *  10. Backend coin creation: XSS in name/symbol → sanitized or rejected
 *  11. Backend coin creation: extremely long name/symbol → truncated or rejected
 *
 * Run:
 *   node --test tests/security/input-validation.test.mjs
 *
 * Environment:
 *   TRADING_URL   http://localhost:3003
 *   BACKEND_URL   http://localhost:5000
 *   AUTH_TOKEN    <privy jwt>
 *   COIN_ID       <active coin uuid>
 */
import { test }  from 'node:test';
import assert    from 'node:assert/strict';

const TRADING = process.env.TRADING_URL || 'http://localhost:3003';
const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';
const TOKEN   = process.env.AUTH_TOKEN  || '';
const COIN    = process.env.COIN_ID     || '';

const COIN_ID = COIN || 'test-coin';

async function tradeBuy(body, extraHeaders = {}) {
  const res = await fetch(`${TRADING}/trade/buy`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${TOKEN}`,
      ...extraHeaders,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

async function backendPost(path, body) {
  const res = await fetch(`${BACKEND}${path}`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

function notXss(text) {
  // Verify XSS payloads are not reflected verbatim in the response.
  return !text.includes('<script>') &&
         !text.includes('onerror=') &&
         !text.includes('javascript:');
}

// ─── Amount validation ────────────────────────────────────────────────────────

test('input: negative solAmountLamports → 400', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }
  const { status, data } = await tradeBuy({
    coinId: COIN_ID, solAmountLamports: '-1', minTokensOut: '0', slippageBps: 500,
  });
  assert.equal(status, 400, `Negative amount must be rejected. Got ${status}: ${JSON.stringify(data)}`);
  assert.equal(data.error, 'VALIDATION_ERROR');
});

test('input: zero solAmountLamports → 400', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }
  const { status } = await tradeBuy({
    coinId: COIN_ID, solAmountLamports: '0', minTokensOut: '0', slippageBps: 500,
  });
  assert.equal(status, 400, 'Zero amount must be rejected');
});

test('input: solAmountLamports exceeds u64 max → 400', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }
  const u64Max = '18446744073709551616'; // 2^64, one past max
  const { status } = await tradeBuy({
    coinId: COIN_ID, solAmountLamports: u64Max, minTokensOut: '0', slippageBps: 500,
  });
  assert.equal(status, 400, 'Amount exceeding u64 max must be rejected');
});

test('input: negative slippageBps → 400', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }
  const { status } = await tradeBuy({
    coinId: COIN_ID, solAmountLamports: '10000000', minTokensOut: '0', slippageBps: -1,
  });
  assert.equal(status, 400, 'Negative slippageBps must be rejected');
});

test('input: slippageBps > 10000 → 400', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }
  const { status } = await tradeBuy({
    coinId: COIN_ID, solAmountLamports: '10000000', minTokensOut: '0', slippageBps: 10001,
  });
  assert.equal(status, 400, 'slippageBps > 10000 (100%) must be rejected');
});

// ─── Type coercion attacks ────────────────────────────────────────────────────

test('input: string where number expected (slippageBps) → 400', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }
  const { status } = await tradeBuy({
    coinId: COIN_ID, solAmountLamports: '10000000', minTokensOut: '0', slippageBps: 'abc',
  });
  assert.equal(status, 400, 'Wrong type for slippageBps must be rejected');
});

test('input: null coinId → 400', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }
  const { status } = await tradeBuy({
    coinId: null, solAmountLamports: '10000000', minTokensOut: '0', slippageBps: 500,
  });
  assert.equal(status, 400, 'Null coinId must be rejected');
});

test('input: array as coinId → 400', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }
  const { status } = await tradeBuy({
    coinId: ['injected', 'array'], solAmountLamports: '10000000', minTokensOut: '0', slippageBps: 500,
  });
  assert.equal(status, 400, 'Array as coinId must be rejected');
});

// ─── Missing fields ────────────────────────────────────────────────────────────

test('input: missing coinId → 400', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }
  const { status } = await tradeBuy({
    solAmountLamports: '10000000', minTokensOut: '0', slippageBps: 500,
  });
  assert.equal(status, 400, 'Missing coinId must produce 400');
});

test('input: missing solAmountLamports → 400', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }
  const { status } = await tradeBuy({
    coinId: COIN_ID, minTokensOut: '0', slippageBps: 500,
  });
  assert.equal(status, 400, 'Missing solAmountLamports must produce 400');
});

test('input: completely empty body → 400', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }
  const { status } = await tradeBuy({});
  assert.equal(status, 400, 'Empty body must produce 400');
});

// ─── Injection payloads ───────────────────────────────────────────────────────

test('input: SQL injection in coinId → 400 or 404, NOT 500', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }
  const sqli = "'; DROP TABLE coins; --";
  const { status, data } = await tradeBuy({
    coinId: sqli, solAmountLamports: '10000000', minTokensOut: '0', slippageBps: 500,
  });
  // Parameterized queries make SQL injection impossible — server should return
  // 400 (validation) or 404 (coin not found) — NEVER 500.
  assert.ok(status !== 500, `SQL injection must not cause 500. Got ${status}: ${JSON.stringify(data)}`);
  assert.ok(status === 400 || status === 404, `SQL injection coinId must return 400 or 404. Got ${status}`);

  // XSS payload must not be reflected in error body.
  const bodyStr = JSON.stringify(data);
  assert.ok(notXss(bodyStr), `SQL injection payload must not be reflected in response: ${bodyStr}`);
});

test('input: XSS payload in coinId → 400, payload not reflected', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }
  const xss = '<script>alert("xss")</script>';
  const { status, data } = await tradeBuy({
    coinId: xss, solAmountLamports: '10000000', minTokensOut: '0', slippageBps: 500,
  });
  assert.ok(status === 400 || status === 404, `XSS in coinId must return 400 or 404. Got ${status}`);
  const bodyStr = JSON.stringify(data);
  assert.ok(notXss(bodyStr), `XSS payload must not be reflected in response: ${bodyStr}`);
});

test('input: null byte in coinId → 400', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }
  const { status } = await tradeBuy({
    coinId: 'valid-id\x00injected', solAmountLamports: '10000000', minTokensOut: '0', slippageBps: 500,
  });
  // Null byte must be rejected or sanitized.
  assert.ok(status === 400 || status === 404, `Null byte in coinId must return 400 or 404. Got ${status}`);
});

// ─── Extra fields stripped silently ───────────────────────────────────────────

test('input: unknown fields in body are silently stripped (no crash)', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }
  const { status } = await tradeBuy({
    coinId:            COIN_ID,
    solAmountLamports: '10000000',
    minTokensOut:      '0',
    slippageBps:       500,
    __proto__:         { isAdmin: true },   // prototype pollution attempt
    constructor:       'ATTACK',
    walletAddress:     'INJECTED_WALLET',   // should be ignored
    extraField:        'value',
  });
  // Must be 200/422/429 (processed normally) or 400 (validation), never a crash.
  assert.ok(
    status === 200 || status === 400 || status === 404 ||
    status === 422 || status === 429 || status === 401,
    `Unknown fields must not cause server error. Got ${status}`,
  );
  assert.ok(status !== 500, 'Unknown fields must not cause 500');
});

// ─── Backend coin creation input validation ───────────────────────────────────

test('backend: coin creation with XSS in name → rejected or sanitized', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }
  const { status, data } = await backendPost('/api/coins', {
    name:     '<script>alert(1)</script>',
    symbol:   'XSS',
    description: 'test',
    initialBuy: 0.01,
  });

  if (status === 200 || status === 201) {
    // If accepted, name must be sanitized in response.
    assert.ok(notXss(JSON.stringify(data)), 'XSS payload in name must be sanitized before storing');
  } else {
    // 400 or 422 = rejected — also acceptable.
    assert.ok(status === 400 || status === 422 || status === 401 || status === 429);
  }
});

test('backend: coin name longer than 64 chars → rejected', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }
  const { status } = await backendPost('/api/coins', {
    name:     'A'.repeat(200),
    symbol:   'LONG',
    description: 'test',
    initialBuy: 0.01,
  });
  assert.ok(
    status === 400 || status === 422 || status === 401 || status === 429,
    `Overlong name must be rejected. Got ${status}`,
  );
  assert.ok(status !== 200, 'Overlong coin name must not be accepted');
});
