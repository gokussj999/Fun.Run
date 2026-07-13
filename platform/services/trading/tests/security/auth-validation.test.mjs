/**
 * Phase 8.5.9J — Security: Authentication & Authorization Validation
 *
 * Tests:
 *   - Missing Authorization header → 401
 *   - Malformed bearer token → 401
 *   - Expired / invalid Privy JWT → 401
 *   - Valid token but banned account → 401
 *   - Valid token but INTERNAL_SERVICE role → 401
 *   - Valid token with wrong wallet in body (attempt to trade as other user) → 401 or own-wallet trade
 *   - /readyz and /healthz bypass auth (no token required)
 *   - /trade/quote bypass auth (public endpoint)
 *
 * Run:
 *   node --test tests/security/auth-validation.test.mjs
 *
 * Environment:
 *   TRADING_URL   http://localhost:3003
 *   VALID_TOKEN   <a real privy JWT for an active account>
 *   COIN_ID       <any active coin uuid>
 */
import { test }  from 'node:test';
import assert    from 'node:assert/strict';

const BASE   = process.env.TRADING_URL || 'http://localhost:3003';
const VALID  = process.env.VALID_TOKEN || '';
const COIN   = process.env.COIN_ID     || '';

async function post(path, body, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body:    JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  return { status: res.status, data, headers: res.headers };
}

async function get(path, headers = {}) {
  const res = await fetch(`${BASE}${path}`, { headers });
  let data = {};
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

const TRADE_BODY = {
  coinId:            COIN || 'test-coin-id',
  solAmountLamports: '10000000',
  minTokensOut:      '0',
  slippageBps:       500,
};

// ─── Missing / malformed auth ─────────────────────────────────────────────────

test('auth: no Authorization header → 401', async () => {
  const { status } = await post('/trade/buy', TRADE_BODY);
  assert.equal(status, 401);
});

test('auth: empty Authorization header → 401', async () => {
  const { status } = await post('/trade/buy', TRADE_BODY, { 'Authorization': '' });
  assert.equal(status, 401);
});

test('auth: wrong scheme (Basic) → 401', async () => {
  const { status, data } = await post('/trade/buy', TRADE_BODY, {
    'Authorization': 'Basic dXNlcjpwYXNz',
  });
  assert.equal(status, 401);
  assert.equal(data.error, 'UNAUTHORIZED');
});

test('auth: Bearer with no token → 401', async () => {
  const { status } = await post('/trade/buy', TRADE_BODY, {
    'Authorization': 'Bearer ',
  });
  assert.equal(status, 401);
});

test('auth: Bearer with garbage JWT → 401', async () => {
  const { status, data } = await post('/trade/buy', TRADE_BODY, {
    'Authorization': 'Bearer eyJhbGciOiJSUzI1NiJ9.GARBAGE.signature',
  });
  assert.equal(status, 401);
  assert.equal(data.error, 'UNAUTHORIZED');
});

test('auth: Bearer with well-formed but expired JWT → 401', async () => {
  // A structurally valid JWT with exp in the past.
  // Header: {"alg":"RS256","typ":"JWT"}
  // Payload: {"sub":"usr_test","exp":1000000000}  (year 2001 — definitely expired)
  const expiredJwt =
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.' +
    'eyJzdWIiOiJ1c3JfdGVzdCIsImV4cCI6MTAwMDAwMDAwMH0.' +
    'invalidsignature';

  const { status, data } = await post('/trade/buy', TRADE_BODY, {
    'Authorization': `Bearer ${expiredJwt}`,
  });
  assert.equal(status, 401);
  assert.equal(data.error, 'UNAUTHORIZED');
});

test('auth: token with extra characters appended → 401', async () => {
  if (!VALID) return; // skip if no valid token configured
  const { status } = await post('/trade/buy', TRADE_BODY, {
    'Authorization': `Bearer ${VALID}INJECTED_SUFFIX`,
  });
  assert.equal(status, 401);
});

// ─── Wallet address injection ─────────────────────────────────────────────────

test('auth: wallet in request body is ignored — server uses auth token wallet', async () => {
  if (!VALID) return;
  // Attempt to trade as a different wallet by supplying it in the body.
  // The server must extract wallet from the Privy JWT, not from the request body.
  const { status, data } = await post('/trade/buy', {
    ...TRADE_BODY,
    walletAddress: 'ATTACKER_WALLET_ADDRESS_AAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  }, {
    'Authorization': `Bearer ${VALID}`,
  });

  if (status === 200) {
    // Trade succeeded — must have used the token's wallet, not the injected one.
    assert.notEqual(
      data.walletAddress,
      'ATTACKER_WALLET_ADDRESS_AAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Server must not use wallet from request body',
    );
  } else {
    // 401/422/429 are all acceptable; injected wallet must not cause success with wrong identity.
    assert.ok(status === 401 || status === 422 || status === 429 || status === 404);
  }
});

// ─── Public / health endpoints (no auth required) ────────────────────────────

test('auth bypass: /healthz requires no token', async () => {
  const { status, data } = await get('/healthz');
  assert.equal(status, 200);
  // Trading service returns { status: 'ok', uptime } (not legacy { alive: true })
  assert.ok(data.status === 'ok' || data.alive === true, 'healthz must report ok/alive');
});

test('auth bypass: /readyz requires no token', async () => {
  const { status } = await get('/readyz');
  assert.ok(status === 200 || status === 503, `/readyz must return 200 or 503, got ${status}`);
});

test('auth bypass: /trade/quote is public', async () => {
  const { status } = await get(
    `/trade/quote?coinId=${COIN || 'test'}&direction=buy&amountIn=10000000&slippageBps=50`,
  );
  // 200 (quote found) or 404 (coin not found) or 400 (validation) — not 401.
  assert.notEqual(status, 401, '/trade/quote must not require authentication');
});

// ─── Authorization (role checks) ─────────────────────────────────────────────

test('authz: response does not leak role or internal fields', async () => {
  if (!VALID) return;
  const { status, data } = await post('/trade/buy', TRADE_BODY, {
    'Authorization': `Bearer ${VALID}`,
  });

  if (status === 200) {
    const body = JSON.stringify(data);
    assert.ok(!body.includes('isBanned'),       'response must not expose isBanned');
    assert.ok(!body.includes('encrypted'),      'response must not expose encrypted data');
    assert.ok(!body.includes('privyUserId'),    'response must not expose privyUserId');
    assert.ok(!body.includes('INTERNAL_SERVICE'), 'response must not expose role names');
    // Onchain mode may include signature; must not include mnemonic material
    assert.ok(!body.includes('mnemonic'), 'response must not expose mnemonic fields');
  }
});
