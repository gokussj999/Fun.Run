import type { PrismaClient } from '@funrun/database';
import { TIMEFRAMES, TIMEFRAME_MS, TIMEFRAME_DB_VALUE } from '../constants.js';

type TxClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

function getBucketStart(nowMs: number, intervalMs: number): bigint {
  return BigInt(Math.floor(nowMs / intervalMs) * intervalMs);
}

// Raw SQL: high = GREATEST(high, price), low = LEAST(low, price).
// Prisma ORM cannot express GREATEST/LEAST in update clauses.
// TIMEFRAME_DB_VALUE maps Prisma enum name → PostgreSQL stored value (e.g. m1 → '1m').
export async function upsertCandles(
  tx: TxClient,
  params: {
    coinId: string;
    pricePerToken: number;
    volumeLamports: bigint;
    nowMs: number;
  },
): Promise<void> {
  const { coinId, pricePerToken, volumeLamports, nowMs } = params;
  const volumeStr = volumeLamports.toString();

  for (const tf of TIMEFRAMES) {
    const intervalMs = TIMEFRAME_MS[tf]!;
    const openTime = getBucketStart(nowMs, intervalMs).toString();
    const dbTimeframe = TIMEFRAME_DB_VALUE[tf];

    await tx.$executeRaw`
      INSERT INTO candles (id, coin_id, timeframe, open_time, open, high, low, close, volume, trades, updated_at)
      VALUES (
        gen_random_uuid()::text,
        ${coinId},
        ${dbTimeframe}::"Timeframe",
        ${openTime}::bigint,
        ${pricePerToken}::numeric,
        ${pricePerToken}::numeric,
        ${pricePerToken}::numeric,
        ${pricePerToken}::numeric,
        ${volumeStr}::numeric,
        1,
        NOW()
      )
      ON CONFLICT (coin_id, timeframe, open_time) DO UPDATE SET
        high       = GREATEST(candles.high, ${pricePerToken}::numeric),
        low        = LEAST(candles.low, ${pricePerToken}::numeric),
        close      = ${pricePerToken}::numeric,
        volume     = candles.volume + ${volumeStr}::numeric,
        trades     = candles.trades + 1,
        updated_at = NOW()
    `;
  }
}
