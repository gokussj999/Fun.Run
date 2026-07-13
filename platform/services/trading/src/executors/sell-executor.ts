import { PublicKey } from '@solana/web3.js';
import type { Logger } from '@funrun/logger';
import { CU_BUDGETS } from '@funrun/shared';

import type { BlockhashCache } from '../solana/blockhash-cache.js';
import type { PriorityFeeEstimator } from '../solana/priority-fee.js';
import type { TransactionBuilder } from '../tx/builder.js';
import { CustodialSigner } from '../tx/signer.js';
import type { TxSender } from '../tx/sender.js';
import type { TxStore } from '../lifecycle/tx-store.js';
import type { TxStateMachine } from '../lifecycle/tx-state-machine.js';
import type { TxConfirmer } from '../lifecycle/tx-confirmer.js';
import type { FunrunProgram } from '../anchor/program.js';
import { findBondingCurvePda } from '../anchor/accounts.js';
import { classifyError, DuplicateIdempotencyKeyError } from './executor-utils.js';

// ── Public interfaces ─────────────────────────────────────────────────────────

export interface SellExecutionOpts {
  /** Caller-generated key — must be unique per logical sell attempt. */
  idempotencyKey:    string;
  /** Seller's custodial wallet public key (base-58). */
  walletAddress:     string;
  /** AES-256-CBC encrypted BIP39 mnemonic (format: iv_hex:ciphertext_hex). */
  encryptedMnemonic: string;
  /** 32-byte UTF-8 encryption key from MNEMONIC_SECRET env. */
  encryptionKey:     string;
  /** SPL token mint for the coin being sold. */
  mint:              PublicKey;
  /** Token amount to sell, in raw token units (6 decimals). */
  tokenAmount:       bigint;
  /** Minimum SOL to receive, in lamports (slippage guard). */
  minSolOut:         bigint;
  /** Optional referrer public key for fee sharing. */
  referrer?:         PublicKey;
  /** Optional coinId for linking the PendingTx to a coin record. */
  coinId?:           string;
}

export interface SellExecutionResult {
  /** PendingTx.id — used to poll lifecycle status. */
  txId:       string;
  /** Base-58 Solana transaction signature. */
  signature:  string;
  /** True when the idempotency key matched an existing submitted/confirmed/finalized record. */
  idempotent: boolean;
}

// ── Executor ──────────────────────────────────────────────────────────────────

/**
 * SellExecutor — drives a sell trade through the full pre-confirmation lifecycle:
 *
 *   BUILDING → SIGNING → PENDING → SUBMITTED
 *
 * Confirmation (SUBMITTED → CONFIRMED → FINALIZED) is handled asynchronously
 * by TxConfirmer after this method returns.
 *
 * Note: sell.rs does NOT create the seller ATA — the seller token account
 * must already exist. This is validated at simulation time; if the ATA is
 * missing the simulation will fail with a descriptive on-chain error and the
 * tx is marked FAILED with canResubmit=false.
 *
 * Every failure updates the PendingTx record to FAILED with structured
 * error metadata and an appropriate canResubmit flag.
 */
export class SellExecutor {
  constructor(
    private readonly blockhashCache: BlockhashCache,
    private readonly feeEstimator:   PriorityFeeEstimator,
    private readonly txBuilder:      TransactionBuilder,
    private readonly txSender:       TxSender,
    private readonly store:          TxStore,
    private readonly machine:        TxStateMachine,
    private readonly confirmer:      TxConfirmer,
    private readonly program:        FunrunProgram,
    private readonly logger:         Logger,
  ) {}

