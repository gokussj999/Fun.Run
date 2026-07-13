import 'dotenv/config';

import { createDatabaseClient } from '@funrun/database';
import { createLogger } from '@funrun/logger';
import { createRedisClient } from '@funrun/redis';
import { extractSolanaWallet } from '@funrun/shared';

import { buildContainer } from './container.js';
import { buildGatewayServers } from './server.js';
import { resolveRedisDependencyMode } from './config/redis-dependency.js';

const logger = createLogger({ service: 'ws-gateway' });

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

  const cache  = createRedisClient({ url: redisUrl, db: 0, logger, name: 'ws-cache' });
  const pubsub = createRedisClient({ url: redisUrl, db: 1, logger, name: 'ws-pubsub' });
  const health = createRedisClient({ url: redisUrl, db: 0, logger, name: 'ws-health' });

  // ─── Database ────────────────────────────────────────────────────────────────

  const db = createDatabaseClient({ url: process.env['DATABASE_URL']! });
  await db.$connect();
  logger.info('Database connected');

  // ─── Privy token verifier ────────────────────────────────────────────────────
  // We import @privy-io/server-auth dynamically to match the pattern from Phase 8.2

  const redisDependencyMode = resolveRedisDependencyMode(process.env);
  logger.info({ redisDependencyMode }, 'WS Gateway hardening configuration');

  const { PrivyClient } = await import('@privy-io/server-auth');
  const privy = new PrivyClient(privyId, privySecret);

  interface LinkedAccount {
    type: string;
    chainType?: string;
    walletClientType?: string;
    address?: string;
  }

  const tokenVerifier = async (token: string) => {
    try {
      const claims = await privy.verifyAuthToken(token);
      const linkedAccounts = (
        claims as unknown as { linkedAccounts?: LinkedAccount[] }
      ).linkedAccounts ?? [];
      const walletAddress = extractSolanaWallet(linkedAccounts);
      return {
        userId: claims.userId,
        ...(walletAddress ? { walletAddress } : {}),
      };
    } catch {
      return null;
    }
  };

  const container = buildContainer({
    db, cache, pubsub, logger, tokenVerifier, redisDependencyMode,
  });

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
