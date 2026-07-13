import { PrismaClient } from '@funrun/database';
const db = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_kpabG4z1UXRE@ep-red-queen-a11v85bz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&schema=funrun_platform' }}});

// Check holding wallet and coin
const holding = await db.holding.findFirst({
  where: { tokenBalance: { gt: 0 }},
  include: { coin: { select: { id: true, name: true, symbol: true, mintAddress: true, virtualSolReserves: true, virtualTokenReserves: true, status: true }}}
});
console.log('=== HOLDING ===');
console.log(JSON.stringify(holding, null, 2));

// Check profile for that wallet
if (holding) {
  const profile = await db.profile.findUnique({
    where: { walletAddress: holding.walletAddress },
    select: { walletAddress: true, runBalanceSol: true, creatorRewardsSol: true, referralRewardsSol: true, encryptedMnemonic: true }
  });
  console.log('\n=== PROFILE ===');
  console.log({
    walletAddress: profile?.walletAddress?.slice(0, 12) + '...',
    runBalanceSol: profile?.runBalanceSol?.toString(),
    creatorRewardsSol: profile?.creatorRewardsSol?.toString(),
    hasMnemonic: !!profile?.encryptedMnemonic
  });

  // Also find the identity wallet that maps to this custodial wallet
  const linked = await db.profile.findFirst({
    where: { mnemonicTag: { not: null }},
    select: { walletAddress: true, mnemonicTag: true }
  });
  console.log('\n=== LINKED PROFILE (mnemonicTag set) ===');
  if (linked) console.log({ wallet: linked.walletAddress.slice(0,12)+'...', tag: linked.mnemonicTag });
  else console.log('none');
}

await db.$disconnect();
