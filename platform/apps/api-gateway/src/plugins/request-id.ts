import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';

export function registerRequestId(app: FastifyInstance): void {
  app.addHook('onRequest', async (request, reply) => {
    const existing = request.headers['x-request-id'];
    const requestId = typeof existing === 'string' ? existing : randomUUID();

    // Attach to reply so error handler + routes can access it
    reply.header('x-request-id', requestId);
    request.headers['x-request-id'] = requestId;
  });
}
