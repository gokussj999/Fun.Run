// ─── Base application error ───────────────────────────────────────────────────

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(opts: {
    code: string;
    message: string;
    statusCode?: number;
    isOperational?: boolean;
    details?: unknown;
    cause?: Error;
  }) {
    super(opts.message, { cause: opts.cause });
    this.name = this.constructor.name;
    this.code = opts.code;
    this.statusCode = opts.statusCode ?? 500;
    this.isOperational = opts.isOperational ?? true;
    this.details = opts.details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── HTTP errors (operational — returned to clients) ─────────────────────────

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super({ code: 'BAD_REQUEST', message, statusCode: 400, isOperational: true, details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super({ code: 'UNAUTHORIZED', message, statusCode: 401, isOperational: true });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super({ code: 'FORBIDDEN', message, statusCode: 403, isOperational: true });
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super({ code: 'NOT_FOUND', message: `${resource} not found`, statusCode: 404, isOperational: true });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super({ code: 'CONFLICT', message, statusCode: 409, isOperational: true, details });
  }
}

export class UnprocessableError extends AppError {
  constructor(message: string, details?: unknown) {
    super({ code: 'UNPROCESSABLE', message, statusCode: 422, isOperational: true, details });
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfterMs: number) {
    super({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded',
      statusCode: 429,
      isOperational: true,
      details: { retryAfterMs },
    });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super({
      code: 'SERVICE_UNAVAILABLE',
      message: `Service temporarily unavailable: ${service}`,
      statusCode: 503,
      isOperational: true,
    });
  }
}

// ─── Domain errors ────────────────────────────────────────────────────────────

export class SlippageExceededError extends AppError {
  constructor(expected: string, actual: string) {
    super({
      code: 'SLIPPAGE_EXCEEDED',
      message: 'Trade slippage exceeded tolerance',
      statusCode: 422,
      isOperational: true,
      details: { expected, actual },
    });
  }
}

export class InsufficientFundsError extends AppError {
  constructor(required: string, available: string) {
    super({
      code: 'INSUFFICIENT_FUNDS',
      message: 'Insufficient funds for this operation',
      statusCode: 422,
      isOperational: true,
      details: { required, available },
    });
  }
}

export class CoinNotActiveError extends AppError {
  constructor(coinId: string, status: string) {
    super({
      code: 'COIN_NOT_ACTIVE',
      message: `Coin ${coinId} is not active (status: ${status})`,
      statusCode: 409,
      isOperational: true,
    });
  }
}

export class ProtocolPausedError extends AppError {
  constructor() {
    super({
      code: 'PROTOCOL_PAUSED',
      message: 'Protocol is currently paused',
      statusCode: 503,
      isOperational: true,
    });
  }
}

export class OptimisticLockError extends AppError {
  constructor(resource: string) {
    super({
      code: 'OPTIMISTIC_LOCK_CONFLICT',
      message: `Concurrent modification detected on ${resource}, please retry`,
      statusCode: 409,
      isOperational: true,
    });
  }
}

export class SolanaTransactionError extends AppError {
  constructor(message: string, signature?: string, cause?: Error) {
    super({
      code: 'SOLANA_TX_ERROR',
      message,
      statusCode: 502,
      isOperational: true,
      details: { signature },
      cause,
    });
  }
}

// ─── Type guards ──────────────────────────────────────────────────────────────

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function isOperationalError(err: unknown): boolean {
  return isAppError(err) && err.isOperational;
}
