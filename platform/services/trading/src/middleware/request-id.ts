import { v4 as uuidv4 } from 'uuid';
import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
  }
}

// Allowlist pattern: alphanumeric, hyphens, underscores; 1–128 chars.
// Rejects arrays (multiple headers) and strings that could inject log fields.
const REQUEST_ID_RE = /^[\w-]{1,128}$/;

export function registerRequestId(app: FastifyInstance): void {
  app.decorateRequest('requestId', '');

  app.addHook('onRequest', (request, _reply, done) => {
    const raw = request.headers['x-request-id'];
    // Use propagated ID only when it is a single, safe string; generate otherwise.
    const propagated =
      typeof raw === 'string' && REQUEST_ID_RE.test(raw) ? raw : uuidv4();
    request.requestId = propagated;
    done();
  });

  app.addHook('onSend', (request, reply, _payload, done) => {
    void reply.header('x-request-id', request.requestId);
    done();
  });
}
