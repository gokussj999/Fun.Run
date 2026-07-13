import '../dist/load-env.js';
import { createDatabaseClient } from '@funrun/database';
import { resolveMnemonicEncryptionKey } from '@funrun/config';
import { loadWalletForSigning } from '../dist/wallet/profile-loader.js';

const wallet = process.argv[2] ?? '11111111111111111111111111111112';

const db = createDatabaseClient({ url: process.env.DATABASE_URL });
await db.$connect();

try {
  const key = resolveMnemonicEncryptionKey(process.env);
  const ctx = await loadWalletForSigning(db, wallet, key);
  console.log(JSON.stringify({
    ok: true,
    identityWallet: wallet,
    signingWallet: ctx.walletAddress,
    mnemonicReady: ctx.encryptedMnemonic.includes(':'),
    walletReady: ctx.walletAddress !== wallet,
  }, null, 2));
} catch (err) {
  console.error(JSON.stringify({
    ok: false,
    code: err?.code ?? err?.name,
    message: err?.message ?? String(err),
  }, null, 2));
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
