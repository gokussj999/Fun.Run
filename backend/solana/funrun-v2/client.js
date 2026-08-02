import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  DEFAULT_PROGRAM_ID,
  findBondingCurvePda,
  getAtaAddress,
} from "./accounts.js";
import {
  buildBuyInstruction,
  buildCreateCoinInstruction,
  buildSellInstruction,
} from "./instructions.js";
import { readI64LE, readU64LE } from "./codec.js";

const TOKEN_DECIMALS = 6;
const LAMPORTS_PER_SOL = 1_000_000_000;
/** Creation fee default + rent buffer for mint/curve/vault/profile */
const CREATE_FUND_LAMPORTS = 50_000_000; // 0.05 SOL
const TRADE_BUFFER_LAMPORTS = 5_000_000; // 0.005 SOL fees

function getRpc() {
  return (
    process.env.SOLANA_RPC ||
    process.env.SOLANA_PROGRAM_RPC ||
    "https://api.mainnet-beta.solana.com"
  );
}

export function getFunrunV2Connection() {
  return new Connection(getRpc(), "confirmed");
}

export function getFunrunV2ProgramId() {
  return DEFAULT_PROGRAM_ID;
}

/**
 * Top up custodial wallet from treasury when below minLamports.
 */
export async function ensureCustodialFunded(
  connection,
  treasuryKeypair,
  custodialAddress,
  minLamports = CREATE_FUND_LAMPORTS
) {
  const target = new PublicKey(String(custodialAddress || "").trim());
  const balance = await connection.getBalance(target);
  if (balance >= minLamports) return { funded: false, balance };

  const topUp = minLamports - balance;
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: treasuryKeypair.publicKey,
      toPubkey: target,
      lamports: topUp,
    })
  );
  const sig = await sendAndConfirmTransaction(connection, tx, [treasuryKeypair], {
    commitment: "confirmed",
  });
  return { funded: true, balance: balance + topUp, signature: sig, topUp };
}

/**
 * Decode BondingCurve account (borsh, variable-length strings).
 */
export function decodeBondingCurve(data) {
  const buf = Buffer.from(data);
  let o = 8; // discriminator
  const creator = new PublicKey(buf.subarray(o, o + 32));
  o += 32;
  const mint = new PublicKey(buf.subarray(o, o + 32));
  o += 32;
  const hasReferrer = buf[o];
  o += 1;
  let creatorReferrer = null;
  if (hasReferrer === 1) {
    creatorReferrer = new PublicKey(buf.subarray(o, o + 32));
    o += 32;
  }
  const nameLen = buf.readUInt32LE(o);
  o += 4;
  const name = buf.subarray(o, o + nameLen).toString("utf8");
  o += nameLen;
  const symbolLen = buf.readUInt32LE(o);
  o += 4;
  const symbol = buf.subarray(o, o + symbolLen).toString("utf8");
  o += symbolLen;
  const uriLen = buf.readUInt32LE(o);
  o += 4;
  const uri = buf.subarray(o, o + uriLen).toString("utf8");
  o += uriLen;

  const creationFeePaid = Number(readU64LE(buf, o));
  o += 8;
  const creationTimestamp = Number(readI64LE(buf, o));
  o += 8;
  const protocolVersion = buf[o];
  o += 1;
  const virtualSolReserves = Number(readU64LE(buf, o));
  o += 8;
  const virtualTokenReserves = Number(readU64LE(buf, o));
  o += 8;
  const realSolReserves = Number(readU64LE(buf, o));
  o += 8;
  const realTokenReserves = Number(readU64LE(buf, o));
  o += 8;
  const creatorFeesAccumulated = Number(readU64LE(buf, o));
  o += 8;
  const complete = buf[o] === 1;
  o += 1;
  const totalTrades = Number(readU64LE(buf, o));
  o += 8;
  const totalVolumeSol = Number(readU64LE(buf, o));
  o += 8;
  const bump = buf[o];
  o += 1;
  const graduationDexFeeSnapshot = Number(readU64LE(buf, o));
  o += 8;
  const graduated = buf[o] === 1;

  return {
    creator: creator.toBase58(),
    mint: mint.toBase58(),
    creatorReferrer: creatorReferrer?.toBase58() || null,
    name,
    symbol,
    uri,
    creationFeePaid,
    creationTimestamp,
    protocolVersion,
    virtualSolReserves,
    virtualTokenReserves,
    realSolReserves,
    realTokenReserves,
    creatorFeesAccumulated,
    complete,
    totalTrades,
    totalVolumeSol,
    bump,
    graduationDexFeeSnapshot,
    graduated,
    // UI helpers (SOL / UI tokens)
    virtualSol: virtualSolReserves / LAMPORTS_PER_SOL,
    realSol: realSolReserves / LAMPORTS_PER_SOL,
    virtualTokens: virtualTokenReserves / 10 ** TOKEN_DECIMALS,
    realTokens: realTokenReserves / 10 ** TOKEN_DECIMALS,
    volumeSol: totalVolumeSol / LAMPORTS_PER_SOL,
  };
}

export async function fetchBondingCurve(connection, mintAddress, programId = DEFAULT_PROGRAM_ID) {
  const mint = new PublicKey(String(mintAddress || "").trim());
  const [pda] = findBondingCurvePda(mint, programId);
  const info = await connection.getAccountInfo(pda, "confirmed");
  if (!info?.data) return null;
  const decoded = decodeBondingCurve(info.data);
  return { ...decoded, bondingCurvePda: pda.toBase58() };
}

