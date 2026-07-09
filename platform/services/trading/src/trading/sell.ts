import { v4 as uuidv4 } from 'uuid';
import type { PrismaClient } from '@funrun/database';
import { acquireAdvisoryLock } from '../lock/db-advisory.js';
import { quoteSell } from '../amm/calculator.js';
import { computeFeeBreakdown, distributeFees } from '../fees/distributor.js';
import { upsertCandles } from '../candles/upsert.js';
import type { SellRequest, TradeContext, TradeResult } from '../types.js';

type TxClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export async function executeSell(
  tx: TxClient,
  params: {
    req: SellRequest;
    ctx: TradeContext;
    nowMs: number;
  },
): Promise<TradeResult> {
  const { req, ctx, nowMs } = params;
  const { coinId, tokenAmountRaw, minSolOut, maxPriceImpactBps } = req;
  const { requestId, walletAddress } = ctx;

  // ── 1. Advisory lock (cross-instance) ────────────────────────────────────────
  await acquireAdvisoryLock(tx, coinId);

  // ── 2. Fetch coin ─────────────────────────────────────────────────────────────
  const coin = await tx.coin.findUniqueOrThrow({
    where: { id: coinId },
    select: {
      id: true,
      mintAddress: true,
      creatorWallet: true,
      referrerWallet: true,
      virtualSolReserves: true,
      virtualTokenReserves: true,
      realSolReserves: true,
      totalFeesCollected: true,
      status: true,
      version: true,
    },
  });

  if (coin.status === 'GRADUATED') {
    throw Object.assign(new Error('Coin has graduated — trade on Raydium'), {
      code: 'COIN_GRADUATED',
    });
  }
  if (coin.status === 'PAUSED') {
    throw Object.assign(new Error('Trading is paused for this coin'), {
      code: 'COIN_PAUSED',
    });
  }
  // GRADUATING coins remain tradeable until graduation is fully completed on-chain.

  const vSol = BigInt(coin.virtualSolReserves.toString());
  const vTokens = BigInt(coin.virtualTokenReserves.toString());
  const realSol = BigInt(coin.realSolReserves.toString());

  // ── 3. Authoritative balance check (inside lock) ──────────────────────────────
  // The pre-lock check in executor.ts is a fast-path reject; this is the definitive check.
  const holding = await tx.holding.findUnique({
    where: { walletAddress_coinId: { walletAddress, coinId } },
    select: { tokenBalance: true },
  });

  const balance = BigInt(holding?.tokenBalance.toString() ?? '0');
  if (balance < tokenAmountRaw) {
    throw Object.assign(
      new Error(`Insufficient balance: have ${balance}, want ${tokenAmountRaw}`),
      { code: 'INSUFFICIENT_BALANCE' },
    );
  }

  // ── 4. AMM math ───────────────────────────────────────────────────────────────
  const quote = quoteSell(tokenAmountRaw, vSol, vTokens);

  // ── 5. Price impact guard (optional) ─────────────────────────────────────────
  // If the client specifies maxPriceImpactBps, reject if the sell would move
  // the price beyond that threshold. This protects against accidental large sells.
  if (maxPriceImpactBps !== undefined && quote.priceImpactBps > maxPriceImpactBps) {
    throw Object.assign(
      new Error(
        `Price impact too high: ${quote.priceImpactBps} bps exceeds max ${maxPriceImpactBps} bps`,
      ),
      { code: 'PRICE_IMPACT_EXCEEDED' },
    );
  }

  // ── 6. Slippage check ─────────────────────────────────────────────────────────
  if (quote.solOut < minSolOut) {
    throw Object.assign(
      new Error(
        `Slippage exceeded: expected >= ${minSolOut} lamports, got ${quote.solOut}`,
      ),
      { code: 'SLIPPAGE_EXCEEDED' },
    );
  }

  // ── 7. Fee breakdown ──────────────────────────────────────────────────────────
  const referrerWallet = coin.referrerWallet;
  const fees = computeFeeBreakdown(quote.feeTotal, referrerWallet !== null);

  // ── 8. Off-chain tx signature ─────────────────────────────────────────────────
  const txId = `oc_${uuidv4().replace(/-/g, '')}`;

  // ── 9. Update coin reserves ───────────────────────────────────────────────────
  // realSolReserves decreases by solGross (the amount leaving the curve before fee).
  // Fee is deducted from the user's payout, not from reserves.
  const realSolAfter = realSol > quote.solGross ? realSol - quote.solGross : 0n;
  await tx.coin.update({
    where: { id: coinId, version: coin.version },
    data: {
      virtualSolReserves: quote.newVirtualSol.toString(),
      virtualTokenReserves: quote.newVirtualTokens.toString(),
      realSolReserves: realSolAfter.toString(),
      totalFeesCollected: { increment: fees.totalFee.toString() },
      version: { increment: 1 },
    },
  });

  // ── 10. Create transaction record ─────────────────────────────────────────────
  await tx.transaction.create({
    data: {
      coinId,
      walletAddress,
      tradeType: 'SELL',
      txSignature: txId,
      slot: 0n,
      solAmount: quote.solOut.toString(),
      tokenAmount: tokenAmountRaw.toString(),
      pricePerToken: quote.pricePerToken.toString(),
      totalFee: fees.totalFee.toString(),
      creatorFee: fees.creatorFee.toString(),
      referrerFee: fees.referrerFee.toString(),
      treasuryFee: fees.treasuryFee.toString(),
      virtualSolAfter: quote.newVirtualSol.toString(),
      virtualTokensAfter: quote.newVirtualTokens.toString(),
      confirmedAt: new Date(nowMs),
    },
  });

  // ── 11. Update holding ────────────────────────────────────────────────────────
  const remainingTokenBalance = balance - tokenAmountRaw;
  if (remainingTokenBalance === 0n) {
    await tx.holding.delete({
      where: { walletAddress_coinId: { walletAddress, coinId } },
    });
  } else {
    await tx.holding.update({
      where: { walletAddress_coinId: { walletAddress, coinId } },
      data: {
        tokenBalance: remainingTokenBalance.toString(),
        totalSold: { increment: tokenAmountRaw.toString() },
      },
    });
  }

  // ── 12. Upsert candles ────────────────────────────────────────────────────────
  await upsertCandles(tx, {
    coinId,
    pricePerToken: quote.pricePerToken,
    volumeLamports: quote.solOut,
    nowMs,
  });

  // ── 13. Distribute fees ───────────────────────────────────────────────────────
  await distributeFees(tx, { coinId, txSignature: txId, fees, referrerWallet });

  return {
    txId,
    coinId,
    mintAddress: coin.mintAddress,
    walletAddress,
    tradeType: 'SELL',
    solAmount: quote.solOut,
    tokenAmount: tokenAmountRaw,
    pricePerToken: quote.pricePerToken,
    priceImpactBps: quote.priceImpactBps,
    fees,
    virtualSolAfter: quote.newVirtualSol,
    virtualTokensAfter: quote.newVirtualTokens,
    graduated: false,
    remainingTokenBalance,
    requestId,
  };
}
