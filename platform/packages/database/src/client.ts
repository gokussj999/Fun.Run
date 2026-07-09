import { PrismaClient } from './generated/client/index.js';

import type { Logger } from '@funrun/logger';

export interface DatabaseClientOptions {
  url: string;
  logger?: Logger;
  logQueries?: boolean;
}

let _client: PrismaClient | null = null;

export function createDatabaseClient(opts: DatabaseClientOptions): PrismaClient {
  if (_client) return _client;

  const { logger, logQueries } = opts;

  const logLevels: Array<'query' | 'info' | 'warn' | 'error'> = ['warn', 'error'];
  if (logQueries) logLevels.push('query');

  const client = new PrismaClient({
    log: logLevels.map((level) => ({ level, emit: 'event' })),
    datasources: {
      db: { url: opts.url },
    },
  });

  if (logger) {
    client.$on('warn', (e) => {
      logger.warn({ target: e.target }, e.message);
    });

    client.$on('error', (e) => {
      logger.error({ target: e.target }, e.message);
    });

    if (logQueries) {
      client.$on('query', (e) => {
        logger.debug({ query: e.query, duration: e.duration }, 'DB query');
      });
    }
  }

  _client = client;
  return _client;
}

export function getDatabaseClient(): PrismaClient {
  if (!_client) {
    throw new Error('Database client not initialized. Call createDatabaseClient() at startup.');
  }
  return _client;
}

export async function disconnectDatabase(): Promise<void> {
  if (_client) {
    await _client.$disconnect();
    _client = null;
  }
}

export { PrismaClient };
export type { Prisma } from './generated/client/index.js';
