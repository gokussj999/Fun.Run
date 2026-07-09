import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocket } from 'ws';

import { ConnectionRegistry } from '../../src/connection/registry.js';
import { ConnectionRateLimiter } from '../../src/rate-limit/limiter.js';

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function makeSocket(overrides: Partial<WebSocket> = {}): WebSocket {
  const messages: string[] = [];
  return {
    readyState:     1, // OPEN
    bufferedAmount: 0,
    send: vi.fn((data: string) => messages.push(data)),
    close:     vi.fn(),
    terminate: vi.fn(),
    on:        vi.fn(),
    ping:      vi.fn(),
    _messages: messages, // test inspection
    ...overrides,
  } as unknown as WebSocket;
}

function makeMockDb() {
  return {
    profile: {
      findUnique: vi.fn().mockResolvedValue({ role: 'USER' }),
    },
  };
}

function makeMockRedis() {
  return {
    set:     vi.fn().mockResolvedValue('OK'),
    get:     vi.fn().mockResolvedValue(null),
    del:     vi.fn().mockResolvedValue(1),
    setex:   vi.fn().mockResolvedValue('OK'),
    incr:    vi.fn().mockResolvedValue(1),
    zadd:    vi.fn().mockResolvedValue(1),
    zrange:  vi.fn().mockResolvedValue([]),
    zrangebyscore: vi.fn().mockResolvedValue([]),
    zremrangebyrank: vi.fn().mockResolvedValue(0),
    expire:  vi.fn().mockResolvedValue(1),
    pipeline: vi.fn().mockReturnValue({
      zadd:            vi.fn().mockReturnThis(),
      zremrangebyrank: vi.fn().mockReturnThis(),
      expire:          vi.fn().mockReturnThis(),
      exec:            vi.fn().mockResolvedValue([]),
    }),
    subscribe:   vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn().mockResolvedValue(undefined),
    on:          vi.fn(),
    ping:        vi.fn().mockResolvedValue('PONG'),
    keys:        vi.fn().mockResolvedValue([]),
  };
}

const makeLogger = () => ({
  info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
});

// ─── ConnectionRegistry ───────────────────────────────────────────────────────

describe('ConnectionRegistry', () => {
  let registry: ConnectionRegistry;

  beforeEach(() => { registry = new ConnectionRegistry(); });

  it('starts empty', () => {
    expect(registry.size).toBe(0);
  });

  it('adds and retrieves a connection', () => {
    const socket = makeSocket();
    const conn = {
      id: 'c1', connectedAt: Date.now(), ipAddress: '1.2.3.4', userAgent: 'test',
      walletAddress: null, role: null, subscriptions: new Set<string>(),
      lastPingSentAt: 0, lastPongAt: 0, isAlive: true,
      isSlowConsumer: false, slowConsumerAt: null,
      messagesSent: 0, messagesReceived: 0, sentSeqs: new Map(),
    };
    registry.add(conn as never, socket);
    expect(registry.size).toBe(1);
    expect(registry.get('c1')).toBe(conn);
    expect(registry.getSocket('c1')).toBe(socket);
  });

  it('removes a connection', () => {
    const socket = makeSocket();
    const conn = {
      id: 'c2', connectedAt: Date.now(), ipAddress: '1.2.3.5', userAgent: 'test',
      walletAddress: null, role: null, subscriptions: new Set<string>(),
      lastPingSentAt: 0, lastPongAt: 0, isAlive: true,
      isSlowConsumer: false, slowConsumerAt: null,
      messagesSent: 0, messagesReceived: 0, sentSeqs: new Map(),
    };
    registry.add(conn as never, socket);
    const removed = registry.remove('c2');
    expect(removed).toBe(conn);
    expect(registry.size).toBe(0);
  });

  it('counts by IP correctly', () => {
    const ip = '10.0.0.1';
    for (let i = 0; i < 3; i++) {
      registry.add({
        id: `c${i}`, connectedAt: Date.now(), ipAddress: ip, userAgent: '',
        walletAddress: null, role: null, subscriptions: new Set<string>(),
        lastPingSentAt: 0, lastPongAt: 0, isAlive: true,
        isSlowConsumer: false, slowConsumerAt: null,
        messagesSent: 0, messagesReceived: 0, sentSeqs: new Map(),
      } as never, makeSocket());
    }
    expect(registry.countByIp(ip)).toBe(3);
  });

  it('associates wallet and indexes by wallet', () => {
    const socket = makeSocket();
    const conn = {
      id: 'cw', connectedAt: Date.now(), ipAddress: '1.1.1.1', userAgent: '',
      walletAddress: null, role: null, subscriptions: new Set<string>(),
      lastPingSentAt: 0, lastPongAt: 0, isAlive: true,
      isSlowConsumer: false, slowConsumerAt: null,
      messagesSent: 0, messagesReceived: 0, sentSeqs: new Map(),
    };
    registry.add(conn as never, socket);
    registry.associateWallet('cw', 'WALLET123');
    const byWallet = registry.getByWallet('WALLET123');
    expect(byWallet).toHaveLength(1);
    expect(byWallet[0]?.walletAddress).toBe('WALLET123');
  });
});

// ─── Failure scenarios ────────────────────────────────────────────────────────

describe('Failure scenarios', () => {
  it('registry remove of unknown id returns undefined', () => {
    const registry = new ConnectionRegistry();
    expect(registry.remove('nonexistent')).toBeUndefined();
  });

  it('registry.getByWallet returns empty array for unknown wallet', () => {
    const registry = new ConnectionRegistry();
    expect(registry.getByWallet('UNKNOWN')).toHaveLength(0);
  });

  it('rate limiter handles many connections independently', () => {
    const limiter = new ConnectionRateLimiter();
    // 100 different connections each sending 1 message — all should pass
    for (let i = 0; i < 100; i++) {
      expect(limiter.check(`conn-${i}`)).toBe(true);
    }
  });
});
