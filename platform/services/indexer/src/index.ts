import 'dotenv/config';

import { createDatabaseClient } from '@funrun/database';
import { createLogger } from '@funrun/logger';
import { createRedisClient } from '@funrun/redis';

import { IndexerWorker } from './worker.js';

const logger = createLogger('indexer');

async function main(): Promise<void> {
  const programId = process.env['PROGRAM_ID'];
  const rpcUrl    = process.env['SOLANA_RPC_PRIMARY'];
  const wsUrl     = process.env['SOLANA_WS_URL'];
  const dbUrl     = process.env['DATABASE_URL'];
  const redisUrl  = process.env['REDIS_URL'];

  if (!programId || !rpcUrl || !wsUrl || !dbUrl || !redisUrl) {
    logger.error('Missing required env vars: PROGRAM_ID, SOLANA_RPC_PRIMARY, SOLANA_WS_URL, DATABASE_URL, REDIS_URL');
    process.exit(1);
  }

  const db     = createDatabaseClient();
  const redis  = createRedisClient(redisUrl, { db: 0 }, logger);
  const pubsub = createRedisClient(redisUrl, { db: 1 }, logger);

  await db.$connect();
  logger.info('Database connected');

  const worker = new IndexerWorker({ db, redis, pubsub, logger, programId, rpcUrl, wsUrl });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutdown signal received');
    await worker.stop();
    await db.$disconnect();
    await redis.quit();
    await pubsub.quit();
    logger.info('Indexer shut down cleanly');
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

  await worker.start();
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
