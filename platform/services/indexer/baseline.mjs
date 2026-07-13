import { PrismaClient } from '@funrun/database';
const db = new PrismaClient();

const coin = await db.coin.findFirst({
  where: { mintAddress: 'J4H39oA6nPEvuFCcJwixXpNQBTMu5q1uD1h4Va57zUCh' },
  select: { id: true, virtualSolReserves: true, virtualTokenReserves: true, realSolReserves: true, totalFeesCollected: true }
});
const holding = await db.holding.findFirst({
  where: { coinId: coin.id, walletAddress: 'kCzahAz2cTbvR5ujnG39HF1gYtseCxqmFKs97VJWqYY' },
  select: { tokenBalance: true, totalSold: true, costBasisSol: true }
});
const lastTx = await db.transaction.findFirst({ orderBy: { createdAt: 'desc' }, select: { tradeType: true, createdAt: true, txSignature: true } });

console.log('BASELINE coin:', JSON.stringify(coin, (k,v) => typeof v === 'bigint' ? v.toString() : v));
console.log('BASELINE holding:', JSON.stringify(holding, (k,v) => typeof v === 'bigint' ? v.toString() : v));
console.log('BASELINE lastTx:', JSON.stringify(lastTx));
await db.$disconnect();
