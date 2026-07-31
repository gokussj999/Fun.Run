import { Metaplex, keypairIdentity, TokenStandard } from "@metaplex-foundation/js";
import { Connection, PublicKey } from "@solana/web3.js";

function getRpc() {
  return (
    process.env.SOLANA_RPC ||
    process.env.SOLANA_PROGRAM_RPC ||
    "https://api.devnet.solana.com"
  );
}

/**
 * Attach on-chain Metaplex metadata so Solscan / Phantom show name + logo.
 * Requires mint authority still held by payer (call BEFORE revoke).
 * Best-effort — callers should not fail mint if this throws.
 */
export async function attachTokenMetadata(payerKeypair, opts = {}) {
  const mintAddress = String(opts.mintAddress || "").trim();
  const name = String(opts.name || "Token").trim().slice(0, 32);
  const symbol = String(opts.symbol || "TKN").trim().toUpperCase().slice(0, 10);
  const uri = String(opts.uri || opts.metadataUri || "").trim();
  if (!mintAddress) throw new Error("mintAddress required");
  if (!uri) throw new Error("metadata uri required");

  const connection =
    opts.connection || new Connection(getRpc(), "confirmed");
  const metaplex = Metaplex.make(connection).use(keypairIdentity(payerKeypair));
  const mint = new PublicKey(mintAddress);

  const { response } = await metaplex.nfts().create({
    uri,
    name,
    symbol,
    sellerFeeBasisPoints: 0,
    useExistingMint: mint,
    tokenStandard: TokenStandard.Fungible,
    isMutable: false,
    mintAuthority: payerKeypair,
    updateAuthority: payerKeypair,
    decimals: 6,
  });

  return {
    ok: true,
    signature: response?.signature || "",
    mintAddress,
  };
}
