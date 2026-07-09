import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import type Redis from 'ioredis';

export async function registerRateLimit(app: FastifyInstance, redis: Redis): Promise<void> {
  await app.register(rateLimit, {
    global: true,
    max: 1_000,
    timeWindow: 60_000,
    redis,
    keyGenerator: (request) => {
      // Prefer user ID from JWT (set by auth plugin), fall back to IP
      const userId = (request as Record<string, unknown>)['userId'];
      return typeof userId === 'string' ? `user:${userId}` : `ip:${request.ip}`;
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
