import type { Redis } from 'ioredis';
import type { Logger } from '@funrun/logger';

import type { ReplayEntry } from '../types.js';
import { RK, REPLAY_BUFFER_SIZE, REPLAY_TTL_SECONDS } from '../constants.js';

/**
 * ReplayBuffer stores the last N events per channel in a Redis Sorted Set.
 *
 * Score = sequence number (integer).
 * Member = JSON-serialized ReplayEntry.
 *
 * On reconnect, clients send fromSeq → we return all entries with score >= fromSeq.
 *
 * ZADD NX prevents overwriting if multiple gateway workers race on the same event
 * (they should have the same seq since the Redis INCR is atomic).
 */
export class ReplayBuffer {
  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger,
  ) {}

  async push(channel: string, seq: number, entry: ReplayEntry): Promise<void> {
    const key = RK.replay(channel);
    try {
      const pipeline = this.redis.pipeline();
      pipeline.zadd(key, 'NX', seq, JSON.stringify(entry));
      // Keep only the last REPLAY_BUFFER_SIZE entries
      pipeline.zremrangebyrank(key, 0, -(REPLAY_BUFFER_SIZE + 1));
      pipeline.expire(key, REPLAY_TTL_SECONDS);
      await pipeline.exec();
    } catch (err) {
      // Non-fatal — replay is best-effort
      this.logger.warn({ channel, seq, err }, 'ReplayBuffer: push failed');
    }
  }

  /**
   * Get all events since (and including) fromSeq.
   * Returns empty array if fromSeq is older than the buffer window.
   */
  async getFrom(channel: string, fromSeq: number): Promise<ReplayEntry[]> {
    const key = RK.replay(channel);
    try {
      const raw = await this.redis.zrangebyscore(key, fromSeq, '+inf');
      return raw
        .map((r) => {
          try { return JSON.parse(r) as ReplayEntry; } catch { return null; }
        })
        .filter(Boolean) as ReplayEntry[];
    } catch (err) {
      this.logger.warn({ channel, fromSeq, err }, 'ReplayBuffer: getFrom failed');
      return [];
    }
  }

  /** Get the current head sequence for a channel (for subscribed message). */
  async getHeadSeq(channel: string): Promise<number> {
    try {
      const raw = await this.redis.zrange(RK.replay(channel), -1, -1, 'WITHSCORES');
      if (raw.length >= 2 && raw[1]) return parseInt(raw[1], 10);
    } catch { /* noop */ }
    return 0;
  }
}
