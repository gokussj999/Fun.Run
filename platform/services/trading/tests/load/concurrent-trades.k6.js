/**
 * Phase 8.5.9J — Load Test: Concurrent Buy & Sell
 *
 * Run:
 *   k6 run \
 *     -e TRADING_URL=http://localhost:3003 \
 *     -e AUTH_TOKEN=<privy_token> \
 *     -e COIN_ID=<coin_uuid> \
 *     concurrent-trades.k6.js
 *
 * Scenarios:
 *   concurrent_buys       — 50 VUs buying for 60 s
 *   concurrent_sells      — 25 VUs selling for 60 s (after buys build holdings)
 *   rate_limit_burst      — 120 req/min against one wallet (2x the 60/min limit)
 *
 * Pass criteria:
 *   trade_success_rate > 80 %   (allows for expected 429s and slippage rejections)
 *   p95 buy / sell latency < 3 s
 *   p99 overall latency   < 5 s
 */
import http   from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const tradeErrors  = new Counter('trade_errors');
const tradeSuccess = new Counter('trade_successes');
const tradeRate    = new Rate('trade_success_rate');
const buyLatency   = new Trend('buy_latency_ms');
const sellLatency  = new Trend('sell_latency_ms');
const rateLimited  = new Counter('rate_limit_429s');

const BASE_URL   = __ENV.TRADING_URL || 'http://localhost:3003';
const AUTH_TOKEN = __ENV.AUTH_TOKEN  || 'REPLACE_WITH_PRIVY_TOKEN';
const COIN_ID    = __ENV.COIN_ID     || 'REPLACE_WITH_COIN_UUID';

export const options = {
  scenarios: {
    concurrent_buys: {
      executor: 'constant-vus',
      vus: 50,
      duration: '60s',
      env: { OPERATION: 'buy' },
    },
    concurrent_sells: {
      executor: 'constant-vus',
      vus: 25,
      duration: '60s',
      startTime: '65s',
      env: { OPERATION: 'sell' },
    },
    rate_limit_burst: {
      executor: 'constant-arrival-rate',
      rate: 120,
      timeUnit: '1m',
      duration: '30s',
      preAllocatedVUs: 20,
      startTime: '135s',
      env: { OPERATION: 'buy' },
    },
  },
  thresholds: {
    trade_success_rate: ['rate>0.80'],
    buy_latency_ms:     ['p(95)<3000'],
    sell_latency_ms:    ['p(95)<3000'],
    http_req_duration:  ['p(99)<5000'],
    http_req_failed:    ['rate<0.20'],
  },
};

function headers(idemKey) {
  const h = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
  };
  if (idemKey) h['Idempotency-Key'] = idemKey;
  return h;
}

function doBuy() {
  const idemKey = `k6-buy-vu${__VU}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const payload = JSON.stringify({
    coinId:            COIN_ID,
    solAmountLamports: String(10_000_000 + (__VU % 10) * 1_000_000),
    minTokensOut:      '0',
    slippageBps:       500,
  });

  const start = Date.now();
  const res = http.post(`${BASE_URL}/trade/buy`, payload, { headers: headers(idemKey) });
  buyLatency.add(Date.now() - start);

  if (res.status === 429) { rateLimited.add(1); return; }

  let body = {};
  try { body = JSON.parse(res.body); } catch {}

  const ok = check(res, {
    'buy → 200':          (r) => r.status === 200,
    'buy has txId':       () => typeof body.txId === 'string',
    'buy has solAmount':  () => typeof body.solAmount === 'string',
    'buy has tokenAmount':() => typeof body.tokenAmount === 'string',
    'no mnemonic leak':   () => JSON.stringify(body).indexOf('mnemonic') === -1,
    'no key leak':        () => JSON.stringify(body).indexOf('encrypted') === -1,
  });

  ok ? tradeSuccess.add(1) : tradeErrors.add(1);
  tradeRate.add(ok ? 1 : 0);
}

function doSell() {
  const idemKey = `k6-sell-vu${__VU}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const payload = JSON.stringify({
    coinId:         COIN_ID,
    tokenAmountRaw: String(500_000 + (__VU % 5) * 100_000),
    minSolOut:      '0',
    slippageBps:    500,
  });

  const start = Date.now();
  const res = http.post(`${BASE_URL}/trade/sell`, payload, { headers: headers(idemKey) });
  sellLatency.add(Date.now() - start);

  if (res.status === 429) { rateLimited.add(1); return; }

  let body = {};
  try { body = JSON.parse(res.body); } catch {}

  const ok = check(res, {
    'sell → 200':        (r) => r.status === 200,
    'sell has txId':     () => typeof body.txId === 'string',
    'no mnemonic leak':  () => JSON.stringify(body).indexOf('mnemonic') === -1,
  });

  ok ? tradeSuccess.add(1) : tradeErrors.add(1);
  tradeRate.add(ok ? 1 : 0);
}

export function setup() {
  // Verify service is reachable before starting load.
  const res = http.get(`${BASE_URL}/healthz`);
  if (res.status !== 200) {
    throw new Error(`Trading service not ready: ${res.status} ${res.body}`);
  }
}

export default function () {
  const op = __ENV.OPERATION || 'buy';
  if (op === 'sell') doSell(); else doBuy();
  sleep(0.5 + Math.random() * 0.5); // 0.5–1 s think time
}
