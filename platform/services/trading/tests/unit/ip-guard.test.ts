import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Redis } from 'ioredis';

import { IpGuard } from '../../src/auth/ip-guard.js';
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

describe('IpGuard strict mode (H-01)', () => {
  let redis: Redis;
  let logger: ReturnType<typeof createLogger>;

  beforeEach(() => {
    logger = createLogger();
    redis = {
      get: vi.fn(),
      incr: vi.fn(),
      expire: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    } as unknown as Redis;
  });

  it('fails open when Redis is down in degraded mode', async () => {
    vi.mocked(redis.get).mockRejectedValue(new Error('down'));
    const guard = new IpGuard(redis, logger as never, 'degraded');
    await expect(guard.isBlocked('1.2.3.4')).resolves.toBe(false);
  });

  it('throws RedisDependencyError in strict mode', async () => {
    vi.mocked(redis.get).mockRejectedValue(new Error('down'));
    const guard = new IpGuard(redis, logger as never, 'strict');
    await expect(guard.isBlocked('1.2.3.4')).rejects.toBeInstanceOf(RedisDependencyError);
  });

  it('returns true when IP block key exists', async () => {
    vi.mocked(redis.get).mockResolvedValue('1');
    const guard = new IpGuard(redis, logger as never, 'strict');
    await expect(guard.isBlocked('1.2.3.4')).resolves.toBe(true);
  });
});
