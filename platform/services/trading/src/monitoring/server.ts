/**
 * Monitoring HTTP server — exposes Prometheus metrics and health endpoints.
 *
 * Runs on a dedicated port (default 9090) separate from the main trading API.
 * Uses Node.js built-in `node:http` — no framework dependency.
 *
 * Routes:
 *   GET /metrics   — Prometheus text exposition format
 *   GET /healthz   — liveness probe  (200 always)
 *   GET /readyz    — readiness probe (200 ready, 503 not ready)
 *   GET /livez     — alias for /healthz (Kubernetes convention)
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { Logger } from '@funrun/logger';

import type { MetricsRegistry } from './registry.js';
import type { HealthChecker } from './health-checker.js';

// ── Options ───────────────────────────────────────────────────────────────────

export interface MonitoringServerOptions {
  port?: number;
  host?: string;
}

// ── MonitoringServer ──────────────────────────────────────────────────────────

export class MonitoringServer {
  private readonly port: number;
  private readonly host: string;

  constructor(
    private readonly registry: MetricsRegistry,
    private readonly health:   HealthChecker,
    private readonly logger:   Logger,
    opts: MonitoringServerOptions = {},
  ) {
    this.port = opts.port ?? 9090;
    this.host = opts.host ?? '0.0.0.0';
  }

  start(): void {
    const server = createServer((req, res) => {
      void this.handle(req, res);
    });

    server.listen(this.port, this.host, () => {
      this.logger.info(
        { port: this.port, host: this.host },
        'MonitoringServer: listening',
      );
    });

    server.on('error', (err) => {
      this.logger.error({ err }, 'MonitoringServer: server error');
    });
  }

  // ── Request routing ───────────────────────────────────────────────────────────

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url    = req.url ?? '/';
    const method = req.method ?? 'GET';

    if (method !== 'GET') {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
      return;
    }

    try {
      if (url === '/metrics') {
        await this.handleMetrics(res);
      } else if (url === '/healthz' || url === '/livez') {
        this.handleLiveness(res);
      } else if (url === '/readyz') {
        await this.handleReadiness(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    } catch (err) {
      this.logger.error({ err, url }, 'MonitoringServer: unhandled error in handler');
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
    }
  }

  // ── Handlers ──────────────────────────────────────────────────────────────────

  private async handleMetrics(res: ServerResponse): Promise<void> {
    const body = this.registry.render();
    res.writeHead(200, {
      'Content-Type':   'text/plain; version=0.0.4; charset=utf-8',
      'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
  }

  private handleLiveness(res: ServerResponse): void {
    const result = this.health.liveness();
    const body   = JSON.stringify(result);
    res.writeHead(200, {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
  }

  private async handleReadiness(res: ServerResponse): Promise<void> {
    const result = await this.health.readiness();
    const status = result.ready ? 200 : 503;
    const body   = JSON.stringify(result);
    res.writeHead(status, {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
  }
}
