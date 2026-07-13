import type { PrivyClient } from '@privy-io/server-auth';
import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';
import { extractSolanaWallet } from '@funrun/shared';
import type { IpGuard } from './ip-guard.js';
import type { AuthContext } from '../types.js';
import { RedisDependencyError } from '../config/redis-dependency.js';

const TRADEABLE_ROLES = new Set([
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

export class TradingAuthVerifier {
  constructor(
    private readonly privy: PrivyClient,
    private readonly db: PrismaClient,
    private readonly ipGuard: IpGuard,
    private readonly logger: Logger,
  ) {}

  async verify(token: string, ip: string): Promise<AuthContext | null> {
    try {
      if (await this.ipGuard.isBlocked(ip)) {
        this.logger.warn({ ip }, 'TradingAuth: IP is blocked');
        return null;
      }
    } catch (err) {
      if (err instanceof RedisDependencyError) throw err;
      throw err;
    }

    try {
      const claims = await this.privy.verifyAuthToken(token);

      let linkedAccounts = (
        claims as unknown as { linkedAccounts?: LinkedAccount[] }
      ).linkedAccounts ?? [];

      let walletAddress = extractSolanaWallet(linkedAccounts);
      if (!walletAddress) {
        const user = await this.privy.getUser(claims.userId);
        linkedAccounts = (user.linkedAccounts ?? []) as LinkedAccount[];
        walletAddress = extractSolanaWallet(linkedAccounts);
      }
      if (!walletAddress) {
        this.logger.warn({ userId: claims.userId }, 'TradingAuth: no Solana wallet linked');
        await this.ipGuard.recordFailure(ip);
        return null;
      }

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

      if (profile.isBanned) {
        this.logger.warn({ walletAddress }, 'TradingAuth: account suspended');
        return null;
      }

      if (!TRADEABLE_ROLES.has(profile.role)) {
        this.logger.warn({ walletAddress, role: profile.role }, 'TradingAuth: role not permitted to trade');
        return null;
      }

      await this.ipGuard.clearFailures(ip);

      return {
        walletAddress: profile.walletAddress,
        privyUserId: claims.userId,
        role: profile.role,
        ipAddress: ip,
      };
    } catch (err) {
      if (err instanceof RedisDependencyError) throw err;
      this.logger.warn({ err, ip }, 'TradingAuth: verification failed');
      await this.ipGuard.recordFailure(ip);
      return null;
    }
  }
}
