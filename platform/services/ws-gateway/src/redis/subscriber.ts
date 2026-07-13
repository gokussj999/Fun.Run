import type { Redis } from 'ioredis';
import type { Logger } from '@funrun/logger';

import { isStrictRedisMode, type RedisDependencyMode } from '../config/redis-dependency.js';

export type MessageHandler = (channel: string, rawData: string) => void;

/**
 * RedisSubscriber manages a dedicated Redis pub/sub connection.
 * Reference-counted SUBSCRIBE; resubscribes all active channels on reconnect (Sprint 4).
 */
export class RedisSubscriber {
  private readonly refCounts = new Map<string, number>();
  private handler: MessageHandler | null = null;

  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger,
    private readonly redisMode: RedisDependencyMode = 'degraded',
  ) {
    this.redis.on('message', (channel: string, message: string) => {
      this.handler?.(channel, message);
    });

    this.redis.on('error', (err: Error) => {
      this.logger.error({ err }, 'RedisSubscriber: connection error');
    });

    this.redis.on('ready', () => {
      void this.resubscribeAll();
    });
  }

  setMessageHandler(handler: MessageHandler): void {
    this.handler = handler;
  }

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
        if (isStrictRedisMode(this.redisMode)) throw err;
      }
    }
  }

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

  async subscribeAll(channels: string[]): Promise<void> {
    for (const ch of channels) await this.subscribe(ch);
  }

  async unsubscribeAll(channels: string[]): Promise<void> {
    for (const ch of channels) await this.unsubscribe(ch);
  }

  /** Re-subscribe all active channels after Redis reconnect. */
  private async resubscribeAll(): Promise<void> {
    const channels = [...this.refCounts.keys()];
    if (channels.length === 0) return;

    try {
      await this.redis.subscribe(...channels);
      this.logger.info({ count: channels.length }, 'RedisSubscriber: resubscribed after reconnect');
    } catch (err) {
      this.logger.error({ err, channels }, 'RedisSubscriber: resubscribe failed');
    }
  }

  get activeChannels(): string[] {
    return [...this.refCounts.keys()];
  }

  get totalSubscriptions(): number {
    return [...this.refCounts.values()].reduce((a, b) => a + b, 0);
  }
}
