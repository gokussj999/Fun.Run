import http from 'node:http';
import { WebSocketServer } from 'ws';
import Fastify from 'fastify';
import type { Logger } from '@funrun/logger';

import type { WsContainer } from './container.js';
import { WS_PORT, HTTP_PORT } from './constants.js';

export interface GatewayServers {
  wsServer:   WebSocketServer;
  httpServer: http.Server;
  start:      () => Promise<void>;
  stop:       () => Promise<void>;
}

/**
 * buildGatewayServers creates two co-located servers:
 *
 *   WebSocket server (WS_PORT, default 3001):
 *     GET /ws   → WebSocket upgrade
 *
 *   HTTP server (HTTP_PORT, default 3002):
 *     GET /healthz  → liveness probe
 *     GET /readyz   → readiness probe (checks Redis connectivity)
 *     GET /metrics  → Prometheus text exposition
 *
 * Separating HTTP and WS ports avoids Nginx sticky-session complexity
 * when load balancers need to health-check the gateway independently
 * of the WebSocket traffic.
 */
export async function buildGatewayServers(
  container: WsContainer,
  redisForHealth: { ping: () => Promise<string> },
): Promise<GatewayServers> {
  const { connManager, metrics, logger } = container;

  // ─── WebSocket server ───────────────────────────────────────────────────────

  const httpForWs = http.createServer();
  const wsServer  = new WebSocketServer({
    server:             httpForWs,
    path:               '/ws',
    maxPayload:         65_536, // 64KB per message
    perMessageDeflate:  {
      zlibDeflateOptions: { level: 6 },
      threshold:          1024,  // only compress messages > 1KB
      concurrencyLimit:   10,
    },
  });

  wsServer.on('connection', (socket, req) => {
    void connManager.handleConnection(socket, req);
  });

  wsServer.on('error', (err) => {
    logger.error({ err }, 'WebSocketServer error');
  });

  // ─── HTTP server (health + metrics) ─────────────────────────────────────────

  const app = Fastify({ logger: false });

  app.get('/healthz', { logLevel: 'silent' as never }, (_req, reply) => {
    reply.send({ status: 'ok', alive: true, uptime: process.uptime() });
  });

  app.get('/readyz', async (_req, reply) => {
    const components: Record<string, { status: string; detail?: string }> = {};

    try {
      await redisForHealth.ping();
      components['redis'] = { status: 'ok' };
    } catch (err) {
      components['redis'] = {
        status: 'down',
        detail: err instanceof Error ? err.message : String(err),
      };
    }

    try {
      await container.db.$queryRaw`SELECT 1`;
      components['database'] = { status: 'ok' };
    } catch (err) {
      components['database'] = {
        status: 'down',
        detail: err instanceof Error ? err.message : String(err),
      };
    }

    components['pubsub'] = {
      status: container.redisSubscriber.activeChannels.length >= 0 ? 'ok' : 'degraded',
      detail: `${container.redisSubscriber.activeChannels.length} active channels`,
    };

    const ready = Object.values(components).every((c) => c.status !== 'down');
    const code = ready ? 200 : 503;
    reply.code(code).send({
      ready,
      connections: container.registry.size,
      components,
    });
  });

  app.get('/metrics', (_req, reply) => {
    reply
      .header('Content-Type', 'text/plain; version=0.0.4')
      .send(metrics.toPrometheus());
  });

  app.get('/status', (_req, reply) => {
    const snap = metrics.snapshot();
    reply.send(snap);
  });

  await app.ready();
  const httpServer = app.server;

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  const start = async (): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      httpForWs.listen(WS_PORT, () => {
        logger.info(`WebSocket server listening on :${WS_PORT}/ws`);
        resolve();
      });
      httpForWs.on('error', reject);
    });

    await new Promise<void>((resolve, reject) => {
      httpServer.listen(HTTP_PORT, () => {
        logger.info(`HTTP server (health + metrics) listening on :${HTTP_PORT}`);
        resolve();
      });
      httpServer.on('error', reject);
    });

    // Start heartbeat loop
    container.heartbeat.start((connId) => {
      logger.warn({ connId: connId.slice(0, 8) }, 'HeartbeatManager: declared dead — cleaning up');
      const conn = container.registry.get(connId);
      if (conn) void container.subscriptions.unsubscribeAll(conn);
      container.registry.remove(connId);
      void container.presence.deregister(connId);
    });
  };

  const stop = async (): Promise<void> => {
    logger.info('GatewayServers: draining connections...');

    container.heartbeat.stop();

    // Close all WebSocket connections gracefully
    for (const socket of wsServer.clients) {
      socket.close(1001, 'Server shutting down');
    }

    await new Promise<void>((resolve) => wsServer.close(() => resolve()));
    await new Promise<void>((resolve) => httpForWs.close(() => resolve()));
    await app.close();
    logger.info('GatewayServers: stopped');
  };

  return { wsServer, httpServer, start, stop };
}
