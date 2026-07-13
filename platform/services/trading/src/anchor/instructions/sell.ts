import { PublicKey, SystemProgram, TransactionInstruction, type AccountMeta } from '@solana/web3.js';

import { anchorDiscriminator, encodeU64 } from '../codec.js';
import {
  TOKEN_PROGRAM_ID,
  findGlobalConfigPda,
  findTreasuryPda,
  findBondingCurvePda,
  findReferralAccountPda,
  getAtaAddress,
} from '../accounts.js';
import type { SellArgs } from '../idl.js';

const DISCRIMINATOR = anchorDiscriminator('sell');

export interface SellOpts extends SellArgs {
  seller:    PublicKey;
  mint:      PublicKey;
  /** When undefined, referral_account uses seller as writable placeholder (no referrer). */
  referrer?: PublicKey;
  programId: PublicKey;
}

export function buildSellInstruction(opts: SellOpts): TransactionInstruction {
  const { seller, mint, tokenAmount, minSolOut, referrer, programId } = opts;

  const [globalConfig]  = findGlobalConfigPda(programId);
  const [treasury]      = findTreasuryPda(programId);
  const [bondingCurve]  = findBondingCurvePda(mint, programId);
  const bondingCurveVault   = getAtaAddress(mint, bondingCurve);
  const sellerTokenAccount  = getAtaAddress(mint, seller);

  // SystemProgram cannot be marked writable — see buy.ts for ConstraintMut note.
  const referralAccount =
    referrer !== undefined
      ? findReferralAccountPda(referrer, programId)[0]
      : seller;

  const data = Buffer.concat([
    DISCRIMINATOR,
    encodeU64(tokenAmount),
    encodeU64(minSolOut),
  ]);

  // sell.rs does NOT include associated_token_program (seller ATA must already exist)
  const keys: AccountMeta[] = [
    { pubkey: seller,              isSigner: true,  isWritable: true  },
    { pubkey: globalConfig,        isSigner: false, isWritable: false },
    { pubkey: treasury,            isSigner: false, isWritable: true  },
    { pubkey: mint,                isSigner: false, isWritable: false },
    { pubkey: bondingCurve,        isSigner: false, isWritable: true  },
    { pubkey: bondingCurveVault,   isSigner: false, isWritable: true  },
    { pubkey: sellerTokenAccount,  isSigner: false, isWritable: true  },
    { pubkey: referralAccount,     isSigner: false, isWritable: true  },
    { pubkey: TOKEN_PROGRAM_ID,        isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ keys, programId, data });
}