export async function fetchTokenUiBalance(connection, mintAddress, ownerAddress) {
  const mint = new PublicKey(String(mintAddress || "").trim());
  const owner = new PublicKey(String(ownerAddress || "").trim());
  const ata = getAtaAddress(mint, owner);
  try {
    const bal = await connection.getTokenAccountBalance(ata, "confirmed");
    return {
      ata: ata.toBase58(),
      uiAmount: Number(bal?.value?.uiAmount || 0),
      amount: String(bal?.value?.amount || "0"),
    };
  } catch {
    return { ata: ata.toBase58(), uiAmount: 0, amount: "0" };
  }
}

/**
 * Create coin on-chain via funrun_v2.create_coin.
 * Signer = creator custodial keypair; also signs with fresh mint keypair.
 */
export async function createCoinOnchain({
  connection = getFunrunV2Connection(),
  creatorKeypair,
  treasuryKeypair,
  name,
  symbol,
  uri,
  programId = DEFAULT_PROGRAM_ID,
}) {
  if (!creatorKeypair?.publicKey) throw new Error("creatorKeypair required");
  await ensureCustodialFunded(
    connection,
    treasuryKeypair,
    creatorKeypair.publicKey.toBase58(),
    CREATE_FUND_LAMPORTS
  );

  const mintKeypair = Keypair.generate();
  const safeName = String(name || "Token").trim().slice(0, 32);
  const safeSymbol = String(symbol || "TKN").trim().toUpperCase().slice(0, 10);
  const safeUri = String(uri || `https://fun.run/coin/${safeSymbol}`).trim().slice(0, 200);

  const { instruction, bondingCurvePda, bondingCurveVault } = buildCreateCoinInstruction({
    creator: creatorKeypair.publicKey,
    mint: mintKeypair.publicKey,
    name: safeName,
    symbol: safeSymbol,
    uri: safeUri,
    programId,
  });

  const tx = new Transaction().add(instruction);
  tx.feePayer = creatorKeypair.publicKey;
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;

  tx.sign(creatorKeypair, mintKeypair);
  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  const curve = await fetchBondingCurve(connection, mintKeypair.publicKey.toBase58(), programId);

  return {
    mintAddress: mintKeypair.publicKey.toBase58(),
    bondingCurvePda: bondingCurvePda.toBase58(),
    bondingCurveVault: bondingCurveVault.toBase58(),
    signature,
    curve,
    // Authorities revoked to None at create (pump.fun-style Disabled on Solscan)
    mintAuthorityRevoked: true,
    freezeAuthorityRevoked: true,
    onchainCurve: true,
  };
}

export async function buyOnchain({
  connection = getFunrunV2Connection(),
  buyerKeypair,
  treasuryKeypair,
  mintAddress,
  solAmount,
  minTokensOut = 0n,
  referrer,
  programId = DEFAULT_PROGRAM_ID,
}) {
  const sol = Math.max(0, Number(solAmount) || 0);
  if (sol <= 0) throw new Error("solAmount required");
  const lamports = BigInt(Math.floor(sol * LAMPORTS_PER_SOL));
  const need = Number(lamports) + TRADE_BUFFER_LAMPORTS;

  await ensureCustodialFunded(
    connection,
    treasuryKeypair,
    buyerKeypair.publicKey.toBase58(),
    need
  );

  const mint = new PublicKey(String(mintAddress || "").trim());
  const ix = buildBuyInstruction({
    buyer: buyerKeypair.publicKey,
    mint,
    solAmount: lamports,
    minTokensOut: BigInt(minTokensOut),
    referrer: referrer ? new PublicKey(referrer) : undefined,
    programId,
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = buyerKeypair.publicKey;
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.sign(buyerKeypair);

  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  const [curve, tokenBal] = await Promise.all([
    fetchBondingCurve(connection, mint.toBase58(), programId),
    fetchTokenUiBalance(connection, mint.toBase58(), buyerKeypair.publicKey.toBase58()),
  ]);

  return { signature, curve, tokenBal, solSpent: sol };
}

export async function sellOnchain({
  connection = getFunrunV2Connection(),
  sellerKeypair,
  treasuryKeypair,
  mintAddress,
  tokenAmount,
  minSolOut = 0n,
  referrer,
  programId = DEFAULT_PROGRAM_ID,
}) {
  const tokens = Math.max(0, Number(tokenAmount) || 0);
  if (tokens <= 0) throw new Error("tokenAmount required");
  const raw = BigInt(Math.floor(tokens * 10 ** TOKEN_DECIMALS));

  if (treasuryKeypair?.publicKey) {
    await ensureCustodialFunded(
      connection,
      treasuryKeypair,
      sellerKeypair.publicKey.toBase58(),
      TRADE_BUFFER_LAMPORTS
    );
  }

  const mint = new PublicKey(String(mintAddress || "").trim());
  const ix = buildSellInstruction({
    seller: sellerKeypair.publicKey,
    mint,
    tokenAmount: raw,
    minSolOut: BigInt(minSolOut),
    referrer: referrer ? new PublicKey(referrer) : undefined,
    programId,
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = sellerKeypair.publicKey;
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.sign(sellerKeypair);

  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  const [curve, tokenBal] = await Promise.all([
    fetchBondingCurve(connection, mint.toBase58(), programId),
    fetchTokenUiBalance(connection, mint.toBase58(), sellerKeypair.publicKey.toBase58()),
  ]);

  return { signature, curve, tokenBal, tokensSold: tokens };
}

export const FUNRUN_V2_TOKEN_DECIMALS = TOKEN_DECIMALS;
export const FUNRUN_V2_LAMPORTS_PER_SOL = LAMPORTS_PER_SOL;
