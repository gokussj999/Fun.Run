import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';
import type { RedisInstance as Redis } from '@funrun/redis';

import type { ParsedEvent } from '../types.js';
import { REDIS_KEYS_INDEXER, SIGNATURE_DEDUP_TTL_S } from '../constants.js';
import {
  type RedisDependencyMode,
  isStrictRedisMode,
  RedisDependencyError,
} from '../config/redis-dependency.js';
import { RedisPublisher } from '../publisher/redis.js';
import { handleCoinCreated } from './handlers/coin-created.js';
import { handleBuy, handleSell } from './handlers/trade.js';
import { handleGraduationInitiated, handleGraduationCompleted } from './handlers/graduation.js';
import {
  handleCreatorFeesClaimed,
  handleCreatorReferrerFeesClaimed,
  handleCreatorReferrerSet,
  handleTreasurySweep,
} from './handlers/fees.js';

export class EventProcessor {
  private readonly publisher: RedisPublisher;

  constructor(
    private readonly db: PrismaClient,
    private readonly cacheRedis: Redis,
    pubsubRedis: Redis,
    private readonly logger: Logger,
    private readonly redisMode: RedisDependencyMode = 'degraded',
  ) {
    this.publisher = new RedisPublisher(pubsubRedis, logger);
  }

  /**
   * Process one parsed event.
   *
   * Idempotency: Redis SET NX per (signature, eventName) on cache DB (db 0).
   * A single on-chain tx may emit multiple Anchor events — each is deduped independently.
   */
  async processEvent(event: ParsedEvent): Promise<void> {
    const dedupKey = REDIS_KEYS_INDEXER.processedEvent(event.signature, event.name);

    let claimed = true;
    try {
      const result = await this.cacheRedis.set(
        dedupKey,
        '1',
        'EX',
        SIGNATURE_DEDUP_TTL_S,
        'NX',
      );
      claimed = result === 'OK';
    } catch (err) {
      if (isStrictRedisMode(this.redisMode)) {
        this.logger.error({ err, sig: event.signature }, 'EventProcessor: dedup error in strict mode');
        throw new RedisDependencyError('Indexer dedup store unavailable');
      }
      this.logger.warn({ err, sig: event.signature }, 'EventProcessor: dedup error, proceeding without lock');
      claimed = true;
    }

    if (!claimed) {
      this.logger.debug({ sig: event.signature, event: event.name }, 'duplicate event — skipped');
      return;
    }

    const start = Date.now();

    try {
      await this.dispatch(event);
      this.logger.info(
        { event: event.name, sig: event.signature.slice(0, 12), ms: Date.now() - start },
        'event processed',
      );
    } catch (err) {
      await this.cacheRedis.del(dedupKey).catch(() => undefined);
      throw err;
    }
  }

  private async dispatch(event: ParsedEvent): Promise<void> {
    switch (event.name) {
      case 'CoinCreated':
        return handleCoinCreated(event, this.db, this.publisher, this.logger);

      case 'TokensPurchased':
        return handleBuy(event, this.db, this.cacheRedis, this.publisher, this.logger);

      case 'TokensSold':
        return handleSell(event, this.db, this.cacheRedis, this.publisher, this.logger);

      case 'GraduationInitiated':
        return handleGraduationInitiated(event, this.db, this.publisher, this.logger);

      case 'GraduationCompleted':
        return handleGraduationCompleted(event, this.db, this.publisher, this.logger);

      case 'CreatorFeesClaimed':
        return handleCreatorFeesClaimed(event, this.db, this.publisher, this.logger);

      case 'CreatorReferrerFeesClaimed':
        return handleCreatorReferrerFeesClaimed(event, this.db, this.publisher, this.logger);

      case 'CreatorReferrerSet':
        return handleCreatorReferrerSet(event, this.db, this.publisher, this.logger);

      case 'TreasurySweep':
        return handleTreasurySweep(event, this.db, this.publisher, this.logger);

      case 'GlobalConfigUpdated':
        return this.publisher.publishIndexerEvent({
          eventName: event.name,
          slot:      event.slot.toString(),
          signature: event.signature,
          data:      event.data as unknown as Record<string, unknown>,
        });

      case 'LiquidityLocked':
      case 'MintAuthorityRevoked':
      case 'FreezeAuthorityRevoked':
      case 'CoinGraduated':
        return;

      default: {
        const _exhaustive: never = event.name;
        this.logger.warn({ event: _exhaustive }, 'EventProcessor: unhandled event type');
      }
    }
  }
}
