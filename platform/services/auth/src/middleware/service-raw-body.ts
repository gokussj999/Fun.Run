import { Readable } from 'node:stream';

import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { HEADERS } from '../constants.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** Raw request body captured before JSON parse (service HMAC only). */
    rawBody?: string;
  }
}

/**
 * Captures raw body for service-to-service HMAC verification (H-05).
 * Runs in preParsing — before Fastify parses JSON.
 */
export const serviceRawBodyPlugin = fp(
  async (app: FastifyInstance) => {
    app.addHook('preParsing', async (request, _reply, payload) => {
      if (!request.headers[HEADERS.X_SERVICE_ID]) {
        return payload;
      }

      const chunks: Buffer[] = [];
      for await (const chunk of payload) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const buf = Buffer.concat(chunks);
      request.rawBody = buf.toString('utf8');
      return Readable.from(buf);
    });
  },
  { name: 'service-raw-body', fastify: '5.x' },
);