  async execute(opts: SellExecutionOpts): Promise<SellExecutionResult> {
    // ── Idempotency check ─────────────────────────────────────────────────────
    const existing = await this.store.findByIdempotencyKey(opts.idempotencyKey);
    if (existing !== null) {
      if (existing.signature !== null) {
        this.logger.info(
          { txId: existing.id, sig: existing.signature, status: existing.status },
          'SellExecutor: idempotent — returning existing signature',
        );
        return { txId: existing.id, signature: existing.signature, idempotent: true };
      }
      throw new DuplicateIdempotencyKeyError(opts.idempotencyKey, existing.status);
    }

    // ── Create lifecycle record (BUILDING) ────────────────────────────────────
    const walletPubkey = new PublicKey(opts.walletAddress);

    const record = await this.store.create({
      idempotencyKey: opts.idempotencyKey,
      walletAddress:  opts.walletAddress,
      operationType:  'SELL',
      ...(opts.coinId !== undefined ? { coinId: opts.coinId } : {}),
    });
    const txId = record.id;

    this.logger.info(
      {
        txId,
        walletAddress: opts.walletAddress,
        mint:          opts.mint.toBase58(),
        tokenAmount:   opts.tokenAmount.toString(),
        minSolOut:     opts.minSolOut.toString(),
      },
      'SellExecutor: started',
    );

    try {
      // ── Build Anchor instruction ──────────────────────────────────────────
      const instruction = this.program.sell({
        seller:      walletPubkey,
        mint:        opts.mint,
        tokenAmount: opts.tokenAmount,
        minSolOut:   opts.minSolOut,
        ...(opts.referrer !== undefined ? { referrer: opts.referrer } : {}),
      });

      // ── Blockhash + priority fee (parallel) ──────────────────────────────
      const bondingCurvePda = findBondingCurvePda(opts.mint, this.program.programId)[0];
      const [bh, priorityFee] = await Promise.all([
        this.blockhashCache.get(),
        this.feeEstimator.estimate('trade', [opts.mint, bondingCurvePda]),
      ]);

      this.logger.debug(
        { txId, blockhash: bh.blockhash.slice(0, 8), priorityFee },
        'SellExecutor: blockhash + fee ready',
      );

      // ── Build + simulate transaction ──────────────────────────────────────
      const built = await this.txBuilder.build({
        feePayer:                walletPubkey,
        instructions:            [instruction],
        blockhash:               bh,
        computeUnitLimit:        CU_BUDGETS.SELL,
        priorityFeeMicrolamports: priorityFee,
        simulate:                true,
      });

      this.logger.debug(
        { txId, serializedSize: built.serializedSize, unitsConsumed: built.simulation?.unitsConsumed },
        'SellExecutor: tx built and simulated',
      );

      // ── BUILDING → SIGNING ────────────────────────────────────────────────
      await this.machine.toSigning(txId);

      // ── Sign (in-memory keypair, zeroed immediately after) ────────────────
      const signer = CustodialSigner.fromEncryptedMnemonic(
        opts.encryptedMnemonic,
        opts.encryptionKey,
      );
      try {
        signer.sign(built.tx);
      } finally {
        signer.destroy(); // zeroes secretKey bytes regardless of sign() outcome
      }

      this.logger.debug({ txId, signer: walletPubkey.toBase58() }, 'SellExecutor: signed');

      // ── SIGNING → PENDING (persist signed bytes) ──────────────────────────
      const serializedTx = Buffer.from(built.tx.serialize());
      await this.machine.toPending(txId, serializedTx);

      // ── Send (skipPreflight — already simulated above) ────────────────────
      const { signature } = await this.txSender.send(built.tx, { skipPreflight: true });

      // ── PENDING → SUBMITTED ───────────────────────────────────────────────
      await this.machine.toSubmitted(
        txId,
        signature,
        bh.blockhash,
        BigInt(bh.lastValidBlockHeight),
      );

      // ── Subscribe WebSocket for fast confirmation ─────────────────────────
      this.confirmer.subscribeSignature(txId, signature);

      this.logger.info({ txId, signature }, 'SellExecutor: submitted — awaiting confirmation');
      return { txId, signature, idempotent: false };
    } catch (err) {
      await this.markFailed(txId, err);
      throw err;
    }
  }

  // ── Private ───────────────────────────────────────────────────────────────────

  private async markFailed(txId: string, err: unknown): Promise<void> {
    const { message, code, canResubmit } = classifyError(err);
    this.logger.error(
      { txId, errorCode: code, canResubmit, err },
      'SellExecutor: execution failed — marking FAILED',
    );
    try {
      await this.machine.toFailed(txId, message, code, canResubmit);
    } catch (markErr) {
      this.logger.warn({ txId, err: markErr }, 'SellExecutor: could not mark tx FAILED (already transitioned)');
    }
  }
}
