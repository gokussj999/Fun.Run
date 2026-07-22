/**
 * Reset RUN bonding curve to REAL state by replaying BUY/SELL txs.
 * Fake MC/liquidity boost is display-only on coin page after this.
 *
 *   node backend/scripts/reset-run-curve-real.mjs
 *   node backend/scripts/reset-run-curve-real.mjs --apply
 */
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

const RUN = "7cc0f755e5a5475ca8345a062d5c2475";
const SOL_USD = Math.max(1, Number(env.SOL_USD || 80));
const FEE_PCT = Math.max(0, Number(env.FEE_PCT || 1));
const apply = process.argv.includes("--apply");

const TOTAL = 10_000_000_000;
const CURVE = 3_000_000_000;
const V_SOL = 30;
const V_TOKENS = 60_000_000;

const sql = postgres(env.DATABASE_URL, { ssl: "require", max: 1 });

function safeNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function pricing(solReserve, tokenReserve) {
  const priceSol = (solReserve + V_SOL) / (tokenReserve + V_TOKENS);
  const priceUsd = priceSol * SOL_USD;
  const circulating = Math.max(0, TOTAL - tokenReserve);
  return { priceSol, priceUsd, mcUsd: priceUsd * circulating };
}

try {
  const [before] = await sql`
    select reserve_sol, reserve_token, curve_sold, market_cap, v_sol, v_tokens, volume_sol
    from coins where id = ${RUN}
  `;
  if (!before) {
    console.error("RUN not found");
    process.exit(1);
  }

  const txs = await sql`
    select type, sol, tokens
    from transactions
    where coin_id = ${RUN} and upper(type) in ('BUY', 'SELL')
    order by created_at asc
  `;

  let solReserve = 0;
  let tokenReserve = CURVE;
  let curveSold = 0;
  let volumeSol = 0;

  for (const tx of txs) {
    const side = String(tx.type || "").toUpperCase();
    const sol = Math.max(0, safeNum(tx.sol, 0));
    const tokens = Math.max(0, safeNum(tx.tokens, 0));
    volumeSol += sol;

    const x = solReserve + V_SOL;
    const y = tokenReserve + V_TOKENS;
    const k = x * y;

    if (side === "BUY") {
      const fee = sol * (FEE_PCT / 100);
      const net = Math.max(0, sol - fee);
      if (net <= 0) continue;
      const newX = x + net;
      const newY = k / newX;
      const tokensOut = Math.max(0, y - newY);
      solReserve += net;
      tokenReserve = Math.max(1, tokenReserve - tokensOut);
      curveSold = Math.min(CURVE, curveSold + tokensOut);
    } else {
      // Prefer recorded token amount; fall back to inverting from sol if needed
      let tokensIn = tokens;
      if (!(tokensIn > 0) && sol > 0) {
        // sol is net out after fee ≈ gross * (1 - feePct/100)
        const gross = sol / Math.max(1e-9, 1 - FEE_PCT / 100);
        const newX = Math.max(1e-12, x - gross);
        const newY = k / newX;
        tokensIn = Math.max(0, newY - y);
      }
      if (!(tokensIn > 0)) continue;
      const newY = y + tokensIn;
      const newX = k / newY;
      const grossSolOut = Math.max(0, x - newX);
      const fee = grossSolOut * (FEE_PCT / 100);
      const netSolOut = Math.max(0, grossSolOut - fee);
      // Use curve math amounts (ignore slight tx rounding drift)
      solReserve = Math.max(0, solReserve - grossSolOut);
      tokenReserve += tokensIn;
      curveSold = Math.max(0, curveSold - tokensIn);
      void netSolOut;
    }
  }

  const after = pricing(solReserve, tokenReserve);

  console.log({
    apply,
    txCount: txs.length,
    before: {
      reserve_sol: Number(before.reserve_sol),
      reserve_token: Number(before.reserve_token),
      curve_sold: Number(before.curve_sold),
      market_cap: Number(before.market_cap),
    },
    after: {
      reserve_sol: solReserve,
      reserve_token: tokenReserve,
      curve_sold: curveSold,
      volume_sol: volumeSol,
      ...after,
    },
  });

  if (!apply) {
    console.log("dry-run only (pass --apply to write)");
  } else {
    await sql`
      update coins set
        reserve_sol = ${solReserve},
        reserve_token = ${tokenReserve},
        curve_sold = ${curveSold},
        curve_supply = ${CURVE},
        total_supply = ${TOTAL},
        v_sol = ${V_SOL},
        v_tokens = ${V_TOKENS},
        volume_sol = ${volumeSol},
        market_cap = ${after.mcUsd},
        last_price = ${after.priceSol},
        ath_market_cap = greatest(coalesce(ath_market_cap, 0), ${after.mcUsd})
      where id = ${RUN}
    `;
    console.log("updated RUN curve → real trade state");
  }
} finally {
  await sql.end({ timeout: 5 });
}
