/**
 * Sprint 2 Task — RBAC route enforcement integration tests (H-07).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';

import { ForbiddenError } from '@funrun/shared';

vi.mock('../../src/privy/client.js', () => ({
  getPrivyClient: () => ({}),
  createPrivyClient: () => ({}),
  resetPrivyClient: vi.fn(),
}));

const mockProfile = {
  walletAddress: 'TestWallet111111111111111111111111111111111',
  privyUserId: 'did:privy:test123',
  role: 'USER' as const,
  isBanned: false,
};

vi.mock('../../src/privy/verify.js', () => ({
  extractBearerToken: (h: string | undefined) => {
    if (!h || !h.startsWith('Bearer ')) return null;
    return h.slice(7);
  },
  verifyPrivyToken: vi.fn().mockResolvedValue({
    claims: {
      userId: 'did:privy:test123',
      appId: 'test-app',
      sessionId: 'privy-sess-abc',
      issuedAt: Math.floor(Date.now() / 1000) - 10,
      expiration: Math.floor(Date.now() / 1000) + 900,
      linkedAccounts: [],
    },
    solanaWallet: mockProfile.walletAddress,
  }),
}));

const store = new Map<string, { value: string; expiry: number | null }>();

const mockRedis = {
  get: vi.fn((key: string) => {
    const item = store.get(key);
    if (!item) return Promise.resolve(null);
    if (item.expiry && Date.now() > item.expiry) {
      store.delete(key);
      return Promise.resolve(null);
    }
    return Promise.resolve(item.value);
  }),
  set: vi.fn((key: string, value: string, ...args: unknown[]) => {
    const exIdx = (args as string[]).indexOf('EX');
    const expiry = exIdx >= 0 ? Date.now() + Number((args as unknown[])[exIdx + 1]) * 1000 : null;
    store.set(key, { value, expiry });
    return Promise.resolve('OK');
  }),
  del: vi.fn((key: string) => { store.delete(key); return Promise.resolve(1); }),
  zadd: vi.fn(() => Promise.resolve(1)),
  zcard: vi.fn(() => Promise.resolve(0)),
  zrange: vi.fn(() => Promise.resolve([])),
  zremrangebyscore: vi.fn(() => Promise.resolve(0)),
  zrem: vi.fn(() => Promise.resolve(1)),
  smembers: vi.fn(() => Promise.resolve([])),
  sadd: vi.fn(() => Promise.resolve(1)),
  srem: vi.fn(() => Promise.resolve(1)),
  pipeline: vi.fn(() => {
    const ops: Array<{ cmd: string; args: unknown[] }> = [];
    const pipe = {
      set: vi.fn((key: string, value: string, ...args: unknown[]) => {
        ops.push({ cmd: 'set', args: [key, value, ...args] });
        return pipe;
      }),
      expire: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      del: vi.fn().mockReturnThis(),
      exec: vi.fn(async () => {
        for (const op of ops) {
          if (op.cmd === 'set') {
            const [key, value, ...rest] = op.args as [string, string, ...unknown[]];
            const exIdx = (rest as string[]).indexOf('EX');
            const expiry = exIdx >= 0 ? Date.now() + Number(rest[exIdx + 1]) * 1000 : null;
            store.set(key, { value, expiry });
          }
        }
        return [];
      }),
    };
    return pipe;
  }),
  publish: vi.fn(() => Promise.resolve(0)),
  incr: vi.fn(() => Promise.resolve(1)),
  expire: vi.fn(() => Promise.resolve(1)),
} as unknown as import('ioredis').default;

const mockDb = {
  profile: {
    upsert: vi.fn().mockResolvedValue(mockProfile),
    findUnique: vi.fn().mockResolvedValue(mockProfile),
    update: vi.fn().mockResolvedValue(mockProfile),
  },
  auditLog: { create: vi.fn() },
} as unknown as import('@funrun/database').PrismaClient;

const mockLogger = {
  info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), fatal: vi.fn(),
} as unknown as import('@funrun/logger').Logger;

async function buildTestApp(): Promise<FastifyInstance> {
  const { authPlugin } = await import('../../src/index.js');
  const app = Fastify({ logger: false });
  await app.register(authPlugin, {
    privy: { appId: 'test-app', appSecret: 'test-secret' },
    db: mockDb,
    redis: { cache: mockRedis, pubsub: mockRedis },
    logger: mockLogger,
  });

  app.get('/api/v1/test/admin-only', {
    config: { requireRole: 'ADMIN' },
  }, async (_req, reply) => {
    return reply.send({ success: true, data: { ok: true } });
  });

  app.get('/api/v1/test/creator-perm', {
    config: { requirePermission: 'coin:create' },
  }, async (_req, reply) => {
    return reply.send({ success: true, data: { ok: true } });
  });

  return app;
}

describe('RBAC integration (H-07)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    store.clear();
    vi.clearAllMocks();
    app = await buildTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('USER receives 403 on admin-only route', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/test/admin-only',
      headers: { authorization: 'Bearer valid-privy-token' },
    });
    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body) as { error: { code: string } };
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('USER receives 403 on coin:create permission route', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/test/creator-perm',
      headers: { authorization: 'Bearer valid-privy-token' },
    });
    expect(res.statusCode).toBe(403);
  });
});
