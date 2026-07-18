/**
 * Delete all coins except Lucky / LCY (and related txs, holdings, candles).
 * Dry-run by default. Pass --live to apply.
 *
 *   node --env-file=backend/.env backend/scripts/cleanup-coins-keep-lcy.mjs
 *   node --env-file=backend/.env backend/scripts/cleanup-coins-keep-lcy.mjs --live
 */
import postgres from "postgres";

const LIVE = process.argv.includes("--live");
const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });

function keepCoin(row) {
  const sym = String(row.symbol || "").trim().toUpperCase();
  const name = String(row.name || "").trim().toLowerCase();
  return sym === "LCY" || name === "lucky";
}

try {
  const coins = await sql`
    select id, name, symbol, creator_wallet, volume_sol, created_at
    from coins
    order by created_at desc
  `;

  const keep = coins.filter(keepCoin);
  const drop = coins.filter((c) => !keepCoin(c));

  console.log(`Total coins: ${coins.length}`);
  console.log("KEEP:");
  for (const c of keep) {
    console.log(`  ${c.symbol} (${c.name}) id=${c.id}`);
  }
  console.log(`DELETE: ${drop.length}`);
  for (const c of drop) {
    console.log(`  ${c.symbol} (${c.name}) id=${c.id} vol=${c.volume_sol}`);
  }

  if (!drop.length) {
    console.log("Nothing to delete.");
    process.exit(0);
  }

  if (!LIVE) {
    console.log("\nDry-run only. Re-run with --live to delete.");
    process.exit(0);
  }

  const ids = drop.map((c) => String(c.id));

  await sql.begin(async (tx) => {
    const t1 = await tx`delete from candles where coin_id = any(${ids})`;
    const t2 = await tx`delete from holdings where coin_id = any(${ids})`;
    const t3 = await tx`delete from transactions where coin_id = any(${ids})`;
    const t4 = await tx`delete from audit_logs where coin_id = any(${ids})`;
    const t5 = await tx`delete from coins where id = any(${ids})`;
    console.log("Deleted:", {
      candles: t1.count,
      holdings: t2.count,
      transactions: t3.count,
      audit_logs: t4.count,
      coins: t5.count,
    });
  });

  const left = await sql`select id, symbol, name from coins order by created_at desc`;
  console.log("\nRemaining coins:");
  for (const c of left) console.log(`  ${c.symbol} (${c.name}) id=${c.id}`);
  console.log("Done.");
} finally {
  await sql.end({ timeout: 5 });
}
