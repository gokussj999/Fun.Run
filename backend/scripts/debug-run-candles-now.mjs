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
const SOL_USD = Number(env.SOL_USD || 80);

try {
  const [c] = await sql`
    select reserve_sol, reserve_token, v_sol, v_tokens, market_cap
    from coins where id = ${RUN}
  `;
  const priceSol =
    (Number(c.reserve_sol) + Number(c.v_sol)) /
    (Number(c.reserve_token) + Number(c.v_tokens));
  console.log({
    reserve_sol: Number(c.reserve_sol),
    priceSol,
    priceUsd_fixed: priceSol * SOL_USD,
    mc: Number(c.market_cap),
  });

  const txs = await sql`
    select type, sol, tokens, created_at
    from transactions where coin_id = ${RUN}
    order by created_at desc limit 8
  `;
  for (const t of txs) {
    const sol = Number(t.sol);
    const tok = Number(t.tokens);
    console.log(t.type, "sol", sol, "tok", tok, "execUsd", (sol / tok) * SOL_USD, String(t.created_at));
  }

  const candles = await sql`
    select bucket_time, open, high, low, close, trades_count, volume_sol
    from candles where coin_id = ${RUN} and timeframe = '5m'
    order by bucket_time desc limit 10
  `;
  for (const row of candles) {
    const o = Number(row.open);
    const cl = Number(row.close);
    console.log(
      "5m",
      row.bucket_time,
      "O",
      o,
      "C",
      cl,
      cl >= o ? "GREEN" : "RED",
      "trades",
      row.trades_count,
      "drop%",
      (((cl - o) / o) * 100).toFixed(4)
    );
  }
} finally {
  await sql.end({ timeout: 5 });
}
