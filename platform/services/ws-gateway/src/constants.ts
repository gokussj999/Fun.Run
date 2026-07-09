import type { ChannelDef, WsChannelKind } from './types.js';

// ─── Server tuning ────────────────────────────────────────────────────────────

export const WS_PORT               = parseInt(process.env['WS_PORT'] ?? '3001', 10);
export const HTTP_PORT             = parseInt(process.env['HTTP_PORT'] ?? '3002', 10);
export const WORKER_ID             = process.env['WORKER_ID'] ?? `wsg-${process.pid}`;
export const GATEWAY_VERSION       = '1.0.0';

// ─── Connection limits ────────────────────────────────────────────────────────

export const MAX_SUBSCRIPTIONS_PER_CONNECTION = 50;
export const MAX_CONNECTIONS_PER_IP           = 20;   // concurrent connections per IP
export const MAX_MESSAGE_SIZE_BYTES           = 65_536; // 64KB inbound max

// ─── Heartbeat ────────────────────────────────────────────────────────────────

export const HEARTBEAT_INTERVAL_MS = 30_000; // send ping every 30s
export const HEARTBEAT_TIMEOUT_MS  = 60_000; // disconnect if no pong in 60s

// ─── Backpressure ─────────────────────────────────────────────────────────────

// ws.bufferedAmount threshold — mark as slow consumer above this
export const SLOW_CONSUMER_THRESHOLD_BYTES  = 512_000;  // 512KB
// Disconnect if slow consumer persists longer than this
export const SLOW_CONSUMER_GRACE_MS         = 10_000;   // 10 seconds

// ─── Rate limiting ────────────────────────────────────────────────────────────

export const RATE_LIMIT_MESSAGES_PER_SECOND = 20;       // inbound messages/s per connection
export const RATE_LIMIT_WINDOW_MS           = 1_000;

// ─── Replay buffer ────────────────────────────────────────────────────────────

export const REPLAY_BUFFER_SIZE             = 1000;     // events per channel
export const REPLAY_TTL_SECONDS             = 300;      // 5 minutes

// ─── Presence ────────────────────────────────────────────────────────────────

export const PRESENCE_TTL_SECONDS           = 45;       // Redis key TTL
export const PRESENCE_RENEWAL_MS            = 15_000;   // renew every 15s

// ─── Redis key namespace ─────────────────────────────────────────────────────

export const RK = {
  seq:         (channel: string) => `wsg:seq:${channel}`,
  replay:      (channel: string) => `wsg:replay:${channel}`,
  presence:    (connId: string)  => `wsg:presence:${connId}`,
  chanCount:   (channel: string) => `wsg:chcount:${channel}`,
  ipConnCount: (ip: string)      => `wsg:ipconn:${ip}`,
} as const;

// ─── Channel definitions ──────────────────────────────────────────────────────

export const CHANNEL_DEFS: Record<WsChannelKind, ChannelDef> = {
  market:     { kind: 'market',     requiresAuth: 'none',          hasParam: false, description: 'Global market feed: all trades + coin creations + graduations' },
  coin:       { kind: 'coin',       requiresAuth: 'none',          hasParam: true,  description: 'Price + reserve updates for a specific coin' },
  trades:     { kind: 'trades',     requiresAuth: 'none',          hasParam: true,  description: 'Trade events (buy/sell) for a specific coin' },
  candles:    { kind: 'candles',    requiresAuth: 'none',          hasParam: true,  description: 'OHLCV candle updates for a specific coin' },
  holders:    { kind: 'holders',    requiresAuth: 'none',          hasParam: true,  description: 'Holder balance changes for a specific coin' },
  creator:    { kind: 'creator',    requiresAuth: 'own',           hasParam: true,  description: 'Creator fee and stats for own coin (creator or admin)' },
  referral:   { kind: 'referral',   requiresAuth: 'own',           hasParam: true,  description: 'Referral fee events for own wallet (referrer or admin)' },
  portfolio:  { kind: 'portfolio',  requiresAuth: 'own',           hasParam: true,  description: 'Portfolio updates (holdings, P&L) for own wallet' },
  graduation: { kind: 'graduation', requiresAuth: 'none',          hasParam: false, description: 'All graduation events platform-wide' },
  treasury:   { kind: 'treasury',   requiresAuth: 'admin',         hasParam: false, description: 'Treasury sweep and fee events (admin only)' },
  admin:      { kind: 'admin',      requiresAuth: 'admin',         hasParam: false, description: 'Admin actions, indexer events, platform metrics' },
};

// ─── Redis pub/sub channel → WS channel mapping ───────────────────────────────
// Maps incoming Redis pub/sub channels to the WS gateway channel(s) they feed.

export const REDIS_TO_WS_CHANNEL: ReadonlyMap<string, string[]> = new Map([
  // Static system channels → always subscribed
  ['events:all_trades',      ['market', 'trades']],
  ['events:all_graduations', ['market', 'graduation']],
  ['events:coin_created',    ['market']],
  ['events:treasury_sweep',  ['treasury']],
  ['events:admin_action',    ['admin']],
  ['events:indexer',         ['admin']],
]);

// Dynamic per-mint channels — these are subscribed on demand
export function redisPriceChannel(mint: string): string { return `price:${mint}`; }
export function redisGraduationChannel(mint: string): string { return `graduation:${mint}`; }

// WS channel string → Redis pub/sub channels it needs
export function wsChannelToRedisChannels(wsChannel: string): string[] {
  if (wsChannel === 'market')     return ['events:all_trades', 'events:all_graduations', 'events:coin_created'];
  if (wsChannel === 'graduation') return ['events:all_graduations'];
  if (wsChannel === 'treasury')   return ['events:treasury_sweep'];
  if (wsChannel === 'admin')      return ['events:admin_action', 'events:indexer'];

  const [kind, param] = wsChannel.split(':');
  if (!kind || !param) return [];

  switch (kind) {
    case 'coin':      return [redisPriceChannel(param)];
    case 'trades':    return [redisPriceChannel(param)];
    case 'candles':   return [redisPriceChannel(param)];
    case 'holders':   return [redisPriceChannel(param)];
    case 'creator':   return [`events:creator:${param}`];
    case 'referral':  return [`events:referral:${param}`];
    case 'portfolio': return [`events:portfolio:${param}`];
    default:          return [];
  }
}
