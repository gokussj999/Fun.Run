import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';
import type Redis from 'ioredis';

import type { ParsedEvent, TokensPurchasedData, TokensSoldData } from '../../types.js';
import { computePrice, upsertCandles } from '../candles.js';
import type { RedisPublisher } from '../../publisher/redis.js';

export async function handleBuy(
  event: ParsedEvent,
  db: PrismaClient,
  redis: Redis,
  publisher: RedisPublisher,
  logger: Logger,
): Promise<void> {
  const data = event.data as TokensPurchasedData;
  const price = computePrice(data.virtualSolAfter, data.virtualTokensAfter);
  const blockTimeMs = event.blockTime * 1000;

  await db.$transaction(async (tx) => {
    // Resolve coin ID
    const coin = await tx.coin.findUnique({
      where: { mintAddress: data.mint },
      select: { id: true },
    });

    if (!coin) {
      logger.warn({ mint: data.mint, sig: event.signature }, 'Buy: coin not found — skipping');
      return;
    }

    // Upsert buyer profile
    await tx.profile.upsert({
      where: { walletAddress: data.buyer },
      update: { lastSeenAt: new Date(blockTimeMs) },
      create: { walletAddress: data.buyer, privyUserId: `indexed:${data.buyer}`, role: 'USER' },
      select: { walletAddress: true },
    });

    // Insert trade record
    await tx.transaction.create({
      data: {
        coinId:          coin.id,
        walletAddress:   data.buyer,
        tradeType:       'BUY',
        txSignature:     event.signature,
        slot:            event.slot,
        solAmount:       data.solAmount.toString(),
        tokenAmount:     data.tokenAmount.toString(),
        pricePerToken:   price,
        totalFee:        data.feeTotal.toString(),
        creatorFee:      data.creatorFee.toString(),
        referrerFee:     data.referrerFee.toString(),
        treasuryFee:     data.treasuryFee.toString(),
        virtualSolAfter: data.virtualSolAfter.toString(),
        virtualTokensAfter: data.virtualTokensAfter.toString(),
        confirmedAt:     new Date(blockTimeMs),
      },
    });

    // Update coin reserves (optimistic: only if virtual reserves moved forward)
    await tx.coin.update({
      where: { id: coin.id },
      data: {
        virtualSolReserves:    data.virtualSolAfter.toString(),
        virtualTokenReserves:  data.virtualTokensAfter.toString(),
        realSolReserves:       data.realSolAfter.toString(),
        totalFeesCollected:    { increment: parseFloat(data.feeTotal.toString()) },
        version:               { increment: 1 },
      },
    });

    // Update buyer holdings
    await tx.holding.upsert({
      where: { walletAddress_coinId: { walletAddress: data.buyer, coinId: coin.id } },
      update: {
        tokenBalance: { increment: parseFloat(data.tokenAmount.toString()) },
        costBasisSol: { increment: parseFloat(data.solAmount.toString()) / 1e9 },
        totalBought:  { increment: parseFloat(data.tokenAmount.toString()) },
      },
      create: {
        walletAddress: data.buyer,
        coinId:        coin.id,
        tokenBalance:  data.tokenAmount.toString(),
        costBasisSol:  (Number(data.solAmount) / 1e9).toFixed(9),
        totalBought:   data.tokenAmount.toString(),
        totalSold:     '0',
      },
    });

    // Update treasury event
    await tx.treasuryEvent.create({
      data: {
        eventType:      'TRADE_FEE',
        coinId:         coin.id,
        txSignature:    event.signature,
        amountLamports: data.treasuryFee.toString(),
        cumulativeTotal: '0', // computed by a separate aggregation job
        memo:           `Buy: ${data.buyer.slice(0, 8)}`,
      },
    });

    // Upsert OHLCV candles for all 6 timeframes
    await upsertCandles(tx as unknown as PrismaClient, coin.id, blockTimeMs, price, data.solAmount);

    logger.info(
      { mint: data.mint, buyer: data.buyer.slice(0, 8), sol: data.solAmount, sig: event.signature },
      'Buy: indexed',
    );
  });

  // Publish price update to WebSocket subscribers (outside DB transaction — fire & forget)
  await publisher.publishPriceUpdate(data.mint, {
    price,
    solAmount:   data.solAmount.toString(),
    tokenAmount: data.tokenAmount.toString(),
    tradeType:   'BUY',
    slot:        event.slot.toString(),
    signature:   event.signature,
    blockTime:   event.blockTime,
  });
}

