import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';

import type {
  ParsedEvent,
  CreatorFeesClaimedData,
  CreatorReferrerFeesClaimedData,
  CreatorReferrerSetData,
  TreasurySweepData,
} from '../../types.js';

export async function handleCreatorFeesClaimed(
  event: ParsedEvent,
  db: PrismaClient,
  logger: Logger,
): Promise<void> {
  const data = event.data as CreatorFeesClaimedData;

  await db.$transaction(async (tx) => {
    const coin = await tx.coin.findUnique({
      where: { mintAddress: data.mint },
      select: { id: true },
    });

    if (!coin) {
      logger.warn({ mint: data.mint }, 'CreatorFeesClaimed: coin not found');
      return;
    }

    await tx.treasuryEvent.create({
      data: {
        eventType:      'CREATOR_CLAIM',
        coinId:         coin.id,
        txSignature:    event.signature,
        amountLamports: data.amount.toString(),
        cumulativeTotal: '0',
        memo:           `Creator claim: ${data.creator.slice(0, 8)}`,
      },
    });

    // Zero out claimable creator fees on the coin
    await tx.coin.update({
      where: { id: coin.id },
      data: { pendingCreatorFees: '0', version: { increment: 1 } },
    });

    logger.info({ mint: data.mint, amount: data.amount, creator: data.creator.slice(0, 8) }, 'CreatorFeesClaimed: indexed');
  });
}

export async function handleCreatorReferrerFeesClaimed(
  event: ParsedEvent,
  db: PrismaClient,
  logger: Logger,
): Promise<void> {
  const data = event.data as CreatorReferrerFeesClaimedData;

  await db.$transaction(async (tx) => {
    const coin = await tx.coin.findUnique({
      where: { mintAddress: data.mint },
      select: { id: true },
    });

    if (!coin) {
      logger.warn({ mint: data.mint }, 'CreatorReferrerFeesClaimed: coin not found');
      return;
    }

    await tx.treasuryEvent.create({
      data: {
        eventType:      'REFERRER_CLAIM',
        coinId:         coin.id,
        txSignature:    event.signature,
        amountLamports: data.referrerAmount.toString(),
        cumulativeTotal: '0',
        memo:           `Referrer claim: ${data.referrer.slice(0, 8)}`,
      },
    });

    await tx.coin.update({
      where: { id: coin.id },
      data: { pendingReferrerFees: '0', version: { increment: 1 } },
    });

    logger.info(
      { mint: data.mint, referrer: data.referrer.slice(0, 8), amount: data.referrerAmount },
      'CreatorReferrerFeesClaimed: indexed',
    );
  });
}

export async function handleCreatorReferrerSet(
  event: ParsedEvent,
  db: PrismaClient,
  logger: Logger,
): Promise<void> {
  const data = event.data as CreatorReferrerSetData;

  await db.$transaction(async (tx) => {
    const coin = await tx.coin.findUnique({
      where: { mintAddress: data.mint },
      select: { id: true },
    });

    if (!coin) {
      logger.warn({ mint: data.mint }, 'CreatorReferrerSet: coin not found');
      return;
    }

    await tx.coin.update({
      where: { id: coin.id },
      data: {
        referrerWallet: data.referrer,
        version:        { increment: 1 },
      },
    });

    logger.info({ mint: data.mint, referrer: data.referrer.slice(0, 8) }, 'CreatorReferrerSet: indexed');
  });
}

export async function handleTreasurySweep(
  event: ParsedEvent,
  db: PrismaClient,
  logger: Logger,
): Promise<void> {
  const data = event.data as TreasurySweepData;

  await db.treasuryEvent.create({
    data: {
      eventType:      'SWEEP',
      coinId:         null,
      txSignature:    event.signature,
      amountLamports: data.amount.toString(),
      cumulativeTotal: '0',
      memo:           `Treasury sweep → ${data.destination.slice(0, 8)}`,
    },
  });

  logger.info({ amount: data.amount, destination: data.destination.slice(0, 8) }, 'TreasurySweep: indexed');
}
