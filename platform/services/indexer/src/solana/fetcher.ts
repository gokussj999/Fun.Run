import { PublicKey, type Connection, type ConfirmedSignatureInfo } from '@solana/web3.js';

import type { Logger } from '@funrun/logger';

import { BACKFILL_BATCH_SIZE, BACKFILL_RATE_LIMIT_MS } from '../constants.js';
import type { RawLogEntry, Signature } from '../types.js';
import type { RpcCircuitBreaker } from './connection.js';

export interface FetchedTransaction {
  readonly signature: Signature;
  readonly slot: bigint;
  readonly blockTime: number;
  readonly logs: string[];
  readonly err: unknown | null;
}

export class TransactionFetcher {
  constructor(
    private readonly breaker: RpcCircuitBreaker,
    private readonly logger: Logger,
  ) {}

  /**
   * Fetch a single transaction by signature with full log data.
   */
  async fetchTransaction(signature: string): Promise<RawLogEntry | null> {
    return this.breaker.callWithFallback(async (conn) => {
      const tx = await conn.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) return null;

      const logs = tx.meta?.logMessages ?? [];
      const slot = BigInt(tx.slot);
      const blockTime = tx.blockTime ?? Math.floor(Date.now() / 1000);

      return {
        signature,
        slot,
        blockTime,
        logs,
        err: tx.meta?.err ?? null,
      };
    });
  }

  /**
   * Fetch all signatures for the program since a given signature (for backfill / catch-up).
   * Returns signatures in chronological order (oldest first).
   */
  async fetchSignaturesSince(
    programId: string,
    sinceSignature: string | null,
    opts: { limit?: number; onBatch?: (sigs: ConfirmedSignatureInfo[]) => Promise<void> } = {},
  ): Promise<ConfirmedSignatureInfo[]> {
    const { limit = Infinity, onBatch } = opts;
    const all: ConfirmedSignatureInfo[] = [];
    let before: string | undefined = undefined;
    const until = sinceSignature ?? undefined;

    while (all.length < limit) {
      const batch: ConfirmedSignatureInfo[] = await this.breaker.callWithFallback(async (conn) => {
        return conn.getSignaturesForAddress(
          new PublicKey(programId),
          {
            limit: BACKFILL_BATCH_SIZE,
            ...(before !== undefined ? { before } : {}),
            ...(until !== undefined ? { until } : {}),
          },
          'confirmed',
        );
      });

      if (batch.length === 0) break;

      all.push(...batch);

      if (onBatch) {
        await onBatch(batch);
      }

      before = batch[batch.length - 1]?.signature;

      if (batch.length < BACKFILL_BATCH_SIZE) break; // reached end of history

      // Rate limiting to avoid RPC abuse
      await new Promise((r) => setTimeout(r, BACKFILL_RATE_LIMIT_MS));
    }

    // Return in chronological order (oldest first)
    return all.reverse();
  }

  /**
   * Fetch transactions in bulk for backfill.
   * Processes concurrently with limited parallelism.
   */
  async fetchTransactionsBatch(
    signatures: string[],
    concurrency = 10,
  ): Promise<(RawLogEntry | null)[]> {
    const results: (RawLogEntry | null)[] = [];

    for (let i = 0; i < signatures.length; i += concurrency) {
      const chunk = signatures.slice(i, i + concurrency);
      const chunk_results = await Promise.all(chunk.map((s) => this.fetchTransaction(s)));
      results.push(...chunk_results);

      if (i + concurrency < signatures.length) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    return results;
  }
}
