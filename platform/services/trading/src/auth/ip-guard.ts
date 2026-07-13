import type { Redis } from 'ioredis';
import type { Logger } from '@funrun/logger';
import {
  type RedisDependencyMode,
  isStrictRedisMode,
  RedisDependencyError,
} from '../config/redis-dependency.js';

const IP_ABUSE_THRESHOLD = 50;
const IP_ABUSE_WINDOW_SECONDS = 300;
const IP_ABUSE_BLOCK_SECONDS = 1800;

const ipBlockKey    = (ip: string) => `auth:ip_block:${ip}`;
const ipFailuresKey = (ip: string) => `auth:ip_failures:${ip}`;

export class IpGuard {
  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger,
    private readonly redisMode: RedisDependencyMode = 'degraded',
  ) {}

  async isBlocked(ip: string): Promise<boolean> {
    try {
      return (await this.redis.get(ipBlockKey(ip))) !== null;
    } catch (err) {
      if (isStrictRedisMode(this.redisMode)) {
        this.logger.error({ err, ip }, 'IpGuard: Redis error in strict mode');
        throw new RedisDependencyError('IP guard unavailable');
      }
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
