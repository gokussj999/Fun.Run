import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';

import type { TxStateMachine } from '../lifecycle/tx-state-machine.js';
import { TxStateError, InvalidTransitionError, TxNotFoundError } from '../lifecycle/tx-state-machine.js';

// ── Graduation operation types ────────────────────────────────────────────────

type GradOpType = 'INITIATE_GRADUATION' | 'COMPLETE_GRADUATION';

// States where a pending_tx is actively making progress (not yet terminal or failed).
const ACTIVE_STATUSES = new Set<string>([
  'BUILDING', 'SIGNING', 'PENDING', 'SUBMITTED', 'CONFIRMED',
]);

// ── Dispatcher interface ───────────────────────────────────────────────────────

/**
 * GraduationDispatcher — implemented by Phase 8.5.9H (GraduationExecutor).
 *
 * The crank calls these methods when it determines a graduation step needs
 * to be sent on-chain. The dispatcher is responsible for:
 *   - Idempotency (generating and managing PendingTx records)
 *   - Building, signing, and sending the Anchor instruction
 *   - Returning or throwing without blocking the crank
 *
 * Both methods must be safe to call concurrently across multiple crank instances
 * — idempotency enforcement happens inside the dispatcher via TxStore.create().
 */
export interface GraduationDispatcher {
  /**
   * Sends the initiate_graduation instruction on-chain for a GRADUATING coin.
   * Should create a PendingTx with operationType=INITIATE_GRADUATION.
   */
  dispatchInitiate(coinId: string, mintAddress: string): Promise<void>;

  /**
   * Sends the complete_graduation instruction on-chain.
   * Called only after INITIATE_GRADUATION is FINALIZED.
   * Should create a PendingTx with operationType=COMPLETE_GRADUATION.
   */
  dispatchComplete(coinId: string, mintAddress: string): Promise<void>;
}

// ── Options ───────────────────────────────────────────────────────────────────

export interface GraduationCrankOptions {
  /** How often to scan for GRADUATING coins. Default: 30 000 ms. */
  intervalMs?: number;
  /** Max coins processed per pass. Default: 20. */
  batchSize?:  number;
}

// ── Crank ─────────────────────────────────────────────────────────────────────

/**
 * GraduationCrank — background orchestrator for the two-phase graduation process.
 *
 * Graduation phases:
 *   Phase 1: initiate_graduation — permissionless ix that moves bonding curve
 *            state on-chain. Triggered once per coin.
 *   Phase 2: complete_graduation — permissionless ix that calls Raydium CPMM
 *            to create the AMM pool. Triggered after Phase 1 is FINALIZED.
 *
 * State machine per coin:
 *
 *   GRADUATING coin found
 *     └─ COMPLETE_GRADUATION FINALIZED?     → mark coin GRADUATED, done
 *     └─ COMPLETE_GRADUATION active?        → skip (in progress)
 *     └─ COMPLETE_GRADUATION FAILED/EXPIRED + canResubmit? → abandon + re-dispatch
 *     └─ COMPLETE_GRADUATION non-recoverable?              → log, skip (manual fix)
 *     └─ No COMPLETE_GRADUATION yet:
 *          └─ INITIATE_GRADUATION FINALIZED? → dispatch complete
 *          └─ INITIATE_GRADUATION active?    → skip
 *          └─ INITIATE_GRADUATION FAILED/EXPIRED + canResubmit? → abandon + re-dispatch
 *          └─ INITIATE_GRADUATION non-recoverable?              → log, skip
 *          └─ No graduation tx at all        → dispatch initiate
 *
 * Multi-instance safety:
 *   The dispatcher creates PendingTx records with coin-scoped idempotency keys.
 *   The DB unique constraint on idempotency_key ensures only one instance succeeds
 *   when two cranks race to dispatch the same operation.
 *   State machine transitions (abandon/reset) go through CAS; races are swallowed.
 */
export class GraduationCrank {
  private timer:   ReturnType<typeof setInterval> | null = null;
  private running: boolean = false;

  private readonly intervalMs: number;
  private readonly batchSize:  number;

