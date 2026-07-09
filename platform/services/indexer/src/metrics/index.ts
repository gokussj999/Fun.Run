import type { Logger } from '@funrun/logger';
import type Redis from 'ioredis';

import { REDIS_KEYS_INDEXER } from '../constants.js';

export interface IndexerMetricsSnapshot {
  eventsProcessed:  number;
  eventsFailed:     number;
  eventsRetried:    number;
  lastSlot:         string;
  lagSlots:         number;
  backfillRunning:  boolean;
  wsConnected:      boolean;
  retryQueueSize:   number;
  uptimeSeconds:    number;
}

/**
 * In-process metrics counters with Redis persistence.
 * Prometheus scraping can read these from the /metrics HTTP endpoint (see worker.ts).
 */
export class IndexerMetrics {
  private eventsProcessed = 0;
  private eventsFailed    = 0;
  private eventsRetried   = 0;
  private startedAt       = Date.now();

  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger,
  ) {}

  incrementProcessed(): void { this.eventsProcessed++; }
  incrementFailed():    void { this.eventsFailed++; }
  incrementRetried():   void { this.eventsRetried++; }

  async snapshot(opts: {
    lastSlot: bigint;
    lagSlots: number;
    backfillRunning: boolean;
    wsConnected: boolean;
    retryQueueSize: number;
  }): Promise<IndexerMetricsSnapshot> {
    return {
      eventsProcessed: this.eventsProcessed,
      eventsFailed:    this.eventsFailed,
      eventsRetried:   this.eventsRetried,
      lastSlot:        opts.lastSlot.toString(),
      lagSlots:        opts.lagSlots,
      backfillRunning: opts.backfillRunning,
      wsConnected:     opts.wsConnected,
      retryQueueSize:  opts.retryQueueSize,
      uptimeSeconds:   Math.floor((Date.now() - this.startedAt) / 1000),
    };
  }

  async flush(snap: IndexerMetricsSnapshot): Promise<void> {
    try {
      await this.redis.setex(
        REDIS_KEYS_INDEXER.metrics(),
        300, // 5-minute TTL — stale metrics shouldn't linger
        JSON.stringify(snap),
      );
    } catch (err) {
      this.logger.warn({ err }, 'IndexerMetrics: failed to flush to Redis');
    }
  }

  /**
   * Format as Prometheus text exposition for /metrics scraping.
   */
  toPrometheus(snap: IndexerMetricsSnapshot): string {
    const lines: string[] = [
      `# HELP indexer_events_processed_total Total events successfully processed`,
      `# TYPE indexer_events_processed_total counter`,
      `indexer_events_processed_total ${snap.eventsProcessed}`,
      `# HELP indexer_events_failed_total Total events that failed permanently`,
      `# TYPE indexer_events_failed_total counter`,
      `indexer_events_failed_total ${snap.eventsFailed}`,
      `# HELP indexer_events_retried_total Total retry attempts`,
      `# TYPE indexer_events_retried_total counter`,
      `indexer_events_retried_total ${snap.eventsRetried}`,
      `# HELP indexer_lag_slots Slots behind finalized tip`,
      `# TYPE indexer_lag_slots gauge`,
      `indexer_lag_slots ${snap.lagSlots}`,
      `# HELP indexer_retry_queue_size Current retry queue depth`,
      `# TYPE indexer_retry_queue_size gauge`,
      `indexer_retry_queue_size ${snap.retryQueueSize}`,
      `# HELP indexer_uptime_seconds Seconds since indexer started`,
      `# TYPE indexer_uptime_seconds gauge`,
      `indexer_uptime_seconds ${snap.uptimeSeconds}`,
      `# HELP indexer_ws_connected WebSocket subscription healthy (1=yes, 0=no)`,
      `# TYPE indexer_ws_connected gauge`,
      `indexer_ws_connected ${snap.wsConnected ? 1 : 0}`,
    ];
    return lines.join('\n') + '\n';
  }
}
