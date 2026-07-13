import { describe, it, expect } from 'vitest';

import {
  resolveRequireTradeIdempotencyKey,
  resolveWorkerLeaderElection,
} from '../../src/config/trading-hardening.js';

describe('trading hardening flags (Sprint 3)', () => {
  it('REQUIRE_TRADE_IDEMPOTENCY_KEY defaults false (H-02 backward compat)', () => {
    expect(resolveRequireTradeIdempotencyKey({})).toBe(false);
    expect(resolveRequireTradeIdempotencyKey({ REQUIRE_TRADE_IDEMPOTENCY_KEY: 'false' })).toBe(false);
  });

  it('REQUIRE_TRADE_IDEMPOTENCY_KEY=true enables mandatory key', () => {
    expect(resolveRequireTradeIdempotencyKey({ REQUIRE_TRADE_IDEMPOTENCY_KEY: 'true' })).toBe(true);
  });

  it('WORKER_LEADER_ELECTION defaults true (H-22)', () => {
    expect(resolveWorkerLeaderElection({})).toBe(true);
  });

  it('WORKER_LEADER_ELECTION=false disables leader election', () => {
    expect(resolveWorkerLeaderElection({ WORKER_LEADER_ELECTION: 'false' })).toBe(false);
  });
});
