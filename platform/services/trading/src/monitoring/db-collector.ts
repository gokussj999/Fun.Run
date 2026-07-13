/**
 * DbCollector — periodic background task that refreshes DB-derived Gauge metrics.
 *
 * Runs on a configurable interval (default 15 s) and updates:
 *   - funrun_tx_by_status          — pending_txs count per status
 *   - funrun_graduation_coins_queued — coins table count WHERE status='GRADUATING'
 *   - funrun_process_uptime_seconds  — seconds since process start
 *
 * Does NOT touch Counters or Histograms — those are updated inline by executors.
 */
import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';
import type { TradingMetrics } from './metrics.js';

// All possible pending_tx statuses that can appear in the database.
const ALL_TX_STATUSES = [
  'BUILDING', 'SIGNING', 'PENDING', 'SUBMITTED',
  'CONFIRMED', 'FINALIZED', 'FAILED', 'EXPIRED', 'ABANDONED',
] as const;

// ── Options ───────────────────────────────────────────────────────────────────

export interface DbCollectorOptions {
  intervalMs?: number;
}

// ── DbCollector ───────────────────────────────────────────────────────────────

export class DbCollector {
  private readonly intervalMs: number;
  private timer:    ReturnType<typeof setInterval> | null = null;
  private readonly startedAt: number;

  constructor(
    private readonly db:      PrismaClient,
    private readonly metrics: TradingMetrics,
    private readonly logger:  Logger,
    opts:                     DbCollectorOptions = {},
    startedAt?:               number,
  ) {
    this.intervalMs = opts.intervalMs ?? 15_000;
    this.startedAt  = startedAt ?? Date.now();
  }

  start(): void {
    if (this.timer !== null) return;
    // Run once immediately, then on interval.
    void this.collect();
    this.timer = setInterval(() => { void this.collect(); }, this.intervalMs);
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // ── Collection ────────────────────────────────────────────────────────────────

  private async collect(): Promise<void> {
    try {
      await Promise.all([
        this.collectTxByStatus(),
        this.collectGraduatingCoins(),
      ]);
      this.metrics.processUptimeSeconds.set({}, Math.floor((Date.now() - this.startedAt) / 1_000));
    } catch (err) {
      this.logger.warn({ err }, 'DbCollector: collection pass failed');
    }
  }

  private async collectTxByStatus(): Promise<void> {
    const rows = await (this.db as unknown as {
      $queryRaw: (sql: TemplateStringsArray) => Promise<Array<{ status: string; cnt: bigint }>>;
    }).$queryRaw`
      SELECT status, COUNT(*) AS cnt
      FROM   funrun_platform.pending_txs
      WHERE  status NOT IN ('FINALIZED','ABANDONED')
      GROUP  BY status
    `;

    // Zero-out all statuses first so stale label sets don't linger.
    for (const s of ALL_TX_STATUSES) {
      this.metrics.txByStatus.set({ status: s }, 0);
    }

    for (const row of rows) {
      this.metrics.txByStatus.set({ status: row.status }, Number(row.cnt));
    }
  }

  private async collectGraduatingCoins(): Promise<void> {
    const count = await (this.db as unknown as {
      coin: { count: (opts: unknown) => Promise<number> };
    }).coin.count({ where: { status: 'GRADUATING' } });
    this.metrics.graduationCoinsQueued.set({}, count);
  }
}
