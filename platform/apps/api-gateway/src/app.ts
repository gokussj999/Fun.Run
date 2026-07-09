import Fastify from 'fastify';

import { getContainer } from './container.js';
import { registerCors } from './plugins/cors.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { registerHelmet } from './plugins/helmet.js';
import { registerRateLimit } from './plugins/rate-limit.js';
import { registerRequestId } from './plugins/request-id.js';
import { registerHealthRoutes } from './routes/health.js';

export async function buildApp(): Promise<ReturnType<typeof Fastify>> {
  const { config, logger } = getContainer();

  const app = Fastify({
    logger: {
      instance: logger,
    },
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
      : ['http://localhost:5173', 'http://localhost:3000', config.API_BASE_URL];

  await registerCors(app, allowedOrigins);

  const { redis } = getContainer();
  await registerRateLimit(app, redis.cache);

  // ── Error handler ──────────────────────────────────────────────────────────
  registerErrorHandler(app);

  // ── Routes ─────────────────────────────────────────────────────────────────
  await registerHealthRoutes(app);

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
