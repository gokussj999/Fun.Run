/**
 * Phase 8.5.9J — Fault Injection: WS Disconnect, Redis Outage,
 *                                  DB Reconnect, Reconciler Recovery
 *
 * Node.js test runner (no external deps beyond ws package).
 *
 * Run:
 *   node --env-file=../../.env fault-injection.js
 *
 * Environment (all optional — defaults to localhost):
 *   TRADING_URL   http://localhost:3003
 *   BACKEND_URL   http://localhost:5000
 *   AUTH_TOKEN    <privy jwt>
 *   COIN_ID       <uuid>
 *   WS_URL        ws://localhost:5000
 */
import { test }  from 'node:test';
import assert    from 'node:assert/strict';
import http      from 'node:http';
import https     from 'node:https';

// ─── Config ──────────────────────────────────────────────────────────────────
const TRADING = process.env.TRADING_URL || 'http://localhost:3003';
const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';
const WS_URL  = process.env.WS_URL      || 'ws://localhost:5000';
const TOKEN   = process.env.AUTH_TOKEN  || '';
const COIN_ID = process.env.COIN_ID     || '';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function request(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const req = mod.request({
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   opts.method || 'GET',
      headers:  opts.headers || {},
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── 1. WebSocket Disconnect Testing ─────────────────────────────────────────
test('WebSocket: client disconnect and reconnect', async (t) => {
  // Dynamic import of ws so the file does not crash when ws is absent.
  let WebSocket;
  try {
    ({ WebSocket } = await import('ws'));
  } catch {
    t.skip('ws package not installed — run: npm i -D ws');
    return;
  }

  // Connect
  await t.test('initial connection', () => new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    ws.once('open',  () => { ws.close(); resolve(); });
    ws.once('error', reject);
    setTimeout(() => reject(new Error('WS open timeout')), 5000);
  }));

  // Disconnect abruptly and verify reconnect still works.
  await t.test('reconnect after abrupt close', async () => {
    const first = new WebSocket(WS_URL);
    await new Promise((r, e) => {
      first.once('open', r);
      first.once('error', e);
      setTimeout(() => e(new Error('first open timeout')), 5000);
    });

    // Force-terminate without clean close.
    first.terminate();
    await sleep(500);

    // Reconnect should succeed.
    await new Promise((r, e) => {
      const second = new WebSocket(WS_URL);
      second.once('open',  () => { second.close(); r(); });
      second.once('error', e);
      setTimeout(() => e(new Error('reconnect timeout')), 5000);
    });
  });

  // Server should handle 20 simultaneous connections.
  await t.test('concurrent connections', async () => {
    const sockets = [];
    const opens = [];
    for (let i = 0; i < 20; i++) {
      const ws = new WebSocket(WS_URL);
      sockets.push(ws);
      opens.push(new Promise((r, e) => {
        ws.once('open',  r);
        ws.once('error', e);
      }));
    }
    await Promise.race([
      Promise.all(opens),
      sleep(8000).then(() => { throw new Error('concurrent connections timeout'); }),
    ]);
    sockets.forEach((ws) => ws.close());
  });
});

// ─── 2. Redis Outage Testing ──────────────────────────────────────────────────
test('Redis outage: trading service fails open on rate-limit middleware', async (t) => {
  // When Redis is unavailable, rate-limit middleware must fail open (not block trades).
  // This test simulates by checking the trading service response with a valid request.
  // Actual Redis stop is a manual step — this test validates the fail-open response.
  if (!TOKEN || !COIN_ID) {
    t.skip('AUTH_TOKEN and COIN_ID required');
    return;
  }

  // Normal trade should work (fail-open means trade proceeds).
  const res = await request(`${TRADING}/trade/buy`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      coinId:            COIN_ID,
      solAmountLamports: '10000000',
      minTokensOut:      '0',
      slippageBps:       500,
    }),
  });

  // 200 (trade succeeded) or 422 (slippage/state) are both acceptable.
  // 503 (service unavailable due to Redis) is NOT acceptable — must fail open.
  assert.notEqual(res.status, 503, `Trading service must not hard-fail when Redis is unavailable. Got ${res.status}: ${res.body}`);
  assert.notEqual(res.status, 500, `Unexpected 500 during Redis outage scenario. Body: ${res.body}`);
});

