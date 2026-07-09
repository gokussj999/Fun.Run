/**
 * @funrun/auth — Public API
 *
 * Two ways to use this package:
 *
 * 1. Fastify plugin (most common — register in api-gateway):
 *    import { authPlugin } from '@funrun/auth'
 *    await app.register(authPlugin, { ... })
 *
 * 2. Standalone service (future: separate process):
 *    Run this file directly.
 */

import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { createPrivyClient } from './privy/client.js';
import { AuthService } from './service.js';
import { authenticatePlugin } from './middleware/authenticate.js';
import { authorizePlugin } from './middleware/authorize.js';
import { serviceAuthPlugin } from './middleware/service-auth.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerSessionRoutes } from './routes/sessions.js';
import { registerApiKeyRoutes } from './routes/api-keys.js';

import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';
import type Redis from 'ioredis';

export interface AuthPluginOptions {
  privy: { appId: string; appSecret: string; verificationKey?: string };
  db: PrismaClient;
  redis: { cache: Redis; pubsub: Redis };
  logger: Logger;
  internalServices?: Record<string, { name: string; secret: string }>;
}

/**
 * Fastify plugin — registers the complete auth system.
 * Mount on the api-gateway (or any Fastify app that needs auth).
 */
export const authPlugin = fp(
  async (app: FastifyInstance, opts: AuthPluginOptions) => {
    const { privy, db, redis, logger, internalServices = {} } = opts;

    // ── Initialize Privy client ────────────────────────────────────────────────
    createPrivyClient({ ...privy, logger });

    // ── Build AuthService (all components) ────────────────────────────────────
    const authService = new AuthService({ db, redis: redis.cache, logger });

    // ── Service-to-service auth (runs first — before user auth) ──────────────
    await app.register(serviceAuthPlugin, {
      services: internalServices,
      replayProtection: authService.replayProtection,
      logger,
    });

    // ── User authentication ───────────────────────────────────────────────────
    await app.register(authenticatePlugin, {
      sessionManager: authService.sessionManager,
      auditLogger: authService.auditLogger,
      redis: redis.cache,
      db,
      logger,
    });

    // ── RBAC authorization ────────────────────────────────────────────────────
    await app.register(authorizePlugin);

    // ── Routes ───────────────────────────────────────────────────────────────
    await registerAuthRoutes(app, {
      sessionManager: authService.sessionManager,
      auditLogger: authService.auditLogger,
    });

    await registerSessionRoutes(app, {
      sessionManager: authService.sessionManager,
      auditLogger: authService.auditLogger,
    });

    await registerApiKeyRoutes(app, {
      apiKeyManager: authService.apiKeyManager,
      auditLogger: authService.auditLogger,
    });

    // ── Expose authService for downstream plugins (DI) ────────────────────────
    app.decorate('authService', authService);

    logger.info('Auth plugin registered: Privy + session + RBAC + service-auth');
  },
  { name: 'auth', fastify: '5.x' },
);

// ── Public re-exports ─────────────────────────────────────────────────────────

export { AuthService } from './service.js';
export type { AuthPluginOptions as AuthOptions } from './index.js';
export * from './types.js';
export * from './rbac/roles.js';
export * from './rbac/guard.js';
export * from './middleware/service-auth.js';
export { ReplayProtection, ReplayError } from './middleware/replay.js';
export { AuditEventLogger } from './audit/logger.js';
export { SessionManager } from './session/manager.js';
export { ApiKeyManager } from './api-keys/manager.js';
