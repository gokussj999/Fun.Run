import { PrismaClient } from '@funrun/database';
const db = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_kpabG4z1UXRE@ep-red-queen-a11v85bz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&schema=funrun_platform' }}});
const txs = await db.transaction.findMany({ orderBy: { confirmedAt: 'desc' }, take: 5, select: { tradeType: true, walletAddress: true, solAmount: true, tokenAmount: true, confirmedAt: true }});
console.log('=== RECENT TXS ===');
console.log(JSON.stringify(txs, null, 2));
const holdings = await db.holding.findMany({ where: { tokenBalance: { gt: 0 }}, take: 5, select: { walletAddress: true, coinId: true, tokenBalance: true }});
console.log('\n=== HOLDINGS WITH BALANCE ===');
console.log(JSON.stringify(holdings, null, 2));
await db.$disconnect();
