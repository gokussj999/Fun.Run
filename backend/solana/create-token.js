import { createMint } from "@solana/spl-token";
import { Connection } from "@solana/web3.js";

/**
 * Create an SPL mint on the same cluster as SOLANA_RPC
 * (devnet now, mainnet later — no hardcoded cluster).
 */
export async function createSPLToken(payerKeypair) {
  const rpc =
    process.env.SOLANA_RPC ||
    process.env.SOLANA_PROGRAM_RPC ||
    "https://api.devnet.solana.com";

  const connection = new Connection(rpc, "confirmed");
  const mint = await createMint(
    connection,
    payerKeypair,
    payerKeypair.publicKey,
    payerKeypair.publicKey,
    6
  );
  return { mintAddress: mint.toBase58() };
}
