import type { VersionedTransaction } from '@solana/web3.js';
import type { Logger } from '@funrun/logger';

import type { ConnectionPool } from '../solana/connection-pool.js';

// ── Public interfaces ─────────────────────────────────────────────────────────

export interface TxSendOptions {
  /**
   * Number of RPC-level resend attempts before giving up.
   * 0 = send exactly once (no RPC retries). Default: 0.
   * Note: application-level retry logic is handled in Phase 8.5.9E+.
   */
  maxRetries?:    number;
  /**
   * Skip RPC preflight checks. Useful for resending an already-simulated tx
   * or for re-broadcasting a known-good signature. Default: false.
   */
  skipPreflight?: boolean;
}

export interface TxSendResult {
  /** Base-58 encoded transaction signature. */
  signature: string;
}

// ── Sender ────────────────────────────────────────────────────────────────────

export class TxSender {
  constructor(
    private readonly pool: ConnectionPool,
    private readonly logger: Logger,
  ) {}

  /**
   * Sends a signed VersionedTransaction and returns the signature.
   *
   * - No confirmation logic (handled in Phase 8.5.9E TxConfirmer).
   * - No application-level retry (handled in Phase 8.5.9E TxStateMachine).
   * - Failover to a fallback RPC endpoint is handled by ConnectionPool.
   */
  async send(tx: VersionedTransaction, opts: TxSendOptions = {}): Promise<TxSendResult> {
    const maxRetries   = opts.maxRetries   ?? 0;
    const skipPreflight = opts.skipPreflight ?? false;

    const serialized = tx.serialize();

    this.logger.debug(
      { sizeBytes: serialized.length, skipPreflight, maxRetries },
      'TxSender: sending',
    );

    const signature = await this.pool.withConnection(async (conn) =>
      conn.sendRawTransaction(serialized, {
        skipPreflight,
        maxRetries,
        preflightCommitment: 'confirmed',
      }),
    );

    this.logger.info({ signature }, 'TxSender: sent');

    return { signature };
  }
}