export async function handleSell(
  event: ParsedEvent,
  db: PrismaClient,
  redis: Redis,
  publisher: RedisPublisher,
  logger: Logger,
): Promise<void> {
  const data = event.data as TokensSoldData;
  const price = computePrice(data.virtualSolAfter, data.virtualTokensAfter);
  const blockTimeMs = event.blockTime * 1000;

  await db.$transaction(async (tx) => {
    const coin = await tx.coin.findUnique({
      where: { mintAddress: data.mint },
      select: { id: true },
    });

    if (!coin) {
      logger.warn({ mint: data.mint, sig: event.signature }, 'Sell: coin not found — skipping');
      return;
    }

    await tx.profile.upsert({
      where: { walletAddress: data.seller },
      update: { lastSeenAt: new Date(blockTimeMs) },
      create: { walletAddress: data.seller, privyUserId: `indexed:${data.seller}`, role: 'USER' },
      select: { walletAddress: true },
    });

    await tx.transaction.create({
      data: {
        coinId:          coin.id,
        walletAddress:   data.seller,
        tradeType:       'SELL',
        txSignature:     event.signature,
        slot:            event.slot,
        solAmount:       data.solAmount.toString(),
        tokenAmount:     data.tokenAmount.toString(),
        pricePerToken:   price,
        totalFee:        data.feeTotal.toString(),
        creatorFee:      data.creatorFee.toString(),
        referrerFee:     data.referrerFee.toString(),
        treasuryFee:     data.treasuryFee.toString(),
        virtualSolAfter: data.virtualSolAfter.toString(),
        virtualTokensAfter: data.virtualTokensAfter.toString(),
        confirmedAt:     new Date(blockTimeMs),
      },
    });

    await tx.coin.update({
      where: { id: coin.id },
      data: {
        virtualSolReserves:   data.virtualSolAfter.toString(),
        virtualTokenReserves: data.virtualTokensAfter.toString(),
        realSolReserves:      data.realSolAfter.toString(),
        totalFeesCollected:   { increment: parseFloat(data.feeTotal.toString()) },
        version:              { increment: 1 },
      },
    });

    await tx.holding.upsert({
      where: { walletAddress_coinId: { walletAddress: data.seller, coinId: coin.id } },
      update: {
        tokenBalance: { decrement: parseFloat(data.tokenAmount.toString()) },
        totalSold:    { increment: parseFloat(data.tokenAmount.toString()) },
      },
      create: {
        walletAddress: data.seller,
        coinId:        coin.id,
        tokenBalance:  '0',
        costBasisSol:  '0',
        totalBought:   '0',
        totalSold:     data.tokenAmount.toString(),
      },
    });

    await tx.treasuryEvent.create({
      data: {
        eventType:      'TRADE_FEE',
        coinId:         coin.id,
        txSignature:    event.signature,
        amountLamports: data.treasuryFee.toString(),
        cumulativeTotal: '0',
        memo:           `Sell: ${data.seller.slice(0, 8)}`,
      },
    });

    await upsertCandles(tx as unknown as PrismaClient, coin.id, blockTimeMs, price, data.solAmount);
  });

  await publisher.publishPriceUpdate(data.mint, {
    price,
    solAmount:   data.solAmount.toString(),
    tokenAmount: data.tokenAmount.toString(),
    tradeType:   'SELL',
    slot:        event.slot.toString(),
    signature:   event.signature,
    blockTime:   event.blockTime,
  });
}
