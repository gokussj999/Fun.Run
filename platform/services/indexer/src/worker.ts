import http from 'node:http';

import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';
import type { RedisInstance as Redis } from '@funrun/redis';
import { Connection } from '@solana/web3.js';

import { RpcCircuitBreaker } from './solana/connection.js';
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
import type { RedisDependencyMode } from './config/redis-dependency.js';
import type { RawLogEntry } from './types.js';

export interface IndexerWorkerDeps {
  db:                 PrismaClient;
  redis:              Redis;
  pubsub:             Redis;
  logger:             Logger;
  programId:          string;
  rpcUrl:             string;
  wsUrl:              string;
  fallbackRpcUrl?:    string;
  redisDependencyMode?: RedisDependencyMode;
}

export class IndexerWorker {
  private readonly processor:   EventProcessor;
  private readonly cursorStore: CursorStore;
  private readonly cursor:      CursorManager;
  private readonly retryMgr:    RetryManager;
  private readonly slotTracker: SlotTracker;
  private readonly fetcher:     TransactionFetcher;
  private readonly backfiller:  BackfillOrchestrator;
  private readonly metrics:     IndexerMetrics;
  private readonly rpcConn:     Connection;
  private subscriber:           LogSubscriber | null = null;
  private retryInterval:        ReturnType<typeof setInterval> | null = null;
  private metricsInterval:      ReturnType<typeof setInterval> | null = null;
  private periodicBackfill:     ReturnType<typeof setInterval> | null = null;
  private metricsServer:        http.Server | null = null;
  private backfillRunning  = false;
  private stopped          = false;

  constructor(private readonly deps: IndexerWorkerDeps) {
    const {
      db, redis, pubsub, logger, programId, rpcUrl, wsUrl,
      fallbackRpcUrl, redisDependencyMode = 'degraded',
    } = deps;

    this.processor   = new EventProcessor(db, redis, pubsub, logger, redisDependencyMode);
    this.cursorStore = new CursorStore(db, redis, logger);
    this.cursor      = new CursorManager(this.cursorStore, logger);
    this.retryMgr    = new RetryManager(logger);
    this.metrics     = new IndexerMetrics(redis, logger);

    const wsConn  = new Connection(rpcUrl, { wsEndpoint: wsUrl, commitment: 'confirmed' });
    this.rpcConn  = new Connection(rpcUrl, 'confirmed');
    const fallbackConn = fallbackRpcUrl ? new Connection(fallbackRpcUrl, 'confirmed') : null;

    this.slotTracker = new SlotTracker(this.rpcConn, logger);
    const breaker    = new RpcCircuitBreaker(this.rpcConn, fallbackConn, logger);
    this.fetcher     = new TransactionFetcher(breaker, logger);

    this.backfiller = new BackfillOrchestrator(
      programId,
      this.fetcher,
      this.slotTracker,
      this.processor,
      this.retryMgr,
      logger,
      (slot, signature) => this.cursor.advance(slot, signature),
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
    this.slotTracker.start();
    await new Promise((r) => setTimeout(r, 3_000));

    try {
      await this.runBackfill();
    } catch (err) {
      this.deps.logger.error(
        { err: err instanceof Error ? err.message : String(err) },
        'Backfill failed on startup — continuing with live WebSocket subscriber',
      );
    }

    this.subscriber!.start();

    this.retryInterval    = setInterval(() => { void this.drainRetryQueue(); }, 5_000);
    this.metricsInterval  = setInterval(() => { void this.flushMetrics(); }, 15_000);
    // Catch deferred live logs (slot not safe from reorg at receipt time) without waiting
    // for the 60-second WS idle health-check reconnect to trigger backfill.
    this.periodicBackfill = setInterval(() => { void this.runBackfill(); }, 20_000);

    this.startMetricsServer();

    this.deps.logger.info('IndexerWorker: running');
  }

  async stop(): Promise<void> {
    if (this.stopped) return;
    this.stopped = true;

    this.deps.logger.info('IndexerWorker: stopping');

    if (this.retryInterval)    { clearInterval(this.retryInterval);    this.retryInterval    = null; }
    if (this.metricsInterval)  { clearInterval(this.metricsInterval);  this.metricsInterval  = null; }
    if (this.periodicBackfill) { clearInterval(this.periodicBackfill); this.periodicBackfill = null; }

    this.subscriber?.stop();
    await this.slotTracker.stop();
    await this.cursor.shutdown();

    await new Promise<void>((resolve) => this.metricsServer?.close(() => resolve()));

    this.deps.logger.info('IndexerWorker: stopped');
  }

  private async handleLiveLog(entry: RawLogEntry): Promise<void> {
    if (entry.err !== null) return;

    if (!this.slotTracker.isSafeSlot(entry.slot)) {
      this.deps.logger.debug(
        { slot: entry.slot.toString(), safeSlot: this.slotTracker.getSafeSlot().toString() },
        'Live log deferred — slot not yet safe from reorg; backfill will catch up',
      );
      return;
    }

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
    try {
      await this.runBackfill();
    } catch (err) {
      this.deps.logger.error(
        { err: err instanceof Error ? err.message : String(err) },
        'Backfill failed after reconnect — live subscriber continues',
      );
    }
  }

  private async runBackfill(): Promise<void> {
    if (this.backfillRunning) return;
    this.backfillRunning = true;

    try {
      const cur = this.cursor.get();
      if (!cur?.lastProcessedSignature) {
        this.deps.logger.warn(
          'Backfill: no cursor — running genesis catch-up from program signatures',
        );
      }
      await this.backfiller.run({
        ...(cur?.lastProcessedSignature
          ? {
              fromSignature: cur.lastProcessedSignature,
              ...(cur.lastProcessedSlot !== undefined ? { fromSlot: cur.lastProcessedSlot } : {}),
            }
          : {}),
      });
    } finally {
      this.backfillRunning = false;
    }
  }

  private async drainRetryQueue(): Promise<void> {
    const ready = this.retryMgr.popReady();
    for (const { entry, attempts } of ready) {
      if (!this.slotTracker.isSafeSlot(entry.slot)) continue;

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
      lastSlot:        this.cursor.getLastSlot(),
      lagSlots:        Number(this.slotTracker.getLagSlots(this.cursor.getLastSlot())),
      backfillRunning: this.backfillRunning,
      wsConnected:     this.subscriber?.getStatus().status === 'CONNECTED',
      retryQueueSize:  this.retryMgr.size,
    });
    await this.metrics.flush(snap);
  }

