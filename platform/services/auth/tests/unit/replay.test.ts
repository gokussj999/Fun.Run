import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ReplayProtection, ReplayError } from '../../src/middleware/replay.js';

function makeRedis(existingNonce = false) {
  return {
    set: vi.fn().mockResolvedValue(existingNonce ? null : 'OK'),
    get: vi.fn(),
  } as unknown as import('ioredis').default;
}

function makeLogger() {
  return { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() } as unknown as import('@funrun/logger').Logger;
}

describe('ReplayProtection.validateAndConsume', () => {
  it('accepts a fresh nonce', async () => {
    const redis = makeRedis(false);
    const rp = new ReplayProtection(redis, makeLogger());

    await expect(rp.validateAndConsume('fresh-nonce-abcdef123456')).resolves.toBeUndefined();
    expect(redis.set).toHaveBeenCalledOnce();
  });

  it('rejects a replayed nonce (Redis SET NX returns null)', async () => {
    const redis = makeRedis(true); // null → already exists
    const rp = new ReplayProtection(redis, makeLogger());

    await expect(rp.validateAndConsume('already-used-nonce')).rejects.toBeInstanceOf(ReplayError);
  });

  it('rejects empty nonce', async () => {
    const rp = new ReplayProtection(makeRedis(), makeLogger());
    await expect(rp.validateAndConsume('')).rejects.toBeInstanceOf(ReplayError);
  });

  it('rejects nonce exceeding max length', async () => {
    const rp = new ReplayProtection(makeRedis(), makeLogger());
    const longNonce = 'a'.repeat(65);
    await expect(rp.validateAndConsume(longNonce)).rejects.toBeInstanceOf(ReplayError);
  });

  it('uses correct Redis key prefix for svc', async () => {
    const redis = makeRedis(false);
    const rp = new ReplayProtection(redis, makeLogger());
    await rp.validateAndConsume('test-nonce-xyz', 'svc');
    expect((redis.set as ReturnType<typeof vi.fn>).mock.calls[0]![0]).toMatch(/auth:svc_nonce:/);
  });

  it('uses correct Redis key prefix for api-key', async () => {
    const redis = makeRedis(false);
    const rp = new ReplayProtection(redis, makeLogger());
    await rp.validateAndConsume('test-nonce-xyz', 'api-key');
    expect((redis.set as ReturnType<typeof vi.fn>).mock.calls[0]![0]).toMatch(/auth:nonce:/);
  });
});

describe('ReplayProtection.validateTimestamp', () => {
  it('accepts a timestamp within tolerance', () => {
    const rp = new ReplayProtection(makeRedis(), makeLogger());
    const now = new Date().toISOString();
    expect(() => rp.validateTimestamp(now, 30_000)).not.toThrow();
  });

  it('rejects a timestamp older than tolerance', () => {
    const rp = new ReplayProtection(makeRedis(), makeLogger());
    const old = new Date(Date.now() - 60_000).toISOString(); // 60s ago
    expect(() => rp.validateTimestamp(old, 30_000)).toThrow(ReplayError);
  });

  it('rejects a future timestamp beyond tolerance', () => {
    const rp = new ReplayProtection(makeRedis(), makeLogger());
    const future = new Date(Date.now() + 60_000).toISOString(); // 60s in future
    expect(() => rp.validateTimestamp(future, 30_000)).toThrow(ReplayError);
  });

  it('rejects invalid timestamp string', () => {
    const rp = new ReplayProtection(makeRedis(), makeLogger());
    expect(() => rp.validateTimestamp('not-a-date', 30_000)).toThrow(ReplayError);
  });

  it('ReplayError has correct code', () => {
    try {
      new ReplayProtection(makeRedis(), makeLogger()).validateTimestamp('bad', 30_000);
    } catch (e) {
      expect(e).toBeInstanceOf(ReplayError);
      expect((e as ReplayError).code).toBe('REPLAY_ATTACK');
      expect((e as ReplayError).statusCode).toBe(400);
    }
  });
});
