import { RATE_LIMIT_MESSAGES_PER_SECOND, RATE_LIMIT_WINDOW_MS } from '../constants.js';

interface Bucket {
  count:       number;
  windowStart: number;
}

/**
 * Per-connection sliding-window rate limiter.
 * Stored in-process — no Redis needed (rate limiting is per-worker, not global).
 *
 * A connection that exceeds the limit gets its message rejected.
 * Persistent abuse → the connection manager disconnects it.
 */
export class ConnectionRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  /**
   * Returns true if the message is allowed, false if rate-limited.
   */
  check(connId: string): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(connId);

    if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
      // New window
      bucket = { count: 1, windowStart: now };
      this.buckets.set(connId, bucket);
      return true;
    }

    bucket.count++;
    return bucket.count <= RATE_LIMIT_MESSAGES_PER_SECOND;
  }

  remove(connId: string): void {
    this.buckets.delete(connId);
  }

  getCount(connId: string): number {
    return this.buckets.get(connId)?.count ?? 0;
  }
}
