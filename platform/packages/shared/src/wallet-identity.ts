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
 *
 * Check mnemonicTag first — a custodial wallet is tagged on the identity profile row.
 * Only fall back to direct walletAddress lookup when no mnemonicTag match exists (i.e.
 * the incoming address is itself an identity wallet, not a custodial one).  This order
 * prevents "ghost" profile rows created at the custodial address from shadowing the real
 * identity→custodial mapping.
 */
export async function resolveIdentityWallet(
  db: ProfileLookupDb,
  chainWallet: string,
): Promise<string> {
  const w = chainWallet.trim();
  if (!w) return w;

  // 1. mnemonicTag lookup — finds identity wallet when chainWallet is custodial
  const linked = await db.profile.findFirst({
    where: { mnemonicTag: w },
    select: { walletAddress: true },
  });
  if (linked) return linked.walletAddress;

  // 2. Direct lookup — chainWallet is already an identity wallet (no custodial involved)
  const direct = await db.profile.findUnique({
    where: { walletAddress: w },
    select: { walletAddress: true },
  });
  return direct?.walletAddress ?? w;
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
