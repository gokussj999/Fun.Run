import { randomBytes, createHash } from 'node:crypto';

import type { Logger } from '@funrun/logger';
import type Redis from 'ioredis';

import {
  API_KEY_PREFIX_BYTES,
  API_KEY_TOTAL_BYTES,
  API_KEY_HASH_ALG,
  API_KEY_MAX_PER_USER,
  REDIS_KEYS_AUTH,
} from '../constants.js';
import type {
  ApiKey,
  ApiKeyCreateInput,
  ApiKeyCreateResult,
  Permission,
  UserRole,
} from '../types.js';
import { ConflictError, NotFoundError, ForbiddenError } from '@funrun/shared';
import { randomUUID } from 'node:crypto';

// In-memory store for this phase (Phase 8.x will add DB persistence)
// Redis is used as the runtime lookup cache
const _store = new Map<string, ApiKey>();

function hashKey(rawKey: string): string {
  return createHash(API_KEY_HASH_ALG).update(rawKey).digest('hex');
}

export class ApiKeyManager {
  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger,
  ) {}

  async create(input: ApiKeyCreateInput): Promise<ApiKeyCreateResult> {
    // Enforce per-user limit
    const existing = [..._store.values()].filter(
      (k) => k.walletAddress === input.walletAddress && !k.isRevoked,
    );

    if (existing.length >= API_KEY_MAX_PER_USER) {
      throw new ConflictError(
        `Maximum ${API_KEY_MAX_PER_USER} API keys per user. Revoke an existing key first.`,
      );
    }

    // Generate raw key: prefix (8 hex) + separator + secret (56 hex)
    const prefixBytes = randomBytes(API_KEY_PREFIX_BYTES);
    const secretBytes = randomBytes(API_KEY_TOTAL_BYTES - API_KEY_PREFIX_BYTES);
    const keyPrefix = prefixBytes.toString('hex');
    const rawKey = `fr_${keyPrefix}_${secretBytes.toString('hex')}`;
    const keyHash = hashKey(rawKey);

    const now = Date.now();
    const expiresAt = input.expiresIn ? now + input.expiresIn * 1000 : null;

    const apiKey: ApiKey = {
      id: randomUUID(),
      name: input.name,
      keyPrefix: `fr_${keyPrefix}`,
      keyHash,
      walletAddress: input.walletAddress,
      role: input.role,
      permissions: input.permissions,
      createdAt: now,
      expiresAt,
      lastUsedAt: null,
      isRevoked: false,
    };

    _store.set(apiKey.id, apiKey);

    // Cache prefix → id mapping in Redis for fast lookup
    await this.redis.set(
      REDIS_KEYS_AUTH.apiKey(apiKey.keyPrefix),
      apiKey.id,
      'EX',
      expiresAt ? Math.floor((expiresAt - now) / 1000) : 30 * 24 * 3600, // 30 days default
    );

    this.logger.info(
      { id: apiKey.id, name: apiKey.name, walletAddress: input.walletAddress },
      'API key created',
    );

    return {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey, // shown ONCE — never stored in plaintext
      keyPrefix: apiKey.keyPrefix,
      expiresAt,
    };
  }

  /**
   * Validate a raw API key.
   * Looks up by prefix in Redis (fast), then verifies hash (constant-time).
   */
  async validate(rawKey: string): Promise<ApiKey> {
    // Extract prefix (fr_XXXXXXXX)
    const parts = rawKey.split('_');
    if (parts.length < 2 || parts[0] !== 'fr') {
      throw new ForbiddenError('Invalid API key format');
    }

    const prefix = `fr_${parts[1] ?? ''}`;
    const keyId = await this.redis.get(REDIS_KEYS_AUTH.apiKey(prefix));

    if (!keyId) {
      throw new ForbiddenError('API key not found');
    }

    const key = _store.get(keyId);
    if (!key) {
      throw new ForbiddenError('API key not found');
    }

    if (key.isRevoked) {
      throw new ForbiddenError('API key has been revoked');
    }

    if (key.expiresAt !== null && key.expiresAt < Date.now()) {
      throw new ForbiddenError('API key has expired');
    }

    // Hash comparison (timing-safe via constant-time string comparison)
    const inputHash = hashKey(rawKey);
    if (inputHash !== key.keyHash) {
      throw new ForbiddenError('API key invalid');
    }

    // Update last used
    const updated: ApiKey = { ...key, lastUsedAt: Date.now() };
    _store.set(key.id, updated);

    return updated;
  }

  async revoke(id: string, walletAddress: string, isAdmin: boolean): Promise<void> {
    const key = _store.get(id);
    if (!key) throw new NotFoundError(`API key ${id}`);

    if (!isAdmin && key.walletAddress !== walletAddress) {
      throw new ForbiddenError('Cannot revoke another user\'s API key');
    }

    const revoked: ApiKey = { ...key, isRevoked: true };
    _store.set(id, revoked);

    await this.redis.del(REDIS_KEYS_AUTH.apiKey(key.keyPrefix));

    this.logger.info({ id, walletAddress }, 'API key revoked');
  }

  listByWallet(walletAddress: string): ApiKey[] {
    return [..._store.values()]
      .filter((k) => k.walletAddress === walletAddress)
      .map((k) => ({ ...k, keyHash: '[REDACTED]' })); // never expose hash
  }
}
