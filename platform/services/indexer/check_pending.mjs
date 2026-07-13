import { PrismaClient } from '@funrun/database';
const db = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_kpabG4z1UXRE@ep-red-queen-a11v85bz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&schema=funrun_platform' }}});

// All recent pending_txs
const recent = await db.pendingTx.findMany({
  orderBy: { createdAt: 'desc' }, take: 10,
  select: { id: true, status: true, signature: true, createdAt: true, errorMessage: true }
});
console.log('=== RECENT PENDING_TXS ===');
recent.forEach(t => console.log(t.status, t.signature?.slice(0,16), t.errorMessage?.slice(0,60), t.createdAt));

// All recent transactions
const txs = await db.transaction.findMany({
  orderBy: { confirmedAt: 'desc' }, take: 5,
  select: { tradeType: true, walletAddress: true, solAmount: true, tokenAmount: true, confirmedAt: true, txSignature: true }
});
console.log('\n=== RECENT TRANSACTIONS ===');
txs.forEach(t => console.log(t.tradeType, t.walletAddress?.slice(0,12), 'sol:', t.solAmount, 'tokens:', t.tokenAmount, t.confirmedAt));

// Profile runBalanceSol for all wallets
const profiles = await db.profile.findMany({
  where: { runBalanceSol: { gt: 0 }},
  select: { walletAddress: true, runBalanceSol: true },
  orderBy: { runBalanceSol: 'desc' }
});
console.log('\n=== PROFILES WITH runBalance > 0 ===');
profiles.forEach(p => console.log(p.walletAddress?.slice(0,16), 'runBal:', p.runBalanceSol));

await db.$disconnect();
