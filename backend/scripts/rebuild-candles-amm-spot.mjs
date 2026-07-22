/**
 * Rebuild ALL coin candles from AMM spot after each trade (never exec-average).
 * Buy ⇒ spot up ⇒ green vs prev close. Sell ⇒ spot down ⇒ red.
 *
 *   node backend/scripts/rebuild-candles-amm-spot.mjs
 *   node backend/scripts/rebuild-candles-amm-spot.mjs <coinId>
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

const SOL_USD = Math.max(1, Number(env.SOL_USD || 80));
const FEE_PCT = Math.max(0, Number(env.FEE_PCT || 1));
const TIMEFRAMES = [
  ["5m", 300_000],
  ["15m", 900_000],
  ["1h", 3_600_000],
  ["4h", 14_400_000],
  ["1d", 86_400_000],
  ["1w", 604_800_000],
  ["1m", 2_592_000_000],
];

const sql = postgres(env.DATABASE_URL, { ssl: "require", max: 1 });
const onlyId = process.argv[2] || "";

function safeNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function spotUsd(solReserve, tokenReserve, vSol, vTokens) {
  const priceSol =
    (Math.max(0, solReserve) + Math.max(1e-9, vSol)) /
    (Math.max(1, tokenReserve) + Math.max(1, vTokens));
  return Math.max(1e-12, priceSol * SOL_USD);
}

async function rebuildCoin(coin) {
  const id = coin.id;
  const curve = Math.max(1, safeNum(coin.curve_supply, 1_000_000_000));
  const vSol = Math.max(1e-9, safeNum(coin.v_sol, 15));
  const vTokens = Math.max(1, safeNum(coin.v_tokens, curve * 0.3));

  const txs = await sql`
    select type, sol, tokens, created_at
    from transactions
    where coin_id = ${id} and upper(type) in ('BUY', 'SELL')
    order by created_at asc
  `;

  await sql`delete from candles where coin_id = ${id}`;
  if (!txs.length) {
    console.log(coin.symbol, id.slice(0, 8), "no txs");
    return;
  }

  let solReserve = 0;
  let tokenReserve = curve;
  const points = []; // { ts, px, sol, side }

  for (const tx of txs) {
    const side = String(tx.type || "").toUpperCase();
    const sol = Math.max(0, safeNum(tx.sol, 0));
    const tokens = Math.max(0, safeNum(tx.tokens, 0));
    const ts = new Date(tx.created_at).getTime();
    if (!Number.isFinite(ts) || ts <= 0) continue;

    const x = solReserve + vSol;
    const y = tokenReserve + vTokens;
    const k = x * y;

    if (side === "BUY") {
      const net = Math.max(0, sol * (1 - FEE_PCT / 100));
      if (net <= 0) continue;
      const newX = x + net;
      const newY = k / newX;
      const tokensOut = Math.max(0, y - newY);
      solReserve += net;
      tokenReserve = Math.max(1, tokenReserve - tokensOut);
    } else {
      let tokensIn = tokens;
      if (!(tokensIn > 0) && sol > 0) {
        const gross = sol / Math.max(1e-9, 1 - FEE_PCT / 100);
        const newX = Math.max(1e-12, x - gross);
        const newY = k / newX;
        tokensIn = Math.max(0, newY - y);
      }
      if (!(tokensIn > 0)) continue;
      const newY = y + tokensIn;
      const newX = k / newY;
      const grossSolOut = Math.max(0, x - newX);
      solReserve = Math.max(0, solReserve - grossSolOut);
      tokenReserve += tokensIn;
    }

    const px = spotUsd(solReserve, tokenReserve, vSol, vTokens);
    points.push({ ts, px, sol, side });
  }

  for (const [tf, ms] of TIMEFRAMES) {
    const map = new Map();
    let carry = null;
    for (const pt of points) {
      const bucket = Math.floor(pt.ts / ms) * ms;
      const prev = map.get(bucket);
      if (!prev) {
        const open = carry != null ? carry : pt.px;
        map.set(bucket, {
          open,
          high: Math.max(open, pt.px),
          low: Math.min(open, pt.px),
          close: pt.px,
          vol: pt.sol,
          trades: 1,
        });
      } else {
        prev.high = Math.max(prev.high, pt.px);
        prev.low = Math.min(prev.low, pt.px);
        prev.close = pt.px;
        prev.vol += pt.sol;
        prev.trades += 1;
      }
      carry = pt.px;
    }

    for (const [bucket, row] of map) {
      await sql`
        insert into candles (
          coin_id, timeframe, bucket_time,
          open, high, low, close,
          volume_sol, trades_count, updated_at
        ) values (
          ${id}, ${tf}, ${bucket},
          ${row.open}, ${row.high}, ${row.low}, ${row.close},
          ${row.vol}, ${row.trades}, now()
        )
      `;
    }
  }

  // sanity: last point direction vs last trade
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  let ok = true;
  if (last && prev) {
    if (last.side === "BUY" && !(last.px >= prev.px - 1e-18)) ok = false;
    if (last.side === "SELL" && !(last.px <= prev.px + 1e-18)) ok = false;
  }
  console.log(
    coin.symbol,
    "txs",
    points.length,
    "last",
    last?.side,
    "px",
    last?.px,
    ok ? "OK" : "WARN_DIR"
  );
}

try {
  const coins = onlyId
    ? await sql`select id, symbol, curve_supply, v_sol, v_tokens from coins where id = ${onlyId}`
    : await sql`select id, symbol, curve_supply, v_sol, v_tokens from coins order by created_at asc`;

  for (const c of coins) await rebuildCoin(c);
} finally {
  await sql.end({ timeout: 5 });
}
