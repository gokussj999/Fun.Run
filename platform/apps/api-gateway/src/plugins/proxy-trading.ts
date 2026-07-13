import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import type { AppConfig } from '@funrun/config';

/** Request headers forwarded to the trading service unchanged. */
const FORWARD_REQUEST_HEADERS = [
  'authorization',
  'idempotency-key',
  'content-type',
] as const;

/** Response headers replayed to the API client. */
const FORWARD_RESPONSE_HEADERS = [
  'idempotency-replay',
  'content-type',
] as const;

async function proxyTradingRequest(
  request: FastifyRequest,
  reply: FastifyReply,
  upstreamBase: string,
  upstreamPath: string,
): Promise<void> {
  const base = upstreamBase.replace(/\/$/, '');
  const query = request.url.includes('?') ? request.url.slice(request.url.indexOf('?')) : '';
  const targetUrl = `${base}${upstreamPath}${query}`;

  const headers: Record<string, string> = {};
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers[name];
    if (typeof value === 'string' && value.length > 0) {
      headers[name] = value;
    }
  }

  const requestId = request.headers['x-request-id'];
  if (typeof requestId === 'string' && requestId.length > 0) {
    headers['x-request-id'] = requestId;
  }

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = JSON.stringify(request.body ?? {});
  }

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(targetUrl, init);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'upstream unreachable';
    return reply.code(502).send({
      success: false,
      error: { code: 'UPSTREAM_UNAVAILABLE', message },
      timestamp: new Date().toISOString(),
    });
  }

  const rawBody = await upstreamRes.text();
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstreamRes.headers.get(name);
    if (value) {
      reply.header(name, value);
    }
  }

  if (!rawBody) {
    return reply.code(upstreamRes.status).send();
  }

  try {
    return reply.code(upstreamRes.status).send(JSON.parse(rawBody) as unknown);
  } catch {
    return reply.code(upstreamRes.status).send(rawBody);
  }
}

/**
 * Sprint 1 Task 14 + Sprint 7 — Proxy `/api/v1/trade/*` and platform routes
 * to the trading service. Forwards Authorization and Idempotency-Key headers.
 */
export async function registerTradingProxy(
  app: FastifyInstance,
  config: AppConfig,
): Promise<void> {
  const upstream = config.TRADING_SERVICE_URL;

  // ── Trade ──────────────────────────────────────────────────────────────────
  app.post('/api/v1/trade/buy', async (request, reply) => {
    await proxyTradingRequest(request, reply, upstream, '/trade/buy');
  });

  app.post('/api/v1/trade/sell', async (request, reply) => {
    await proxyTradingRequest(request, reply, upstream, '/trade/sell');
  });

  app.get('/api/v1/trade/quote', { config: { skipAuth: true } }, async (request, reply) => {
    await proxyTradingRequest(request, reply, upstream, '/trade/quote');
  });

  // ── Market (public) ────────────────────────────────────────────────────────
  app.get('/api/v1/market/sol-price', { config: { skipAuth: true } }, async (request, reply) => {
    await proxyTradingRequest(request, reply, upstream, '/market/sol-price');
  });

  app.get('/api/v1/market/coins', { config: { skipAuth: true } }, async (request, reply) => {
    await proxyTradingRequest(request, reply, upstream, '/market/coins');
  });

  app.get('/api/v1/market/coins/:id', { config: { skipAuth: true } }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await proxyTradingRequest(request, reply, upstream, `/market/coins/${id}`);
  });

  app.get('/api/v1/market/coins/:id/candles', { config: { skipAuth: true } }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await proxyTradingRequest(request, reply, upstream, `/market/coins/${id}/candles`);
  });

  // ── Profile & wallet reads ─────────────────────────────────────────────────
  app.get('/api/v1/profile/:wallet', { config: { skipAuth: true } }, async (request, reply) => {
    const { wallet } = request.params as { wallet: string };
    await proxyTradingRequest(request, reply, upstream, `/profile/${wallet}`);
  });

  app.get('/api/v1/wallet/:wallet/balance', { config: { skipAuth: true } }, async (request, reply) => {
    const { wallet } = request.params as { wallet: string };
    await proxyTradingRequest(request, reply, upstream, `/wallet/${wallet}/balance`);
  });

  // ── Mutations (auth enforced by gateway auth plugin) ───────────────────────
  app.post('/api/v1/coins', async (request, reply) => {
    await proxyTradingRequest(request, reply, upstream, '/coins');
  });

  app.post('/api/v1/wallet/withdraw', async (request, reply) => {
    await proxyTradingRequest(request, reply, upstream, '/wallet/withdraw');
  });

  app.post('/api/v1/rewards/claim', async (request, reply) => {
    await proxyTradingRequest(request, reply, upstream, '/rewards/claim');
  });

  app.post('/api/v1/referral/bind', async (request, reply) => {
    await proxyTradingRequest(request, reply, upstream, '/referral/bind');
  });

  app.post('/api/v1/wallet/reveal-mnemonic', async (request, reply) => {
    await proxyTradingRequest(request, reply, upstream, '/wallet/reveal-mnemonic');
  });
}
