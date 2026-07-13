import './load-env.js';

import { createDatabaseClient } from '@funrun/database';
import { createLogger } from '@funrun/logger';
import { createRedisClient } from '@funrun/redis';

import { IndexerWorker } from './worker.js';
import { resolveRedisDependencyMode } from './config/redis-dependency.js';
import { resolveWorkerLeaderElection } from './config/indexer-hardening.js';
import { WorkerLeaderLock } from './background/leader-lock.js';

const logger = createLogger({ service: 'indexer' });

async function main(): Promise<void> {
  const programId = process.env['PROGRAM_ID'];
  const rpcUrl    = process.env['SOLANA_RPC_PRIMARY'];
  const wsUrl     = process.env['SOLANA_WS_URL'];
  const dbUrl     = process.env['DATABASE_URL'];
  const redisUrl  = process.env['REDIS_URL'];
  const fallbackRpc = process.env['SOLANA_RPC_FALLBACK'];

  if (!programId || !rpcUrl || !wsUrl || !dbUrl || !redisUrl) {
    logger.error('Missing required env vars: PROGRAM_ID, SOLANA_RPC_PRIMARY, SOLANA_WS_URL, DATABASE_URL, REDIS_URL');
    process.exit(1);
  }

  const redisDependencyMode = resolveRedisDependencyMode(process.env);
  const workerLeaderElection = resolveWorkerLeaderElection(process.env);
  logger.info({ redisDependencyMode, workerLeaderElection }, 'Indexer hardening configuration');

  const db     = createDatabaseClient({ url: dbUrl });
  const redis  = createRedisClient({ url: redisUrl, db: 0, logger, name: 'indexer-cache' });
  const pubsub = createRedisClient({ url: redisUrl, db: 1, logger, name: 'indexer-pubsub' });

  await db.$connect();
  logger.info('Database connected');

  const worker = new IndexerWorker({
    db,
    redis,
    pubsub,
    logger,
    programId,
    rpcUrl,
    wsUrl,
    ...(fallbackRpc ? { fallbackRpcUrl: fallbackRpc } : {}),
    redisDependencyMode,
  });

  const workerStops = new Map<string, () => void>([
    ['indexer', () => { void worker.stop(); }],
  ]);

  let leaderLock: WorkerLeaderLock | null = null;
  let started = false;

  const startWorker = (): void => {
    if (started) return;
    started = true;
    void worker.start();
  };

  const stopWorker = (): void => {
    if (!started) return;
    started = false;
    void worker.stop();
  };

  if (workerLeaderElection) {
    leaderLock = new WorkerLeaderLock(redis, logger);
    leaderLock.supervise('indexer', startWorker, stopWorker);
    logger.info('Indexer supervised via Redis leader election');
  } else {
    await worker.start();
    started = true;
    logger.warn('WORKER_LEADER_ELECTION=false — indexer runs on this pod unconditionally');
  }

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutdown signal received');
    if (leaderLock) {
      await leaderLock.shutdown(workerStops);
    } else {
      await worker.stop();
    }
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
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
