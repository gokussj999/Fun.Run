import { PrismaClient } from '@funrun/database';

const db = new PrismaClient({
  datasources: { db: { url: 'postgresql://neondb_owner:npg_kpabG4z1UXRE@ep-red-queen-a11v85bz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&schema=funrun_platform' } }
});

const profiles = await db.profile.findMany({
  select: { walletAddress: true, runBalanceSol: true, creatorRewardsSol: true, referralRewardsSol: true }
});
console.log('=== PROFILES ===');
profiles.forEach(p => {
  console.log(`wallet: ${p.walletAddress.slice(0,8)}... runBal: ${p.runBalanceSol} creatorRew: ${p.creatorRewardsSol}`);
});

// Check if Deposit/Withdrawal tables exist
try {
  const deps = await db.deposit.count();
  console.log('\nDeposit table: EXISTS, count=', deps);
} catch (e) {
  console.log('\nDeposit table: ERROR -', e.message.split('\n')[0]);
}

try {
  const wds = await db.withdrawal.count();
  console.log('Withdrawal table: EXISTS, count=', wds);
} catch (e) {
  console.log('Withdrawal table: ERROR -', e.message.split('\n')[0]);
}

await db.$disconnect();
