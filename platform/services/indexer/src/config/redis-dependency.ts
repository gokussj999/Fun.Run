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

export class RedisDependencyError extends Error {
  constructor(message = 'Redis dependency unavailable') {
    super(message);
    this.name = 'RedisDependencyError';
  }
}
