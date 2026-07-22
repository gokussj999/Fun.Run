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
    select id, symbol, market_cap, reserve_sol, reserve_token, v_sol, v_tokens,
           total_supply, curve_supply, curve_sold
    from coins where id = ${RUN}
  `;
  const priceSol =
    (Number(c.reserve_sol) + Number(c.v_sol)) /
    (Number(c.reserve_token) + Number(c.v_tokens));
  const priceUsd = priceSol * SOL_USD;
  const circ = Number(c.total_supply) - Number(c.reserve_token);
  console.log({
    symbol: c.symbol,
    mc_db: Number(c.market_cap),
    priceSol,
    priceUsd,
    mc_calc: priceUsd * circ,
    reserve_sol: Number(c.reserve_sol),
    reserve_token: Number(c.reserve_token),
    v_sol: Number(c.v_sol),
    v_tokens: Number(c.v_tokens),
    total: Number(c.total_supply),
    curve: Number(c.curve_supply),
    sold: Number(c.curve_sold),
  });

  const txs = await sql`
    select type, sol, tokens, wallet, created_at
    from transactions
    where coin_id = ${RUN} and upper(type) in ('BUY', 'SELL')
    order by created_at asc
  `;
  let buySol = 0;
  let sellSol = 0;
  let buyTok = 0;
  let sellTok = 0;
  for (const t of txs) {
    const sol = Number(t.sol);
    const tok = Number(t.tokens);
    if (String(t.type).toUpperCase() === "BUY") {
      buySol += sol;
      buyTok += tok;
    } else {
      sellSol += sol;
      sellTok += tok;
    }
  }
  console.log({
    txCount: txs.length,
    buySol,
    sellSol,
    buyTok,
    sellTok,
    netTok: buyTok - sellTok,
  });

  const holds = await sql`
    select wallet, tokens from holdings
    where coin_id = ${RUN} and tokens > 0
    order by tokens desc limit 15
  `;
  for (const h of holds) {
    const tok = Number(h.tokens);
    console.log({
      wallet: String(h.wallet).slice(0, 10),
      tokens: tok,
      valueUsd: tok * priceUsd,
    });
  }
} finally {
  await sql.end({ timeout: 5 });
}
