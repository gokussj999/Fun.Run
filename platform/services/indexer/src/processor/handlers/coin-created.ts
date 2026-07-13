import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';
import { resolveIdentityWallet } from '@funrun/shared';

import type { ParsedEvent, CoinCreatedData } from '../../types.js';
import type { RedisPublisher } from '../../publisher/redis.js';

/** Initial tradeable supply set in create_coin.rs (BONDING_SUPPLY_TOKENS). */
const BONDING_SUPPLY_TOKENS = '800000000000000';

export async function handleCoinCreated(
  event: ParsedEvent,
  db: PrismaClient,
  publisher: RedisPublisher,
  logger: Logger,
): Promise<void> {
  const data = event.data as CoinCreatedData;
  const identityCreator = await resolveIdentityWallet(db, data.creator);
  let created = false;

  await db.$transaction(async (tx) => {
    const existing = await tx.coin.findUnique({
      where: { mintAddress: data.mint },
      select: { id: true },
    });

    if (existing) {
      logger.debug({ mint: data.mint }, 'CoinCreated: coin already indexed, skipping');
      return;
    }

    await tx.profile.upsert({
      where: { walletAddress: identityCreator },
      update: { role: 'CREATOR' },
      create: {
        walletAddress: identityCreator,
        privyUserId: `indexed:${identityCreator}`,
        role: 'CREATOR',
      },
      select: { walletAddress: true },
    });

    await tx.coin.create({
      data: {
        mintAddress:          data.mint,
        creatorWallet:        identityCreator,
        name:                 data.name,
        symbol:               data.symbol,
        description:          '',
        imageUri:             data.uri,
        metadataUri:          data.uri,
        status:               'ACTIVE',
        virtualSolReserves:   data.virtualSolReserves.toString(),
        virtualTokenReserves: data.virtualTokenReserves.toString(),
        realSolReserves:      '0',
        realTokenReserves:    BONDING_SUPPLY_TOKENS,
        totalFeesCollected:   '0',
      },
    });

    created = true;
    logger.info(
      { mint: data.mint, creator: data.creator, name: data.name },
      'CoinCreated: indexed',
    );
  });

  if (!created) return;

  await publisher.publishCoinCreated({
    mint:      data.mint,
    creator:   identityCreator,
    name:      data.name,
    symbol:    data.symbol,
    uri:       data.uri,
    slot:      event.slot.toString(),
    signature: event.signature,
  });

  await publisher.publishCreatorUpdate(identityCreator, {
    wallet:    identityCreator,
    mint:      data.mint,
    eventType: 'coin_launched',
    slot:      event.slot.toString(),
    signature: event.signature,
    name:      data.name,
    symbol:    data.symbol,
  });

  await publisher.publishNotification(identityCreator, {
    type:      'coin_created',
    title:     'Coin launched',
    body:      `${data.name} (${data.symbol}) is now live`,
    mint:      data.mint,
    slot:      event.slot.toString(),
    signature: event.signature,
  });
}
