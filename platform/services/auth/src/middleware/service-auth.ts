import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import type { Logger } from '@funrun/logger';
import { UnauthorizedError } from '@funrun/shared';

import {
  SERVICE_HMAC_ALG,
  SERVICE_NONCE_BYTES,
  SERVICE_TIMESTAMP_TOLERANCE_MS,
  HEADERS,
} from '../constants.js';
import type { ServiceIdentity } from '../types.js';
import { ReplayProtection } from './replay.js';

export interface ServiceAuthConfig {
  services: Record<string, { name: string; secret: string }>;
  replayProtection: ReplayProtection;
  logger: Logger;
}

/**
 * Generate HMAC-SHA256 signature for a service request.
 * Signature covers: serviceId + timestamp + nonce + method + path + bodyHash
 * Body hash prevents request body tampering.
 */
export function signServiceRequest(opts: {
  serviceId: string;
  secret: string;
  method: string;
  path: string;
  body?: string;
}): { timestamp: string; nonce: string; signature: string } {
  const timestamp = new Date().toISOString();
  const nonce = randomBytes(SERVICE_NONCE_BYTES).toString('hex');
  const bodyHash = createHmac(SERVICE_HMAC_ALG, opts.secret)
    .update(opts.body ?? '')
    .digest('hex');

  const message = [opts.serviceId, timestamp, nonce, opts.method.toUpperCase(), opts.path, bodyHash].join('\n');

  const signature = createHmac(SERVICE_HMAC_ALG, opts.secret)
    .update(message)
    .digest('hex');

  return { timestamp, nonce, signature };
}

/**
 * Verify service-to-service HMAC signature.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyServiceSignature(opts: {
  serviceId: string;
  secret: string;
  timestamp: string;
  nonce: string;
  method: string;
  path: string;
  body: string;
  signature: string;
}): boolean {
  const bodyHash = createHmac(SERVICE_HMAC_ALG, opts.secret)
    .update(opts.body)
    .digest('hex');

  const message = [opts.serviceId, opts.timestamp, opts.nonce, opts.method.toUpperCase(), opts.path, bodyHash].join('\n');

  const expected = createHmac(SERVICE_HMAC_ALG, opts.secret)
    .update(message)
    .digest('hex');

  // Timing-safe comparison — prevents length oracle attacks
  try {
    const expectedBuf = Buffer.from(expected, 'hex');
    const actualBuf = Buffer.from(opts.signature, 'hex');
    if (expectedBuf.length !== actualBuf.length) return false;
    return timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}

/**
 * Fastify plugin: authenticate service-to-service requests via HMAC signatures.
 * Attaches ServiceIdentity to request.actor if successful.
 */
export const serviceAuthPlugin = fp(
  async (app: FastifyInstance, config: ServiceAuthConfig) => {
    app.decorateRequest('actor', null as unknown as ServiceIdentity);

    app.addHook('onRequest', async (request: FastifyRequest, reply) => {
      const serviceId = request.headers[HEADERS.X_SERVICE_ID] as string | undefined;

      // No service header — not a service request; skip (user auth handles it)
      if (!serviceId) return;

      const timestamp = request.headers[HEADERS.X_SERVICE_TIMESTAMP] as string | undefined;
      const nonce = request.headers[HEADERS.X_SERVICE_NONCE] as string | undefined;
      const signature = request.headers[HEADERS.X_SERVICE_SIGNATURE] as string | undefined;

      if (!timestamp || !nonce || !signature) {
        throw new UnauthorizedError('Incomplete service authentication headers');
      }

      // 1. Timestamp check (prevents old replay beyond nonce TTL window)
      config.replayProtection.validateTimestamp(timestamp, SERVICE_TIMESTAMP_TOLERANCE_MS);

      // 2. Nonce check (prevents replay within nonce TTL window)
      await config.replayProtection.validateAndConsume(nonce, 'svc');

      // 3. Service registry lookup
      const serviceConfig = config.services[serviceId];
      if (!serviceConfig) {
        config.logger.warn({ serviceId }, 'Unknown service ID in request');
        throw new UnauthorizedError(`Unknown service: ${serviceId}`);
      }

      // 4. Signature verification (use raw body captured in preParsing — H-05)
      const rawBody = request.rawBody ?? '';
      const valid = verifyServiceSignature({
        serviceId,
        secret: serviceConfig.secret,
        timestamp,
        nonce,
        method: request.method,
        path: request.url,
        body: rawBody,
        signature,
      });

      if (!valid) {
        config.logger.warn({ serviceId, path: request.url }, 'Service HMAC signature invalid');
        throw new UnauthorizedError('Service signature verification failed');
      }

      // 5. Attach identity
      const identity: ServiceIdentity = {
        serviceId,
        serviceName: serviceConfig.name,
        role: 'INTERNAL_SERVICE',
        isService: true,
      };

      request.actor = identity;
      config.logger.debug({ serviceId, path: request.url }, 'Service authenticated');
    });
  },
  { name: 'service-auth', fastify: '5.x' },
);
