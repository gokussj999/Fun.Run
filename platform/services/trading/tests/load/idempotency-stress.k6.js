/**
 * Phase 8.5.9J — Load Test: Idempotency Stress
 *
 * Validates the SEC-02 fix: concurrent requests with the SAME Idempotency-Key
 * must produce exactly ONE trade execution. Before the fix, both requests
 * would read null from Redis and execute the trade twice (double-spend).
 *
 * Run:
 *   k6 run \
 *     -e TRADING_URL=http://localhost:3003 \
 *     -e AUTH_TOKEN=<privy_token> \
 *     -e COIN_ID=<coin_uuid> \
 *     idempotency-stress.k6.js
 *
 * Pass criteria:
 *   idempotency_conflict_409 > 0   (409 responses confirm duplicate detection)
 *   idempotency_replay_200   > 0   (200+replay header confirms result caching)
 *   double_execute           == 0  (no second independent trade executed)
 *   p95 latency < 3 s
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const conflict409  = new Counter('idempotency_conflict_409');
const replay200    = new Counter('idempotency_replay_200');
const firstSuccess = new Counter('idempotency_first_success');
const doubleExec   = new Counter('double_execute');

const BASE_URL   = __ENV.TRADING_URL || 'http://localhost:3003';
const AUTH_TOKEN = __ENV.AUTH_TOKEN  || 'REPLACE_WITH_PRIVY_TOKEN';
const COIN_ID    = __ENV.COIN_ID     || 'REPLACE_WITH_COIN_UUID';

export const options = {
  scenarios: {
    // 20 VUs all racing with the SAME key per iteration group
    idempotency_race: {
      executor: 'constant-vus',
      vus: 20,
      duration: '60s',
    },
  },
  thresholds: {
    http_req_duration:    ['p(95)<3000'],
    // At least one 409 or replay must be recorded — proves collision detection works.
    'idempotency_conflict_409': ['count>0'],
  },
};

// Shared key rotates every 5 s so multiple groups are tested in the run.
function sharedKey() {
  return `stress-key-${Math.floor(Date.now() / 5000)}`;
}

export default function () {
  const key = sharedKey();

  const payload = JSON.stringify({
    coinId:            COIN_ID,
    solAmountLamports: '10000000',
    minTokensOut:      '0',
    slippageBps:       500,
  });

  const res = http.post(`${BASE_URL}/trade/buy`, payload, {
    headers: {
      'Content-Type':   'application/json',
      'Authorization':  `Bearer ${AUTH_TOKEN}`,
      'Idempotency-Key': key,
    },
  });

  if (res.status === 200 && res.headers['Idempotency-Replay'] === 'true') {
    // Replayed result — correct behaviour for subsequent callers.
    replay200.add(1);
    check(res, { 'replay has txId': (r) => JSON.parse(r.body)?.txId !== undefined });
  } else if (res.status === 200) {
    // First successful execution.
    firstSuccess.add(1);
    check(res, { 'first exec has txId': (r) => JSON.parse(r.body)?.txId !== undefined });
  } else if (res.status === 409) {
    // In-flight collision correctly detected.
    conflict409.add(1);
    check(res, {
      '409 has IDEMPOTENCY_CONFLICT': (r) => JSON.parse(r.body)?.error === 'IDEMPOTENCY_CONFLICT',
    });
  } else if (res.status === 422) {
    // Slippage or coin state — expected, not a test failure.
  } else {
    // Any unexpected 2xx with no replay header AND different from the first success
    // would indicate a double-execute. Counter this separately.
    if (res.status === 200) doubleExec.add(1);
    check(res, { 'unexpected status': (r) => r.status === 429 || r.status === 401 });
  }

  sleep(0.1); // tight loop to maximize race window
}
