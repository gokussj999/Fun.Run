import type { FastifyInstance } from 'fastify';
import type { Redis } from 'ioredis';
import type { Logger } from '@funrun/logger';
import { RATE_LIMITS, REDIS_KEYS } from '../constants.js';
import {
  type RedisDependencyMode,
  isStrictRedisMode,
  redisUnavailablePayload,
} from '../config/redis-dependency.js';

const TRADE_ROUTES = new Set(['/trade/buy', '/trade/sell']);
const QUOTE_ROUTES = new Set(['/trade/quote']);

const { max: TRADE_MAX, windowMs: TRADE_WINDOW_MS } = RATE_LIMITS.TRADE;
const TRADE_WINDOW_SEC = Math.ceil(TRADE_WINDOW_MS / 1000);

const { max: QUOTE_MAX, windowMs: QUOTE_WINDOW_MS } = RATE_LIMITS.COIN_READ;
const QUOTE_WINDOW_SEC = Math.ceil(QUOTE_WINDOW_MS / 1000);

export interface RateLimitOptions {
  redisMode?: RedisDependencyMode;
}

async function slidingWindowCount(
  redis: Redis,
  key: string,
  now: number,
  windowMs: number,
  windowSec: number,
): Promise<number> {
  const windowStart = now - windowMs;
  const pipeline = redis.pipeline();
  pipeline.zadd(key, now, `${now}-${Math.random().toString(36).slice(2, 7)}`);
  pipeline.zremrangebyscore(key, '-inf', windowStart);
  pipeline.zcard(key);
  pipeline.expire(key, windowSec);
  const results = await pipeline.exec();
  return (results?.[2]?.[1] as number) ?? 0;
}

function setRateLimitHeaders(
  reply: { header: (k: string, v: string) => unknown },
  max: number,
  count: number,
  now: number,
  windowMs: number,
): void {
  const remaining = Math.max(0, max - count);
  const resetEpochSec = Math.ceil((now + windowMs) / 1000);
  void reply.header('x-ratelimit-limit', String(max));
  void reply.header('x-ratelimit-remaining', String(remaining));
  void reply.header('x-ratelimit-reset', String(resetEpochSec));
}

/** Per-wallet rate limit on POST /trade/buy and /trade/sell (H-01). */
export function registerRateLimit(
  app: FastifyInstance,
  redis: Redis,
  logger: Logger,
  opts: RateLimitOptions = {},
): void {
  const redisMode = opts.redisMode ?? 'degraded';

  app.addHook('preHandler', async (request, reply) => {
    const path = request.url.split('?')[0]!;
    if (!TRADE_ROUTES.has(path)) return;

    const { walletAddress } = request.auth;
    const now = Date.now();
    const key = REDIS_KEYS.userRateLimit(walletAddress, 'trade');

    try {
      const count = await slidingWindowCount(redis, key, now, TRADE_WINDOW_MS, TRADE_WINDOW_SEC);
      setRateLimitHeaders(reply, TRADE_MAX, count, now, TRADE_WINDOW_MS);

      if (count > TRADE_MAX) {
        return reply
          .code(429)
          .header('retry-after', String(TRADE_WINDOW_SEC))
          .send({
            error: 'RATE_LIMITED',
            message: `Too many trade requests. Maximum ${TRADE_MAX} per minute allowed.`,
            requestId: request.requestId,
          });
      }
    } catch (err) {
      if (isStrictRedisMode(redisMode)) {
        logger.error({ err, walletAddress }, 'RateLimit: Redis error in strict mode — failing closed');
        return reply.code(503).send(redisUnavailablePayload(request.requestId));
      }
      logger.warn({ err, walletAddress }, 'RateLimit: Redis error, failing open');
    }
  });
}

/** IP-based rate limit on GET /trade/quote (H-03). */
export function registerQuoteRateLimit(
  app: FastifyInstance,
  redis: Redis,
  logger: Logger,
  opts: RateLimitOptions = {},
): void {
  const redisMode = opts.redisMode ?? 'degraded';

  app.addHook('onRequest', async (request, reply) => {
    const path = request.url.split('?')[0]!;
    if (!QUOTE_ROUTES.has(path)) return;

    const ip = extractQuoteIp(request);
    const now = Date.now();
    const key = REDIS_KEYS.ipRateLimit(ip, 'quote');

    try {
      const count = await slidingWindowCount(redis, key, now, QUOTE_WINDOW_MS, QUOTE_WINDOW_SEC);
      setRateLimitHeaders(reply, QUOTE_MAX, count, now, QUOTE_WINDOW_MS);

      if (count > QUOTE_MAX) {
        return reply
          .code(429)
          .header('retry-after', String(QUOTE_WINDOW_SEC))
          .send({
            error: 'RATE_LIMITED',
            message: `Too many quote requests. Maximum ${QUOTE_MAX} per minute allowed.`,
            requestId: request.requestId,
          });
      }
    } catch (err) {
      if (isStrictRedisMode(redisMode)) {
        logger.error({ err, ip }, 'QuoteRateLimit: Redis error in strict mode — failing closed');
        return reply.code(503).send(redisUnavailablePayload(request.requestId));
      }
      logger.warn({ err, ip }, 'QuoteRateLimit: Redis error, failing open');
    }
  });
}

function extractQuoteIp(request: {
  ip: string;
  headers: Record<string, string | string[] | undefined>;
}): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() ?? request.ip;
  }
  return request.ip;
}
