import type { Redis } from 'ioredis';
import type { Logger } from '@funrun/logger';
import { QUOTE_CACHE_TTL_MS, RK } from '../constants.js';

// Shape stored in Redis (all bigints serialized as decimal strings).
export interface CachedQuote {
  coinId: string;
  direction: 'buy' | 'sell';
  amountIn: string;
  amountOut: string;
  pricePerToken: number;
  priceImpactBps: number;
  feeAmount: string;
  effectivePrice: number;
  virtualSolAfter: string;
  virtualTokensAfter: string;
  cachedAt: number; // Unix ms — used to compute expiresAt
}

export class QuoteCache {
  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger,
  ) {}

  async get(coinId: string, direction: string, amountIn: bigint): Promise<CachedQuote | null> {
    try {
      const raw = await this.redis.get(RK.quote(coinId, direction, amountIn));
      if (!raw) return null;
      return JSON.parse(raw) as CachedQuote;
    } catch (err) {
      // Redis unavailable — serve fresh quote from DB instead of erroring.
      this.logger.warn({ err, coinId, direction }, 'QuoteCache: read error, bypassing cache');
      return null;
    }
  }

  async set(quote: CachedQuote): Promise<void> {
    try {
      const key = RK.quote(quote.coinId, quote.direction, BigInt(quote.amountIn));
      await this.redis.set(key, JSON.stringify(quote), 'PX', QUOTE_CACHE_TTL_MS);
    } catch (err) {
      // Best-effort — a failed cache write does not fail the request.
      this.logger.warn({ err, coinId: quote.coinId }, 'QuoteCache: write error, skipping cache');
    }
  }
}
