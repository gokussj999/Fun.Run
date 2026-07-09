import type Redis from 'ioredis';

import type { Logger } from '@funrun/logger';
import type { PrismaClient } from '@funrun/database';

import type { AuditEvent, AuditEventType } from '../types.js';

export class AuditEventLogger {
  constructor(
    private readonly db: PrismaClient,
    private readonly redis: Redis,
    private readonly logger: Logger,
  ) {}

  async write(event: Omit<AuditEvent, 'timestamp'>): Promise<void> {
    const fullEvent: AuditEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Structured log (primary — always succeeds)
    this.logger.info(
      {
        audit: true,
        eventType: fullEvent.eventType,
        actorId: fullEvent.actorId,
        actorRole: fullEvent.actorRole,
        targetId: fullEvent.targetId,
        ipAddress: fullEvent.ipAddress,
        sessionId: fullEvent.sessionId,
        outcome: fullEvent.outcome,
        details: fullEvent.details,
      },
      `AUDIT: ${fullEvent.eventType}`,
    );

    // Async DB write (secondary — failure is non-fatal but logged)
    this.persistToDb(fullEvent).catch((err) => {
      this.logger.error(
        { err: err instanceof Error ? err.message : String(err), eventType: fullEvent.eventType },
        'Failed to persist audit event to DB',
      );
    });

    // Publish to Redis for real-time monitoring (optional — fire and forget)
    this.publishToRedis(fullEvent).catch(() => undefined);
  }

  private async persistToDb(event: AuditEvent): Promise<void> {
    // Map to the AuditLog model — only write events that have DB-mapped actions
    const DB_EVENTS: Set<AuditEventType> = new Set([
      'SESSION_REVOKED',
      'ROLE_CHANGED',
      'USER_BANNED',
      'UNAUTHORIZED_ACCESS',
      'REPLAY_ATTACK_DETECTED',
      'API_KEY_CREATED',
      'API_KEY_REVOKED',
    ]);

    if (!DB_EVENTS.has(event.eventType)) return;

    await this.db.auditLog.create({
      data: {
        action: mapEventToDbAction(event.eventType),
        actorWallet: event.actorId ?? 'unknown',
        targetId: event.targetId ?? undefined,
        newValue: event.details as Record<string, unknown>,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
      },
    });
  }

  private async publishToRedis(event: AuditEvent): Promise<void> {
    await this.redis.publish('audit:events', JSON.stringify(event));
  }
}

function mapEventToDbAction(type: AuditEventType): string {
  const map: Partial<Record<AuditEventType, string>> = {
    SESSION_REVOKED: 'PAUSE_PROTOCOL',        // reuse existing enum; extend in migration
    ROLE_CHANGED:    'UPDATE_GLOBAL_CONFIG',
    USER_BANNED:     'USER_BANNED',
    API_KEY_CREATED: 'INITIALIZE',
    API_KEY_REVOKED: 'INITIALIZE',
    UNAUTHORIZED_ACCESS: 'INITIALIZE',
    REPLAY_ATTACK_DETECTED: 'INITIALIZE',
  };
  return map[type] ?? 'INITIALIZE';
}
