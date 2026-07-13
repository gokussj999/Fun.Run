import { PublicKey, SystemProgram, TransactionInstruction, type AccountMeta } from '@solana/web3.js';

import { anchorDiscriminator, encodeU64 } from '../codec.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  findGlobalConfigPda,
  findTreasuryPda,
  findBondingCurvePda,
  findReferralAccountPda,
  getAtaAddress,
} from '../accounts.js';
import type { BuyArgs } from '../idl.js';

const DISCRIMINATOR = anchorDiscriminator('buy');

export interface BuyOpts extends BuyArgs {
  buyer:     PublicKey;
  mint:      PublicKey;
  /** When undefined, referral_account uses buyer as writable placeholder (no referrer). */
  referrer?: PublicKey;
  programId: PublicKey;
}

export function buildBuyInstruction(opts: BuyOpts): TransactionInstruction {
  const { buyer, mint, solAmount, minTokensOut, referrer, programId } = opts;

  const [globalConfig]  = findGlobalConfigPda(programId);
  const [treasury]      = findTreasuryPda(programId);
  const [bondingCurve]  = findBondingCurvePda(mint, programId);
  const bondingCurveVault  = getAtaAddress(mint, bondingCurve);
  const buyerTokenAccount  = getAtaAddress(mint, buyer);

  // SystemProgram cannot be marked writable — Anchor `#[account(mut)]` then fails
  // with ConstraintMut (2000). When there is no referrer, pass the trader as a
  // writable placeholder; the program only transfers to referral_account when
  // referrer fee > 0 (and then requires the real referral PDA).
  const referralAccount =
    referrer !== undefined
      ? findReferralAccountPda(referrer, programId)[0]
      : buyer;

  const data = Buffer.concat([
    DISCRIMINATOR,
    encodeU64(solAmount),
    encodeU64(minTokensOut),
  ]);

  const keys: AccountMeta[] = [
    { pubkey: buyer,               isSigner: true,  isWritable: true  },
    { pubkey: globalConfig,        isSigner: false, isWritable: false },
    { pubkey: treasury,            isSigner: false, isWritable: true  },
    { pubkey: mint,                isSigner: false, isWritable: false },
    { pubkey: bondingCurve,        isSigner: false, isWritable: true  },
    { pubkey: bondingCurveVault,   isSigner: false, isWritable: true  },
    { pubkey: buyerTokenAccount,   isSigner: false, isWritable: true  },
    { pubkey: referralAccount,     isSigner: false, isWritable: true  },
    { pubkey: TOKEN_PROGRAM_ID,            isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId,     isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ keys, programId, data });
}
