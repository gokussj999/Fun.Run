import { PublicKey } from '@solana/web3.js';
import type { PrismaClient } from '@funrun/database';

function isValidSolanaWallet(wallet: string): boolean {
  try {
    // PublicKey constructor validates base58 length/checksum.
    void new PublicKey(wallet);
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet);
  } catch {
    return false;
  }
}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === 'object'
    && err !== null
    && 'code' in err
    && (err as { code: string }).code === 'P2002'
  );
}

/**
 * Ensure a profile row exists for a Privy-linked Solana wallet on first read.
 * Legacy backend created profiles on GET /profile; platform only upserted on auth-gated trades.
 */
export async function ensureProfileBootstrap(
  db: PrismaClient,
  walletAddress: string,
) {
  const wallet = walletAddress.trim();
  if (!isValidSolanaWallet(wallet)) return null;

  const existing = await db.profile.findUnique({ where: { walletAddress: wallet } });
  if (existing) return existing;

  try {
    return await db.profile.create({
      data: {
        walletAddress: wallet,
        // Placeholder until an authenticated request links the real Privy user id.
        privyUserId: `bootstrap:${wallet}`,
        role: 'USER',
      },
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return db.profile.findUnique({ where: { walletAddress: wallet } });
    }
    throw err;
  }
}
