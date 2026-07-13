import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import type { AuthenticatedUser } from '@funrun/auth';
import type { RedisInstance as Redis } from '@funrun/redis';

export async function registerRateLimit(app: FastifyInstance, redis: Redis): Promise<void> {
  await app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: 60_000,
    redis,
    keyGenerator: (request) => {
      const actor = (request as { actor?: AuthenticatedUser }).actor;
      if (actor?.walletAddress) {
        return `wallet:${actor.walletAddress}`;
      }
      return `ip:${request.ip}`;
    },
    errorResponseBuilder: (_request, context) => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        details: {
          limit: context.max,
          remaining: 0,
          retryAfterMs: context.ttl,
        },
      },
    }),
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });
}
