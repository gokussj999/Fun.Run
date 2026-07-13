import { randomBytes } from 'node:crypto';
import { Keypair, PublicKey } from '@solana/web3.js';
import type { Logger } from '@funrun/logger';
import { CU_BUDGETS } from '@funrun/shared';

import type { BlockhashCache } from '../solana/blockhash-cache.js';
import type { PriorityFeeEstimator } from '../solana/priority-fee.js';
import type { TransactionBuilder } from '../tx/builder.js';
import { TransactionTooLargeError } from '../tx/builder.js';
import { CustodialSigner, MnemonicDecryptError, InvalidSecretKeyError } from '../tx/signer.js';
import type { TxSender } from '../tx/sender.js';
import type { TxStore } from '../lifecycle/tx-store.js';
import type { TxStateMachine } from '../lifecycle/tx-state-machine.js';
import type { TxConfirmer } from '../lifecycle/tx-confirmer.js';
import type { FunrunProgram } from '../anchor/program.js';
import type { GraduationDispatcher } from '../background/graduation-crank.js';

// ── Re-export so wiring code only needs this one import ──────────────────────
export type { GraduationDispatcher };

// ── Config ────────────────────────────────────────────────────────────────────

export interface GraduationExecutorConfig {
  /**
   * Platform / treasury keypair raw bytes (64-byte Uint8Array).
   * Loaded once at startup from TREASURY_KEYPAIR env var and kept in memory.
   * Each signing operation creates a fresh CustodialSigner from these bytes
   * and destroys it immediately after — secret key never persists beyond a
   * single tx signing call.
   */
  treasurySecretKey: Uint8Array;
  /**
   * Raydium CPMM AMM config account — network-specific.
   * Devnet:  G11FVVnoEUBE4JKpFWXMiQ2Yn1g4pVu4c17dTFJDg6dN (fee tier config)
   * Mainnet: D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2
   */
  ammConfig: PublicKey;
  /**
   * Raydium create-pool fee destination — network-specific.
   * Devnet:  G11FVVnoEUBE4JKpFWXMiQ2Yn1g4pVu4c17dTFJDg6dN
   * Mainnet: DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8
   */
  createPoolFee: PublicKey;
}

// ── Executor ──────────────────────────────────────────────────────────────────

/**
 * GraduationExecutor — implements GraduationDispatcher.
 *
 * Handles the two-phase on-chain graduation of a Fun.Run bonding curve:
 *
 *   Phase 1: initiate_graduation
 *     Permissionless instruction that marks the on-chain BondingCurve as
 *     GRADUATING. Must be sent once the real SOL reserves cross the
 *     graduation threshold (≥ 85 SOL).
 *
 *   Phase 2: complete_graduation
 *     Permissionless instruction that CPIs into Raydium CPMM to create the
 *     AMM pool, burn LP tokens, and revoke mint/freeze authority.
 *     Only valid after Phase 1 is confirmed.
 *
 * Idempotency strategy:
 *   Each dispatch generates a UUID-based idempotency key so multiple dispatch
 *   calls for the same coin are independent records. The GraduationCrank is
 *   responsible for abandoning FAILED records before re-dispatching, ensuring
 *   only one active record exists per phase per coin at any time.
 *
 * Simulation:
 *   Both steps skip simulation (simulate: false). The Raydium CPI is expensive
 *   (1.4M CUs) and prone to false negatives on stale RPC state. The on-chain
 *   program is the authoritative validator. TxConfirmer catches any on-chain
 *   failures and marks the record FAILED with canResubmit=true for retry.
 */
export class GraduationExecutor implements GraduationDispatcher {
  private readonly callerPublicKey: PublicKey;

  constructor(
    private readonly config:         GraduationExecutorConfig,
    private readonly blockhashCache: BlockhashCache,
    private readonly feeEstimator:   PriorityFeeEstimator,
    private readonly txBuilder:      TransactionBuilder,
    private readonly txSender:       TxSender,
    private readonly store:          TxStore,
    private readonly machine:        TxStateMachine,
    private readonly confirmer:      TxConfirmer,
    private readonly program:        FunrunProgram,
    private readonly logger:         Logger,
  ) {
    // Derive public key once — avoids re-deriving on every dispatch call.
    this.callerPublicKey = Keypair.fromSecretKey(config.treasurySecretKey).publicKey;
  }

  // ── GraduationDispatcher ──────────────────────────────────────────────────────