  constructor(
    private readonly db:         PrismaClient,
    private readonly machine:    TxStateMachine,
    private readonly dispatcher: GraduationDispatcher,
    private readonly logger:     Logger,
    opts: GraduationCrankOptions = {},
  ) {
    this.intervalMs = opts.intervalMs ?? 30_000;
    this.batchSize  = opts.batchSize  ?? 20;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  start(): void {
    this.timer = setInterval(() => { void this.runOnce(); }, this.intervalMs);
    void this.runOnce(); // warm-up pass immediately
    this.logger.info({ intervalMs: this.intervalMs }, 'GraduationCrank: started');
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.logger.info('GraduationCrank: stopped');
  }

  // ── Private ───────────────────────────────────────────────────────────────────

  private async runOnce(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.processBatch();
    } catch (err) {
      this.logger.error({ err }, 'GraduationCrank: unhandled error in pass');
    } finally {
      this.running = false;
    }
  }

  private async processBatch(): Promise<void> {
    const coins = await this.db.coin.findMany({
      where:   { status: 'GRADUATING' },
      take:    this.batchSize,
      orderBy: { graduationInitiatedAt: 'asc' }, // oldest-waiting first
      select:  { id: true, mintAddress: true, graduationInitiatedAt: true },
    });

    if (coins.length === 0) return;

    this.logger.debug({ count: coins.length }, 'GraduationCrank: processing GRADUATING coins');

    for (const coin of coins) {
      try {
        await this.processCoin(coin.id, coin.mintAddress);
      } catch (err) {
        // One coin's error must not block others.
        this.logger.error({ coinId: coin.id, err }, 'GraduationCrank: error processing coin — continuing');
      }
    }
  }

