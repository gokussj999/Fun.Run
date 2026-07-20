/**
 * Fun.Run — Burst Buy Load Test (backend monolith)
 *
 * Endpoints:
 *   POST /coin/buy   (express rewrites also support /api/v1/trade/buy)
 *
 * Run:
 *   k6 run \
 *     -e BACKEND_URL=http://localhost:5000 \
 *     -e AUTH_TOKEN=<privy_access_token> \
 *     -e COIN_ID=7cc0f755e5a5475ca8345a062d5c2475 \
 *     -e RATE=50 \
 *     -e DURATION=60s \
 *     funrun-backend-burst-buy.k6.js
 *
 * Notes:
 * - Is test mein sab requests SAME AUTH_TOKEN ke saath aayenge (same user),
 *   is liye 429 rate-limit expected hai. Goal: backend smoothness + p95 latency.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const BACKEND_URL = __ENV.BACKEND_URL || 'http://localhost:5000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'REPLACE_WITH_PRIVY_TOKEN';
const COIN_ID = __ENV.COIN_ID || 'REPLACE_WITH_COIN_UUID';

const RATE = Number(__ENV.RATE || 20); // requests per second (approx via arrival-rate)
const DURATION = __ENV.DURATION || '60s';
const THINK_TIME_MS = Number(__ENV.THINK_TIME_MS || 0);

const tradeSuccess = new Counter('buy_success');
const tradeFailure = new Counter('buy_failure');
const rateLimited429 = new Counter('buy_429');
const buyLatency = new Trend('buy_latency_ms');
const overallOk = new Rate('buy_success_rate');

export const options = {
  scenarios: {
    buys_burst: {
      executor: 'constant-arrival-rate',
      rate: RATE,
      timeUnit: '1s',
      duration: DURATION,
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
  },
  thresholds: {
    buy_latency_ms: ['p(95)<3000'],
    buy_success_rate: ['rate>0.6'], // 429 expected due to single-user limiter
  },
};

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
  };
}

function payload() {
  // solAmountLamports = 0.01 - 0.02 SOL range
  const base = 10_000_000; // 0.01 SOL in lamports
  const extra = (__ITER % 10) * 1_000_000;
  return JSON.stringify({
    coinId: COIN_ID,
    solAmountLamports: String(base + extra),
    minTokensOut: '0',
    slippageBps: 500,
  });
}

export function setup() {
  const res = http.get(`${BACKEND_URL}/health`);
  if (res.status !== 200) {
    throw new Error(`Backend health failed: ${res.status} ${res.body}`);
  }
}

export default function () {
  const start = Date.now();
  const res = http.post(`${BACKEND_URL}/coin/buy`, payload(), { headers: headers() });
  const latency = Date.now() - start;
  buyLatency.add(latency);

  if (res.status === 429) {
    rateLimited429.add(1);
    overallOk.add(0);
    tradeFailure.add(1);
    return;
  }

  let ok = false;
  try {
    const body = JSON.parse(res.body);
    ok = res.status === 200 && body?.ok === true;
  } catch {
    ok = res.status === 200;
  }

  if (ok) {
    tradeSuccess.add(1);
    overallOk.add(1);
  } else {
    tradeFailure.add(1);
    overallOk.add(0);
  }

  check(res, { 'status 200 ok or 429': (r) => r.status === 200 || r.status === 429 });
  if (THINK_TIME_MS > 0) sleep(THINK_TIME_MS / 1000);
}

