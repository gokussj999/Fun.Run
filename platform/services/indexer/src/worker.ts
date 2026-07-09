import http from 'node:http';

import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';
import type Redis from 'ioredis';

import { parseEvents } from './parser/index.js';
import { EventProcessor } from './processor/index.js';
import { CursorStore } from './cursor/store.js';
import { CursorManager } from './cursor/manager.js';
import { BackfillOrchestrator } from './backfill/index.js';
import { IndexerMetrics } from './metrics/index.js';
import { RetryManager } from './retry/manager.js';
import { LogSubscriber } from './solana/subscriber.js';
import { TransactionFetcher } from './solana/fetcher.js';
import { SlotTracker } from './solana/slot-tracker.js';
import type { RawLogEntry } from './types.js';

export interface IndexerWorkerDeps {
  db:        PrismaClient;
  redis:     Redis;
  pubsub:    Redis;
  logger:    Logger;
  programId: string;
  rpcUrl:    string;
  wsUrl:     string;
}

/**
 * IndexerWorker is the top-level orchestrator.
 *
 * Lifecycle:
 *   start() → backfill missed slots → begin live subscription → periodic retry drain
 *   stop()  → stop subscriber → flush cursor → drain pending
 */
export class IndexerWorker {
  private readonly processor:   EventProcessor;
  private readonly cursorStore: CursorStore;
  private readonly cursor:      CursorManager;
  private readonly retryMgr:    RetryManager;
  private readonly slotTracker: SlotTracker;
  private readonly fetcher:     TransactionFetcher;
  private readonly backfiller:  BackfillOrchestrator;
  private readonly metrics:     IndexerMetrics;
  private subscriber:           LogSubscriber | null = null;
  private retryInterval:        ReturnType<typeof setInterval> | null = null;
  private metricsInterval:      ReturnType<typeof setInterval> | null = null;
  private metricsServer:        http.Server | null = null;
  private backfillRunning  = false;
  private stopped          = false;

  constructor(private readonly deps: IndexerWorkerDeps) {
    const { db, redis, pubsub, logger, programId, rpcUrl, wsUrl } = deps;

    this.processor   = new EventProcessor(db, pubsub, logger);
    this.cursorStore = new CursorStore(db, redis, logger);
    this.cursor      = new CursorManager(this.cursorStore, logger);
    this.retryMgr    = new RetryManager(logger);
    this.metrics     = new IndexerMetrics(redis, logger);

    // We import Connection lazily to avoid issues in unit tests
    const { Connection } = require('@solana/web3.js') as typeof import('@solana/web3.js');
    const wsConn  = new Connection(rpcUrl, { wsEndpoint: wsUrl, commitment: 'confirmed' });
    const rpcConn = new Connection(rpcUrl, 'confirmed');

    this.slotTracker = new SlotTracker(rpcConn, logger);
    this.fetcher     = new TransactionFetcher(rpcConn, logger);

    this.backfiller = new BackfillOrchestrator(
      programId,
      this.fetcher,
      this.slotTracker,
      this.processor,
      this.retryMgr,
      logger,
    );

    this.subscriber = new LogSubscriber(
      wsConn,
      programId,
      (entry) => this.handleLiveLog(entry),
      logger,
      () => this.onWsReconnect(),
    );
  }

  async start(): Promise<void> {
    this.deps.logger.info('IndexerWorker: starting');

    await this.cursor.initialize();
    await this.slotTracker.start();

    // Run initial backfill to catch missed events since last run
    await this.runBackfill();

    // Begin live WebSocket subscription
    this.subscriber!.start();

    // Drain retry queue every 5 seconds
    this.retryInterval = setInterval(() => { void this.drainRetryQueue(); }, 5_000);

    // Flush metrics every 15 seconds
    this.metricsInterval = setInterval(() => { void this.flushMetrics(); }, 15_000);

    // Start Prometheus metrics HTTP server on port 9091
    this.startMetricsServer();

    this.deps.logger.info('IndexerWorker: running');
  }

  async stop(): Promise<void> {
    if (this.stopped) return;
    this.stopped = true;

    this.deps.logger.info('IndexerWorker: stopping');

    if (this.retryInterval)  { clearInterval(this.retryInterval);  this.retryInterval = null; }
    if (this.metricsInterval){ clearInterval(this.metricsInterval); this.metricsInterval = null; }

    this.subscriber?.stop();
    await this.slotTracker.stop();
    await this.cursor.shutdown();

    await new Promise<void>((resolve) => this.metricsServer?.close(() => resolve()));

    this.deps.logger.info('IndexerWorker: stopped');
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private async handleLiveLog(entry: RawLogEntry): Promise<void> {
    if (entry.err !== null) return;

    const events = parseEvents(entry);

    for (const event of events) {
      try {
        await this.processor.processEvent(event);
        this.cursor.advance(entry.slot, entry.signature);
        this.metrics.incrementProcessed();
      } catch (err) {
        this.metrics.incrementFailed();
        this.retryMgr.enqueue(entry);
        this.deps.logger.error({ err, sig: entry.signature }, 'Live handler error — queued for retry');
      }
    }
  }

  private async onWsReconnect(): Promise<void> {
    this.deps.logger.warn('WebSocket reconnected — triggering backfill');
    await this.runBackfill();
  }

  private async runBackfill(): Promise<void> {
    if (this.backfillRunning) return;
    this.backfillRunning = true;

    try {
      const cur = this.cursor.get();
      await this.backfiller.run({
        fromSignature: cur?.lastProcessedSignature,
        fromSlot:      cur?.lastProcessedSlot,
      });
    } finally {
      this.backfillRunning = false;
    }
  }

  private async drainRetryQueue(): Promise<void> {
    const ready = this.retryMgr.popReady();
    for (const { entry, attempts } of ready) {
      const events = parseEvents(entry);
      this.metrics.incrementRetried();
      for (const event of events) {
        try {
          await this.processor.processEvent(event);
          this.cursor.advance(entry.slot, entry.signature);
        } catch (err) {
          this.retryMgr.handleFailure(entry, attempts, err);
        }
      }
    }
  }

  private async flushMetrics(): Promise<void> {
    const snap = await this.metrics.snapshot({
      lastSlot:       this.cursor.getLastSlot(),
      lagSlots:       this.slotTracker.getLagSlots(),
      backfillRunning: this.backfillRunning,
      wsConnected:    this.subscriber?.getStatus().status === 'CONNECTED',
      retryQueueSize: this.retryMgr.size,
    });
    await this.metrics.flush(snap);
  }

  private startMetricsServer(): void {
    this.metricsServer = http.createServer(async (req, res) => {
      if (req.url !== '/metrics') {
        res.writeHead(404).end();
        return;
      }
      const snap = await this.metrics.snapshot({
        lastSlot:        this.cursor.getLastSlot(),
        lagSlots:        this.slotTracker.getLagSlots(),
        backfillRunning: this.backfillRunning,
        wsConnected:     this.subscriber?.getStatus().status === 'CONNECTED',
        retryQueueSize:  this.retryMgr.size,
      });
      res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
      res.end(this.metrics.toPrometheus(snap));
    });

    this.metricsServer.listen(9091, () => {
      this.deps.logger.info('Prometheus metrics: http://0.0.0.0:9091/metrics');
    });
  }
}
