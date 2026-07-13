import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { PROGRAM_IDS } from '@funrun/shared';

import { buildCreateCoinInstruction, type CreateCoinOpts, type CreateCoinResult } from './instructions/create-coin.js';
import { buildBuyInstruction, type BuyOpts } from './instructions/buy.js';
import { buildSellInstruction, type SellOpts } from './instructions/sell.js';
import {
  buildInitiateGraduationInstruction,
  buildCompleteGraduationInstruction,
  type InitiateGraduationOpts,
  type CompleteGraduationOpts,
} from './instructions/graduation.js';

export type Network = 'devnet' | 'mainnet';

export interface FunrunProgram {
  readonly programId: PublicKey;
  readonly network:   Network;

  /** Builds an instruction to create a new coin + bonding curve. */
  createCoin(opts: Omit<CreateCoinOpts, 'programId'>): CreateCoinResult;

  /** Builds a buy instruction. */
  buy(opts: Omit<BuyOpts, 'programId'>): TransactionInstruction;

  /** Builds a sell instruction. */
  sell(opts: Omit<SellOpts, 'programId'>): TransactionInstruction;

  /** Builds an initiate_graduation instruction (permissionless). */
  initiateGraduation(opts: Omit<InitiateGraduationOpts, 'programId'>): TransactionInstruction;

  /** Builds a complete_graduation instruction (permissionless, expensive CPI to Raydium). */
  completeGraduation(opts: Omit<CompleteGraduationOpts, 'programId'>): TransactionInstruction;
}

/** Creates a read-only Fun.Run program client scoped to the given network. */
export function createFunrunProgram(network: Network): FunrunProgram {
  const programId = new PublicKey(
    network === 'mainnet' ? PROGRAM_IDS.mainnet : PROGRAM_IDS.devnet,
  );

  return {
    programId,
    network,
    createCoin:          (opts) => buildCreateCoinInstruction({ ...opts, programId }),
    buy:                 (opts) => buildBuyInstruction({ ...opts, programId }),
    sell:                (opts) => buildSellInstruction({ ...opts, programId }),
    initiateGraduation:  (opts) => buildInitiateGraduationInstruction({ ...opts, programId }),
    completeGraduation:  (opts) => buildCompleteGraduationInstruction({ ...opts, programId }),
  };
}
