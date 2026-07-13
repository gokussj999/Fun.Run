import type { PrismaClient } from '@funrun/database';
import type { RedisInstance as Redis } from '@funrun/redis';
import type { Logger } from '@funrun/logger';

import type { IndexerCursor } from '../types.js';
import { REDIS_KEYS_INDEXER, CURSOR_REDIS_TTL_S } from '../constants.js';

const CURSOR_REDIS_KEY = REDIS_KEYS_INDEXER.cursor();

/**
 * CursorStore provides atomic read/write for the indexer's processing cursor.
 *
 * Write path:  DB (durable) + Redis (fast read cache)
 * Read path:   Redis first → DB fallback
 *
 * The DB record is a singleton row with id = 'singleton' in the IndexerState table.
 */
export class CursorStore {
  constructor(
    private readonly db: PrismaClient,
    private readonly redis: Redis,
    private readonly logger: Logger,
  ) {}

  async read(): Promise<IndexerCursor | null> {
    // Try Redis first
    const cached = await this.redis.get(CURSOR_REDIS_KEY);
    if (cached) {
      try {
        return JSON.parse(cached, bigintReviver) as IndexerCursor;
      } catch {
        this.logger.warn('CursorStore: invalid Redis cursor — falling through to DB');
      }
    }

    // Fall back to DB
    const row = await this.db.indexerState.findUnique({ where: { id: 'singleton' } });
    if (!row) return null;

    const cursor: IndexerCursor = {
      lastProcessedSlot: row.lastSlot,
      lastProcessedAt:   row.updatedAt,
      ...(row.lastSignature !== null ? { lastProcessedSignature: row.lastSignature } : {}),
    };

    await this.writeRedis(cursor);
    return cursor;
  }

  async write(cursor: IndexerCursor): Promise<void> {
    // Durable write to DB
    await this.db.indexerState.upsert({
      where: { id: 'singleton' },
      update: {
        lastSlot:      cursor.lastProcessedSlot,
        lastSignature: cursor.lastProcessedSignature ?? null,
        updatedAt:     new Date(),
      },
      create: {
        id:            'singleton',
        lastSlot:      cursor.lastProcessedSlot,
        lastSignature: cursor.lastProcessedSignature ?? null,
      },
    });

    await this.writeRedis(cursor);
  }

  private async writeRedis(cursor: IndexerCursor): Promise<void> {
    try {
      await this.redis.setex(
        CURSOR_REDIS_KEY,
        CURSOR_REDIS_TTL_S,
        JSON.stringify(cursor, bigintReplacer),
      );
    } catch (err) {
      // Non-fatal — DB is the source of truth
      this.logger.warn({ err }, 'CursorStore: failed to write Redis cache');
    }
  }
}

function bigintReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}

function bigintReviver(_key: string, value: unknown): unknown {
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const n = BigInt(value);
    return n <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(n) : n;
  }
  return value;
}
