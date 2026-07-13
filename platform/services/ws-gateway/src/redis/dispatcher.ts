import type { Redis } from 'ioredis';
import type { Logger } from '@funrun/logger';
import { WebSocket } from 'ws';

import type { EventMessage, ReplayEntry } from '../types.js';
import { ConnectionRegistry } from '../connection/registry.js';
import { SubscriptionManager } from '../subscription/manager.js';
import { ReplayBuffer } from '../replay/buffer.js';
import { BackpressureHandler } from '../backpressure/handler.js';
import { RK } from '../constants.js';
import { isStrictRedisMode, type RedisDependencyMode } from '../config/redis-dependency.js';

export interface EventDispatcherOptions {
  redisMode?: RedisDependencyMode;
}

/**
 * EventDispatcher bridges Redis pub/sub → WS clients.
 * Per-channel seq via Redis INCR; per-connection sentSeqs dedup (Sprint 4).
 */
export class EventDispatcher {
  private readonly redisMode: RedisDependencyMode;

  constructor(
    private readonly cache: Redis,
    private readonly registry: ConnectionRegistry,
    private readonly subscriptions: SubscriptionManager,
    private readonly replayBuffer: ReplayBuffer,
    private readonly backpressure: BackpressureHandler,
    private readonly logger: Logger,
    opts: EventDispatcherOptions = {},
  ) {
    this.redisMode = opts.redisMode ?? 'degraded';
  }

  async handleRedisMessage(redisChannel: string, rawData: string): Promise<void> {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawData) as Record<string, unknown>;
    } catch {
      this.logger.warn({ redisChannel }, 'Dispatcher: invalid JSON from Redis');
      return;
    }

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

    const seq = await this.nextSeq(wsChannel);
    if (seq === null) return;

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

    const replayEntry: ReplayEntry = { seq, ts, event: eventName, data: msg.data };
    void this.replayBuffer.push(wsChannel, seq, replayEntry);

    let sent = 0;
    for (const conn of subscribers) {
      const lastSent = conn.sentSeqs.get(wsChannel) ?? 0;
      if (seq <= lastSent) continue;

      const socket = this.registry.getSocket(conn.id);
      if (!socket || socket.readyState !== WebSocket.OPEN) continue;

      if (!this.backpressure.shouldSend(conn, socket)) continue;

      try {
        socket.send(json, { compress: true });
        conn.sentSeqs.set(wsChannel, seq);
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

  private resolveWsChannels(
    redisChannel: string,
    payload: Record<string, unknown>,
  ): string[] {
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

    if (redisChannel.startsWith('events:creator:')) {
      const wallet = redisChannel.slice('events:creator:'.length);
      return [`creator:${wallet}`];
    }

    if (redisChannel.startsWith('events:referral:')) {
      const wallet = redisChannel.slice('events:referral:'.length);
      return [`referral:${wallet}`];
    }

    if (redisChannel.startsWith('events:portfolio:')) {
      const wallet = redisChannel.slice('events:portfolio:'.length);
      return [`portfolio:${wallet}`];
    }

    if (redisChannel.startsWith('events:notifications:')) {
      const wallet = redisChannel.slice('events:notifications:'.length);
      return [`notifications:${wallet}`];
    }

    const staticMap: Record<string, string[]> = {
      'events:all_trades':      ['market'],
      'events:all_graduations': ['market', 'graduation'],
      'events:coin_created':    ['market'],
      'events:treasury_sweep':  ['treasury'],
      'events:fee_claimed':     ['admin'],
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
    if (redisChannel.startsWith('events:creator:')) {
      return String(payload['eventType'] ?? 'creator_update');
    }
    if (redisChannel.startsWith('events:referral:')) {
      return String(payload['eventType'] ?? 'referral_update');
    }
    if (redisChannel.startsWith('events:portfolio:')) {
      return 'portfolio_updated';
    }
    if (redisChannel.startsWith('events:notifications:')) {
      return String(payload['type'] ?? 'notification');
    }
    const nameMap: Record<string, string> = {
      'events:all_trades':      'market_trade',
      'events:all_graduations': 'market_graduation',
      'events:coin_created':    'coin_created',
      'events:treasury_sweep':  'treasury_sweep',
      'events:fee_claimed':     'fee_claimed',
      'events:admin_action':    'admin_action',
      'events:indexer':         'indexer_event',
    };
    return nameMap[redisChannel] ?? 'update';
  }

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
      case 'portfolio':
        return {
          mint:        payload['mint'],
          tradeType:   payload['tradeType'],
          tokenAmount: payload['tokenAmount'],
          solAmount:   payload['solAmount'],
          slot:        payload['slot'],
          signature:   payload['signature'],
        };
      case 'notifications':
        return {
          type:      payload['type'],
          title:     payload['title'],
          body:      payload['body'],
          mint:      payload['mint'],
          slot:      payload['slot'],
          signature: payload['signature'],
        };
      case 'creator':
      case 'referral':
        return {
          eventType: payload['eventType'],
          mint:      payload['mint'],
          amount:    payload['amount'],
          tradeType: payload['tradeType'],
          slot:      payload['slot'],
          signature: payload['signature'],
        };
      default:
        return payload;
    }
  }

  private async nextSeq(wsChannel: string): Promise<number | null> {
    try {
      return await this.cache.incr(RK.seq(wsChannel));
    } catch (err) {
      if (isStrictRedisMode(this.redisMode)) {
        this.logger.error({ err, wsChannel }, 'Dispatcher: seq INCR failed in strict mode — dropping event');
        return null;
      }
      this.logger.warn({ err, wsChannel }, 'Dispatcher: seq INCR failed, using timestamp fallback');
      return Date.now();
    }
  }
}
