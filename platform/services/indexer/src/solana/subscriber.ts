import { PublicKey, type Connection, type LogsFilter } from '@solana/web3.js';

import type { Logger } from '@funrun/logger';

import type { RawLogEntry, SubscriptionState } from '../types.js';
import {
  WS_PING_INTERVAL_MS,
  WS_RECONNECT_BASE_MS,
  WS_RECONNECT_MAX_MS,
  WS_HEALTH_TIMEOUT_MS,
} from '../constants.js';

export type LogHandler = (entry: RawLogEntry) => Promise<void> | void;

export class LogSubscriber {
  private state: SubscriptionState = {
    status: 'DISCONNECTED',
    subscriptionId: null,
    reconnectAttempts: 0,
    lastMessageAt: null,
  };

  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private healthCheck: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly connection: Connection,
    private readonly programId: string,
    private readonly handler: LogHandler,
    private readonly logger: Logger,
    private readonly onReconnect?: () => Promise<void>,
  ) {}

  start(): void {
    this.subscribe();
    this.startHealthCheck();
  }

  stop(): void {
    this.clearTimers();
    if (this.state.subscriptionId !== null) {
      this.connection.removeOnLogsListener(this.state.subscriptionId);
      this.state = { ...this.state, subscriptionId: null, status: 'DISCONNECTED' };
    }
    this.logger.info('LogSubscriber stopped');
  }

  getStatus(): SubscriptionState {
    return { ...this.state };
  }

  private subscribe(): void {
    if (this.state.status === 'CONNECTING' || this.state.status === 'CONNECTED') return;

    this.state = { ...this.state, status: 'CONNECTING' };
    this.logger.info({ programId: this.programId }, 'Subscribing to program logs');

    const filter: LogsFilter = { mentions: [this.programId] };

    const subId = this.connection.onLogs(
      new PublicKey(this.programId),
      (logs, context) => {
        this.state = { ...this.state, lastMessageAt: Date.now() };

        if (logs.err) {
          // Skip failed transactions — they don't emit program events
          return;
        }

        const entry: RawLogEntry = {
          signature: logs.signature,
          slot: BigInt(context.slot),
          blockTime: null, // populated by processor via getTransaction
          logs: logs.logs,
          err: logs.err,
        };

        void this.handler(entry).catch((err) => {
          this.logger.error(
            { sig: logs.signature, err: err instanceof Error ? err.message : String(err) },
            'Log handler error',
          );
        });
      },
      'confirmed',
    );

    this.state = { ...this.state, subscriptionId: subId, status: 'CONNECTED', reconnectAttempts: 0 };
    this.logger.info({ subscriptionId: subId }, 'Subscribed to program logs');

    this.startPing();
  }

  private startPing(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);

    this.pingInterval = setInterval(async () => {
      try {
        await this.connection.getSlot('confirmed');
      } catch {
        this.logger.warn('WS ping failed — triggering reconnect');
        this.scheduleReconnect();
      }
    }, WS_PING_INTERVAL_MS);
  }

  private startHealthCheck(): void {
    if (this.healthCheck) clearInterval(this.healthCheck);

    this.healthCheck = setInterval(() => {
      if (
        this.state.status === 'CONNECTED' &&
        this.state.lastMessageAt !== null &&
        Date.now() - this.state.lastMessageAt > WS_HEALTH_TIMEOUT_MS
      ) {
        this.logger.warn(
          { idleSec: Math.floor((Date.now() - (this.state.lastMessageAt ?? 0)) / 1000) },
          'WebSocket idle timeout — reconnecting',
        );
        this.scheduleReconnect();
      }
    }, 15_000);
  }

  private scheduleReconnect(): void {
    if (
      this.state.status === 'RECONNECTING' ||
      this.state.status === 'CONNECTING'
    ) return;

    this.state = { ...this.state, status: 'RECONNECTING', subscriptionId: null };

    if (this.state.subscriptionId !== null) {
      try { this.connection.removeOnLogsListener(this.state.subscriptionId); } catch { /* noop */ }
    }

    const delay = Math.min(
      WS_RECONNECT_BASE_MS * 2 ** this.state.reconnectAttempts,
      WS_RECONNECT_MAX_MS,
    );

    this.logger.info(
      { attempt: this.state.reconnectAttempts + 1, delayMs: delay },
      'Scheduling WebSocket reconnect',
    );

    this.state = { ...this.state, reconnectAttempts: this.state.reconnectAttempts + 1 };

    this.reconnectTimeout = setTimeout(async () => {
      // Notify caller so they can re-run backfill for missed slots
      if (this.onReconnect) {
        try { await this.onReconnect(); } catch { /* noop */ }
      }
      this.subscribe();
    }, delay);
  }

  private clearTimers(): void {
    if (this.pingInterval) { clearInterval(this.pingInterval); this.pingInterval = null; }
    if (this.healthCheck) { clearInterval(this.healthCheck); this.healthCheck = null; }
    if (this.reconnectTimeout) { clearTimeout(this.reconnectTimeout); this.reconnectTimeout = null; }
  }
}
