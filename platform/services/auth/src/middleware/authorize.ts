import type { FastifyInstance, FastifyRequest, FastifyReply, RouteOptions } from 'fastify';
import fp from 'fastify-plugin';

import type { Permission, UserRole } from '../types.js';
import { requirePermission, requireRole } from '../rbac/guard.js';

declare module 'fastify' {
  interface RouteShorthandOptions {
    config?: RouteAuthConfig;
  }

  interface RouteOptions {
    config?: RouteAuthConfig;
  }
}

export interface RouteAuthConfig {
  skipAuth?: boolean;
  requireRole?: UserRole;
  requirePermission?: Permission;
  requireAnyPermission?: Permission[];
  requireAllPermissions?: Permission[];
}

/**
 * Fastify plugin: declarative RBAC authorization per route.
 *
 * Usage in route definitions:
 *   app.get('/admin/users', {
 *     config: { requireRole: 'ADMIN' }
 *   }, handler)
 *
 *   app.post('/coins', {
 *     config: { requirePermission: 'coin:create' }
 *   }, handler)
 */
export const authorizePlugin = fp(
  async (app: FastifyInstance) => {
    app.addHook(
      'onRequest',
      async (request: FastifyRequest, _reply: FastifyReply) => {
        const routeConfig = (request.routeOptions as RouteOptions | undefined)
          ?.config as RouteAuthConfig | undefined;

        if (!routeConfig) return;
        if (routeConfig.skipAuth) return;

        // Role guard
        if (routeConfig.requireRole) {
          requireRole(request, routeConfig.requireRole);
        }

        // Single permission
        if (routeConfig.requirePermission) {
          requirePermission(request, routeConfig.requirePermission);
        }

        // Any of permissions
        if (routeConfig.requireAnyPermission?.length) {
          const { requireAnyPermission: any } = await import('../rbac/guard.js');
          any(request, routeConfig.requireAnyPermission);
        }

        // All permissions
        if (routeConfig.requireAllPermissions?.length) {
          for (const p of routeConfig.requireAllPermissions) {
            requirePermission(request, p);
          }
        }
      },
    );
  },
  { name: 'authorize', fastify: '5.x', dependencies: ['authenticate'] },
);
