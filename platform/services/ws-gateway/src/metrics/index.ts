import type { Logger } from '@funrun/logger';

import type { ConnectionRegistry } from '../connection/registry.js';
import type { SubscriptionManager } from '../subscription/manager.js';
import { WORKER_ID } from '../constants.js';

export interface WsMetricsSnapshot {
  workerId:             string;
  connectionsActive:    number;
  connectionsTotal:     number;
  subscriptionsActive:  number;
  messagesSentTotal:    number;
  messagesReceivedTotal: number;
  errorsTotal:          number;
  slowConsumers:        number;
  bytesTransferred:     number;
  uptimeSeconds:        number;
}

export class WsMetrics {
  private connectionsTotal    = 0;
  private messagesSentTotal   = 0;
  private messagesReceivedTotal = 0;
  private errorsTotal         = 0;
  private bytesTransferred    = 0;
  private readonly startedAt  = Date.now();

  constructor(
    private readonly registry: ConnectionRegistry,
    private readonly subscriptions: SubscriptionManager,
    private readonly logger: Logger,
  ) {}

  onConnect():           void { this.connectionsTotal++; }
  onMessageSent(bytes: number):     void { this.messagesSentTotal++; this.bytesTransferred += bytes; }
  onMessageReceived():   void { this.messagesReceivedTotal++; }
  onError():             void { this.errorsTotal++; }

  snapshot(): WsMetricsSnapshot {
    let slowConsumers = 0;
    let subscriptionsActive = 0;
    for (const conn of this.registry.getAll()) {
      if (conn.isSlowConsumer) slowConsumers++;
      subscriptionsActive += conn.subscriptions.size;
    }

    return {
      workerId:              WORKER_ID,
      connectionsActive:     this.registry.size,
      connectionsTotal:      this.connectionsTotal,
      subscriptionsActive,
      messagesSentTotal:     this.messagesSentTotal,
      messagesReceivedTotal: this.messagesReceivedTotal,
      errorsTotal:           this.errorsTotal,
      slowConsumers,
      bytesTransferred:      this.bytesTransferred,
      uptimeSeconds:         Math.floor((Date.now() - this.startedAt) / 1000),
    };
  }

  toPrometheus(): string {
    const s = this.snapshot();
    return [
      `# HELP wsg_connections_active Active WebSocket connections on this worker`,
      `# TYPE wsg_connections_active gauge`,
      `wsg_connections_active{worker="${s.workerId}"} ${s.connectionsActive}`,
      `# HELP wsg_connections_total Total connections accepted lifetime`,
      `# TYPE wsg_connections_total counter`,
      `wsg_connections_total{worker="${s.workerId}"} ${s.connectionsTotal}`,
      `# HELP wsg_subscriptions_active Active channel subscriptions`,
      `# TYPE wsg_subscriptions_active gauge`,
      `wsg_subscriptions_active{worker="${s.workerId}"} ${s.subscriptionsActive}`,
      `# HELP wsg_messages_sent_total Total messages sent to clients`,
      `# TYPE wsg_messages_sent_total counter`,
      `wsg_messages_sent_total{worker="${s.workerId}"} ${s.messagesSentTotal}`,
      `# HELP wsg_messages_received_total Total messages received from clients`,
      `# TYPE wsg_messages_received_total counter`,
      `wsg_messages_received_total{worker="${s.workerId}"} ${s.messagesReceivedTotal}`,
      `# HELP wsg_errors_total Total errors`,
      `# TYPE wsg_errors_total counter`,
      `wsg_errors_total{worker="${s.workerId}"} ${s.errorsTotal}`,
      `# HELP wsg_slow_consumers Connections currently in slow-consumer state`,
      `# TYPE wsg_slow_consumers gauge`,
      `wsg_slow_consumers{worker="${s.workerId}"} ${s.slowConsumers}`,
      `# HELP wsg_bytes_transferred_total Total bytes sent to clients`,
      `# TYPE wsg_bytes_transferred_total counter`,
      `wsg_bytes_transferred_total{worker="${s.workerId}"} ${s.bytesTransferred}`,
      `# HELP wsg_uptime_seconds Seconds since worker started`,
      `# TYPE wsg_uptime_seconds gauge`,
      `wsg_uptime_seconds{worker="${s.workerId}"} ${s.uptimeSeconds}`,
    ].join('\n') + '\n';
  }
}
