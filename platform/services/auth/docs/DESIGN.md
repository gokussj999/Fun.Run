# Fun.Run V2 — Auth Service Design

## 1. Middleware Flow

```
Incoming HTTP Request
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│  1. Request ID Plugin                                          │
│     Attach / generate x-request-id                            │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────────┐
│  2. Service Auth Plugin   (X-Service-ID header present?)       │
│     YES → HMAC verify → attach ServiceIdentity → SKIP user auth│
│     NO  → continue to user auth                               │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────────┐
│  3. Authenticate Plugin                                        │
│     a. Check IP abuse block (Redis)                            │
│     b. Extract Bearer token                                    │
│     c. verifyPrivyToken() — Privy SDK (no custom crypto)       │
│     d. Upsert user profile in DB                               │
│     e. Check isBanned                                          │
│     f. Validate or create session (Redis)                      │
│     g. Attach AuthenticatedUser to request.actor              │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────────┐
│  4. Authorize Plugin   (route config: requirePermission etc.)  │
│     Check RBAC: role rank + permission matrix                  │
│     403 if insufficient                                        │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
            Route Handler runs
```

## 2. Authentication Sequence

### 2a. User (Privy) Authentication

```
Client              API Gateway          Privy SDK          Redis           PostgreSQL
  │                     │                    │                 │                │
  │─ POST /auth/verify ─▶                    │                 │                │
  │  Authorization: Bearer <privy_token>      │                 │                │
  │                     │                    │                 │                │
  │                     │─ isIpBlocked? ─────────────────────▶│                │
  │                     │◀─ false ───────────────────────────│                │
  │                     │                    │                 │                │
  │                     │─ verifyAuthToken() ▶               │                │
  │                     │◀─ AuthTokenClaims ─│                │                │
  │                     │   {userId, sessionId, linkedAccounts}│                │
  │                     │                    │                 │                │
  │                     │─────────── upsert profile ─────────────────────────▶│
  │                     │◀─────────── {walletAddress, role, isBanned} ────────│
  │                     │                    │                 │                │
  │                     │─ create session ────────────────────▶│                │
  │                     │◀─ Session{sessionId} ───────────────│                │
  │                     │                    │                 │                │
  │◀─ 200 {userId, role, sessionId} ─────────│                 │                │
  │   x-session-id: <sessionId>              │                 │                │
```

### 2b. Service-to-Service Authentication

```
Trading Service         API Gateway             Redis
     │                      │                     │
     │─ POST /internal/… ──▶│                     │
     │  X-Service-ID: trading-service             │
     │  X-Service-Timestamp: 2026-07-04T…        │
     │  X-Service-Nonce: <32-byte-hex>           │
     │  X-Service-Signature: <HMAC-SHA256>       │
     │                      │                     │
     │                      │─ validateTimestamp() (±30s drift)
     │                      │─ validateAndConsume(nonce) ──────▶│
     │                      │◀─ OK (NX set succeeded) ─────────│
     │                      │                     │
     │                      │─ verifyHMAC(sig, secret)         │
     │                      │  HMAC(svcId+ts+nonce+method+path+bodyHash)
     │                      │                     │
     │◀─ Route handler ─────│                     │
```

## 3. Authorization Matrix

| Permission | USER | CREATOR | VERIFIED_CREATOR | MODERATOR | ADMIN | SUPER_ADMIN | INTERNAL_SERVICE |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `trade:buy` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| `trade:sell` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| `coin:create` | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| `auth:manage_api_keys` | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| `auth:read_any_profile` | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| `admin:view_dashboard` | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ |
| `admin:pause_protocol` | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `admin:sweep_treasury` | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `auth:ban_user` | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `admin:update_config` | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| `superadmin:all` | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| `service:call_internal_api` | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |

Role rank: SUPER_ADMIN(100) > ADMIN(80) > MODERATOR(60) > VERIFIED_CREATOR(40) > CREATOR(30) > USER(10) > INTERNAL_SERVICE(5)

## 4. Session Lifecycle

