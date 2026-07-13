// Use the shared database package which is already installed
import { PrismaClient } from '@funrun/database';

const db = new PrismaClient({
  datasources: { db: { url: 'postgresql://neondb_owner:npg_kpabG4z1UXRE@ep-red-queen-a11v85bz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&schema=funrun_platform' } }
});

const coinId = 'cmrghtlv1000nuyr0yptsb9b9';

const cursor = await db.indexerState.findUnique({ where: { id: 'singleton' } });
console.log('=== INDEXER CURSOR ===');
console.log(cursor);

const txs = await db.transaction.findMany({
  where: { coinId },
  orderBy: { confirmedAt: 'desc' },
  take: 5,
  select: { tradeType: true, txSignature: true, solAmount: true, tokenAmount: true, confirmedAt: true }
});
console.log('\n=== LAST 5 TXs ===');
console.log(txs);

const holdings = await db.holding.findMany({
  where: { coinId },
  select: { walletAddress: true, tokenBalance: true, totalBought: true, totalSold: true }
});
console.log('\n=== HOLDINGS ===');
console.log(holdings);

const coin = await db.coin.findUnique({
  where: { id: coinId },
  select: { virtualSolReserves: true, virtualTokenReserves: true, realSolReserves: true }
});
console.log('\n=== COIN RESERVES ===');
console.log(coin);

await db.$disconnect();
