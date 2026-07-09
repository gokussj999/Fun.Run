import { Connection, Commitment } from '@solana/web3.js';

import type { Logger } from '@funrun/logger';

export interface SolanaConnectionOptions {
  primaryRpc: string;
  fallbackRpc?: string;
  wsEndpoint?: string;
  commitment?: Commitment;
  logger: Logger;
}

export interface IndexerConnections {
  readonly rpc: Connection;
  readonly ws: Connection;
}

let _connections: IndexerConnections | null = null;

export function createConnections(opts: SolanaConnectionOptions): IndexerConnections {
  if (_connections) return _connections;

  const { primaryRpc, fallbackRpc, wsEndpoint, commitment = 'confirmed', logger } = opts;

  // RPC connection — used for getTransaction, getSignaturesForAddress (backfill)
  const rpc = new Connection(primaryRpc, {
    commitment,
    confirmTransactionInitialTimeout: 30_000,
    disableRetryOnRateLimit: false,
    httpHeaders: { 'x-client': 'funrun-indexer' },
  });

  // WebSocket connection — used for logsSubscribe
  // wsEndpoint can differ from primaryRpc (e.g. Helius WS vs HTTP)
  const wsEndpointResolved = wsEndpoint ?? primaryRpc.replace('https://', 'wss://').replace('http://', 'ws://');
  const ws = new Connection(wsEndpointResolved, {
    commitment,
    wsEndpoint: wsEndpointResolved,
  });

  _connections = { rpc, ws };

  logger.info(
    { primaryRpc, wsEndpoint: wsEndpointResolved, commitment },
    'Solana connections initialized',
  );

  return _connections;
}

export function getConnections(): IndexerConnections {
  if (!_connections) {
    throw new Error('Solana connections not initialized. Call createConnections() first.');
  }
  return _connections;
}

/**
 * Circuit breaker for RPC calls.
 * Tracks consecutive failures and switches to fallback after threshold.
 */
export class RpcCircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private readonly threshold = 5;
  private readonly resetMs = 60_000;

  constructor(
    private primary: Connection,
    private fallback: Connection | null,
    private readonly logger: Logger,
  ) {}

  get activeConnection(): Connection {
    const now = Date.now();
    if (this.failures >= this.threshold) {
      if (now - this.lastFailure > this.resetMs) {
        this.failures = 0; // attempt recovery
        return this.primary;
      }
      if (this.fallback) {
        return this.fallback;
      }
    }
    return this.primary;
  }

  recordSuccess(): void {
    this.failures = 0;
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures === this.threshold) {
      this.logger.warn({ failures: this.failures }, 'RPC circuit breaker opened — switching to fallback');
    }
  }

  async callWithFallback<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
    try {
      const result = await fn(this.activeConnection);
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure();
      if (this.fallback && this.activeConnection !== this.fallback) {
        this.logger.warn('Primary RPC failed — retrying on fallback');
        const result = await fn(this.fallback);
        return result;
      }
      throw err;
    }
  }
}
