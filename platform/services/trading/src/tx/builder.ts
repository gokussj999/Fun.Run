import {
  ComputeBudgetProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  type AddressLookupTableAccount,
  type BlockhashWithExpiryBlockHeight,
  type PublicKey,
} from '@solana/web3.js';
import type { Logger } from '@funrun/logger';

import type { ConnectionPool } from '../solana/connection-pool.js';
import { simulateTransaction, type SimulationResult } from '../solana/simulate.js';

// ── Public interfaces ─────────────────────────────────────────────────────────

export interface BuildTransactionOpts {
  feePayer:                PublicKey;
  instructions:            TransactionInstruction[];
  blockhash:               BlockhashWithExpiryBlockHeight;
  computeUnitLimit:        number;
  priorityFeeMicrolamports: number;
  /** If provided, compiles a V0 transaction with lookup-table account compression. */
  lookupTables?:           AddressLookupTableAccount[];
  /** Run simulation before returning. Default: true. */
  simulate?:               boolean;
}

export interface BuiltTransaction {
  tx:             VersionedTransaction;
  serializedSize: number;
  simulation?:    SimulationResult;
}

// ── Errors ────────────────────────────────────────────────────────────────────

export class TransactionTooLargeError extends Error {
  constructor(readonly actual: number, readonly max: number) {
    super(`Transaction too large: ${actual} bytes (limit ${max})`);
    this.name = 'TransactionTooLargeError';
  }
}

export class SimulationFailedError extends Error {
  constructor(
    readonly simulationError: string,
    readonly errorCode: string | null,
    readonly logs: string[],
  ) {
    super(`Transaction simulation failed: ${simulationError}`);
    this.name = 'SimulationFailedError';
  }
}

// ── Builder ───────────────────────────────────────────────────────────────────

/** Solana max serialized transaction size in bytes. */
const MAX_TX_SIZE = 1232;

export class TransactionBuilder {
  constructor(
    private readonly pool: ConnectionPool,
    private readonly logger: Logger,
  ) {}

  /**
   * Assembles a VersionedTransaction with:
   *  1. SetComputeUnitLimit + SetComputeUnitPrice prepended
   *  2. Caller instructions appended in order
   *  3. Optional ALT compression (V0 with lookupTables)
   *  4. Blockhash injected
   *  5. Size validated (≤ 1232 bytes)
   *  6. Simulation run unless opts.simulate === false
   *
   * The returned tx is unsigned — pass to CustodialSigner.sign().
   */
  async build(opts: BuildTransactionOpts): Promise<BuiltTransaction> {
    const shouldSimulate = opts.simulate !== undefined ? opts.simulate : true;

    // 1. Compute budget — always first to guarantee prioritization
    const budgetIxs: TransactionInstruction[] = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: opts.computeUnitLimit }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: opts.priorityFeeMicrolamports }),
    ];

    const allIxs = [...budgetIxs, ...opts.instructions];

    // 2. Compile V0 message (works with or without lookup tables)
    const msgBase = new TransactionMessage({
      payerKey:       opts.feePayer,
      recentBlockhash: opts.blockhash.blockhash,
      instructions:   allIxs,
    });

    const message =
      opts.lookupTables !== undefined && opts.lookupTables.length > 0
        ? msgBase.compileToV0Message(opts.lookupTables)
        : msgBase.compileToV0Message();

    // 3. Wrap (unsigned at this point)
    const tx = new VersionedTransaction(message);

    // 4. Size validation
    const serializedSize = tx.serialize().length;
    if (serializedSize > MAX_TX_SIZE) {
      throw new TransactionTooLargeError(serializedSize, MAX_TX_SIZE);
    }

    this.logger.debug(
      {
        serializedSize,
        ixCount: allIxs.length,
        computeUnitLimit: opts.computeUnitLimit,
        priorityFee: opts.priorityFeeMicrolamports,
        hasLut: opts.lookupTables !== undefined && opts.lookupTables.length > 0,
      },
      'TransactionBuilder: assembled',
    );

    // 5. Simulate (sigVerify=false, replaceRecentBlockhash=true — see simulate.ts)
    if (!shouldSimulate) {
      return { tx, serializedSize };
    }

    const simulation = await this.pool.withConnection(async (conn) =>
      simulateTransaction(conn, tx, this.logger),
    );

    if (!simulation.success) {
      this.logger.warn(
        { error: simulation.error, errorCode: simulation.errorCode, logs: simulation.logs.slice(0, 5) },
        'TransactionBuilder: simulation failed',
      );
      throw new SimulationFailedError(
        simulation.error ?? 'unknown simulation error',
        simulation.errorCode,
        simulation.logs,
      );
    }

    this.logger.debug(
      { unitsConsumed: simulation.unitsConsumed },
      'TransactionBuilder: simulation passed',
    );

    return { tx, serializedSize, simulation };
  }
}
