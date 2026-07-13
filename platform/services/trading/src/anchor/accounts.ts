import { PublicKey } from '@solana/web3.js';
import { RAYDIUM_CPMM_PROGRAM_ID } from '@funrun/shared';

import {
  GLOBAL_CONFIG_SEED,
  TREASURY_SEED,
  BONDING_CURVE_SEED,
  CREATOR_PROFILE_SEED,
  CREATOR_REFERRAL_SEED,
  RAYDIUM_AUTHORITY_SEED,
  RAYDIUM_POOL_SEED,
  RAYDIUM_LP_MINT_SEED,
  RAYDIUM_OBSERVATION_SEED,
  RAYDIUM_POOL_VAULT_SEED,
} from './seeds.js';

// ── Well-known program IDs ────────────────────────────────────────────────────

export const TOKEN_PROGRAM_ID            = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const RAYDIUM_PROGRAM                    = new PublicKey(RAYDIUM_CPMM_PROGRAM_ID);

// ── Fun.Run PDAs ─────────────────────────────────────────────────────────────

export function findGlobalConfigPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([GLOBAL_CONFIG_SEED], programId);
}

export function findTreasuryPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([TREASURY_SEED], programId);
}

export function findBondingCurvePda(mint: PublicKey, programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [BONDING_CURVE_SEED, mint.toBuffer()],
    programId,
  );
}

export function findCreatorProfilePda(creator: PublicKey, programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [CREATOR_PROFILE_SEED, creator.toBuffer()],
    programId,
  );
}

export function findReferralAccountPda(referrer: PublicKey, programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [CREATOR_REFERRAL_SEED, referrer.toBuffer()],
    programId,
  );
}

// ── ATA derivation ────────────────────────────────────────────────────────────

/** Derives the Associated Token Account address for (mint, owner) using the standard token program. */
export function getAtaAddress(mint: PublicKey, owner: PublicKey): PublicKey {
  const [ata] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return ata;
}

// ── Raydium CPMM PDAs ────────────────────────────────────────────────────────

export function findRaydiumAuthority(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([RAYDIUM_AUTHORITY_SEED], RAYDIUM_PROGRAM);
}

export function findRaydiumPoolState(
  ammConfig:  PublicKey,
  token0Mint: PublicKey,
  token1Mint: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [RAYDIUM_POOL_SEED, ammConfig.toBuffer(), token0Mint.toBuffer(), token1Mint.toBuffer()],
    RAYDIUM_PROGRAM,
  );
}

export function findRaydiumLpMint(poolState: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [RAYDIUM_LP_MINT_SEED, poolState.toBuffer()],
    RAYDIUM_PROGRAM,
  );
}

export function findRaydiumPoolVault(poolState: PublicKey, mintKey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [RAYDIUM_POOL_VAULT_SEED, poolState.toBuffer(), mintKey.toBuffer()],
    RAYDIUM_PROGRAM,
  );
}

export function findRaydiumObservationState(poolState: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [RAYDIUM_OBSERVATION_SEED, poolState.toBuffer()],
    RAYDIUM_PROGRAM,
  );
}

// ── Token ordering ────────────────────────────────────────────────────────────

/**
 * Raydium CPMM requires token0 < token1 by lexicographic byte comparison.
 * Returns [token0, token1] in the correct order.
 */
export function raydiumTokenOrder(
  mintA: PublicKey,
  mintB: PublicKey,
): [PublicKey, PublicKey] {
  const cmp = Buffer.compare(mintA.toBuffer(), mintB.toBuffer());
  return cmp <= 0 ? [mintA, mintB] : [mintB, mintA];
}
