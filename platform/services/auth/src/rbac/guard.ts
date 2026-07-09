import { ForbiddenError, UnauthorizedError } from '@funrun/shared';
import type { FastifyRequest } from 'fastify';

import type { Permission, UserRole, RequestActor } from '../types.js';
import { effectivelyHasPermission, hasAtLeastRole } from './roles.js';

// ─── Actor extraction ─────────────────────────────────────────────────────────

export function requireActor(request: FastifyRequest): RequestActor {
  if (!request.actor) {
    throw new UnauthorizedError('Authentication required');
  }
  return request.actor;
}

export function requireUser(request: FastifyRequest): Extract<RequestActor, { role: UserRole; userId: string }> {
  const actor = requireActor(request);

  if ('isService' in actor) {
    throw new ForbiddenError('This endpoint is not available to service accounts');
  }

  return actor as Extract<RequestActor, { role: UserRole; userId: string }>;
}

// ─── Role guards ──────────────────────────────────────────────────────────────

export function requireRole(request: FastifyRequest, role: UserRole): void {
  const actor = requireActor(request);

  if ('isService' in actor) {
    throw new ForbiddenError('Service accounts cannot use role-based endpoints');
  }

  const userActor = actor as Extract<RequestActor, { role: UserRole }>;
  if (!hasAtLeastRole(userActor.role, role)) {
    throw new ForbiddenError(
      `Insufficient role: ${userActor.role} — requires at least ${role}`,
    );
  }
}

export function requirePermission(request: FastifyRequest, permission: Permission): void {
  const actor = requireActor(request);

  let role: UserRole;
  if ('isService' in actor) {
    role = 'INTERNAL_SERVICE';
  } else {
    role = (actor as Extract<RequestActor, { role: UserRole }>).role;
  }

  if (!effectivelyHasPermission(role, permission)) {
    throw new ForbiddenError(
      `Missing permission: ${permission}`,
    );
  }
}

export function requireAnyPermission(request: FastifyRequest, permissions: Permission[]): void {
  const actor = requireActor(request);
  const role = 'isService' in actor ? 'INTERNAL_SERVICE' : (actor as { role: UserRole }).role;

  const hasAny = permissions.some((p) => effectivelyHasPermission(role, p));
  if (!hasAny) {
    throw new ForbiddenError(
      `Missing one of required permissions: [${permissions.join(', ')}]`,
    );
  }
}

// ─── Ownership guard ──────────────────────────────────────────────────────────

export function requireOwnershipOrRole(
  request: FastifyRequest,
  ownerWallet: string,
  elevatedRole: UserRole = 'ADMIN',
): void {
  const actor = requireActor(request);

  if ('isService' in actor) return; // services bypass ownership checks

  const userActor = actor as Extract<RequestActor, { walletAddress: string; role: UserRole }>;

  if (
    userActor.walletAddress !== ownerWallet &&
    !hasAtLeastRole(userActor.role, elevatedRole)
  ) {
    throw new ForbiddenError('Access denied: not the owner');
  }
}
