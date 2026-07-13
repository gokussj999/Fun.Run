import { Connection, type Commitment } from '@solana/web3.js';
import type { Logger } from '@funrun/logger';

import { createRpcClient } from './client.js';
import type { RpcHealthManager } from '../rpc/health-manager.js';

export interface ConnectionPoolOptions {
  commitment?: Commitment;
  timeoutMs?:  number;
}

export class ConnectionPool {
  private readonly cache = new Map<string, Connection>();
  private readonly commitment: Commitment;
  private readonly defaultTimeoutMs: number;

  constructor(
    private readonly healthManager: RpcHealthManager,
    private readonly logger: Logger,
    opts: ConnectionPoolOptions = {},
  ) {
    this.commitment       = opts.commitment  ?? 'confirmed';
    this.defaultTimeoutMs = opts.timeoutMs   ?? 10_000;
  }

  /** Returns a cached Connection for the highest-priority healthy endpoint. */
  getConnection(role: 'primary' | 'fallback' = 'primary'): Connection {
    const url =
      role === 'primary'
        ? this.healthManager.getPrimaryUrl()
        : (this.healthManager.getFallbackUrl() ?? this.healthManager.getPrimaryUrl());
    return this.getOrCreate(url);
  }

  /**
   * Executes fn against the primary endpoint.
   * On network-level failure, automatically fails over to the fallback endpoint.
   * Reports success/failure latencies to the health manager.
   */
  async withConnection<T>(
    fn: (conn: Connection, url: string) => Promise<T>,
    timeoutMs?: number,
  ): Promise<T> {
    const timeout = timeoutMs ?? this.defaultTimeoutMs;
    const primaryUrl = this.healthManager.getPrimaryUrl();
    const start = Date.now();

    try {
      const result = await this.raceTimeout(fn(this.getOrCreate(primaryUrl), primaryUrl), timeout);
      this.healthManager.recordSuccess(primaryUrl, Date.now() - start);
      return result;
    } catch (primaryErr) {
      const primaryLatency = Date.now() - start;
      this.healthManager.recordFailure(
        primaryUrl,
        primaryErr instanceof Error ? primaryErr : new Error(String(primaryErr)),
      );
      this.healthManager.recordFailover(primaryUrl);

      const fallbackUrl = this.healthManager.getFallbackUrl(primaryUrl);
      if (!fallbackUrl) {
        this.logger.error(
          { primaryLatency, err: primaryErr },
          'ConnectionPool: primary failed, no fallback available',
        );
        throw primaryErr;
      }

      this.logger.warn(
        {
          primaryErr: primaryErr instanceof Error ? primaryErr.message : String(primaryErr),
          fallbackUrl,
        },
        'ConnectionPool: failing over to fallback endpoint',
      );

      const fallbackStart = Date.now();
      try {
        const result = await this.raceTimeout(fn(this.getOrCreate(fallbackUrl), fallbackUrl), timeout);
        this.healthManager.recordSuccess(fallbackUrl, Date.now() - fallbackStart);
        return result;
      } catch (fallbackErr) {
        this.healthManager.recordFailure(
          fallbackUrl,
          fallbackErr instanceof Error ? fallbackErr : new Error(String(fallbackErr)),
        );
        this.logger.error(
          { err: fallbackErr },
          'ConnectionPool: both primary and fallback failed',
        );
        throw fallbackErr;
      }
    }
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  private getOrCreate(url: string): Connection {
    let conn = this.cache.get(url);
    if (!conn) {
      conn = createRpcClient({ url, commitment: this.commitment });
      this.cache.set(url, conn);
    }
    return conn;
  }

  private raceTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`RPC call timed out after ${ms}ms`)), ms),
      ),
    ]);
  }
}
