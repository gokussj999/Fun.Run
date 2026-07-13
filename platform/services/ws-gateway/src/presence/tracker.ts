import type { Redis } from 'ioredis';
import type { Logger } from '@funrun/logger';

import type { PresenceRecord } from '../types.js';
import { RK, PRESENCE_TTL_SECONDS, PRESENCE_RENEWAL_MS, WORKER_ID } from '../constants.js';

/**
 * PresenceTracker stores lightweight connection metadata in Redis.
 *
 * Each connected client has a key: wsg:presence:{connId}
 * This allows monitoring tools to count total platform connections across all workers.
 *
 * Renewal is automatic via a per-connection interval.
 * On disconnect, the key is explicitly deleted.
 */
export class PresenceTracker {
  private readonly timers = new Map<string, ReturnType<typeof setInterval>>();

  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger,
  ) {}

  async register(connId: string, walletAddress: string | null): Promise<void> {
    const record: PresenceRecord = {
      connectionId:  connId,
      workerId:      WORKER_ID,
      walletAddress,
      connectedAt:   Date.now(),
    };

    try {
      await this.redis.setex(RK.presence(connId), PRESENCE_TTL_SECONDS, JSON.stringify(record));
    } catch (err) {
      this.logger.warn({ connId, err }, 'PresenceTracker: register failed');
    }

    // Periodic renewal
    const timer = setInterval(() => { void this.renew(connId, walletAddress); }, PRESENCE_RENEWAL_MS);
    this.timers.set(connId, timer);
  }

  async deregister(connId: string): Promise<void> {
    const timer = this.timers.get(connId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(connId);
    }
    try {
      await this.redis.del(RK.presence(connId));
    } catch (err) {
      this.logger.warn({ connId, err }, 'PresenceTracker: deregister failed');
    }
  }

  async updateWallet(connId: string, walletAddress: string): Promise<void> {
    const timer = this.timers.get(connId);
    if (!timer) return; // already deregistered

    clearInterval(timer);
    this.timers.delete(connId);
    await this.deregister(connId);
    await this.register(connId, walletAddress);
  }

  async getTotalConnections(): Promise<number> {
    try {
      const keys = await this.redis.keys(`${RK.presence('')}*`);
      return keys.length;
    } catch {
      return -1;
    }
  }

  private async renew(connId: string, walletAddress: string | null): Promise<void> {
    try {
      const record: PresenceRecord = {
        connectionId:  connId,
        workerId:      WORKER_ID,
        walletAddress,
        connectedAt:   Date.now(),
      };
      await this.redis.setex(RK.presence(connId), PRESENCE_TTL_SECONDS, JSON.stringify(record));
    } catch (err) {
      this.logger.warn({ connId, err }, 'PresenceTracker: renewal failed');
    }
  }
}
