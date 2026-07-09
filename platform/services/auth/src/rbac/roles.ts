import type { Permission, UserRole } from '../types.js';
import { ROLE_RANK } from '../types.js';

// ─── Permission sets per role ─────────────────────────────────────────────────
// Each role inherits all permissions of roles below it in the hierarchy.
// Permissions are defined cumulatively here for clarity.

const USER_PERMISSIONS: Permission[] = [
  'auth:read_own_profile',
  'auth:list_own_sessions',
  'auth:revoke_own_session',
  'trade:buy',
  'trade:sell',
  'trade:read_history',
  'coin:read',
];

const CREATOR_PERMISSIONS: Permission[] = [
  ...USER_PERMISSIONS,
  'coin:create',
  'coin:update_own',
  'auth:manage_api_keys',
];

const VERIFIED_CREATOR_PERMISSIONS: Permission[] = [
  ...CREATOR_PERMISSIONS,
];

const MODERATOR_PERMISSIONS: Permission[] = [
  ...CREATOR_PERMISSIONS,
  'auth:read_any_profile',
  'admin:view_dashboard',
  'admin:view_audit_logs',
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...MODERATOR_PERMISSIONS,
  'auth:update_any_profile',
  'auth:ban_user',
  'auth:list_any_session',
  'auth:revoke_any_session',
  'admin:manage_users',
  'admin:pause_protocol',
  'admin:sweep_treasury',
  'admin:manage_roles',
];

const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  ...ADMIN_PERMISSIONS,
  'admin:update_config',
  'superadmin:all',
];

const INTERNAL_SERVICE_PERMISSIONS: Permission[] = [
  'service:call_internal_api',
  'auth:read_any_profile',
  'trade:read_history',
  'coin:read',
];

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  USER:              USER_PERMISSIONS,
  CREATOR:           CREATOR_PERMISSIONS,
  VERIFIED_CREATOR:  VERIFIED_CREATOR_PERMISSIONS,
  MODERATOR:         MODERATOR_PERMISSIONS,
  ADMIN:             ADMIN_PERMISSIONS,
  SUPER_ADMIN:       SUPER_ADMIN_PERMISSIONS,
  INTERNAL_SERVICE:  INTERNAL_SERVICE_PERMISSIONS,
} as const;

// ─── Guards ───────────────────────────────────────────────────────────────────

export function hasAtLeastRole(actual: UserRole, required: UserRole): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] as Permission[]).includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

// For SUPER_ADMIN, all permissions are granted regardless of explicit listing.
export function effectivelyHasPermission(role: UserRole, permission: Permission): boolean {
  if (role === 'SUPER_ADMIN') return true;
  return hasPermission(role, permission);
}

// ─── Role validation ──────────────────────────────────────────────────────────

const VALID_ROLES = new Set<UserRole>([
  'SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'VERIFIED_CREATOR',
  'CREATOR', 'USER', 'INTERNAL_SERVICE',
]);

export function isValidRole(role: string): role is UserRole {
  return VALID_ROLES.has(role as UserRole);
}

export function canAssignRole(actorRole: UserRole, targetRole: UserRole): boolean {
  // Can only assign roles strictly below your own rank
  return ROLE_RANK[actorRole] > ROLE_RANK[targetRole];
}
