import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';
import type Redis from 'ioredis';

import type { ParsedEvent } from '../types.js';
import { REDIS_KEYS_INDEXER, SIGNATURE_DEDUP_TTL_S } from '../constants.js';
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
    private readonly redis: Redis,
    private readonly logger: Logger,
  ) {
    this.publisher = new RedisPublisher(redis, logger);
  }

  /**
   * Process one parsed event.
   *
   * Idempotency is enforced at two levels:
   *   1. Redis SET NX on the tx signature — first writer wins (O(1), 7-day TTL)
   *   2. DB-level upserts / existence checks inside each handler
   *
   * If the Redis SET NX returns 0 (already set), we skip processing entirely.
   * This is safe because the same signature → same on-chain state → same DB writes.
   */
  async processEvent(event: ParsedEvent): Promise<void> {
    const dedupKey = REDIS_KEYS_INDEXER.processedSig(event.signature);

    // Atomic claim: SET key "1" NX EX <ttl>
    const claimed = await this.redis.set(dedupKey, '1', 'EX', SIGNATURE_DEDUP_TTL_S, 'NX');

    if (claimed === null) {
      // Already processed — skip silently
      this.logger.debug({ sig: event.signature, event: event.name }, 'duplicate sig — skipped');
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
      // Release the dedup key so the retry system can reclaim it
      await this.redis.del(dedupKey).catch(() => undefined);
      throw err;
    }
  }

  private async dispatch(event: ParsedEvent): Promise<void> {
    switch (event.name) {
      case 'CoinCreated':
        return handleCoinCreated(event, this.db, this.logger);

      case 'TokensPurchased':
        return handleBuy(event, this.db, this.redis, this.publisher, this.logger);

      case 'TokensSold':
        return handleSell(event, this.db, this.redis, this.publisher, this.logger);

      case 'GraduationInitiated':
        return handleGraduationInitiated(event, this.db, this.publisher, this.logger);

      case 'GraduationCompleted':
        return handleGraduationCompleted(event, this.db, this.publisher, this.logger);

      case 'CreatorFeesClaimed':
        return handleCreatorFeesClaimed(event, this.db, this.logger);

      case 'CreatorReferrerFeesClaimed':
        return handleCreatorReferrerFeesClaimed(event, this.db, this.logger);

      case 'CreatorReferrerSet':
        return handleCreatorReferrerSet(event, this.db, this.logger);

      case 'TreasurySweep':
        return handleTreasurySweep(event, this.db, this.logger);

      case 'GlobalConfigUpdated':
        // Fire-and-forget publish only; no DB mutation needed
        return this.publisher.publishIndexerEvent({
          eventName: event.name,
          slot:      event.slot.toString(),
          signature: event.signature,
          data:      event.data as Record<string, unknown>,
        });

      // Informational — no DB action
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
