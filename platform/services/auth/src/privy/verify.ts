import type { AuthTokenClaims } from '@privy-io/server-auth';

import { UnauthorizedError } from '@funrun/shared';

import type { PrivyTokenClaims, PrivyLinkedAccount } from '../types.js';
import { getPrivyClient } from './client.js';

export interface PrivyVerifyResult {
  readonly claims: PrivyTokenClaims;
  readonly solanaWallet: string | null;
}

/**
 * Verify a Privy access token using Privy's official SDK.
 * Zero-trust: rejects expired, tampered, or wrong-app tokens.
 * Never implements custom JWT parsing — delegates entirely to Privy SDK.
 */
export async function verifyPrivyToken(rawToken: string): Promise<PrivyVerifyResult> {
  const privy = getPrivyClient();

  let claims: AuthTokenClaims;
  try {
    claims = await privy.verifyAuthToken(rawToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token verification failed';
    throw new UnauthorizedError(`Privy token invalid: ${message}`);
  }

  const tokenClaims: PrivyTokenClaims = {
    userId: claims.userId,
    appId: claims.appId,
    sessionId: claims.sessionId,
    issuedAt: claims.issuedAt,
    expiration: claims.expiration,
    linkedAccounts: (claims as unknown as { linkedAccounts?: PrivyLinkedAccount[] })
      .linkedAccounts ?? [],
  };

  // Extract the Solana embedded wallet address from linked accounts.
  // Priority order: embedded wallet > external Solana wallet
  const solanaWallet = extractSolanaWallet(tokenClaims.linkedAccounts ?? []);

  return { claims: tokenClaims, solanaWallet };
}

function extractSolanaWallet(accounts: PrivyLinkedAccount[]): string | null {
  // Prefer embedded Solana wallet (privy-managed)
  const embedded = accounts.find(
    (a) => a.type === 'wallet' && a.chainType === 'solana' && a.walletClientType === 'privy',
  );
  if (embedded?.address) return embedded.address;

  // Fall back to any linked Solana wallet
  const external = accounts.find(
    (a) => a.type === 'wallet' && a.chainType === 'solana',
  );
  return external?.address ?? null;
}

/**
 * Extract bearer token from Authorization header.
 * Returns null if header is absent or malformed.
 */
export function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) return null;
  const parts = authorizationHeader.trim().split(' ');
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer' || !parts[1]) {
    return null;
  }
  return parts[1];
}
