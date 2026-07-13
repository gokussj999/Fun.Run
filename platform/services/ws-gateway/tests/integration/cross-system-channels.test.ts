import { describe, it, expect, vi } from 'vitest';

import { EventDispatcher } from '../../src/redis/dispatcher.js';
import { wsChannelToRedisChannels } from '../../src/constants.js';
import { parseChannel } from '../../src/subscription/channels.js';

const WALLET = 'So11111111111111111111111111111111111111112';

describe('cross-system channel map (Sprint 5)', () => {
  it('ws creator channel maps to events:creator redis channel', () => {
    const redis = wsChannelToRedisChannels(`creator:${WALLET}`);
    expect(redis).toEqual([`events:creator:${WALLET}`]);
  });

  it('ws referral channel maps to events:referral redis channel', () => {
    const redis = wsChannelToRedisChannels(`referral:${WALLET}`);
    expect(redis).toEqual([`events:referral:${WALLET}`]);
  });

  it('ws portfolio channel maps to events:portfolio redis channel', () => {
    const redis = wsChannelToRedisChannels(`portfolio:${WALLET}`);
    expect(redis).toEqual([`events:portfolio:${WALLET}`]);
  });

  it('ws notifications channel maps to events:notifications redis channel', () => {
    const redis = wsChannelToRedisChannels(`notifications:${WALLET}`);
    expect(redis).toEqual([`events:notifications:${WALLET}`]);
  });

  it('parseChannel accepts notifications:{wallet}', () => {
    expect(parseChannel(`notifications:${WALLET}`)?.kind).toBe('notifications');
  });
});

describe('EventDispatcher dynamic routing (Sprint 5)', () => {
  it('routes events:portfolio to portfolio WS channel', async () => {
    const cache = { incr: vi.fn().mockResolvedValue(1) } as never;
    const registry = { getSocket: vi.fn() } as never;
    const subscribers = [{ id: 'c1', sentSeqs: new Map(), messagesSent: 0 }] as never;
    const subs = { getSubscribers: vi.fn().mockReturnValue(subscribers) } as never;

    const dispatcher = new EventDispatcher(
      cache, registry, subs,
      { push: vi.fn() } as never,
      { shouldSend: () => false } as never,
      { debug: vi.fn(), warn: vi.fn() } as never,
    );

    await dispatcher.handleRedisMessage(
      `events:portfolio:${WALLET}`,
      JSON.stringify({ wallet: WALLET, mint: WALLET, tradeType: 'BUY', slot: '1', signature: 's' }),
    );

    expect(subs.getSubscribers).toHaveBeenCalledWith(`portfolio:${WALLET}`);
  });
});
