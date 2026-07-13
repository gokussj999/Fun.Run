import { describe, it, expect, vi } from 'vitest';

import { RedisPublisher } from '../../src/publisher/redis.js';
import { PUBSUB_CHANNELS } from '../../src/constants.js';

describe('RedisPublisher channel wiring (Sprint 5)', () => {
  const published: Array<{ channel: string; payload: unknown }> = [];

  const pubsub = {
    publish: vi.fn(async (channel: string, data: string) => {
      published.push({ channel, payload: JSON.parse(data) });
      return 1;
    }),
  };

  const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() };
  const publisher = new RedisPublisher(pubsub as never, logger as never);

  const WALLET = 'So11111111111111111111111111111111111111112';
  const MINT   = 'HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP';

  it('publishCoinCreated targets events:coin_created', async () => {
    await publisher.publishCoinCreated({
      mint: MINT, creator: WALLET, name: 'Test', symbol: 'TST',
      uri: 'https://x', slot: '1', signature: 'sig1',
    });
    expect(published.some((p) => p.channel === PUBSUB_CHANNELS.coinCreated)).toBe(true);
  });

  it('publishCreatorUpdate targets events:creator:{wallet}', async () => {
    await publisher.publishCreatorUpdate(WALLET, {
      wallet: WALLET, eventType: 'fee_earned', slot: '1', signature: 'sig2',
    });
    expect(published.some((p) => p.channel === PUBSUB_CHANNELS.creator(WALLET))).toBe(true);
  });

  it('publishReferralUpdate targets events:referral:{wallet}', async () => {
    await publisher.publishReferralUpdate(WALLET, {
      wallet: WALLET, eventType: 'fee_earned', slot: '1', signature: 'sig3',
    });
    expect(published.some((p) => p.channel === PUBSUB_CHANNELS.referral(WALLET))).toBe(true);
  });

  it('publishPortfolioUpdate targets events:portfolio:{wallet}', async () => {
    await publisher.publishPortfolioUpdate(WALLET, {
      wallet: WALLET, mint: MINT, tradeType: 'BUY',
      tokenAmount: '100', solAmount: '10', slot: '1', signature: 'sig4',
    });
    expect(published.some((p) => p.channel === PUBSUB_CHANNELS.portfolio(WALLET))).toBe(true);
  });

  it('publishNotification targets events:notifications:{wallet}', async () => {
    await publisher.publishNotification(WALLET, {
      type: 'trade_buy', title: 'Buy', body: 'ok', slot: '1', signature: 'sig5',
    });
    expect(published.some((p) => p.channel === PUBSUB_CHANNELS.notifications(WALLET))).toBe(true);
  });

  it('publishTreasurySweep targets events:treasury_sweep', async () => {
    await publisher.publishTreasurySweep({ amount: '1000', slot: '1', signature: 'sig6' });
    expect(published.some((p) => p.channel === PUBSUB_CHANNELS.treasurySweep)).toBe(true);
  });
});
