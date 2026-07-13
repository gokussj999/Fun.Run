import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Redis } from 'ioredis';

import { WorkerLeaderLock } from '../../src/background/leader-lock.js';

function createLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
}

describe('WorkerLeaderLock (H-22)', () => {
  let redis: Redis;
  let logger: ReturnType<typeof createLogger>;

  beforeEach(() => {
    vi.useFakeTimers();
    logger = createLogger();
    redis = {
      get: vi.fn(),
      set: vi.fn(),
      expire: vi.fn(),
      del: vi.fn(),
    } as unknown as Redis;
  });

  it('starts worker when lock is acquired', async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(redis.set).mockResolvedValue('OK');

    const start = vi.fn();
    const stop = vi.fn();
    const lock = new WorkerLeaderLock(redis, logger as never, { instanceId: 'pod-a', ttlSec: 30 });
    lock.supervise('tx-confirmer', start, stop);

    await vi.runOnlyPendingTimersAsync();
    expect(start).toHaveBeenCalledTimes(1);
    expect(stop).not.toHaveBeenCalled();
  });

  it('does not start worker when another pod holds the lock', async () => {
    vi.mocked(redis.get).mockResolvedValue('pod-b');

    const start = vi.fn();
    const stop = vi.fn();
    const lock = new WorkerLeaderLock(redis, logger as never, { instanceId: 'pod-a' });
    lock.supervise('tx-confirmer', start, stop);

    await vi.runOnlyPendingTimersAsync();
    expect(start).not.toHaveBeenCalled();
  });

  it('stops worker when leadership is lost', async () => {
    vi.mocked(redis.get)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('pod-a')
      .mockResolvedValueOnce('pod-b');
    vi.mocked(redis.set).mockResolvedValue('OK');
    vi.mocked(redis.expire).mockResolvedValue(1);

    const start = vi.fn();
    const stop = vi.fn();
    const lock = new WorkerLeaderLock(redis, logger as never, { instanceId: 'pod-a', ttlSec: 30 });
    lock.supervise('tx-confirmer', start, stop);

    await vi.runOnlyPendingTimersAsync();
    expect(start).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(15_000);
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
