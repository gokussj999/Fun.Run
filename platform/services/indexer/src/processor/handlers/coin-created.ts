import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';

import type { ParsedEvent, CoinCreatedData } from '../../types.js';

export async function handleCoinCreated(
  event: ParsedEvent,
  db: PrismaClient,
  logger: Logger,
): Promise<void> {
  const data = event.data as CoinCreatedData;

  await db.$transaction(async (tx) => {
    // Upsert coin — idempotent: if the coin already exists from a previous run,
    // update only if the slot is newer (reorg protection).
    const existing = await tx.coin.findUnique({
      where: { mintAddress: data.mint },
      select: { id: true },
    });

    if (existing) {
      logger.debug({ mint: data.mint }, 'CoinCreated: coin already indexed, skipping');
      return;
    }

    // Resolve creator profile (upsert — may not exist yet if indexer is ahead of auth)
    const profile = await tx.profile.upsert({
      where: { walletAddress: data.creator },
      update: {},
      create: {
        walletAddress: data.creator,
        privyUserId: `indexed:${data.creator}`,
        role: 'CREATOR',
      },
      select: { walletAddress: true },
    });

    await tx.coin.create({
      data: {
        mintAddress:          data.mint,
        creatorWallet:        data.creator,
        name:                 data.name,
        symbol:               data.symbol,
        description:          '',
        imageUri:             data.uri,
        metadataUri:          data.uri,
        status:               'ACTIVE',
        virtualSolReserves:   data.virtualSolReserves.toString(),
        virtualTokenReserves: data.virtualTokenReserves.toString(),
        realSolReserves:      '0',
        realTokenReserves:    data.realTokenReserves.toString(),
        totalFeesCollected:   '0',
      },
    });

    logger.info(
      { mint: data.mint, creator: data.creator, name: data.name },
      'CoinCreated: indexed',
    );
  });
}
