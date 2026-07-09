import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { BadRequestError, UnauthorizedError } from '@funrun/shared';

import type { ApiKeyManager } from '../api-keys/manager.js';
import type { AuditEventLogger } from '../audit/logger.js';
import type { AuthenticatedUser, Permission, UserRole } from '../types.js';
import { ROLE_PERMISSIONS } from '../rbac/roles.js';
import { hasAtLeastRole } from '../rbac/roles.js';

const CreateKeySchema = z.object({
  name: z.string().min(1).max(80),
  permissions: z.array(z.string()).min(1).max(20),
  expiresIn: z.number().int().min(3600).max(365 * 24 * 3600).optional(), // 1h – 1y
});

const RevokeParamsSchema = z.object({ id: z.string().uuid() });

export async function registerApiKeyRoutes(
  app: FastifyInstance,
  deps: { apiKeyManager: ApiKeyManager; auditLogger: AuditEventLogger },
): Promise<void> {
  const { apiKeyManager, auditLogger } = deps;

  // ── POST /api/v1/api-keys ────────────────────────────────────────────────────
  app.post(
    '/api/v1/api-keys',
    { config: { requirePermission: 'auth:manage_api_keys' } },
    async (request, reply) => {
      const actor = request.actor as AuthenticatedUser;
      const body = CreateKeySchema.parse(request.body);

      // Validate requested permissions are within the user's own permission set
      const allowedPerms = ROLE_PERMISSIONS[actor.role] as Permission[];
      const invalidPerms = body.permissions.filter(
        (p) => !allowedPerms.includes(p as Permission),
      );

      if (invalidPerms.length > 0) {
        throw new BadRequestError(
          `Cannot grant permissions you don\'t have: ${invalidPerms.join(', ')}`,
        );
      }

      const result = await apiKeyManager.create({
        name: body.name,
        walletAddress: actor.walletAddress,
        role: actor.role,
        permissions: body.permissions as Permission[],
        expiresIn: body.expiresIn,
      });

      await auditLogger.write({
        eventType: 'API_KEY_CREATED',
        actorId: actor.userId,
        actorRole: actor.role,
        targetId: result.id,
        ipAddress: actor.ipAddress,
        userAgent: request.headers['user-agent'] ?? '',
        sessionId: actor.sessionId,
        outcome: 'SUCCESS',
        details: { name: body.name, keyPrefix: result.keyPrefix },
      });

      return reply.status(201).send({
        success: true,
        data: result, // raw key shown ONCE here
        requestId: reply.getHeader('x-request-id'),
        timestamp: new Date().toISOString(),
      });
    },
  );

  // ── GET /api/v1/api-keys ─────────────────────────────────────────────────────
  app.get(
    '/api/v1/api-keys',
    { config: { requirePermission: 'auth:manage_api_keys' } },
    async (request, reply) => {
      const actor = request.actor as AuthenticatedUser;
      const keys = apiKeyManager.listByWallet(actor.walletAddress);

      return reply.send({
        success: true,
        data: keys.map((k) => ({
          id: k.id,
          name: k.name,
          keyPrefix: k.keyPrefix,
          permissions: k.permissions,
          createdAt: k.createdAt,
          expiresAt: k.expiresAt,
          lastUsedAt: k.lastUsedAt,
          isRevoked: k.isRevoked,
        })),
        requestId: reply.getHeader('x-request-id'),
        timestamp: new Date().toISOString(),
      });
    },
  );

  // ── DELETE /api/v1/api-keys/:id ──────────────────────────────────────────────
  app.delete(
    '/api/v1/api-keys/:id',
    { config: { requirePermission: 'auth:manage_api_keys' } },
    async (request, reply) => {
      const actor = request.actor as AuthenticatedUser;
      const params = RevokeParamsSchema.parse(request.params);
      const isAdmin = hasAtLeastRole(actor.role, 'ADMIN');

      await apiKeyManager.revoke(params.id, actor.walletAddress, isAdmin);

      await auditLogger.write({
        eventType: 'API_KEY_REVOKED',
        actorId: actor.userId,
        actorRole: actor.role,
        targetId: params.id,
        ipAddress: actor.ipAddress,
        userAgent: request.headers['user-agent'] ?? '',
        sessionId: actor.sessionId,
        outcome: 'SUCCESS',
        details: {},
      });

      return reply.send({
        success: true,
        data: { message: 'API key revoked' },
        requestId: reply.getHeader('x-request-id'),
        timestamp: new Date().toISOString(),
      });
    },
  );
}
