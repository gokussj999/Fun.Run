import { z } from 'zod';

// ─── Schema ───────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // Node
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  // API Gateway
  API_GATEWAY_PORT: z.coerce.number().int().min(1024).max(65535).default(3000),
  API_GATEWAY_HOST: z.string().default('0.0.0.0'),
  API_BASE_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().min(1),
  DATABASE_URL_REPLICA: z.string().optional(),
  DATABASE_POOL_MIN: z.coerce.number().int().min(1).default(2),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).default(10),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB_CACHE: z.coerce.number().int().min(0).max(15).default(0),
  REDIS_DB_PUBSUB: z.coerce.number().int().min(0).max(15).default(1),
  REDIS_DB_BULLMQ: z.coerce.number().int().min(0).max(15).default(2),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.coerce.number().int().default(900),
  JWT_REFRESH_TTL: z.coerce.number().int().default(604_800),

  // Solana
  SOLANA_RPC_PRIMARY: z.string().url(),
  SOLANA_RPC_FALLBACK: z.string().url().optional(),
  SOLANA_NETWORK: z.enum(['mainnet-beta', 'devnet', 'testnet']).default('devnet'),
  PROGRAM_ID: z.string().length(44),

  // Encryption
  MNEMONIC_ENCRYPTION_KEY: z.string().min(32),
  TREASURY_KEYPAIR_PATH: z.string().optional(),

  // Privy
  PRIVY_APP_ID: z.string().optional(),
  PRIVY_APP_SECRET: z.string().optional(),
  PRIVY_VERIFICATION_KEY: z.string().optional(),

  // Fees
  TRADING_FEE_BPS: z.coerce.number().int().min(0).max(500).default(150),
  CREATION_FEE_LAMPORTS: z.coerce.number().int().default(20_000_000),
  CREATOR_FEE_PCT: z.coerce.number().int().default(40),
  REFERRER_FEE_PCT: z.coerce.number().int().default(20),
  TREASURY_FEE_PCT: z.coerce.number().int().default(40),

  // Monitoring
  METRICS_PORT: z.coerce.number().int().default(9090),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  SENTRY_DSN: z.string().optional(),

  // Notifications
  FCM_SERVER_KEY: z.string().optional(),
  APNS_KEY_ID: z.string().optional(),
  APNS_TEAM_ID: z.string().optional(),
  APNS_BUNDLE_ID: z.string().default('com.funrun.app'),
});

export type AppConfig = z.infer<typeof envSchema>;

// ─── Loader ───────────────────────────────────────────────────────────────────

let _config: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (_config) return _config;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${missing}`);
  }

  _config = result.data;
  return _config;
}

export function getConfig(): AppConfig {
  if (!_config) {
    throw new Error('Config not loaded. Call loadConfig() at application startup.');
  }
  return _config;
}

// Convenience re-export of the schema for tests that need partial config objects.
export { envSchema };
