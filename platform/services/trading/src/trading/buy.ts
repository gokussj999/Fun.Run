import { v4 as uuidv4 } from 'uuid';
import type { PrismaClient } from '@funrun/database';
import { acquireAdvisoryLock } from '../lock/db-advisory.js';
import { quoteBuy } from '../amm/calculator.js';
import { computeFeeBreakdown, distributeFees } from '../fees/distributor.js';
import { upsertCandles } from '../candles/upsert.js';
import { checkGraduation } from '../graduation/checker.js';
import type { BuyRequest, TradeContext, TradeResult } from '../types.js';

type TxClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export async function executeBuy(
  tx: TxClient,
  params: {
    req: BuyRequest;
    ctx: TradeContext;
    nowMs: number;
  },
): Promise<TradeResult> {
  const { req, ctx, nowMs } = params;
  const { coinId, solAmountLamports, minTokensOut } = req;
  const { requestId, walletAddress } = ctx;

  // ── 1. Advisory lock (cross-instance) ────────────────────────────────────────
  await acquireAdvisoryLock(tx, coinId);

  // ── 2. Fetch coin (within locked transaction) ─────────────────────────────────
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

  const vSol = BigInt(coin.virtualSolReserves.toString());
  const vTokens = BigInt(coin.virtualTokenReserves.toString());
  const realSol = BigInt(coin.realSolReserves.toString());

  // ── 3. AMM math ───────────────────────────────────────────────────────────────
  const quote = quoteBuy(solAmountLamports, vSol, vTokens);

  // ── 4. Slippage check ─────────────────────────────────────────────────────────
  if (quote.tokensOut < minTokensOut) {
    throw Object.assign(
      new Error(
        `Slippage exceeded: expected >= ${minTokensOut} tokens, got ${quote.tokensOut}`,
      ),
      { code: 'SLIPPAGE_EXCEEDED' },
    );
  }

  // ── 5. Fee breakdown ──────────────────────────────────────────────────────────
  const referrerWallet = coin.referrerWallet;
  const fees = computeFeeBreakdown(quote.feeTotal, referrerWallet !== null);

  // ── 6. Off-chain tx signature ─────────────────────────────────────────────────
  const txId = `oc_${uuidv4().replace(/-/g, '')}`;

  // ── 7. Update coin reserves + version (optimistic lock) ──────────────────────
  // realSolAfter uses quote.solNet (= solIn - totalFee) — the net SOL that actually
  // enters the bonding curve after the full fee is deducted, matching V1 behaviour.
  const realSolAfter = realSol + quote.solNet;
  await tx.coin.update({
    where: { id: coinId, version: coin.version },
    data: {
      virtualSolReserves: quote.newVirtualSol.toString(),
      virtualTokenReserves: quote.newVirtualTokens.toString(),
      realSolReserves: realSolAfter.toString(),
      totalFeesCollected: {
        increment: fees.totalFee.toString(),
      },
      version: { increment: 1 },
    },
  });

  // ── 8. Create transaction record ─────────────────────────────────────────────
  await tx.transaction.create({
    data: {
      coinId,
      walletAddress,
      tradeType: 'BUY',
      txSignature: txId,
      slot: 0n,
      solAmount: solAmountLamports.toString(),
      tokenAmount: quote.tokensOut.toString(),
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

  // ── 9. Upsert holding ─────────────────────────────────────────────────────────
  await tx.holding.upsert({
    where: { walletAddress_coinId: { walletAddress, coinId } },
    create: {
      walletAddress,
      coinId,
      tokenBalance: quote.tokensOut.toString(),
      costBasisSol: solAmountLamports.toString(),
      totalBought: quote.tokensOut.toString(),
      totalSold: '0',
    },
    update: {
      tokenBalance: { increment: quote.tokensOut.toString() },
      costBasisSol: { increment: solAmountLamports.toString() },
      totalBought: { increment: quote.tokensOut.toString() },
    },
  });

  // ── 10. Upsert candles ────────────────────────────────────────────────────────
  await upsertCandles(tx, {
    coinId,
    pricePerToken: quote.pricePerToken,
    volumeLamports: solAmountLamports,
    nowMs,
  });

  // ── 11. Distribute fees ───────────────────────────────────────────────────────
  await distributeFees(tx, { coinId, txSignature: txId, fees, referrerWallet });

  // ── 12. Graduation check ──────────────────────────────────────────────────────
  const gradResult = await checkGraduation(tx, {
    coinId,
    realSolAfter,
    currentStatus: coin.status,
  });

  return {
    txId,
    coinId,
    mintAddress: coin.mintAddress,
    walletAddress,
    tradeType: 'BUY',
    solAmount: solAmountLamports,
    tokenAmount: quote.tokensOut,
    pricePerToken: quote.pricePerToken,
    priceImpactBps: quote.priceImpactBps,
    fees,
    virtualSolAfter: quote.newVirtualSol,
    virtualTokensAfter: quote.newVirtualTokens,
    graduated: gradResult.triggered,
    remainingTokenBalance: 0n, // not applicable for buy
    requestId,
  };
}
