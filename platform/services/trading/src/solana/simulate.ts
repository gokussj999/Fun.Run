import type { Connection, VersionedTransaction } from '@solana/web3.js';
import type { Logger } from '@funrun/logger';

export interface SimulationResult {
  success:       boolean;
  unitsConsumed: number;
  logs:          string[];
  error:         string | null;
  errorCode:     string | null;
}

/**
 * Simulates a VersionedTransaction before sending.
 * Uses replaceRecentBlockhash so callers don't need a fresh blockhash for simulation.
 */
export async function simulateTransaction(
  conn: Connection,
  tx: VersionedTransaction,
  logger: Logger,
): Promise<SimulationResult> {
  const response = await conn.simulateTransaction(tx, {
    sigVerify:              false,
    commitment:             'confirmed',
    replaceRecentBlockhash: true,
  });

  const { err, logs, unitsConsumed } = response.value;

  if (err !== null) {
    const errorStr = serializeTransactionError(err);
    const errorCode = extractErrorCode(err);
    logger.debug({ err: errorStr, logs: logs?.slice(0, 5) }, 'simulateTransaction: simulation failed');
    return {
      success:       false,
      unitsConsumed: unitsConsumed ?? 0,
      logs:          logs ?? [],
      error:         errorStr,
      errorCode,
    };
  }

  return {
    success:       true,
    unitsConsumed: unitsConsumed ?? 0,
    logs:          logs ?? [],
    error:         null,
    errorCode:     null,
  };
}

function serializeTransactionError(err: unknown): string {
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function extractErrorCode(err: unknown): string | null {
  if (typeof err !== 'object' || err === null) return null;

  const e = err as Record<string, unknown>;

  // InstructionError: [instructionIndex, { Custom: N } | 'ErrorName']
  if ('InstructionError' in e && Array.isArray(e['InstructionError'])) {
    const [, detail] = e['InstructionError'] as [unknown, unknown];
    if (typeof detail === 'string') return detail;
    if (typeof detail === 'object' && detail !== null) {
      const d = detail as Record<string, unknown>;
      if ('Custom' in d && typeof d['Custom'] === 'number') return `Custom:${d['Custom']}`;
    }
  }

  return null;
}
