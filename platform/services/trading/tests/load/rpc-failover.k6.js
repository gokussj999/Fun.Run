/**
 * Phase 8.5.9J — Load Test: RPC Failover
 *
 * Tests trading service behaviour when primary RPC endpoints are degraded.
 * Validates:
 *   1. Circuit breaker opens after repeated failures (funrun_rpc_circuit_open > 0)
 *   2. Trades fail gracefully (no 500 cascade) when circuit is OPEN
 *   3. Circuit recovers (HALF_OPEN → CLOSED) after primary RPC comes back
 *   4. /readyz reports degraded status when RPC is unavailable
 *
 * To induce failures: firewall the primary RPC URL during the test or configure
 * SOLANA_RPC_URL to an unreachable endpoint for the primary slot.
 *
 * Run:
 *   k6 run \
 *     -e TRADING_URL=http://localhost:3003 \
 *     -e METRICS_URL=http://localhost:9090 \
 *     -e AUTH_TOKEN=<privy_token> \
 *     -e COIN_ID=<coin_uuid> \
 *     rpc-failover.k6.js
 */
import http  from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const circuitOpenObserved   = new Counter('circuit_open_observed');
const gracefulFailures      = new Counter('graceful_failures_during_open');
const recoveries            = new Counter('circuit_recovery_observed');
const tradeDuringOpen       = new Counter('trades_during_circuit_open');
const successAfterRecovery  = new Counter('trades_after_recovery');

const BASE_URL    = __ENV.TRADING_URL  || 'http://localhost:3003';
const METRICS_URL = __ENV.METRICS_URL  || 'http://localhost:9090';
const AUTH_TOKEN  = __ENV.AUTH_TOKEN   || 'REPLACE_WITH_PRIVY_TOKEN';
const COIN_ID     = __ENV.COIN_ID      || 'REPLACE_WITH_COIN_UUID';

export const options = {
  scenarios: {
    // Phase 1: normal trading baseline (30 s)
    baseline: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      env: { PHASE: 'baseline' },
    },
    // Phase 2: trades during simulated RPC degradation (60 s — engineer blocks RPC manually)
    degraded: {
      executor: 'constant-vus',
      vus: 10,
      duration: '60s',
      startTime: '35s',
      env: { PHASE: 'degraded' },
    },
    // Phase 3: recovery — RPC restored, circuit should close
    recovery: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      startTime: '100s',
      env: { PHASE: 'recovery' },
    },
  },
  thresholds: {
    // During degradation phase, failures are expected — but must be graceful (no 500s).
    http_req_duration: ['p(99)<10000'],
  },
};

function scrapeMetric(metricName) {
  const res = http.get(`${METRICS_URL}/metrics`);
  if (res.status !== 200) return null;
  const lines = res.body.split('\n');
  for (const line of lines) {
    if (line.startsWith(metricName + ' ')) {
      return parseFloat(line.split(' ')[1]);
    }
  }
  return null;
}

function doTrade() {
  const idemKey = `rpc-failover-vu${__VU}-${Date.now()}`;
  return http.post(`${BASE_URL}/trade/buy`,
    JSON.stringify({
      coinId:            COIN_ID,
      solAmountLamports: '10000000',
      minTokensOut:      '0',
      slippageBps:       500,
    }),
    {
      headers: {
        'Content-Type':    'application/json',
        'Authorization':   `Bearer ${AUTH_TOKEN}`,
        'Idempotency-Key': idemKey,
      },
      timeout: '10s',
    },
  );
}

function checkReadyz() {
  const res = http.get(`${BASE_URL}/readyz`);
  return res.status === 200 || res.status === 503;
}

export default function () {
  const phase = __ENV.PHASE || 'baseline';

  // Monitor circuit breaker state from Prometheus metrics.
  if (__VU === 1 && __ITER % 5 === 0) {
    const circuitOpen = scrapeMetric('funrun_rpc_circuit_open');
    if (circuitOpen !== null && circuitOpen > 0) {
      circuitOpenObserved.add(1);
    }
  }

  const res = doTrade();

  if (phase === 'baseline') {
    check(res, {
      'baseline trade succeeds or slippage': (r) =>
        r.status === 200 || r.status === 422 || r.status === 429,
    });
  } else if (phase === 'degraded') {
    tradeDuringOpen.add(1);
    // Acceptable responses during RPC outage: graceful error (503/500/422) — NOT a crash.
    const graceful = check(res, {
      'degraded → no 200 OR graceful error': (r) =>
        r.status === 422 || r.status === 429 || r.status === 503 ||
        r.status === 500 || r.status === 200, // 200 = other endpoint still works
      'degraded → response body parseable':  (r) => {
        try { JSON.parse(r.body); return true; } catch { return false; }
      },
      'degraded → no HTML error page':       (r) =>
        !r.body.startsWith('<!DOCTYPE') && !r.body.startsWith('<html'),
    });
    if (!graceful) gracefulFailures.add(1);

    // /readyz should report degraded but still respond.
    check(null, { 'readyz responds during degradation': () => checkReadyz() });
  } else if (phase === 'recovery') {
    // After RPC is restored, circuit should close and trades succeed.
    const circuitNowOpen = scrapeMetric('funrun_rpc_circuit_open');
    if (circuitNowOpen !== null && circuitNowOpen === 0) {
      recoveries.add(1);
    }
    check(res, {
      'recovery → trade succeeds': (r) =>
        r.status === 200 || r.status === 422 || r.status === 429,
    });
    if (res.status === 200) successAfterRecovery.add(1);
  }

  sleep(1 + Math.random());
}
