import Fastify, { type FastifyInstance } from 'fastify';

import { getContainer } from './container.js';
import { registerCors } from './plugins/cors.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { registerHelmet } from './plugins/helmet.js';
import { registerRateLimit } from './plugins/rate-limit.js';
import { registerRequestId } from './plugins/request-id.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerTradingProxy } from './plugins/proxy-trading.js';
import { authPlugin } from '@funrun/auth';

export async function buildApp(): Promise<FastifyInstance> {
  const { config, logger, db, redis } = getContainer();

  const app: FastifyInstance = Fastify({
    logger: false,
    trustProxy: true,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
    ajv: {
      customOptions: {
        strict: 'log',
        keywords: ['kind', 'modifier'],
      },
    },
  });

  // ── Hooks ──────────────────────────────────────────────────────────────────
  registerRequestId(app);

  // ── Plugins ────────────────────────────────────────────────────────────────
  await registerHelmet(app);

  const allowedOrigins =
    config.NODE_ENV === 'production'
      ? [config.API_BASE_URL]
      : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', config.API_BASE_URL];

  await registerCors(app, allowedOrigins);

  await registerRateLimit(app, redis.cache);

  // ── Error handler ──────────────────────────────────────────────────────────
  registerErrorHandler(app);

  // ── Auth (Sprint 2 — H-08) ─────────────────────────────────────────────────
  if (config.PRIVY_APP_ID && config.PRIVY_APP_SECRET) {
    await app.register(authPlugin, {
      privy: {
        appId: config.PRIVY_APP_ID,
        appSecret: config.PRIVY_APP_SECRET,
        ...(config.PRIVY_VERIFICATION_KEY
          ? { verificationKey: config.PRIVY_VERIFICATION_KEY }
          : {}),
      },
      db,
      redis,
      logger,
    });
    logger.info('Auth plugin registered on API gateway');
  } else {
    logger.warn('PRIVY_APP_ID / PRIVY_APP_SECRET not set — auth routes disabled');
  }

  // ── Routes ─────────────────────────────────────────────────────────────────
  await registerHealthRoutes(app);
  await registerTradingProxy(app, config);

  // ── Not found handler ──────────────────────────────────────────────────────
  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
