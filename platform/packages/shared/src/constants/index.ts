// ─── Protocol constants (mirrors on-chain consts.rs) ─────────────────────────

export const PROTOCOL_VERSION = 2;

export const VIRTUAL_SOL_INITIAL = 30_000_000_000n; // 30 SOL in lamports
export const VIRTUAL_TOKEN_INITIAL = 1_073_000_191_000_000n; // raw token units (6 decimals)
export const K = VIRTUAL_SOL_INITIAL * VIRTUAL_TOKEN_INITIAL; // ≈ 3.219 × 10²⁵

export const TOTAL_SUPPLY = 1_000_000_000_000_000n; // 1B tokens (6 decimals)
export const BONDING_CURVE_SUPPLY = 800_000_000_000_000n; // 800M
export const LP_RESERVE_TOKENS = 200_000_000_000_000n; // 200M

export const GRADUATION_THRESHOLD_LAMPORTS = 85_000_000_000n; // 85 SOL
export const GRADUATION_DEX_FEE_LAMPORTS = 6_000_000_000n; // 6 SOL

export const DEFAULT_TRADING_FEE_BPS = 150; // 1.5%
export const MAX_TRADING_FEE_BPS = 500; // 5.0%
export const DEFAULT_CREATION_FEE_LAMPORTS = 20_000_000n; // 0.02 SOL
export const MAX_CREATION_FEE_LAMPORTS = 1_000_000_000n; // 1 SOL

export const CREATOR_FEE_PCT = 40;
export const REFERRER_FEE_PCT = 20;
export const TREASURY_FEE_PCT = 40;
export const TREASURY_FEE_NO_REFERRER_PCT = 60;

export const BASIS_POINTS_DENOMINATOR = 10_000;
export const FEE_PERCENT_DENOMINATOR = 100;

// ─── Solana program addresses ─────────────────────────────────────────────────

export const PROGRAM_IDS = {
  devnet: 'HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP',
  mainnet: '', // TBD on mainnet launch
} as const;

export const RAYDIUM_CPMM_PROGRAM_ID = 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C';
export const WSOL_MINT = 'So11111111111111111111111111111111111111112';

export const RAYDIUM_POOL_FEE = {
  mainnet: 'DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8',
  devnet: 'G11FVVnoEUBE4JKpFWXMiQ2Yn1g4pVu4c17dTFJDg6dN',
} as const;

export const RAYDIUM_AMM_CONFIG = {
  mainnet: 'D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2',
} as const;

// ─── Compute unit budgets (mirrors deploy_config.rs) ──────────────────────────

export const CU_BUDGETS = {
  CREATE_COIN: 200_000,
  BUY: 80_000,
  SELL: 80_000,
  COMPLETE_GRADUATION: 1_400_000,
  INITIATE_GRADUATION: 15_000,
  CLAIM_CREATOR_FEES: 20_000,
  CLAIM_REFERRER_FEES: 20_000,
  SWEEP_TREASURY: 20_000,
} as const;

// ─── Cache TTLs (milliseconds) ────────────────────────────────────────────────

export const CACHE_TTL = {
  COIN_STATE_MS: 3_000,
  USER_SESSION_MS: 15 * 60 * 1_000,
  USER_PORTFOLIO_MS: 5_000,
  ANALYTICS_TRENDING_MS: 10_000,
  ANALYTICS_LEADERBOARD_MS: 60_000,
  REFERRAL_LEADERBOARD_MS: 60_000,
} as const;

// ─── Rate limit defaults ──────────────────────────────────────────────────────

export const RATE_LIMITS = {
  TRADE: { max: 60, windowMs: 60_000 },
  COIN_CREATE: { max: 10, windowMs: 60_000 },
  MNEMONIC_REVEAL: { max: 5, windowMs: 60_000 },
  WITHDRAW: { max: 10, windowMs: 60_000 },
  COIN_READ: { max: 300, windowMs: 60_000 },
  ANALYTICS: { max: 100, windowMs: 60_000 },
  AUTH: { max: 20, windowMs: 60_000 },
  GLOBAL: { max: 1_000, windowMs: 60_000 },
} as const;

// ─── BullMQ queue names ───────────────────────────────────────────────────────

export const QUEUE_NAMES = {
  TRADE_EVENTS: 'trade-events',
  GRADUATION: 'graduation',
  NOTIFICATIONS: 'notifications',
  PUSH_NOTIFICATIONS: 'push-notifications',
  ANALYTICS: 'analytics',
  ADMIN_OPS: 'admin-ops',
  MAINTENANCE: 'maintenance',
  FAILED_JOBS: 'failed-jobs',
} as const;

// ─── Redis key patterns ───────────────────────────────────────────────────────

export const REDIS_KEYS = {
  coinState: (id: string) => `coin:${id}:state`,
  coinSubscribers: (id: string) => `coin:${id}:subscribers`,
  userSession: (id: string) => `user:${id}:session`,
  userPortfolio: (id: string) => `user:${id}:portfolio`,
  userRateLimit: (id: string, endpoint: string) => `user:${id}:rate:${endpoint}`,
  ipRateLimit: (ip: string, endpoint: string) => `ip:${ip}:rate:${endpoint}`,
  analyticsTrending: () => 'analytics:trending',
  analyticsVolume24h: () => 'analytics:volume:24h',
  referralLeaderboard: () => 'referral:leaderboard',
  wsCoinChannel: (id: string) => `ws:coin:${id}`,
  wsUserChannel: (id: string) => `ws:notify:${id}`,
  wsGlobalChannel: () => 'ws:global',
} as const;

// ─── Misc ─────────────────────────────────────────────────────────────────────

export const LAMPORTS_PER_SOL = 1_000_000_000n;
export const TOKEN_DECIMALS = 6;
export const SOLANA_COMMITMENT = 'confirmed' as const;