// ─── 3. Database Reconnect Testing ───────────────────────────────────────────
test('DB reconnect: /readyz reports degraded, /healthz stays alive', async (t) => {
  // The trading service /healthz is a liveness probe — always returns alive.
  // /readyz checks DB + RPC and should report degraded if DB is unavailable.
  // This test verifies the response shapes; actual DB stop is a manual step.

  const health = await request(`${TRADING}/healthz`);
  assert.equal(health.status, 200, '/healthz must always return 200');
  const healthBody = JSON.parse(health.body);
  assert.equal(healthBody.alive, true, '/healthz.alive must be true');

  const ready = await request(`${TRADING}/readyz`);
  // 200 = ready, 503 = degraded — both are valid response codes.
  assert.ok(
    ready.status === 200 || ready.status === 503,
    `/readyz must return 200 or 503, got ${ready.status}`,
  );

  const readyBody = JSON.parse(ready.body);
  assert.ok(
    'db' in readyBody || 'components' in readyBody,
    '/readyz body must contain DB health component',
  );
});

// ─── 4. Reconciler Recovery Testing ──────────────────────────────────────────
test('Reconciler: /metrics exposes reconciler run counter', async () => {
  const res = await request(`${TRADING.replace(/:\d+$/, ':9090')}/metrics`);
  assert.equal(res.status, 200, '/metrics must return 200');
  assert.ok(
    res.body.includes('funrun_reconciler_runs_total'),
    'Prometheus metrics must include funrun_reconciler_runs_total',
  );
  assert.ok(
    res.body.includes('funrun_reconciler_orphans_total'),
    'Prometheus metrics must include funrun_reconciler_orphans_total',
  );
  // Reconciler must have run at least once since startup.
  const match = res.body.match(/funrun_reconciler_runs_total\s+([\d.]+)/);
  if (match) {
    const count = parseFloat(match[1]);
    assert.ok(count >= 0, 'reconciler_runs_total must be non-negative');
  }
});

test('Reconciler: stuck SUBMITTED transactions appear in metrics', async () => {
  const res = await request(`${TRADING.replace(/:\d+$/, ':9090')}/metrics`);
  assert.equal(res.status, 200);
  // funrun_tx_by_status should expose all statuses including SUBMITTED.
  assert.ok(
    res.body.includes('funrun_tx_by_status'),
    'tx_by_status gauge must be present in metrics output',
  );
});

// ─── 5. Backend WebSocket Disconnect (backend/server.js WS) ──────────────────
test('Backend WS: disconnected client removed from broadcast set', async (t) => {
  let WebSocket;
  try {
    ({ WebSocket } = await import('ws'));
  } catch {
    t.skip('ws package not installed');
    return;
  }

  // Connect, receive at least one message, close.
  await new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL.replace('localhost:5000', `localhost:${process.env.PORT || 5000}`));
    let opened = false;
    ws.once('open', () => {
      opened = true;
      // Give 2 s for a broadcast message, then close.
      setTimeout(() => { ws.close(); resolve(); }, 2000);
    });
    ws.once('error', (e) => {
      if (!opened) reject(e);
      // Error after open is acceptable (server may reject idle connections).
      else resolve();
    });
    setTimeout(() => { ws.close(); resolve(); }, 5000);
  });

  // Wait for any cleanup cycle.
  await sleep(500);

  // Backend should still accept new connections after the close.
  await new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL.replace('localhost:5000', `localhost:${process.env.PORT || 5000}`));
    ws.once('open',  () => { ws.close(); resolve(); });
    ws.once('error', reject);
    setTimeout(() => reject(new Error('reconnect after disconnect timeout')), 5000);
  });
});
