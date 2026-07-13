import pino from 'pino';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

export type Logger = pino.Logger;

export interface LoggerOptions {
  service: string;
  level?: LogLevel;
  pretty?: boolean;
}

export function createLogger(opts: LoggerOptions): Logger {
  const level: LogLevel =
    (process.env['LOG_LEVEL'] as LogLevel | undefined) ?? opts.level ?? 'info';

  const isDev = process.env['NODE_ENV'] !== 'production';
  const usePretty = opts.pretty ?? isDev;

  return pino({
    name: opts.service,
    level,
    ...(usePretty
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:HH:MM:ss',
              ignore: 'pid,hostname',
            },
          },
        }
      : {}),
    base: {
      service: opts.service,
      env: process.env['NODE_ENV'] ?? 'development',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        '*.password',
        '*.mnemonic',
        '*.privateKey',
        '*.encryptedMnemonic',
        '*.secret',
        '*.apiKey',
      ],
      censor: '[REDACTED]',
    },
  });
}

// Singleton root logger — services call createLogger with their own service name.
export const rootLogger = createLogger({ service: 'funrun-platform' });
