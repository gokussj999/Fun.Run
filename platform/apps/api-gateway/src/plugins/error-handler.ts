import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { isAppError, isOperationalError } from '@funrun/shared';

import { getContainer } from '../container.js';

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler(
    (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
      const { logger } = getContainer();
      const requestId = reply.getHeader('x-request-id') as string | undefined;

      if (isAppError(error)) {
        if (!isOperationalError(error)) {
          logger.error(
            { err: error, requestId, path: request.url },
            'Non-operational error — possible bug',
          );
        } else {
          logger.warn(
            { code: error.code, statusCode: error.statusCode, requestId },
            error.message,
          );
        }

        return reply.status(error.statusCode).send({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
          requestId,
          timestamp: new Date().toISOString(),
        });
      }

      // Fastify validation errors
      if ('statusCode' in error && error.statusCode === 400) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
          requestId,
          timestamp: new Date().toISOString(),
        });
      }

      // Unknown / programming errors — don't leak details in production
      logger.error({ err: error, requestId, path: request.url }, 'Unhandled server error');

      const isProd = process.env['NODE_ENV'] === 'production';
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: isProd ? 'An unexpected error occurred' : error.message,
        },
        requestId,
        timestamp: new Date().toISOString(),
      });
    },
  );
}
