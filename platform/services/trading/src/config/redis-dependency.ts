/**
 * Redis dependency mode — controls fail-open vs fail-closed behavior (H-01).
 *
 * degraded (default): Redis outages do not halt trading — rate limits and
 *   idempotency degrade gracefully (backward compatible).
 * strict: Redis required for rate-limit, idempotency, and IP guard — returns 503.
 */

export type RedisDependencyMode = 'degraded' | 'strict';

export function resolveRedisDependencyMode(
  env: NodeJS.ProcessEnv = process.env,
): RedisDependencyMode {
  const raw = env['REDIS_DEPENDENCY_MODE']?.trim().toLowerCase();
  if (raw === 'strict') return 'strict';
  return 'degraded';
}

export function isStrictRedisMode(mode: RedisDependencyMode): boolean {
  return mode === 'strict';
}

/** Thrown when a Redis-backed guard cannot operate in strict mode. */
export class RedisDependencyError extends Error {
  constructor(message = 'Redis dependency unavailable') {
    super(message);
    this.name = 'RedisDependencyError';
  }
}

export function redisUnavailablePayload(requestId: string) {
  return {
    error: 'SERVICE_UNAVAILABLE' as const,
    message: 'Required dependency temporarily unavailable. Retry later.',
    requestId,
  };
}
