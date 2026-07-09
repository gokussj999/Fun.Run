import type { Logger } from '@funrun/logger';

import type { ClientConnection, ParsedChannel } from '../types.js';
import { ConnectionRegistry } from '../connection/registry.js';
import { RedisSubscriber } from '../redis/subscriber.js';
import { ReplayBuffer } from '../replay/buffer.js';
import { parseChannel, getChannelDef } from './channels.js';
import { validateSubscription } from './validator.js';
import { wsChannelToRedisChannels } from '../constants.js';
import { MAX_SUBSCRIPTIONS_PER_CONNECTION } from '../constants.js';

/**
 * SubscriptionManager tracks which WS connections are subscribed to which channels.
 *
 * Per channel:
 *   - A Set of local connection IDs
 *   - Reference-counted Redis pub/sub subscription
 *
 * Thread-safety note: Node.js is single-threaded, so Map mutations are safe.
 */
export class SubscriptionManager {
  // WS channel → Set of local connIds subscribed to it
  private readonly channelToConns = new Map<string, Set<string>>();

  constructor(
    private readonly registry: ConnectionRegistry,
    private readonly redisSubscriber: RedisSubscriber,
    private readonly replayBuffer: ReplayBuffer,
    private readonly logger: Logger,
  ) {}

  async subscribe(
    conn: ClientConnection,
    channelRaw: string,
  ): Promise<{ ok: true; headSeq: number } | { ok: false; code: string; message: string }> {
    // Parse and validate channel string
    const parsed = parseChannel(channelRaw);
    if (!parsed) {
      return { ok: false, code: 'INVALID_CHANNEL', message: `Unknown or malformed channel: '${channelRaw}'` };
    }

    // Auth check
    const authResult = validateSubscription(conn, parsed);
    if (!authResult.ok) return authResult;

    // Subscription limit
    if (conn.subscriptions.size >= MAX_SUBSCRIPTIONS_PER_CONNECTION) {
      return {
        ok: false,
        code: 'SUBSCRIPTION_LIMIT',
        message: `Maximum ${MAX_SUBSCRIPTIONS_PER_CONNECTION} subscriptions per connection`,
      };
    }

    // Idempotent
    if (conn.subscriptions.has(parsed.raw)) {
      const headSeq = await this.replayBuffer.getHeadSeq(parsed.raw);
      return { ok: true, headSeq };
    }

    // Register locally
    conn.subscriptions.add(parsed.raw);
    const connSet = this.channelToConns.get(parsed.raw) ?? new Set();
    const isFirstSubscriber = connSet.size === 0;
    connSet.add(conn.id);
    this.channelToConns.set(parsed.raw, connSet);

    // Subscribe to Redis channels if this is the first local subscriber
    if (isFirstSubscriber) {
      const redisChannels = wsChannelToRedisChannels(parsed.raw);
      await this.redisSubscriber.subscribeAll(redisChannels);
    }

    const headSeq = await this.replayBuffer.getHeadSeq(parsed.raw);
    this.logger.debug({ connId: conn.id.slice(0, 8), channel: parsed.raw }, 'Subscribed');
    return { ok: true, headSeq };
  }

  async unsubscribe(conn: ClientConnection, channelRaw: string): Promise<boolean> {
    if (!conn.subscriptions.has(channelRaw)) return false;

    conn.subscriptions.delete(channelRaw);

    const connSet = this.channelToConns.get(channelRaw);
    if (connSet) {
      connSet.delete(conn.id);
      if (connSet.size === 0) {
        this.channelToConns.delete(channelRaw);
        // Last subscriber left — unsubscribe from Redis
        const redisChannels = wsChannelToRedisChannels(channelRaw);
        await this.redisSubscriber.unsubscribeAll(redisChannels);
      }
    }

    this.logger.debug({ connId: conn.id.slice(0, 8), channel: channelRaw }, 'Unsubscribed');
    return true;
  }

  /**
   * Unsubscribe a connection from ALL its channels. Called on disconnect.
   */
  async unsubscribeAll(conn: ClientConnection): Promise<void> {
    const channels = [...conn.subscriptions];
    for (const ch of channels) {
      await this.unsubscribe(conn, ch);
    }
  }

  /**
   * Get all local connections subscribed to a given WS channel.
   */
  getSubscribers(channel: string): ClientConnection[] {
    const ids = this.channelToConns.get(channel);
    if (!ids) return [];
    return [...ids].map((id) => this.registry.get(id)).filter(Boolean) as ClientConnection[];
  }

  getChannelCount(channel: string): number {
    return this.channelToConns.get(channel)?.size ?? 0;
  }

  get activeChannels(): string[] {
    return [...this.channelToConns.keys()];
  }
}
