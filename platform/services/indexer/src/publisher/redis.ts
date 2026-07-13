import type { RedisInstance as Redis } from '@funrun/redis';
import type { Logger } from '@funrun/logger';

import { PUBSUB_CHANNELS } from '../constants.js';

export interface PriceUpdatePayload {
  price:       string;
  solAmount:   string;
  tokenAmount: string;
  tradeType:   'BUY' | 'SELL';
  buyer?:      string;
  seller?:     string;
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

export interface CoinCreatedPayload {
  mint:    string;
  creator: string;
  name:    string;
  symbol:  string;
  uri:     string;
  slot:    string;
  signature: string;
}

export interface WalletEventPayload {
  wallet:    string;
  mint?:     string;
  eventType: string;
  amount?:   string;
  slot:      string;
  signature: string;
  [key: string]: unknown;
}

export interface PortfolioUpdatePayload {
  wallet:      string;
  mint:        string;
  tradeType:   'BUY' | 'SELL';
  tokenAmount: string;
  solAmount:   string;
  slot:        string;
  signature:   string;
}

export interface NotificationPayload {
  type:      string;
  title:     string;
  body:      string;
  mint?:     string;
  slot:      string;
  signature: string;
  [key: string]: unknown;
}

export class RedisPublisher {
  constructor(
    private readonly pubsub: Redis,
    private readonly logger: Logger,
  ) {}

  async publishPriceUpdate(mint: string, payload: PriceUpdatePayload): Promise<void> {
    const channel = PUBSUB_CHANNELS.priceUpdate(mint);
    await this.publish(channel, payload);
    await this.publish(PUBSUB_CHANNELS.allTrades, { mint, ...payload });
  }

  async publishGraduation(mint: string, payload: GraduationPayload): Promise<void> {
    const channel = PUBSUB_CHANNELS.graduation(mint);
    await this.publish(channel, payload);
    await this.publish(PUBSUB_CHANNELS.allGraduations, payload);
  }

  async publishCoinCreated(payload: CoinCreatedPayload): Promise<void> {
    await this.publish(PUBSUB_CHANNELS.coinCreated, payload);
  }

  async publishCreatorUpdate(wallet: string, payload: WalletEventPayload): Promise<void> {
    await this.publish(PUBSUB_CHANNELS.creator(wallet), payload);
  }

  async publishReferralUpdate(wallet: string, payload: WalletEventPayload): Promise<void> {
    await this.publish(PUBSUB_CHANNELS.referral(wallet), payload);
  }

  async publishPortfolioUpdate(wallet: string, payload: PortfolioUpdatePayload): Promise<void> {
    await this.publish(PUBSUB_CHANNELS.portfolio(wallet), payload);
  }

  async publishNotification(wallet: string, payload: NotificationPayload): Promise<void> {
    await this.publish(PUBSUB_CHANNELS.notifications(wallet), payload);
  }

  async publishFeeClaimed(payload: WalletEventPayload): Promise<void> {
    await this.publish(PUBSUB_CHANNELS.feeClaimed, payload);
  }

  async publishTreasurySweep(payload: Record<string, unknown>): Promise<void> {
    await this.publish(PUBSUB_CHANNELS.treasurySweep, payload);
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
      this.logger.warn({ channel, err }, 'RedisPublisher: publish failed');
    }
  }
}
