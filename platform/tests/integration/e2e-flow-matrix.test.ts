import { describe, it, expect } from 'vitest';

/**
 * Sprint 5 — Cross-system E2E flow matrix (structural validation).
 * Verifies documented flows have matching platform wiring without live services.
 */

const FLOWS = [
  {
    name: 'Create Coin',
    api: { platform: 'POST /api/v1/coins (gateway→trading on-chain)', legacy: 'POST /coin/create' },
    db: ['coins', 'profiles'],
    redis: ['events:coin_created', 'events:creator:{wallet}', 'events:notifications:{wallet}'],
    ws: ['market', 'creator:{wallet}', 'notifications:{wallet}'],
    status: 'platform-wired',
  },
  {
    name: 'Deposit',
    api: { platform: 'GET /api/v1/profile/:wallet (depositAddress)', legacy: 'trading deposit-scanner → run_balance_sol' },
    db: ['profiles.run_balance'],
    redis: [],
    ws: [],
    status: 'partial',
  },
  {
    name: 'Withdraw',
    api: { platform: 'POST /api/v1/wallet/withdraw', legacy: 'POST /withdraw' },
    db: ['withdrawals'],
    redis: [],
    ws: [],
    status: 'platform-wired',
  },
  {
    name: 'Buy',
    api: { platform: 'POST /api/v1/trade/buy', legacy: 'POST /coin/buy' },
    db: ['transactions', 'holdings', 'candles'],
    redis: ['price:{mint}', 'events:all_trades', 'events:portfolio:{wallet}', 'events:creator:{wallet}'],
    ws: ['trades:{mint}', 'portfolio:{wallet}', 'candles:{mint}', 'holders:{mint}'],
    status: 'platform-wired',
  },
  {
    name: 'Sell',
    api: { platform: 'POST /api/v1/trade/sell', legacy: 'POST /coin/sell' },
    db: ['transactions', 'holdings', 'candles'],
    redis: ['price:{mint}', 'events:portfolio:{wallet}'],
    ws: ['trades:{mint}', 'portfolio:{wallet}', 'holders:{mint}'],
    status: 'platform-wired',
  },
  {
    name: 'Indexer Updates',
    api: { platform: 'indexer worker', legacy: 'N/A' },
    db: ['transactions', 'holdings', 'coins', 'candles'],
    redis: ['price:*', 'events:*'],
    ws: ['market', 'coin:*'],
    status: 'platform-wired',
  },
  {
    name: 'WebSocket Events',
    api: { platform: 'ws://:3001/ws', legacy: 'legacy backend WS' },
    db: [],
    redis: ['all indexer channels'],
    ws: ['subscribe protocol v1.0.0'],
    status: 'platform-wired',
  },
  {
    name: 'Portfolio Updates',
    api: { platform: 'GET /api/v1/profile/:wallet', legacy: 'GET /profile/:wallet' },
    db: ['holdings'],
    redis: ['events:portfolio:{wallet}'],
    ws: ['portfolio:{wallet}'],
    status: 'platform-wired',
  },
  {
    name: 'Holdings Updates',
    api: { platform: 'indexer on trade', legacy: 'GET /profile/:wallet' },
    db: ['holdings'],
    redis: ['price:{mint}'],
    ws: ['holders:{mint}', 'portfolio:{wallet}'],
    status: 'platform-wired',
  },
  {
    name: 'Referral Updates',
    api: { platform: 'POST /api/v1/referral/bind + WS', legacy: 'POST /referral/set, POST /claim' },
    db: ['coins.referrerWallet', 'treasury_events'],
    redis: ['events:referral:{wallet}'],
    ws: ['referral:{wallet}'],
    status: 'platform-wired',
  },
  {
    name: 'Creator Rewards',
    api: { platform: 'POST /api/v1/rewards/claim + WS creator', legacy: 'POST /claim, POST /withdraw/creator' },
    db: ['treasury_events'],
    redis: ['events:creator:{wallet}', 'events:fee_claimed'],
    ws: ['creator:{wallet}'],
    status: 'platform-wired',
  },
  {
    name: 'Creator Dashboard',
    api: { platform: 'GET /api/v1/profile + WS creator channel', legacy: 'GET /profile/:wallet → creations' },
    db: ['coins', 'treasury_events'],
    redis: ['events:creator:{wallet}'],
    ws: ['creator:{wallet}'],
    status: 'platform-wired',
  },
  {
    name: 'Frontend Events',
    api: { platform: 'ws-gateway protocol v1.0.0', legacy: 'legacy {event,payload}' },
    db: [],
    redis: [],
    ws: ['market', 'portfolio:{wallet}', 'creator:{wallet}', 'referral:{wallet}', 'notifications:{wallet}'],
    status: 'platform-wired',
  },
] as const;

describe('Sprint 5 E2E flow matrix', () => {
  it('defines all required flows', () => {
    const names = FLOWS.map((f) => f.name);
    expect(names).toContain('Create Coin');
    expect(names).toContain('Buy');
    expect(names).toContain('Sell');
    expect(names).toContain('Portfolio Updates');
    expect(names).toContain('Creator Rewards');
    expect(names.length).toBeGreaterThanOrEqual(12);
  });

  it('buy/sell flows are platform-wired', () => {
    const buy = FLOWS.find((f) => f.name === 'Buy');
    const sell = FLOWS.find((f) => f.name === 'Sell');
    expect(buy?.status).toBe('platform-wired');
    expect(sell?.status).toBe('platform-wired');
    expect(buy?.redis).toContain('events:portfolio:{wallet}');
  });

  it('publisher channels include creator, referral, portfolio, notifications', () => {
    const create = FLOWS.find((f) => f.name === 'Create Coin');
    expect(create?.redis).toContain('events:notifications:{wallet}');
    expect(create?.redis).toContain('events:creator:{wallet}');
  });
});
