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
  // IP is passed so the verifier can enforce shared IP abuse state.
  verifyToken: (token: string, ip: string) => Promise<AuthContext | null>;
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

    // Extract real client IP (trustProxy: true handles X-Forwarded-For).
    const ip = extractIp(request);

    // Extract bearer token — aligned with Auth Service's extractBearerToken():
    // case-insensitive scheme check, exactly two parts required.
    const token = extractBearerToken(request.headers['authorization']);

    if (!token) {
      return reply.code(401).send({
        error: 'UNAUTHORIZED',
        message: 'Missing or malformed Authorization header',
        requestId: request.requestId,
      });
    }

    // verifyToken handles: IP block check → Privy verify → profile upsert →
    // role check → IP failure tracking.  Returns null on any failure.
    const auth = await verifyToken(token, ip);
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Aligned with Auth Service's extractBearerToken() (services/auth/src/privy/verify.ts).
// Case-insensitive scheme, exactly two parts, non-empty token.
function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) return null;
  const parts = authorizationHeader.trim().split(' ');
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer' || !parts[1]) {
    return null;
  }
  return parts[1];
}

// Aligned with Auth Service's extractIp() (services/auth/src/middleware/authenticate.ts).
// Fastify's trustProxy:true populates request.ip from X-Forwarded-For automatically.
function extractIp(request: { ip: string; headers: Record<string, string | string[] | undefined> }): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() ?? request.ip;
  }
  return request.ip;
}
