import { PublicKey } from "@solana/web3.js";

export const GLOBAL_CONFIG_SEED = Buffer.from("global_config");
export const TREASURY_SEED = Buffer.from("treasury");
export const BONDING_CURVE_SEED = Buffer.from("bonding_curve");
export const CREATOR_PROFILE_SEED = Buffer.from("creator_profile");
export const CREATOR_REFERRAL_SEED = Buffer.from("creator_referral");

export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

export const DEFAULT_PROGRAM_ID = new PublicKey(
  process.env.FUNRUN_V2_PROGRAM_ID || "HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP"
);

export function findGlobalConfigPda(programId = DEFAULT_PROGRAM_ID) {
  return PublicKey.findProgramAddressSync([GLOBAL_CONFIG_SEED], programId);
}

export function findTreasuryPda(programId = DEFAULT_PROGRAM_ID) {
  return PublicKey.findProgramAddressSync([TREASURY_SEED], programId);
}

export function findBondingCurvePda(mint, programId = DEFAULT_PROGRAM_ID) {
  return PublicKey.findProgramAddressSync(
    [BONDING_CURVE_SEED, mint.toBuffer()],
    programId
  );
}

export function findCreatorProfilePda(creator, programId = DEFAULT_PROGRAM_ID) {
  return PublicKey.findProgramAddressSync(
    [CREATOR_PROFILE_SEED, creator.toBuffer()],
    programId
  );
}

export function findReferralAccountPda(referrer, programId = DEFAULT_PROGRAM_ID) {
  return PublicKey.findProgramAddressSync(
    [CREATOR_REFERRAL_SEED, referrer.toBuffer()],
    programId
  );
}

export function getAtaAddress(mint, owner) {
  const [ata] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return ata;
}
