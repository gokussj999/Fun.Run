import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ConnectionRateLimiter } from '../../src/rate-limit/limiter.js';
import { RATE_LIMIT_MESSAGES_PER_SECOND } from '../../src/constants.js';

describe('ConnectionRateLimiter', () => {
  let limiter: ConnectionRateLimiter;

  beforeEach(() => { limiter = new ConnectionRateLimiter(); });

  it('allows messages up to the limit', () => {
    for (let i = 0; i < RATE_LIMIT_MESSAGES_PER_SECOND; i++) {
      expect(limiter.check('conn-1')).toBe(true);
    }
  });

  it('rejects the message that exceeds the limit', () => {
    for (let i = 0; i < RATE_LIMIT_MESSAGES_PER_SECOND; i++) {
      limiter.check('conn-1');
    }
    expect(limiter.check('conn-1')).toBe(false);
  });

  it('counts independently per connection', () => {
    for (let i = 0; i < RATE_LIMIT_MESSAGES_PER_SECOND; i++) {
      limiter.check('conn-1');
    }
    // conn-2 should still be OK
    expect(limiter.check('conn-2')).toBe(true);
  });

  it('resets after the window expires', () => {
    const realNow = Date.now;
    let fakeNow = 1_000_000;

    vi.spyOn(Date, 'now').mockImplementation(() => fakeNow);

    // Fill up conn-1
    for (let i = 0; i < RATE_LIMIT_MESSAGES_PER_SECOND; i++) limiter.check('conn-1');
    expect(limiter.check('conn-1')).toBe(false);

    // Advance time past window
    fakeNow += 1001;
    expect(limiter.check('conn-1')).toBe(true);

    vi.restoreAllMocks();
  });

  it('removes a connection cleanly', () => {
    limiter.check('conn-1');
    limiter.remove('conn-1');
    expect(limiter.getCount('conn-1')).toBe(0);
  });

  it('returns 0 count for unknown connection', () => {
    expect(limiter.getCount('never-seen')).toBe(0);
  });
});
