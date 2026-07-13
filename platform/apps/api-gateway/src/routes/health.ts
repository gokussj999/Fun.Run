import type { FastifyInstance } from 'fastify';

import type { HealthCheckResult } from '@funrun/shared';

import { getContainer } from '../container.js';

const VERSION = process.env['npm_package_version'] ?? '0.0.1';
const START_TIME = Date.now();

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  // Liveness probe — is the process alive?
  app.get('/healthz', { logLevel: 'silent', config: { skipAuth: true } }, async (_request, reply) => {
    return reply.status(200).send({ ok: true });
  });

  // Readiness probe — are all dependencies healthy?
  app.get(
    '/readyz',
    { logLevel: 'silent', config: { skipAuth: true } },
    async (_request, reply): Promise<HealthCheckResult> => {
      const { db, redis, logger, config } = getContainer();
      const uptime = Math.floor((Date.now() - START_TIME) / 1000);

      const checks: HealthCheckResult['checks'] = {};

      // Database check
      try {
        const start = Date.now();
        await db.$queryRaw`SELECT 1`;
        checks['database'] = { status: 'healthy', latencyMs: Date.now() - start };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown';
        logger.error({ err: message }, 'Health check: database failed');
        checks['database'] = { status: 'unhealthy', error: message };
      }

      // Redis cache check
      try {
        const start = Date.now();
        await redis.cache.ping();
        checks['redis_cache'] = { status: 'healthy', latencyMs: Date.now() - start };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown';
        checks['redis_cache'] = { status: 'unhealthy', error: message };
      }

      // Redis BullMQ check
      try {
        const start = Date.now();
        await redis.bullmq.ping();
        checks['redis_bullmq'] = { status: 'healthy', latencyMs: Date.now() - start };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown';
        checks['redis_bullmq'] = { status: 'unhealthy', error: message };
      }

      // Trading service check (Sprint 1 Task 18)
      try {
        const start = Date.now();
        const tradingUrl = `${config.TRADING_SERVICE_URL.replace(/\/$/, '')}/healthz`;
        const res = await fetch(tradingUrl, { signal: AbortSignal.timeout(3_000) });
        if (res.ok) {
          checks['trading'] = { status: 'healthy', latencyMs: Date.now() - start };
        } else {
          checks['trading'] = { status: 'unhealthy', error: `HTTP ${res.status}` };
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown';
        logger.error({ err: message }, 'Health check: trading service failed');
        checks['trading'] = { status: 'unhealthy', error: message };
      }

      const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');
      const anyUnhealthy = Object.values(checks).some((c) => c.status === 'unhealthy');

      const status = allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded';
      const statusCode = status === 'unhealthy' ? 503 : 200;

      const result: HealthCheckResult = {
        status,
        service: 'api-gateway',
        version: VERSION,
        uptime,
        checks,
        timestamp: new Date().toISOString(),
      };

      return reply.status(statusCode).send(result);
    },
  );

  // Deep health — full diagnostic (not for load balancers)
  app.get('/api/v1/health', { config: { skipAuth: true } }, async (_request, reply) => {
    const { config, db, redis } = getContainer();
    const uptime = Math.floor((Date.now() - START_TIME) / 1000);

    return reply.send({
      success: true,
      data: {
        service: 'api-gateway',
        version: VERSION,
        environment: config.NODE_ENV,
        network: config.SOLANA_NETWORK,
        programId: config.PROGRAM_ID,
        uptime,
        timestamp: new Date().toISOString(),
      },
      requestId: reply.getHeader('x-request-id'),
      timestamp: new Date().toISOString(),
    });
  });
}