  private async processCoin(coinId: string, mintAddress: string): Promise<void> {
    // Fetch all graduation pending_txs for this coin, newest first.
    const txs = await this.db.pendingTx.findMany({
      where: {
        coinId,
        operationType: { in: ['INITIATE_GRADUATION', 'COMPLETE_GRADUATION'] as const },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build a map of the most-recent record per operation type.
    const latestByOp = new Map<GradOpType, typeof txs[number]>();
    for (const tx of txs) {
      const op = tx.operationType as GradOpType;
      if (!latestByOp.has(op)) latestByOp.set(op, tx);
    }

    const initiateTx = latestByOp.get('INITIATE_GRADUATION');
    const completeTx = latestByOp.get('COMPLETE_GRADUATION');

    // ── 1. COMPLETE_GRADUATION done → mark coin GRADUATED ────────────────────
    if (completeTx?.status === 'FINALIZED') {
      await this.markGraduated(coinId);
      return;
    }

    // ── 2. COMPLETE_GRADUATION active → skip ─────────────────────────────────
    if (completeTx !== undefined && ACTIVE_STATUSES.has(completeTx.status)) {
      this.logger.debug(
        { coinId, txId: completeTx.id, status: completeTx.status },
        'GraduationCrank: complete_graduation in progress — skipping',
      );
      return;
    }

    // ── 3. COMPLETE_GRADUATION failed but recoverable → abandon + re-dispatch ─
    if (
      completeTx !== undefined &&
      (completeTx.status === 'FAILED' || completeTx.status === 'EXPIRED') &&
      completeTx.canResubmit
    ) {
      this.logger.info(
        { coinId, txId: completeTx.id, status: completeTx.status },
        'GraduationCrank: abandoning failed complete_graduation — will re-dispatch',
      );
      await this.safeAbandon(completeTx.id);
      await this.safeDispatch(
        () => this.dispatcher.dispatchComplete(coinId, mintAddress),
        coinId,
        'COMPLETE_GRADUATION',
      );
      return;
    }

    // ── 4. COMPLETE_GRADUATION non-recoverable → manual intervention ──────────
    if (
      completeTx !== undefined &&
      (completeTx.status === 'ABANDONED' ||
        ((completeTx.status === 'FAILED' || completeTx.status === 'EXPIRED') && !completeTx.canResubmit))
    ) {
      this.logger.error(
        { coinId, txId: completeTx.id, status: completeTx.status },
        'GraduationCrank: complete_graduation is non-recoverable — manual intervention required',
      );
      return;
    }

    // ── 5. No COMPLETE_GRADUATION yet — evaluate INITIATE_GRADUATION ─────────

    if (initiateTx?.status === 'FINALIZED') {
      this.logger.info(
        { coinId, txId: initiateTx.id },
        'GraduationCrank: initiate_graduation finalized — dispatching complete_graduation',
      );
      await this.safeDispatch(
        () => this.dispatcher.dispatchComplete(coinId, mintAddress),
        coinId,
        'COMPLETE_GRADUATION',
      );
      return;
    }

    if (initiateTx !== undefined && ACTIVE_STATUSES.has(initiateTx.status)) {
      this.logger.debug(
        { coinId, txId: initiateTx.id, status: initiateTx.status },
        'GraduationCrank: initiate_graduation in progress — skipping',
      );
      return;
    }

    if (
      initiateTx !== undefined &&
      (initiateTx.status === 'FAILED' || initiateTx.status === 'EXPIRED') &&
      initiateTx.canResubmit
    ) {
      this.logger.info(
        { coinId, txId: initiateTx.id, status: initiateTx.status },
        'GraduationCrank: abandoning failed initiate_graduation — will re-dispatch',
      );
      await this.safeAbandon(initiateTx.id);
      await this.safeDispatch(
        () => this.dispatcher.dispatchInitiate(coinId, mintAddress),
        coinId,
        'INITIATE_GRADUATION',
      );
      return;
    }

    if (
      initiateTx !== undefined &&
      (initiateTx.status === 'ABANDONED' ||
        ((initiateTx.status === 'FAILED' || initiateTx.status === 'EXPIRED') && !initiateTx.canResubmit))
    ) {
      this.logger.error(
        { coinId, txId: initiateTx.id, status: initiateTx.status },
        'GraduationCrank: initiate_graduation is non-recoverable — manual intervention required',
      );
      return;
    }

    // ── 6. No graduation tx exists at all → kick off initiate ────────────────
    this.logger.info(
      { coinId, mintAddress },
      'GraduationCrank: dispatching initiate_graduation',
    );
    await this.safeDispatch(
      () => this.dispatcher.dispatchInitiate(coinId, mintAddress),
      coinId,
      'INITIATE_GRADUATION',
    );
  }

  /**
   * CAS-updates the coin from GRADUATING → GRADUATED.
   * Safe to call concurrently: updateMany WHERE status=GRADUATING ensures
   * only the first caller succeeds; subsequent callers see count=0 and log.
   */
  private async markGraduated(coinId: string): Promise<void> {
    const result = await this.db.coin.updateMany({
      where: { id: coinId, status: 'GRADUATING' },
      data:  { status: 'GRADUATED', graduationCompletedAt: new Date() },
    });

    if (result.count > 0) {
      this.logger.info({ coinId }, 'GraduationCrank: coin marked GRADUATED');
    } else {
      this.logger.debug({ coinId }, 'GraduationCrank: coin already GRADUATED (concurrent update)');
    }
  }

  /**
   * Transitions a FAILED/EXPIRED graduation pending_tx to ABANDONED.
   * Swallows state-race errors (another crank instance won).
   */
  private async safeAbandon(txId: string): Promise<void> {
    try {
      await this.machine.toAbandoned(txId);
    } catch (err) {
      if (isStateRaceError(err)) {
        this.logger.debug(
          { txId, err: (err as Error).message },
          'GraduationCrank: CAS race on abandon — another worker won, skipping',
        );
      } else {
        throw err;
      }
    }
  }

  /**
   * Calls the dispatcher and swallows all errors.
   * Dispatcher errors (including idempotency conflicts from concurrent cranks)
   * are logged and the coin will be retried next pass.
   */
  private async safeDispatch(
    fn:     () => Promise<void>,
    coinId: string,
    op:     string,
  ): Promise<void> {
    try {
      await fn();
    } catch (err) {
      this.logger.error(
        { coinId, op, err },
        'GraduationCrank: dispatcher error — coin will be retried next pass',
      );
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isStateRaceError(err: unknown): boolean {
  return (
    err instanceof TxStateError ||
    err instanceof InvalidTransitionError ||
    err instanceof TxNotFoundError
  );
}
