import Fastify from 'fastify';
import type Redis from 'ioredis';
import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';
import type { TradeExecutor } from './trading/executor.js';
import type { TradeLogger } from './logger/trade.logger.js';
import type { IdempotencyStore } from './idempotency/store.js';
import type { AuthContext } from './types.js';
import { QuoteCache } from './quote/cache.js';
import { registerRequestId } from './middleware/request-id.js';
import { registerRateLimit } from './middleware/rate-limit.js';
import { registerIdempotency } from './middleware/idempotency.js';
import { registerTradeRoutes } from './routes/trade.js';
import { HTTP_PORT } from './constants.js';

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthContext;
  }
}

// Routes that bypass authentication entirely.
const NO_AUTH_ROUTES = new Set(['/healthz', '/readyz']);

// Routes that are public (no token required) but still tracked.
const PUBLIC_ROUTES = new Set(['/trade/quote']);

export interface TradingServer {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export function buildTradingServer(deps: {
  db: PrismaClient;
  redis: Redis;
  executor: TradeExecutor;
  idempotency: IdempotencyStore;
  tradeLogger: TradeLogger;
  logger: Logger;
  verifyToken: (token: string) => Promise<AuthContext | null>;
}): TradingServer {
  const { db, redis, executor, idempotency, tradeLogger, logger, verifyToken } = deps;

  const quoteCache = new QuoteCache(redis, logger);

  const app = Fastify({ logger: false, trustProxy: true });

  // ── 1. Request ID (onRequest — runs first for every request) ─────────────────
  registerRequestId(app);

  // ── 2. Auth decorator ─────────────────────────────────────────────────────────
  app.decorateRequest('auth', null);

  // ── 3. Health routes (no auth, no rate limit) ─────────────────────────────────
  app.get('/healthz', { logLevel: 'silent' as never }, (_req, reply) => {
    reply.send({ status: 'ok', uptime: process.uptime() });
  });

  app.get('/readyz', (_req, reply) => {
    reply.send({ status: 'ready' });
  });

  // ── 4. Auth (preHandler #1) ───────────────────────────────────────────────────
  // Skip health routes and public quote route.
  app.addHook('preHandler', async (request, reply) => {
    const path = request.url.split('?')[0]!;

    if (NO_AUTH_ROUTES.has(path)) return;
    if (PUBLIC_ROUTES.has(path)) return;

    const authHeader = request.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    if (!token) {
      return reply.code(401).send({
        error: 'UNAUTHORIZED',
        message: 'Missing Bearer token',
        requestId: request.requestId,
      });
    }

    const auth = await verifyToken(token);
    if (!auth) {
      return reply.code(401).send({
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
        requestId: request.requestId,
      });
    }

    request.auth = auth;
  });

  // ── 5. Rate limit (preHandler #2 — after auth, before idempotency) ────────────
  // Requires request.auth.walletAddress set by the auth hook above.
  // Only applies to POST /trade/buy and POST /trade/sell.
  // Fails open if Redis is unavailable.
  registerRateLimit(app, redis, logger);

  // ── 6. Idempotency (preHandler #3) ───────────────────────────────────────────
  registerIdempotency(app, idempotency);

  // ── 7. Trade routes ───────────────────────────────────────────────────────────
  registerTradeRoutes(app, { db, executor, idempotency, tradeLogger, quoteCache });

  // ── 8. Global error handler ───────────────────────────────────────────────────
  app.setErrorHandler((err, request, reply) => {
    logger.error({ err, requestId: request.requestId }, 'Unhandled route error');
    reply.code(500).send({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId: request.requestId,
    });
  });

  return {
    start: async () => {
      await app.listen({ port: HTTP_PORT, host: '0.0.0.0' });
      logger.info(`Trading service listening on :${HTTP_PORT}`);
    },
    stop: async () => {
      await app.close();
      logger.info('Trading service stopped');
    },
  };
}
