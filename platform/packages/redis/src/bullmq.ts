import { ConnectionOptions } from 'bullmq';

export interface BullMQConnectionOptions {
  url: string;
  password?: string;
  db?: number;
}

export function createBullMQConnection(opts: BullMQConnectionOptions): ConnectionOptions {
  const parsed = new URL(opts.url);

  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    password: opts.password ?? (parsed.password || undefined),
    db: opts.db ?? 0,
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false, // required by BullMQ
    lazyConnect: true,
  };
}

// ─── Queue defaults ───────────────────────────────────────────────────────────

export const QUEUE_DEFAULT_JOB_OPTIONS = {
  removeOnComplete: { count: 1_000, age: 60 * 60 * 24 }, // keep last 1k or 24h
  removeOnFail: { count: 5_000 },
} as const;

export const QUEUE_RETRY_OPTIONS = {
  TRADE: {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 500 },
  },
  GRADUATION: {
    attempts: 5,
    backoff: { type: 'exponential' as const, delay: 2_000 },
  },
  NOTIFICATION: {
    attempts: 2,
    backoff: { type: 'fixed' as const, delay: 1_000 },
  },
  PUSH: {
    attempts: 2,
    backoff: { type: 'fixed' as const, delay: 2_000 },
  },
  ANALYTICS: {
    attempts: 1,
    backoff: { type: 'fixed' as const, delay: 0 },
  },
} as const;
