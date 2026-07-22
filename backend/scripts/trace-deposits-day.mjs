import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(__dirname, "..", ".env"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const sql = postgres(env.DATABASE_URL, { ssl: "require", max: 1 });
const W = "CZ9bps8dTtK69bRaQc8A4hUR8ZmUbfbYbTWfvaHpqSyn";

try {
  console.log("=== ALL DEPOSIT AUDITS ===");
  const deps = await sql`
    select amount, created_at, meta
    from audit_logs
    where wallet = ${W} and event_type = 'DEPOSIT'
    order by created_at asc
  `;
  let sum = 0;
  for (const d of deps) {
    sum += Number(d.amount);
    console.log(Number(d.amount), String(d.created_at), d.meta || "");
  }
  console.log("TOTAL_DEPOSITED_AUDIT", sum);

  console.log("\n=== Jul 21 (PKT) window UTC Jul 20 19:00 – Jul 21 19:00 ===");
  const day = await sql`
    select event_type, amount, created_at, meta
    from audit_logs
    where wallet = ${W}
      and created_at >= '2026-07-20 19:00:00+00'
      and created_at < '2026-07-21 19:00:00+00'
    order by created_at asc
  `;
  let inAmt = 0;
  let outAmt = 0;
  for (const a of day) {
    const amt = Number(a.amount);
    const ev = a.event_type;
    if (ev === "DEPOSIT" || ev === "SELL" || ev.startsWith("CLAIM")) inAmt += amt;
    if (ev === "BUY" || ev === "COIN_CREATE" || ev === "WITHDRAW") outAmt += amt;
    console.log(ev, amt, String(a.created_at));
  }
  console.log({ dayIn: inAmt, dayOut: outAmt });

  // deposits table full
  console.log("\n=== deposits table all for related wallets ===");
  const allDep = await sql`
    select * from deposits
    where wallet ilike 'CZ9%' or wallet ilike '29QQ%'
    order by created_at desc limit 20
  `;
  console.log(allDep);

  const [p] = await sql`select run_balance, wallet_address from profiles where wallet = ${W}`;
  console.log("\nMAIN_WALLET_RUN_BALANCE", Number(p.run_balance));
  console.log("CUSTODIAL", p.wallet_address);
} finally {
  await sql.end({ timeout: 5 });
}
