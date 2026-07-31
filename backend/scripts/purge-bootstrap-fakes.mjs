/**
 * Purge unbought bootstrap/fake coins + shadow bot profiles.
 * Keeps real coins and adopted ex-fake coins (bootstrap_adopted_by set / phase=adopted).
 *
 * Dry-run by default. Pass --live to apply.
 *
 *   node --env-file=backend/.env backend/scripts/purge-bootstrap-fakes.mjs
 *   node --env-file=backend/.env backend/scripts/purge-bootstrap-fakes.mjs --live
 */
import postgres from "postgres";

const LIVE = process.argv.includes("--live");
const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });

try {
  const fakeCoins = await sql`
    select id, name, symbol, bootstrap_phase, bootstrap_adopted_by, created_at
    from coins
    where coalesce(is_bootstrap, false) = true
      and coalesce(bootstrap_adopted_by, '') = ''
      and coalesce(bootstrap_phase, 'live') != 'adopted'
    order by created_at desc
  `;

  const adopted = await sql`
    select id, name, symbol, bootstrap_adopted_by, bootstrap_phase
    from coins
    where coalesce(bootstrap_adopted_by, '') != ''
       or coalesce(bootstrap_phase, '') = 'adopted'
    order by created_at desc
  `;

  const shadows = await sql`
    select count(*)::int as cnt from profiles where coalesce(is_bootstrap, false) = true
  `;
  const shadowCount = Number(shadows?.[0]?.cnt || 0);

  let eventCount = 0;
  try {
    const ev = await sql`select count(*)::int as cnt from bootstrap_events`;
    eventCount = Number(ev?.[0]?.cnt || 0);
  } catch {
    eventCount = 0;
  }

  console.log(`Unbought fake coins to DELETE: ${fakeCoins.length}`);
  for (const c of fakeCoins) {
    console.log(`  ${c.symbol} (${c.name}) id=${c.id} phase=${c.bootstrap_phase}`);
  }
  console.log(`Adopted coins KEEP: ${adopted.length}`);
  for (const c of adopted) {
    console.log(`  ${c.symbol} (${c.name}) id=${c.id} adopted_by=${String(c.bootstrap_adopted_by || "").slice(0, 8)}…`);
  }
  console.log(`Shadow bootstrap profiles to DELETE: ${shadowCount}`);
  console.log(`bootstrap_events rows to DELETE: ${eventCount}`);

  if (!fakeCoins.length && shadowCount === 0 && eventCount === 0) {
    console.log("Nothing to purge.");
    process.exit(0);
  }

  if (!LIVE) {
    console.log("\nDry-run only. Re-run with --live to delete.");
    process.exit(0);
  }

  const ids = fakeCoins.map((c) => String(c.id));

  await sql.begin(async (tx) => {
    let candles = 0;
    let holdings = 0;
    let transactions = 0;
    let auditLogs = 0;
    let coinsDeleted = 0;

    if (ids.length) {
      const t1 = await tx`delete from candles where coin_id = any(${ids})`;
      const t2 = await tx`delete from holdings where coin_id = any(${ids})`;
      const t3 = await tx`delete from transactions where coin_id = any(${ids})`;
      candles = t1.count;
      holdings = t2.count;
      transactions = t3.count;
      try {
        const t4 = await tx`delete from audit_logs where coin_id = any(${ids})`;
        auditLogs = t4.count;
      } catch (e) {
        console.log("audit_logs coin_id delete skipped:", e?.message || e);
      }
      const t5 = await tx`delete from coins where id = any(${ids})`;
      coinsDeleted = t5.count;
    }

    const tProfiles = await tx`delete from profiles where coalesce(is_bootstrap, false) = true`;

    let eventsDeleted = 0;
    try {
      const tEv = await tx`delete from bootstrap_events`;
      eventsDeleted = tEv.count;
    } catch (e) {
      console.log("bootstrap_events delete skipped:", e?.message || e);
    }

    console.log("Deleted:", {
      candles,
      holdings,
      transactions,
      audit_logs: auditLogs,
      coins: coinsDeleted,
      shadow_profiles: tProfiles.count,
      bootstrap_events: eventsDeleted,
    });
  });

  const left = await sql`
    select id, symbol, name, coalesce(is_bootstrap, false) as is_bootstrap,
           coalesce(bootstrap_adopted_by, '') as adopted_by
    from coins
    order by created_at desc
  `;
  console.log(`\nRemaining coins: ${left.length}`);
  for (const c of left) {
    const tag = c.adopted_by ? "adopted" : c.is_bootstrap ? "bootstrap?" : "real";
    console.log(`  ${c.symbol} (${c.name}) [${tag}] id=${c.id}`);
  }
  console.log("Done.");
} finally {
  await sql.end({ timeout: 5 });
}
