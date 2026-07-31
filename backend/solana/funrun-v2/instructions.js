import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { anchorDiscriminator, encodeString, encodeU64 } from "./codec.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  DEFAULT_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  findBondingCurvePda,
  findCreatorProfilePda,
  findGlobalConfigPda,
  findReferralAccountPda,
  findTreasuryPda,
  getAtaAddress,
} from "./accounts.js";

const CREATE_DISC = anchorDiscriminator("create_coin");
const BUY_DISC = anchorDiscriminator("buy");
const SELL_DISC = anchorDiscriminator("sell");

export function buildCreateCoinInstruction({
  creator,
  mint,
  name,
  symbol,
  uri,
  programId = DEFAULT_PROGRAM_ID,
}) {
  const [globalConfig] = findGlobalConfigPda(programId);
  const [treasury] = findTreasuryPda(programId);
  const [creatorProfile] = findCreatorProfilePda(creator, programId);
  const [bondingCurve, bondingCurveBump] = findBondingCurvePda(mint, programId);
  const bondingCurveVault = getAtaAddress(mint, bondingCurve);

  const data = Buffer.concat([
    CREATE_DISC,
    encodeString(name),
    encodeString(symbol),
    encodeString(uri),
  ]);

  const keys = [
    { pubkey: creator, isSigner: true, isWritable: true },
    { pubkey: globalConfig, isSigner: false, isWritable: true },
    { pubkey: treasury, isSigner: false, isWritable: true },
    { pubkey: creatorProfile, isSigner: false, isWritable: true },
    { pubkey: mint, isSigner: true, isWritable: true },
    { pubkey: bondingCurve, isSigner: false, isWritable: true },
    { pubkey: bondingCurveVault, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return {
    instruction: new TransactionInstruction({ keys, programId, data }),
    bondingCurvePda: bondingCurve,
    bondingCurveBump,
    bondingCurveVault,
  };
}

export function buildBuyInstruction({
  buyer,
  mint,
  solAmount,
  minTokensOut = 0n,
  referrer,
  programId = DEFAULT_PROGRAM_ID,
}) {
  const [globalConfig] = findGlobalConfigPda(programId);
  const [treasury] = findTreasuryPda(programId);
  const [bondingCurve] = findBondingCurvePda(mint, programId);
  const bondingCurveVault = getAtaAddress(mint, bondingCurve);
  const buyerTokenAccount = getAtaAddress(mint, buyer);
  const referralAccount =
    referrer instanceof PublicKey
      ? findReferralAccountPda(referrer, programId)[0]
      : buyer;

  const data = Buffer.concat([
    BUY_DISC,
    encodeU64(solAmount),
    encodeU64(minTokensOut),
  ]);

  const keys = [
    { pubkey: buyer, isSigner: true, isWritable: true },
    { pubkey: globalConfig, isSigner: false, isWritable: false },
    { pubkey: treasury, isSigner: false, isWritable: true },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: bondingCurve, isSigner: false, isWritable: true },
    { pubkey: bondingCurveVault, isSigner: false, isWritable: true },
    { pubkey: buyerTokenAccount, isSigner: false, isWritable: true },
    { pubkey: referralAccount, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ keys, programId, data });
}

export function buildSellInstruction({
  seller,
  mint,
  tokenAmount,
  minSolOut = 0n,
  referrer,
  programId = DEFAULT_PROGRAM_ID,
}) {
  const [globalConfig] = findGlobalConfigPda(programId);
  const [treasury] = findTreasuryPda(programId);
  const [bondingCurve] = findBondingCurvePda(mint, programId);
  const bondingCurveVault = getAtaAddress(mint, bondingCurve);
  const sellerTokenAccount = getAtaAddress(mint, seller);
  const referralAccount =
    referrer instanceof PublicKey
      ? findReferralAccountPda(referrer, programId)[0]
      : seller;

  const data = Buffer.concat([
    SELL_DISC,
    encodeU64(tokenAmount),
    encodeU64(minSolOut),
  ]);

  const keys = [
    { pubkey: seller, isSigner: true, isWritable: true },
    { pubkey: globalConfig, isSigner: false, isWritable: false },
    { pubkey: treasury, isSigner: false, isWritable: true },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: bondingCurve, isSigner: false, isWritable: true },
    { pubkey: bondingCurveVault, isSigner: false, isWritable: true },
    { pubkey: sellerTokenAccount, isSigner: false, isWritable: true },
    { pubkey: referralAccount, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ keys, programId, data });
}
