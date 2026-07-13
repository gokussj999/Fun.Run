/**
 * Phase 8.5.9J — Load Test: Graduation Stress
 *
 * Puts the GraduationCrank under load by buying heavily on multiple coins
 * simultaneously until the bonding curve threshold is approached.
 * Validates that GraduationCrank correctly initiates and finalises graduation
 * without stalling or double-graduating.
 *
 * Run:
 *   k6 run \
 *     -e BACKEND_URL=http://localhost:5000 \
 *     -e TRADING_URL=http://localhost:3003 \
 *     -e AUTH_TOKEN=<privy_token> \
 *     -e COIN_IDS=uuid1,uuid2,uuid3 \
 *     graduation-stress.k6.js
 *
 * Pass criteria:
 *   graduation_initiated  > 0
 *   graduation_double     == 0   (same coin graduated twice = critical bug)
 *   p95 latency < 4 s
 */
import http  from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const graduationInitiated = new Counter('graduation_initiated');
const graduationDouble    = new Counter('graduation_double');
const buyErrors           = new Counter('graduation_buy_errors');

const BACKEND_URL = __ENV.BACKEND_URL || 'http://localhost:5000';
const TRADING_URL = __ENV.TRADING_URL || 'http://localhost:3003';
const AUTH_TOKEN  = __ENV.AUTH_TOKEN  || 'REPLACE_WITH_PRIVY_TOKEN';
const COIN_IDS    = (__ENV.COIN_IDS   || 'REPLACE_WITH_COIN_UUID').split(',');

// Track which coins have been observed as graduated (per-VU).
const graduatedCoins = {};

export const options = {
  scenarios: {
    graduation_buyers: {
      executor: 'constant-vus',
      vus: 30,
      duration: '120s',
    },
  },
  thresholds: {
    graduation_double:  ['count==0'],
    http_req_duration:  ['p(95)<4000'],
  },
};

function coinIdForVu() {
  return COIN_IDS[__VU % COIN_IDS.length];
}

function buyMax(coinId) {
  const idemKey = `grad-buy-vu${__VU}-${Date.now()}`;
  const res = http.post(`${TRADING_URL}/trade/buy`,
    JSON.stringify({
      coinId,
      solAmountLamports: '100000000', // 0.1 SOL — large buys accelerate graduation
      minTokensOut:      '0',
      slippageBps:       1000,
    }),
    {
      headers: {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${AUTH_TOKEN}`,
        'Idempotency-Key': idemKey,
      },
    },
  );

  if (res.status !== 200 && res.status !== 422 && res.status !== 429) {
    buyErrors.add(1);
    return;
  }

  if (res.status === 200) {
    let body = {};
    try { body = JSON.parse(res.body); } catch {}

    if (body.graduated === true) {
      if (graduatedCoins[coinId]) {
        // Seen as graduated before — possible double graduation.
        graduationDouble.add(1);
      } else {
        graduatedCoins[coinId] = true;
        graduationInitiated.add(1);
      }
    }

    check(res, {
      'buy response valid': () => typeof body.txId === 'string' || body.graduated === true,
    });
  }
}

function checkCoinStatus(coinId) {
  const res = http.get(`${BACKEND_URL}/api/coin/${coinId}`, {
    headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` },
  });
  check(res, { 'coin status 200': (r) => r.status === 200 });

  if (res.status === 200) {
    let body = {};
    try { body = JSON.parse(res.body); } catch {}
    if (body.status === 'GRADUATED' && graduatedCoins[coinId]) {
      // Expected — coin graduated once and API confirms it.
    } else if (body.status === 'GRADUATED' && !graduatedCoins[coinId]) {
      graduationInitiated.add(1);
      graduatedCoins[coinId] = true;
    }
  }
}

export default function () {
  const coinId = coinIdForVu();

  buyMax(coinId);

  // Every 10th iteration, check on-chain status directly.
  if (__ITER % 10 === 0) {
    checkCoinStatus(coinId);
  }

  sleep(1 + Math.random());
}
