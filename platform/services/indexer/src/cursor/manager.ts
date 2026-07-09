import type { Logger } from '@funrun/logger';

import type { IndexerCursor } from '../types.js';
import { CursorStore } from './store.js';
import { CURSOR_FLUSH_INTERVAL_MS } from '../constants.js';

/**
 * CursorManager maintains an in-memory cursor that is flushed to persistent storage
 * every CURSOR_FLUSH_INTERVAL_MS milliseconds and immediately on shutdown.
 *
 * This avoids hitting the DB on every single event while still keeping the
 * cursor durable enough that a crash loses at most 2 seconds of progress.
 */
export class CursorManager {
  private current: IndexerCursor | null = null;
  private dirty = false;
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly store: CursorStore,
    private readonly logger: Logger,
  ) {}

  async initialize(): Promise<void> {
    this.current = await this.store.read();
    if (this.current) {
      this.logger.info(
        { slot: this.current.lastProcessedSlot, sig: this.current.lastProcessedSignature?.slice(0, 12) },
        'CursorManager: restored cursor from storage',
      );
    } else {
      this.logger.info('CursorManager: no cursor found — will start from genesis or configured slot');
    }

    this.flushTimer = setInterval(() => {
      this.flush().catch((err) =>
        this.logger.error({ err }, 'CursorManager: periodic flush failed'),
      );
    }, CURSOR_FLUSH_INTERVAL_MS);
  }

  /** Update the in-memory cursor. Does NOT write to storage immediately. */
  advance(slot: bigint, signature: string): void {
    if (!this.current || slot >= this.current.lastProcessedSlot) {
      this.current = { lastProcessedSlot: slot, lastProcessedSignature: signature, lastProcessedAt: new Date() };
      this.dirty = true;
    }
  }

  get(): IndexerCursor | null {
    return this.current;
  }

  getLastSlot(): bigint {
    return this.current?.lastProcessedSlot ?? 0n;
  }

  /** Write dirty cursor to storage. Called by the periodic timer and on shutdown. */
  async flush(): Promise<void> {
    if (!this.dirty || !this.current) return;
    const snapshot = this.current;
    this.dirty = false;
    try {
      await this.store.write(snapshot);
    } catch (err) {
      this.dirty = true; // re-mark dirty so next tick retries
      throw err;
    }
  }

  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
    this.logger.info({ slot: this.current?.lastProcessedSlot }, 'CursorManager: shutdown flush complete');
  }
}
