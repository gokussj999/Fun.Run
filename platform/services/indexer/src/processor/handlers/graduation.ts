import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';

import type { ParsedEvent, GraduationInitiatedData, GraduationCompletedData } from '../../types.js';
import type { RedisPublisher } from '../../publisher/redis.js';

export async function handleGraduationInitiated(
  event: ParsedEvent,
  db: PrismaClient,
  publisher: RedisPublisher,
  logger: Logger,
): Promise<void> {
  const data = event.data as GraduationInitiatedData;

  await db.$transaction(async (tx) => {
    const coin = await tx.coin.findUnique({
      where: { mintAddress: data.mint },
      select: { id: true, status: true },
    });

    if (!coin) {
      logger.warn({ mint: data.mint }, 'GraduationInitiated: coin not found');
      return;
    }

    if (coin.status === 'GRADUATING' || coin.status === 'GRADUATED') {
      logger.debug({ mint: data.mint, status: coin.status }, 'GraduationInitiated: already transitioning');
      return;
    }

    await tx.coin.update({
      where: { id: coin.id },
      data: {
        status:               'GRADUATING',
        graduationInitiatedAt: new Date(event.blockTime * 1000),
        creatorFeeSnapshot:   data.creatorFeeSnapshot.toString(),
        referrerFeeSnapshot:  data.referrerFeeSnapshot.toString(),
        referrerWallet:       data.referrer ?? null,
        version:              { increment: 1 },
      },
    });

    logger.info(
      { mint: data.mint, sol: data.solAtInitiation, initiator: data.initiator.slice(0, 8) },
      'GraduationInitiated: indexed',
    );
  });

  await publisher.publishGraduation(data.mint, {
    phase:     'initiated',
    mint:      data.mint,
    initiator: data.initiator,
    solAtInitiation: data.solAtInitiation.toString(),
    slot:      event.slot.toString(),
    blockTime: event.blockTime,
  });
}

export async function handleGraduationCompleted(
  event: ParsedEvent,
  db: PrismaClient,
  publisher: RedisPublisher,
  logger: Logger,
): Promise<void> {
  const data = event.data as GraduationCompletedData;

  await db.$transaction(async (tx) => {
    const coin = await tx.coin.findUnique({
      where: { mintAddress: data.mint },
      select: { id: true },
    });

    if (!coin) {
      logger.warn({ mint: data.mint }, 'GraduationCompleted: coin not found');
      return;
    }

    await tx.coin.update({
      where: { id: coin.id },
      data: {
        status:                 'GRADUATED',
        graduationCompletedAt:  new Date(event.blockTime * 1000),
        raydiumPoolAddress:     data.poolState,
        lpMintAddress:          data.lpMint,
        lpTokensBurned:         true,
        mintAuthorityRevoked:   true,
        freezeAuthorityRevoked: true,
        version:                { increment: 1 },
      },
    });

    await tx.treasuryEvent.create({
      data: {
        eventType:      'DEX_FEE',
        coinId:         coin.id,
        txSignature:    event.signature,
        amountLamports: data.dexFee.toString(),
        cumulativeTotal: '0',
        memo:           `Graduation DEX fee for ${data.mint.slice(0, 8)}`,
      },
    });

    logger.info(
      { mint: data.mint, pool: data.poolState.slice(0, 8), completer: data.completer.slice(0, 8) },
      'GraduationCompleted: indexed',
    );
  });

  await publisher.publishGraduation(data.mint, {
    phase:          'completed',
    mint:           data.mint,
    completer:      data.completer,
    poolState:      data.poolState,
    lpMint:         data.lpMint,
    solAddedToPool: data.solAddedToPool.toString(),
    lpAmount:       data.lpAmount.toString(),
    slot:           event.slot.toString(),
    blockTime:      event.blockTime,
  });
}
