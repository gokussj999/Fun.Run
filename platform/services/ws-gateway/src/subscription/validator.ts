import type { ClientConnection, ParsedChannel } from '../types.js';
import { getChannelDef } from './channels.js';

export type ValidationResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

/**
 * Validate whether a connection is allowed to subscribe to a channel.
 *
 * Auth requirement levels:
 *  - 'none'          → anyone can subscribe (including unauthenticated)
 *  - 'authenticated' → must be logged in (any role)
 *  - 'own'           → must be logged in AND the channel param matches their wallet
 *  - 'admin'         → must have ADMIN or SUPER_ADMIN role
 */
export function validateSubscription(
  conn: ClientConnection,
  parsed: ParsedChannel,
): ValidationResult {
  const def = getChannelDef(parsed);

  switch (def.requiresAuth) {
    case 'none':
      return { ok: true };

    case 'authenticated':
      if (!conn.walletAddress) {
        return { ok: false, code: 'CHANNEL_REQUIRES_AUTH', message: `Channel '${parsed.raw}' requires authentication` };
      }
      return { ok: true };

    case 'own':
      if (!conn.walletAddress) {
        return { ok: false, code: 'CHANNEL_REQUIRES_AUTH', message: `Channel '${parsed.raw}' requires authentication` };
      }
      // Admin can subscribe to any 'own' channel
      if (conn.role === 'ADMIN' || conn.role === 'SUPER_ADMIN') {
        return { ok: true };
      }
      // Regular users: param must match their wallet
      if (parsed.param !== conn.walletAddress) {
        return { ok: false, code: 'FORBIDDEN', message: `You can only subscribe to your own ${parsed.kind} channel` };
      }
      return { ok: true };

    case 'admin':
      if (!conn.walletAddress) {
        return { ok: false, code: 'CHANNEL_REQUIRES_AUTH', message: `Channel '${parsed.raw}' requires authentication` };
      }
      if (conn.role !== 'ADMIN' && conn.role !== 'SUPER_ADMIN') {
        return { ok: false, code: 'FORBIDDEN', message: `Channel '${parsed.raw}' is restricted to administrators` };
      }
      return { ok: true };
  }
}
