/**
 * Production environment reference.
 * Runtime config comes from loadConfig() in @funrun/config.
 */
export const productionConfig = {
  logLevel: 'info',
  logPretty: false,
  databasePoolMin: 2,
  databasePoolMax: 50,
  redisTtlMultiplier: 1,
  solanaNetwork: 'mainnet-beta' as const,
  rateLimits: {
    tradeMax: 60,
    globalMax: 1_000,
  },
} as const;
