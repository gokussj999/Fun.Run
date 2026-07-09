import type Redis from 'ioredis';
import type { Logger } from '@funrun/logger';
import { WebSocket } from 'ws';

import type { EventMessage, ReplayEntry } from '../types.js';
import { ConnectionRegistry } from '../connection/registry.js';
import { SubscriptionManager } from '../subscription/manager.js';
import { ReplayBuffer } from '../replay/buffer.js';
import { BackpressureHandler } from '../backpressure/handler.js';
import { RK } from '../constants.js';

/**
 * EventDispatcher bridges incoming Redis pub/sub messages → WS client sends.
 *
 * Per-channel sequence numbers are assigned atomically via Redis INCR.
 * This guarantees monotonically increasing sequence numbers even across
 * multiple workers (since the INCR is atomic and all workers share Redis).
 *
 * Fan-out is local-only — each gateway worker dispatches only to its own connections.
 */
export class EventDispatcher {
  constructor(
    private readonly cache: Redis,       // separate non-subscriber Redis client
    private readonly registry: ConnectionRegistry,
    private readonly subscriptions: SubscriptionManager,
    private readonly replayBuffer: ReplayBuffer,
    private readonly backpressure: BackpressureHandler,
    private readonly logger: Logger,
  ) {}

  /**
   * Handle a raw Redis pub/sub message.
   * redisChannel: e.g. "price:MINT123" or "events:all_trades"
   * rawData:      JSON string published by the indexer
   */
  async handleRedisMessage(redisChannel: string, rawData: string): Promise<void> {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawData) as Record<string, unknown>;
    } catch {
      this.logger.warn({ redisChannel }, 'Dispatcher: invalid JSON from Redis');
      return;
    }

    // Determine which WS channels this Redis message should fan out to
    const wsChannels = this.resolveWsChannels(redisChannel, payload);

    for (const wsChannel of wsChannels) {
      await this.dispatch(wsChannel, redisChannel, payload);
    }
  }

  private async dispatch(
    wsChannel:    string,
    redisChannel: string,
    payload:      Record<string, unknown>,
  ): Promise<void> {
    const subscribers = this.subscriptions.getSubscribers(wsChannel);
    if (subscribers.length === 0) return;

    // Assign sequence number (atomic Redis INCR)
    const seq = await this.nextSeq(wsChannel);
    const ts  = Date.now();
    const eventName = this.resolveEventName(redisChannel, payload);

    const msg: EventMessage = {
      type:    'event',
      channel: wsChannel,
      seq,
      ts,
      event:   eventName,
      data:    this.filterPayload(wsChannel, payload),
    };

    const json = JSON.stringify(msg);

    // Store in replay buffer (best-effort)
    const replayEntry: ReplayEntry = { seq, ts, event: eventName, data: msg.data };
    void this.replayBuffer.push(wsChannel, seq, replayEntry);

    // Fan out to all local subscribers
    let sent = 0;
    for (const conn of subscribers) {
      const socket = this.registry.getSocket(conn.id);
      if (!socket || socket.readyState !== WebSocket.OPEN) continue;

      if (!this.backpressure.shouldSend(conn, socket)) continue;

      try {
        socket.send(json, { compress: true });
        conn.messagesSent++;
        sent++;
      } catch (err) {
        this.logger.warn({ connId: conn.id.slice(0, 8), err }, 'Dispatcher: send failed');
      }
    }

    if (sent > 0) {
      this.logger.debug(
        { wsChannel, seq, sent, total: subscribers.length },
        'Dispatcher: dispatched',
      );
    }
  }

  /**
   * Resolve which WS channel(s) a Redis pub/sub message should fan out to.
   *
   * A single Redis channel can feed multiple WS channels.
   * E.g. price:MINT123 feeds: coin:MINT123, trades:MINT123, candles:MINT123, holders:MINT123
   */
  private resolveWsChannels(
    redisChannel: string,
    payload: Record<string, unknown>,
  ): string[] {
    // Per-mint dynamic channels
    if (redisChannel.startsWith('price:')) {
      const mint = redisChannel.slice(6);
      const eventType = payload['tradeType'] as string | undefined;

      const channels: string[] = [`coin:${mint}`];
      if (eventType === 'BUY' || eventType === 'SELL') {
        channels.push(`trades:${mint}`, `candles:${mint}`, `holders:${mint}`);
      }
      return channels;
    }

    if (redisChannel.startsWith('graduation:')) {
      const mint = redisChannel.slice(11);
      return [`coin:${mint}`, 'graduation'];
    }

    // Static channels
    const staticMap: Record<string, string[]> = {
      'events:all_trades':      ['market'],
      'events:all_graduations': ['market', 'graduation'],
      'events:coin_created':    ['market'],
      'events:treasury_sweep':  ['treasury'],
      'events:admin_action':    ['admin'],
      'events:indexer':         ['admin'],
    };

    return staticMap[redisChannel] ?? [];
  }

  private resolveEventName(redisChannel: string, payload: Record<string, unknown>): string {
    if (redisChannel.startsWith('price:')) {
      const tradeType = payload['tradeType'];
      if (tradeType === 'BUY') return 'trade_buy';
      if (tradeType === 'SELL') return 'trade_sell';
      return 'price_update';
    }
    if (redisChannel.startsWith('graduation:')) {
      return payload['phase'] === 'completed' ? 'graduation_completed' : 'graduation_initiated';
    }
    const nameMap: Record<string, string> = {
      'events:all_trades':      'market_trade',
      'events:all_graduations': 'market_graduation',
      'events:coin_created':    'coin_created',
      'events:treasury_sweep':  'treasury_sweep',
      'events:admin_action':    'admin_action',
      'events:indexer':         'indexer_event',
    };
    return nameMap[redisChannel] ?? 'update';
  }

  /**
   * Filter the payload to include only fields relevant to the WS channel.
   * Avoids leaking internal indexer fields to clients.
   */
  private filterPayload(wsChannel: string, payload: Record<string, unknown>): Record<string, unknown> {
    const kind = wsChannel.split(':')[0];
    switch (kind) {
      case 'candles':
        return {
          price:       payload['price'],
          solAmount:   payload['solAmount'],
          tokenAmount: payload['tokenAmount'],
          tradeType:   payload['tradeType'],
          slot:        payload['slot'],
          blockTime:   payload['blockTime'],
        };
      case 'holders':
        return {
          tradeType:   payload['tradeType'],
          buyer:       payload['buyer'],
          seller:      payload['seller'],
          tokenAmount: payload['tokenAmount'],
          slot:        payload['slot'],
        };
      default:
        return payload;
    }
  }

  private async nextSeq(wsChannel: string): Promise<number> {
    try {
      return await this.cache.incr(RK.seq(wsChannel));
    } catch {
      // Fallback: use timestamp as seq (non-ideal but safe)
      return Date.now();
    }
  }
}
