import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Redis } from 'ioredis';

import { IdempotencyStore } from '../../src/idempotency/store.js';
import { RedisDependencyError } from '../../src/config/redis-dependency.js';

function createLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
}

describe('IdempotencyStore strict mode (H-01)', () => {
  let redis: Redis;
  let logger: ReturnType<typeof createLogger>;

  beforeEach(() => {
    logger = createLogger();
    redis = {
      set: vi.fn(),
      get: vi.fn(),
      del: vi.fn(),
    } as unknown as Redis;
  });

  it('fails open on acquire error in degraded mode', async () => {
    vi.mocked(redis.set).mockRejectedValue(new Error('ECONNREFUSED'));
    const store = new IdempotencyStore(redis, logger as never, 'degraded');
    await expect(store.acquire('key-abc12345')).resolves.toBe(true);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('throws RedisDependencyError on acquire error in strict mode', async () => {
    vi.mocked(redis.set).mockRejectedValue(new Error('ECONNREFUSED'));
    const store = new IdempotencyStore(redis, logger as never, 'strict');
    await expect(store.acquire('key-abc12345')).rejects.toBeInstanceOf(RedisDependencyError);
    expect(logger.error).toHaveBeenCalled();
  });

  it('returns false when another caller holds the lock', async () => {
    vi.mocked(redis.set).mockResolvedValue(null);
    const store = new IdempotencyStore(redis, logger as never, 'strict');
    await expect(store.acquire('key-abc12345')).resolves.toBe(false);
  });
});
