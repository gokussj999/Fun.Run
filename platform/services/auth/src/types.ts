// ─── Role hierarchy ───────────────────────────────────────────────────────────

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MODERATOR'
  | 'VERIFIED_CREATOR'
  | 'CREATOR'
  | 'USER'
  | 'INTERNAL_SERVICE';

// Numeric rank — higher = more privileged.
// Used for role comparison: hasAtLeastRole(actual, required)
export const ROLE_RANK: Record<UserRole, number> = {
  SUPER_ADMIN:      100,
  ADMIN:             80,
  MODERATOR:         60,
  VERIFIED_CREATOR:  40,
  CREATOR:           30,
  USER:              10,
  INTERNAL_SERVICE:   5,
} as const;

// ─── Permissions ──────────────────────────────────────────────────────────────

export type Permission =
  // Auth
  | 'auth:read_own_profile'
  | 'auth:list_own_sessions'
  | 'auth:revoke_own_session'
  | 'auth:list_any_session'
  | 'auth:revoke_any_session'
  | 'auth:manage_api_keys'
  | 'auth:read_any_profile'
  | 'auth:update_any_profile'
  | 'auth:ban_user'
  // Trading (future phases — declared here for RBAC completeness)
  | 'trade:buy'
  | 'trade:sell'
  | 'trade:read_history'
  // Coins
  | 'coin:create'
  | 'coin:read'
  | 'coin:update_own'
  // Admin
  | 'admin:view_dashboard'
  | 'admin:pause_protocol'
  | 'admin:update_config'
  | 'admin:sweep_treasury'
  | 'admin:manage_users'
  | 'admin:view_audit_logs'
  | 'admin:manage_roles'
  // Super admin
  | 'superadmin:all'
  // Internal services
  | 'service:call_internal_api';

// ─── Authenticated request context ───────────────────────────────────────────

export interface AuthenticatedUser {
  readonly userId: string;           // Privy user ID (did:privy:...)
  readonly walletAddress: string;    // Solana wallet (primary key in DB)
  readonly role: UserRole;
  readonly sessionId: string;        // Redis session ID
  readonly privySessionId: string;   // Privy's own session identifier
  readonly deviceId: string;         // fingerprinted device ID
  readonly ipAddress: string;
  readonly issuedAt: number;         // Unix epoch seconds
  readonly expiresAt: number;        // Unix epoch seconds
}

export interface ServiceIdentity {
  readonly serviceId: string;
  readonly serviceName: string;
  readonly role: 'INTERNAL_SERVICE';
  readonly isService: true;
}

export type RequestActor = AuthenticatedUser | ServiceIdentity;

// ─── Session ──────────────────────────────────────────────────────────────────

export interface Session {
  readonly sessionId: string;
  readonly userId: string;
  readonly walletAddress: string;
  readonly role: UserRole;
  readonly privySessionId: string;
  readonly deviceId: string;
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly createdAt: number;    // Unix ms
  readonly expiresAt: number;    // Unix ms
  readonly lastSeenAt: number;   // Unix ms
  readonly isRevoked: boolean;
}

export interface SessionCreateInput {
  readonly userId: string;
  readonly walletAddress: string;
  readonly role: UserRole;
  readonly privySessionId: string;
  readonly deviceId: string;
  readonly ipAddress: string;
  readonly userAgent: string;
}

// ─── Privy token claims ───────────────────────────────────────────────────────

export interface PrivyTokenClaims {
  readonly userId: string;           // did:privy:...
  readonly appId: string;
  readonly sessionId: string;
  readonly issuedAt: number;
  readonly expiration: number;
  readonly linkedAccounts?: PrivyLinkedAccount[];
}

export interface PrivyLinkedAccount {
  readonly type: string;
  readonly address?: string;         // Solana wallet address
  readonly chainType?: string;
  readonly walletClientType?: string;
  readonly verifiedAt?: number;
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

export interface ApiKey {
  readonly id: string;
  readonly name: string;
  readonly keyPrefix: string;       // first 8 chars — shown to user for identification
  readonly keyHash: string;         // SHA-256 hash — stored in DB
  readonly walletAddress: string;
  readonly role: UserRole;
  readonly permissions: Permission[];
  readonly createdAt: number;
  readonly expiresAt: number | null;
  readonly lastUsedAt: number | null;
  readonly isRevoked: boolean;
}

export interface ApiKeyCreateInput {
  readonly name: string;
  readonly walletAddress: string;
  readonly role: UserRole;
  readonly permissions: Permission[];
  readonly expiresIn?: number;       // seconds; null = never expires
}

export interface ApiKeyCreateResult {
  readonly id: string;
  readonly name: string;
  readonly key: string;              // full raw key — shown ONCE at creation
  readonly keyPrefix: string;
  readonly expiresAt: number | null;
}

// ─── Service auth ─────────────────────────────────────────────────────────────

export interface ServiceAuthHeader {
  readonly serviceId: string;
  readonly timestamp: string;        // ISO 8601
  readonly nonce: string;            // random 32-byte hex
  readonly signature: string;        // HMAC-SHA256(serviceId+timestamp+nonce+method+path+bodyHash)
}

// ─── Audit events ─────────────────────────────────────────────────────────────

export type AuditEventType =
  | 'AUTH_VERIFY_SUCCESS'
  | 'AUTH_VERIFY_FAILURE'
  | 'SESSION_CREATED'
  | 'SESSION_REVOKED'
  | 'SESSION_EXPIRED'
  | 'SESSION_LIST'
  | 'API_KEY_CREATED'
  | 'API_KEY_REVOKED'
  | 'API_KEY_USED'
  | 'ROLE_CHANGED'
  | 'USER_BANNED'
  | 'UNAUTHORIZED_ACCESS'
  | 'REPLAY_ATTACK_DETECTED'
  | 'SERVICE_AUTH_SUCCESS'
  | 'SERVICE_AUTH_FAILURE'
  | 'IP_ABUSE_DETECTED';

export interface AuditEvent {
  readonly eventType: AuditEventType;
  readonly actorId: string | null;         // userId or serviceId
  readonly actorRole: UserRole | null;
  readonly targetId: string | null;         // affected userId or resourceId
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly sessionId: string | null;
  readonly outcome: 'SUCCESS' | 'FAILURE';
  readonly details: Record<string, unknown>;
  readonly timestamp: string;              // ISO 8601
}

// ─── Fastify augmentation ─────────────────────────────────────────────────────

declare module 'fastify' {
  interface FastifyRequest {
    actor?: RequestActor;
    sessionId?: string;
    deviceId?: string;
  }
}