  /**
   * Builds and submits the initiate_graduation instruction.
   * Called by GraduationCrank when a coin crosses the graduation threshold.
   *
   * Creates a new PendingTx in BUILDING state, drives it through the full
   * pre-confirmation lifecycle, then returns. TxConfirmer handles
   * SUBMITTED → CONFIRMED → FINALIZED asynchronously.
   */
  async dispatchInitiate(coinId: string, mintAddress: string): Promise<void> {
    const mint = new PublicKey(mintAddress);
    // UUID-based key — each dispatch attempt gets a fresh record.
    const idempotencyKey = `grad:initiate:${coinId}:${randomBytes(8).toString('hex')}`;

    this.logger.info(
      { coinId, mintAddress, idempotencyKey },
      'GraduationExecutor: dispatchInitiate — creating PendingTx',
    );

    const record = await this.store.create({
      idempotencyKey,
      walletAddress: this.callerPublicKey.toBase58(),
      operationType: 'INITIATE_GRADUATION',
      coinId,
    });
    const txId = record.id;

    try {
      // ── Build instruction ────────────────────────────────────────────────
      const instruction = this.program.initiateGraduation({
        caller: this.callerPublicKey,
        mint,
      });

      // ── Blockhash + priority fee (parallel) ──────────────────────────────
      const [bh, priorityFee] = await Promise.all([
        this.blockhashCache.get(),
        this.feeEstimator.estimate('graduation', [mint]),
      ]);

      this.logger.debug(
        { txId, blockhash: bh.blockhash.slice(0, 8), priorityFee, cuLimit: CU_BUDGETS.INITIATE_GRADUATION },
        'GraduationExecutor: initiate — blockhash + fee ready',
      );

      // ── Build transaction (no simulation — chain state is authoritative) ─
      const built = await this.txBuilder.build({
        feePayer:                this.callerPublicKey,
        instructions:            [instruction],
        blockhash:               bh,
        computeUnitLimit:        CU_BUDGETS.INITIATE_GRADUATION,
        priorityFeeMicrolamports: priorityFee,
        simulate:                false,
      });

      // ── BUILDING → SIGNING ────────────────────────────────────────────────
      await this.machine.toSigning(txId);

      // ── Sign with treasury keypair ────────────────────────────────────────
      const signer = CustodialSigner.fromSecretKey(this.config.treasurySecretKey);
      try {
        signer.sign(built.tx);
      } finally {
        signer.destroy(); // zeroes the derived keypair's secretKey bytes
      }

      this.logger.debug({ txId }, 'GraduationExecutor: initiate — signed');

      // ── SIGNING → PENDING ────────────────────────────────────────────────
      const serializedTx = Buffer.from(built.tx.serialize());
      await this.machine.toPending(txId, serializedTx);

      // ── Send ──────────────────────────────────────────────────────────────
      const { signature } = await this.txSender.send(built.tx, { skipPreflight: false });

      // ── PENDING → SUBMITTED ───────────────────────────────────────────────
      await this.machine.toSubmitted(
        txId,
        signature,
        bh.blockhash,
        BigInt(bh.lastValidBlockHeight),
      );

      // ── Subscribe WS for fast confirmation ───────────────────────────────
      this.confirmer.subscribeSignature(txId, signature);

      this.logger.info(
        { coinId, txId, signature },
        'GraduationExecutor: initiate_graduation submitted — awaiting confirmation',
      );
    } catch (err) {
      await this.markFailed(txId, err, 'GraduationExecutor: dispatchInitiate failed');
      throw err;
    }
  }

