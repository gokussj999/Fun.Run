import type { Logger } from '@funrun/logger';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/** Injected probe: returns latency in ms, throws on failure. */
export type ProbeFn = (url: string, timeoutMs: number) => Promise<number>;

export interface RpcEndpointConfig {
  url:          string;
  label:        string;
  /** Lower number = higher priority when multiple healthy endpoints exist. */
  priority:     number;
  maxFailures?: number;
  cooldownMs?:  number;
  timeoutMs?:   number;
}

export interface EndpointHealth {
  url:           string;
  label:         string;
  priority:      number;
  state:         CircuitState;
  latencyP50Ms:  number;
  latencyP95Ms:  number;
  failureCount:  number;
  successCount:  number;
  lastFailureAt: number | null;
  lastSuccessAt: number | null;
  totalRequests: number;
  errorRate:     number;
}

interface EndpointState {
  config:              RpcEndpointConfig;
  state:               CircuitState;
  consecutiveFailures: number;
  lastFailureAt:       number | null;
  lastSuccessAt:       number | null;
  circuitOpenAt:       number | null;
  successCount:        number;
  failureCount:        number;
  failoverCount:       number;
  latencySamples:      number[];
}

const DEFAULTS = { maxFailures: 5, cooldownMs: 30_000, timeoutMs: 10_000 } as const;
const LATENCY_WINDOW  = 60;
const PROBE_INTERVAL  = 10_000;

export class RpcHealthManager {
  private readonly eps: Map<string, EndpointState>;
  private probeHandle: ReturnType<typeof setInterval> | null = null;

  constructor(
    configs: RpcEndpointConfig[],
    private readonly probeFn: ProbeFn,
    private readonly logger: Logger,
  ) {
    this.eps = new Map(
      configs.map((c) => [
        c.url,
        {
          config:              c,
          state:               'CLOSED',
          consecutiveFailures: 0,
          lastFailureAt:       null,
          lastSuccessAt:       null,
          circuitOpenAt:       null,
          successCount:        0,
          failureCount:        0,
          failoverCount:       0,
          latencySamples:      [],
        } satisfies EndpointState,
      ]),
    );
  }

  /** Returns the URL of the highest-priority healthy endpoint. Throws if none. */
  getPrimaryUrl(): string {
    const url = this.pick(null);
    if (!url) throw new Error('RpcHealthManager: no healthy RPC endpoints');
    return url;
  }

  /** Returns the best healthy endpoint excluding the primary (or excludeUrl). */
  getFallbackUrl(excludeUrl?: string): string | null {
    return this.pick(excludeUrl ?? this.pick(null));
  }

  recordSuccess(url: string, latencyMs: number): void {
    const ep = this.eps.get(url);
    if (!ep) return;

    ep.successCount++;
    ep.consecutiveFailures = 0;
    ep.lastSuccessAt = Date.now();

    ep.latencySamples.push(latencyMs);
    if (ep.latencySamples.length > LATENCY_WINDOW) ep.latencySamples.shift();

    if (ep.state === 'HALF_OPEN') {
      ep.state = 'CLOSED';
      ep.circuitOpenAt = null;
      this.logger.info(
        { endpoint: ep.config.label, latencyMs },
        'RpcHealthManager: circuit closed after probe',
      );
    }
  }

  recordFailure(url: string, error: Error): void {
    const ep = this.eps.get(url);
    if (!ep) return;

    ep.failureCount++;
    ep.consecutiveFailures++;
    ep.lastFailureAt = Date.now();

    const max = ep.config.maxFailures ?? DEFAULTS.maxFailures;

    if (ep.state === 'CLOSED' && ep.consecutiveFailures >= max) {
      ep.state = 'OPEN';
      ep.circuitOpenAt = Date.now();
      this.logger.warn(
        { endpoint: ep.config.label, consecutiveFailures: ep.consecutiveFailures, err: error.message },
        'RpcHealthManager: circuit opened',
      );
    } else if (ep.state === 'HALF_OPEN') {
      ep.state = 'OPEN';
      ep.circuitOpenAt = Date.now();
      this.logger.warn(
        { endpoint: ep.config.label, err: error.message },
        'RpcHealthManager: half-open probe failed — circuit reopened',
      );
    }
  }

