import type { RedisInstance as Redis } from '@funrun/redis';

import type { Logger } from '@funrun/logger';

import { REDIS_KEYS_AUTH, SESSION_TTL_SECONDS } from '../constants.js';
import type { Session } from '../types.js';

export class SessionStore {
  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger,
  ) {}

  async set(session: Session, ttlSeconds: number = SESSION_TTL_SECONDS): Promise<void> {
    const key = REDIS_KEYS_AUTH.session(session.sessionId);
    const userKey = REDIS_KEYS_AUTH.userSessions(session.walletAddress);

    const pipeline = this.redis.pipeline();

    // Store full session data
    pipeline.set(key, JSON.stringify(session), 'EX', ttlSeconds);

    // Track session in user's session set (ZSET scored by expiry for cleanup)
    pipeline.zadd(userKey, session.expiresAt, session.sessionId);
    pipeline.expire(userKey, ttlSeconds + 60); // slightly longer than session TTL

    await pipeline.exec();
  }

  async get(sessionId: string): Promise<Session | null> {
    const key = REDIS_KEYS_AUTH.session(sessionId);
    const raw = await this.redis.get(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as Session;
    } catch {
      this.logger.warn({ sessionId }, 'Failed to parse session from Redis');
      return null;
    }
  }

  async touch(sessionId: string, walletAddress: string, ttlSeconds: number = SESSION_TTL_SECONDS): Promise<void> {
    const key = REDIS_KEYS_AUTH.session(sessionId);
    const existing = await this.get(sessionId);
    if (!existing || existing.isRevoked) return;

    const updated: Session = {
      ...existing,
      lastSeenAt: Date.now(),
      expiresAt: Date.now() + ttlSeconds * 1000,
    };

    await this.set(updated, ttlSeconds);

    // Update expiry score in user set
    const userKey = REDIS_KEYS_AUTH.userSessions(walletAddress);
    await this.redis.zadd(userKey, updated.expiresAt, sessionId);
  }

  async revoke(sessionId: string, walletAddress: string): Promise<boolean> {
    const key = REDIS_KEYS_AUTH.session(sessionId);
    const existing = await this.get(sessionId);

    if (!existing) return false;

    // Mark as revoked (keep record for short-term audit; TTL will clean up)
    const revoked: Session = { ...existing, isRevoked: true };
    await this.redis.set(key, JSON.stringify(revoked), 'EX', 60); // 1 min tombstone

    // Remove from user set
    const userKey = REDIS_KEYS_AUTH.userSessions(walletAddress);
    await this.redis.zrem(userKey, sessionId);

    return true;
  }

  async revokeAll(walletAddress: string): Promise<number> {
    const userKey = REDIS_KEYS_AUTH.userSessions(walletAddress);
    const sessionIds = await this.redis.zrange(userKey, 0, -1);

    if (sessionIds.length === 0) return 0;

    const pipeline = this.redis.pipeline();
    for (const id of sessionIds) {
      const existing = await this.get(id);
      if (existing) {
        const revoked: Session = { ...existing, isRevoked: true };
        pipeline.set(REDIS_KEYS_AUTH.session(id), JSON.stringify(revoked), 'EX', 60);
      }
    }
    pipeline.del(userKey);
    await pipeline.exec();

    return sessionIds.length;
  }

  async listByUser(walletAddress: string): Promise<Session[]> {
    const userKey = REDIS_KEYS_AUTH.userSessions(walletAddress);
    const now = Date.now();

    // Remove expired entries from the set
    await this.redis.zremrangebyscore(userKey, '-inf', now);

    const sessionIds = await this.redis.zrange(userKey, 0, -1);
    const sessions: Session[] = [];

    for (const id of sessionIds) {
      const session = await this.get(id);
      if (session && !session.isRevoked && session.expiresAt > now) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  async count(walletAddress: string): Promise<number> {
    const userKey = REDIS_KEYS_AUTH.userSessions(walletAddress);
    const now = Date.now();
    await this.redis.zremrangebyscore(userKey, '-inf', now);
    return this.redis.zcard(userKey);
  }

  async pruneExpired(walletAddress: string): Promise<void> {
    const userKey = REDIS_KEYS_AUTH.userSessions(walletAddress);
    await this.redis.zremrangebyscore(userKey, '-inf', Date.now());
  }
}
