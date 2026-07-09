// All events carry a version field. Increment EVENT_VERSION when any event
// shape changes in a breaking way so consumers can detect and handle upgrades.
export const EVENT_VERSION = 1 as const;
type V = typeof EVENT_VERSION;

// ─── Individual event shapes ──────────────────────────────────────────────────

// Full trade record — published to price:{mint} and events:all_trades.
// Primary event for activity feeds, trade history, and P&L consumers.
export interface TradeExecutedEvent {
  v: V;
  type: 'TRADE_EXECUTED';
  tradeType: 'BUY' | 'SELL';
  coinId: string;
  mint: string;
  walletAddress: string;
  txId: string;
  solAmount: string;       // bigint as decimal string
  tokenAmount: string;     // bigint as decimal string
  pricePerToken: number;
  priceImpactBps: number;
  fees: {
    totalFee: string;
    creatorFee: string;
    referrerFee: string;
    treasuryFee: string;
  };
  virtualSolAfter: string;
  virtualTokensAfter: string;
  graduated: boolean;
  ts: number;
  requestId: string;
}

// Lightweight price signal — published to price:{mint}.
// Optimised for chart/ticker consumers that only need reserve changes.
export interface PriceUpdatedEvent {
  v: V;
  type: 'PRICE_UPDATED';
  coinId: string;
  mint: string;
  pricePerToken: number;
  virtualSolAfter: string;
  virtualTokensAfter: string;
  tradeType: 'BUY' | 'SELL';
  ts: number;
  requestId: string;
}

// Candle invalidation signal — published to events:candles:{coinId}.
// Tells chart consumers to refetch candle data for the listed timeframes.
export interface CandleUpdatedEvent {
  v: V;
  type: 'CANDLE_UPDATED';
  coinId: string;
  timeframes: string[]; // all timeframes touched by this trade
  pricePerToken: number;
  ts: number;
  requestId: string;
}

// Full coin state snapshot — published to events:coin:{coinId}.
// Consumed by coin-detail pages that need reserve + graduation state.
export interface CoinUpdatedEvent {
  v: V;
  type: 'COIN_UPDATED';
  coinId: string;
  mint: string;
  virtualSolAfter: string;
  virtualTokensAfter: string;
  pricePerToken: number;
  priceImpactBps: number;
  graduated: boolean;
  ts: number;
  requestId: string;
}

// Graduation signal — published to events:all_trades and events:coin:{coinId}.
// Triggers UX state transitions (lock UI, show Raydium link, etc.).
export interface GraduationTriggeredEvent {
  v: V;
  type: 'GRADUATION_TRIGGERED';
  coinId: string;
  mint: string;
  ts: number;
  requestId: string;
}

// ─── Union type ───────────────────────────────────────────────────────────────

export type TradingEvent =
  | TradeExecutedEvent
  | PriceUpdatedEvent
  | CandleUpdatedEvent
  | CoinUpdatedEvent
  | GraduationTriggeredEvent;
