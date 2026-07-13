import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';

import type { ConnectionPool } from '../solana/connection-pool.js';
import type { TxStateMachine } from '../lifecycle/tx-state-machine.js';
import { TxStateError, InvalidTransitionError, TxNotFoundError } from '../lifecycle/tx-state-machine.js';

// ── Options ───────────────────────────────────────────────────────────────────

export interface TxReconcilerOptions {
  /** How often to run a reconciliation pass. Default: 30 000 ms. */
  intervalMs?:       number;
  /**
   * Pre-submit records (BUILDING/SIGNING/PENDING) with no DB update within this
   * window are considered orphaned (executor died). Default: 10 min.
   */
  orphanThresholdMs?: number;
  /**
   * SUBMITTED records with no update in this window are considered stuck and
   * re-checked against the chain. Default: 10 min (same threshold).
   */
  stuckSubmittedMs?: number;
  /** Max records processed per category per pass. Default: 50. */
  batchSize?:        number;
}

// ── Reconciler ────────────────────────────────────────────────────────────────

/**
 * TxReconciler — background safety net for the pending_txs table.
 *
 * Runs on a fixed interval and handles two categories:
 *
 *  1. Orphaned pre-submit records (BUILDING / SIGNING / PENDING)
 *     Executors that died mid-flight leave records stuck in these states.
 *     The reconciler marks them FAILED with canResubmit=true so callers can retry.
 *
 *  2. Stuck SUBMITTED records
 *     TxConfirmer polls every 2 s, but after a service restart its WS subscriptions
 *     are gone. The reconciler catches any SUBMITTED records that TxConfirmer hasn't
 *     touched in a while, fetches their on-chain status, and drives them to
 *     CONFIRMED / FINALIZED / EXPIRED / FAILED as appropriate.
 *
 * Multi-instance safety:
 *   All state transitions go through TxStateMachine.cas() — the first instance to
 *   win the optimistic UPDATE wins; others see null and skip silently.
 */
export class TxReconciler {
  private timer:   ReturnType<typeof setInterval> | null = null;
  private running: boolean = false;

  private readonly intervalMs:        number;
  private readonly orphanThresholdMs: number;
  private readonly stuckSubmittedMs:  number;
  private readonly batchSize:         number;

