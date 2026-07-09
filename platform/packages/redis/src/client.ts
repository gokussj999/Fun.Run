import Redis from 'ioredis';

import type { Logger } from '@funrun/logger';

export interface RedisClientOptions {
  url: string;
  password?: string;
  db?: number;
  logger: Logger;
  name?: string;
}

export function createRedisClient(opts: RedisClientOptions): Redis {
  const { url, password, db, logger, name = 'redis' } = opts;

  const client = new Redis(url, {
    password,
    db,
    lazyConnect: true,
    enableReadyCheck: true,
    retryStrategy: (times) => {
      if (times > 10) {
        logger.error({ name }, 'Redis retry limit exceeded, giving up');
        return null;
      }
      const delay = Math.min(times * 200, 3_000);
      return delay;
    },
    reconnectOnError: (err) => {
      logger.warn({ name, err: err.message }, 'Redis reconnect on error');
      return true;
    },
    maxRetriesPerRequest: 3,
    commandTimeout: 5_000,
  });

  client.on('connect', () => {
    logger.info({ name }, 'Redis connected');
  });

  client.on('ready', () => {
    logger.info({ name }, 'Redis ready');
  });

  client.on('error', (err) => {
    logger.error({ name, err: err.message }, 'Redis error');
  });

  client.on('close', () => {
    logger.warn({ name }, 'Redis connection closed');
  });

  client.on('reconnecting', () => {
    logger.info({ name }, 'Redis reconnecting');
  });

  return client;
}

// ─── Typed key-value helpers ──────────────────────────────────────────────────

export async function redisGetJson<T>(client: Redis, key: string): Promise<T | null> {
  const raw = await client.get(key);
  if (raw === null) return null;
  return JSON.parse(raw) as T;
}

export async function redisSetJson<T>(
  client: Redis,
  key: string,
  value: T,
  ttlMs?: number,
): Promise<void> {
  const serialized = JSON.stringify(value);
  if (ttlMs !== undefined) {
    await client.set(key, serialized, 'PX', ttlMs);
  } else {
    await client.set(key, serialized);
  }
}

export async function redisDelete(client: Redis, ...keys: string[]): Promise<number> {
  return client.del(...keys);
}
