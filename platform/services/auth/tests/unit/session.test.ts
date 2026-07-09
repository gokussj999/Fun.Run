import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SessionManager } from '../../src/session/manager.js';
import type { SessionStore } from '../../src/session/store.js';
import type { Session, SessionCreateInput } from '../../src/types.js';

// ─── Mock session store ───────────────────────────────────────────────────────

function makeStore(overrides: Partial<SessionStore> = {}): SessionStore {
  return {
    set: vi.fn(),
    get: vi.fn(),
    touch: vi.fn(),
    revoke: vi.fn().mockResolvedValue(true),
    revokeAll: vi.fn().mockResolvedValue(3),
    listByUser: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
    pruneExpired: vi.fn(),
    ...overrides,
  } as unknown as SessionStore;
}

function makeLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as unknown as import('@funrun/logger').Logger;
}

function makeSession(overrides: Partial<Session> = {}): Session {
  const now = Date.now();
  return {
    sessionId: 'test-session-id',
    userId: 'did:privy:abc',
    walletAddress: 'TestWallet111111111111111111111111111111111',
    role: 'USER',
    privySessionId: 'privy-sess-1',
    deviceId: 'device-abc',
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    createdAt: now,
    expiresAt: now + 15 * 60 * 1000,
    lastSeenAt: now,
    isRevoked: false,
    ...overrides,
  };
}

const INPUT: SessionCreateInput = {
  userId: 'did:privy:abc',
  walletAddress: 'TestWallet111111111111111111111111111111111',
  role: 'USER',
  privySessionId: 'privy-sess-1',
  deviceId: 'device-abc',
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
};

describe('SessionManager.create', () => {
  it('creates a session and stores it', async () => {
    const store = makeStore({ set: vi.fn() });
    const manager = new SessionManager(store, makeLogger());

    const session = await manager.create(INPUT);

    expect(session.walletAddress).toBe(INPUT.walletAddress);
    expect(session.role).toBe('USER');
    expect(session.isRevoked).toBe(false);
    expect(typeof session.sessionId).toBe('string');
    expect(store.set).toHaveBeenCalledOnce();
  });

  it('revokes oldest session when MAX_CONCURRENT reached', async () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ sessionId: `sess-${i}`, createdAt: Date.now() - (5 - i) * 1000 }),
    );

    const store = makeStore({
      count: vi.fn().mockResolvedValue(5),
      listByUser: vi.fn().mockResolvedValue(sessions),
      revoke: vi.fn().mockResolvedValue(true),
      set: vi.fn(),
    });

    const manager = new SessionManager(store, makeLogger());
    await manager.create(INPUT);

    // Should revoke 1 (oldest) before creating
    expect(store.revoke).toHaveBeenCalledOnce();
    expect(store.revoke).toHaveBeenCalledWith('sess-0', INPUT.walletAddress);
  });
});

describe('SessionManager.validate', () => {
  it('returns valid session', async () => {
    const session = makeSession();
    const store = makeStore({ get: vi.fn().mockResolvedValue(session) });
    const manager = new SessionManager(store, makeLogger());

    const result = await manager.validate(session.sessionId);
    expect(result.sessionId).toBe(session.sessionId);
  });

  it('throws NotFoundError for missing session', async () => {
    const store = makeStore({ get: vi.fn().mockResolvedValue(null) });
    const manager = new SessionManager(store, makeLogger());

    await expect(manager.validate('nonexistent')).rejects.toThrow('not found');
  });

  it('throws ForbiddenError for revoked session', async () => {
    const session = makeSession({ isRevoked: true });
    const store = makeStore({ get: vi.fn().mockResolvedValue(session) });
    const manager = new SessionManager(store, makeLogger());

    await expect(manager.validate(session.sessionId)).rejects.toThrow('revoked');
  });

  it('throws ForbiddenError for expired session', async () => {
    const session = makeSession({ expiresAt: Date.now() - 1000 });
    const store = makeStore({ get: vi.fn().mockResolvedValue(session) });
    const manager = new SessionManager(store, makeLogger());

    await expect(manager.validate(session.sessionId)).rejects.toThrow('expired');
  });

  it('extends TTL when session was not recently seen', async () => {
    const session = makeSession({ lastSeenAt: Date.now() - 10 * 60 * 1000 }); // 10 min ago
    const touch = vi.fn();
    const store = makeStore({ get: vi.fn().mockResolvedValue(session), touch });
    const manager = new SessionManager(store, makeLogger());

    await manager.validate(session.sessionId);
    expect(touch).toHaveBeenCalledOnce();
  });
});

describe('SessionManager.revoke', () => {
  it('allows user to revoke own session', async () => {
    const session = makeSession();
    const store = makeStore({
      get: vi.fn().mockResolvedValue(session),
      revoke: vi.fn().mockResolvedValue(true),
    });
    const manager = new SessionManager(store, makeLogger());

    await expect(
      manager.revoke(session.sessionId, session.walletAddress, 'USER'),
    ).resolves.toBeUndefined();
  });

  it('allows ADMIN to revoke any session', async () => {
    const session = makeSession();
    const store = makeStore({
      get: vi.fn().mockResolvedValue(session),
      revoke: vi.fn().mockResolvedValue(true),
    });
    const manager = new SessionManager(store, makeLogger());

    await expect(
      manager.revoke(session.sessionId, 'OtherWallet', 'ADMIN'),
    ).resolves.toBeUndefined();
  });

  it('blocks USER from revoking another user\'s session', async () => {
    const session = makeSession();
    const store = makeStore({ get: vi.fn().mockResolvedValue(session) });
    const manager = new SessionManager(store, makeLogger());

    await expect(
      manager.revoke(session.sessionId, 'DifferentWallet', 'USER'),
    ).rejects.toThrow('Cannot revoke');
  });
});

describe('SessionManager.revokeAll', () => {
  it('returns count of revoked sessions', async () => {
    const store = makeStore({ revokeAll: vi.fn().mockResolvedValue(3) });
    const manager = new SessionManager(store, makeLogger());

    const count = await manager.revokeAll('some-wallet');
    expect(count).toBe(3);
  });
});
