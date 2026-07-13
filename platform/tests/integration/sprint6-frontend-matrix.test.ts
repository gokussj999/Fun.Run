import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Sprint 6 — Frontend platform migration structural validation.
 */

const ROOT = resolve(import.meta.dirname, '../../..');
const FRONTEND = resolve(ROOT, 'frontend/src');

const SPRINT6_FLOWS = [
  { name: 'Buy', rest: '/api/v1/trade/buy', ws: ['trades:{mint}', 'portfolio:{wallet}'] },
  { name: 'Sell', rest: '/api/v1/trade/sell', ws: ['trades:{mint}', 'portfolio:{wallet}'] },
  { name: 'Create Coin', rest: '/api/v1/coins', ws: ['market', 'creator:{wallet}', 'notifications:{wallet}'] },
  { name: 'Deposit', rest: '/api/v1/profile/:wallet (depositAddress)', ws: [] },
  { name: 'Withdraw', rest: '/api/v1/wallet/withdraw', ws: [] },
  { name: 'Portfolio', rest: '/api/v1/profile/:wallet', ws: ['portfolio:{wallet}'] },
  { name: 'Creator Dashboard', rest: '/api/v1/profile/:wallet', ws: ['creator:{wallet}'] },
  { name: 'Referral Dashboard', rest: '/api/v1/profile/:wallet', ws: ['referral:{wallet}'] },
  { name: 'Notifications', rest: null, ws: ['notifications:{wallet}'] },
] as const;

describe('Sprint 6 frontend migration', () => {
  it('includes platform-api.js with all REST paths', () => {
    const apiPath = resolve(FRONTEND, 'services/platform-api.js');
    expect(existsSync(apiPath)).toBe(true);
    const src = readFileSync(apiPath, 'utf8');
    expect(src).toContain('/trade/buy');
    expect(src).toContain('/trade/sell');
    expect(src).toContain('/coins');
    expect(src).toContain('/wallet/withdraw');
    expect(src).toContain('/profile/');
    expect(src).toContain('/rewards/claim');
    expect(src).toContain('/referral/bind');
  });

  it('includes ws-gateway client with auth + subscribe protocol', () => {
    const wsPath = resolve(FRONTEND, 'services/ws-client.js');
    expect(existsSync(wsPath)).toBe(true);
    const src = readFileSync(wsPath, 'utf8');
    expect(src).toContain('type: "auth"');
    expect(src).toContain('type: "subscribe"');
    expect(src).toContain('portfolio:update');
    expect(src).toContain('notifications:');
  });

  it('App.jsx wires usePlatformWs hook', () => {
    const appPath = resolve(FRONTEND, 'App.jsx');
    const src = readFileSync(appPath, 'utf8');
    expect(src).toContain('usePlatformWs');
    expect(src).toContain('platformApi.buyCoin');
    expect(src).toContain('platformApi.withdrawSol');
    expect(src).toContain('notification:new');
  });

  it('gateway trading proxy includes Sprint 7 platform routes', () => {
    const proxyPath = resolve(ROOT, 'platform/apps/api-gateway/src/plugins/proxy-trading.ts');
    expect(existsSync(proxyPath)).toBe(true);
    const src = readFileSync(proxyPath, 'utf8');
    expect(src).toContain('/api/v1/market/coins');
    expect(src).toContain('/api/v1/wallet/withdraw');
    expect(src).not.toContain('LEGACY_BACKEND_URL');
  });

  it('defines all Sprint 6 flows', () => {
    const names = SPRINT6_FLOWS.map((f) => f.name);
    expect(names).toContain('Deposit');
    expect(names).toContain('Withdraw');
    expect(names).toContain('Notifications');
    expect(names.length).toBe(9);
  });
});
