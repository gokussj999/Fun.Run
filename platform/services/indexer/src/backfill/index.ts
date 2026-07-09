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
    let before: string | undefined = undefined;
    const batches: RawLogEntry[][] = [];

    // Page backward through signatures until we reach our cursor
    while (true) {
      const sigs = await this.fetcher.fetchSignaturesSince(
        this.programId,
        opts.fromSignature,
        before,
      );

      if (sigs.length === 0) break;

      const txBatch = await this.fetcher.fetchTransactionsBatch(sigs.map((s) => s.signature));
      const entries: RawLogEntry[] = [];

      for (let i = 0; i < sigs.length; i++) {
        const tx = txBatch[i];
        const meta = sigs[i];
        if (!tx || !meta) continue;

        // Skip transactions past the safe reorg boundary
        if (opts.toSlot !== undefined && BigInt(meta.slot) > opts.toSlot) continue;

        entries.push({
          signature: meta.signature,
          slot:      BigInt(meta.slot),
          err:       meta.err ?? null,
          logs:      tx.meta?.logMessages ?? [],
          blockTime: tx.blockTime ?? Math.floor(Date.now() / 1000),
        });
      }

      batches.push(entries);
      before = sigs[sigs.length - 1]?.signature;

      // Reached a slot below fromSlot — no need to page further
      const oldestSlot = sigs[sigs.length - 1]?.slot;
      if (opts.fromSlot !== undefined && oldestSlot !== undefined && BigInt(oldestSlot) <= opts.fromSlot) {
        break;
      }

      await sleep(BACKFILL_RATE_LIMIT_MS);
    }

    // Process in chronological order (reverse the batches, then each batch)
    const chronological = batches.reverse().flatMap((b) => b.reverse());

    for (const entry of chronological) {
      const events = parseEvents(entry);

      for (const event of events) {
        try {
          await this.processor.processEvent(event);
          totalProcessed++;
        } catch (err) {
          this.retryManager.enqueue(entry);
          this.logger.error({ err, sig: entry.signature }, 'Backfill: handler error — queued for retry');
        }
      }
    }

    this.logger.info({ totalProcessed }, 'Backfill: complete');
    return totalProcessed;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
