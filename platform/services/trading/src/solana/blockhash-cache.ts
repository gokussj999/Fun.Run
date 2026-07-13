import type { BlockhashWithExpiryBlockHeight } from '@solana/web3.js';
import type { Logger } from '@funrun/logger';

import type { ConnectionPool } from './connection-pool.js';

interface CachedEntry extends BlockhashWithExpiryBlockHeight {
  fetchedAt: number;
  rpcUrl:    string;
}

const STALE_THRESHOLD_MS  = 60_000;
const REFRESH_INTERVAL_MS = 45_000;

export class BlockhashCache {
  private cached: CachedEntry | null = null;
  private refreshHandle: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly pool: ConnectionPool,
    private readonly logger: Logger,
  ) {}

  /**
   * Returns a valid cached blockhash, or fetches a fresh one if stale.
   * Callers should call invalidate() on BlockhashNotFound errors.
   */
  async get(): Promise<BlockhashWithExpiryBlockHeight> {
    if (this.cached !== null && Date.now() - this.cached.fetchedAt < STALE_THRESHOLD_MS) {
      return { blockhash: this.cached.blockhash, lastValidBlockHeight: this.cached.lastValidBlockHeight };
    }
    return this.refresh();
  }

  async refresh(): Promise<BlockhashWithExpiryBlockHeight> {
    return this.pool.withConnection(async (conn, rpcUrl) => {
      const bh = await conn.getLatestBlockhash('confirmed');
      this.cached = { ...bh, fetchedAt: Date.now(), rpcUrl };
      this.logger.debug(
        { blockhash: bh.blockhash.slice(0, 8), lastValidBlockHeight: bh.lastValidBlockHeight, rpcUrl },
        'BlockhashCache: refreshed',
      );
      return { blockhash: bh.blockhash, lastValidBlockHeight: bh.lastValidBlockHeight };
    });
  }

  /** Call this when the RPC returns BlockhashNotFound. */
  invalidate(): void {
    this.cached = null;
    this.logger.debug('BlockhashCache: invalidated');
  }

  /** Age of current cached entry in ms, or Infinity if no entry. */
  getAgeMs(): number {
    return this.cached !== null ? Date.now() - this.cached.fetchedAt : Infinity;
  }

  isStale(): boolean {
    return this.getAgeMs() >= STALE_THRESHOLD_MS;
  }

  /** Pre-warms the cache and begins a background 45 s refresh loop. */
  start(): void {
    this.refreshHandle = setInterval(() => {
      void this.refresh().catch((err) => {
        this.logger.warn({ err }, 'BlockhashCache: background refresh failed');
      });
    }, REFRESH_INTERVAL_MS);

    void this.refresh().catch((err) => {
      this.logger.warn({ err }, 'BlockhashCache: initial warm-up failed');
    });

    this.logger.info('BlockhashCache: started');
  }

  stop(): void {
    if (this.refreshHandle !== null) {
      clearInterval(this.refreshHandle);
      this.refreshHandle = null;
    }
  }
}
