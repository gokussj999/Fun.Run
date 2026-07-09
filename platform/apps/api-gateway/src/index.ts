import { createDatabaseClient } from '@funrun/database';
import { loadConfig } from '@funrun/config';
import { createLogger } from '@funrun/logger';
import { createRedisClient } from '@funrun/redis';

import { buildApp } from './app.js';
import { setContainer, resetContainer } from './container.js';

async function main(): Promise<void> {
  // 1. Load + validate environment
  const config = loadConfig();

  // 2. Create logger
  const logger = createLogger({
    service: 'api-gateway',
    level: config.LOG_LEVEL,
  });

  logger.info({ env: config.NODE_ENV, network: config.SOLANA_NETWORK }, 'Starting api-gateway');

  // 3. Create Redis clients (cache, pub/sub, BullMQ — separate DBs)
  const redisCacheClient = createRedisClient({
    url: config.REDIS_URL,
    password: config.REDIS_PASSWORD,
    db: config.REDIS_DB_CACHE,
    logger,
    name: 'redis-cache',
  });

  const redisPubSubClient = createRedisClient({
    url: config.REDIS_URL,
    password: config.REDIS_PASSWORD,
    db: config.REDIS_DB_PUBSUB,
    logger,
    name: 'redis-pubsub',
  });

  const redisBullMQClient = createRedisClient({
    url: config.REDIS_URL,
    password: config.REDIS_PASSWORD,
    db: config.REDIS_DB_BULLMQ,
    logger,
    name: 'redis-bullmq',
  });

  // 4. Create database client
  const db = createDatabaseClient({
    url: config.DATABASE_URL,
    logger,
    logQueries: config.NODE_ENV === 'development',
  });

  // 5. Wire dependency injection container
  setContainer({
    config,
    logger,
    db,
    redis: {
      cache: redisCacheClient,
      pubsub: redisPubSubClient,
      bullmq: redisBullMQClient,
    },
  });

  // 6. Connect dependencies
  await Promise.all([
    redisCacheClient.connect(),
    redisPubSubClient.connect(),
    redisBullMQClient.connect(),
  ]);
  logger.info('Redis connections established');

  await db.$connect();
  logger.info('Database connected');

  // 7. Build and start Fastify
  const app = await buildApp();

  // 8. Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutdown signal received');

    try {
      await app.close();
      logger.info('Fastify closed');

      await db.$disconnect();
      logger.info('Database disconnected');

      await Promise.all([
        redisCacheClient.quit(),
        redisPubSubClient.quit(),
        redisBullMQClient.quit(),
      ]);
      logger.info('Redis disconnected');

      resetContainer();
      logger.info('Shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('SIGINT', () => { void shutdown('SIGINT'); });

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — process will exit');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled promise rejection — process will exit');
    process.exit(1);
  });

  // 9. Listen
  await app.listen({ port: config.API_GATEWAY_PORT, host: config.API_GATEWAY_HOST });
  logger.info(
    { port: config.API_GATEWAY_PORT, host: config.API_GATEWAY_HOST },
    'api-gateway listening',
  );
}

main().catch((err: unknown) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
