import type { AuthTokenClaims } from '@privy-io/server-auth';

import { UnauthorizedError, extractBearerToken, extractSolanaWallet } from '@funrun/shared';

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

  // Access tokens from verifyAuthToken do not embed linked accounts — fetch user profile.
  let linkedAccounts: PrivyLinkedAccount[] = tokenClaims.linkedAccounts ?? [];
  let solanaWallet = extractSolanaWallet(linkedAccounts);
  if (!solanaWallet) {
    const user = await privy.getUser(claims.userId);
    linkedAccounts = (user.linkedAccounts ?? []) as unknown as PrivyLinkedAccount[];
    solanaWallet = extractSolanaWallet(linkedAccounts);
  }

  return {
    claims: {
      ...tokenClaims,
      linkedAccounts,
    },
    solanaWallet,
  };
}

export { extractBearerToken } from '@funrun/shared';
