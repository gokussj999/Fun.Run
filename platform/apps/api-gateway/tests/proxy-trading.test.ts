import http from 'node:http';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';

import { registerTradingProxy } from '../src/plugins/proxy-trading.js';

interface CapturedRequest {
  method: string;
  url: string;
  headers: http.IncomingHttpHeaders;
  body: string;
}

function startMockTradingServer(): Promise<{
  url: string;
  captured: CapturedRequest[];
  close: () => Promise<void>;
}> {
  const captured: CapturedRequest[] = [];

  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      captured.push({
        method: req.method ?? 'GET',
        url: req.url ?? '/',
        headers: req.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      });

      if (req.url?.startsWith('/market/coins')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, coins: [{ id: 'c1', name: 'Test' }], hasMore: false }));
        return;
      }

      if (req.url?.startsWith('/profile/')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, profile: { wallet: 'abc', runBalance: 1.5 } }));
        return;
      }

      if (req.url === '/wallet/withdraw') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'idempotency-replay': 'false' });
        res.end(JSON.stringify({ ok: true, amount: 0.5 }));
        return;
      }

      if (req.url?.startsWith('/trade/buy')) {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'idempotency-replay': 'false',
        });
        res.end(JSON.stringify({
          txId: 'cltx_mock_1',
          signature: 'MockSigBase581234567890abcdefghijklmnop',
          status: 'SUBMITTED',
          mode: 'onchain',
          coinId: 'coin-1',
          tradeType: 'BUY',
          requestId: 'req-mock',
        }));
        return;
      }

      if (req.url?.startsWith('/trade/quote')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ coinId: 'coin-1', amountOut: '100', requestId: 'q1' }));
        return;
      }

      res.writeHead(404).end();
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to bind mock trading server'));
        return;
      }
      resolve({
        url: `http://127.0.0.1:${addr.port}`,
        captured,
        close: () =>
          new Promise<void>((res, rej) => {
            server.close((err) => (err ? rej(err) : res()));
          }),
      });
    });
  });
}

describe('Sprint 1 Task 15 — trading proxy', () => {
  let mock: Awaited<ReturnType<typeof startMockTradingServer>>;
  let app: ReturnType<typeof Fastify>;

  beforeAll(async () => {
    mock = await startMockTradingServer();
    app = Fastify({ logger: false });
    await registerTradingProxy(app, {
      TRADING_SERVICE_URL: mock.url,
    } as never);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await mock.close();
  });

  it('proxies POST /api/v1/trade/buy with auth and idempotency headers', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/trade/buy',
      headers: {
        authorization: 'Bearer test-jwt-token',
        'idempotency-key': 'idem-proxy-test-12345678',
        'x-request-id': 'req-proxy-1',
        'content-type': 'application/json',
      },
      payload: {
        coinId: 'coin-1',
        solAmountLamports: '10000000',
        minTokensOut: '0',
        slippageBps: 500,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { signature?: string; mode?: string };
    expect(body.signature).toBeTruthy();
    expect(body.mode).toBe('onchain');
    expect(res.headers['idempotency-replay']).toBe('false');

    const upstream = mock.captured.at(-1);
    expect(upstream?.method).toBe('POST');
    expect(upstream?.url).toBe('/trade/buy');
    expect(upstream?.headers.authorization).toBe('Bearer test-jwt-token');
    expect(upstream?.headers['idempotency-key']).toBe('idem-proxy-test-12345678');
    expect(upstream?.headers['x-request-id']).toBe('req-proxy-1');
  });

  it('proxies GET /api/v1/trade/quote query string', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/trade/quote?coinId=coin-1&direction=buy&amountIn=10000000&slippageBps=50',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { amountOut?: string };
    expect(body.amountOut).toBe('100');

    const upstream = mock.captured.at(-1);
    expect(upstream?.method).toBe('GET');
    expect(upstream?.url).toContain('/trade/quote?');
    expect(upstream?.url).toContain('coinId=coin-1');
  });

  it('proxies GET /api/v1/market/coins to trading /market/coins', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/market/coins?page=0&limit=50',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { coins: { id: string }[] };
    expect(body.coins[0]?.id).toBe('c1');
    expect(mock.captured.at(-1)?.url).toBe('/market/coins?page=0&limit=50');
  });

  it('proxies GET /api/v1/profile/:wallet', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/profile/WalletPubkey123456789012345678901234567890',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { profile: { runBalance: number } };
    expect(body.profile.runBalance).toBe(1.5);
  });

  it('proxies POST /api/v1/wallet/withdraw with auth header', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/wallet/withdraw',
      headers: {
        authorization: 'Bearer test-jwt',
        'idempotency-key': 'withdraw-key-12345678',
        'content-type': 'application/json',
      },
      payload: { wallet: 'w1', destination: 'dest', amount: 0.5 },
    });

    expect(res.statusCode).toBe(200);
    const last = mock.captured.at(-1);
    expect(last?.url).toBe('/wallet/withdraw');
    expect(last?.headers.authorization).toBe('Bearer test-jwt');
  });
});
