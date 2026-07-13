import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  type AccountMeta,
} from '@solana/web3.js';
import { RAYDIUM_CPMM_PROGRAM_ID, WSOL_MINT } from '@funrun/shared';

import { anchorDiscriminator } from '../codec.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  findGlobalConfigPda,
  findTreasuryPda,
  findBondingCurvePda,
  findRaydiumAuthority,
  findRaydiumPoolState,
  findRaydiumLpMint,
  findRaydiumPoolVault,
  findRaydiumObservationState,
  getAtaAddress,
  raydiumTokenOrder,
} from '../accounts.js';

const INITIATE_DISCRIMINATOR  = anchorDiscriminator('initiate_graduation');
const COMPLETE_DISCRIMINATOR  = anchorDiscriminator('complete_graduation');

const RAYDIUM_PROGRAM = new PublicKey(RAYDIUM_CPMM_PROGRAM_ID);
const WSOL_MINT_PUBKEY = new PublicKey(WSOL_MINT);

// ── initiate_graduation ───────────────────────────────────────────────────────

export interface InitiateGraduationOpts {
  /** Permissionless caller — does not need to be the creator. */
  caller:    PublicKey;
  mint:      PublicKey;
  programId: PublicKey;
}

export function buildInitiateGraduationInstruction(opts: InitiateGraduationOpts): TransactionInstruction {
  const { caller, mint, programId } = opts;

  const [globalConfig] = findGlobalConfigPda(programId);
  const [bondingCurve] = findBondingCurvePda(mint, programId);

  const data = Buffer.concat([INITIATE_DISCRIMINATOR]);

  const keys: AccountMeta[] = [
    { pubkey: caller,        isSigner: true,  isWritable: false },
    { pubkey: globalConfig,  isSigner: false, isWritable: false },
    { pubkey: mint,          isSigner: false, isWritable: false },
    { pubkey: bondingCurve,  isSigner: false, isWritable: true  },
  ];

  return new TransactionInstruction({ keys, programId, data });
}

// ── complete_graduation ───────────────────────────────────────────────────────

export interface CompleteGraduationOpts {
  /** Pays rent for bonding_curve_wsol_account if it must be created. */
  caller:        PublicKey;
  coinMint:      PublicKey;
  /** Raydium CPMM fee tier config account (network-specific). */
  ammConfig:     PublicKey;
  /** Raydium create-pool fee destination (network-specific). */
  createPoolFee: PublicKey;
  programId:     PublicKey;
}

export function buildCompleteGraduationInstruction(opts: CompleteGraduationOpts): TransactionInstruction {
  const { caller, coinMint, ammConfig, createPoolFee, programId } = opts;

  // PDAs — Fun.Run program
  const [globalConfig]  = findGlobalConfigPda(programId);
  const [treasury]      = findTreasuryPda(programId);
  const [bondingCurve]  = findBondingCurvePda(coinMint, programId);

  // ATAs — bonding_curve as owner
  const bondingCurveVault       = getAtaAddress(coinMint, bondingCurve);
  const bondingCurveWsolAccount = getAtaAddress(WSOL_MINT_PUBKEY, bondingCurve);

  // Raydium requires token0 < token1 (lexicographic bytes)
  const [token0Mint, token1Mint] = raydiumTokenOrder(coinMint, WSOL_MINT_PUBKEY);

  // PDAs — Raydium CPMM program
  const [raydiumAuthority]  = findRaydiumAuthority();
  const [poolState]         = findRaydiumPoolState(ammConfig, token0Mint, token1Mint);
  const [lpMint]            = findRaydiumLpMint(poolState);
  const [token0Vault]       = findRaydiumPoolVault(poolState, token0Mint);
  const [token1Vault]       = findRaydiumPoolVault(poolState, token1Mint);
  const [observationState]  = findRaydiumObservationState(poolState);

  // LP tokens go to bonding_curve PDA
  const creatorLpToken = getAtaAddress(lpMint, bondingCurve);

  // Both coin_mint and WSOL use the standard token program
  const token0Program = TOKEN_PROGRAM_ID;
  const token1Program = TOKEN_PROGRAM_ID;

  // No instruction arguments — all logic is driven by on-chain account state
  const data = Buffer.concat([COMPLETE_DISCRIMINATOR]);

  const keys: AccountMeta[] = [
    { pubkey: caller,                   isSigner: true,  isWritable: true  },
    { pubkey: globalConfig,             isSigner: false, isWritable: false },
    { pubkey: treasury,                 isSigner: false, isWritable: true  },
    { pubkey: coinMint,                 isSigner: false, isWritable: true  },
    { pubkey: bondingCurve,             isSigner: false, isWritable: true  },
    { pubkey: bondingCurveVault,        isSigner: false, isWritable: true  },
    { pubkey: bondingCurveWsolAccount,  isSigner: false, isWritable: true  },
    { pubkey: WSOL_MINT_PUBKEY,         isSigner: false, isWritable: false },
    { pubkey: RAYDIUM_PROGRAM,          isSigner: false, isWritable: false },
    { pubkey: ammConfig,                isSigner: false, isWritable: false },
    { pubkey: raydiumAuthority,         isSigner: false, isWritable: false },
    { pubkey: poolState,                isSigner: false, isWritable: true  },
    { pubkey: lpMint,                   isSigner: false, isWritable: true  },
    { pubkey: token0Vault,              isSigner: false, isWritable: true  },
    { pubkey: token1Vault,              isSigner: false, isWritable: true  },
    { pubkey: creatorLpToken,           isSigner: false, isWritable: true  },
    { pubkey: createPoolFee,            isSigner: false, isWritable: true  },
    { pubkey: observationState,         isSigner: false, isWritable: true  },
    { pubkey: TOKEN_PROGRAM_ID,            isSigner: false, isWritable: false },
    { pubkey: token0Program,               isSigner: false, isWritable: false },
    { pubkey: token1Program,               isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId,     isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY,          isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ keys, programId, data });
}
