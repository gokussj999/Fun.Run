import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Redis } from 'ioredis';

import { RedisSubscriber } from '../../src/redis/subscriber.js';

function makeLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
}

describe('RedisSubscriber reconnect (Sprint 4)', () => {
  let redis: Redis;
  let readyHandler: (() => void) | null = null;

  beforeEach(() => {
    readyHandler = null;
    redis = {
      on: vi.fn((event: string, handler: () => void) => {
        if (event === 'ready') readyHandler = handler;
      }),
      subscribe: vi.fn().mockResolvedValue(1),
      unsubscribe: vi.fn().mockResolvedValue(1),
    } as unknown as Redis;
  });

  it('resubscribes active channels on ready event', async () => {
    const sub = new RedisSubscriber(redis, makeLogger() as never);
    await sub.subscribe('price:MINT1');
    await sub.subscribe('events:all_trades');

    expect(readyHandler).not.toBeNull();
    await readyHandler!();

    expect(redis.subscribe).toHaveBeenCalledWith('price:MINT1', 'events:all_trades');
  });
});
