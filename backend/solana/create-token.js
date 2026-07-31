import {
  AuthorityType,
  createMint,
  setAuthority,
} from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";

function getRpc() {
  return (
    process.env.SOLANA_RPC ||
    process.env.SOLANA_PROGRAM_RPC ||
    "https://api.devnet.solana.com"
  );
}

/**
 * Create an SPL mint pump.fun-style:
 * - freeze authority never set
 * - optional Metaplex metadata while mint auth still held
 * - mint authority revoked immediately after
 * so Solscan / DexScreener show Mint+Freeze Disabled.
 *
 * @param {import('@solana/web3.js').Keypair} payerKeypair
 * @param {{ name?: string, symbol?: string, metadataUri?: string }} [opts]
 */
export async function createSPLToken(payerKeypair, opts = {}) {
  const connection = new Connection(getRpc(), "confirmed");

  // freezeAuthority = null (cannot freeze accounts)
  const mint = await createMint(
    connection,
    payerKeypair,
    payerKeypair.publicKey,
    null,
    6
  );
  const mintAddress = mint.toBase58();

  // Metadata must run BEFORE mint authority is revoked
  let metadataSignature = "";
  const uri = String(opts.metadataUri || opts.uri || "").trim();
  if (uri && (opts.name || opts.symbol)) {
    try {
      const { attachTokenMetadata } = await import("./attach-metadata.js");
      const meta = await attachTokenMetadata(payerKeypair, {
        mintAddress,
        name: opts.name,
        symbol: opts.symbol,
        uri,
        connection,
      });
      metadataSignature = meta?.signature || "";
    } catch (e) {
      console.error("[createSPLToken] metadata skipped:", e?.message || e);
    }
  }

  // Revoke mint authority — supply fixed forever (pump.fun trust signal)
  await setAuthority(
    connection,
    payerKeypair,
    mint,
    payerKeypair.publicKey,
    AuthorityType.MintTokens,
    null
  );

  return {
    mintAddress,
    mintAuthorityRevoked: true,
    freezeAuthorityRevoked: true,
    metadataSignature,
  };
}

/**
 * Revoke mint + freeze authorities when treasury still controls them.
 * Idempotent if already null.
 */
export async function revokeMintAuthorities(connection, payerKeypair, mintAddress) {
  const mint = new PublicKey(String(mintAddress || "").trim());
  const conn = connection || new Connection(getRpc(), "confirmed");
  const info = await conn.getParsedAccountInfo(mint);
  const parsed = info?.value?.data?.parsed?.info;
  if (!parsed) throw new Error(`mint not found: ${mintAddress}`);

  const treasury = payerKeypair.publicKey.toBase58();
  let mintAuthorityRevoked = !parsed.mintAuthority;
  let freezeAuthorityRevoked = !parsed.freezeAuthority;

  if (parsed.mintAuthority) {
    if (String(parsed.mintAuthority) !== treasury) {
      throw new Error(
        `mint authority is ${parsed.mintAuthority}, not treasury — cannot revoke`
      );
    }
    await setAuthority(
      conn,
      payerKeypair,
      mint,
      payerKeypair.publicKey,
      AuthorityType.MintTokens,
      null
    );
    mintAuthorityRevoked = true;
  }

  if (parsed.freezeAuthority) {
    if (String(parsed.freezeAuthority) !== treasury) {
      throw new Error(
        `freeze authority is ${parsed.freezeAuthority}, not treasury — cannot revoke`
      );
    }
    await setAuthority(
      conn,
      payerKeypair,
      mint,
      payerKeypair.publicKey,
      AuthorityType.FreezeAccount,
      null
    );
    freezeAuthorityRevoked = true;
  }

  return { mintAuthorityRevoked, freezeAuthorityRevoked };
}
