/**
 * One-shot: zero absurd legacy owner_rewards on the old APP_OWNER wallet.
 * Those values were never real trade fees (volume << rewards).
 *
 *   node --env-file=backend/.env backend/scripts/reset-legacy-owner-rewards.mjs --live
 */
import postgres from "postgres";

const LIVE = process.argv.includes("--live");
const OLD = "HEBqdStfnZgygQVMxpq5CXjsfPPagytdZoAyY2WcC1ji";
const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });

try {
  const rows = await sql`
    select wallet, owner_rewards from profiles where wallet = ${OLD} limit 1
  `;
  if (!rows.length) {
    console.log("Old owner profile not found");
    process.exit(0);
  }
  const amt = Number(rows[0].owner_rewards || 0);
  console.log(`Old owner ${OLD.slice(0, 8)}… owner_rewards=${amt}`);
  if (!(amt > 100)) {
    console.log("Nothing absurd to reset (<= 100 SOL).");
    process.exit(0);
  }
  if (!LIVE) {
    console.log("Dry-run. Re-run with --live to set owner_rewards=0.");
    process.exit(0);
  }
  await sql`
    update profiles set owner_rewards = 0, updated_at = now() where wallet = ${OLD}
  `;
  console.log("Reset done.");
} finally {
  await sql.end({ timeout: 5 });
}
