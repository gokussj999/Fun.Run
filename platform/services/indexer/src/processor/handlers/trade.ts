import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';
import { resolveIdentityWallet } from '@funrun/shared';
import type { RedisInstance as Redis } from '@funrun/redis';

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
  const identityBuyer = await resolveIdentityWallet(db, data.buyer);
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

    // Touch identity profile (Privy wallet — not custodial ghost row)
    await tx.profile.upsert({
      where: { walletAddress: identityBuyer },
      update: { lastSeenAt: new Date(blockTimeMs) },
      create: { walletAddress: identityBuyer, privyUserId: `indexed:${identityBuyer}`, role: 'USER' },
      select: { walletAddress: true },
    });

    // Insert trade record
    await tx.transaction.create({
      data: {
        coinId:          coin.id,
        walletAddress:   identityBuyer,
        tradeType:       'BUY',
        txSignature:     event.signature,
        slot:            event.slot,
        solAmount:       data.solAmount.toString(),
        tokenAmount:     data.tokenAmount.toString(),
        pricePerToken:   price,
        totalFee:        (data.treasuryFee + data.creatorFee + data.referrerFee).toString(),
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
        totalFeesCollected:    { increment: parseFloat((data.treasuryFee + data.creatorFee + data.referrerFee).toString()) },
        version:               { increment: 1 },
      },
    });

    // Update buyer holdings
    await tx.holding.upsert({
      where: { walletAddress_coinId: { walletAddress: identityBuyer, coinId: coin.id } },
      update: {
        tokenBalance: { increment: parseFloat(data.tokenAmount.toString()) },
        costBasisSol: { increment: parseFloat(data.solAmount.toString()) / 1e9 },
        totalBought:  { increment: parseFloat(data.tokenAmount.toString()) },
      },
      create: {
        walletAddress: identityBuyer,
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
    buyer:       data.buyer,
    slot:        event.slot.toString(),
    signature:   event.signature,
    blockTime:   event.blockTime,
  });

  await publishTradeSideEffects(
    db, publisher, data.mint, identityBuyer, 'BUY',
    data.solAmount.toString(), data.tokenAmount.toString(),
    data.creatorFee, data.referrerFee,
    event.slot.toString(), event.signature,
  );
}

export async function handleSell(
  event: ParsedEvent,
  db: PrismaClient,
  redis: Redis,
  publisher: RedisPublisher,
  logger: Logger,
): Promise<void> {
  const data = event.data as TokensSoldData;
  const identitySeller = await resolveIdentityWallet(db, data.seller);
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
      where: { walletAddress: identitySeller },
      update: { lastSeenAt: new Date(blockTimeMs) },
      create: { walletAddress: identitySeller, privyUserId: `indexed:${identitySeller}`, role: 'USER' },
      select: { walletAddress: true },
    });

    await tx.transaction.create({
      data: {
        coinId:          coin.id,
        walletAddress:   identitySeller,
        tradeType:       'SELL',
        txSignature:     event.signature,
        slot:            event.slot,
        solAmount:       data.solNet.toString(),
        tokenAmount:     data.tokenAmount.toString(),
        pricePerToken:   price,
        totalFee:        (data.treasuryFee + data.creatorFee + data.referrerFee).toString(),
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
        totalFeesCollected:   { increment: parseFloat((data.treasuryFee + data.creatorFee + data.referrerFee).toString()) },
        version:              { increment: 1 },
      },
    });

    await tx.holding.upsert({
      where: { walletAddress_coinId: { walletAddress: identitySeller, coinId: coin.id } },
      update: {
        tokenBalance: { decrement: parseFloat(data.tokenAmount.toString()) },
        totalSold:    { increment: parseFloat(data.tokenAmount.toString()) },
      },
      create: {
        walletAddress: identitySeller,
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

    await upsertCandles(tx as unknown as PrismaClient, coin.id, blockTimeMs, price, data.solNet);
  });

  await publisher.publishPriceUpdate(data.mint, {
    price,
    solAmount:   data.solNet.toString(),
    tokenAmount: data.tokenAmount.toString(),
    tradeType:   'SELL',
    seller:      data.seller,
    slot:        event.slot.toString(),
    signature:   event.signature,
    blockTime:   event.blockTime,
  });

  await publishTradeSideEffects(
    db, publisher, data.mint, identitySeller, 'SELL',
    data.solNet.toString(), data.tokenAmount.toString(),
    data.creatorFee, data.referrerFee,
    event.slot.toString(), event.signature,
  );
}

async function publishTradeSideEffects(
  db: PrismaClient,
  publisher: RedisPublisher,
  mint: string,
  wallet: string,
  tradeType: 'BUY' | 'SELL',
  solAmount: string,
  tokenAmount: string,
  creatorFee: bigint,
  referrerFee: bigint,
  slot: string,
  signature: string,
): Promise<void> {
  const coin = await db.coin.findUnique({
    where: { mintAddress: mint },
    select: { creatorWallet: true, referrerWallet: true },
  });
  if (!coin) return;

  await publisher.publishPortfolioUpdate(wallet, {
    wallet,
    mint,
    tradeType,
    tokenAmount,
    solAmount,
    slot,
    signature,
  });

  if (creatorFee > 0n) {
    // Credit creator's off-chain reward balance so claim endpoint returns correct amount
    const creatorSol = Number(creatorFee) / 1e9;
    await db.profile.upsert({
      where:  { walletAddress: coin.creatorWallet },
      update: { creatorRewardsSol: { increment: creatorSol } },
      create: {
        walletAddress:    coin.creatorWallet,
        privyUserId:      `indexed:${coin.creatorWallet}`,
        role:             'USER',
        creatorRewardsSol: creatorSol,
      },
      select: { walletAddress: true },
    });

    await publisher.publishCreatorUpdate(coin.creatorWallet, {
      wallet:    coin.creatorWallet,
      mint,
      eventType: 'fee_earned',
      amount:    creatorFee.toString(),
      tradeType,
      slot,
      signature,
    });
  }

  if (coin.referrerWallet && referrerFee > 0n) {
    // Credit referrer's off-chain reward balance
    const referralSol = Number(referrerFee) / 1e9;
    await db.profile.upsert({
      where:  { walletAddress: coin.referrerWallet },
      update: { referralRewardsSol: { increment: referralSol } },
      create: {
        walletAddress:      coin.referrerWallet,
        privyUserId:        `indexed:${coin.referrerWallet}`,
        role:               'USER',
        referralRewardsSol: referralSol,
      },
      select: { walletAddress: true },
    });

    await publisher.publishReferralUpdate(coin.referrerWallet, {
      wallet:    coin.referrerWallet,
      mint,
      eventType: 'fee_earned',
      amount:    referrerFee.toString(),
      tradeType,
      slot,
      signature,
    });
  }

  await publisher.publishNotification(wallet, {
    type:      tradeType === 'BUY' ? 'trade_buy' : 'trade_sell',
    title:     tradeType === 'BUY' ? 'Buy confirmed' : 'Sell confirmed',
    body:      `${tradeType} on ${mint.slice(0, 8)}… indexed`,
    mint,
    slot,
    signature,
  });
}
