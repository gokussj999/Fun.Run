/**
 * AuthService — facade that wires together all auth components.
 * Consumed by the Fastify plugin to avoid direct dependency coupling.
 */
import type { PrismaClient } from '@funrun/database';
import type { $Enums } from '@funrun/database';
import type { Logger } from '@funrun/logger';
import type { RedisInstance as Redis } from '@funrun/redis';

import { AuditEventLogger } from './audit/logger.js';
import { ApiKeyManager } from './api-keys/manager.js';
import { SessionStore } from './session/store.js';
import { SessionManager } from './session/manager.js';
import { ReplayProtection } from './middleware/replay.js';
import type { UserRole } from './types.js';
import { hasAtLeastRole, hasPermission } from './rbac/roles.js';
import { ForbiddenError, NotFoundError } from '@funrun/shared';
import { canAssignRole } from './rbac/roles.js';

export interface AuthServiceDependencies {
  db: PrismaClient;
  redis: Redis;
  logger: Logger;
}

export class AuthService {
  readonly auditLogger: AuditEventLogger;
  readonly sessionManager: SessionManager;
  readonly apiKeyManager: ApiKeyManager;
  readonly replayProtection: ReplayProtection;

  constructor(private readonly deps: AuthServiceDependencies) {
    const { db, redis, logger } = deps;

    this.auditLogger = new AuditEventLogger(db, redis, logger);

    const store = new SessionStore(redis, logger);
    this.sessionManager = new SessionManager(store, logger);

    this.apiKeyManager = new ApiKeyManager(redis, logger);
    this.replayProtection = new ReplayProtection(redis, logger);
  }

  // ─── User management ──────────────────────────────────────────────────────────

  async getProfile(walletAddress: string) {
    return this.deps.db.profile.findUnique({
      where: { walletAddress },
      select: {
        walletAddress: true,
        privyUserId: true,
        role: true,
        referrerWallet: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
        lastSeenAt: true,
      },
    });
  }

  async changeRole(opts: {
    actorWallet: string;
    actorRole: UserRole;
    targetWallet: string;
    newRole: UserRole;
  }): Promise<void> {
    const { actorWallet, actorRole, targetWallet, newRole } = opts;

    if (!canAssignRole(actorRole, newRole)) {
      throw new ForbiddenError(
        `${actorRole} cannot assign ${newRole}: insufficient rank`,
      );
    }

    const target = await this.deps.db.profile.findUnique({
      where: { walletAddress: targetWallet },
    });

    if (!target) throw new NotFoundError(`User ${targetWallet}`);

    const oldRole = target.role as UserRole;

    await this.deps.db.profile.update({
      where: { walletAddress: targetWallet },
      data: { role: newRole as $Enums.UserRole },
    });

    await this.auditLogger.write({
      eventType: 'ROLE_CHANGED',
      actorId: actorWallet,
      actorRole,
      targetId: targetWallet,
      ipAddress: 'system',
      userAgent: 'system',
      sessionId: null,
      outcome: 'SUCCESS',
      details: { oldRole, newRole },
    });

    // Revoke all existing sessions — force re-login with new role
    await this.sessionManager.revokeAll(targetWallet);
  }

  async banUser(opts: {
    actorWallet: string;
    actorRole: UserRole;
    targetWallet: string;
    reason: string;
  }): Promise<void> {
    const { actorWallet, actorRole, targetWallet, reason } = opts;

    if (!hasAtLeastRole(actorRole, 'ADMIN')) {
      throw new ForbiddenError('Admin role required to ban users');
    }

    await this.deps.db.profile.update({
      where: { walletAddress: targetWallet },
      data: { isBanned: true },
    });

    await this.sessionManager.revokeAll(targetWallet);

    await this.auditLogger.write({
      eventType: 'USER_BANNED',
      actorId: actorWallet,
      actorRole,
      targetId: targetWallet,
      ipAddress: 'system',
      userAgent: 'system',
      sessionId: null,
      outcome: 'SUCCESS',
      details: { reason },
    });
  }
}
