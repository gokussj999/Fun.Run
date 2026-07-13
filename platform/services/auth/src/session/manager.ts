import { randomUUID } from 'node:crypto';

import type { Logger } from '@funrun/logger';
import { ConflictError, NotFoundError, ForbiddenError } from '@funrun/shared';

import { SESSION_TTL_SECONDS, SESSION_MAX_CONCURRENT, SESSION_IDLE_EXTENSION_SECONDS } from '../constants.js';
import type { Session, SessionCreateInput, UserRole } from '../types.js';
import { SessionStore } from './store.js';

export class SessionManager {
  private readonly store: SessionStore;

  constructor(
    store: SessionStore,
    private readonly logger: Logger,
  ) {
    this.store = store;
  }

  async create(input: SessionCreateInput): Promise<Session> {
    // Enforce concurrent session limit (prune expired first)
    await this.store.pruneExpired(input.walletAddress);
    const activeCount = await this.store.count(input.walletAddress);

    if (activeCount >= SESSION_MAX_CONCURRENT) {
      this.logger.warn(
        { walletAddress: input.walletAddress, activeCount },
        'Max concurrent sessions reached — revoking oldest',
      );
      await this.revokeOldest(input.walletAddress);
    }

    const now = Date.now();
    const session: Session = {
      sessionId: randomUUID(),
      userId: input.userId,
      walletAddress: input.walletAddress,
      role: input.role,
      privySessionId: input.privySessionId,
      deviceId: input.deviceId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      createdAt: now,
      expiresAt: now + SESSION_TTL_SECONDS * 1000,
      lastSeenAt: now,
      isRevoked: false,
    };

    await this.store.set(session, SESSION_TTL_SECONDS);

    this.logger.info(
      { sessionId: session.sessionId, walletAddress: session.walletAddress, role: session.role },
      'Session created',
    );

    return session;
  }

  async validate(sessionId: string, walletAddress?: string): Promise<Session> {
    const session = await this.store.get(sessionId);

    if (!session) {
      throw new NotFoundError(`Session ${sessionId}`);
    }

    if (session.isRevoked) {
      throw new ForbiddenError('Session has been revoked');
    }

    const now = Date.now();
    if (session.expiresAt < now) {
      throw new ForbiddenError('Session has expired');
    }

    // H-06: session must belong to the authenticated wallet
    if (walletAddress && session.walletAddress !== walletAddress) {
      throw new ForbiddenError('Session does not belong to this wallet');
    }

    // H-24: sliding window — extend TTL on every successful validation
    await this.store.touch(sessionId, session.walletAddress, SESSION_TTL_SECONDS);

    return {
      ...session,
      lastSeenAt: now,
      expiresAt: now + SESSION_TTL_SECONDS * 1000,
    };
  }

  async revoke(sessionId: string, requestingWallet: string, requestingRole: UserRole): Promise<void> {
    const session = await this.store.get(sessionId);

    if (!session) {
      throw new NotFoundError(`Session ${sessionId}`);
    }

    // Users can only revoke their own sessions; admins can revoke any
    const isOwnSession = session.walletAddress === requestingWallet;
    const isAdmin = requestingRole === 'ADMIN' || requestingRole === 'SUPER_ADMIN';

    if (!isOwnSession && !isAdmin) {
      throw new ForbiddenError('Cannot revoke another user\'s session');
    }

    const success = await this.store.revoke(sessionId, session.walletAddress);

    if (!success) {
      throw new NotFoundError(`Session ${sessionId}`);
    }

    this.logger.info(
      { sessionId, revokedBy: requestingWallet },
      'Session revoked',
    );
  }

  async revokeAll(walletAddress: string): Promise<number> {
    const count = await this.store.revokeAll(walletAddress);
    this.logger.info({ walletAddress, count }, 'All sessions revoked');
    return count;
  }

  async list(walletAddress: string): Promise<Session[]> {
    return this.store.listByUser(walletAddress);
  }

  private async revokeOldest(walletAddress: string): Promise<void> {
    const sessions = await this.store.listByUser(walletAddress);
    if (sessions.length === 0) return;

    // Sort ascending by creation time, revoke oldest
    const sorted = [...sessions].sort((a, b) => a.createdAt - b.createdAt);
    const oldest = sorted[0];
    if (oldest) {
      await this.store.revoke(oldest.sessionId, walletAddress);
    }
  }
}
