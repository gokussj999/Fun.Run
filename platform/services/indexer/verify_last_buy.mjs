import { PrismaClient } from '@funrun/database';
const db = new PrismaClient();

// 1. Last BUY transaction
const tx = await db.transaction.findFirst({
  where: { tradeType: 'BUY' },
  orderBy: { createdAt: 'desc' },
});
console.log('LAST BUY TX:', JSON.stringify(tx, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));

if (!tx) { await db.$disconnect(); process.exit(0); }

// 2. Coin reserves
const coin = await db.coin.findUnique({
  where: { id: tx.coinId },
  select: { id: true, mintAddress: true, virtualSolReserves: true, virtualTokenReserves: true, realSolReserves: true, totalFeesCollected: true, creatorWallet: true }
});
console.log('\nCOIN RESERVES:', JSON.stringify(coin, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));

// 3. Holdings for buyer
const holding = await db.holding.findUnique({
  where: { walletAddress_coinId: { walletAddress: tx.walletAddress, coinId: tx.coinId } }
});
console.log('\nHOLDINGS:', JSON.stringify(holding, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));

// 4. Candles
const candles = await db.candle.findMany({
  where: { coinId: tx.coinId },
  select: { timeframe: true, close: true, volume: true, trades: true, updatedAt: true }
});
console.log('\nCANDLES:', JSON.stringify(candles, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));

// 5. Creator rewards (treasury events for this tx)
const treasuryEvt = await db.treasuryEvent.findFirst({
  where: { txSignature: tx.txSignature }
});
console.log('\nTREASURY EVENT:', JSON.stringify(treasuryEvt, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));

// 6. Creator profile (check run_balance or creator fees)
if (coin?.creatorWallet) {
  const creatorProfile = await db.profile.findUnique({
    where: { walletAddress: coin.creatorWallet },
    select: { walletAddress: true, runBalance: true, createdAt: true }
  });
  console.log('\nCREATOR PROFILE:', JSON.stringify(creatorProfile, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));
}

await db.$disconnect();
