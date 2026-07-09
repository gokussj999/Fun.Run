/**
 * Development environment overrides.
 * These are NOT runtime configs — they're reference documentation.
 * Runtime config comes from loadConfig() in @funrun/config.
 */
export const developmentConfig = {
  logLevel: 'debug',
  logPretty: true,
  databasePoolMin: 1,
  databasePoolMax: 5,
  redisTtlMultiplier: 0.1, // faster cache expiry in dev for easier testing
  solanaNetwork: 'devnet' as const,
  rateLimits: {
    tradeMax: 600, // 10× looser in dev
    globalMax: 10_000,
  },
} as const;
