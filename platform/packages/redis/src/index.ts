export { createRedisClient, redisGetJson, redisSetJson, redisDelete } from './client.js';
export type { RedisClientOptions } from './client.js';

export { createBullMQConnection, QUEUE_DEFAULT_JOB_OPTIONS, QUEUE_RETRY_OPTIONS } from './bullmq.js';
export type { BullMQConnectionOptions } from './bullmq.js';

export type { Redis as RedisInstance } from 'ioredis';
