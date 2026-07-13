/** Minimal Prisma-shaped client for identity resolution. */
export interface ProfileLookupDb {
  profile: {
    findUnique(args: {
      where: { walletAddress: string };
      select: { walletAddress: true };
    }): Promise<{ walletAddress: string } | null>;
    findFirst(args: {
      where: { mnemonicTag: string };
      select: { walletAddress: true };
    }): Promise<{ walletAddress: string } | null>;
  };
}

/**
 * Map an on-chain wallet (usually custodial) to the Privy identity wallet stored in profiles.
 */
export async function resolveIdentityWallet(
  db: ProfileLookupDb,
  chainWallet: string,
): Promise<string> {
  const w = chainWallet.trim();
  if (!w) return w;

  const direct = await db.profile.findUnique({
    where: { walletAddress: w },
    select: { walletAddress: true },
  });
  if (direct) return direct.walletAddress;

  const linked = await db.profile.findFirst({
    where: { mnemonicTag: w },
    select: { walletAddress: true },
  });
  return linked?.walletAddress ?? w;
}

/** Wallet addresses to query for portfolio / creations (identity + custodial). */
export function profileWalletScope(
  identityWallet: string,
  custodialWallet: string | null,
): string[] {
  const ids = [identityWallet.trim()];
  const c = custodialWallet?.trim();
  if (c && c !== ids[0]) ids.push(c);
  return ids;
}
