import { timingSafeEqual } from 'node:crypto';

import type { RedisInstance as Redis } from '@funrun/redis';

import { REDIS_KEYS_AUTH } from '../constants.js';
import type { ApiKey } from '../types.js';

const RECORD_PREFIX = 'auth:api_key:id:';
const WALLET_INDEX_PREFIX = 'auth:api_key_wallet:';
const DEFAULT_TTL_SECONDS = 30 * 24 * 3600;

function recordKey(id: string): string {
  return `${RECORD_PREFIX}${id}`;
}

function walletIndexKey(walletAddress: string): string {
  return `${WALLET_INDEX_PREFIX}${walletAddress}`;
}

function ttlSeconds(apiKey: ApiKey): number {
  if (apiKey.expiresAt === null) return DEFAULT_TTL_SECONDS;
  const remaining = Math.floor((apiKey.expiresAt - Date.now()) / 1000);
  return Math.max(remaining, 60);
}

export class ApiKeyStore {
  constructor(private readonly redis: Redis) {}

  async save(apiKey: ApiKey): Promise<void> {
    const ttl = ttlSeconds(apiKey);
    const pipeline = this.redis.pipeline();
    pipeline.set(recordKey(apiKey.id), JSON.stringify(apiKey), 'EX', ttl);
    pipeline.set(REDIS_KEYS_AUTH.apiKey(apiKey.keyPrefix), apiKey.id, 'EX', ttl);
    pipeline.sadd(walletIndexKey(apiKey.walletAddress), apiKey.id);
    pipeline.expire(walletIndexKey(apiKey.walletAddress), ttl + 3600);
    await pipeline.exec();
  }

  async getById(id: string): Promise<ApiKey | null> {
    const raw = await this.redis.get(recordKey(id));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ApiKey;
    } catch {
      return null;
    }
  }

  async getByPrefix(prefix: string): Promise<ApiKey | null> {
    const id = await this.redis.get(REDIS_KEYS_AUTH.apiKey(prefix));
    if (!id) return null;
    return this.getById(id);
  }

  async update(apiKey: ApiKey): Promise<void> {
    await this.save(apiKey);
  }

  async revoke(apiKey: ApiKey): Promise<void> {
    const revoked: ApiKey = { ...apiKey, isRevoked: true };
    await this.redis.set(recordKey(apiKey.id), JSON.stringify(revoked), 'EX', 3600);
    await this.redis.del(REDIS_KEYS_AUTH.apiKey(apiKey.keyPrefix));
    await this.redis.srem(walletIndexKey(apiKey.walletAddress), apiKey.id);
  }

  async listByWallet(walletAddress: string): Promise<ApiKey[]> {
    const ids = await this.redis.smembers(walletIndexKey(walletAddress));
    const keys: ApiKey[] = [];
    for (const id of ids) {
      const key = await this.getById(id);
      if (key && !key.isRevoked) keys.push(key);
    }
    return keys;
  }

  async countActive(walletAddress: string): Promise<number> {
    const keys = await this.listByWallet(walletAddress);
    const now = Date.now();
    return keys.filter((k) => k.expiresAt === null || k.expiresAt > now).length;
  }
}

export function verifyKeyHash(inputHash: string, storedHash: string): boolean {
  try {
    const a = Buffer.from(inputHash, 'hex');
    const b = Buffer.from(storedHash, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
