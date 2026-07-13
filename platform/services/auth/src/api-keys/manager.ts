import { randomBytes, createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';

import type { Logger } from '@funrun/logger';
import type { RedisInstance as Redis } from '@funrun/redis';
import { ConflictError, NotFoundError, ForbiddenError } from '@funrun/shared';

import {
  API_KEY_PREFIX_BYTES,
  API_KEY_TOTAL_BYTES,
  API_KEY_HASH_ALG,
  API_KEY_MAX_PER_USER,
} from '../constants.js';
import type {
  ApiKey,
  ApiKeyCreateInput,
  ApiKeyCreateResult,
} from '../types.js';
import { ApiKeyStore, verifyKeyHash } from './store.js';

function hashKey(rawKey: string): string {
  return createHash(API_KEY_HASH_ALG).update(rawKey).digest('hex');
}

export class ApiKeyManager {
  private readonly store: ApiKeyStore;

  constructor(
    redis: Redis,
    private readonly logger: Logger,
  ) {
    this.store = new ApiKeyStore(redis);
  }

  async create(input: ApiKeyCreateInput): Promise<ApiKeyCreateResult> {
    const activeCount = await this.store.countActive(input.walletAddress);
    if (activeCount >= API_KEY_MAX_PER_USER) {
      throw new ConflictError(
        `Maximum ${API_KEY_MAX_PER_USER} API keys per user. Revoke an existing key first.`,
      );
    }

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

    await this.store.save(apiKey);

    this.logger.info(
      { id: apiKey.id, name: apiKey.name, walletAddress: input.walletAddress },
      'API key created',
    );

    return {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      keyPrefix: apiKey.keyPrefix,
      expiresAt,
    };
  }

  async validate(rawKey: string): Promise<ApiKey> {
    const parts = rawKey.split('_');
    if (parts.length < 3 || parts[0] !== 'fr') {
      throw new ForbiddenError('Invalid API key format');
    }

    const prefix = `fr_${parts[1] ?? ''}`;
    const key = await this.store.getByPrefix(prefix);
    if (!key) {
      throw new ForbiddenError('API key not found');
    }

    if (key.isRevoked) {
      throw new ForbiddenError('API key has been revoked');
    }

    if (key.expiresAt !== null && key.expiresAt < Date.now()) {
      throw new ForbiddenError('API key has expired');
    }

    const inputHash = hashKey(rawKey);
    if (!verifyKeyHash(inputHash, key.keyHash)) {
      throw new ForbiddenError('API key invalid');
    }

    const updated: ApiKey = { ...key, lastUsedAt: Date.now() };
    await this.store.update(updated);
    return updated;
  }

  async revoke(id: string, walletAddress: string, isAdmin: boolean): Promise<void> {
    const key = await this.store.getById(id);
    if (!key) throw new NotFoundError(`API key ${id}`);

    if (!isAdmin && key.walletAddress !== walletAddress) {
      throw new ForbiddenError('Cannot revoke another user\'s API key');
    }

    await this.store.revoke(key);
    this.logger.info({ id, walletAddress }, 'API key revoked');
  }

  async listByWallet(walletAddress: string): Promise<ApiKey[]> {
    return (await this.store.listByWallet(walletAddress)).map((k) => ({
      ...k,
      keyHash: '[REDACTED]',
    }));
  }
}
