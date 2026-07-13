import { PublicKey } from '@solana/web3.js';
import type { Logger } from '@funrun/logger';

import type { ConnectionPool } from './connection-pool.js';

export type TradeOperation = 'trade' | 'create' | 'graduation';

const OP_CONFIG: Record<TradeOperation, { percentile: number; multiplier: number }> = {
  trade:      { percentile: 75, multiplier: 1.0  },
  create:     { percentile: 75, multiplier: 1.0  },
  graduation: { percentile: 90, multiplier: 1.25 },
};

const MIN_PRIORITY_FEE_DEFAULT = 1_000;       // microlamports per CU
const MAX_PRIORITY_FEE_DEFAULT = 5_000_000;   // microlamports per CU
const CACHE_TTL_MS = 3_000;
const SAMPLE_SLOTS = 150;

interface CachedEstimate {
  value:     number;
  updatedAt: number;
}

export interface PriorityFeeEstimatorOptions {
  minFee?: number;
  maxFee?: number;
}

export class PriorityFeeEstimator {
  private readonly cache = new Map<TradeOperation, CachedEstimate>();
  private readonly minFee: number;
  private readonly maxFee: number;

  constructor(
    private readonly pool: ConnectionPool,
    private readonly logger: Logger,
    opts: PriorityFeeEstimatorOptions = {},
  ) {
    this.minFee = opts.minFee ?? MIN_PRIORITY_FEE_DEFAULT;
    this.maxFee = opts.maxFee ?? MAX_PRIORITY_FEE_DEFAULT;
  }

  /**
   * Estimates priority fee in microlamports/CU for the given operation.
   * Result is cached for 3 s per operation type.
   */
  async estimate(
    operation: TradeOperation,
    writableAccounts: PublicKey[] = [],
  ): Promise<number> {
    const now = Date.now();
    const cached = this.cache.get(operation);
    if (cached !== undefined && now - cached.updatedAt < CACHE_TTL_MS) {
      return cached.value;
    }

    const config = OP_CONFIG[operation];

    const fee = await this.pool.withConnection(async (conn) => {
      const fees = await conn.getRecentPrioritizationFees({
        lockedWritableAccounts: writableAccounts,
      });

      if (fees.length === 0) {
        this.logger.debug({ operation }, 'PriorityFeeEstimator: no fee data, using minimum');
        return this.minFee;
      }

      const values = fees
        .sort((a, b) => b.slot - a.slot)
        .slice(0, SAMPLE_SLOTS)
        .map((f) => f.prioritizationFee)
        .sort((a, b) => a - b);

      const idx = Math.min(
        Math.floor((config.percentile / 100) * values.length),
        values.length - 1,
      );
      const raw = Math.round((values[idx] ?? this.minFee) * config.multiplier);
      return Math.min(Math.max(raw, this.minFee), this.maxFee);
    });

    this.cache.set(operation, { value: fee, updatedAt: now });
    this.logger.debug({ operation, fee, percentile: config.percentile }, 'PriorityFeeEstimator: estimated');
    return fee;
  }

  /**
   * Escalates a base fee by 50% per retry attempt, capped at maxFee.
   * Use when retrying after BlockhashExpired or a dropped transaction.
   */
  escalateForRetry(baseFee: number, attempt: number): number {
    return Math.min(Math.round(baseFee * Math.pow(1.5, attempt)), this.maxFee);
  }
}
