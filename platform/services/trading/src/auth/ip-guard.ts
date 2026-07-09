import type Redis from 'ioredis';
import type { Logger } from '@funrun/logger';

// Thresholds kept in sync with Auth Service (services/auth/src/constants.ts).
// If either value drifts, shared Redis state becomes inconsistent.
const IP_ABUSE_THRESHOLD = 50;
const IP_ABUSE_WINDOW_SECONDS = 300;  // 5-minute sliding window
const IP_ABUSE_BLOCK_SECONDS = 1800;  // 30-minute block

// Redis key format MUST match Auth Service exactly so both services share the
// same block list.  An IP blocked by the Auth Service is immediately blocked
// here too — no coordination required beyond the shared Redis instance.
const ipBlockKey    = (ip: string) => `auth:ip_block:${ip}`;
const ipFailuresKey = (ip: string) => `auth:ip_failures:${ip}`;

export class IpGuard {
  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger,
  ) {}

  async isBlocked(ip: string): Promise<boolean> {
    try {
      return (await this.redis.get(ipBlockKey(ip))) !== null;
    } catch (err) {
      // Fail-open: Redis unavailable must not halt trading.
      this.logger.warn({ err, ip }, 'IpGuard: Redis error on block check, failing open');
      return false;
    }
  }

  async recordFailure(ip: string): Promise<void> {
    try {
      const key = ipFailuresKey(ip);
      const count = await this.redis.incr(key);
      await this.redis.expire(key, IP_ABUSE_WINDOW_SECONDS);

      if (count >= IP_ABUSE_THRESHOLD) {
        await this.redis.set(ipBlockKey(ip), '1', 'EX', IP_ABUSE_BLOCK_SECONDS);
        this.logger.warn({ ip, count }, 'IpGuard: IP blocked — abuse threshold reached');
      }
    } catch (err) {
      // Best-effort — failure tracking is non-fatal.
      this.logger.warn({ err, ip }, 'IpGuard: Redis error recording failure (non-fatal)');
    }
  }

  async clearFailures(ip: string): Promise<void> {
    try {
      await this.redis.del(ipFailuresKey(ip));
    } catch {
      // Best-effort.
    }
  }
}