  /**
   * Builds and submits the complete_graduation instruction.
   * Called by GraduationCrank after initiate_graduation is FINALIZED on-chain.
   *
   * complete_graduation CPIs into Raydium CPMM — it requires 1.4M compute units
   * and is the most expensive instruction in the protocol.
   */
  async dispatchComplete(coinId: string, mintAddress: string): Promise<void> {
    const mint = new PublicKey(mintAddress);
    const idempotencyKey = `grad:complete:${coinId}:${randomBytes(8).toString('hex')}`;

    this.logger.info(
      { coinId, mintAddress, idempotencyKey },
      'GraduationExecutor: dispatchComplete — creating PendingTx',
    );

    const record = await this.store.create({
      idempotencyKey,
      walletAddress: this.callerPublicKey.toBase58(),
      operationType: 'COMPLETE_GRADUATION',
      coinId,
    });
    const txId = record.id;

    try {
      // ── Build instruction ────────────────────────────────────────────────
      const instruction = this.program.completeGraduation({
        caller:        this.callerPublicKey,
        coinMint:      mint,
        ammConfig:     this.config.ammConfig,
        createPoolFee: this.config.createPoolFee,
      });

      // ── Blockhash + priority fee (parallel) ──────────────────────────────
      const [bh, priorityFee] = await Promise.all([
        this.blockhashCache.get(),
        this.feeEstimator.estimate('graduation', [mint]),
      ]);

      this.logger.debug(
        { txId, blockhash: bh.blockhash.slice(0, 8), priorityFee, cuLimit: CU_BUDGETS.COMPLETE_GRADUATION },
        'GraduationExecutor: complete — blockhash + fee ready',
      );

      // ── Build transaction ─────────────────────────────────────────────────
      // Raydium CPMM CPI requires 1.4M CU — no simulation to avoid false negatives.
      const built = await this.txBuilder.build({
        feePayer:                this.callerPublicKey,
        instructions:            [instruction],
        blockhash:               bh,
        computeUnitLimit:        CU_BUDGETS.COMPLETE_GRADUATION,
        priorityFeeMicrolamports: priorityFee,
        simulate:                false,
      });

      // ── BUILDING → SIGNING ────────────────────────────────────────────────
      await this.machine.toSigning(txId);

      // ── Sign with treasury keypair ────────────────────────────────────────
      const signer = CustodialSigner.fromSecretKey(this.config.treasurySecretKey);
      try {
        signer.sign(built.tx);
      } finally {
        signer.destroy();
      }

      this.logger.debug({ txId }, 'GraduationExecutor: complete — signed');

      // ── SIGNING → PENDING ────────────────────────────────────────────────
      const serializedTx = Buffer.from(built.tx.serialize());
      await this.machine.toPending(txId, serializedTx);

      // ── Send ──────────────────────────────────────────────────────────────
      const { signature } = await this.txSender.send(built.tx, { skipPreflight: false });

      // ── PENDING → SUBMITTED ───────────────────────────────────────────────
      await this.machine.toSubmitted(
        txId,
        signature,
        bh.blockhash,
        BigInt(bh.lastValidBlockHeight),
      );

      // ── Subscribe WS for fast confirmation ───────────────────────────────
      this.confirmer.subscribeSignature(txId, signature);

      this.logger.info(
        { coinId, txId, signature },
        'GraduationExecutor: complete_graduation submitted — awaiting confirmation',
      );
    } catch (err) {
      await this.markFailed(txId, err, 'GraduationExecutor: dispatchComplete failed');
      throw err;
    }
  }

  // ── Private ───────────────────────────────────────────────────────────────────

  private async markFailed(txId: string, err: unknown, context: string): Promise<void> {
    const { message, code, canResubmit } = classifyGraduationError(err);
    this.logger.error({ txId, errorCode: code, canResubmit, err }, context);
    try {
      await this.machine.toFailed(txId, message, code, canResubmit);
    } catch (markErr) {
      this.logger.warn(
        { txId, err: markErr },
        'GraduationExecutor: could not mark tx FAILED (concurrent transition)',
      );
    }
  }
}

// ── Error classification ───────────────────────────────────────────────────────

/**
 * Graduation-specific error classification.
 *
 * Differs from buy/sell classification:
 *   - Simulation failures are not possible (simulate: false).
 *   - Network / RPC errors and on-chain rejections are canResubmit=true,
 *     because graduation is a permissionless operation that can always be
 *     retried once the chain state is updated.
 *   - Only structural errors (TX_TOO_LARGE, signer failure) are non-retryable.
 */
function classifyGraduationError(err: unknown): {
  message:     string;
  code:        string | null;
  canResubmit: boolean;
} {
  if (err instanceof TransactionTooLargeError) {
    return { message: err.message, code: 'TX_TOO_LARGE', canResubmit: false };
  }
  if (err instanceof MnemonicDecryptError || err instanceof InvalidSecretKeyError) {
    return { message: err.message, code: 'SIGNER_ERROR', canResubmit: false };
  }
  // Network errors, RPC timeouts, on-chain rejections — retry eligible.
  const message = err instanceof Error ? err.message : String(err);
  return { message, code: 'NETWORK_ERROR', canResubmit: true };
}
