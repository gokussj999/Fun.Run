import type { IncomingMessage } from 'node:http';
import { URL } from 'node:url';

export interface WsAuthResult {
  walletAddress: string;
  privyUserId:   string;
  role:          string;
}

/**
 * Extract and verify a Privy auth token from the WebSocket upgrade request.
 *
 * Supported locations (in priority order):
 *  1. Query parameter: ?token=Bearer%20<token>  or  ?token=<token>
 *  2. Sec-WebSocket-Protocol header (browser workaround for custom headers)
 *
 * We re-use the same PrivyClient from Phase 8.2 Auth Service.
 * The verifyPrivyToken function is imported from the auth service's privy module.
 */
export async function extractTokenFromRequest(
  req: IncomingMessage,
): Promise<string | null> {
  // 1. Query param
  const fullUrl = `http://localhost${req.url ?? ''}`;
  try {
    const url = new URL(fullUrl);
    const token = url.searchParams.get('token');
    if (token) return token.replace(/^Bearer\s+/i, '');
  } catch { /* malformed URL */ }

  // 2. Authorization header (set during HTTP upgrade by non-browser clients)
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // 3. Sec-WebSocket-Protocol header — browser workaround
  // Client sends "Authorization, Bearer.<token>" as a protocol
  const proto = req.headers['sec-websocket-protocol'];
  if (proto && proto.includes('Authorization')) {
    const parts = proto.split(',').map((p) => p.trim());
    const bearerPart = parts.find((p) => p.startsWith('Bearer.'));
    if (bearerPart) return bearerPart.slice('Bearer.'.length).replace(/\./g, ' ');
  }

  return null;
}

/**
 * Verify a raw token string using the Privy SDK.
 * Returns the verified claims or null on failure.
 *
 * The actual PrivyClient instance is injected from the container to avoid
 * re-instantiating on every connection.
 */
export async function verifyWsToken(
  token: string,
  verifier: (token: string) => Promise<{ userId: string; walletAddress?: string } | null>,
): Promise<WsAuthResult | null> {
  try {
    const claims = await verifier(token);
    if (!claims) return null;
    return {
      walletAddress: claims.walletAddress ?? '',
      privyUserId:   claims.userId,
      role:          'USER', // default; actual role fetched from DB in connection manager
    };
  } catch {
    return null;
  }
}
