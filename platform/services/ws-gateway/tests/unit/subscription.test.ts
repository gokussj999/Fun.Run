import { describe, it, expect, vi, beforeEach } from 'vitest';

import { validateSubscription } from '../../src/subscription/validator.js';
import type { ClientConnection, ParsedChannel, UserRole } from '../../src/types.js';

function makeConn(overrides: Partial<ClientConnection> = {}): ClientConnection {
  return {
    id:             'conn-1',
    connectedAt:    Date.now(),
    ipAddress:      '127.0.0.1',
    userAgent:      'test',
    walletAddress:  null,
    role:           null,
    subscriptions:  new Set(),
    lastPingSentAt: Date.now(),
    lastPongAt:     Date.now(),
    isAlive:        true,
    isSlowConsumer: false,
    slowConsumerAt: null,
    messagesSent:   0,
    messagesReceived: 0,
    sentSeqs:       new Map(),
    ...overrides,
  };
}

const WALLET_A = 'So11111111111111111111111111111111111111112';
const WALLET_B = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

describe('validateSubscription', () => {
  describe('requiresAuth: none (market, coin, trades, candles, holders, graduation)', () => {
    const publicChannels: ParsedChannel[] = [
      { kind: 'market',     raw: 'market' },
      { kind: 'coin',       param: WALLET_A, raw: `coin:${WALLET_A}` },
      { kind: 'trades',     param: WALLET_A, raw: `trades:${WALLET_A}` },
      { kind: 'candles',    param: WALLET_A, raw: `candles:${WALLET_A}` },
      { kind: 'holders',    param: WALLET_A, raw: `holders:${WALLET_A}` },
      { kind: 'graduation', raw: 'graduation' },
    ];

    for (const ch of publicChannels) {
      it(`allows unauthenticated access to ${ch.raw}`, () => {
        const result = validateSubscription(makeConn(), ch);
        expect(result.ok).toBe(true);
      });

      it(`allows authenticated access to ${ch.raw}`, () => {
        const result = validateSubscription(makeConn({ walletAddress: WALLET_A, role: 'USER' }), ch);
        expect(result.ok).toBe(true);
      });
    }
  });

  describe('requiresAuth: own (creator, referral, portfolio)', () => {
    const ownChannels: ParsedChannel[] = [
      { kind: 'creator',   param: WALLET_A, raw: `creator:${WALLET_A}` },
      { kind: 'referral',  param: WALLET_A, raw: `referral:${WALLET_A}` },
      { kind: 'portfolio', param: WALLET_A, raw: `portfolio:${WALLET_A}` },
    ];

    for (const ch of ownChannels) {
      it(`rejects unauthenticated access to ${ch.raw}`, () => {
        const result = validateSubscription(makeConn(), ch);
        expect(result.ok).toBe(false);
        expect((result as { code: string }).code).toBe('CHANNEL_REQUIRES_AUTH');
      });

      it(`rejects wrong wallet access to ${ch.raw}`, () => {
        const result = validateSubscription(makeConn({ walletAddress: WALLET_B, role: 'USER' }), ch);
        expect(result.ok).toBe(false);
        expect((result as { code: string }).code).toBe('FORBIDDEN');
      });

      it(`allows own wallet access to ${ch.raw}`, () => {
        const result = validateSubscription(makeConn({ walletAddress: WALLET_A, role: 'USER' }), ch);
        expect(result.ok).toBe(true);
      });

      it(`allows ADMIN access to any ${ch.kind} channel`, () => {
        const result = validateSubscription(makeConn({ walletAddress: WALLET_B, role: 'ADMIN' }), ch);
        expect(result.ok).toBe(true);
      });

      it(`allows SUPER_ADMIN access to any ${ch.kind} channel`, () => {
        const result = validateSubscription(makeConn({ walletAddress: WALLET_B, role: 'SUPER_ADMIN' }), ch);
        expect(result.ok).toBe(true);
      });
    }
  });

  describe('requiresAuth: admin (treasury, admin)', () => {
    const adminChannels: ParsedChannel[] = [
      { kind: 'treasury', raw: 'treasury' },
      { kind: 'admin',    raw: 'admin' },
    ];

    for (const ch of adminChannels) {
      it(`rejects unauthenticated access to ${ch.raw}`, () => {
        const result = validateSubscription(makeConn(), ch);
        expect(result.ok).toBe(false);
      });

      it(`rejects USER access to ${ch.raw}`, () => {
        const result = validateSubscription(makeConn({ walletAddress: WALLET_A, role: 'USER' }), ch);
        expect(result.ok).toBe(false);
        expect((result as { code: string }).code).toBe('FORBIDDEN');
      });

      it(`rejects MODERATOR access to ${ch.raw}`, () => {
        const result = validateSubscription(makeConn({ walletAddress: WALLET_A, role: 'MODERATOR' }), ch);
        expect(result.ok).toBe(false);
      });

      it(`allows ADMIN access to ${ch.raw}`, () => {
        const result = validateSubscription(makeConn({ walletAddress: WALLET_A, role: 'ADMIN' }), ch);
        expect(result.ok).toBe(true);
      });

      it(`allows SUPER_ADMIN access to ${ch.raw}`, () => {
        const result = validateSubscription(makeConn({ walletAddress: WALLET_A, role: 'SUPER_ADMIN' }), ch);
        expect(result.ok).toBe(true);
      });
    }
  });
});
