/**
 * Phase 8.5.9J — Security: Unauthenticated Wallet Route Validation
 *
 * Issue F-02 (P1): backend/routes/wallet.js exposes POST /wallet/create
 * without authentication. While server.js currently shadows this route with
 * an authenticated handler (registered before the router mount), the old
 * file is still imported and mounted — a maintenance hazard.
 *
 * This test validates:
 *   1. POST /wallet/create requires authentication (server.js shadow is active)
 *   2. Unauthenticated request returns 401, not 200 with a wallet address
 *   3. Response never contains a mnemonic phrase
 *   4. Response never contains an encrypted_mnemonic
 *   5. Authenticated request returns only {ok, success, address} — no mnemonic fields
 *   6. GET /wallet/* routes do not exist (no route enumeration surface)
 *
 * Run:
 *   node --test backend/tests/security/wallet-route.test.mjs
 *
 * Environment:
 *   BACKEND_URL   http://localhost:5000
 *   AUTH_TOKEN    <privy jwt>
 */
import { test }  from 'node:test';
import assert    from 'node:assert/strict';

const BASE  = process.env.BACKEND_URL || 'http://localhost:5000';
const TOKEN = process.env.AUTH_TOKEN  || '';

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers,
    body:    JSON.stringify(body || {}),
  });
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, data, raw: text };
}

async function get(path, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { headers });
  let data = {};
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

// ─── 1. Unauthenticated /wallet/create → 401 ─────────────────────────────────
test('wallet-route: no token → 401', async () => {
  const { status, raw } = await post('/wallet/create', {});
  assert.equal(status, 401, `Unauthenticated /wallet/create must return 401. Got ${status}: ${raw}`);
});

// ─── 2. No mnemonic in unauthenticated response ───────────────────────────────
test('wallet-route: unauthenticated response contains no mnemonic', async () => {
  const { raw } = await post('/wallet/create', {});
  assert.ok(!raw.includes('mnemonic'),  `Response must not expose mnemonic: ${raw}`);
  assert.ok(!raw.includes('seed'),      `Response must not expose seed: ${raw}`);
  assert.ok(!raw.includes('encrypted'), `Response must not expose encrypted data: ${raw}`);
  assert.ok(!raw.includes('address'),   `Wallet address must not be exposed without auth: ${raw}`);
});

// ─── 3. Garbage token → 401 ──────────────────────────────────────────────────
test('wallet-route: garbage bearer token → 401', async () => {
  const { status } = await post('/wallet/create', {}, 'garbage.token.value');
  assert.equal(status, 401, `Invalid token must return 401. Got ${status}`);
});

// ─── 4. Authenticated request returns safe fields only ───────────────────────
test('wallet-route: authenticated → 200 with only {ok, success, address}', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }

  const { status, data, raw } = await post('/wallet/create', {}, TOKEN);

  assert.equal(status, 200, `Authenticated /wallet/create must return 200. Got ${status}: ${raw}`);
  assert.equal(data.ok, true);
  assert.equal(data.success, true);
  assert.ok(typeof data.address === 'string' && data.address.length > 0, 'address must be a non-empty string');

  // Critical: encrypted_mnemonic must NEVER be in the HTTP response.
  assert.ok(!raw.includes('mnemonic'),          `Response must not expose mnemonic: ${raw}`);
  assert.ok(!raw.includes('encrypted_mnemonic'), `Response must not expose encrypted_mnemonic: ${raw}`);
  assert.ok(!raw.includes('encryptedMnemonic'),  `Response must not expose encryptedMnemonic: ${raw}`);
  assert.ok(!raw.includes('secretKey'),          `Response must not expose secretKey: ${raw}`);
  assert.ok(!raw.includes('privateKey'),         `Response must not expose privateKey: ${raw}`);

  // Response should contain ONLY expected fields.
  const allowedKeys = new Set(['ok', 'success', 'address']);
  for (const key of Object.keys(data)) {
    assert.ok(allowedKeys.has(key), `Unexpected field "${key}" in /wallet/create response`);
  }
});

// ─── 5. Idempotent: second call returns the SAME address ─────────────────────
test('wallet-route: second authenticated call returns same wallet address', async (t) => {
  if (!TOKEN) { t.skip('AUTH_TOKEN required'); return; }

  const first  = await post('/wallet/create', {}, TOKEN);
  const second = await post('/wallet/create', {}, TOKEN);

  if (first.status === 200 && second.status === 200) {
    assert.equal(
      first.data.address,
      second.data.address,
      'Second call must return the same custodial wallet address (idempotent)',
    );
  }
});

// ─── 6. No GET endpoints on /wallet/* ────────────────────────────────────────
test('wallet-route: GET /wallet/create returns 404 (method not allowed)', async () => {
  const { status } = await get('/wallet/create');
  // GET should return 404 (no handler) or 405 (method not allowed) — not 200.
  assert.ok(
    status === 404 || status === 405,
    `GET /wallet/create must return 404 or 405. Got ${status}`,
  );
});

// ─── 7. /wallet/* does not enumerate wallet list ─────────────────────────────
test('wallet-route: GET /wallet does not expose wallet list', async () => {
  const { status } = await get('/wallet');
  assert.ok(
    status === 404 || status === 405 || status === 401,
    `GET /wallet must return 404, 405, or 401. Got ${status}`,
  );
});

// ─── 8. Route ordering: old unauthenticated route.js is shadowed ─────────────
test('wallet-route: old wallet.js route is shadowed by authenticated handler', async () => {
  // This is fundamentally the same as test 1, but documents the shadow mechanism.
  // If the authenticated server.js handler is removed, this test will catch the regression.
  const { status, raw } = await post('/wallet/create', {});

  assert.equal(
    status,
    401,
    'If this fails with 200 + address, the authenticated shadow handler was removed and the ' +
    'unauthenticated routes/wallet.js is now live. Immediately delete routes/wallet.js.',
  );
  assert.ok(!raw.includes('encryptedMnemonic'), 'Encrypted mnemonic must never appear in response');
});
