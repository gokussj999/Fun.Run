import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { isAppError, isOperationalError } from '@funrun/shared';

/** Standard @funrun/shared error envelope for auth routes and hooks. */
export function registerAuthErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler(
    (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
      const requestId = reply.getHeader('x-request-id') as string | undefined;

      if (isAppError(error)) {
        if (!isOperationalError(error)) {
          request.log.error({ err: error, requestId, path: request.url }, 'Non-operational auth error');
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

      if ('statusCode' in error && error.statusCode === 400) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.message },
          requestId,
          timestamp: new Date().toISOString(),
        });
      }

      request.log.error({ err: error, requestId, path: request.url }, 'Unhandled auth error');
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
