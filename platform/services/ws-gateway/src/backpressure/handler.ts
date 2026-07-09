import { WebSocket } from 'ws';
import type { Logger } from '@funrun/logger';

import type { ClientConnection } from '../types.js';
import { SLOW_CONSUMER_THRESHOLD_BYTES, SLOW_CONSUMER_GRACE_MS } from '../constants.js';

/**
 * BackpressureHandler detects connections whose send buffer is growing
 * faster than they can drain it.
 *
 * If ws.bufferedAmount > SLOW_CONSUMER_THRESHOLD_BYTES, the connection is marked
 * as a slow consumer. If it doesn't recover within SLOW_CONSUMER_GRACE_MS, it is
 * terminated to prevent memory exhaustion on the gateway worker.
 */
export class BackpressureHandler {
  constructor(private readonly logger: Logger) {}

  /**
   * Check a connection before sending an outbound message.
   * Returns true if the connection should receive the message, false if it should be skipped.
   */
  shouldSend(conn: ClientConnection, socket: WebSocket): boolean {
    const buffered = socket.bufferedAmount ?? 0;

    if (buffered > SLOW_CONSUMER_THRESHOLD_BYTES) {
      if (!conn.isSlowConsumer) {
        conn.isSlowConsumer = true;
        conn.slowConsumerAt = Date.now();
        this.logger.warn(
          { connId: conn.id.slice(0, 8), bufferedKB: Math.floor(buffered / 1024) },
          'BackpressureHandler: slow consumer detected',
        );
      }

      // Check if grace period has expired
      const elapsed = Date.now() - (conn.slowConsumerAt ?? 0);
      if (elapsed > SLOW_CONSUMER_GRACE_MS) {
        this.logger.error(
          { connId: conn.id.slice(0, 8), elapsed },
          'BackpressureHandler: slow consumer grace expired — terminating',
        );
        socket.terminate();
        return false;
      }

      // Within grace period: skip this message (drop) to give buffer time to drain
      return false;
    }

    // Buffer drained — clear slow consumer flag
    if (conn.isSlowConsumer) {
      conn.isSlowConsumer = false;
      conn.slowConsumerAt = null;
      this.logger.info({ connId: conn.id.slice(0, 8) }, 'BackpressureHandler: slow consumer recovered');
    }

    return true;
  }
}