  private async readiness(): Promise<{ ready: boolean; components: Record<string, { status: string; detail?: string }> }> {
    const components: Record<string, { status: string; detail?: string }> = {};

    try {
      await this.deps.db.$queryRaw`SELECT 1`;
      components['database'] = { status: 'ok' };
    } catch (err) {
      components['database'] = {
        status: 'down',
        detail: err instanceof Error ? err.message : String(err),
      };
    }

    try {
      await this.deps.redis.ping();
      components['redis_cache'] = { status: 'ok' };
    } catch (err) {
      components['redis_cache'] = {
        status: 'down',
        detail: err instanceof Error ? err.message : String(err),
      };
    }

    try {
      await this.deps.pubsub.ping();
      components['redis_pubsub'] = { status: 'ok' };
    } catch (err) {
      components['redis_pubsub'] = {
        status: 'down',
        detail: err instanceof Error ? err.message : String(err),
      };
    }

    try {
      await this.rpcConn.getSlot('confirmed');
      components['rpc'] = { status: 'ok' };
    } catch (err) {
      components['rpc'] = {
        status: 'down',
        detail: err instanceof Error ? err.message : String(err),
      };
    }

    const wsStatus = this.subscriber?.getStatus().status ?? 'DISCONNECTED';
    components['ws_subscriber'] = {
      status: wsStatus === 'CONNECTED' ? 'ok' : 'degraded',
      detail: wsStatus,
    };

    const ready = Object.values(components).every((c) => c.status !== 'down');
    return { ready, components };
  }

  private startMetricsServer(): void {
    this.metricsServer = http.createServer(async (req, res) => {
      const url = req.url ?? '/';

      if (url === '/readyz') {
        const result = await this.readiness();
        const code = result.ready ? 200 : 503;
        res.writeHead(code, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ready: result.ready, components: result.components }));
        return;
      }

      if (url !== '/metrics') {
        res.writeHead(404).end();
        return;
      }

      const snap = await this.metrics.snapshot({
        lastSlot:        this.cursor.getLastSlot(),
        lagSlots:        Number(this.slotTracker.getLagSlots(this.cursor.getLastSlot())),
        backfillRunning: this.backfillRunning,
        wsConnected:     this.subscriber?.getStatus().status === 'CONNECTED',
        retryQueueSize:  this.retryMgr.size,
      });
      res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
      res.end(this.metrics.toPrometheus(snap));
    });

    this.metricsServer.on('error', (err) => {
      this.deps.logger.warn(
        { err: err instanceof Error ? err.message : String(err) },
        'Indexer monitoring server failed to bind — continuing without /metrics',
      );
      this.metricsServer = null;
    });

    this.metricsServer.listen(9091, () => {
      this.deps.logger.info('Indexer monitoring: http://0.0.0.0:9091/metrics, /readyz');
    });
  }
}
