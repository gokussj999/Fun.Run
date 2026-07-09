// ─── Domain primitives ────────────────────────────────────────────────────────

export type UserId = string;
export type CoinId = string;
export type WalletAddress = string;
export type MintAddress = string;
export type TxSignature = string;
export type Lamports = bigint;
export type TokenUnits = bigint;

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
}

export interface PaginatedResult<T> {
  readonly data: T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

// ─── API envelope ─────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  readonly success: true;
  readonly data: T;
  readonly requestId: string;
  readonly timestamp: string;
}

export interface ApiError {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
  readonly requestId: string;
  readonly timestamp: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Coin state ───────────────────────────────────────────────────────────────

export type CoinStatus = 'ACTIVE' | 'GRADUATING' | 'GRADUATED' | 'PAUSED';

export interface CoinState {
  readonly id: CoinId;
  readonly mintAddress: MintAddress;
  readonly creatorWallet: WalletAddress;
  readonly name: string;
  readonly symbol: string;
  readonly description: string;
  readonly imageUri: string;
  readonly virtualSolReserves: string;
  readonly virtualTokenReserves: string;
  readonly realSolReserves: string;
  readonly status: CoinStatus;
  readonly createdAt: string;
  readonly graduatedAt: string | null;
  readonly raydiumPoolAddress: string | null;
  readonly currentPrice: string;
  readonly marketCapSol: string;
}

// ─── Trade ────────────────────────────────────────────────────────────────────

export type TradeType = 'BUY' | 'SELL';

export interface TradeResult {
  readonly txSignature: TxSignature;
  readonly coinId: CoinId;
  readonly tradeType: TradeType;
  readonly solAmount: string;
  readonly tokenAmount: string;
  readonly newPrice: string;
  readonly newVirtualSolReserves: string;
  readonly newVirtualTokenReserves: string;
  readonly creatorFee: string;
  readonly referrerFee: string;
  readonly treasuryFee: string;
  readonly slot: number;
  readonly confirmedAt: string;
}

// ─── User / Profile ───────────────────────────────────────────────────────────

export type UserRole = 'USER' | 'CREATOR' | 'ADMIN' | 'SUPER_ADMIN';

export interface UserProfile {
  readonly id: UserId;
  readonly walletAddress: WalletAddress;
  readonly privyUserId: string;
  readonly role: UserRole;
  readonly referrerWallet: WalletAddress | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ─── Candle / OHLCV ──────────────────────────────────────────────────────────

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface Candle {
  readonly coinId: CoinId;
  readonly timeframe: Timeframe;
  readonly openTime: number;
  readonly open: string;
  readonly high: string;
  readonly low: string;
  readonly close: string;
  readonly volume: string;
  readonly trades: number;
}

// ─── WebSocket messages ───────────────────────────────────────────────────────

export type WsMessageType =
  | 'price_update'
  | 'trade_executed'
  | 'graduation_initiated'
  | 'graduation_completed'
  | 'protocol_paused'
  | 'notification';

export interface WsMessage<T = unknown> {
  readonly type: WsMessageType;
  readonly coinId?: CoinId;
  readonly data: T;
  readonly timestamp: string;
}

// ─── Health ───────────────────────────────────────────────────────────────────

export type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheckResult {
  readonly status: ServiceStatus;
  readonly service: string;
  readonly version: string;
  readonly uptime: number;
  readonly checks: Record<string, { status: ServiceStatus; latencyMs?: number; error?: string }>;
  readonly timestamp: string;
}
