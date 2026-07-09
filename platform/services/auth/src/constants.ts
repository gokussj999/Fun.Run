// ─── Session ──────────────────────────────────────────────────────────────────

export const SESSION_TTL_SECONDS = 15 * 60;          // 15 minutes (access)
export const SESSION_IDLE_EXTENSION_SECONDS = 5 * 60; // extend if seen in last 5 min
export const SESSION_MAX_CONCURRENT = 5;              // max sessions per user

// ─── Internal JWT ─────────────────────────────────────────────────────────────

export const INTERNAL_JWT_ALG = 'HS256';
export const INTERNAL_JWT_ACCESS_TTL_S = 900;          // 15 min
export const INTERNAL_JWT_SERVICE_TTL_S = 3600;        // 1 hour for service tokens

// ─── API Keys ─────────────────────────────────────────────────────────────────

export const API_KEY_PREFIX_BYTES = 4;                 // 8 hex chars shown to user
export const API_KEY_TOTAL_BYTES = 32;                 // 64 hex chars (full key)
export const API_KEY_HASH_ALG = 'sha256';
export const API_KEY_MAX_PER_USER = 10;

// ─── Service auth ─────────────────────────────────────────────────────────────

export const SERVICE_HMAC_ALG = 'sha256';
export const SERVICE_NONCE_BYTES = 32;
export const SERVICE_TIMESTAMP_TOLERANCE_MS = 30_000;  // ±30 seconds
export const SERVICE_NONCE_TTL_SECONDS = 120;           // must be > tolerance

// ─── Replay protection ────────────────────────────────────────────────────────

export const NONCE_TTL_SECONDS = 120;
export const NONCE_MAX_LENGTH = 64;

// ─── Redis key prefixes ───────────────────────────────────────────────────────

export const REDIS_KEYS_AUTH = {
  session: (id: string) => `auth:session:${id}`,
  userSessions: (walletAddress: string) => `auth:user_sessions:${walletAddress}`,
  nonce: (nonce: string) => `auth:nonce:${nonce}`,
  ipAttempts: (ip: string) => `auth:ip_attempts:${ip}`,
  privySession: (privySessionId: string) => `auth:privy_session:${privySessionId}`,
  apiKey: (prefix: string) => `auth:api_key_prefix:${prefix}`,
  serviceNonce: (nonce: string) => `auth:svc_nonce:${nonce}`,
} as const;

// ─── HTTP header names ────────────────────────────────────────────────────────

export const HEADERS = {
  AUTHORIZATION: 'authorization',
  X_SERVICE_ID: 'x-service-id',
  X_SERVICE_TIMESTAMP: 'x-service-timestamp',
  X_SERVICE_NONCE: 'x-service-nonce',
  X_SERVICE_SIGNATURE: 'x-service-signature',
  X_DEVICE_ID: 'x-device-id',
  X_REQUEST_ID: 'x-request-id',
  X_FORWARDED_FOR: 'x-forwarded-for',
} as const;

// ─── IP abuse ─────────────────────────────────────────────────────────────────

export const IP_ABUSE_THRESHOLD = 50;         // failed auth attempts in window
export const IP_ABUSE_WINDOW_SECONDS = 300;   // 5 minute window
export const IP_ABUSE_BLOCK_SECONDS = 1800;   // 30 minute block
