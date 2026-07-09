import type { FastifyInstance } from 'fastify';
import type Redis from 'ioredis';
import type { Logger } from '@funrun/logger';
import { RATE_LIMITS, REDIS_KEYS } from '../constants.js';

// Applied only to mutating trade routes — quote is public and read-only.
const RATE_LIMITED_ROUTES = new Set(['/trade/buy', '/trade/sell']);

const { max: MAX_REQUESTS, windowMs: WINDOW_MS } = RATE_LIMITS.TRADE;
const WINDOW_SEC = Math.ceil(WINDOW_MS / 1000);

export function registerRateLimit(
  app: FastifyInstance,
  redis: Redis,
  logger: Logger,
): void {
  app.addHook('preHandler', async (request, reply) => {
    const path = request.url.split('?')[0]!;
    if (!RATE_LIMITED_ROUTES.has(path)) return;

    // Auth hook runs before this — walletAddress is always set here.
    const { walletAddress } = request.auth;
    const now = Date.now();
    const windowStart = now - WINDOW_MS;
    const key = REDIS_KEYS.userRateLimit(walletAddress, 'trade');

    try {
      // Sliding window via sorted set.
      // Score = timestamp (ms); member = timestamp string (unique per request).
      // 1. Record this request.
      // 2. Remove entries older than the window.
      // 3. Count remaining entries.
      // 4. Reset TTL.
      const pipeline = redis.pipeline();
      pipeline.zadd(key, now, `${now}-${Math.random().toString(36).slice(2, 7)}`);
      pipeline.zremrangebyscore(key, '-inf', windowStart);
      pipeline.zcard(key);
      pipeline.expire(key, WINDOW_SEC);
      const results = await pipeline.exec();

      // results[2] = [err, count] from ZCARD
      const count = (results?.[2]?.[1] as number) ?? 0;
      const remaining = Math.max(0, MAX_REQUESTS - count);
      const resetEpochSec = Math.ceil((now + WINDOW_MS) / 1000);

      void reply.header('x-ratelimit-limit', String(MAX_REQUESTS));
      void reply.header('x-ratelimit-remaining', String(remaining));
      void reply.header('x-ratelimit-reset', String(resetEpochSec));

      if (count > MAX_REQUESTS) {
        return reply
          .code(429)
          .header('retry-after', String(WINDOW_SEC))
          .send({
            error: 'RATE_LIMITED',
            message: `Too many trade requests. Maximum ${MAX_REQUESTS} per minute allowed.`,
            requestId: request.requestId,
          });
      }
    } catch (err) {
      // Redis unavailable — fail open so a Redis outage does not halt trading.
      logger.warn({ err, walletAddress }, 'RateLimit: Redis error, failing open');
    }
  });
}
