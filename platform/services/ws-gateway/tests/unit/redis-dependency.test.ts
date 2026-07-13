import { describe, it, expect } from 'vitest';

import { resolveRedisDependencyMode, isStrictRedisMode } from '../../src/config/redis-dependency.js';

describe('ws-gateway redis dependency (Sprint 4)', () => {
  it('defaults to degraded', () => {
    expect(resolveRedisDependencyMode({})).toBe('degraded');
  });

  it('strict mode is opt-in', () => {
    expect(resolveRedisDependencyMode({ REDIS_DEPENDENCY_MODE: 'strict' })).toBe('strict');
    expect(isStrictRedisMode('degraded')).toBe(false);
  });
});
