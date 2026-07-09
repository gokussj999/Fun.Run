import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

const coins = await sql`select id, name, symbol, created_at, v_sol, v_tokens from coins order by created_at desc limit 5`;
console.log('COINS:', JSON.stringify(coins, null, 2));

if (coins.length) {
  const coinId = coins[0].id;
  const candles = await sql`select coin_id, timeframe, bucket_time, open, high, low, close, volume_sol, trades_count from candles where coin_id = ${coinId} order by bucket_time desc limit 5`;
  console.log('CANDLES for', coinId, JSON.stringify(candles, null, 2));

  const txs = await sql`select created_at, sol, tokens, type from transactions where coin_id = ${coinId} order by created_at desc limit 5`;
  console.log('TX for', coinId, JSON.stringify(txs, null, 2));

  const candleCount = await sql`select timeframe, count(*) from candles where coin_id = ${coinId} group by timeframe`;
  console.log('CANDLE COUNTS', JSON.stringify(candleCount, null, 2));
}

await sql.end();
