import { computeTokensOut, computeSolOut, computePrice } from '@funrun/shared';
import { DEFAULT_TRADING_FEE_BPS } from '../constants.js';

export interface BuyQuote {
  tokensOut: bigint;
  feeTotal: bigint;
  solNet: bigint;
  newVirtualSol: bigint;
  newVirtualTokens: bigint;
  pricePerToken: number;
  priceImpactBps: number;
}

export interface SellQuote {
  solOut: bigint;
  feeTotal: bigint;
  solGross: bigint;
  newVirtualSol: bigint;
  newVirtualTokens: bigint;
  pricePerToken: number;
  priceImpactBps: number;
}

export function quoteBuy(
  solIn: bigint,
  virtualSol: bigint,
  virtualTokens: bigint,
  feeBps = DEFAULT_TRADING_FEE_BPS,
): BuyQuote {
  const { tokensOut, feeTotal, solNet } = computeTokensOut(
    solIn,
    virtualSol,
    virtualTokens,
    feeBps,
  );

  const newVirtualSol = virtualSol + solNet;
  const newVirtualTokens = virtualTokens - tokensOut;

  const priceBefore = computePrice(virtualSol, virtualTokens);
  const priceAfter = computePrice(newVirtualSol, newVirtualTokens);
  const pricePerToken = priceAfter;
  const priceImpactBps =
    priceBefore > 0
      ? Math.round(((priceAfter - priceBefore) / priceBefore) * 10_000)
      : 0;

  return {
    tokensOut,
    feeTotal,
    solNet,
    newVirtualSol,
    newVirtualTokens,
    pricePerToken,
    priceImpactBps,
  };
}

export function quoteSell(
  tokensIn: bigint,
  virtualSol: bigint,
  virtualTokens: bigint,
  feeBps = DEFAULT_TRADING_FEE_BPS,
): SellQuote {
  const { solOut, feeTotal, solGross } = computeSolOut(
    tokensIn,
    virtualSol,
    virtualTokens,
    feeBps,
  );

  const newVirtualSol = virtualSol - solGross;
  const newVirtualTokens = virtualTokens + tokensIn;

  const priceBefore = computePrice(virtualSol, virtualTokens);
  const priceAfter = computePrice(newVirtualSol, newVirtualTokens);
  const pricePerToken = priceAfter;
  const priceImpactBps =
    priceBefore > 0
      ? Math.round(((priceBefore - priceAfter) / priceBefore) * 10_000)
      : 0;

  return {
    solOut,
    feeTotal,
    solGross,
    newVirtualSol,
    newVirtualTokens,
    pricePerToken,
    priceImpactBps,
  };
}
