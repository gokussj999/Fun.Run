import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { createHash } from 'node:crypto';

import type { Logger } from '@funrun/logger';
import { UnauthorizedError } from '@funrun/shared';

import { HEADERS, REDIS_KEYS_AUTH, IP_ABUSE_THRESHOLD, IP_ABUSE_WINDOW_SECONDS, IP_ABUSE_BLOCK_SECONDS } from '../constants.js';
import { verifyPrivyToken, extractBearerToken } from '../privy/verify.js';
import type { AuthenticatedUser, UserRole } from '../types.js';
import type { SessionManager } from '../session/manager.js';
import type { ApiKeyManager } from '../api-keys/manager.js';
import type { AuditEventLogger } from '../audit/logger.js';
import type { RedisInstance as Redis } from '@funrun/redis';
import type { PrismaClient } from '@funrun/database';

export interface AuthenticatePluginConfig {
  sessionManager: SessionManager;
  apiKeyManager: ApiKeyManager;
  auditLogger: AuditEventLogger;
  redis: Redis;
  db: PrismaClient;
  logger: Logger;
}

/**
 * Fastify plugin: authenticate user requests via Privy token + session.
 *
 * Flow:
 *   1. Extract Bearer token from Authorization header
 *   2. Check IP abuse block
 *   3. Verify Privy JWT (official SDK — no custom crypto)
 *   4. Resolve internal session from Redis
 *   5. Hydrate user profile from DB (role, status)
 *   6. Attach AuthenticatedUser to request.actor
 *
 * Routes opting out of auth use { config: { skipAuth: true } }.
 */
