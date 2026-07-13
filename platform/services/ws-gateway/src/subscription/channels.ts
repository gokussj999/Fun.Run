import { CHANNEL_DEFS } from '../constants.js';
import type { ParsedChannel, WsChannelKind } from '../types.js';

const PARAM_KINDS = new Set<WsChannelKind>([
  'coin', 'trades', 'candles', 'holders', 'creator', 'referral', 'portfolio', 'notifications',
]);

const NO_PARAM_KINDS = new Set<WsChannelKind>([
  'market', 'graduation', 'treasury', 'admin',
]);

// Solana pubkey: base58, 32-44 chars
const PUBKEY_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * Parse and validate a raw channel string from a client.
 * Returns null if the channel is malformed or unknown.
 */
export function parseChannel(raw: string): ParsedChannel | null {
  if (!raw || raw.length > 128) return null;

  // No-param channels: exact match
  if (NO_PARAM_KINDS.has(raw as WsChannelKind)) {
    return { kind: raw as WsChannelKind, raw };
  }

  // Param channels: "kind:param"
  const colon = raw.indexOf(':');
  if (colon === -1) return null;

  const kind = raw.slice(0, colon) as WsChannelKind;
  const param = raw.slice(colon + 1);

  if (!PARAM_KINDS.has(kind)) return null;
  if (!PUBKEY_RE.test(param)) return null;

  return { kind, param, raw };
}

/**
 * Return the channel definition for a parsed channel.
 * Guaranteed to exist since parseChannel already validated the kind.
 */
export function getChannelDef(parsed: ParsedChannel) {
  return CHANNEL_DEFS[parsed.kind];
}

/**
 * Build the canonical channel string from kind + optional param.
 */
export function buildChannel(kind: WsChannelKind, param?: string): string {
  return param ? `${kind}:${param}` : kind;
}
