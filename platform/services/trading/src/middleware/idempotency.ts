import type { FastifyInstance } from 'fastify';
import { IdempotencyKeySchema } from '../validation/trade.schema.js';
import type { IdempotencyStore } from '../idempotency/store.js';
import { RedisDependencyError, redisUnavailablePayload } from '../config/redis-dependency.js';

const IDEMPOTENCY_ROUTES = new Set(['/trade/buy', '/trade/sell', '/coins']);

const KEY_PROP   = '_idempotencyKey';
const OWNED_PROP = '_idempotencyOwned';

export interface IdempotencyMiddlewareOptions {
  /** When true, missing Idempotency-Key returns 400 (H-02). */
  requireKey?: boolean;
}

export function registerIdempotency(
  app: FastifyInstance,
  store: IdempotencyStore,
  opts: IdempotencyMiddlewareOptions = {},
): void {
  const requireKey = opts.requireKey ?? false;

  app.addHook('preHandler', async (request, reply) => {
    const path = request.url.split('?')[0]!;
    if (!IDEMPOTENCY_ROUTES.has(path)) return;

    const rawKey = request.headers['idempotency-key'];
    if (!rawKey) {
      if (requireKey) {
        return reply.code(400).send({
          error: 'MISSING_IDEMPOTENCY_KEY',
          message: 'Idempotency-Key header is required for trade requests',
          requestId: request.requestId,
        });
      }
      return;
    }

    const parseResult = IdempotencyKeySchema.safeParse(rawKey);
    if (!parseResult.success) {
      return reply.code(400).send({
        error: 'INVALID_IDEMPOTENCY_KEY',
        message: parseResult.error.errors[0]?.message ?? 'Invalid Idempotency-Key header',
        requestId: request.requestId,
      });
    }

    const key = parseResult.data;
    const req = request as unknown as Record<string, unknown>;

    try {
      const acquired = await store.acquire(key);

      if (!acquired) {
        let existing = null;
        try { existing = await store.get(key); } catch { /* fall through to 409 */ }

        if (existing) {
          return reply
            .code(existing.status)
            .header('idempotency-replay', 'true')
            .send(existing.body);
        }

        return reply.code(409).send({
          error: 'IDEMPOTENCY_CONFLICT',
          message:
            'A request with this Idempotency-Key is already being processed. ' +
            'Retry after the first request completes.',
          requestId: request.requestId,
        });
      }

      req[KEY_PROP]   = key;
      req[OWNED_PROP] = true;
    } catch (err) {
      if (err instanceof RedisDependencyError) {
        return reply.code(503).send(redisUnavailablePayload(request.requestId));
      }
      req[KEY_PROP] = key;
    }
  });

  app.addHook('onSend', async (request, reply, _payload) => {
    const path = request.url.split('?')[0]!;
    if (!IDEMPOTENCY_ROUTES.has(path)) return;

    const req   = request as unknown as Record<string, unknown>;
    const key   = req[KEY_PROP]   as string  | undefined;
    const owned = req[OWNED_PROP] as boolean | undefined;

    if (!key || !owned) return;

    if (reply.statusCode < 200 || reply.statusCode >= 300) {
      await store.release(key);
    }
  });
}

export function getIdempotencyKey(request: unknown): string | undefined {
  return (request as Record<string, unknown>)[KEY_PROP] as string | undefined;
}