export const authenticatePlugin = fp(
  async (app: FastifyInstance, config: AuthenticatePluginConfig) => {
    const { sessionManager, apiKeyManager, auditLogger, redis, db, logger } = config;

    app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
      // Skip if already authenticated by service-auth plugin
      if (request.actor) return;

      // Skip public routes
      const routeConfig = (request.routeOptions as { config?: { skipAuth?: boolean } } | undefined)
        ?.config;
      if (routeConfig?.skipAuth) return;

      const ip = extractIp(request);

      // ── IP abuse block check ─────────────────────────────────────────────────
      const blocked = await isIpBlocked(redis, ip);
      if (blocked) {
        await auditLogger.write({
          eventType: 'IP_ABUSE_DETECTED',
          actorId: null,
          actorRole: null,
          targetId: null,
          ipAddress: ip,
          userAgent: request.headers['user-agent'] ?? '',
          sessionId: null,
          outcome: 'FAILURE',
          details: { reason: 'IP blocked' },
        });
        throw new UnauthorizedError('Access temporarily blocked');
      }

      // ── Extract token (Bearer or X-Api-Key) ─────────────────────────────────
      const bearerToken = extractBearerToken(request.headers[HEADERS.AUTHORIZATION]);
      const apiKeyHeader = request.headers['x-api-key'];
      const rawCredential =
        bearerToken ??
        (typeof apiKeyHeader === 'string' && apiKeyHeader.length > 0 ? apiKeyHeader : null);

      if (!rawCredential) {
        await incrementIpFailures(redis, ip);
        throw new UnauthorizedError('Authorization header required');
      }

      // ── API key path (C-07) ─────────────────────────────────────────────────
      if (rawCredential.startsWith('fr_')) {
        let apiKey;
        try {
          apiKey = await apiKeyManager.validate(rawCredential);
        } catch (err) {
          await incrementIpFailures(redis, ip);
          throw err;
        }

        const profile = await db.profile.findUnique({
          where: { walletAddress: apiKey.walletAddress },
          select: { walletAddress: true, privyUserId: true, role: true, isBanned: true },
        });

        if (!profile || profile.isBanned) {
          throw new UnauthorizedError('Account has been suspended');
        }

        const actor: AuthenticatedUser = {
          userId: profile.privyUserId,
          walletAddress: apiKey.walletAddress,
          role: apiKey.role,
          sessionId: `apikey:${apiKey.id}`,
          privySessionId: `apikey:${apiKey.id}`,
          deviceId: deriveDeviceId(request),
          ipAddress: ip,
          issuedAt: Math.floor(Date.now() / 1000),
          expiresAt: apiKey.expiresAt
            ? Math.floor(apiKey.expiresAt / 1000)
            : Math.floor(Date.now() / 1000) + 86400 * 365,
        };

        request.actor = actor;
        request.sessionId = actor.sessionId;
        request.deviceId = actor.deviceId;
        await clearIpFailures(redis, ip);
        logger.debug({ walletAddress: actor.walletAddress, apiKeyId: apiKey.id }, 'API key authenticated');
        return;
      }

      const token = rawCredential;

      // ── Verify Privy token ───────────────────────────────────────────────────
      let verifyResult: Awaited<ReturnType<typeof verifyPrivyToken>>;
      try {
        verifyResult = await verifyPrivyToken(token);
      } catch (err) {
        await incrementIpFailures(redis, ip);
        await auditLogger.write({
          eventType: 'AUTH_VERIFY_FAILURE',
          actorId: null,
          actorRole: null,
          targetId: null,
          ipAddress: ip,
          userAgent: request.headers['user-agent'] ?? '',
          sessionId: null,
          outcome: 'FAILURE',
          details: { reason: err instanceof Error ? err.message : 'unknown' },
        });
        throw err;
      }

      const { claims, solanaWallet } = verifyResult;

      if (!solanaWallet) {
        throw new UnauthorizedError('No Solana wallet linked to Privy account');
      }

      // ── Load/upsert user profile ─────────────────────────────────────────────
      const profile = await db.profile.upsert({
        where: { walletAddress: solanaWallet },
        update: { lastSeenAt: new Date() },
        create: {
          walletAddress: solanaWallet,
          privyUserId: claims.userId,
          role: 'USER',
        },
        select: {
          walletAddress: true,
          privyUserId: true,
          role: true,
          isBanned: true,
        },
      });

      if (profile.isBanned) {
        throw new UnauthorizedError('Account has been suspended');
      }

      // ── Resolve or create session ────────────────────────────────────────────
      const deviceId = deriveDeviceId(request);
      const sessionId = request.headers['x-session-id'] as string | undefined;

      let session;
      if (sessionId) {
        try {
          session = await sessionManager.validate(sessionId, solanaWallet);
        } catch {
          session = null;
        }
      }

      if (!session) {
        session = await sessionManager.create({
          userId: claims.userId,
          walletAddress: solanaWallet,
          role: profile.role as UserRole,
          privySessionId: claims.sessionId,
          deviceId,
          ipAddress: ip,
          userAgent: request.headers['user-agent'] ?? '',
        });

        reply.header('x-session-id', session.sessionId);
      }

      // ── Attach actor ─────────────────────────────────────────────────────────
      const actor: AuthenticatedUser = {
        userId: claims.userId,
        walletAddress: solanaWallet,
        role: profile.role as UserRole,
        sessionId: session.sessionId,
        privySessionId: claims.sessionId,
        deviceId,
        ipAddress: ip,
        issuedAt: claims.issuedAt,
        expiresAt: claims.expiration,
      };

      request.actor = actor;
      request.sessionId = session.sessionId;
      request.deviceId = deviceId;

      // Clear IP failure counter on success
      await clearIpFailures(redis, ip);

      logger.debug(
        { walletAddress: actor.walletAddress, role: actor.role, sessionId: session.sessionId },
        'User authenticated',
      );
    });
  },
  { name: 'authenticate', fastify: '5.x' },
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractIp(request: FastifyRequest): string {
  const forwarded = request.headers[HEADERS.X_FORWARDED_FOR];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() ?? request.ip;
  }
  return request.ip;
}

function deriveDeviceId(request: FastifyRequest): string {
  const explicit = request.headers[HEADERS.X_DEVICE_ID];
  if (typeof explicit === 'string' && explicit.length > 0) {
    return explicit.slice(0, 64);
  }
  // Fallback: hash of User-Agent + Accept-Language
  return createHash('sha256')
    .update((request.headers['user-agent'] ?? '') + (request.headers['accept-language'] ?? ''))
    .digest('hex')
    .slice(0, 32);
}

async function isIpBlocked(redis: Redis, ip: string): Promise<boolean> {
  const key = `auth:ip_block:${ip}`;
  const val = await redis.get(key);
  return val !== null;
}

async function incrementIpFailures(redis: Redis, ip: string): Promise<void> {
  const key = `auth:ip_failures:${ip}`;
  const count = await redis.incr(key);
  await redis.expire(key, IP_ABUSE_WINDOW_SECONDS);

  if (count >= IP_ABUSE_THRESHOLD) {
    const blockKey = `auth:ip_block:${ip}`;
    await redis.set(blockKey, '1', 'EX', IP_ABUSE_BLOCK_SECONDS);
  }
}

async function clearIpFailures(redis: Redis, ip: string): Promise<void> {
  await redis.del(`auth:ip_failures:${ip}`);
}
