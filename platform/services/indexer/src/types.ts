// ─── Solana primitives ────────────────────────────────────────────────────────

export type Signature = string;
export type Slot = bigint;
export type PubkeyStr = string;   // base58-encoded public key

// ─── Indexer events (mirror on-chain events.rs) ───────────────────────────────

export type EventName =
  | 'CoinCreated'
  | 'TokensPurchased'
  | 'TokensSold'
  | 'GraduationInitiated'
  | 'GraduationCompleted'
  | 'LiquidityLocked'
  | 'MintAuthorityRevoked'
  | 'FreezeAuthorityRevoked'
  | 'CoinGraduated'
  | 'CreatorFeesClaimed'
  | 'CreatorReferrerFeesClaimed'
  | 'CreatorReferrerSet'
  | 'GlobalConfigUpdated'
  | 'TreasurySweep';

export interface RawLogEntry {
  readonly signature: Signature;
  readonly slot: Slot;
  readonly blockTime: number | null;   // Unix seconds
  readonly logs: string[];
  readonly err: unknown | null;
}

export interface ParsedEvent {
  readonly name: EventName;
  readonly signature: Signature;
  readonly slot: Slot;
  readonly blockTime: number;
  readonly data: EventData;
}

// ─── Event data payloads (match on-chain event structs) ──────────────────────

export interface CoinCreatedData {
  readonly mint: PubkeyStr;
  readonly creator: PubkeyStr;
  readonly creatorReferrer: PubkeyStr | null;
  readonly name: string;
  readonly symbol: string;
  readonly uri: string;
  readonly virtualSolReserves: bigint;
  readonly virtualTokenReserves: bigint;
  readonly creationFeePaid: bigint;
  readonly timestamp: bigint;
}

export interface TokensPurchasedData {
  readonly mint: PubkeyStr;
  readonly buyer: PubkeyStr;
  readonly solAmount: bigint;      // sol_amount: total SOL paid (inc fees)
  readonly solNet: bigint;         // sol_net: SOL to bonding curve after fees
  readonly tokenAmount: bigint;    // tokens_out
  readonly treasuryFee: bigint;
  readonly creatorFee: bigint;
  readonly referrerFee: bigint;    // creator_referrer_fee
  readonly creatorReferrer: PubkeyStr | null;
  readonly virtualSolAfter: bigint;
  readonly virtualTokensAfter: bigint;
  readonly realSolAfter: bigint;
  readonly timestamp: bigint;
}

export interface TokensSoldData {
  readonly mint: PubkeyStr;
  readonly seller: PubkeyStr;
  readonly tokenAmount: bigint;    // token_amount: tokens sold
  readonly solGross: bigint;       // sol_gross: SOL before fees
  readonly solNet: bigint;         // sol_net: SOL to seller after fees
  readonly treasuryFee: bigint;
  readonly creatorFee: bigint;
  readonly referrerFee: bigint;    // creator_referrer_fee
  readonly creatorReferrer: PubkeyStr | null;
  readonly virtualSolAfter: bigint;
  readonly virtualTokensAfter: bigint;
  readonly realSolAfter: bigint;
  readonly timestamp: bigint;
}

export interface GraduationInitiatedData {
  readonly mint: PubkeyStr;
  readonly initiator: PubkeyStr;
  readonly solAtInitiation: bigint;
  readonly creatorFeeSnapshot: bigint;
  readonly referrerFeeSnapshot: bigint;
  readonly referrer: PubkeyStr | null;
}

export interface GraduationCompletedData {
  readonly mint: PubkeyStr;
  readonly completer: PubkeyStr;
  readonly poolState: PubkeyStr;
  readonly lpMint: PubkeyStr;
  readonly solAddedToPool: bigint;
  readonly tokensAddedToPool: bigint;
  readonly lpAmount: bigint;
  readonly dexFee: bigint;
}

export interface CreatorFeesClaimedData {
  readonly mint: PubkeyStr;
  readonly creator: PubkeyStr;
  readonly amount: bigint;
}

export interface CreatorReferrerFeesClaimedData {
  readonly mint: PubkeyStr;
  readonly referrer: PubkeyStr;
  readonly referrerAmount: bigint;
}

export interface CreatorReferrerSetData {
  readonly mint: PubkeyStr;
  readonly creator: PubkeyStr;
  readonly referrer: PubkeyStr;
}

export interface GlobalConfigUpdatedData {
  readonly admin: PubkeyStr;
  readonly feeBps: number | null;
  readonly creationFee: bigint | null;
  readonly paused: boolean | null;
}

export interface TreasurySweepData {
  readonly destination: PubkeyStr;
  readonly amount: bigint;
}

export type EventData =
  | CoinCreatedData
  | TokensPurchasedData
  | TokensSoldData
  | GraduationInitiatedData
  | GraduationCompletedData
  | CreatorFeesClaimedData
  | CreatorReferrerFeesClaimedData
  | CreatorReferrerSetData
  | GlobalConfigUpdatedData
  | TreasurySweepData;

// ─── Processing ───────────────────────────────────────────────────────────────

export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED' | 'SKIPPED';

export interface ProcessingRecord {
  readonly signature: Signature;
  readonly slot: Slot;
  readonly eventName: EventName;
  readonly status: ProcessingStatus;
  readonly attempts: number;
  readonly lastError: string | null;
  readonly processedAt: number | null;
}

// ─── Cursor ───────────────────────────────────────────────────────────────────

export interface IndexerCursor {
  readonly lastProcessedSlot: Slot;
  readonly lastProcessedSignature?: Signature;
  readonly lastProcessedAt: Date;
}

// ─── OHLCV ───────────────────────────────────────────────────────────────────

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export const TIMEFRAME_MS: Record<Timeframe, number> = {
  '1m':  60_000,
  '5m':  300_000,
  '15m': 900_000,
  '1h':  3_600_000,
  '4h':  14_400_000,
  '1d':  86_400_000,
} as const;

export const ALL_TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

export interface CandleUpsertInput {
  readonly coinId: string;
  readonly timeframe: Timeframe;
  readonly openTime: bigint;
  readonly price: string;         // as Decimal string
  readonly volumeLamports: bigint;
  readonly slot: Slot;
}

// ─── WebSocket subscription ───────────────────────────────────────────────────

export type SubscriptionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';

export interface SubscriptionState {
  status: SubscriptionStatus;
  subscriptionId: number | null;
  reconnectAttempts: number;
  lastMessageAt: number | null;
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export interface IndexerMetrics {
  eventsReceived: number;
  eventsProcessed: number;
  eventsFailed: number;
  eventsSkipped: number;
  lastSlot: bigint;
  lastBlockTime: number;
  processingLatencyMs: number[];
  reconnects: number;
}
