import type { PrismaClient } from '@funrun/database';
import type { CreateTxOpts, PendingTxRecord, TxStatus } from './pending-tx.types.js';

/**
 * TxStore — all persistence operations for the pending_txs table.
 *
 * Every mutating method uses an optimistic CAS pattern:
 *   UPDATE ... WHERE id=? AND status=<expectedStatus>
 * If the status no longer matches (concurrent update won), the method returns null.
 * Callers (TxStateMachine) treat null as a race condition and throw TxStateError.
 */
export class TxStore {
  constructor(private readonly db: PrismaClient) {}

  // ── Read ──────────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<PendingTxRecord | null> {
    const row = await this.db.pendingTx.findUnique({ where: { id } });
    return row as PendingTxRecord | null;
  }

  /** Duplicate-protection lookup — returns existing record if idempotency key already used. */
  async findByIdempotencyKey(key: string): Promise<PendingTxRecord | null> {
    const row = await this.db.pendingTx.findUnique({ where: { idempotencyKey: key } });
    return row as PendingTxRecord | null;
  }

  async findByStatus(status: TxStatus): Promise<PendingTxRecord[]> {
    const rows = await this.db.pendingTx.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
    });
    return rows as PendingTxRecord[];
  }

  // ── Create ────────────────────────────────────────────────────────────────────

  /**
   * Creates a new PendingTx in BUILDING state.
   * Throws if the idempotency key already exists (Prisma unique constraint).
   * Callers should call findByIdempotencyKey first to get the existing record
   * instead of catching the constraint error.
   */
  async create(opts: CreateTxOpts): Promise<PendingTxRecord> {
    const row = await this.db.pendingTx.create({
      data: {
        idempotencyKey: opts.idempotencyKey,
        walletAddress:  opts.walletAddress,
        operationType:  opts.operationType,
        ...(opts.coinId    !== undefined ? { coinId:    opts.coinId    } : {}),
        ...(opts.expiresAt !== undefined ? { expiresAt: opts.expiresAt } : {}),
      },
    });
    return row as PendingTxRecord;
  }

  // ── State-specific updates (optimistic CAS) ───────────────────────────────────

  async markSigning(id: string): Promise<PendingTxRecord | null> {
    return this.cas(id, 'BUILDING', { status: 'SIGNING' });
  }

  async markPending(id: string, serializedTx: Buffer): Promise<PendingTxRecord | null> {
    return this.cas(id, 'SIGNING', { status: 'PENDING', serializedTx });
  }

  async markSubmitted(
    id:                   string,
    signature:            string,
    blockhash:            string,
    lastValidBlockHeight: bigint,
  ): Promise<PendingTxRecord | null> {
    return this.cas(id, 'PENDING', {
      status: 'SUBMITTED',
      signature,
      blockhash,
      lastValidBlockHeight,
      lastSubmittedAt: new Date(),
      submitAttempts:  { increment: 1 },
    });
  }

  async markConfirmed(id: string, slot: bigint): Promise<PendingTxRecord | null> {
    return this.cas(id, 'SUBMITTED', {
      status:        'CONFIRMED',
      confirmedSlot: slot,
    });
  }

  async markFinalized(id: string): Promise<PendingTxRecord | null> {
    return this.cas(id, 'CONFIRMED', {
      status:      'FINALIZED',
      finalizedAt: new Date(),
    });
  }

  async markFailed(
    id:            string,
    fromStatus:    TxStatus,
    errorMessage:  string,
    errorCode:     string | null,
    canResubmit:   boolean,
  ): Promise<PendingTxRecord | null> {
    const data: Record<string, unknown> = { status: 'FAILED', errorMessage, canResubmit };
    if (errorCode !== null) data['errorCode'] = errorCode;
    return this.cas(id, fromStatus, data);
  }

  async markExpired(id: string): Promise<PendingTxRecord | null> {
    return this.cas(id, 'SUBMITTED', {
      status:      'EXPIRED',
      canResubmit: true, // expired = eligible for rebuild with fresh blockhash
    });
  }

  async markAbandoned(id: string, fromStatus: TxStatus): Promise<PendingTxRecord | null> {
    return this.cas(id, fromStatus, {
      status:      'ABANDONED',
      canResubmit: false,
    });
  }

  /** Resets a FAILED or EXPIRED record back to BUILDING for re-submission. */
  async resetToBuilding(id: string, fromStatus: TxStatus): Promise<PendingTxRecord | null> {
    return this.cas(id, fromStatus, {
      status:               'BUILDING',
      serializedTx:         null,
      signature:            null,
      blockhash:            null,
      lastValidBlockHeight: null,
      errorMessage:         null,
      errorCode:            null,
      canResubmit:          false,
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────────

  /**
   * Compare-and-swap: UPDATE WHERE id=? AND status=expectedStatus.
   * Returns the updated record, or null if the status pre-condition failed.
   * Runs inside a Prisma interactive transaction so the update and select are atomic.
   */
  private async cas(
    id:             string,
    expectedStatus: TxStatus,
    data:           Record<string, unknown>,
  ): Promise<PendingTxRecord | null> {
    const result = await this.db.$transaction(async (prisma) => {
      const updated = await prisma.pendingTx.updateMany({
        where: { id, status: expectedStatus },
        data,
      });
      if (updated.count === 0) return null;
      return prisma.pendingTx.findUniqueOrThrow({ where: { id } });
    });
    return result as PendingTxRecord | null;
  }
}
