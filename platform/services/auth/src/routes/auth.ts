import type { FastifyInstance } from 'fastify';

import { UnauthorizedError } from '@funrun/shared';

import type { AuthenticatedUser } from '../types.js';
import type { SessionManager } from '../session/manager.js';
import type { AuditEventLogger } from '../audit/logger.js';

export async function registerAuthRoutes(
  app: FastifyInstance,
  deps: { sessionManager: SessionManager; auditLogger: AuditEventLogger },
): Promise<void> {
  const { sessionManager, auditLogger } = deps;

  // ── POST /api/v1/auth/verify ─────────────────────────────────────────────────
  // Verifies the Privy token and returns the user identity.
  // authenticate plugin handles verification; this just returns the resolved actor.
  app.post(
    '/api/v1/auth/verify',
    { schema: { body: {} } },
    async (request, reply) => {
      const actor = request.actor as AuthenticatedUser | undefined;

      if (!actor || 'isService' in actor) {
        throw new UnauthorizedError();
      }

      await auditLogger.write({
        eventType: 'AUTH_VERIFY_SUCCESS',
        actorId: actor.userId,
        actorRole: actor.role,
        targetId: actor.walletAddress,
        ipAddress: actor.ipAddress,
        userAgent: request.headers['user-agent'] ?? '',
        sessionId: actor.sessionId,
        outcome: 'SUCCESS',
        details: { walletAddress: actor.walletAddress },
      });

      return reply.send({
        success: true,
        data: {
          userId: actor.userId,
          walletAddress: actor.walletAddress,
          role: actor.role,
          sessionId: actor.sessionId,
          expiresAt: actor.expiresAt,
        },
        requestId: reply.getHeader('x-request-id'),
        timestamp: new Date().toISOString(),
      });
    },
  );

  // ── GET /api/v1/auth/me ──────────────────────────────────────────────────────
  app.get('/api/v1/auth/me', async (request, reply) => {
    const actor = request.actor as AuthenticatedUser | undefined;

    if (!actor || 'isService' in actor) {
      throw new UnauthorizedError();
    }

    return reply.send({
      success: true,
      data: {
        userId: actor.userId,
        walletAddress: actor.walletAddress,
        role: actor.role,
        sessionId: actor.sessionId,
        deviceId: actor.deviceId,
        issuedAt: actor.issuedAt,
        expiresAt: actor.expiresAt,
      },
      requestId: reply.getHeader('x-request-id'),
      timestamp: new Date().toISOString(),
    });
  });

  // ── POST /api/v1/auth/logout ─────────────────────────────────────────────────
  // Revoke the current session.
  app.post('/api/v1/auth/logout', async (request, reply) => {
    const actor = request.actor as AuthenticatedUser | undefined;

    if (!actor || 'isService' in actor) {
      throw new UnauthorizedError();
    }

    await sessionManager.revoke(actor.sessionId, actor.walletAddress, actor.role);

    await auditLogger.write({
      eventType: 'SESSION_REVOKED',
      actorId: actor.userId,
      actorRole: actor.role,
      targetId: actor.sessionId,
      ipAddress: actor.ipAddress,
      userAgent: request.headers['user-agent'] ?? '',
      sessionId: actor.sessionId,
      outcome: 'SUCCESS',
      details: { reason: 'user_logout' },
    });

    return reply.send({
      success: true,
      data: { message: 'Logged out successfully' },
      requestId: reply.getHeader('x-request-id'),
      timestamp: new Date().toISOString(),
    });
  });

  // ── POST /api/v1/auth/logout-all ────────────────────────────────────────────
  // Revoke ALL sessions for the current user (e.g. on password reset / compromise).
  app.post('/api/v1/auth/logout-all', async (request, reply) => {
    const actor = request.actor as AuthenticatedUser | undefined;

    if (!actor || 'isService' in actor) {
      throw new UnauthorizedError();
    }

    const count = await sessionManager.revokeAll(actor.walletAddress);

    await auditLogger.write({
      eventType: 'SESSION_REVOKED',
      actorId: actor.userId,
      actorRole: actor.role,
      targetId: actor.walletAddress,
      ipAddress: actor.ipAddress,
      userAgent: request.headers['user-agent'] ?? '',
      sessionId: actor.sessionId,
      outcome: 'SUCCESS',
      details: { reason: 'logout_all', count },
    });

    return reply.send({
      success: true,
      data: { message: `Revoked ${count} sessions` },
      requestId: reply.getHeader('x-request-id'),
      timestamp: new Date().toISOString(),
    });
  });
}
