import Fastify from 'fastify';
import type { Redis } from 'ioredis';
import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';
import { extractBearerToken, extractIp } from '@funrun/shared';
import type { TradeRouter } from './trading/trade-router.js';
import type { TradeLogger } from './logger/trade.logger.js';
import type { IdempotencyStore } from './idempotency/store.js';
import type { AuthContext } from './types.js';
import { QuoteCache } from './quote/cache.js';
import { registerRequestId } from './middleware/request-id.js';
import { registerRateLimit, registerQuoteRateLimit } from './middleware/rate-limit.js';
import { registerIdempotency } from './middleware/idempotency.js';
import { registerTradeRoutes } from './routes/trade.js';
import { registerPlatformRoutes } from './routes/platform.js';
import type { CreateCoinOrchestrator } from './trading/create-coin-orchestrator.js';
import type { ConnectionPool } from './solana/connection-pool.js';
import type { Keypair } from '@solana/web3.js';
import { HTTP_PORT } from './constants.js';
import type { HealthChecker } from './monitoring/health-checker.js';
import {
  type RedisDependencyMode,
  RedisDependencyError,
  redisUnavailablePayload,
} from './config/redis-dependency.js';

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthContext;
  }
}

const NO_AUTH_ROUTES = new Set(['/healthz', '/readyz']);
const PUBLIC_ROUTES = new Set(['/trade/quote']);

function isPublicRoute(method: string, path: string): boolean {
  if (PUBLIC_ROUTES.has(path)) return true;
  if (path.startsWith('/market/')) return true;
  if (/^\/wallet\/[1-9A-HJ-NP-Za-km-z]{32,44}\/balance$/.test(path)) return true;
  if (method === 'GET' && /^\/profile\/[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(path)) return true;
  return false;
}

export interface TradingServer {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export function buildTradingServer(deps: {
  db: PrismaClient;
  redis: Redis;
  tradeRouter: TradeRouter;
  idempotency: IdempotencyStore;
  tradeLogger: TradeLogger;
  logger: Logger;
  verifyToken: (token: string, ip: string) => Promise<AuthContext | null>;
  healthChecker?: HealthChecker;
  redisDependencyMode?: RedisDependencyMode;
  requireTradeIdempotencyKey?: boolean;
  pool?: ConnectionPool;
  createCoinOrchestrator?: CreateCoinOrchestrator | null;
  treasuryKeypair?: Keypair;
  mnemonicEncryptionKey?: string;
  withdrawalsEnabled?: boolean;
}): TradingServer {
  const {
    db,
    redis,
    tradeRouter,
    idempotency,
    tradeLogger,
    logger,
    verifyToken,
    healthChecker,
    redisDependencyMode = 'degraded',
    requireTradeIdempotencyKey = false,
  } = deps;

  const quoteCache = new QuoteCache(redis, logger);
  const app = Fastify({ logger: false, trustProxy: true });

  registerRequestId(app);

  app.decorateRequest('auth', null as unknown as AuthContext);

  app.get('/healthz', { logLevel: 'silent' as never }, (_req, reply) => {
    reply.send({ status: 'ok', alive: true, uptime: process.uptime() });
  });

  app.get('/readyz', async (_req, reply) => {
    if (!healthChecker) {
      return reply.send({ status: 'ready' });
    }
    const result = await healthChecker.readiness();
    const code = result.ready ? 200 : 503;
    return reply.code(code).send({
      ready: result.ready,
      components: result.components,
    });
  });

  registerQuoteRateLimit(app, redis, logger, { redisMode: redisDependencyMode });

  app.addHook('preHandler', async (request, reply) => {
    const path = request.url.split('?')[0]!;

    if (NO_AUTH_ROUTES.has(path)) return;
    if (isPublicRoute(request.method, path)) return;

    const ip = extractIp(request);
    const token = extractBearerToken(request.headers['authorization']);

    if (!token) {
      return reply.code(401).send({
        error: 'UNAUTHORIZED',
        message: 'Missing or malformed Authorization header',
        requestId: request.requestId,
      });
    }

    try {
      const auth = await verifyToken(token, ip);
      if (!auth) {
        return reply.code(401).send({
          error: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
          requestId: request.requestId,
        });
      }
      request.auth = auth;
    } catch (err) {
      if (err instanceof RedisDependencyError) {
        return reply.code(503).send(redisUnavailablePayload(request.requestId));
      }
      throw err;
    }
  });

  registerRateLimit(app, redis, logger, { redisMode: redisDependencyMode });
  registerIdempotency(app, idempotency, { requireKey: requireTradeIdempotencyKey });
  registerTradeRoutes(app, { db, tradeRouter, idempotency, tradeLogger, quoteCache });

  if (deps.pool && deps.treasuryKeypair) {
    registerPlatformRoutes(app, {
      db,
      pool: deps.pool,
      createCoinOrchestrator: deps.createCoinOrchestrator ?? null,
      treasuryKeypair: deps.treasuryKeypair,
      logger,
      ...(deps.mnemonicEncryptionKey !== undefined
        ? { mnemonicEncryptionKey: deps.mnemonicEncryptionKey }
        : {}),
      ...(deps.withdrawalsEnabled !== undefined
        ? { withdrawalsEnabled: deps.withdrawalsEnabled }
        : {}),
    });
  }

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
