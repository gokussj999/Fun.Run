import type { Logger } from '@funrun/logger';

import type { RawLogEntry } from '../types.js';
import { parseEvents } from '../parser/index.js';
import { EventProcessor } from '../processor/index.js';
import { TransactionFetcher } from '../solana/fetcher.js';
import { SlotTracker } from '../solana/slot-tracker.js';
import { RetryManager } from '../retry/manager.js';
import { BACKFILL_RATE_LIMIT_MS } from '../constants.js';

export interface BackfillOptions {
  fromSignature?: string;
  fromSlot?:      bigint;
  toSlot?:        bigint;
}

/**
 * BackfillOrchestrator catches up historical transactions when the indexer
 * starts or after a WebSocket reconnect.
 *
 * It pages backward through getSignaturesForAddress until it finds the
 * known lastProcessedSignature, then replays them in chronological order.
 */
export class BackfillOrchestrator {
  constructor(
    private readonly programId: string,
    private readonly fetcher: TransactionFetcher,
    private readonly slotTracker: SlotTracker,
    private readonly processor: EventProcessor,
    private readonly retryManager: RetryManager,
    private readonly logger: Logger,
    private readonly onCursorAdvance?: (slot: bigint, signature: string) => void,
  ) {}

  /**
   * Run backfill from the given cursor forward to the current safe slot.
   * Processes events in slot-ascending order.
   */
  async run(opts: BackfillOptions = {}): Promise<number> {
    const safeSlot = this.slotTracker.getSafeSlot();
    this.logger.info(
      { fromSig: opts.fromSignature?.slice(0, 12), safeSlot: safeSlot.toString() },
      'Backfill: starting',
    );

    let totalProcessed = 0;

    // fetchSignaturesSince handles pagination internally and returns oldest-first
    const allSigs = await this.fetcher.fetchSignaturesSince(
      this.programId,
      opts.fromSignature ?? null,
    );

    if (allSigs.length === 0) {
      this.logger.info({ totalProcessed }, 'Backfill: no new signatures, complete');
      return totalProcessed;
    }

    const txBatch = await this.fetcher.fetchTransactionsBatch(allSigs.map((s) => s.signature));
    const entries: RawLogEntry[] = [];

    for (let i = 0; i < allSigs.length; i++) {
      const tx    = txBatch[i];
      const sig   = allSigs[i];
      if (!tx || !sig) continue;

      if (opts.toSlot !== undefined && BigInt(sig.slot) > opts.toSlot) continue;

      entries.push({
        signature: sig.signature,
        slot:      BigInt(sig.slot),
        err:       sig.err ?? null,
        logs:      tx.logs,
        blockTime: tx.blockTime ?? Math.floor(Date.now() / 1000),
      });
    }

    for (const entry of entries) {
      if (!this.slotTracker.isSafeSlot(entry.slot)) {
        this.logger.debug(
          { slot: entry.slot.toString(), safeSlot: safeSlot.toString() },
          'Backfill: skipping slot above safe depth',
        );
        continue;
      }

      const events = parseEvents(entry);
      for (const event of events) {
        try {
          await this.processor.processEvent(event);
          totalProcessed++;
          this.onCursorAdvance?.(entry.slot, entry.signature);
        } catch (err) {
          this.retryManager.enqueue(entry);
          this.logger.error({ err, sig: entry.signature }, 'Backfill: handler error — queued for retry');
        }
      }
      await sleep(BACKFILL_RATE_LIMIT_MS);
    }

    this.logger.info({ totalProcessed }, 'Backfill: complete');
    return totalProcessed;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
