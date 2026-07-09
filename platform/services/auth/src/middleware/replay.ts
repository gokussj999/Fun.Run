import type Redis from 'ioredis';

import type { Logger } from '@funrun/logger';
import { AppError } from '@funrun/shared';

import { NONCE_TTL_SECONDS, NONCE_MAX_LENGTH, REDIS_KEYS_AUTH } from '../constants.js';

/**
 * Replay attack protection via nonce tracking.
 * Nonces are single-use; each is stored in Redis with a short TTL.
 * If a nonce has already been seen within the TTL window, the request is rejected.
 */
export class ReplayProtection {
  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger,
  ) {}

  /**
   * Validate a nonce: it must not have been seen before.
   * Side-effect: marks the nonce as seen if valid.
   * @param nonce - opaque string from the request
   * @param prefix - key prefix to namespace nonces per use-case (e.g. 'svc', 'api-key')
   */
  async validateAndConsume(nonce: string, prefix: 'svc' | 'api-key' = 'svc'): Promise<void> {
    if (!nonce || nonce.length > NONCE_MAX_LENGTH) {
      throw new ReplayError('Invalid nonce format');
    }

    const key = prefix === 'svc'
      ? REDIS_KEYS_AUTH.serviceNonce(nonce)
      : REDIS_KEYS_AUTH.nonce(nonce);

    // SET NX (only set if not exists) — atomic check-and-set
    const set = await this.redis.set(key, '1', 'EX', NONCE_TTL_SECONDS, 'NX');

    if (set === null) {
      this.logger.warn({ nonce: nonce.slice(0, 8) }, 'Replay attack detected — nonce already used');
      throw new ReplayError('Nonce already used — possible replay attack');
    }
  }

  /**
   * Validate a timestamp is within acceptable tolerance.
   * Prevents old requests from being replayed after nonce TTL expires.
   */
  validateTimestamp(timestamp: string, toleranceMs: number): void {
    const ts = new Date(timestamp).getTime();
    if (isNaN(ts)) {
      throw new ReplayError('Invalid timestamp format');
    }

    const drift = Math.abs(Date.now() - ts);
    if (drift > toleranceMs) {
      throw new ReplayError(
        `Request timestamp too old or too far in future (drift: ${drift}ms, tolerance: ${toleranceMs}ms)`,
      );
    }
  }
}

export class ReplayError extends AppError {
  constructor(message: string) {
    super({ code: 'REPLAY_ATTACK', message, statusCode: 400, isOperational: true });
  }
}
