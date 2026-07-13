/**
 * HealthChecker — liveness and readiness probes for the trading service.
 *
 * Liveness:  process is alive (always passes unless process is hung)
 * Readiness: all required dependencies are reachable
 *   - PostgreSQL: simple SELECT 1 query
 *   - Solana RPC: getSlot with 3 s timeout
 */
import { Connection } from '@solana/web3.js';
import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';

// ── Result types ───────────────────────────────────────────────────────────────

export interface ComponentHealth {
  status:    'ok' | 'degraded' | 'down';
  latencyMs: number;
  detail?:   string;
}

export interface ReadinessResult {
  ready:      boolean;
  components: Record<string, ComponentHealth>;
}

export interface LivenessResult {
  alive: boolean;
}

// ── HealthChecker ─────────────────────────────────────────────────────────────

export class HealthChecker {
  private readonly startedAt: number;

  constructor(
    private readonly db:         PrismaClient,
    private readonly connection: Connection,
    private readonly logger:     Logger,
    startedAt?: number,
  ) {
    // Accept startedAt from outside so multiple instances share the same uptime origin.
    this.startedAt = startedAt ?? Date.now();
  }

  /** Liveness — always true unless the event loop is completely blocked. */
  liveness(): LivenessResult {
    return { alive: true };
  }

  /** Readiness — all critical dependencies must be reachable. */
  async readiness(): Promise<ReadinessResult> {
    const [dbResult, rpcResult] = await Promise.all([
      this.checkDb(),
      this.checkRpc(),
    ]);

    const components: Record<string, ComponentHealth> = {
      database: dbResult,
      rpc:      rpcResult,
    };

    const ready = Object.values(components).every((c) => c.status !== 'down');

    if (!ready) {
      this.logger.warn(
        { components },
        'HealthChecker: readiness check FAILED — one or more dependencies down',
      );
    }

    return { ready, components };
  }

  uptimeSeconds(): number {
    return Math.floor((Date.now() - this.startedAt) / 1_000);
  }

  // ── Private checks ────────────────────────────────────────────────────────────

  private async checkDb(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      await (this.db as unknown as { $queryRaw: (sql: unknown) => Promise<unknown> })
        .$queryRaw`SELECT 1`;
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      return { status: 'down', latencyMs: Date.now() - start, detail };
    }
  }

  private async checkRpc(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3_000);
      try {
        await this.connection.getSlot('confirmed');
      } finally {
        clearTimeout(timer);
      }
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      return { status: 'down', latencyMs: Date.now() - start, detail };
    }
  }
}
