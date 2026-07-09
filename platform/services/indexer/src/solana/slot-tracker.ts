import type { Connection } from '@solana/web3.js';

import type { Logger } from '@funrun/logger';

import type { Slot } from '../types.js';
import { REORG_SAFE_DEPTH } from '../constants.js';

export class SlotTracker {
  private currentSlot: Slot = 0n;
  private finalizedSlot: Slot = 0n;
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly connection: Connection,
    private readonly logger: Logger,
  ) {}

  start(): void {
    if (this.pollInterval) return;

    this.pollInterval = setInterval(() => {
      void this.poll();
    }, 2_000);

    void this.poll(); // immediate first poll
  }

  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private async poll(): Promise<void> {
    try {
      const [confirmed, finalized] = await Promise.all([
        this.connection.getSlot('confirmed'),
        this.connection.getSlot('finalized'),
      ]);

      this.currentSlot = BigInt(confirmed);
      this.finalizedSlot = BigInt(finalized);
    } catch (err) {
      this.logger.warn({ err: err instanceof Error ? err.message : String(err) }, 'Slot tracker poll failed');
    }
  }

  getCurrentSlot(): Slot {
    return this.currentSlot;
  }

  getFinalizedSlot(): Slot {
    return this.finalizedSlot;
  }

  /**
   * A slot is considered "safe" from reorgs if it is at least REORG_SAFE_DEPTH
   * slots behind the current finalized slot.
   */
  isSafeSlot(slot: Slot): boolean {
    return slot <= this.finalizedSlot - REORG_SAFE_DEPTH;
  }

  /**
   * Lag of the indexer behind the chain tip.
   * Useful for health checks and alerting.
   */
  getLagSlots(indexerSlot: Slot): bigint {
    return this.currentSlot > indexerSlot ? this.currentSlot - indexerSlot : 0n;
  }
}
