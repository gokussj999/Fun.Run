import { describe, it, expect, beforeEach, vi } from 'vitest';

import { EventProcessor } from '../../src/processor/index.js';
import type { ParsedEvent, CoinCreatedData } from '../../src/types.js';

// ─── Mock primitives ─────────────────────────────────────────────────────────

function makeDb(overrides: Record<string, unknown> = {}) {
  return {
    $transaction: vi.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(makeDb())),
    coin: {
      findUnique: vi.fn().mockResolvedValue(null),
      create:     vi.fn().mockResolvedValue({ id: 'coin-1' }),
      update:     vi.fn().mockResolvedValue({}),
    },
    profile: {
      upsert: vi.fn().mockResolvedValue({ walletAddress: 'wallet1' }),
    },
    transaction: {
      create: vi.fn().mockResolvedValue({}),
    },
    holding: {
      upsert: vi.fn().mockResolvedValue({}),
    },
    treasuryEvent: {
      create: vi.fn().mockResolvedValue({}),
    },
    indexerState: {
      upsert: vi.fn().mockResolvedValue({}),
    },
    $queryRaw: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function makeRedis() {
  return {
    set:    vi.fn().mockResolvedValue('OK'),
    get:    vi.fn().mockResolvedValue(null),
    del:    vi.fn().mockResolvedValue(1),
    setex:  vi.fn().mockResolvedValue('OK'),
    publish: vi.fn().mockResolvedValue(1),
  };
}

const makeLogger = () => ({
  info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
});

function makeCoinCreatedEvent(): ParsedEvent {
  return {
    name:      'CoinCreated',
    signature: 'sig_' + Math.random().toString(36).slice(2),
    slot:      100n,
    blockTime: 1700000000,
    data: {
      mint:                 'A'.repeat(44),
      creator:              'B'.repeat(44),
      name:                 'TestCoin',
      symbol:               'TST',
      uri:                  'https://example.com/meta.json',
      virtualSolReserves:   30_000_000_000n,
      virtualTokenReserves: 1_000_000_000_000_000n,
      realTokenReserves:    1_000_000_000_000_000n,
      creationFee:          10_000_000n,
      feeBps:               200,
    } as CoinCreatedData,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('EventProcessor', () => {
  let db: ReturnType<typeof makeDb>;
  let redis: ReturnType<typeof makeRedis>;

  beforeEach(() => {
    db    = makeDb();
    redis = makeRedis();
  });

  describe('idempotency (Redis SET NX)', () => {
    it('processes an event when Redis SET NX succeeds (returns OK)', async () => {
      redis.set.mockResolvedValue('OK');
      const processor = new EventProcessor(db as never, redis as never, makeLogger() as never);
      const event = makeCoinCreatedEvent();
      await processor.processEvent(event);
      // Should have attempted DB writes
      expect(db.$transaction).toHaveBeenCalledOnce();
    });

    it('skips processing when Redis SET NX fails (returns null — already seen)', async () => {
      redis.set.mockResolvedValue(null); // NX condition not met
      const processor = new EventProcessor(db as never, redis as never, makeLogger() as never);
      const event = makeCoinCreatedEvent();
      await processor.processEvent(event);
      expect(db.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('CoinCreated handler — idempotency at DB level', () => {
    it('does not create a duplicate coin if already indexed', async () => {
      redis.set.mockResolvedValue('OK');
      // Simulate coin already existing
      const dbWithExisting = makeDb();
      dbWithExisting.$transaction = vi.fn().mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            ...dbWithExisting,
            coin: {
              findUnique: vi.fn().mockResolvedValue({ id: 'existing-coin' }),
              create:     dbWithExisting.coin.create,
            },
          };
          return fn(tx);
        },
      );

      const processor = new EventProcessor(dbWithExisting as never, redis as never, makeLogger() as never);
      await processor.processEvent(makeCoinCreatedEvent());
      expect(dbWithExisting.coin.create).not.toHaveBeenCalled();
    });
  });

  describe('error recovery', () => {
    it('releases the Redis dedup key when handler throws', async () => {
      redis.set.mockResolvedValue('OK');
      const failDb = makeDb();
      failDb.$transaction = vi.fn().mockRejectedValue(new Error('DB connection lost'));

      const processor = new EventProcessor(failDb as never, redis as never, makeLogger() as never);
      await expect(processor.processEvent(makeCoinCreatedEvent())).rejects.toThrow('DB connection lost');

      // Should have deleted the key so retry can reclaim it
      expect(redis.del).toHaveBeenCalledOnce();
    });
  });

  describe('informational events', () => {
    it('handles LiquidityLocked without DB writes', async () => {
      redis.set.mockResolvedValue('OK');
      const processor = new EventProcessor(db as never, redis as never, makeLogger() as never);
      const event: ParsedEvent = {
        name: 'LiquidityLocked', signature: 'sigX', slot: 1n, blockTime: 0, data: {} as never,
      };
      await expect(processor.processEvent(event)).resolves.toBeUndefined();
      expect(db.$transaction).not.toHaveBeenCalled();
    });
  });
});
