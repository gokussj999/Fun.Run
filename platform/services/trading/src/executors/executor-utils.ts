import { SimulationFailedError, TransactionTooLargeError } from '../tx/builder.js';
import { MnemonicDecryptError } from '../tx/signer.js';

// ── Shared error types ────────────────────────────────────────────────────────

/**
 * Thrown when a BuyExecutor or SellExecutor call is made with an idempotency
 * key that already has an in-progress (no signature yet) PendingTx record.
 * The caller must wait or check the existing record's status.
 */
export class DuplicateIdempotencyKeyError extends Error {
  constructor(
    readonly key:           string,
    readonly currentStatus: string,
  ) {
    super(
      `Idempotency key already in use and has no signature yet: ${key} (status: ${currentStatus}). ` +
      `Wait for the in-progress transaction or use a new key.`,
    );
    this.name = 'DuplicateIdempotencyKeyError';
  }
}

// ── Error classification ───────────────────────────────────────────────────────

export interface ErrorClassification {
  message:     string;
  code:        string | null;
  /** Whether the operation is eligible for a retry with a fresh blockhash. */
  canResubmit: boolean;
}

/**
 * Maps thrown errors to lifecycle failure metadata.
 *
 * Deterministic failures (simulation, size, bad key) → canResubmit=false.
 * Transient failures (network, RPC timeout) → canResubmit=true.
 */
export function classifyError(err: unknown): ErrorClassification {
  if (err instanceof SimulationFailedError) {
    return {
      message:     err.message,
      code:        err.errorCode ?? 'SIMULATION_FAILED',
      canResubmit: false,
    };
  }

  if (err instanceof TransactionTooLargeError) {
    return { message: err.message, code: 'TX_TOO_LARGE', canResubmit: false };
  }

  if (err instanceof MnemonicDecryptError) {
    return { message: err.message, code: 'MNEMONIC_DECRYPT_FAILED', canResubmit: false };
  }

  // Unknown / network errors — may succeed on retry with a fresh blockhash.
  const message = err instanceof Error ? err.message : String(err);
  return { message, code: 'NETWORK_ERROR', canResubmit: true };
}
