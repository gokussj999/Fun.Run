import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Redis } from 'ioredis';

import { EventProcessor } from '../../src/processor/index.js';
import type { ParsedEvent } from '../../src/types.js';
import { RedisDependencyError } from '../../src/config/redis-dependency.js';

function makeLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
}

function makeEvent(name: ParsedEvent['name'], sig: string): ParsedEvent {
  return {
    name,
    signature: sig,
    slot: 100n,
    blockTime: 1700000000,
    data: {} as never,
  };
}

describe('EventProcessor per-event dedup (Sprint 4)', () => {
  let cache: Redis;
  let pubsub: Redis;

  beforeEach(() => {
    cache = {
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      publish: vi.fn().mockResolvedValue(1),
    } as unknown as Redis;
    pubsub = {
      publish: vi.fn().mockResolvedValue(1),
    } as unknown as Redis;
  });

  it('uses per-event dedup keys for different events in same signature', async () => {
    const processor = new EventProcessor(
      { $transaction: vi.fn() } as never,
      cache,
      pubsub,
      makeLogger() as never,
    );

    await processor.processEvent(makeEvent('LiquidityLocked', 'sigABC'));
    await processor.processEvent(makeEvent('MintAuthorityRevoked', 'sigABC'));

    const keys = vi.mocked(cache.set).mock.calls.map((c) => c[0]);
    expect(keys[0]).toContain('LiquidityLocked');
    expect(keys[1]).toContain('MintAuthorityRevoked');
    expect(keys[0]).not.toBe(keys[1]);
  });

  it('throws RedisDependencyError in strict mode when dedup fails', async () => {
    vi.mocked(cache.set).mockRejectedValue(new Error('ECONNREFUSED'));
    const processor = new EventProcessor(
      { $transaction: vi.fn() } as never,
      cache,
      pubsub,
      makeLogger() as never,
      'strict',
    );

    await expect(
      processor.processEvent(makeEvent('LiquidityLocked', 'sigXYZ')),
    ).rejects.toBeInstanceOf(RedisDependencyError);
  });
});
