/**
 * Revoke mint + freeze authorities on existing Fun.Run treasury-controlled mints
 * (pump.fun-style: both disabled on Solscan).
 *
 * Dry-run by default. Pass --live to revoke on-chain and update DB flags.
 *
 *   node --env-file=backend/.env backend/scripts/revoke-mint-authorities.mjs
 *   node --env-file=backend/.env backend/scripts/revoke-mint-authorities.mjs --live
 */
import "dotenv/config";
import postgres from "postgres";
import { Connection, PublicKey } from "@solana/web3.js";
import treasury from "../solana/treasury.js";
import { revokeMintAuthorities } from "../solana/create-token.js";

const LIVE = process.argv.includes("--live");

function getRpc() {
  return (
    process.env.SOLANA_RPC ||
    process.env.SOLANA_PROGRAM_RPC ||
    "https://api.mainnet-beta.solana.com"
  );
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });
const connection = new Connection(getRpc(), "confirmed");
const treasuryPk = treasury.publicKey.toBase58();

await sql`
  alter table coins
  add column if not exists mint_authority_revoked boolean default false
`;
await sql`
  alter table coins
  add column if not exists freeze_authority_revoked boolean default false
`;

const coins = await sql`
  select id, name, symbol, mint_address,
         coalesce(mint_authority_revoked, false) as mint_authority_revoked,
         coalesce(freeze_authority_revoked, false) as freeze_authority_revoked
  from coins
  where mint_address is not null and mint_address != ''
  order by created_at desc nulls last
`;

console.log(`Mode: ${LIVE ? "LIVE" : "DRY-RUN"}`);
console.log(`Treasury: ${treasuryPk}`);
console.log(`RPC: ${getRpc()}`);
console.log(`Coins with mint_address: ${coins.length}\n`);

let wouldRevoke = 0;
let revoked = 0;
let alreadyOk = 0;
let skippedOther = 0;
let errors = 0;
let dbOnlySync = 0;

for (const coin of coins) {
  const mintAddress = String(coin.mint_address || "").trim();
  const label = `${coin.symbol || "?"} (${coin.id}) ${mintAddress}`;

  try {
    const mint = new PublicKey(mintAddress);
    const info = await connection.getParsedAccountInfo(mint);
    const parsed = info?.value?.data?.parsed?.info;
    if (!parsed) {
      console.log(`SKIP  ${label} — mint account not found`);
      skippedOther++;
      continue;
    }

    const mintAuth = parsed.mintAuthority ? String(parsed.mintAuthority) : null;
    const freezeAuth = parsed.freezeAuthority ? String(parsed.freezeAuthority) : null;
    const mintNull = !mintAuth;
    const freezeNull = !freezeAuth;

    if (mintNull && freezeNull) {
      if (!coin.mint_authority_revoked || !coin.freeze_authority_revoked) {
        if (LIVE) {
          await sql`
            update coins
            set mint_authority_revoked = true,
                freeze_authority_revoked = true
            where id = ${coin.id}
          `;
          console.log(`DB    ${label} — already revoked on-chain, flags synced`);
        } else {
          console.log(`DRY   ${label} — already revoked on-chain, would sync DB flags`);
        }
        dbOnlySync++;
      } else {
        console.log(`OK    ${label} — authorities already null`);
      }
      alreadyOk++;
      continue;
    }

    // Non-treasury authority — cannot revoke
    if (mintAuth && mintAuth !== treasuryPk) {
      console.log(`SKIP  ${label} — mint auth is ${mintAuth} (not treasury)`);
      skippedOther++;
      continue;
    }
    if (freezeAuth && freezeAuth !== treasuryPk) {
      console.log(`SKIP  ${label} — freeze auth is ${freezeAuth} (not treasury)`);
      skippedOther++;
      continue;
    }

    const needMint = mintAuth === treasuryPk;
    const needFreeze = freezeAuth === treasuryPk;
    console.log(
      `${LIVE ? "REVOK" : "DRY  "} ${label} — mint=${needMint ? "treasury→null" : "ok"} freeze=${needFreeze ? "treasury→null" : "ok"}`
    );
    wouldRevoke++;

    if (!LIVE) continue;

    const result = await revokeMintAuthorities(connection, treasury, mintAddress);
    await sql`
      update coins
      set mint_authority_revoked = ${Boolean(result.mintAuthorityRevoked)},
          freeze_authority_revoked = ${Boolean(result.freezeAuthorityRevoked)}
      where id = ${coin.id}
    `;
    revoked++;
    console.log(`  done mintRevoked=${result.mintAuthorityRevoked} freezeRevoked=${result.freezeAuthorityRevoked}`);
  } catch (e) {
    errors++;
    console.error(`ERR   ${label}:`, e?.message || e);
  }
}

console.log("\n--- summary ---");
console.log(`already ok:     ${alreadyOk}`);
console.log(`db flag sync:   ${dbOnlySync}`);
console.log(`need revoke:    ${wouldRevoke}`);
console.log(`revoked live:   ${revoked}`);
console.log(`skipped other:  ${skippedOther}`);
console.log(`errors:         ${errors}`);
if (!LIVE && wouldRevoke > 0) {
  console.log("\nRe-run with --live to apply on-chain revoke + DB updates.");
}

await sql.end();
