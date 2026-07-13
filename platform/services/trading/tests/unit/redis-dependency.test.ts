import { describe, it, expect } from 'vitest';

import {
  resolveRedisDependencyMode,
  isStrictRedisMode,
  RedisDependencyError,
  redisUnavailablePayload,
} from '../../src/config/redis-dependency.js';

describe('resolveRedisDependencyMode (H-01)', () => {
  it('defaults to degraded when unset', () => {
    expect(resolveRedisDependencyMode({})).toBe('degraded');
  });

  it('accepts strict explicitly', () => {
    expect(resolveRedisDependencyMode({ REDIS_DEPENDENCY_MODE: 'strict' })).toBe('strict');
    expect(resolveRedisDependencyMode({ REDIS_DEPENDENCY_MODE: ' STRICT ' })).toBe('strict');
  });

  it('treats unknown values as degraded', () => {
    expect(resolveRedisDependencyMode({ REDIS_DEPENDENCY_MODE: 'lenient' })).toBe('degraded');
  });

  it('isStrictRedisMode reflects mode', () => {
    expect(isStrictRedisMode('strict')).toBe(true);
    expect(isStrictRedisMode('degraded')).toBe(false);
  });

  it('RedisDependencyError has correct name', () => {
    const err = new RedisDependencyError();
    expect(err.name).toBe('RedisDependencyError');
  });

  it('redisUnavailablePayload includes requestId', () => {
    const payload = redisUnavailablePayload('req-123');
    expect(payload.error).toBe('SERVICE_UNAVAILABLE');
    expect(payload.requestId).toBe('req-123');
  });
});
