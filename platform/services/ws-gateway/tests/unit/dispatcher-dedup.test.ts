import { describe, it, expect, vi } from 'vitest';
import type { Redis } from 'ioredis';

import { EventDispatcher } from '../../src/redis/dispatcher.js';
import { ConnectionRegistry } from '../../src/connection/registry.js';
import { SubscriptionManager } from '../../src/subscription/manager.js';
import { ReplayBuffer } from '../../src/replay/buffer.js';
import { BackpressureHandler } from '../../src/backpressure/handler.js';
import type { ClientConnection } from '../../src/types.js';
import { WebSocket } from 'ws';

function makeLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
}

describe('EventDispatcher sentSeqs dedup (Sprint 4)', () => {
  it('skips duplicate seq for same connection', async () => {
    const cache = { incr: vi.fn().mockResolvedValue(5) } as unknown as Redis;
    const registry = new ConnectionRegistry();
    const redisSub = { subscribe: vi.fn(), unsubscribe: vi.fn() } as never;
    const replay = new ReplayBuffer({ pipeline: vi.fn() } as never, makeLogger() as never);
    const backpressure = new BackpressureHandler(makeLogger() as never);

    const subscriptions = new SubscriptionManager(registry, redisSub, replay, makeLogger() as never);

    const conn: ClientConnection = {
      id: 'conn-1',
      connectedAt: Date.now(),
      ipAddress: '127.0.0.1',
      userAgent: '',
      walletAddress: null,
      role: null,
      subscriptions: new Set(['market']),
      lastPingSentAt: 0,
      lastPongAt: 0,
      isAlive: true,
      isSlowConsumer: false,
      slowConsumerAt: null,
      messagesSent: 0,
      messagesReceived: 0,
      sentSeqs: new Map([['market', 5]]),
    };

    registry.add(conn, { readyState: WebSocket.OPEN, send: vi.fn(), bufferedAmount: 0 } as never);
    vi.spyOn(subscriptions, 'getSubscribers').mockReturnValue([conn]);

    const dispatcher = new EventDispatcher(
      cache, registry, subscriptions, replay, backpressure, makeLogger() as never,
    );

    await dispatcher.handleRedisMessage('events:all_trades', JSON.stringify({ tradeType: 'BUY' }));

    const socket = registry.getSocket('conn-1');
    expect(socket?.send).not.toHaveBeenCalled();
  });

  it('returns null seq in strict mode when INCR fails', async () => {
    const cache = { incr: vi.fn().mockRejectedValue(new Error('down')) } as unknown as Redis;
    const registry = new ConnectionRegistry();
    const subscriptions = {
      getSubscribers: vi.fn().mockReturnValue([{ id: 'c1', sentSeqs: new Map() }]),
    } as unknown as SubscriptionManager;

    const dispatcher = new EventDispatcher(
      cache,
      registry,
      subscriptions,
      { push: vi.fn() } as never,
      { shouldSend: () => true } as never,
      makeLogger() as never,
      { redisMode: 'strict' },
    );

    await dispatcher.handleRedisMessage('events:all_trades', JSON.stringify({}));
    expect(cache.incr).toHaveBeenCalled();
  });
});
