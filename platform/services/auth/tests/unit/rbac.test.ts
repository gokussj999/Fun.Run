import { describe, it, expect } from 'vitest';

import {
  hasAtLeastRole,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  effectivelyHasPermission,
  canAssignRole,
  isValidRole,
  ROLE_PERMISSIONS,
} from '../../src/rbac/roles.js';
import { ROLE_RANK } from '../../src/types.js';
import type { UserRole, Permission } from '../../src/types.js';

describe('RBAC — Role hierarchy', () => {
  it('SUPER_ADMIN outranks all roles', () => {
    const roles: UserRole[] = ['ADMIN', 'MODERATOR', 'VERIFIED_CREATOR', 'CREATOR', 'USER', 'INTERNAL_SERVICE'];
    for (const role of roles) {
      expect(hasAtLeastRole('SUPER_ADMIN', role)).toBe(true);
    }
  });

  it('ADMIN outranks MODERATOR and below', () => {
    expect(hasAtLeastRole('ADMIN', 'MODERATOR')).toBe(true);
    expect(hasAtLeastRole('ADMIN', 'CREATOR')).toBe(true);
    expect(hasAtLeastRole('ADMIN', 'USER')).toBe(true);
    expect(hasAtLeastRole('ADMIN', 'SUPER_ADMIN')).toBe(false);
  });

  it('USER does not outrank CREATOR', () => {
    expect(hasAtLeastRole('USER', 'CREATOR')).toBe(false);
  });

  it('same role satisfies itself', () => {
    const roles: UserRole[] = ['ADMIN', 'CREATOR', 'USER', 'SUPER_ADMIN'];
    for (const r of roles) {
      expect(hasAtLeastRole(r, r)).toBe(true);
    }
  });

  it('INTERNAL_SERVICE has lowest rank among users', () => {
    expect(ROLE_RANK['INTERNAL_SERVICE']).toBeLessThan(ROLE_RANK['USER']);
  });
});

describe('RBAC — Permission checks', () => {
  it('USER has trade:buy and trade:sell', () => {
    expect(hasPermission('USER', 'trade:buy')).toBe(true);
    expect(hasPermission('USER', 'trade:sell')).toBe(true);
  });

  it('USER cannot create coins', () => {
    expect(hasPermission('USER', 'coin:create')).toBe(false);
  });

  it('CREATOR can create coins', () => {
    expect(hasPermission('CREATOR', 'coin:create')).toBe(true);
  });

  it('CREATOR cannot pause protocol', () => {
    expect(hasPermission('CREATOR', 'admin:pause_protocol')).toBe(false);
  });

  it('ADMIN can pause protocol', () => {
    expect(hasPermission('ADMIN', 'admin:pause_protocol')).toBe(true);
  });

  it('ADMIN cannot update_config (SUPER_ADMIN only)', () => {
    expect(hasPermission('ADMIN', 'admin:update_config')).toBe(false);
  });

  it('SUPER_ADMIN can do everything via effectivelyHasPermission', () => {
    const perms: Permission[] = ['admin:update_config', 'admin:pause_protocol', 'coin:create'];
    for (const p of perms) {
      expect(effectivelyHasPermission('SUPER_ADMIN', p)).toBe(true);
    }
  });

  it('INTERNAL_SERVICE can call internal APIs', () => {
    expect(hasPermission('INTERNAL_SERVICE', 'service:call_internal_api')).toBe(true);
  });

  it('INTERNAL_SERVICE cannot trade', () => {
    expect(hasPermission('INTERNAL_SERVICE', 'trade:buy')).toBe(false);
  });
});

describe('RBAC — hasAnyPermission / hasAllPermissions', () => {
  it('hasAnyPermission returns true if any match', () => {
    expect(hasAnyPermission('USER', ['admin:pause_protocol', 'trade:buy'])).toBe(true);
  });

  it('hasAnyPermission returns false if none match', () => {
    expect(hasAnyPermission('USER', ['admin:pause_protocol', 'admin:update_config'])).toBe(false);
  });

  it('hasAllPermissions returns false if any missing', () => {
    expect(hasAllPermissions('CREATOR', ['coin:create', 'admin:pause_protocol'])).toBe(false);
  });

  it('hasAllPermissions returns true if all present', () => {
    expect(hasAllPermissions('ADMIN', ['admin:pause_protocol', 'auth:ban_user'])).toBe(true);
  });
});

describe('RBAC — canAssignRole', () => {
  it('SUPER_ADMIN can assign ADMIN', () => {
    expect(canAssignRole('SUPER_ADMIN', 'ADMIN')).toBe(true);
  });

  it('ADMIN can assign CREATOR', () => {
    expect(canAssignRole('ADMIN', 'CREATOR')).toBe(true);
  });

  it('ADMIN cannot assign SUPER_ADMIN', () => {
    expect(canAssignRole('ADMIN', 'SUPER_ADMIN')).toBe(false);
  });

  it('CREATOR cannot assign any elevated role', () => {
    expect(canAssignRole('CREATOR', 'ADMIN')).toBe(false);
    expect(canAssignRole('CREATOR', 'MODERATOR')).toBe(false);
  });

  it('ADMIN cannot assign own role (must be strictly less)', () => {
    expect(canAssignRole('ADMIN', 'ADMIN')).toBe(false);
  });
});

describe('RBAC — Permission inheritance', () => {
  it('ADMIN inherits all USER permissions', () => {
    const userPerms = ROLE_PERMISSIONS['USER'];
    for (const p of userPerms) {
      expect(hasPermission('ADMIN', p)).toBe(true);
    }
  });

  it('MODERATOR inherits all CREATOR permissions', () => {
    const creatorPerms = ROLE_PERMISSIONS['CREATOR'];
    for (const p of creatorPerms) {
      expect(hasPermission('MODERATOR', p)).toBe(true);
    }
  });
});

describe('RBAC — isValidRole', () => {
  it('accepts all defined roles', () => {
    const roles: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'VERIFIED_CREATOR', 'CREATOR', 'USER', 'INTERNAL_SERVICE'];
    for (const r of roles) {
      expect(isValidRole(r)).toBe(true);
    }
  });

  it('rejects unknown role strings', () => {
    expect(isValidRole('HACKER')).toBe(false);
    expect(isValidRole('')).toBe(false);
    expect(isValidRole('admin')).toBe(false); // case-sensitive
  });
});