```
         ┌─────────────────────────────────────────────────────┐
         │                   SESSION LIFECYCLE                  │
         └─────────────────────────────────────────────────────┘

  Token verified
         │
         ▼
  ┌─────────────┐   x-session-id header    ┌─────────────────┐
  │   CREATED   │─────────────────────────▶│    ACTIVE       │
  │ Redis SET   │   session found + valid  │ TTL: 15 min     │
  │ TTL: 15 min │                          │ sliding window  │
  └─────────────┘                          └────────┬────────┘
                                                    │
                         ┌──────────────────────────┤
                         │                          │
                   User calls                  No activity
                  /auth/logout              (TTL expires)
                  or admin                        │
                  DELETE /sessions                │
                         │                        │
                         ▼                        ▼
                  ┌─────────────┐         ┌─────────────┐
                  │  REVOKED    │         │   EXPIRED   │
                  │ 60s tombstone│         │  Redis key  │
                  │ then deleted │         │  deleted    │
                  └─────────────┘         └─────────────┘

  Sliding window: each request touches lastSeenAt.
  If lastSeenAt is older than SESSION_IDLE_EXTENSION_SECONDS (5 min),
  TTL is reset to 15 min from now.

  Max concurrent: 5 sessions per user.
  On creation of 6th: oldest is automatically revoked.
```

## 5. Threat Model

| Threat | Mitigation |
|---|---|
| **JWT forgery** | Privy SDK verifies signature with Privy's public keys. No custom crypto. |
| **Expired token replay** | Privy SDK checks `expiration` claim. Session TTL adds second layer. |
| **Session hijacking** | Sessions are bound to sessionId (opaque UUID). No session fixation possible. |
| **Replay attacks (service)** | HMAC covers timestamp + nonce. Nonces are single-use (Redis NX). Timestamp tolerance ±30s. |
| **HMAC timing attack** | `timingSafeEqual` from Node.js `crypto` — constant-time comparison. |
| **IP-based brute force** | 50 failures in 5 min → 30-min block. Tracked in Redis. |
| **Credential stuffing** | Rate limit (20/min on auth endpoints) + IP block threshold. |
| **Privy key rotation** | Privy SDK handles key rotation internally. App never sees private keys. |
| **Role escalation** | `canAssignRole` enforces strict rank: you cannot assign your own or higher rank. |
| **API key leakage** | Raw key shown once at creation; only SHA-256 hash stored. No recovery possible. |
| **CSRF** | Financial API is token-in-header only (no cookie auth). CSRF does not apply. |
| **Session fixation** | Sessions are always created fresh; attacker-controlled session IDs are rejected. |
| **Privilege persistence after ban** | All sessions revoked atomically on ban. |
| **Log injection** | Pino serializers sanitize log inputs. Structured JSON format prevents injection. |
| **Secret logging** | Pino redact paths cover: authorization, password, mnemonic, privateKey, encryptedMnemonic, apiKey. |

## 6. CSRF Analysis

Fun.Run uses **token-in-Authorization-header** authentication (Bearer token), not cookies. CSRF attacks require the browser to automatically send credentials. Since Authorization headers are not automatically attached by browsers on cross-origin requests, **CSRF is not applicable to this auth design**. No CSRF tokens or SameSite cookies are needed for the API. If a cookie-based session is ever introduced, SameSite=Strict + CSRF tokens must be added.

## 7. Test Coverage Summary

| Module | Tests | Coverage Target |
|---|---|---|
| `rbac/roles.ts` | 22 assertions across 6 test suites | 100% |
| `session/manager.ts` | 8 test cases (create, validate, revoke, list) | 95% |
| `middleware/service-auth.ts` | 7 test cases (sign + verify) | 100% |
| `middleware/replay.ts` | 9 test cases (nonce + timestamp) | 100% |
| `integration/auth-flow.ts` | 5 end-to-end flows (verify, me, logout) | flows |

Total unit tests: **51 assertions**
Integration tests: **5 flows** (mocked Privy + in-memory Redis)
