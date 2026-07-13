import type { Logger } from '@funrun/logger';

import type { ConnectionPool } from '../solana/connection-pool.js';
import type { TxStore } from './tx-store.js';
import { TxStateMachine, TxStateError } from './tx-state-machine.js';
import type { PendingTxRecord } from './pending-tx.types.js';

export interface TxConfirmerOptions {
  /** How often to poll for SUBMITTED/CONFIRMED txs. Default: 2 000 ms. */
  pollIntervalMs?:  number;
  /** Max age (ms) of a SUBMITTED tx before it is force-marked EXPIRED. Default: 5 min. */
  maxSubmittedMs?:  number;
}

/**
 * TxConfirmer — polls SUBMITTED and CONFIRMED transactions and drives them
 * to CONFIRMED, FINALIZED, EXPIRED, or FAILED.
 *
 * Two confirmation paths:
 *  1. WebSocket (fast): subscribe when tx enters SUBMITTED; fires on first confirmation.
 *  2. Poll fallback (reliable): every pollIntervalMs, batch-check all SUBMITTED txs.
 *     Fallback also handles CONFIRMED → FINALIZED promotion.
 *
 * WS subscriptions auto-cancel after firing (one-shot in web3.js v1.x).
 * On stop(), all remaining WS subscriptions are explicitly removed.
 */
export class TxConfirmer {
  private timer:            ReturnType<typeof setInterval> | null = null;
  // signature → Connection subscription id
  private wsSubscriptions:  Map<string, number> = new Map();
  // guard against concurrent poll executions
  private polling:          boolean = false;

  private readonly pollIntervalMs: number;
  private readonly maxSubmittedMs: number;

