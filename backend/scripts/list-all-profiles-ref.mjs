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

try {
  const all = await sql`
    select wallet, referrer, referral_code, referral_count, run_tokens, created_at
    from profiles
    order by created_at asc
  `;
  console.log("ALL PROFILES", all.length);
  for (const p of all) {
    console.log({
      w: String(p.wallet).slice(0, 12),
      ref: p.referrer ? String(p.referrer).slice(0, 12) : "(none)",
      code: p.referral_code,
      count: Number(p.referral_count || 0),
      runTok: Number(p.run_tokens || 0),
      at: String(p.created_at),
    });
  }
} finally {
  await sql.end({ timeout: 5 });
}