  recordFailover(fromUrl: string): void {
    const ep = this.eps.get(fromUrl);
    if (ep) ep.failoverCount++;
  }

  getHealth(): EndpointHealth[] {
    return [...this.eps.values()].map((ep) => ({
      url:           ep.config.url,
      label:         ep.config.label,
      priority:      ep.config.priority,
      state:         ep.state,
      latencyP50Ms:  this.pct(ep.latencySamples, 50),
      latencyP95Ms:  this.pct(ep.latencySamples, 95),
      failureCount:  ep.failureCount,
      successCount:  ep.successCount,
      lastFailureAt: ep.lastFailureAt,
      lastSuccessAt: ep.lastSuccessAt,
      totalRequests: ep.successCount + ep.failureCount,
      errorRate:     ep.failureCount / Math.max(ep.successCount + ep.failureCount, 1),
    }));
  }

  getMetrics(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const ep of this.eps.values()) {
      const l = ep.config.label;
      out[`rpc_circuit_state{endpoint="${l}"}`]  = ep.state === 'CLOSED' ? 1 : 0;
      out[`rpc_latency_p50_ms{endpoint="${l}"}`] = this.pct(ep.latencySamples, 50);
      out[`rpc_latency_p95_ms{endpoint="${l}"}`] = this.pct(ep.latencySamples, 95);
      out[`rpc_failure_total{endpoint="${l}"}`]  = ep.failureCount;
      out[`rpc_success_total{endpoint="${l}"}`]  = ep.successCount;
      out[`rpc_failover_total{endpoint="${l}"}`] = ep.failoverCount;
    }
    return out;
  }

  start(): void {
    this.probeHandle = setInterval(() => { void this.runProbes(); }, PROBE_INTERVAL);
    this.logger.info('RpcHealthManager: started');
  }

  stop(): void {
    if (this.probeHandle !== null) {
      clearInterval(this.probeHandle);
      this.probeHandle = null;
    }
    this.logger.info('RpcHealthManager: stopped');
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  private pick(exclude: string | null): string | null {
    this.maybeTransitionToHalfOpen();
    return (
      [...this.eps.values()]
        .filter((ep) => ep.state !== 'OPEN' && ep.config.url !== exclude)
        .sort((a, b) => {
          if (a.state !== b.state) return a.state === 'CLOSED' ? -1 : 1;
          if (a.config.priority !== b.config.priority) return a.config.priority - b.config.priority;
          return this.pct(a.latencySamples, 50) - this.pct(b.latencySamples, 50);
        })[0]?.config.url ?? null
    );
  }

  private maybeTransitionToHalfOpen(): void {
    const now = Date.now();
    for (const ep of this.eps.values()) {
      if (ep.state !== 'OPEN' || ep.circuitOpenAt === null) continue;
      const cooldown = ep.config.cooldownMs ?? DEFAULTS.cooldownMs;
      if (now - ep.circuitOpenAt >= cooldown) {
        ep.state = 'HALF_OPEN';
        this.logger.info({ endpoint: ep.config.label }, 'RpcHealthManager: circuit half-open');
      }
    }
  }

  private async runProbes(): Promise<void> {
    const targets = [...this.eps.values()].filter(
      (ep) => ep.state === 'OPEN' || ep.state === 'HALF_OPEN',
    );
    for (const ep of targets) {
      const timeoutMs = ep.config.timeoutMs ?? DEFAULTS.timeoutMs;
      try {
        const latencyMs = await this.probeFn(ep.config.url, timeoutMs);
        this.recordSuccess(ep.config.url, latencyMs);
      } catch (err) {
        this.recordFailure(ep.config.url, err instanceof Error ? err : new Error(String(err)));
        this.logger.debug({ endpoint: ep.config.label }, 'RpcHealthManager: probe failed');
      }
    }
  }

  private pct(samples: number[], p: number): number {
    if (samples.length === 0) return 0;
    const sorted = [...samples].sort((a, b) => a - b);
    const idx = Math.min(Math.floor((p / 100) * sorted.length), sorted.length - 1);
    return sorted[idx] ?? 0;
  }
}
