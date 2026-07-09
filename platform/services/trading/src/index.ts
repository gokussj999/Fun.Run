import 'dotenv/config';

import { createDatabaseClient } from '@funrun/database';
import { createLogger } from '@funrun/logger';
import { createRedisClient } from '@funrun/redis';

import { IpGuard } from './auth/ip-guard.js';
import { TradingAuthVerifier } from './auth/verifier.js';
import { TradeEventPublisher } from './events/publisher.js';
import { TradeLogger } from './logger/trade.logger.js';
import { IdempotencyStore } from './idempotency/store.js';
import { TradeExecutor } from './trading/executor.js';
import { buildTradingServer } from './server.js';

const logger = createLogger({ service: 'trading' });

async function main(): Promise<void> {
  // ── Env validation ───────────────────────────────────────────────────────────
  const required = ['DATABASE_URL', 'REDIS_URL', 'PRIVY_APP_ID', 'PRIVY_APP_SECRET'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.error({ missing }, 'Missing required environment variables');
    process.exit(1);
  }

  const redisUrl    = process.env['REDIS_URL']!;
  const privyAppId  = process.env['PRIVY_APP_ID']!;
  const privySecret = process.env['PRIVY_APP_SECRET']!;

  // ── Redis ────────────────────────────────────────────────────────────────────
  const redis = createRedisClient({ url: redisUrl, logger, name: 'trading' });
  await redis.connect();

  // ── Database ─────────────────────────────────────────────────────────────────
  const db = createDatabaseClient();
  await db.$connect();
  logger.info('Database connected');

  // ── Privy ────────────────────────────────────────────────────────────────────
  const { PrivyClient } = await import('@privy-io/server-auth');
  const privy = new PrivyClient(privyAppId, privySecret);

  // ── Service composition ───────────────────────────────────────────────────────
  const ipGuard     = new IpGuard(redis, logger);
  const authVerifier = new TradingAuthVerifier(privy, db, ipGuard, logger);
  const publisher   = new TradeEventPublisher(redis, logger);
  const tradeLogger = new TradeLogger(logger);
  const idempotency = new IdempotencyStore(redis, logger);
  const executor    = new TradeExecutor(db, publisher, tradeLogger, logger);

  const server = buildTradingServer({
    db,
    redis,
    executor,
    idempotency,
    tradeLogger,
    logger,
    verifyToken: (token, ip) => authVerifier.verify(token, ip),
  });

  await server.start();
  logger.info('Trading service ready');

  // ── Graceful shutdown ────────────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutdown signal received');
    await server.stop();
    await db.$disconnect();
    await redis.quit();
    logger.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('SIGINT',  () => { void shutdown('SIGINT'); });

  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
    process.exit(1);
  });
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
