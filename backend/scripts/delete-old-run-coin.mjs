/**
 * Delete the older RUN coin (50B supply), keep the newer RUN (10B).
 *   node --env-file=backend/.env backend/scripts/delete-old-run-coin.mjs --live
 */
import postgres from "postgres";

const LIVE = process.argv.includes("--live");
const OLD_RUN_ID = "73b6046fb9c2445b9f5a307d74767de4"; // 50B, created first
const KEEP_RUN_ID = "7cc0f755e5a5475ca8345a062d5c2475"; // 10B, created later

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });

try {
  const rows = await sql`
    select id, name, symbol, total_supply, created_at
    from coins
    where id = ${OLD_RUN_ID} or id = ${KEEP_RUN_ID}
    order by created_at
  `;
  console.log("Target coins:");
  for (const r of rows) {
    console.log(
      `${r.id === OLD_RUN_ID ? "DELETE" : "KEEP "} ${r.symbol} supply=${Number(r.total_supply)} id=${r.id}`
    );
  }

  if (!rows.find((r) => r.id === OLD_RUN_ID)) {
    console.log("Old RUN already gone.");
    process.exit(0);
  }

  if (!LIVE) {
    console.log("Dry-run only. Re-run with --live to delete.");
    process.exit(0);
  }

  const id = OLD_RUN_ID;
  const del = await sql.begin(async (tx) => {
    const c1 = await tx`delete from candles where coin_id = ${id}`;
    const c2 = await tx`delete from holdings where coin_id = ${id}`;
    const c3 = await tx`delete from transactions where coin_id = ${id}`;
    const c4 = await tx`delete from audit_logs where coin_id = ${id}`;
    const c5 = await tx`delete from coins where id = ${id}`;
    return {
      candles: c1.count,
      holdings: c2.count,
      tx: c3.count,
      audit: c4.count,
      coins: c5.count,
    };
  });
  console.log("Deleted:", del);

  const left = await sql`
    select id, symbol, name, total_supply from coins order by created_at
  `;
  console.log("\nRemaining:");
  for (const r of left) {
    console.log(`${r.symbol} | ${r.name} | supply=${Number(r.total_supply)} | ${r.id}`);
  }
} finally {
  await sql.end({ timeout: 5 });
}
