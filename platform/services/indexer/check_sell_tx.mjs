import { Connection } from '@solana/web3.js';

const conn = new Connection('https://devnet.helius-rpc.com/?api-key=0cc238eb-3539-46ef-9d15-fa98533806b8', 'confirmed');

// Check the two recent FINALIZED pending_txs
const sigs = ['4XPe8xZwd1V7oE9vsv7x2MdmfLUVqUhKb7uPPYtPaTX', '4RyzukBHfNfwJjBRX5mHvTPFVeJFPkSnzf8DkNJf8oiV'];

for (const sig of sigs) {
  try {
    const tx = await conn.getParsedTransaction(sig, { maxSupportedTransactionVersion: 0 });
    if (!tx) { console.log(sig.slice(0,16), '→ NOT FOUND on chain'); continue; }
    const programs = tx.transaction.message.accountKeys
      .filter(k => k.signer === false && k.writable === false)
      .map(k => k.pubkey.toBase58());
    const logs = tx.meta?.logMessages || [];
    const hasAnchor = logs.some(l => l.includes('HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP'));
    const hasSell = logs.some(l => l.includes('sell') || l.includes('Sell') || l.includes('TokensSold'));
    const err = tx.meta?.err;
    console.log(sig.slice(0,16), '→ err:', err, '| anchor:', hasAnchor, '| hasSell:', hasSell);
    if (hasAnchor || hasSell) {
      console.log('  logs:', logs.filter(l => l.includes('Program') || l.includes('sell') || l.includes('Sell')).slice(0,5));
    }
  } catch (e) {
    console.log(sig.slice(0,16), '→ ERROR:', e.message);
  }
}
