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
const RUN = "7cc0f755e5a5475ca8345a062d5c2475";
const SOL = Number(env.SOL_USD || 80);

try {
  const [c] = await sql`
    select market_cap, ath_market_cap, reserve_sol, reserve_token, v_sol, v_tokens
    from coins where id = ${RUN}
  `;
  const price =
    ((Number(c.reserve_sol) + Number(c.v_sol)) /
      (Number(c.reserve_token) + Number(c.v_tokens))) *
    SOL;
  const [h] = await sql`
    select tokens from holdings where coin_id = ${RUN} order by tokens desc limit 1
  `;
  const holdTok = Number(h?.tokens || 0);
  console.log({
    mc: Number(c.market_cap),
    ath_before: Number(c.ath_market_cap),
    price,
    holdTok,
    holdUsd: holdTok * price,
  });

  await sql`
    update coins set ath_market_cap = ${Number(c.market_cap)} where id = ${RUN}
  `;
  console.log("ath reset to real mc");
} finally {
  await sql.end({ timeout: 5 });
}
