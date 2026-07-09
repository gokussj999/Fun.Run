import type Redis from 'ioredis';
import type { Logger } from '@funrun/logger';

export type MessageHandler = (channel: string, rawData: string) => void;

/**
 * RedisSubscriber manages a dedicated Redis pub/sub connection.
 *
 * Uses a single ioredis connection in subscriber mode.
 * Dynamically subscribes / unsubscribes as WS clients join/leave channels.
 * Reference-counted: only unsubscribes from Redis when the last WS subscriber leaves.
 */
export class RedisSubscriber {
  // Redis channel → local subscriber count
  private readonly refCounts = new Map<string, number>();
  private handler: MessageHandler | null = null;

  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger,
  ) {
    this.redis.on('message', (channel: string, message: string) => {
      this.handler?.(channel, message);
    });

    this.redis.on('error', (err: Error) => {
      this.logger.error({ err }, 'RedisSubscriber: connection error');
    });
  }

  setMessageHandler(handler: MessageHandler): void {
    this.handler = handler;
  }

  /**
   * Subscribe to a Redis channel (reference-counted).
   * Only calls SUBSCRIBE on the first subscriber.
   */
  async subscribe(channel: string): Promise<void> {
    const count = this.refCounts.get(channel) ?? 0;
    this.refCounts.set(channel, count + 1);

    if (count === 0) {
      try {
        await this.redis.subscribe(channel);
        this.logger.debug({ channel }, 'RedisSubscriber: subscribed');
      } catch (err) {
        this.refCounts.set(channel, 0);
        this.logger.error({ channel, err }, 'RedisSubscriber: subscribe failed');
      }
    }
  }

  /**
   * Unsubscribe from a Redis channel (reference-counted).
   * Only calls UNSUBSCRIBE when the last WS subscriber leaves.
   */
  async unsubscribe(channel: string): Promise<void> {
    const count = this.refCounts.get(channel) ?? 0;
    if (count <= 0) return;

    const newCount = count - 1;
    this.refCounts.set(channel, newCount);

    if (newCount === 0) {
      this.refCounts.delete(channel);
      try {
        await this.redis.unsubscribe(channel);
        this.logger.debug({ channel }, 'RedisSubscriber: unsubscribed');
      } catch (err) {
        this.logger.warn({ channel, err }, 'RedisSubscriber: unsubscribe failed');
      }
    }
  }

  /** Subscribe to a set of channels atomically. */
  async subscribeAll(channels: string[]): Promise<void> {
    for (const ch of channels) await this.subscribe(ch);
  }

  async unsubscribeAll(channels: string[]): Promise<void> {
    for (const ch of channels) await this.unsubscribe(ch);
  }

  get activeChannels(): string[] {
    return [...this.refCounts.keys()];
  }

  get totalSubscriptions(): number {
    return [...this.refCounts.values()].reduce((a, b) => a + b, 0);
  }
}