  constructor(
    private readonly db:      PrismaClient,
    private readonly pool:    ConnectionPool,
    private readonly machine: TxStateMachine,
    private readonly logger:  Logger,
    opts: TxReconcilerOptions = {},
  ) {
    this.intervalMs        = opts.intervalMs        ?? 30_000;
    this.orphanThresholdMs = opts.orphanThresholdMs ?? 10 * 60 * 1_000;
    this.stuckSubmittedMs  = opts.stuckSubmittedMs  ?? 10 * 60 * 1_000;
    this.batchSize         = opts.batchSize         ?? 50;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  start(): void {
    this.timer = setInterval(() => { void this.runOnce(); }, this.intervalMs);
    void this.runOnce(); // warm-up pass immediately
    this.logger.info(
      { intervalMs: this.intervalMs, orphanThresholdMs: this.orphanThresholdMs },
      'TxReconciler: started',
    );
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.logger.info('TxReconciler: stopped');
  }

  // ── Private ───────────────────────────────────────────────────────────────────

  private async runOnce(): Promise<void> {
    if (this.running) return; // skip if previous pass hasn't finished
    this.running = true;
    try {
      await this.reconcileOrphaned();
      await this.reconcileStuckSubmitted();
    } catch (err) {
      this.logger.error({ err }, 'TxReconciler: unhandled error in reconciliation pass');
    } finally {
      this.running = false;
    }
  }

  /**
   * Finds BUILDING / SIGNING / PENDING records with no DB update for longer than
   * orphanThresholdMs. These are executors that died without cleaning up.
   *
   * Marks each FAILED with canResubmit=true so the caller can retry.
   * PENDING bytes are stale (the blockhash embedded in serializedTx has expired),
   * so re-submission always needs a fresh build cycle regardless.
   */
  private async reconcileOrphaned(): Promise<void> {
    const cutoff = new Date(Date.now() - this.orphanThresholdMs);

    const orphans = await this.db.pendingTx.findMany({
      where: {
        status: { in: ['BUILDING', 'SIGNING', 'PENDING'] as const },
        updatedAt: { lt: cutoff },
      },
      take: this.batchSize,
      orderBy: { updatedAt: 'asc' },
    });

    if (orphans.length === 0) return;

    this.logger.warn(
      { count: orphans.length, cutoff },
      'TxReconciler: found orphaned pre-submit records',
    );

    for (const tx of orphans) {
      this.logger.info(
        { txId: tx.id, status: tx.status, updatedAt: tx.updatedAt, operationType: tx.operationType },
        'TxReconciler: marking orphaned tx as FAILED',
      );
      await this.safeMarkFailed(
        tx.id,
        'Orphaned: executor process died without completing',
        'ORPHANED',
        true, // always resubmittable — no on-chain side effects occurred
      );
    }
  }

  /**
   * Finds SUBMITTED records that haven't been updated in stuckSubmittedMs.
   * TxConfirmer handles the normal path; this is the safety-net for after restarts.
   *
   * For each stuck record:
   *  - Fetches on-chain status via getSignatureStatuses (batched).
   *  - On-chain error → FAILED (canResubmit=false).
   *  - Finalized → CONFIRMED then FINALIZED.
   *  - Confirmed → CONFIRMED.
   *  - Not found AND blockhash expired → EXPIRED.
   *  - Not found AND blockhash still valid → leave (TxConfirmer will catch it).
   */
  private async reconcileStuckSubmitted(): Promise<void> {
    const cutoff = new Date(Date.now() - this.stuckSubmittedMs);

    const stuck = await this.db.pendingTx.findMany({
      where: {
        status: 'SUBMITTED',
        signature: { not: null },
        updatedAt: { lt: cutoff },
      },
      take: this.batchSize,
      orderBy: { updatedAt: 'asc' },
    });

    if (stuck.length === 0) return;

    this.logger.warn(
      { count: stuck.length },
      'TxReconciler: found stuck SUBMITTED records — checking on-chain status',
    );

    const signatures = stuck
      .map((tx) => tx.signature)
      .filter((sig): sig is string => sig !== null);

    if (signatures.length === 0) return;

    await this.pool.withConnection(async (conn) => {
      const { value: statuses } = await conn.getSignatureStatuses(signatures);
      const currentHeight = BigInt(await conn.getBlockHeight('confirmed'));

      for (let i = 0; i < stuck.length; i++) {
        const tx = stuck[i];
        if (tx === undefined || tx.signature === null) continue;

        const status = statuses[i] ?? null;

        if (status?.err) {
          const errStr = JSON.stringify(status.err);
          this.logger.warn(
            { txId: tx.id, sig: tx.signature, err: errStr },
            'TxReconciler: on-chain error on stuck SUBMITTED tx',
          );
          await this.safeMarkFailed(tx.id, `on-chain error: ${errStr}`, 'ON_CHAIN_ERROR', false);
          continue;
        }

        if (status?.confirmationStatus === 'finalized') {
          this.logger.info({ txId: tx.id }, 'TxReconciler: stuck tx is finalized — promoting');
          await this.safeTransition(() =>
            this.machine.toConfirmed(tx.id, BigInt(status.slot ?? 0)),
          );
          await this.safeTransition(() => this.machine.toFinalized(tx.id));
          continue;
        }

        if (status?.confirmationStatus === 'confirmed') {
          this.logger.info({ txId: tx.id }, 'TxReconciler: stuck tx is confirmed — promoting');
          await this.safeTransition(() =>
            this.machine.toConfirmed(tx.id, BigInt(status.slot ?? 0)),
          );
          continue;
        }

        // Not yet processed by the cluster.
        // Check blockhash expiry: if expired, mark EXPIRED so it can be resubmitted.
        if (
          tx.lastValidBlockHeight !== null &&
          currentHeight > tx.lastValidBlockHeight
        ) {
          this.logger.info(
            { txId: tx.id, currentHeight, lastValidBlockHeight: tx.lastValidBlockHeight },
            'TxReconciler: stuck tx blockhash expired — marking EXPIRED',
          );
          await this.safeTransition(() => this.machine.toExpired(tx.id));
        }
        // Otherwise: not expired, not confirmed — leave for TxConfirmer to pick up.
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private async safeMarkFailed(
    id:          string,
    message:     string,
    code:        string,
    canResubmit: boolean,
  ): Promise<void> {
    try {
      await this.machine.toFailed(id, message, code, canResubmit);
    } catch (err) {
      if (isStateRaceError(err)) {
        this.logger.debug(
          { txId: id, err: (err as Error).message },
          'TxReconciler: state race on FAILED — another worker won, skipping',
        );
      } else {
        throw err;
      }
    }
  }

  private async safeTransition(fn: () => Promise<unknown>): Promise<void> {
    try {
      await fn();
    } catch (err) {
      if (isStateRaceError(err)) {
        this.logger.debug(
          { err: (err as Error).message },
          'TxReconciler: CAS race — another worker won, skipping',
        );
      } else {
        throw err;
      }
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns true for errors that indicate a concurrent worker already handled
 * the transition — safe to skip silently.
 */
function isStateRaceError(err: unknown): boolean {
  return (
    err instanceof TxStateError ||
    err instanceof InvalidTransitionError ||
    err instanceof TxNotFoundError
  );
}
