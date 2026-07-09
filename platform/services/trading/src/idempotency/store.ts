import type Redis from 'ioredis';
import type { Logger } from '@funrun/logger';
import { RK, IDEMPOTENCY_TTL_SECONDS } from '../constants.js';
import type { IdempotencyRecord } from '../types.js';

export class IdempotencyStore {
  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger,
  ) {}

  async get(key: string): Promise<IdempotencyRecord | null> {
    const raw = await this.redis.get(RK.idempotency(key));
    if (raw === null) return null;
    return JSON.parse(raw) as IdempotencyRecord;
  }

  // Best-effort: failure to store is logged but does not fail the trade response.
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
