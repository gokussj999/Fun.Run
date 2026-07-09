import type Redis from 'ioredis';
import type { Logger } from '@funrun/logger';
import { PUBSUB, TIMEFRAMES } from '../constants.js';
import type { TradeResult } from '../types.js';
import {
  EVENT_VERSION,
  type CandleUpdatedEvent,
  type CoinUpdatedEvent,
  type GraduationTriggeredEvent,
  type PriceUpdatedEvent,
  type TradeExecutedEvent,
} from './types.js';

export class TradeEventPublisher {
  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger,
  ) {}

  // Called after every successful DB transaction commit.
  // Publishes four distinct events in sequence; each via publishSafe so a
  // Redis failure on any one event never blocks the others or rolls the trade.
  async publishTrade(trade: TradeResult, requestId: string): Promise<void> {
    const now = Date.now();
    const mint = trade.mintAddress;

    // ── 1. TRADE_EXECUTED ─────────────────────────────────────────────────────
    // Full trade record for activity feeds, trade history, and P&L consumers.
    const tradeExecuted: TradeExecutedEvent = {
      v: EVENT_VERSION,
      type: 'TRADE_EXECUTED',
      tradeType: trade.tradeType,
      coinId: trade.coinId,
      mint,
      walletAddress: trade.walletAddress,
      txId: trade.txId,
      solAmount: trade.solAmount.toString(),
      tokenAmount: trade.tokenAmount.toString(),
      pricePerToken: trade.pricePerToken,
      priceImpactBps: trade.priceImpactBps,
      fees: {
        totalFee: trade.fees.totalFee.toString(),
        creatorFee: trade.fees.creatorFee.toString(),
        referrerFee: trade.fees.referrerFee.toString(),
        treasuryFee: trade.fees.treasuryFee.toString(),
      },
      virtualSolAfter: trade.virtualSolAfter.toString(),
      virtualTokensAfter: trade.virtualTokensAfter.toString(),
      graduated: trade.graduated,
      ts: now,
      requestId,
    };

    // ── 2. PRICE_UPDATED ──────────────────────────────────────────────────────
    // Lightweight signal for chart/ticker consumers — reserve state only.
    const priceUpdated: PriceUpdatedEvent = {
      v: EVENT_VERSION,
      type: 'PRICE_UPDATED',
      coinId: trade.coinId,
      mint,
      pricePerToken: trade.pricePerToken,
      virtualSolAfter: trade.virtualSolAfter.toString(),
      virtualTokensAfter: trade.virtualTokensAfter.toString(),
      tradeType: trade.tradeType,
      ts: now,
      requestId,
    };

    // ── 3. CANDLE_UPDATED ─────────────────────────────────────────────────────
    // Tells charting consumers to refetch candles; all 6 timeframes are always
    // touched by upsertCandles so we always list all of them.
    const candleUpdated: CandleUpdatedEvent = {
      v: EVENT_VERSION,
      type: 'CANDLE_UPDATED',
      coinId: trade.coinId,
      timeframes: [...TIMEFRAMES],
      pricePerToken: trade.pricePerToken,
      ts: now,
      requestId,
    };

    // ── 4. COIN_UPDATED ───────────────────────────────────────────────────────
    // Full coin state snapshot for coin-detail page consumers.
    const coinUpdated: CoinUpdatedEvent = {
      v: EVENT_VERSION,
      type: 'COIN_UPDATED',
      coinId: trade.coinId,
      mint,
      virtualSolAfter: trade.virtualSolAfter.toString(),
      virtualTokensAfter: trade.virtualTokensAfter.toString(),
      pricePerToken: trade.pricePerToken,
      priceImpactBps: trade.priceImpactBps,
      graduated: trade.graduated,
      ts: now,
      requestId,
    };

    // Publish to channels — all via publishSafe (never throws).
    await this.publishSafe(PUBSUB.price(mint),        JSON.stringify(tradeExecuted));
    await this.publishSafe(PUBSUB.allTrades(),        JSON.stringify(tradeExecuted));
    await this.publishSafe(PUBSUB.price(mint),        JSON.stringify(priceUpdated));
    await this.publishSafe(PUBSUB.candles(trade.coinId), JSON.stringify(candleUpdated));
    await this.publishSafe(PUBSUB.coin(trade.coinId), JSON.stringify(coinUpdated));
  }

  // Called only when a buy triggers graduation (realSol >= threshold).
  // Separate from publishTrade so graduation consumers can subscribe
  // independently without processing every trade.
  async publishGraduation(coinId: string, mint: string, requestId: string): Promise<void> {
    const event: GraduationTriggeredEvent = {
      v: EVENT_VERSION,
      type: 'GRADUATION_TRIGGERED',
      coinId,
      mint,
      ts: Date.now(),
      requestId,
    };

    const payload = JSON.stringify(event);
    await this.publishSafe(PUBSUB.allTrades(),    payload);
    await this.publishSafe(PUBSUB.coin(coinId),   payload);
  }

  private async publishSafe(channel: string, payload: string): Promise<void> {
    try {
      await this.redis.publish(channel, payload);
    } catch (err) {
      this.logger.warn({ channel, err }, 'TradeEventPublisher: publish failed (non-fatal)');
    }
  }
}
