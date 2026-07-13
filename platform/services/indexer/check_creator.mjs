import { PrismaClient } from '@funrun/database';
const db = new PrismaClient();

const creatorWallet = 'kCzahAz2cTbvR5ujnG39HF1gYtseCxqmFKs97VJWqYY';

const profile = await db.profile.findUnique({
  where: { walletAddress: creatorWallet },
  select: { walletAddress: true, creatorRewardsSol: true, referralRewardsSol: true, runBalanceSol: true, ownerRewardsSol: true }
});
console.log('Creator profile:', JSON.stringify(profile, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));

await db.$disconnect();
