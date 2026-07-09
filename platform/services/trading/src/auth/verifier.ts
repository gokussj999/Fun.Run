import type { PrivyClient } from '@privy-io/server-auth';
import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';
import type { IpGuard } from './ip-guard.js';
import type { AuthContext } from '../types.js';

// Roles that may execute trades.  INTERNAL_SERVICE accounts are machine
// identities and must never submit user-facing trades.
const TRADEABLE_ROLES = new Set([
  'SUPER_ADMIN',
  'ADMIN',
  'MODERATOR',
  'VERIFIED_CREATOR',
  'CREATOR',
  'USER',
]);

interface LinkedAccount {
  type: string;
  chainType?: string;
  walletClientType?: string;
  address?: string;
}

// Aligned with Auth Service (services/auth/src/privy/verify.ts extractSolanaWallet).
// Priority: embedded Privy wallet → externally linked Solana wallet → null.
function extractSolanaWallet(accounts: LinkedAccount[]): string | null {
  const embedded = accounts.find(
    (a) => a.type === 'wallet' && a.chainType === 'solana' && a.walletClientType === 'privy',
  );
  if (embedded?.address) return embedded.address;

  const external = accounts.find(
    (a) => a.type === 'wallet' && a.chainType === 'solana',
  );
  return external?.address ?? null;
}

/**
 * Verifies Privy bearer tokens for the Trading Service.
 *
 * Aligned with Auth Service authentication patterns:
 *   1. Same Privy SDK verification (zero-trust, no custom JWT parsing)
 *   2. Same Solana wallet extraction priority (embedded > external)
 *   3. Same profile DB pattern (walletAddress primary key, upsert on auth)
 *   4. Same IP abuse state (shared Redis keys with Auth Service)
 *
 * The trading service does not manage sessions — that is the Auth Service's
 * responsibility.  We only need the stable walletAddress + role for trade
 * authorization and audit logging.
 */
export class TradingAuthVerifier {
  constructor(
    private readonly privy: PrivyClient,
    private readonly db: PrismaClient,
    private readonly ipGuard: IpGuard,
    private readonly logger: Logger,
  ) {}

  async verify(token: string, ip: string): Promise<AuthContext | null> {
    // ── 1. IP block check (shared state with Auth Service) ──────────────────────
    if (await this.ipGuard.isBlocked(ip)) {
      this.logger.warn({ ip }, 'TradingAuth: IP is blocked');
      return null;
    }

    try {
      // ── 2. Privy token verification ───────────────────────────────────────────
      // Delegates entirely to the official Privy SDK — no custom crypto.
      const claims = await this.privy.verifyAuthToken(token);

      // ── 3. Solana wallet extraction ───────────────────────────────────────────
      const linkedAccounts = (
        claims as unknown as { linkedAccounts?: LinkedAccount[] }
      ).linkedAccounts ?? [];

      const walletAddress = extractSolanaWallet(linkedAccounts);
      if (!walletAddress) {
        this.logger.warn({ userId: claims.userId }, 'TradingAuth: no Solana wallet linked');
        await this.ipGuard.recordFailure(ip);
        return null;
      }

      // ── 4. Profile upsert ─────────────────────────────────────────────────────
      // walletAddress is the primary key (aligned with Auth Service).
      // Upsert auto-creates the profile on first trade and updates lastSeenAt,
      // keeping the profile table consistent with what Auth Service would write.
      const profile = await this.db.profile.upsert({
        where: { walletAddress },
        create: {
          walletAddress,
          privyUserId: claims.userId,
          role: 'USER',
        },
        update: {
          lastSeenAt: new Date(),
        },
        select: {
          walletAddress: true,
          role: true,
          isBanned: true,
        },
      });

      // ── 5. Account status checks ──────────────────────────────────────────────
      if (profile.isBanned) {
        this.logger.warn({ walletAddress }, 'TradingAuth: account suspended');
        return null;
      }

      if (!TRADEABLE_ROLES.has(profile.role)) {
        this.logger.warn({ walletAddress, role: profile.role }, 'TradingAuth: role not permitted to trade');
        return null;
      }

      // ── 6. Success — clear IP failure counter (aligned with Auth Service) ─────
      await this.ipGuard.clearFailures(ip);

      return {
        walletAddress: profile.walletAddress,
        privyUserId: claims.userId,
        role: profile.role,
        ipAddress: ip,
      };
    } catch (err) {
      this.logger.warn({ err, ip }, 'TradingAuth: verification failed');
      await this.ipGuard.recordFailure(ip);
      return null;
    }
  }
}
