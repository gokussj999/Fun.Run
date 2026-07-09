import { WebSocket } from 'ws';
import type { Logger } from '@funrun/logger';

import type { ClientConnection } from '../types.js';
import type { ConnectionRegistry } from '../connection/registry.js';
import { HEARTBEAT_INTERVAL_MS, HEARTBEAT_TIMEOUT_MS } from '../constants.js';

/**
 * HeartbeatManager sends WebSocket pings to all connected clients on a fixed interval.
 *
 * Protocol:
 *   Server → client: WebSocket ping frame (not a JSON message)
 *   Client → server: WebSocket pong frame (browser handles automatically)
 *
 * We also send a JSON `ping` message so JavaScript clients that don't expose
 * the WebSocket pong frame can respond with a JSON `ping` message.
 *
 * If a connection hasn't responded (pong or any message) within HEARTBEAT_TIMEOUT_MS,
 * it is terminated.
 */
export class HeartbeatManager {
  private timer: ReturnType<typeof setInterval> | null = null;
  private onDead: ((connId: string) => void) | null = null;

  constructor(
    private readonly registry: ConnectionRegistry,
    private readonly logger: Logger,
  ) {}

  start(onDead: (connId: string) => void): void {
    this.onDead = onDead;
    this.timer = setInterval(() => { this.tick(); }, HEARTBEAT_INTERVAL_MS);
    this.logger.info('HeartbeatManager: started');
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Called when a pong frame arrives for a connection. */
  markAlive(conn: ClientConnection): void {
    conn.lastPongAt = Date.now();
    conn.isAlive    = true;
  }

  private tick(): void {
    const now = Date.now();
    for (const conn of this.registry.getAll()) {
      const socket = this.registry.getSocket(conn.id);
      if (!socket) continue;

      // Check for dead connection
      const timeSinceLastPong = now - conn.lastPongAt;
      if (!conn.isAlive || timeSinceLastPong > HEARTBEAT_TIMEOUT_MS) {
        this.logger.warn(
          { connId: conn.id.slice(0, 8), idleSec: Math.floor(timeSinceLastPong / 1000) },
          'HeartbeatManager: terminating dead connection',
        );
        this.onDead?.(conn.id);
        socket.terminate();
        continue;
      }

      // Mark as pending pong before sending ping
      conn.isAlive     = false;
      conn.lastPingSentAt = now;

      if (socket.readyState === WebSocket.OPEN) {
        socket.ping();
      }
    }
  }
}
