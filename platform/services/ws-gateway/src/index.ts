import 'dotenv/config';

import { createDatabaseClient } from '@funrun/database';
import { createLogger } from '@funrun/logger';
import { createRedisClient } from '@funrun/redis';

import { buildContainer } from './container.js';
import { buildGatewayServers } from './server.js';

const logger = createLogger('ws-gateway');

async function main(): Promise<void> {
  // ─── Validate required env vars ─────────────────────────────────────────────

  const requiredEnv = ['DATABASE_URL', 'REDIS_URL', 'PRIVY_APP_ID', 'PRIVY_APP_SECRET'];
  const missing = requiredEnv.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.error({ missing }, 'Missing required environment variables');
    process.exit(1);
  }

  const redisUrl  = process.env['REDIS_URL']!;
  const privyId   = process.env['PRIVY_APP_ID']!;
  const privySecret = process.env['PRIVY_APP_SECRET']!;

  // ─── Create Redis clients ────────────────────────────────────────────────────
  // Three separate clients:
  //   cache:  for INCR (seq), ZADD (replay), GET/SET (general)
  //   pubsub: for SUBSCRIBE — must be in subscriber mode, cannot issue other commands
  //   health: for /readyz PING check (separate to avoid blocking pubsub)

  const cache  = createRedisClient(redisUrl, { db: 0 }, logger);
  const pubsub = createRedisClient(redisUrl, { db: 1 }, logger);
  const health = createRedisClient(redisUrl, { db: 0 }, logger);

  // ─── Database ────────────────────────────────────────────────────────────────

  const db = createDatabaseClient();
  await db.$connect();
  logger.info('Database connected');

  // ─── Privy token verifier ────────────────────────────────────────────────────
  // We import @privy-io/server-auth dynamically to match the pattern from Phase 8.2

  const { PrivyClient } = await import('@privy-io/server-auth');
  const privy = new PrivyClient(privyId, privySecret);

  const tokenVerifier = async (token: string) => {
    try {
      const claims = await privy.verifyAuthToken(token);
      const solanaAccount = claims.linkedAccounts?.find(
        (a) => a.type === 'wallet' && a.chainType === 'solana',
      );
      return {
        userId:        claims.userId,
        walletAddress: (solanaAccount as { address?: string })?.address ?? '',
      };
    } catch {
      return null;
    }
  };

  // ─── Build container ─────────────────────────────────────────────────────────

  const container = buildContainer({ db, cache, pubsub, logger, tokenVerifier });

  // ─── Build and start servers ──────────────────────────────────────────────────

  const servers = await buildGatewayServers(container, health);
  await servers.start();

  logger.info('WebSocket Gateway started');

  // ─── Graceful shutdown ───────────────────────────────────────────────────────

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutdown signal received');
    await servers.stop();
    await db.$disconnect();
    await cache.quit();
    await pubsub.quit();
    await health.quit();
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
