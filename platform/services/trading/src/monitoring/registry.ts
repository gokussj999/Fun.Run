/**
 * Lightweight Prometheus text-format metrics registry.
 * No external dependencies — pure Node.js implementation.
 *
 * Supports: Counter, Gauge, Histogram.
 * Output: Prometheus exposition format (text/plain; version=0.0.4).
 */

// ── Label helpers ─────────────────────────────────────────────────────────────

function escapeLabel(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

export function labelsKey(labels: Record<string, string>): string {
  const entries = Object.entries(labels);
  if (entries.length === 0) return '';
  return '{' + entries.map(([k, v]) => `${k}="${escapeLabel(v)}"`).join(',') + '}';
}

// Strips outer braces; returns empty string if no labels.
function labelsInner(key: string): string {
  return key === '' ? '' : key.slice(1, -1);
}

// ── Counter ───────────────────────────────────────────────────────────────────

export class Counter {
  private readonly data = new Map<string, number>();

  inc(labels: Record<string, string> = {}, amount = 1): void {
    const key = labelsKey(labels);
    this.data.set(key, (this.data.get(key) ?? 0) + amount);
  }

  get(labels: Record<string, string> = {}): number {
    return this.data.get(labelsKey(labels)) ?? 0;
  }

  render(name: string, help: string): string {
    const lines = [`# HELP ${name} ${help}`, `# TYPE ${name} counter`];
    for (const [key, val] of this.data) {
      lines.push(`${name}${key} ${val}`);
    }
    return lines.join('\n');
  }
}

// ── Gauge ─────────────────────────────────────────────────────────────────────

export class Gauge {
  private readonly data = new Map<string, number>();

  set(labels: Record<string, string> = {}, value: number): void {
    this.data.set(labelsKey(labels), value);
  }

  inc(labels: Record<string, string> = {}, amount = 1): void {
    const key = labelsKey(labels);
    this.data.set(key, (this.data.get(key) ?? 0) + amount);
  }

  dec(labels: Record<string, string> = {}, amount = 1): void {
    const key = labelsKey(labels);
    this.data.set(key, (this.data.get(key) ?? 0) - amount);
  }

  get(labels: Record<string, string> = {}): number {
    return this.data.get(labelsKey(labels)) ?? 0;
  }

  render(name: string, help: string): string {
    const lines = [`# HELP ${name} ${help}`, `# TYPE ${name} gauge`];
    for (const [key, val] of this.data) {
      lines.push(`${name}${key} ${val}`);
    }
    return lines.join('\n');
  }
}

// ── Histogram ─────────────────────────────────────────────────────────────────

interface HistogramData {
  counts: number[];
  sum:    number;
  count:  number;
}

export class Histogram {
  private readonly buckets: number[];
  private readonly data = new Map<string, HistogramData>();

  constructor(buckets: readonly number[]) {
    this.buckets = [...buckets].sort((a, b) => a - b);
  }

  observe(labels: Record<string, string> = {}, value: number): void {
    const key = labelsKey(labels);
    let d = this.data.get(key);
    if (d === undefined) {
      d = { counts: new Array<number>(this.buckets.length + 1).fill(0), sum: 0, count: 0 };
      this.data.set(key, d);
    }
    d.sum   += value;
    d.count += 1;

    for (let i = 0; i < this.buckets.length; i++) {
      if (value <= (this.buckets[i] ?? Infinity)) {
        d.counts[i] = (d.counts[i] ?? 0) + 1;
      }
    }
    d.counts[this.buckets.length] = (d.counts[this.buckets.length] ?? 0) + 1; // +Inf
  }

  render(name: string, help: string): string {
    const lines = [`# HELP ${name} ${help}`, `# TYPE ${name} histogram`];

    for (const [labelKey, d] of this.data) {
      const inner = labelsInner(labelKey);
      const withLe = (le: string): string =>
        `{${inner ? inner + ',' : ''}le="${le}"}`;

      for (let i = 0; i < this.buckets.length; i++) {
        lines.push(`${name}_bucket${withLe(String(this.buckets[i]))} ${d.counts[i] ?? 0}`);
      }
      lines.push(`${name}_bucket${withLe('+Inf')} ${d.counts[this.buckets.length] ?? 0}`);
      lines.push(`${name}_sum${labelKey} ${d.sum}`);
      lines.push(`${name}_count${labelKey} ${d.count}`);
    }

    return lines.join('\n');
  }
}

// ── Registry ──────────────────────────────────────────────────────────────────

type AnyMetric = Counter | Gauge | Histogram;

interface MetricEntry {
  metric: AnyMetric;
  name:   string;
  help:   string;
}

export class MetricsRegistry {
  private readonly entries: MetricEntry[] = [];

  registerCounter(name: string, help: string): Counter {
    const m = new Counter();
    this.entries.push({ metric: m, name, help });
    return m;
  }

  registerGauge(name: string, help: string): Gauge {
    const m = new Gauge();
    this.entries.push({ metric: m, name, help });
    return m;
  }

  registerHistogram(name: string, help: string, buckets: readonly number[]): Histogram {
    const m = new Histogram(buckets);
    this.entries.push({ metric: m, name, help });
    return m;
  }

  /**
   * Renders all registered metrics in Prometheus text exposition format.
   * Safe to call concurrently — each render reads a consistent snapshot.
   */
  render(): string {
    return this.entries.map((e) => e.metric.render(e.name, e.help)).join('\n') + '\n';
  }
}

// ── Standard bucket sets ──────────────────────────────────────────────────────

/** General operation duration (10ms–10s). */
export const DURATION_BUCKETS = [10, 25, 50, 100, 250, 500, 1_000, 2_500, 5_000, 10_000] as const;

/** On-chain confirmation time (500ms–2min). */
export const CONFIRMATION_BUCKETS = [500, 1_000, 2_000, 5_000, 10_000, 30_000, 60_000, 120_000] as const;
