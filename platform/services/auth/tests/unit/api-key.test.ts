import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ApiKeyManager } from '../../src/api-keys/manager.js';
import { verifyKeyHash } from '../../src/api-keys/store.js';

const store = new Map<string, { value: string; expiry: number | null }>();

const mockRedis = {
  get: vi.fn(async (key: string) => store.get(key)?.value ?? null),
  set: vi.fn(async (key: string, value: string, ...args: unknown[]) => {
    const exIdx = (args as string[]).indexOf('EX');
    const expiry = exIdx >= 0 ? Date.now() + Number((args as unknown[])[exIdx + 1]) * 1000 : null;
    store.set(key, { value, expiry });
    return 'OK';
  }),
  del: vi.fn(async (key: string) => { store.delete(key); return 1; }),
  sadd: vi.fn(async () => 1),
  srem: vi.fn(async () => 1),
  smembers: vi.fn(async (key: string) => {
    if (!key.startsWith('auth:api_key_wallet:')) return [];
    return [...store.entries()]
      .filter(([k]) => k.startsWith('auth:api_key:id:'))
      .map(([, v]) => JSON.parse(v.value).id as string);
  }),
  expire: vi.fn(async () => 1),
  pipeline: vi.fn(() => {
    const pipe = {
      set: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      sadd: vi.fn().mockReturnThis(),
      del: vi.fn().mockReturnThis(),
      srem: vi.fn().mockReturnThis(),
      exec: vi.fn(async () => []),
    };
    pipe.set.mockImplementation(async (key: string, value: string, ...args: unknown[]) => {
      await mockRedis.set(key, value, ...args);
      return pipe;
    });
    pipe.sadd.mockImplementation(async (key: string, member: string) => {
      await mockRedis.sadd(key, member);
      return pipe;
    });
    pipe.expire.mockReturnValue(pipe);
    pipe.del.mockImplementation(async (key: string) => {
      await mockRedis.del(key);
      return pipe;
    });
    return pipe;
  }),
} as unknown as import('ioredis').default;

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as never;

describe('ApiKeyManager (C-06, C-07)', () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
  });

  it('creates and validates API key from Redis store', async () => {
    const manager = new ApiKeyManager(mockRedis, logger);
    const created = await manager.create({
      name: 'test-key',
      walletAddress: 'Wallet1111111111111111111111111111111111111',
      role: 'CREATOR',
      permissions: ['coin:create'],
    });

    expect(created.key.startsWith('fr_')).toBe(true);

    const validated = await manager.validate(created.key);
    expect(validated.walletAddress).toBe('Wallet1111111111111111111111111111111111111');
    expect(validated.role).toBe('CREATOR');
  });

  it('verifyKeyHash uses timing-safe comparison', () => {
    const hash = 'a'.repeat(64);
    expect(verifyKeyHash(hash, hash)).toBe(true);
    expect(verifyKeyHash(hash, 'b'.repeat(64))).toBe(false);
  });
});
