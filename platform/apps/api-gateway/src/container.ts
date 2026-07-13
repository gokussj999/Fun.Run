/**
 * Dependency Injection container.
 * Holds singleton service instances for the lifetime of the process.
 * Services register themselves here during startup and are resolved by plugins/routes.
 */
import type { RedisInstance as Redis } from '@funrun/redis';

import type { AppConfig } from '@funrun/config';
import type { DatabaseClientOptions } from '@funrun/database';
import type { Logger } from '@funrun/logger';
import type { PrismaClient } from '@funrun/database';

export interface Container {
  config: AppConfig;
  logger: Logger;
  db: PrismaClient;
  redis: {
    cache: Redis;
    pubsub: Redis;
    bullmq: Redis;
  };
}

let _container: Container | null = null;

export function setContainer(c: Container): void {
  if (_container) {
    throw new Error('Container already initialized');
  }
  _container = c;
}

export function getContainer(): Container {
  if (!_container) {
    throw new Error('Container not initialized. Call setContainer() at startup.');
  }
  return _container;
}

export function resetContainer(): void {
  _container = null;
}

// Re-export DatabaseClientOptions so callers don't need to import database package directly
export type { DatabaseClientOptions };
