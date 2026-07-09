import type Redis from 'ioredis';
import type { Logger } from '@funrun/logger';

import { PUBSUB_CHANNELS } from '../constants.js';

export interface PriceUpdatePayload {
  price:       string;
  solAmount:   string;
  tokenAmount: string;
  tradeType:   'BUY' | 'SELL';
  slot:        string;
  signature:   string;
  blockTime:   number;
}

export interface GraduationPayload {
  phase:     'initiated' | 'completed';
  mint:      string;
  [key: string]: unknown;
}

export interface IndexerEventPayload {
  eventName: string;
  mint?:     string;
  slot:      string;
  signature: string;
  data:      Record<string, unknown>;
}

export class RedisPublisher {
  constructor(
    private readonly pubsub: Redis,
    private readonly logger: Logger,
  ) {}

  async publishPriceUpdate(mint: string, payload: PriceUpdatePayload): Promise<void> {
    const channel = PUBSUB_CHANNELS.priceUpdate(mint);
    await this.publish(channel, payload);

    // Also broadcast on the global trades feed
    await this.publish(PUBSUB_CHANNELS.allTrades, { mint, ...payload });
  }

  async publishGraduation(mint: string, payload: GraduationPayload): Promise<void> {
    const channel = PUBSUB_CHANNELS.graduation(mint);
    await this.publish(channel, payload);
    await this.publish(PUBSUB_CHANNELS.allGraduations, payload);
  }

  async publishIndexerEvent(payload: IndexerEventPayload): Promise<void> {
    await this.publish(PUBSUB_CHANNELS.indexerEvents, payload);
  }

  async publishMetrics(metrics: Record<string, unknown>): Promise<void> {
    await this.publish(PUBSUB_CHANNELS.indexerMetrics, metrics);
  }

  private async publish(channel: string, payload: unknown): Promise<void> {
    try {
      await this.pubsub.publish(channel, JSON.stringify(payload));
    } catch (err) {
      // Non-fatal — best-effort pub/sub
      this.logger.warn({ channel, err }, 'RedisPublisher: publish failed');
    }
  }
}
