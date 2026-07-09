import type { Logger } from '@funrun/logger';

import type { RawLogEntry } from '../types.js';
import { MAX_RETRY_ATTEMPTS, RETRY_BASE_DELAY_MS, RETRY_MAX_DELAY_MS } from '../constants.js';

interface RetryItem {
  entry:    RawLogEntry;
  attempts: number;
  nextRetryAt: number;
}

/**
 * In-process retry queue for failed log entries.
 *
 * Uses exponential back-off: delay = min(base * 2^attempt, max).
 * After MAX_RETRY_ATTEMPTS, items are sent to the dead-letter store
 * (logged as error) and discarded.
 *
 * This is intentionally simple (in-memory). For production horizontal
 * scaling, swap this for a BullMQ queue — the interface is the same.
 */
export class RetryManager {
  private queue: RetryItem[] = [];

  constructor(private readonly logger: Logger) {}

  enqueue(entry: RawLogEntry, previousAttempts = 0): void {
    const attempts = previousAttempts + 1;
    const delayMs = Math.min(RETRY_BASE_DELAY_MS * 2 ** previousAttempts, RETRY_MAX_DELAY_MS);

    this.queue.push({
      entry,
      attempts,
      nextRetryAt: Date.now() + delayMs,
    });

    this.logger.warn(
      { sig: entry.signature, attempts, delayMs },
      'RetryManager: enqueued for retry',
    );
  }

  /**
   * Pop all items ready to be retried (nextRetryAt <= now).
   * Returns them for the caller to reprocess; removes them from the queue.
   */
  popReady(): Array<{ entry: RawLogEntry; attempts: number }> {
    const now = Date.now();
    const ready: Array<{ entry: RawLogEntry; attempts: number }> = [];
    const remaining: RetryItem[] = [];

    for (const item of this.queue) {
      if (item.nextRetryAt <= now) {
        ready.push({ entry: item.entry, attempts: item.attempts });
      } else {
        remaining.push(item);
      }
    }

    this.queue = remaining;
    return ready;
  }

  /**
   * Called when a retry attempt fails again.
   * Re-enqueues if under the limit; logs and drops otherwise.
   */
  handleFailure(entry: RawLogEntry, attempts: number, err: unknown): void {
    if (attempts >= MAX_RETRY_ATTEMPTS) {
      this.logger.error(
        { sig: entry.signature, attempts, err },
        'RetryManager: DLQ — max retries exceeded, discarding event',
      );
      return;
    }
    this.enqueue(entry, attempts);
  }

  get size(): number {
    return this.queue.length;
  }
}