  constructor(
    private readonly pool:    ConnectionPool,
    private readonly store:   TxStore,
    private readonly machine: TxStateMachine,
    private readonly logger:  Logger,
    opts: TxConfirmerOptions = {},
  ) {
    this.pollIntervalMs = opts.pollIntervalMs ?? 2_000;
    this.maxSubmittedMs = opts.maxSubmittedMs ?? 5 * 60 * 1_000;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  start(): void {
    this.timer = setInterval(() => { void this.pollOnce(); }, this.pollIntervalMs);
    void this.pollOnce(); // immediate warm-up pass
    this.logger.info({ pollIntervalMs: this.pollIntervalMs }, 'TxConfirmer: started');
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    const conn = this.pool.getConnection('primary');
    for (const [sig, subId] of this.wsSubscriptions) {
      conn.removeSignatureListener(subId).catch((err) => {
        this.logger.warn({ err, sig }, 'TxConfirmer: failed to remove WS subscription on stop');
      });
    }
    this.wsSubscriptions.clear();

    this.logger.info('TxConfirmer: stopped');
  }

  // ── WebSocket fast path ───────────────────────────────────────────────────────

  /**
   * Subscribes to the Solana WS endpoint for fast (sub-poll) confirmation.
   * Should be called immediately after a tx enters SUBMITTED state.
   * The subscription is one-shot — web3.js removes it after the first callback.
   */
  subscribeSignature(txId: string, signature: string): void {
    if (this.wsSubscriptions.has(signature)) return; // already watching

    const conn = this.pool.getConnection('primary');

    const subId = conn.onSignatureWithOptions(
      signature,
      (result, _ctx) => {
        this.wsSubscriptions.delete(signature);

        // web3.js v1.95+ uses a union: SignatureStatusNotification (has 'err')
        // | SignatureReceivedNotification (no 'err' — tx received but not yet confirmed).
        // We only act on the status notification.
        if (!('err' in result)) return;

        void (async () => {
          if (result.err) {
            const errStr = JSON.stringify(result.err);
            this.logger.warn({ txId, sig: signature, err: errStr }, 'TxConfirmer: WS — on-chain error');
            await this.safeTransition(() =>
              this.machine.toFailed(txId, `on-chain error: ${errStr}`, 'ON_CHAIN_ERROR', false),
            );
          } else {
            this.logger.debug({ txId, sig: signature }, 'TxConfirmer: WS — confirmed');
            await this.safeTransition(() => this.machine.toConfirmed(txId, 0n));
          }
        })();
      },
      { commitment: 'confirmed' },
    );

    this.wsSubscriptions.set(signature, subId);
  }

  // ── Polling ───────────────────────────────────────────────────────────────────

  private async pollOnce(): Promise<void> {
    if (this.polling) return; // skip if previous poll is still running
    this.polling = true;
    try {
      await this.checkSubmitted();
      await this.checkConfirmed();
    } catch (err) {
      this.logger.error({ err }, 'TxConfirmer: poll error');
    } finally {
      this.polling = false;
    }
  }

  private async checkSubmitted(): Promise<void> {
    const submitted = await this.store.findByStatus('SUBMITTED');
    if (submitted.length === 0) return;

    const signatures = submitted.map((tx) => tx.signature).filter(
      (sig): sig is string => sig !== null,
    );
    if (signatures.length === 0) return;

    await this.pool.withConnection(async (conn) => {
      const { value: statuses } = await conn.getSignatureStatuses(signatures);
      const currentHeight = BigInt(await conn.getBlockHeight('confirmed'));

      for (let i = 0; i < submitted.length; i++) {
        const tx = submitted[i];
        if (tx === undefined || tx.signature === null) continue;

        const status = statuses[i] ?? null;

        // On-chain error
        if (status?.err) {
          const errStr = JSON.stringify(status.err);
          this.logger.warn({ txId: tx.id, sig: tx.signature, err: errStr }, 'TxConfirmer: poll — on-chain error');
          await this.safeTransition(() =>
            this.machine.toFailed(tx.id, `on-chain error: ${errStr}`, 'ON_CHAIN_ERROR', false),
          );
          continue;
        }

        // Finalized — promote directly through CONFIRMED
        if (status?.confirmationStatus === 'finalized') {
          await this.safeTransition(() =>
            this.machine.toConfirmed(tx.id, BigInt(status.slot ?? 0)),
          );
          await this.safeTransition(() => this.machine.toFinalized(tx.id));
          continue;
        }

        // Confirmed
        if (status?.confirmationStatus === 'confirmed') {
          await this.safeTransition(() =>
            this.machine.toConfirmed(tx.id, BigInt(status.slot ?? 0)),
          );
          continue;
        }

        // Not yet processed — check expiry
        if (this.isExpired(tx, currentHeight)) {
          this.logger.info(
            { txId: tx.id, sig: tx.signature, currentHeight, lvbh: tx.lastValidBlockHeight },
            'TxConfirmer: poll — blockhash expired',
          );
          await this.safeTransition(() => this.machine.toExpired(tx.id));
          continue;
        }

        // Check max age wall-clock fallback
        const ageMs = Date.now() - tx.createdAt.getTime();
        if (ageMs > this.maxSubmittedMs) {
          this.logger.warn({ txId: tx.id, ageMs }, 'TxConfirmer: poll — tx exceeded max age, expiring');
          await this.safeTransition(() => this.machine.toExpired(tx.id));
        }
      }
    });
  }

  private async checkConfirmed(): Promise<void> {
    const confirmed = await this.store.findByStatus('CONFIRMED');
    if (confirmed.length === 0) return;

    const withSig: Array<{ tx: PendingTxRecord; sig: string }> = confirmed
      .filter((tx): tx is PendingTxRecord & { signature: string } => tx.signature !== null)
      .map((tx) => ({ tx, sig: tx.signature }));

    if (withSig.length === 0) return;

    await this.pool.withConnection(async (conn) => {
      const sigs = withSig.map((e) => e.sig);
      const { value: statuses } = await conn.getSignatureStatuses(sigs);

      for (let i = 0; i < withSig.length; i++) {
        const entry = withSig[i];
        if (entry === undefined) continue;
        const status = statuses[i] ?? null;

        if (status?.confirmationStatus === 'finalized' && !status.err) {
          this.logger.info({ txId: entry.tx.id }, 'TxConfirmer: poll — finalized');
          await this.safeTransition(() => this.machine.toFinalized(entry.tx.id));
        }
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private isExpired(tx: PendingTxRecord, currentBlockHeight: bigint): boolean {
    if (tx.lastValidBlockHeight === null) return false;
    return currentBlockHeight > tx.lastValidBlockHeight;
  }

  /**
   * Wraps a state machine transition so that TxStateError (concurrent race loss)
   * is swallowed with a debug log rather than crashing the poll loop.
   * All other errors are re-thrown.
   */
  private async safeTransition(fn: () => Promise<PendingTxRecord>): Promise<void> {
    try {
      await fn();
    } catch (err) {
      if (err instanceof TxStateError) {
        this.logger.debug({ err: err.message }, 'TxConfirmer: CAS race — another worker won, skipping');
      } else {
        throw err;
      }
    }
  }
}
