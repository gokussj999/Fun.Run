/**
 * Shared HTTP auth helpers — used by Auth and Trading services.
 * Keeps bearer extraction, client IP resolution, and wallet parsing aligned.
 */

export interface PrivyLinkedAccountLike {
  type: string;
  chainType?: string;
  walletClientType?: string;
  address?: string;
}

/** Extract bearer token from Authorization header. Returns null if absent or malformed. */
export function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) return null;
  const parts = authorizationHeader.trim().split(' ');
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer' || !parts[1]) {
    return null;
  }
  return parts[1];
}

/**
 * Resolve the real client IP behind a reverse proxy.
 * Fastify's trustProxy:true populates request.ip from X-Forwarded-For automatically.
 */
export function extractIp(request: {
  ip: string;
  headers: Record<string, string | string[] | undefined>;
}): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() ?? request.ip;
  }
  return request.ip;
}

/**
 * Extract the Solana wallet from Privy linked accounts.
 * Priority: embedded Privy wallet → externally linked Solana wallet → null.
 */
export function extractSolanaWallet(accounts: PrivyLinkedAccountLike[]): string | null {
  const embedded = accounts.find(
    (a) => a.type === 'wallet' && a.chainType === 'solana' && a.walletClientType === 'privy',
  );
  if (embedded?.address) return embedded.address;

  const external = accounts.find(
    (a) => a.type === 'wallet' && a.chainType === 'solana',
  );
  return external?.address ?? null;
}
