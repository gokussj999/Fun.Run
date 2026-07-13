export {
  DEFAULT_TRADING_FEE_BPS,
  MAX_TRADING_FEE_BPS,
  GRADUATION_THRESHOLD_LAMPORTS,
  GRADUATION_DEX_FEE_LAMPORTS,
  CREATOR_FEE_PCT,
  REFERRER_FEE_PCT,
  TREASURY_FEE_PCT,
  TREASURY_FEE_NO_REFERRER_PCT,
  FEE_PERCENT_DENOMINATOR,
  VIRTUAL_SOL_INITIAL,
  VIRTUAL_TOKEN_INITIAL,
  RATE_LIMITS,
  REDIS_KEYS,
} from '@funrun/shared';

// ─── Service ports ────────────────────────────────────────────────────────────

export const HTTP_PORT = Number(process.env['PORT'] ?? 3003);

// ─── Idempotency ──────────────────────────────────────────────────────────────

export const IDEMPOTENCY_TTL_SECONDS = Number(
  process.env['IDEMPOTENCY_TTL_SECONDS'] ?? 86_400,
);
export const IDEMPOTENCY_KEY_MIN_LENGTH = 8;
export const IDEMPOTENCY_KEY_MAX_LENGTH = 128;

// ─── Latency warning threshold ────────────────────────────────────────────────

export const LATENCY_WARN_MS = 500;

// ─── Quote cache ──────────────────────────────────────────────────────────────

// TTL for cached quote results. Bonding curve state changes only on trades,
// so 3 s is fresh enough while giving meaningful burst-traffic relief.
export const QUOTE_CACHE_TTL_MS = Number(
  process.env['QUOTE_CACHE_TTL_MS'] ?? 3_000,
);

// ─── Redis key patterns ───────────────────────────────────────────────────────

export const RK = {
  idempotency: (key: string) => `idempotency:trading:${key}`,
  price: (mint: string) => `price:${mint}`,
  quote: (coinId: string, direction: string, amountIn: bigint) =>
    `quote:${coinId}:${direction}:${amountIn.toString()}`,
} as const;

// ─── Pub/sub channels ─────────────────────────────────────────────────────────

export const PUBSUB = {
  // Per-coin price stream — subscribed by chart/ticker consumers.
  price: (mint: string) => `price:${mint}`,
  // Global trade firehose — subscribed by activity feeds.
  allTrades: () => 'events:all_trades',
  // Per-coin candle updates — subscribed by charting consumers.
  candles: (coinId: string) => `events:candles:${coinId}`,
  // Per-coin state updates — subscribed by coin-detail page consumers.
  coin: (coinId: string) => `events:coin:${coinId}`,
} as const;

// ─── Candle timeframes (ms) ───────────────────────────────────────────────────

export const TIMEFRAME_MS: Record<string, number> = {
  m1:  60_000,
  m5:  300_000,
  m15: 900_000,
  h1:  3_600_000,
  h4:  14_400_000,
  d1:  86_400_000,
} as const;

export const TIMEFRAMES = ['m1', 'm5', 'm15', 'h1', 'h4', 'd1'] as const;
export type TF = (typeof TIMEFRAMES)[number];

// Maps Prisma enum names → PostgreSQL enum values (used in $executeRaw)
export const TIMEFRAME_DB_VALUE: Record<TF, string> = {
  m1:  '1m',
  m5:  '5m',
  m15: '15m',
  h1:  '1h',
  h4:  '4h',
  d1:  '1d',
} as const;

// ─── Trading mode (Sprint 1 Task 5) ───────────────────────────────────────────

export {
  TRADING_MODES,
  DEFAULT_TRADING_MODE,
  type TradingMode,
  resolveTradingMode,
} from './config/trading-mode.js';
