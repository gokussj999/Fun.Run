import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { UnauthorizedError } from '@funrun/shared';
import { requireOwnershipOrRole } from '../rbac/guard.js';
import type { AuthenticatedUser } from '../types.js';
import type { SessionManager } from '../session/manager.js';
import type { AuditEventLogger } from '../audit/logger.js';

const RevokeParamsSchema = z.object({ sessionId: z.string().uuid() });

export async function registerSessionRoutes(
  app: FastifyInstance,
  deps: { sessionManager: SessionManager; auditLogger: AuditEventLogger },
): Promise<void> {
  const { sessionManager, auditLogger } = deps;

  // ── GET /api/v1/sessions ─────────────────────────────────────────────────────
  // List active sessions for the authenticated user.
  app.get(
    '/api/v1/sessions',
    { config: { requirePermission: 'auth:list_own_sessions' } },
    async (request, reply) => {
      const actor = request.actor as AuthenticatedUser;
      const sessions = await sessionManager.list(actor.walletAddress);

      return reply.send({
        success: true,
        data: sessions.map((s) => ({
          sessionId: s.sessionId,
          deviceId: s.deviceId,
          ipAddress: s.ipAddress,
          userAgent: s.userAgent,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt,
          lastSeenAt: s.lastSeenAt,
          isCurrent: s.sessionId === actor.sessionId,
        })),
        requestId: reply.getHeader('x-request-id'),
        timestamp: new Date().toISOString(),
      });
    },
  );

  // ── DELETE /api/v1/sessions/:sessionId ──────────────────────────────────────
  // Revoke a specific session.
  app.delete(
    '/api/v1/sessions/:sessionId',
    { config: { requirePermission: 'auth:revoke_own_session' } },
    async (request, reply) => {
      const actor = request.actor as AuthenticatedUser;
      const params = RevokeParamsSchema.parse(request.params);

      await sessionManager.revoke(params.sessionId, actor.walletAddress, actor.role);

      await auditLogger.write({
        eventType: 'SESSION_REVOKED',
        actorId: actor.userId,
        actorRole: actor.role,
        targetId: params.sessionId,
        ipAddress: actor.ipAddress,
        userAgent: request.headers['user-agent'] ?? '',
        sessionId: actor.sessionId,
        outcome: 'SUCCESS',
        details: { reason: 'manual_revoke' },
      });

      return reply.send({
        success: true,
        data: { message: 'Session revoked' },
        requestId: reply.getHeader('x-request-id'),
        timestamp: new Date().toISOString(),
      });
    },
  );

  // ── GET /api/v1/admin/sessions/:walletAddress ────────────────────────────────
  // Admin: list sessions for any user.
  app.get(
    '/api/v1/admin/sessions/:walletAddress',
    { config: { requirePermission: 'auth:list_any_session' } },
    async (request, reply) => {
      const actor = request.actor as AuthenticatedUser;
      const { walletAddress } = request.params as { walletAddress: string };

      requireOwnershipOrRole(request, walletAddress, 'ADMIN');

      const sessions = await sessionManager.list(walletAddress);

      await auditLogger.write({
        eventType: 'SESSION_LIST',
        actorId: actor.userId,
        actorRole: actor.role,
        targetId: walletAddress,
        ipAddress: actor.ipAddress,
        userAgent: request.headers['user-agent'] ?? '',
        sessionId: actor.sessionId,
        outcome: 'SUCCESS',
        details: { count: sessions.length },
      });

      return reply.send({
        success: true,
        data: sessions,
        requestId: reply.getHeader('x-request-id'),
        timestamp: new Date().toISOString(),
      });
    },
  );

  // ── DELETE /api/v1/admin/sessions/:walletAddress ─────────────────────────────
  // Admin: revoke all sessions for a user (e.g. account suspension).
  app.delete(
    '/api/v1/admin/sessions/:walletAddress',
    { config: { requirePermission: 'auth:revoke_any_session' } },
    async (request, reply) => {
      const actor = request.actor as AuthenticatedUser;
      const { walletAddress } = request.params as { walletAddress: string };

      const count = await sessionManager.revokeAll(walletAddress);

      await auditLogger.write({
        eventType: 'SESSION_REVOKED',
        actorId: actor.userId,
        actorRole: actor.role,
        targetId: walletAddress,
        ipAddress: actor.ipAddress,
        userAgent: request.headers['user-agent'] ?? '',
        sessionId: actor.sessionId,
        outcome: 'SUCCESS',
        details: { reason: 'admin_revoke_all', count },
      });

      return reply.send({
        success: true,
        data: { message: `Revoked ${count} sessions for ${walletAddress}` },
        requestId: reply.getHeader('x-request-id'),
        timestamp: new Date().toISOString(),
      });
    },
  );
}
