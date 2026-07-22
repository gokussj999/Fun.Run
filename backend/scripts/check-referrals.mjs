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
const OWNER = String(env.APP_OWNER_WALLET || "CZ9bps8dTtK69bRaQc8A4hUR8ZmUbfbYbTWfvaHpqSyn").trim();

try {
  const [me] = await sql`
    select wallet, referral_code, referral_count, referrer, run_tokens, created_at
    from profiles where wallet = ${OWNER}
  `;
  console.log("ME", me);

  const byReferrer = await sql`
    select wallet, referrer, referral_code, created_at, run_tokens
    from profiles
    where referrer = ${OWNER}
    order by created_at asc
  `;
  console.log("\nDirect referrer=OWNER count", byReferrer.length);
  for (const r of byReferrer) {
    console.log(" ", String(r.wallet).slice(0, 12), String(r.created_at), "run_tokens", Number(r.run_tokens || 0));
  }

  // Also match by short code / prefix
  const code = String(me?.referral_code || "").trim();
  console.log("\nMy referral_code:", code);

  if (code) {
    const byCode = await sql`
      select wallet, referrer, created_at
      from profiles
      where lower(referrer) = ${code.toLowerCase()}
         or referrer ilike ${code + "%"}
      order by created_at asc
    `;
    console.log("referrer matches code/prefix", byCode.length);
    for (const r of byCode.slice(0, 30)) {
      console.log(" ", r.referrer, "->", String(r.wallet).slice(0, 12), String(r.created_at));
    }
  }

  // Prefix of owner wallet used as ?ref=
  const prefix = OWNER.slice(0, 8);
  const byPrefix = await sql`
    select wallet, referrer, created_at
    from profiles
    where referrer ilike ${prefix + "%"}
       or referrer = ${OWNER}
    order by created_at asc
  `;
  console.log("\nreferrer starts with owner prefix / full", byPrefix.length);
  for (const r of byPrefix) {
    console.log(" ", String(r.referrer).slice(0, 16), "->", String(r.wallet).slice(0, 12), String(r.created_at));
  }

  // Anyone with referrer set at all
  const [stats] = await sql`
    select
      count(*)::int as total_profiles,
      count(*) filter (where referrer is not null and referrer <> '')::int as with_referrer
    from profiles
  `;
  console.log("\nGLOBAL", stats);

  const top = await sql`
    select referrer, count(*)::int as n
    from profiles
    where referrer is not null and trim(referrer) <> ''
    group by referrer
    order by n desc
    limit 15
  `;
  console.log("\nTOP REFERRERS");
  for (const t of top) console.log(Number(t.n), String(t.referrer).slice(0, 20));

  // Audit referral binds / bonuses
  const audits = await sql`
    select event_type, wallet, amount, meta, created_at
    from audit_logs
    where event_type ilike '%REF%'
       or event_type ilike '%BIND%'
       or (meta::text ilike '%referr%')
    order by created_at desc
    limit 40
  `;
  console.log("\nREF-ish AUDITS", audits.length);
  for (const a of audits.slice(0, 20)) {
    console.log(a.event_type, String(a.wallet || "").slice(0, 12), Number(a.amount || 0), String(a.created_at));
  }
} finally {
  await sql.end({ timeout: 5 });
}
