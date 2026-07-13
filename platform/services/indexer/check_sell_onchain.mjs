import { PrismaClient } from '@funrun/database';
import { Connection } from '@solana/web3.js';

const db = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_kpabG4z1UXRE@ep-red-queen-a11v85bz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&schema=funrun_platform' }}});
const conn = new Connection('https://devnet.helius-rpc.com/?api-key=0cc238eb-3539-46ef-9d15-fa98533806b8', 'confirmed');

// Get full signatures of recent FINALIZED txs
const recent = await db.pendingTx.findMany({
  where: { status: 'FINALIZED', createdAt: { gte: new Date('2026-07-13T09:00:00Z') }},
  orderBy: { createdAt: 'desc' }, take: 5,
  select: { id: true, signature: true, createdAt: true }
});

console.log('=== RECENT FINALIZED TXS (full sigs) ===');
for (const t of recent) {
  console.log('sig:', t.signature, 'at:', t.createdAt);
  if (!t.signature) { console.log('  NO SIGNATURE'); continue; }
  try {
    const tx = await conn.getParsedTransaction(t.signature, { maxSupportedTransactionVersion: 0 });
    if (!tx) { console.log('  NOT FOUND on chain'); continue; }
    const logs = tx.meta?.logMessages || [];
    const hasAnchor = logs.some(l => l.includes('HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP'));
    const hasSell = logs.some(l => l.toLowerCase().includes('sell'));
    const hasBuy  = logs.some(l => l.toLowerCase().includes('buy') || l.includes('TokensPurchased'));
    console.log('  err:', tx.meta?.err, '| anchor:', hasAnchor, '| hasSell:', hasSell, '| hasBuy:', hasBuy);
    if (logs.length) console.log('  first logs:', logs.slice(0,4));
  } catch (e) {
    console.log('  RPC error:', e.message);
  }
}

await db.$disconnect();
