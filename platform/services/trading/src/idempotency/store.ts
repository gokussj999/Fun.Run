import type { Redis } from 'ioredis';
import type { Logger } from '@funrun/logger';
import { RK, IDEMPOTENCY_TTL_SECONDS } from '../constants.js';
import type { IdempotencyRecord } from '../types.js';
import {
  type RedisDependencyMode,
  isStrictRedisMode,
  RedisDependencyError,
} from '../config/redis-dependency.js';

const PENDING_SENTINEL = JSON.stringify({ __pending__: true });

export class IdempotencyStore {
  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger,
    private readonly redisMode: RedisDependencyMode = 'degraded',
  ) {}

  async get(key: string): Promise<IdempotencyRecord | null> {
    const raw = await this.redis.get(RK.idempotency(key));
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed['__pending__'] === true) return null;
    return parsed as unknown as IdempotencyRecord;
  }

  async acquire(key: string): Promise<boolean> {
    try {
      const result = await this.redis.set(
        RK.idempotency(key),
        PENDING_SENTINEL,
        'EX',
        IDEMPOTENCY_TTL_SECONDS,
        'NX',
      );
      return result === 'OK';
    } catch (err) {
      if (isStrictRedisMode(this.redisMode)) {
        this.logger.error({ key, err }, 'IdempotencyStore: acquire error in strict mode');
        throw new RedisDependencyError('Idempotency store unavailable');
      }
      this.logger.warn({ key, err }, 'IdempotencyStore: acquire error, failing open');
      return true;
    }
  }

  async release(key: string): Promise<void> {
    try {
      await this.redis.del(RK.idempotency(key));
    } catch (err) {
      this.logger.warn({ key, err }, 'IdempotencyStore: release error (non-fatal)');
    }
  }

  async set(key: string, record: IdempotencyRecord): Promise<void> {
    try {
      await this.redis.set(
        RK.idempotency(key),
        JSON.stringify(record),
        'EX',
        IDEMPOTENCY_TTL_SECONDS,
      );
    } catch (err) {
      this.logger.warn({ key, err }, 'IdempotencyStore: failed to store key (non-fatal)');
    }
  }
}
