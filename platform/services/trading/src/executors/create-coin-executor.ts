import { Keypair, PublicKey } from '@solana/web3.js';
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
import { classifyError, DuplicateIdempotencyKeyError } from './executor-utils.js';

export interface CreateCoinExecutionOpts {
  idempotencyKey: string;
  walletAddress: string;
  encryptedMnemonic: string;
  encryptionKey: string;
  name: string;
  symbol: string;
  uri: string;
  referrer?: PublicKey;
}

export interface CreateCoinExecutionResult {
  txId: string;
  signature: string;
  mintAddress: string;
  bondingCurvePda: string;
  idempotent: boolean;
}

export class CreateCoinExecutor {
  constructor(
    private readonly blockhashCache: BlockhashCache,
    private readonly feeEstimator: PriorityFeeEstimator,
    private readonly txBuilder: TransactionBuilder,
    private readonly txSender: TxSender,
    private readonly store: TxStore,
    private readonly machine: TxStateMachine,
    private readonly confirmer: TxConfirmer,
    private readonly program: FunrunProgram,
    private readonly logger: Logger,
  ) {}

  async execute(opts: CreateCoinExecutionOpts): Promise<CreateCoinExecutionResult> {
    const existing = await this.store.findByIdempotencyKey(opts.idempotencyKey);
    if (existing !== null) {
      if (existing.signature !== null) {
        return {
          txId: existing.id,
          signature: existing.signature,
          mintAddress: String(existing.coinId ?? ''),
          bondingCurvePda: '',
          idempotent: true,
        };
      }
      throw new DuplicateIdempotencyKeyError(opts.idempotencyKey, existing.status);
    }

    const walletPubkey = new PublicKey(opts.walletAddress);
    const mintKeypair = Keypair.generate();

    const record = await this.store.create({
      idempotencyKey: opts.idempotencyKey,
      walletAddress: opts.walletAddress,
      operationType: 'CREATE_COIN',
      coinId: mintKeypair.publicKey.toBase58(),
    });
    const txId = record.id;

    try {
      const { instruction, bondingCurvePda } = this.program.createCoin({
        creator: walletPubkey,
        mint: mintKeypair.publicKey,
        name: opts.name,
        symbol: opts.symbol,
        uri: opts.uri,
      });

      const [bh, priorityFee] = await Promise.all([
        this.blockhashCache.get(),
        this.feeEstimator.estimate('create', [mintKeypair.publicKey, bondingCurvePda]),
      ]);

      const built = await this.txBuilder.build({
        feePayer: walletPubkey,
        instructions: [instruction],
        blockhash: bh,
        computeUnitLimit: CU_BUDGETS.CREATE_COIN,
        priorityFeeMicrolamports: priorityFee,
        simulate: true,
      });

      await this.machine.toSigning(txId);

      const signer = CustodialSigner.fromEncryptedMnemonic(
        opts.encryptedMnemonic,
        opts.encryptionKey,
      );
      try {
        signer.sign(built.tx);
        built.tx.sign([mintKeypair]);
      } finally {
        signer.destroy();
        mintKeypair.secretKey.fill(0);
      }

      const serializedTx = Buffer.from(built.tx.serialize());
      await this.machine.toPending(txId, serializedTx);

      const { signature } = await this.txSender.send(built.tx, { skipPreflight: true });
      await this.machine.toSubmitted(txId, signature, bh.blockhash, BigInt(bh.lastValidBlockHeight));
      this.confirmer.subscribeSignature(txId, signature);

      this.logger.info({ txId, signature, mint: mintKeypair.publicKey.toBase58() }, 'CreateCoinExecutor: submitted');

      return {
        txId,
        signature,
        mintAddress: mintKeypair.publicKey.toBase58(),
        bondingCurvePda: bondingCurvePda.toBase58(),
        idempotent: false,
      };
    } catch (err) {
      await this.markFailed(txId, err);
      throw err;
    }
  }

  private async markFailed(txId: string, err: unknown): Promise<void> {
    const { message, code, canResubmit } = classifyError(err);
    try {
      await this.machine.toFailed(txId, message, code, canResubmit);
    } catch {
      /* already transitioned */
    }
  }
}
