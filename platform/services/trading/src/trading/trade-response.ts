import type { TradeResult, OnChainTradeResult } from '../types.js';
import { isOnChainTradeResult } from './trade-router.js';

/** Off-chain HTTP body (unchanged contract). */
export function buildOffchainTradeBody(result: TradeResult, requestId: string) {
  return {
    txId: result.txId,
    coinId: result.coinId,
    tradeType: result.tradeType,
    solAmount: result.solAmount.toString(),
    tokenAmount: result.tokenAmount.toString(),
    pricePerToken: result.pricePerToken,
    priceImpactBps: result.priceImpactBps,
    fees: {
      totalFee: result.fees.totalFee.toString(),
      creatorFee: result.fees.creatorFee.toString(),
      referrerFee: result.fees.referrerFee.toString(),
      treasuryFee: result.fees.treasuryFee.toString(),
    },
    virtualSolAfter: result.virtualSolAfter.toString(),
    virtualTokensAfter: result.virtualTokensAfter.toString(),
    graduated: result.graduated,
    requestId,
  };
}

export function buildOffchainSellBody(result: TradeResult, requestId: string) {
  return {
    ...buildOffchainTradeBody(result, requestId),
    remainingTokenBalance: result.remainingTokenBalance.toString(),
    graduated: false,
  };
}

/** On-chain HTTP body — async settlement; indexer updates DB. */
export function buildOnchainTradeBody(result: OnChainTradeResult) {
  return {
    txId: result.txId,
    signature: result.signature,
    status: result.status,
    mode: 'onchain' as const,
    coinId: result.coinId,
    mintAddress: result.mintAddress,
    tradeType: result.tradeType,
    idempotent: result.idempotent,
    requestId: result.requestId,
  };
}

export function buildTradeBuyBody(
  result: TradeResult | OnChainTradeResult,
  requestId: string,
): Record<string, unknown> {
  if (isOnChainTradeResult(result)) {
    return buildOnchainTradeBody(result);
  }
  return buildOffchainTradeBody(result, requestId);
}

export function buildTradeSellBody(
  result: TradeResult | OnChainTradeResult,
  requestId: string,
): Record<string, unknown> {
  if (isOnChainTradeResult(result)) {
    return buildOnchainTradeBody(result);
  }
  return buildOffchainSellBody(result, requestId);
}
