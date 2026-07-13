import type { TxStore } from './tx-store.js';
import type { PendingTxRecord, TxStatus } from './pending-tx.types.js';

// ── Errors ────────────────────────────────────────────────────────────────────

export class TxNotFoundError extends Error {
  constructor(id: string) {
    super(`PendingTx not found: ${id}`);
    this.name = 'TxNotFoundError';
  }
}

export class InvalidTransitionError extends Error {
  constructor(
    readonly from: TxStatus,
    readonly to:   TxStatus,
  ) {
    super(`Invalid state transition: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export class TxStateError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'TxStateError';
  }
}

// ── Valid transitions ─────────────────────────────────────────────────────────
//
//  BUILDING  → SIGNING, FAILED
//  SIGNING   → PENDING, FAILED
//  PENDING   → SUBMITTED, FAILED
//  SUBMITTED → CONFIRMED, EXPIRED, FAILED
//  CONFIRMED → FINALIZED, FAILED
//  FINALIZED → (terminal)
//  FAILED    → BUILDING (canResubmit=true only), ABANDONED
//  EXPIRED   → BUILDING (canResubmit=true only), ABANDONED
//  ABANDONED → (terminal)

const VALID_TRANSITIONS: Readonly<Record<TxStatus, readonly TxStatus[]>> = {
  BUILDING:  ['SIGNING',    'FAILED'],
  SIGNING:   ['PENDING',    'FAILED'],
  PENDING:   ['SUBMITTED',  'FAILED'],
  SUBMITTED: ['CONFIRMED',  'EXPIRED', 'FAILED'],
  CONFIRMED: ['FINALIZED',  'FAILED'],
  FINALIZED: [],
  FAILED:    ['BUILDING',   'ABANDONED'],
  EXPIRED:   ['BUILDING',   'ABANDONED'],
  ABANDONED: [],
} as const;

const TERMINAL: ReadonlySet<TxStatus> = new Set<TxStatus>(['FINALIZED', 'ABANDONED']);

// ── State machine ─────────────────────────────────────────────────────────────

export class TxStateMachine {
  constructor(private readonly store: TxStore) {}

  // ── Validation ───────────────────────────────────────────────────────────────

  static validateTransition(from: TxStatus, to: TxStatus): void {
    const allowed = VALID_TRANSITIONS[from];
    if (!allowed.includes(to)) throw new InvalidTransitionError(from, to);
  }

  static isTerminal(status: TxStatus): boolean {
    return TERMINAL.has(status);
  }

  // ── Forward transitions ───────────────────────────────────────────────────────

  /** BUILDING → SIGNING */
  async toSigning(id: string): Promise<PendingTxRecord> {
    return this.drive(id, 'BUILDING', 'SIGNING', () => this.store.markSigning(id));
  }

  /** SIGNING → PENDING (stores serialized unsigned tx) */
  async toPending(id: string, serializedTx: Buffer): Promise<PendingTxRecord> {
    return this.drive(id, 'SIGNING', 'PENDING', () =>
      this.store.markPending(id, serializedTx),
    );
  }

  /** PENDING → SUBMITTED */
  async toSubmitted(
    id:                   string,
    signature:            string,
    blockhash:            string,
    lastValidBlockHeight: bigint,
  ): Promise<PendingTxRecord> {
    return this.drive(id, 'PENDING', 'SUBMITTED', () =>
      this.store.markSubmitted(id, signature, blockhash, lastValidBlockHeight),
    );
  }

  /** SUBMITTED → CONFIRMED */
  async toConfirmed(id: string, slot: bigint): Promise<PendingTxRecord> {
    return this.drive(id, 'SUBMITTED', 'CONFIRMED', () =>
      this.store.markConfirmed(id, slot),
    );
  }

  /** CONFIRMED → FINALIZED */
  async toFinalized(id: string): Promise<PendingTxRecord> {
    return this.drive(id, 'CONFIRMED', 'FINALIZED', () =>
      this.store.markFinalized(id),
    );
  }

  /** * → FAILED (reads current status from DB; validates allowed transition) */
  async toFailed(
    id:            string,
    errorMessage:  string,
    errorCode:     string | null = null,
    canResubmit:   boolean       = false,
  ): Promise<PendingTxRecord> {
    const tx = await this.requireRecord(id);
    TxStateMachine.validateTransition(tx.status, 'FAILED');
    const result = await this.store.markFailed(id, tx.status, errorMessage, errorCode, canResubmit);
    if (!result) throw new TxStateError(
      `${id}: toFailed concurrent update lost (${tx.status} → FAILED)`,
    );
    return result;
  }

  /** SUBMITTED → EXPIRED (blockhash expiry detected by TxConfirmer) */
  async toExpired(id: string): Promise<PendingTxRecord> {
    return this.drive(id, 'SUBMITTED', 'EXPIRED', () =>
      this.store.markExpired(id),
    );
  }

  /** FAILED|EXPIRED → ABANDONED (caller explicitly opts out of retry) */
  async toAbandoned(id: string): Promise<PendingTxRecord> {
    const tx = await this.requireRecord(id);
    TxStateMachine.validateTransition(tx.status, 'ABANDONED');
    const result = await this.store.markAbandoned(id, tx.status);
    if (!result) throw new TxStateError(
      `${id}: toAbandoned concurrent update lost (${tx.status} → ABANDONED)`,
    );
    return result;
  }

  // ── Resubmit ─────────────────────────────────────────────────────────────────

  /**
   * FAILED|EXPIRED → BUILDING
   * Only allowed when canResubmit=true.
   * Clears tx bytes, signature, blockhash, and error fields for a fresh build cycle.
   */
  async toBuilding(id: string): Promise<PendingTxRecord> {
    const tx = await this.requireRecord(id);
    if (!tx.canResubmit) {
      throw new TxStateError(`${id}: resubmit rejected — canResubmit=false`);
    }
    TxStateMachine.validateTransition(tx.status, 'BUILDING');
    const result = await this.store.resetToBuilding(id, tx.status);
    if (!result) throw new TxStateError(
      `${id}: toBuilding concurrent update lost (${tx.status} → BUILDING)`,
    );
    return result;
  }

  // ── Private ───────────────────────────────────────────────────────────────────

  /**
   * Validates the transition upfront (fast, no DB) then executes the store operation.
   * Throws TxStateError if the store returns null (concurrent update won the CAS race).
   */
  private async drive(
    id:          string,
    from:        TxStatus,
    to:          TxStatus,
    fn:          () => Promise<PendingTxRecord | null>,
  ): Promise<PendingTxRecord> {
    TxStateMachine.validateTransition(from, to);
    const result = await fn();
    if (!result) {
      throw new TxStateError(
        `${id}: transition ${from} → ${to} failed — record not in expected state (concurrent update)`,
      );
    }
    return result;
  }

  private async requireRecord(id: string): Promise<PendingTxRecord> {
    const tx = await this.store.findById(id);
    if (!tx) throw new TxNotFoundError(id);
    return tx;
  }
}
