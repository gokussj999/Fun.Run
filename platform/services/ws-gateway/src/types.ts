// ─── Client → Server messages ─────────────────────────────────────────────────

export interface AuthMessage {
  readonly type:    'auth';
  readonly id:      string;
  readonly token:   string;
}

export interface SubscribeMessage {
  readonly type:    'subscribe';
  readonly id:      string;
  readonly channel: string;
  readonly fromSeq?: number; // replay from this sequence number on reconnect
}

export interface UnsubscribeMessage {
  readonly type:    'unsubscribe';
  readonly id:      string;
  readonly channel: string;
}

export interface PingMessage {
  readonly type:    'ping';
  readonly id:      string;
}

export type ClientMessage = AuthMessage | SubscribeMessage | UnsubscribeMessage | PingMessage;

// ─── Server → Client messages ─────────────────────────────────────────────────

export interface WelcomeMessage {
  readonly type:         'welcome';
  readonly connectionId: string;
  readonly serverTime:   number;
  readonly version:      string;
}

export interface AuthedMessage {
  readonly type:    'authed';
  readonly id:      string;
  readonly wallet:  string;
  readonly role:    string;
}

export interface SubscribedMessage {
  readonly type:    'subscribed';
  readonly id:      string;
  readonly channel: string;
  readonly seq:     number; // current head sequence for replay reference
}

export interface UnsubscribedMessage {
  readonly type:    'unsubscribed';
  readonly id:      string;
  readonly channel: string;
}

export interface PongMessage {
  readonly type:    'pong';
  readonly id:      string;
  readonly time:    number;
}

export interface EventMessage {
  readonly type:    'event';
  readonly channel: string;
  readonly seq:     number;   // monotonically increasing per channel
  readonly ts:      number;   // Unix milliseconds
  readonly event:   string;   // e.g. 'price_update', 'coin_created'
  readonly data:    Record<string, unknown>;
}

export interface ErrorMessage {
  readonly type:    'error';
  readonly id?:     string;   // echoed from request if applicable
  readonly code:    WsErrorCode;
  readonly message: string;
}

export type WsErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INVALID_CHANNEL'
  | 'INVALID_MESSAGE'
  | 'SUBSCRIPTION_LIMIT'
  | 'RATE_LIMITED'
  | 'CHANNEL_REQUIRES_AUTH'
  | 'INTERNAL_ERROR';

export type ServerMessage =
  | WelcomeMessage
  | AuthedMessage
  | SubscribedMessage
  | UnsubscribedMessage
  | PongMessage
  | EventMessage
  | ErrorMessage;

// ─── Channel definitions ──────────────────────────────────────────────────────

export type WsChannelKind =
  | 'market'
  | 'coin'
  | 'trades'
  | 'candles'
  | 'holders'
  | 'creator'
  | 'referral'
  | 'portfolio'
  | 'notifications'
  | 'graduation'
  | 'treasury'
  | 'admin';

export interface ParsedChannel {
  readonly kind:   WsChannelKind;
  readonly param?: string;  // mint / wallet / creator address
  readonly raw:    string;  // original channel string e.g. "coin:MINT123"
}

export type AuthRequirement = 'none' | 'authenticated' | 'own' | 'admin';

export interface ChannelDef {
  readonly kind:           WsChannelKind;
  readonly requiresAuth:   AuthRequirement;
  readonly hasParam:       boolean;
  readonly description:    string;
}

// ─── Connection state ─────────────────────────────────────────────────────────

export type UserRole = 'USER' | 'CREATOR' | 'VERIFIED_CREATOR' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';

export interface ClientConnection {
  readonly id:          string;
  readonly connectedAt: number;
  readonly ipAddress:   string;
  readonly userAgent:   string;
  // Mutable post-auth
  walletAddress:        string | null;
  role:                 UserRole | null;
  // Subscription tracking
  subscriptions:        Set<string>;   // channel raw strings
  // Heartbeat
  lastPingSentAt:       number;
  lastPongAt:           number;
  isAlive:              boolean;
  // Backpressure
  isSlowConsumer:       boolean;
  slowConsumerAt:       number | null;
  // Metrics
  messagesSent:         number;
  messagesReceived:     number;
  // Per-connection sequence counter (per channel)
  sentSeqs:             Map<string, number>;
}

// ─── Replay buffer entry ──────────────────────────────────────────────────────

export interface ReplayEntry {
  readonly seq:     number;
  readonly ts:      number;
  readonly event:   string;
  readonly data:    Record<string, unknown>;
}

// ─── Presence ────────────────────────────────────────────────────────────────

export interface PresenceRecord {
  readonly connectionId: string;
  readonly workerId:     string;
  readonly walletAddress: string | null;
  readonly connectedAt:  number;
}
