/**
 * Rebuild candle OHLC from transactions using fixed SOL_USD
 * so buy/sell direction is not corrupted by live FX.
 *
 *   node backend/scripts/rebuild-candles-from-txs.mjs [coinId]
 *   node backend/scripts/rebuild-candles-from-txs.mjs --all
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const SOL_USD = Math.max(1, Number(env.SOL_USD || 80));
const TIMEFRAMES = [
  ["5m", 300_000],
  ["15m", 900_000],
  ["1h", 3_600_000],
  ["4h", 14_400_000],
  ["1d", 86_400_000],
  ["1w", 604_800_000],
  ["1m", 2_592_000_000],
];

const arg = process.argv[2] || "";
const sql = postgres(env.DATABASE_URL, { ssl: "require", max: 1 });

function safeNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

async function rebuildCoin(coinId) {
  const txs = await sql`
    select type, sol, tokens, created_at
    from transactions
    where coin_id = ${coinId}
      and upper(type) in ('BUY', 'SELL')
    order by created_at asc
  `;

  await sql`delete from candles where coin_id = ${coinId}`;

  if (!txs.length) {
    console.log(coinId, "no txs — candles cleared");
    return;
  }

  for (const [tf, ms] of TIMEFRAMES) {
    const map = new Map();
    let carry = null;

    for (const tx of txs) {
      const ts = new Date(tx.created_at).getTime();
      if (!Number.isFinite(ts) || ts <= 0) continue;
      const sol = Math.max(0, safeNum(tx.sol, 0));
      const tokens = Math.max(0, safeNum(tx.tokens, 0));
      if (!(sol > 0 && tokens > 0)) continue;

      let px = (sol / tokens) * SOL_USD;
      const bucket = Math.floor(ts / ms) * ms;
      const prev = map.get(bucket);
      if (!prev) {
        const open = carry != null ? carry : px;
        map.set(bucket, {
          open,
          high: Math.max(open, px),
          low: Math.min(open, px),
          close: px,
          vol: sol,
          trades: 1,
        });
      } else {
        prev.high = Math.max(prev.high, px);
        prev.low = Math.min(prev.low, px);
        prev.close = px;
        prev.vol += sol;
        prev.trades += 1;
      }
      carry = px;
    }

    for (const [bucket, row] of map) {
      await sql`
        insert into candles (
          coin_id, timeframe, bucket_time,
          open, high, low, close,
          volume_sol, trades_count, updated_at
        )
        values (
          ${coinId}, ${tf}, ${bucket},
          ${row.open}, ${row.high}, ${row.low}, ${row.close},
          ${row.vol}, ${row.trades}, now()
        )
      `;
    }
  }

  console.log(coinId, "rebuilt from", txs.length, "txs @ SOL_USD", SOL_USD);
}

try {
  if (arg === "--all") {
    const coins = await sql`select id, symbol from coins order by created_at desc`;
    for (const c of coins) {
      await rebuildCoin(c.id);
      console.log(" ", c.symbol);
    }
  } else {
    const id =
      arg ||
      (
        await sql`
          select id from coins where upper(symbol) = 'MEME' order by created_at desc limit 1
        `
      )?.[0]?.id;
    if (!id) {
      console.error("coin not found");
      process.exit(1);
    }
    await rebuildCoin(id);
  }
} finally {
  await sql.end({ timeout: 5 });
}
