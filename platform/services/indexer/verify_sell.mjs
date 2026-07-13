import { PrismaClient } from '@funrun/database';
const db = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_kpabG4z1UXRE@ep-red-queen-a11v85bz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&schema=funrun_platform' }}});

const COIN_ID = 'cmrghtlv1000nuyr0yptsb9b9';
const WALLET  = 'kCzahAz2cTbvR5ujnG39HF1gYtseCxqmFKs97VJWqYY';

const [holding, profile, sellTxs, coin, pendingTxs] = await Promise.all([
  db.holding.findUnique({ where: { walletAddress_coinId: { walletAddress: WALLET, coinId: COIN_ID }}}),
  db.profile.findUnique({ where: { walletAddress: WALLET }, select: { runBalanceSol: true, creatorRewardsSol: true }}),
  db.transaction.findMany({ where: { walletAddress: WALLET, tradeType: 'SELL' }, orderBy: { confirmedAt: 'desc' }, take: 5 }),
  db.coin.findUnique({ where: { id: COIN_ID }, select: { virtualSolReserves: true, virtualTokenReserves: true, realSolReserves: true, version: true }}),
  db.pendingTx.findMany({ where: { status: { in: ['PENDING','SUBMITTED','BUILDING','SIGNING'] }}, take: 10, select: { id: true, status: true, createdAt: true }})
]);

console.log('=== SELL VERIFICATION ===');
console.log('Holding tokenBalance (raw):', holding?.tokenBalance, '=', Number(holding?.tokenBalance || 0) / 1e6, 'tokens');
console.log('Profile runBalanceSol:', profile?.runBalanceSol?.toString());
console.log('Profile creatorRewardsSol:', profile?.creatorRewardsSol?.toString());
console.log('SELL tx count:', sellTxs.length);
if (sellTxs.length > 0) {
  const s = sellTxs[0];
  console.log('Latest SELL:', { sig: s.txSignature?.slice(0,16)+'...', sol: s.solAmount, tokens: s.tokenAmount, confirmedAt: s.confirmedAt });
}
console.log('Coin virtualSolReserves:', coin?.virtualSolReserves, 'version:', coin?.version);
console.log('Pending txs (non-final):', pendingTxs.length, pendingTxs.map(t => t.status));
await db.$disconnect();
