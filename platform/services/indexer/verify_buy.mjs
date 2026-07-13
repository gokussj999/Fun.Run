import { PrismaClient } from '@funrun/database';
const db = new PrismaClient();

const sig = 'fo9q6Lqcy97XkYFkB5H61fVHM65D6QWGs3vD3a8QwujX4DhTNXbq3NCYbN1nNhqbX8UVmoactkdWHJKgRNzzSiT';
const mint = 'J4H39oA6nPEvuFCcJwixXpNQBTMu5q1uD1h4Va57zUCh';

// 1. Check transaction record
const tx = await db.transaction.findUnique({ where: { txSignature: sig } });
console.log('1. Transaction:', JSON.stringify(tx, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));

// 2. Check coin reserves updated
const coin = await db.coin.findUnique({ where: { mintAddress: mint }, select: {
  id: true, mintAddress: true, virtualSolReserves: true, virtualTokenReserves: true, realSolReserves: true, totalFeesCollected: true
}});
console.log('2. Coin reserves:', JSON.stringify(coin, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));

// 3. Check holdings
if (tx) {
  const holding = await db.holding.findUnique({
    where: { walletAddress_coinId: { walletAddress: tx.walletAddress, coinId: tx.coinId } }
  });
  console.log('3. Holdings:', JSON.stringify(holding, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));
}

// 4. Check candles
if (coin) {
  const candles = await db.candle.findMany({ where: { coinId: coin.id }, select: { timeframe: true, close: true, volume: true, trades: true } });
  console.log('4. Candles:', JSON.stringify(candles, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));
}

await db.$disconnect();
