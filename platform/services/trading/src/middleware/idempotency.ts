import type { FastifyInstance } from 'fastify';
import { IdempotencyKeySchema } from '../validation/trade.schema.js';
import type { IdempotencyStore } from '../idempotency/store.js';

// Applied only to mutating trade routes: POST /trade/buy and POST /trade/sell.
// GET /trade/quote is read-only and does not participate in idempotency.
const IDEMPOTENCY_ROUTES = new Set(['/trade/buy', '/trade/sell']);

export function registerIdempotency(app: FastifyInstance, store: IdempotencyStore): void {
  app.addHook('preHandler', async (request, reply) => {
    const path = request.url.split('?')[0]!;
    if (!IDEMPOTENCY_ROUTES.has(path)) return;

    const rawKey = request.headers['idempotency-key'];
    if (!rawKey) return; // key is optional — absence means no replay protection

    const parseResult = IdempotencyKeySchema.safeParse(rawKey);
    if (!parseResult.success) {
      return reply.code(400).send({
        error: 'INVALID_IDEMPOTENCY_KEY',
        message: parseResult.error.errors[0]?.message ?? 'Invalid Idempotency-Key header',
        requestId: request.requestId,
      });
    }

    const key = parseResult.data;

    let cached = null;
    try {
      cached = await store.get(key);
    } catch {
      // Redis unavailable — fail open: let the request proceed without replay protection.
      // The trade will execute normally; idempotency is best-effort when Redis is down.
      return;
    }

    if (cached) {
      return reply
        .code(cached.status)
        .header('idempotency-replay', 'true')
        .send(cached.body);
    }

    // Stash the key on the request so the route handler can store the result after success.
    (request as unknown as Record<string, unknown>)['_idempotencyKey'] = key;
  });
}

export function getIdempotencyKey(request: unknown): string | undefined {
  return (request as Record<string, unknown>)['_idempotencyKey'] as string | undefined;
}
