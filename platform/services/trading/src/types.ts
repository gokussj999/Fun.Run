// ─── Request types ────────────────────────────────────────────────────────────

export interface BuyRequest {
  coinId: string;
  solAmountLamports: bigint;
  minTokensOut: bigint;
  slippageBps: number;
}

export interface SellRequest {
  coinId: string;
  tokenAmountRaw: bigint;
  minSolOut: bigint;
  slippageBps: number;
  maxPriceImpactBps?: number;
}

export interface QuoteRequest {
  coinId: string;
  direction: 'buy' | 'sell';
  amountIn: bigint;
}

// ─── Result types ─────────────────────────────────────────────────────────────

export interface FeeBreakdown {
  totalFee: bigint;
  creatorFee: bigint;
  referrerFee: bigint;
  treasuryFee: bigint;
}

export interface TradeResult {
  txId: string;
  coinId: string;
  mintAddress: string;
  walletAddress: string;
  tradeType: 'BUY' | 'SELL';
  solAmount: bigint;
  tokenAmount: bigint;
  pricePerToken: number;
  priceImpactBps: number;
  fees: FeeBreakdown;
  virtualSolAfter: bigint;
  virtualTokensAfter: bigint;
  graduated: boolean;
  remainingTokenBalance: bigint; // 0n for buy; post-trade balance for sell
  requestId: string;
}

/** On-chain path result — submitted to Solana; DB sync via indexer. */
export interface OnChainTradeResult {
  txId: string;
  signature: string;
  coinId: string;
  mintAddress: string;
  walletAddress: string;
  tradeType: 'BUY' | 'SELL';
  status: 'SUBMITTED';
  idempotent: boolean;
  requestId: string;
}

export interface QuoteResult {
  coinId: string;
  direction: 'buy' | 'sell';
  amountIn: bigint;
  amountOut: bigint;
  pricePerToken: number;
  priceImpactBps: number;
  feeAmount: bigint;
  effectivePrice: number;  // lamports-per-token paid (buy) or received (sell)
  minReceived: bigint;     // amountOut after slippage tolerance deducted
  expiresAt: string;       // ISO timestamp — when this quote becomes stale
  virtualSolAfter: bigint;
  virtualTokensAfter: bigint;
}

// ─── Internal execution context ───────────────────────────────────────────────

export interface TradeContext {
  requestId: string;
  walletAddress: string;
  startedAt: number;
}

export interface CoinSnapshot {
  id: string;
  mintAddress: string;
  creatorWallet: string;
  referrerWallet: string | null;
  virtualSolReserves: bigint;
  virtualTokenReserves: bigint;
  realSolReserves: bigint;
  totalFeesCollected: bigint;
  status: string;
  version: number;
}

export interface TraderInfo {
  walletAddress: string;
  referrerWallet: string | null;
}

// ─── Idempotency ──────────────────────────────────────────────────────────────

export interface IdempotencyRecord {
  status: number;
  body: unknown;
  cachedAt: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

// Aligned with Auth Service's AuthenticatedUser — fields that the trading
// service actually needs.  We omit sessionId/deviceId because those are Auth
// Service concerns; we add ipAddress for audit logging and IP guard.
export interface AuthContext {
  walletAddress: string;
  privyUserId: string;
  role: string;
  ipAddress: string;
}
