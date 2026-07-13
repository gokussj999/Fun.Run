import type { PrismaClient } from '@funrun/database';

import { ALL_TIMEFRAMES, TIMEFRAME_MS } from '../types.js';
import type { CandleUpsertInput, Timeframe } from '../types.js';

// Prisma timeframe enum mapping
const TF_MAP: Record<Timeframe, string> = {
  '1m': '1m', '5m': '5m', '15m': '15m',
  '1h': '1h', '4h': '4h', '1d': '1d',
} as const;

/**
 * Compute the open-time bucket for a given timestamp and timeframe.
 * The bucket is the start of the candle period containing the timestamp.
 */
export function getCandleBucket(timestampMs: number, timeframe: Timeframe): bigint {
  const periodMs = TIMEFRAME_MS[timeframe];
  return BigInt(Math.floor(timestampMs / periodMs) * periodMs);
}

/**
 * Compute the price from virtual reserves.
 * price = virtualSolReserves / virtualTokenReserves (as Decimal string)
 * All arithmetic uses BigInt to avoid floating-point precision loss.
 * We use 15 decimal places of precision matching the Prisma schema.
 */
export function computePrice(virtualSolReserves: bigint, virtualTokenReserves: bigint): string {
  if (virtualTokenReserves === 0n) return '0';
  // Multiply by 10^15 to preserve precision, then format
  const scaled = (virtualSolReserves * 10n ** 15n) / virtualTokenReserves;
  const str = scaled.toString().padStart(16, '0');
  const intPart = str.slice(0, -15) || '0';
  const fracPart = str.slice(-15);
  return `${intPart}.${fracPart}`;
}

/**
 * Upsert OHLCV candles for all 6 timeframes after a trade.
 * Uses a single DB transaction for atomicity.
 *
 * Upsert logic:
 *   ON CONFLICT (coinId, timeframe, openTime):
 *     high = MAX(existing.high, new.price)
 *     low  = MIN(existing.low, new.price)
 *     close = new.price (always the latest trade in this bucket)
 *     volume += new.volume
 *     trades += 1
 *
 * open is set only on INSERT (first trade in the bucket).
 */
export async function upsertCandles(
  db: PrismaClient,
  coinId: string,
  blockTimeMs: number,
  price: string,
  volumeLamports: bigint,
): Promise<void> {
  // Build upsert inputs for all 6 timeframes
  const inputs: CandleUpsertInput[] = ALL_TIMEFRAMES.map((tf) => ({
    coinId,
    timeframe: tf,
    openTime: getCandleBucket(blockTimeMs, tf),
    price,
    volumeLamports,
    slot: 0n,
  }));

  // Execute all upserts using the provided db/tx client directly
  // (caller is already inside a $transaction, so we cannot nest another one)
  await Promise.all(
    inputs.map((input) =>
      (db.$queryRaw as Function)`
        INSERT INTO "funrun_platform"."candles" (id, coin_id, timeframe, open_time, open, high, low, close, volume, trades, updated_at)
        VALUES (
          gen_random_uuid(),
          ${input.coinId},
          ${TF_MAP[input.timeframe]}::"funrun_platform"."Timeframe",
          ${input.openTime},
          ${input.price}::decimal,
          ${input.price}::decimal,
          ${input.price}::decimal,
          ${input.price}::decimal,
          ${input.volumeLamports}::decimal,
          1,
          NOW()
        )
        ON CONFLICT (coin_id, timeframe, open_time) DO UPDATE SET
          high       = GREATEST("funrun_platform"."candles".high, ${input.price}::decimal),
          low        = LEAST("funrun_platform"."candles".low, ${input.price}::decimal),
          close      = ${input.price}::decimal,
          volume     = "funrun_platform"."candles".volume + ${input.volumeLamports}::decimal,
          trades     = "funrun_platform"."candles".trades + 1,
          updated_at = NOW()
      `
    ),
  );
}
