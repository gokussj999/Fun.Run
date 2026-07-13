import { describe, it, expect } from 'vitest';

import {
  resolveRedisDependencyMode,
  isStrictRedisMode,
} from '../../src/config/redis-dependency.js';
import { resolveWorkerLeaderElection } from '../../src/config/indexer-hardening.js';

describe('indexer hardening config (Sprint 4)', () => {
  it('REDIS_DEPENDENCY_MODE defaults to degraded', () => {
    expect(resolveRedisDependencyMode({})).toBe('degraded');
  });

  it('REDIS_DEPENDENCY_MODE=strict enables fail-closed', () => {
    expect(resolveRedisDependencyMode({ REDIS_DEPENDENCY_MODE: 'strict' })).toBe('strict');
    expect(isStrictRedisMode('strict')).toBe(true);
  });

  it('WORKER_LEADER_ELECTION defaults true', () => {
    expect(resolveWorkerLeaderElection({})).toBe(true);
  });
});
