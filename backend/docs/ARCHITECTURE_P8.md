# Fun.Run V2 — Phase 8.0: Backend Architecture

**Version:** v1.0.0-rc1 Protocol / Phase 8.0 Backend  
**Date:** 2026-07-03  
**Scale Target:** 1,000,000+ users · Horizontal scaling · Event-driven  
**Status:** Architecture Design — Pre-Implementation  

---

## Table of Contents

1. [Architecture Philosophy](#1-architecture-philosophy)
2. [System Overview](#2-system-overview)
3. [API Gateway](#3-api-gateway)
4. [Authentication Service](#4-authentication-service)
5. [Wallet Service](#5-wallet-service)
6. [Trading Service](#6-trading-service)
7. [Coin Service](#7-coin-service)
8. [Creator Service](#8-creator-service)
9. [Referral Service](#9-referral-service)
10. [Portfolio Service](#10-portfolio-service)
11. [Treasury Service](#11-treasury-service)
12. [Analytics Service](#12-analytics-service)
13. [Notification Service](#13-notification-service)
14. [Admin Service](#14-admin-service)
15. [WebSocket Service](#15-websocket-service)
16. [Background Job Workers](#16-background-job-workers)
17. [Blockchain Indexer](#17-blockchain-indexer)
18. [Database Architecture](#18-database-architecture)
19. [Redis Cache](#19-redis-cache)
20. [Queue System](#20-queue-system)
21. [Rate Limiter](#21-rate-limiter)
22. [Monitoring & Logging](#22-monitoring--logging)
23. [Deployment Topology](#23-deployment-topology)
24. [Failure Modes & Resilience](#24-failure-modes--resilience)

---

## 1. Architecture Philosophy

### Why Not a Monolith?

The current `backend/server.js` (~2,400 lines) is a single-process Express server. It works at low scale but has hard limits:

- **Single process** — one CPU core; no horizontal scaling of individual hot paths
- **Single DB connection pool** — all logic competes for the same connections
- **Tight coupling** — a bug in the analytics endpoint can block a trade
- **No fault isolation** — a crashed analytics query brings down trading

At 1,000,000 users with concurrent trading, graduation events, and real-time WebSocket feeds, the monolith fails on CPU, memory, connection limits, and blast radius.

### Design Principles

| Principle | Rationale |
|---|---|
| **Service isolation** | A slow analytics query cannot block a trade execution |
| **Horizontal scaling** | Every service is stateless and runs N replicas behind a load balancer |
| **Event-driven async** | Trades, graduations, and fee events are published to a queue; downstream consumers process them independently |
| **Read/Write separation** | Hot read paths (coin price, leaderboard) served from Redis; writes go to PostgreSQL |
| **Fail gracefully** | If the Notification Service is down, trades still execute; if Analytics is down, trading is unaffected |
| **One source of truth** | The Blockchain Indexer is the canonical source for on-chain state; the DB mirrors it |
| **Defense in depth** | Rate limiting at the gateway, auth at the service layer, input validation everywhere |

### Technology Choices

| Layer | Technology | Why |
|---|---|---|
| Runtime | Node.js 22 LTS | Team familiarity; excellent async I/O for WebSocket-heavy workloads |
| Framework | Fastify (services) + Express (legacy gateway compat) | Fastify is 2–3× faster than Express; schema validation built-in |
| Database | PostgreSQL 16 (Neon serverless) | Existing schema; JSONB for flexible metadata; strong ACID guarantees |
| Connection pooling | PgBouncer (transaction mode) | Multiplexes 1000+ app connections to ~50 DB connections |
| Cache | Redis 7 (Redis Cloud / Upstash) | Sub-millisecond reads; pub/sub for WebSocket fan-out |
| Queue | BullMQ (Redis-backed) | Simple, battle-tested; same Redis cluster reused |
| WebSocket | ws + Redis pub/sub | Stateless WS servers; Redis fan-out enables horizontal scaling |
| Container | Docker + Kubernetes | Standard horizontal scaling primitives |
| Reverse proxy | Nginx / cloud ALB | TLS termination, rate limiting, health checks |

---

## 2. System Overview

### 2.1 High-Level Architecture

```
                          ┌─────────────────────────────────────────────────────────────┐
                          │                      INTERNET                               │
                          └────────────────────────┬────────────────────────────────────┘
                                                   │
                          ┌────────────────────────▼────────────────────────────────────┐
                          │                   CDN / DDoS Shield                         │
                          │         (Cloudflare / AWS CloudFront)                       │
                          │   Static assets cached · TLS termination · DDoS mitigation  │
                          └────────────────────────┬────────────────────────────────────┘
                                                   │
                          ┌────────────────────────▼────────────────────────────────────┐
                          │              Load Balancer (ALB / Nginx)                    │
                          │     Health checks · SSL offload · Sticky sessions (WS)      │
                          └──────────┬────────────────────────────┬───────────────────  ┘
                                     │                            │
                          ┌──────────▼──────────┐    ┌───────────▼──────────────┐
                          │    API Gateway       │    │   WebSocket Gateway       │
                          │  (HTTP REST/JSON)    │    │   (ws:// / wss://)        │
                          │  Rate limit · Auth   │    │  Redis pub/sub fan-out    │
                          └──────────┬──────────┘    └───────────┬──────────────┘
                                     │                            │
                   ┌─────────────────┼────────────────────────── ┼ ──────────────────────┐
                   │                 │      INTERNAL SERVICE MESH │                       │
                   │  ┌──────────────▼──────┐  ┌─────────────────▼──────┐               │
                   │  │  Auth Service        │  │  Notification Service   │               │
                   │  └──────────────────────┘  └────────────────────────┘               │
                   │  ┌──────────────────────┐  ┌────────────────────────┐               │
                   │  │  Trading Service      │  │  Analytics Service     │               │
                   │  └──────────────────────┘  └────────────────────────┘               │
                   │  ┌──────────────────────┐  ┌────────────────────────┐               │
                   │  │  Coin Service         │  │  Portfolio Service     │               │
                   │  └──────────────────────┘  └────────────────────────┘               │
                   │  ┌──────────────────────┐  ┌────────────────────────┐               │
                   │  │  Creator Service      │  │  Treasury Service      │               │
                   │  └──────────────────────┘  └────────────────────────┘               │
                   │  ┌──────────────────────┐  ┌────────────────────────┐               │
                   │  │  Referral Service     │  │  Wallet Service        │               │
                   │  └──────────────────────┘  └────────────────────────┘               │
                   │  ┌──────────────────────┐  ┌────────────────────────┐               │
                   │  │  Admin Service        │  │  Background Workers    │               │
                   │  └──────────────────────┘  └────────────────────────┘               │
                   └─────────────────────────────────────────────────────────────────────┘
                                     │                            │
                   ┌─────────────────▼────────────────┐  ┌───── ▼────────────────────────┐
                   │          Data Layer               │  │    Blockchain Layer             │
                   │  ┌─────────────┐  ┌────────────┐ │  │  ┌─────────────────────────┐  │
                   │  │ PostgreSQL  │  │   Redis    │ │  │  │  Blockchain Indexer      │  │
                   │  │  (Primary)  │  │  (Cache +  │ │  │  │  (Solana RPC listener)   │  │
                   │  │  + Replica  │  │   Queue)   │ │  │  │                         │  │
                   │  └─────────────┘  └────────────┘ │  │  └─────────────────────────┘  │
                   └──────────────────────────────────┘  └───────────────────────────────┘
```

### 2.2 Request Flow — Trade Execution

```
User (browser/app)
  │
  │  POST /api/trade/buy  { coin_id, sol_amount, min_tokens_out }
  ▼
[CDN] → pass-through (not cacheable)
  ▼
[Load Balancer] → route to API Gateway pod
  ▼
[API Gateway]
  ├── Rate limit check      → Redis: 60 req/min per user for trades
  ├── JWT validation        → Auth Service (cached in Redis)
  ├── Request validation    → schema check (sol_amount > 0, etc.)
  └── Route to → [Trading Service]
        │
        ├── Fetch coin state       → Redis cache (3s TTL) → PostgreSQL
        ├── Compute AMM output     → pure math (tokens_out, fees)
        ├── Execute on-chain tx    → Wallet Service (sign + send)
        ├── Await confirmation     → Solana RPC (confirmed commitment)
        ├── Update DB state        → PostgreSQL (reserves, holdings)
        ├── Update cache           → Redis (coin price, user balance)
        └── Publish trade event    → Queue (BullMQ)
              │
              ├── → Notification Service   (WebSocket broadcast to coin subscribers)
              ├── → Analytics Service      (OHLCV candle update)
              ├── → Portfolio Service      (holdings update)
              └── → Graduation Watcher    (check if threshold reached)
  ▼
[API Gateway] → HTTP 200 { tokens_out, tx_sig, new_price, fees }
  ▼
User receives response
```

### 2.3 Event-Driven Flow — Graduation

```
[Blockchain Indexer]
  │  Detects: GraduationInitiated event on-chain
  ▼
[Queue] → graduation.initiated job
  │
  ├── [Graduation Worker]
  │     ├── Build complete_graduation transaction
  │     ├── Submit via Wallet Service (treasury keypair signs)
  │     ├── Await confirmation
  │     ├── Update BondingCurve state → graduated=true in DB
  │     └── Publish graduation.completed event
  │
  └── [Notification Service]
        ├── WebSocket broadcast to all coin subscribers
        ├── Push notification to coin creator
        └── Push notification to top holders

[Analytics Service]
  └── Records graduation milestone, updates leaderboards
```

---

## 3. API Gateway

### Purpose
Single entry point for all client HTTP requests. Enforces security, routing, and observability before any request reaches a downstream service.

### Responsibilities

```
┌─────────────────────────────────────────────────────────┐
│                     API GATEWAY                          │
│                                                         │
│  Ingress                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  TLS     │  │  CORS    │  │  Request │              │
│  │  Term.   │  │  Headers │  │  Logging │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
│  Security                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Rate    │  │  JWT     │  │  IP      │              │
│  │  Limit   │  │  Verify  │  │  Block   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
│  Routing                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Service │  │  Version │  │  Health  │              │
│  │  Router  │  │  Prefix  │  │  Check   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

### Route Map

| Prefix | Downstream Service |
|---|---|
| `GET /api/coins/*` | Coin Service |
| `POST /api/trade/*` | Trading Service |
| `GET /api/portfolio/*` | Portfolio Service |
| `POST /api/wallet/*` | Wallet Service |
| `GET /api/creator/*` | Creator Service |
| `GET /api/referral/*` | Referral Service |
| `GET /api/analytics/*` | Analytics Service |
| `POST /api/auth/*` | Authentication Service |
| `GET /api/treasury/*` | Treasury Service |
| `POST /api/admin/*` | Admin Service (requires admin JWT role) |
| `GET /health` | Gateway itself |

### Scaling
- Stateless — runs N replicas
- Rate limit state stored in Redis (shared across all gateway pods)
- Load balancer distributes via round-robin; WebSocket connections use sticky sessions

---

## 4. Authentication Service

### Purpose
Verifies user identity (via Privy), issues internal JWTs, and manages session state. All other services trust the gateway's forwarded identity headers — they do not re-verify Privy tokens.

### Why a Dedicated Auth Service?
- Centralizes identity logic; all other services are identity-agnostic
- Token verification is CPU-intensive; isolating it prevents CPU starvation on trading pods
- Session revocation can be implemented in one place (Redis blacklist)

### Flow

```
Client (Privy SDK)
  │  Privy auth token (OAuth / embedded wallet)
  ▼
[Auth Service]
  ├── Verify Privy token via Privy API (or local SDK)
  ├── Resolve wallet address (privy_user_id → solana_address)
  ├── Upsert user in PostgreSQL (profiles table)
  ├── Issue internal JWT { user_id, wallet_address, roles, exp }
  │     └── Signed with HMAC-SHA256 (internal secret, not Privy's)
  └── Return JWT to client
        │
        Client sends JWT in Authorization: Bearer header on all subsequent requests
        Gateway validates JWT signature (no Auth Service round-trip after issue)
        User identity injected into X-User-Id, X-Wallet-Address headers
```

### Token Strategy

| Token Type | TTL | Storage |
|---|---|---|
| Internal JWT (access token) | 15 minutes | Client memory (not localStorage) |
| Refresh token | 7 days | HTTP-only Secure cookie |
| Session blacklist | TTL-matched | Redis SET |

### Account Structure

```
profiles table (PostgreSQL)
  id              UUID PRIMARY KEY
  privy_user_id   TEXT UNIQUE      ← Privy's user identifier
  wallet_address  TEXT UNIQUE      ← Solana wallet (primary key for on-chain)
  email           TEXT             ← from Privy
  created_at      TIMESTAMPTZ
  last_seen_at    TIMESTAMPTZ
  roles           TEXT[]           ← ['user', 'admin', 'creator']
  is_banned       BOOLEAN
```

### Scaling
- Stateless after JWT issuance
- JWT validation is a local operation (signature check) — no DB hit
- Privy API calls cached in Redis for 60s per user

---

## 5. Wallet Service

### Purpose
Manages all custodial wallet operations: keypair creation, encrypted mnemonic storage, transaction signing, and SOL sweeping. This is the most security-sensitive service in the stack.

### Why Isolated?
- Keypair material and encryption keys must never leave this service
- Separate process boundary limits blast radius if another service is compromised
- Can be deployed in a hardened environment (no outbound internet except to Solana RPC)

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      WALLET SERVICE                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Encryption Layer                                   │    │
│  │  • AES-256-GCM (migrated from CBC in security fix)  │    │
│  │  • MNEMONIC_SECRET from environment (never logged)  │    │
│  │  • Key rotation support via versioned ciphertext    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Keypair Operations                                 │    │
│  │  createCustodialWallet()   → BIP39 mnemonic → AES  │    │
│  │  getCustodialKeypair()     → decrypt → Keypair      │    │
│  │  signTransaction()         → sign with keypair      │    │
│  │  sweepToTreasury()         → transfer SOL           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Solana RPC Client                                  │    │
│  │  sendTransaction()         → submit + confirm       │    │
│  │  getBalance()              → SOL balance query      │    │
│  │  simulateTransaction()     → preflight check        │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Security Requirements

| Requirement | Implementation |
|---|---|
| Mnemonic encryption | AES-256-GCM; key from `MNEMONIC_SECRET` env var |
| Key material in memory | Keypair decrypted per-operation; never stored in Redis or logs |
| No mnemonic in logs | Structured logging with field redaction middleware |
| Mnemonic reveal rate limit | 5 requests/min per user (existing) |
| Internal-only endpoint | No public route; only reachable from API Gateway and Workers |
| Audit log | Every signing operation written to `audit_logs` table |
| Treasury keypair | Loaded from `TREASURY_KEYPAIR` env var; separate from custodial keys |

### Mnemonic Reveal Endpoint

```
POST /internal/wallet/reveal-mnemonic
  Headers: X-User-Id, X-Internal-Secret
  Body: { wallet_address }

  ← Rate limited: 5/min per user
  ← Writes to audit_logs
  ← Never cached in Redis
  ← Response encrypted in transit (HTTPS only)
```

### Scaling
- Stateless per request (decrypt → sign → return; no state held between requests)
- Can scale horizontally, but keep instance count low (smaller attack surface)
- `MNEMONIC_SECRET` injected via Kubernetes Secret, not environment file

---

## 6. Trading Service

### Purpose
Executes buy and sell operations on the Fun.Run bonding curve. This is the highest-throughput, most latency-sensitive service in the stack.

### Why Isolated?
- Trading is the core revenue path; a slow analytics query must never delay a trade
- Independent scaling: trading pods can scale to 20× during launch events; analytics stays at baseline

### Request Lifecycle

```
[API Gateway] → POST /trade/buy { coin_id, sol_amount, min_tokens_out, wallet_address }
  │
  ▼
[Trading Service — Buy Handler]
  │
  ├─ 1. Load coin state
  │       Redis cache (3s TTL) → coinCache.get(coin_id)
  │       Cache miss → PostgreSQL SELECT bonding_curves WHERE id = ?
  │
  ├─ 2. Validate trade
  │       curve not complete
  │       protocol not paused
  │       sol_amount > 0
  │
  ├─ 3. Compute AMM output (pure math, no I/O)
  │       tokens_out = VT - floor(k / (VS + sol_net))
  │       Verify tokens_out >= min_tokens_out (slippage guard)
  │
  ├─ 4. Build Solana transaction
  │       → Wallet Service: sign buy instruction
  │       ComputeBudget prepended (80,000 CU)
  │
  ├─ 5. Simulate transaction (preflight)
  │       → Solana RPC simulateTransaction
  │       Abort if simulation fails
  │
  ├─ 6. Submit transaction
  │       → Solana RPC sendTransaction (confirmed commitment)
  │       Retry up to 3× with exponential backoff on timeout
  │
  ├─ 7. Await confirmation (timeout: 30s)
  │       Poll getSignatureStatus every 500ms
  │
  ├─ 8. Update database
  │       BEGIN TRANSACTION
  │         UPDATE bonding_curves SET v_sol, v_tokens, real_sol_reserves, ...
  │         UPSERT holdings SET token_balance += tokens_out
  │         INSERT transactions (buy record)
  │         INSERT candles (OHLCV upsert across 6 timeframes)
  │       COMMIT
  │
  ├─ 9. Invalidate and update cache
  │       Redis SET coin:{coin_id}:state → new reserves (3s TTL)
  │       Redis INCR coin:{coin_id}:volume
  │
  └─ 10. Publish events
          Queue → trade.executed { type: 'buy', coin_id, buyer, sol_amount, tokens_out, fees }
          Queue → graduation.check { coin_id, real_sol_reserves }

  ▼
[Response] { tx_sig, tokens_out, new_price, fee_breakdown, timestamp }
```

### Concurrency Control

Concurrent trades on the same coin can cause race conditions on reserve updates:

```
Strategy: Optimistic locking with retry

UPDATE bonding_curves
SET v_sol = ?, v_tokens = ?, real_sol_reserves = ?, version = version + 1
WHERE id = ? AND version = ?   ← version must match what we read

If 0 rows updated → another trade won the race → reload state → retry
Max retries: 3 → return TradingConflict error to client
```

### OHLCV Candle Upsert

After each confirmed trade, update candles for 6 timeframes atomically:

```
Timeframes: 1m, 5m, 15m, 1h, 4h, 1d

INSERT INTO candles (coin_id, timeframe, bucket, open, high, low, close, volume)
VALUES (?, ?, time_bucket('1 minute', NOW()), ?, ?, ?, ?, ?)
ON CONFLICT (coin_id, timeframe, bucket) DO UPDATE
  SET high   = GREATEST(candles.high, EXCLUDED.close),
      low    = LEAST(candles.low, EXCLUDED.close),
      close  = EXCLUDED.close,
      volume = candles.volume + EXCLUDED.volume
```

### Scaling
- Stateless — scale horizontally to N pods
- Peak trading: ~1,000 trades/min = ~17 trades/sec; 10 pods handle this comfortably
- Each pod maintains its own Solana RPC connection with connection pooling
- DB writes use PgBouncer transaction-mode pooling

---

## 7. Coin Service

### Purpose
Manages all coin metadata, bonding curve state reads, price history (OHLCV candles), and the coin feed (discover, trending, recently launched).

### Why Isolated?
- Read-heavy workload (coin discovery is the primary landing page action)
- Can be served aggressively from Redis cache without hitting PostgreSQL
- Completely independent of trading logic; scaling separately reduces cost

### Endpoints

| Endpoint | Cache TTL | Description |
|---|---|---|
| `GET /coins` | 5s | Paginated coin feed with filters |
| `GET /coins/:id` | 3s | Single coin state (price, reserves, metadata) |
| `GET /coins/:id/candles` | 500ms | OHLCV candle data for charting |
| `GET /coins/:id/trades` | 2s | Recent trade history for a coin |
| `GET /coins/:id/holders` | 10s | Top holders list |
| `GET /coins/trending` | 10s | Trending coins by volume |
| `GET /coins/graduating` | 5s | Coins near graduation threshold |
| `GET /coins/graduated` | 30s | Recently graduated coins |
| `POST /coins/create` | — | Launches a new coin (routes to Trading Service) |

### Coin State Document (Redis)

```json
{
  "coin_id": "uuid",
  "mint_address": "So1...",
  "name": "DOGE2",
  "symbol": "DOGE2",
  "image_uri": "https://...",
  "virtual_sol_reserves": 32500000000,
  "virtual_token_reserves": 1040000000000000,
  "real_sol_reserves": 2500000000,
  "current_price_sol": 0.0000000312,
  "market_cap_sol": 31.2,
  "graduation_progress_pct": 2.94,
  "volume_24h_sol": 18.5,
  "trades_24h": 142,
  "holder_count": 38,
  "complete": false,
  "graduated": false,
  "created_at": 1751500000,
  "creator": "wallet_address"
}
```

### Price Feed Architecture

```
Trade executed → Trading Service publishes trade.executed event
  │
  ▼
[Coin Service Worker] (subscriber)
  ├── Compute new price from updated reserves
  ├── Update Redis coin state (3s TTL)
  ├── Update 24h rolling volume in Redis sorted set
  └── Publish coin.price_updated to Redis pub/sub
        │
        ▼
[WebSocket Service] (Redis subscriber)
  └── Fan-out price update to all subscribers of this coin
```

---

## 8. Creator Service

### Purpose
Manages creator profiles, their coin portfolios, and creator-specific data. A creator is any user who has launched at least one coin.

### Why Isolated?
- Creator profile reads are common (every coin page shows creator info)
- Creator analytics (total volume, earnings) are expensive aggregations that should not run on trading pods
- Referral relationship data lives here and is queried on every trade fee calculation

### Responsibilities

```
┌──────────────────────────────────────────────────┐
│               CREATOR SERVICE                    │
│                                                  │
│  Profiles       Coins           Stats            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Get/     │  │ Creator's│  │ Lifetime │       │
│  │ Upsert   │  │ coin     │  │ volume,  │       │
│  │ profile  │  │ list     │  │ fees,    │       │
│  │          │  │          │  │ coins    │       │
│  └──────────┘  └──────────┘  └──────────┘       │
│                                                  │
│  Referral Snapshot                               │
│  ┌────────────────────────────────────────┐      │
│  │  creator_referrer snapshot at          │      │
│  │  create_coin time → immutable          │      │
│  │  Queried by Trading Service for fee    │      │
│  │  distribution on every trade           │      │
│  └────────────────────────────────────────┘      │
└──────────────────────────────────────────────────┘
```

### Endpoints

| Endpoint | Description |
|---|---|
| `GET /creator/:wallet` | Creator profile + stats |
| `GET /creator/:wallet/coins` | All coins created by this wallet |
| `GET /creator/:wallet/earnings` | Fee earnings across all coins |
| `PUT /creator/profile` | Update display name, avatar |

---

## 9. Referral Service

### Purpose
Tracks referral relationships, computes referrer fee balances, and provides referral stats and leaderboards.

### Why Isolated?
- Referral tracking affects every single trade (fee distribution)
- Referral leaderboards are expensive aggregations
- Referral data should be verifiable against on-chain state (ReferralAccount PDA)

### Fee Distribution Model

```
Every buy or sell:

  total_fee = sol_amount × fee_bps / 10_000

  has_referrer = bonding_curve.creator_referrer IS NOT NULL

  if has_referrer:
    creator_fee  = floor(total_fee × 40 / 100)
    referrer_fee = floor(total_fee × 20 / 100)
    treasury_fee = total_fee - creator_fee - referrer_fee  (≥ 40%)
  else:
    creator_fee  = floor(total_fee × 40 / 100)
    referrer_fee = 0
    treasury_fee = total_fee - creator_fee                 (≥ 60%)

These are executed on-chain by the Anchor program.
This service tracks the same math off-chain for display + analytics.
```

### Referral Leaderboard (Redis Sorted Set)

```
ZADD referral:leaderboard:all-time <lifetime_fees_claimed_lamports> <wallet_address>
ZADD referral:leaderboard:7d       <7d_fees_lamports>               <wallet_address>

ZREVRANGE referral:leaderboard:all-time 0 99  → top 100 referrers
```

Updated after every `claim_referrer_fees` event from the Blockchain Indexer.

---

## 10. Portfolio Service

### Purpose
Provides each user's full portfolio view: token holdings, SOL balance, P&L, and transaction history.

### Why Isolated?
- Portfolio queries join multiple tables (holdings, transactions, coin prices) — expensive at scale
- Can tolerate slightly stale data (5s cache) without user impact
- Independent of trading latency requirements

### Data Model

```
holdings table
  user_wallet   TEXT
  coin_id       UUID
  token_balance BIGINT          ← raw token units
  avg_cost_sol  NUMERIC(20, 9)  ← average cost basis in SOL per token
  last_updated  TIMESTAMPTZ

Derived at query time:
  current_value_sol = token_balance × current_price_sol
  unrealized_pnl    = current_value_sol - (token_balance × avg_cost_sol)
  pnl_pct           = unrealized_pnl / (token_balance × avg_cost_sol) × 100
```

### Portfolio Snapshot (Cached)

```json
{
  "wallet": "...",
  "total_value_sol": 14.72,
  "unrealized_pnl_sol": +3.21,
  "pnl_pct": +27.9,
  "positions": [
    {
      "coin_id": "...",
      "symbol": "PEPE3",
      "token_balance": 1500000000,
      "current_price_sol": 0.0000000041,
      "current_value_sol": 6.15,
      "avg_cost_sol": 0.0000000028,
      "unrealized_pnl_sol": +1.95,
      "pnl_pct": +46.4
    }
  ]
}
```

Cache TTL: 5 seconds. Invalidated on every trade involving this user.

---

## 11. Treasury Service

### Purpose
Tracks all protocol revenue, fee accumulation, and graduation DEX fees. Provides the operator with real-time visibility into treasury state and sweep operations.

### Why Isolated?
- Treasury data is admin-sensitive (revenue figures)
- Sweep operations must be auditable and separate from user-facing flows
- Treasury balance must be reconcilable against the on-chain Treasury PDA

### Revenue Tracking

```
Treasury receives SOL from:
  1. Creation fees       → every create_coin (default 0.02 SOL)
  2. Trading fees        → 40% (no referrer) or 60% (with referrer) of every trade fee
  3. Graduation DEX fees → 6 SOL per graduation

All tracked in:
  treasury_events table
    id           UUID
    event_type   TEXT  ('creation_fee', 'trading_fee', 'graduation_fee', 'sweep')
    coin_id      UUID  (nullable — NULL for sweep)
    amount_sol   NUMERIC(20, 9)
    tx_sig       TEXT
    created_at   TIMESTAMPTZ
```

### Endpoints (Admin-only)

| Endpoint | Description |
|---|---|
| `GET /treasury/balance` | Current on-chain treasury PDA balance |
| `GET /treasury/revenue` | Revenue breakdown by type and time range |
| `GET /treasury/events` | Paginated event log |
| `POST /treasury/sweep` | Trigger sweep to fee_recipient (calls Admin Service) |

---

## 12. Analytics Service

### Purpose
Computes and serves all market data, leaderboards, volume charts, and protocol-wide statistics.

### Why Isolated?
- Aggregation queries are the most expensive DB operations
- Analytics can run on read replicas; trading must use the primary
- Analytics data can be pre-computed by background workers and served entirely from Redis

### Data Products

```
┌──────────────────────────────────────────────────────────────────┐
│                    ANALYTICS SERVICE                             │
│                                                                  │
│  Real-time (Redis, 10s TTL)                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  • Protocol-wide 24h volume                             │    │
│  │  • Active traders in last 24h                           │    │
│  │  • Coins launched today                                 │    │
│  │  • Graduation count (all-time + this week)              │    │
│  │  • Total market cap (sum of all active curves)          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Leaderboards (Redis Sorted Sets, 60s TTL)                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  • Top coins by volume (24h, 7d, all-time)              │    │
│  │  • Top coins by market cap                              │    │
│  │  • Top traders by volume                                │    │
│  │  • Top creators by volume                               │    │
│  │  • Most graduated creators                              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  OHLCV Candles (PostgreSQL, served via Redis cache)              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Timeframes: 1m · 5m · 15m · 1h · 4h · 1d              │    │
│  │  Lookback:   latest 500 candles per timeframe           │    │
│  │  Cache TTL:  500ms (1m) → 30s (1d)                      │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### Leaderboard Update Strategy

```
After each trade.executed event:
  ZINCRBY analytics:volume:24h <sol_amount_lamports> <coin_id>
  ZINCRBY analytics:volume:24h <sol_amount_lamports> <buyer_wallet>

Cron job every 60s:
  Expire entries older than 24h from sliding window sorted sets
  Recompute market_cap leaderboard from current prices
```

---

## 13. Notification Service

### Purpose
Delivers real-time in-app notifications (via WebSocket) and push notifications (via FCM/APNs) for trade events, price milestones, graduation alerts, and fee claims.

### Why Isolated?
- Notification delivery is fire-and-forget; failure must not affect trade execution
- Push notification APIs (FCM, APNs) are slow external HTTP calls
- WebSocket fan-out is a distinct scaling problem from REST serving

### Notification Types

| Type | Trigger | Channel |
|---|---|---|
| `trade.buy` | Someone buys a coin you hold | WebSocket |
| `trade.sell` | Someone sells a coin you hold | WebSocket |
| `price.milestone` | Coin price hits +100%, +500%, etc. | WebSocket + Push |
| `graduation.initiated` | Coin you hold is graduating | WebSocket + Push |
| `graduation.completed` | Coin you hold has graduated to DEX | WebSocket + Push |
| `fees.claimable` | Creator fees available to claim | WebSocket + Push |
| `referral.earned` | Referral fee earned | WebSocket |
| `coin.created` | New coin by creator you follow | Push |

### Delivery Architecture

```
[Queue] trade.executed event
  │
  ▼
[Notification Worker]
  ├── Look up subscribers for this coin (Redis SET coin:{id}:subscribers)
  ├── Filter: which subscribers want this notification type?
  ├── Publish to Redis pub/sub: ws:notify:{user_id}  ← WebSocket delivery
  └── Queue push jobs for high-priority notifications (graduation, milestones)
        │
        ▼
[Push Worker]
  ├── Load device tokens from DB (push_subscriptions table)
  ├── Call FCM API (Android) or APNs (iOS)
  └── Handle token expiry (delete stale tokens)
```

### Subscription Management

```
User subscribes to a coin via WebSocket message:
  { type: 'subscribe', coin_id: 'uuid' }

Server side:
  SADD coin:{coin_id}:subscribers {user_id}
  SADD user:{user_id}:subscriptions {coin_id}
  EXPIRE coin:{coin_id}:subscribers 3600  ← TTL renewed on activity

On disconnect:
  SREM coin:{coin_id}:subscribers {user_id}
```

---

## 14. Admin Service

### Purpose
Provides operators with protocol management capabilities: emergency pause, fee configuration updates, treasury sweeps, user management, and system health inspection.

### Why Isolated?
- Admin endpoints require a separate auth role (`admin`) — never exposed to regular users
- Admin operations affect global protocol state — must be audited
- Can be deployed in a restricted network zone (VPN-only access)

### Access Control

```
All /api/admin/* routes require:
  1. Valid JWT with role = 'admin'
  2. Request from allowed IP range (VPN CIDR)
  3. TOTP 2FA code for destructive operations

Destructive operations (pause, upgrade, sweep):
  → Require secondary approval from a second admin JWT
  → Written to audit_logs table before execution
```

### Endpoints

| Endpoint | Action | Requires 2FA |
|---|---|---|
| `GET /admin/protocol/status` | Protocol health snapshot | No |
| `POST /admin/protocol/pause` | Emergency pause | Yes |
| `POST /admin/protocol/unpause` | Resume protocol | Yes |
| `POST /admin/fees/update` | Update fee parameters | Yes |
| `POST /admin/treasury/sweep` | Sweep to fee_recipient | Yes |
| `GET /admin/users` | User list with filters | No |
| `POST /admin/users/:id/ban` | Ban a user | Yes |
| `GET /admin/transactions` | Transaction audit log | No |
| `GET /admin/graduation/queue` | Pending graduation queue | No |
| `POST /admin/graduation/trigger` | Manually trigger graduation | Yes |

---

## 15. WebSocket Service

### Purpose
Maintains persistent WebSocket connections with clients and delivers real-time events: price updates, trade feed, graduation alerts, and personal notifications.

### Why Isolated?
- Long-lived connections are fundamentally different from short request-response cycles
- WebSocket servers accumulate connection state; they cannot be carelessly killed
- Sticky load balancing required; separate from stateless HTTP pods

### Architecture

```
Clients connect to wss://api.fun.run/ws
  │
  ▼ (sticky load balancer routes same user to same WS pod)
┌─────────────────────────────────────────────────────────────┐
│                  WebSocket Pod N                            │
│                                                             │
│  Connection Manager                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Map<user_id, WebSocket>    ← in-memory              │  │
│  │  Map<coin_id, Set<user_id>> ← subscriptions          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Redis Subscriber                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Subscribe to:                                       │  │
│  │    ws:coin:*          ← price updates for all coins  │  │
│  │    ws:notify:{user_id}← personal notifications      │  │
│  │    ws:global          ← protocol-wide events         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Message Router                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Redis message → find local subscribers → send       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ▲                              ▲
         │ Subscribe                    │ Subscribe
         │                              │
┌────────┴─────────┐         ┌──────────┴───────────┐
│  WebSocket Pod 1 │   ...   │  WebSocket Pod K     │
│  ~5,000 conns    │         │  ~5,000 conns         │
└──────────────────┘         └──────────────────────┘
         All pods subscribe to Redis pub/sub channels
         Redis delivers messages to all pods
         Each pod delivers only to its locally-connected clients
```

### Message Protocol

```jsonc
// Client → Server: subscribe to coin price feed
{ "type": "subscribe", "channel": "coin:abc123" }

// Client → Server: authenticate (required for personal notifications)
{ "type": "auth", "token": "<JWT>" }

// Server → Client: price update
{ "type": "price", "coin_id": "abc123", "price_sol": 0.0000000412, "market_cap_sol": 41.2, "timestamp": 1751500000 }

// Server → Client: trade event
{ "type": "trade", "coin_id": "abc123", "side": "buy", "sol_amount": 1.5, "tokens_out": 36500000, "trader": "wallet...", "timestamp": 1751500000 }

// Server → Client: graduation alert
{ "type": "graduation", "coin_id": "abc123", "status": "initiated", "sol_at_initiation": 85.0 }

// Server → Client: personal notification
{ "type": "notification", "subtype": "fees.claimable", "coin_id": "abc123", "amount_sol": 0.42 }
```

### Scaling
- Each WebSocket pod handles ~5,000 concurrent connections (Node.js handles this easily with `ws`)
- 1,000,000 users × 5% concurrent = 50,000 connections = 10 WebSocket pods
- Redis pub/sub ensures messages reach all pods regardless of which pod the client connected to
- Pod restarts cause brief disconnection; clients implement exponential backoff reconnect

---

## 16. Background Job Workers

### Purpose
Executes all asynchronous, scheduled, and retry-able operations that should not block user-facing requests.

### Worker Types

```
┌──────────────────────────────────────────────────────────────────┐
│                  BACKGROUND JOB WORKERS                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Graduation Worker                                       │   │
│  │  Trigger: graduation.initiated event from Indexer       │   │
│  │  Action:  Build + submit complete_graduation tx         │   │
│  │  Retry:   3× with 5s backoff; alert on final failure    │   │
│  │  CU:      1,400,000 (must prepend ComputeBudget)        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Treasury Sweep Worker (Cron: daily 00:00 UTC)          │   │
│  │  Trigger: scheduled or manual via Admin Service         │   │
│  │  Action:  sweep_treasury if balance > threshold (50 SOL)│   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Analytics Pre-compute Worker (Cron: every 60s)         │   │
│  │  Action:  Aggregate 24h volume, update leaderboards     │   │
│  │           Compute market caps, update trending list      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Custodial Wallet Sweep Worker (Cron: every 15 min)     │   │
│  │  Action:  Sweep custodial wallets with balance > 0.01   │   │
│  │           SOL to treasury; update profiles              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Push Notification Worker                               │   │
│  │  Trigger: notification.push jobs from queue             │   │
│  │  Action:  Send via FCM / APNs; handle token expiry      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  DB Maintenance Worker (Cron: nightly 03:00 UTC)        │   │
│  │  Action:  Vacuum old candle data (>90d for 1m candles)  │   │
│  │           Archive old transactions, update stats        │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Job Queue Configuration (BullMQ)

```
Queues:
  trade-events       concurrency: 20   retries: 3   backoff: exponential
  graduation         concurrency: 5    retries: 5   backoff: exponential
  notifications      concurrency: 50   retries: 2   backoff: fixed 1s
  push-notifications concurrency: 100  retries: 2   backoff: fixed 2s
  analytics          concurrency: 5    retries: 1   backoff: none
  maintenance        concurrency: 1    retries: 1   backoff: none

Dead Letter Queue:
  failed-jobs  ← all jobs that exhaust retries land here
               ← PagerDuty alert if count > 0
```

---

## 17. Blockchain Indexer

### Purpose
The authoritative bridge between the Solana blockchain and the Fun.Run database. Listens for on-chain events, parses them, and updates the DB and cache accordingly.

### Why Critical?
- The blockchain is the source of truth; the DB is a mirror
- Without the indexer, the backend has no awareness of on-chain state changes
- Graduation events must be detected and acted upon within seconds

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN INDEXER                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  RPC Listener (WebSocket)                               │  │
│  │  connection.onLogs(programId, callback, 'confirmed')    │  │
│  │  connection.onAccountChange(pdaAddress, callback)       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Event Parser                                           │  │
│  │  Parse Anchor event discriminators from tx logs         │  │
│  │  Decode borsh-serialized event data                     │  │
│  │  Map to internal domain events                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Event Handlers                                         │  │
│  │  CoinCreated          → upsert coins table              │  │
│  │  TokensPurchased      → update reserves, holdings       │  │
│  │  TokensSold           → update reserves, holdings       │  │
│  │  GraduationInitiated  → update complete=true, publish   │  │
│  │  GraduationCompleted  → update graduated=true, publish  │  │
│  │  LiquidityLocked      → record LP burned amount         │  │
│  │  MintAuthorityRevoked → mark mint_authority=None        │  │
│  │  CreatorFeesClaimed   → update creator earnings         │  │
│  │  TreasurySweep        → record sweep event              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Slot Tracker                                           │  │
│  │  Tracks last processed slot in DB                       │  │
│  │  On restart: re-process from last_slot to current       │  │
│  │  Prevents missed events on restarts/crashes             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Reliability Requirements

| Requirement | Implementation |
|---|---|
| No missed events | Slot-based catchup on restart |
| Idempotent processing | All handlers use `ON CONFLICT DO NOTHING` or version checks |
| RPC failover | Primary + fallback RPC endpoints; auto-switch on timeout |
| Alert on lag | PagerDuty if indexer is >50 slots behind current |
| Duplicate detection | Track processed tx signatures in Redis (TTL: 24h) |

### RPC Strategy

```
Primary RPC:   Helius / QuickNode (paid, high rate limits, WebSocket)
Fallback RPC:  Triton / Alchemy (for failover)
Public RPC:    api.mainnet-beta.solana.com (last resort only — rate limited)

Health check: ping RPC every 10s; switch to fallback if 3 consecutive failures
```

---

## 18. Database Architecture

### Why PostgreSQL?
- Strong ACID guarantees for financial operations (trades, fees)
- JSONB for flexible metadata (coin descriptions, user preferences)
- Row-level security for future multi-tenancy
- Read replica for analytics (separate from write path)

### Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE TOPOLOGY                            │
│                                                                 │
│  ┌──────────────────────────┐    ┌──────────────────────────┐  │
│  │   Primary PostgreSQL      │    │  Read Replica(s)         │  │
│  │   (Neon serverless)       │───▶│  (Analytics, Portfolio)  │  │
│  │                           │    │                          │  │
│  │  Trading Service writes   │    │  Analytics Service reads │  │
│  │  Indexer writes           │    │  Portfolio reads         │  │
│  │  All critical writes      │    │  Historical queries      │  │
│  └──────────────────────────┘    └──────────────────────────┘  │
│             ▲                                                    │
│             │                                                    │
│  ┌──────────┴───────────┐                                       │
│  │     PgBouncer         │                                       │
│  │  (connection pool)    │                                       │
│  │  Transaction mode     │                                       │
│  │  50 server conns      │                                       │
│  │  ← 1000 app conns     │                                       │
│  └───────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Schema

```sql
-- ── Users & Auth ──────────────────────────────────────────────────

CREATE TABLE profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  privy_user_id         TEXT UNIQUE NOT NULL,
  wallet_address        TEXT UNIQUE NOT NULL,
  email                 TEXT,
  display_name          TEXT,
  avatar_uri            TEXT,
  encrypted_mnemonic    TEXT,           -- AES-256-GCM ciphertext
  referrer_wallet       TEXT,           -- set_creator_referrer relationship
  run_balance           BIGINT DEFAULT 0,
  roles                 TEXT[] DEFAULT '{user}',
  is_banned             BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_wallet ON profiles(wallet_address);

-- ── Coins & Bonding Curves ────────────────────────────────────────

CREATE TABLE coins (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mint_address              TEXT UNIQUE NOT NULL,
  creator_wallet            TEXT NOT NULL REFERENCES profiles(wallet_address),
  creator_referrer_wallet   TEXT,
  name                      TEXT NOT NULL,
  symbol                    TEXT NOT NULL,
  description               TEXT,
  image_uri                 TEXT,
  metadata_uri              TEXT,

  -- AMM state (mirrors on-chain BondingCurve)
  virtual_sol_reserves      BIGINT NOT NULL DEFAULT 30000000000,
  virtual_token_reserves    BIGINT NOT NULL DEFAULT 1073000191000000,
  real_sol_reserves         BIGINT NOT NULL DEFAULT 0,
  real_token_reserves       BIGINT NOT NULL DEFAULT 800000000000000,
  creator_fees_accumulated  BIGINT NOT NULL DEFAULT 0,

  -- Graduation state
  complete                  BOOLEAN DEFAULT FALSE,
  graduated                 BOOLEAN DEFAULT FALSE,
  graduation_dex_fee_snapshot BIGINT DEFAULT 0,
  raydium_pool_address      TEXT,

  -- Stats
  total_trades              BIGINT DEFAULT 0,
  total_volume_sol          BIGINT DEFAULT 0,
  holder_count              INTEGER DEFAULT 0,
  creation_fee_paid         BIGINT DEFAULT 0,
  protocol_version          SMALLINT DEFAULT 2,

  -- Metadata
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  graduation_initiated_at   TIMESTAMPTZ,
  graduation_completed_at   TIMESTAMPTZ,
  last_trade_at             TIMESTAMPTZ,

  -- Versioning for optimistic locking
  version                   BIGINT DEFAULT 0
);

CREATE INDEX idx_coins_creator ON coins(creator_wallet);
CREATE INDEX idx_coins_complete ON coins(complete, graduated);
CREATE INDEX idx_coins_real_sol ON coins(real_sol_reserves DESC);
CREATE INDEX idx_coins_created ON coins(created_at DESC);
CREATE INDEX idx_coins_volume ON coins(total_volume_sol DESC);

-- ── Holdings ──────────────────────────────────────────────────────

CREATE TABLE holdings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address  TEXT NOT NULL REFERENCES profiles(wallet_address),
  coin_id         UUID NOT NULL REFERENCES coins(id),
  token_balance   BIGINT NOT NULL DEFAULT 0,
  avg_cost_sol    NUMERIC(20, 9) DEFAULT 0,  -- cost basis per raw token
  total_invested  BIGINT DEFAULT 0,          -- lamports total spent
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, coin_id)
);

CREATE INDEX idx_holdings_wallet ON holdings(wallet_address);
CREATE INDEX idx_holdings_coin ON holdings(coin_id);

-- ── Transactions ──────────────────────────────────────────────────

CREATE TABLE transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_sig            TEXT UNIQUE NOT NULL,
  coin_id           UUID NOT NULL REFERENCES coins(id),
  wallet_address    TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'create')),
  sol_amount        BIGINT NOT NULL,  -- gross SOL (buy) or gross return (sell)
  sol_net           BIGINT NOT NULL,  -- after fees
  token_amount      BIGINT NOT NULL,
  price_sol         NUMERIC(30, 18),  -- price at time of trade
  treasury_fee      BIGINT DEFAULT 0,
  creator_fee       BIGINT DEFAULT 0,
  referrer_fee      BIGINT DEFAULT 0,
  referrer_wallet   TEXT,
  slot              BIGINT,
  block_time        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_txns_coin ON transactions(coin_id, created_at DESC);
CREATE INDEX idx_txns_wallet ON transactions(wallet_address, created_at DESC);
CREATE INDEX idx_txns_slot ON transactions(slot);

-- ── OHLCV Candles ─────────────────────────────────────────────────

CREATE TABLE candles (
  coin_id    UUID NOT NULL REFERENCES coins(id),
  timeframe  TEXT NOT NULL CHECK (timeframe IN ('1m','5m','15m','1h','4h','1d')),
  bucket     TIMESTAMPTZ NOT NULL,
  open       NUMERIC(30, 18) NOT NULL,
  high       NUMERIC(30, 18) NOT NULL,
  low        NUMERIC(30, 18) NOT NULL,
  close      NUMERIC(30, 18) NOT NULL,
  volume     BIGINT NOT NULL DEFAULT 0,
  trade_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (coin_id, timeframe, bucket)
);

CREATE INDEX idx_candles_coin_tf ON candles(coin_id, timeframe, bucket DESC);

-- ── Referral Accounts ─────────────────────────────────────────────

CREATE TABLE referral_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_wallet       TEXT UNIQUE NOT NULL,
  fees_claimed_total    BIGINT DEFAULT 0,
  last_claim_at         TIMESTAMPTZ,
  total_creators_referred INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── Treasury Events ───────────────────────────────────────────────

CREATE TABLE treasury_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL,
  coin_id     UUID REFERENCES coins(id),
  amount      BIGINT NOT NULL,
  tx_sig      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Audit Logs ────────────────────────────────────────────────────

CREATE TABLE audit_logs (
  id          BIGSERIAL PRIMARY KEY,  -- immutable sequence
  actor       TEXT NOT NULL,           -- wallet_address or 'system'
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  metadata    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
-- Never DELETE from audit_logs.

-- ── Blockchain Indexer State ──────────────────────────────────────

CREATE TABLE indexer_state (
  id            INTEGER PRIMARY KEY DEFAULT 1,  -- singleton row
  last_slot     BIGINT NOT NULL DEFAULT 0,
  last_sig      TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Push Subscriptions ────────────────────────────────────────────

CREATE TABLE push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet       TEXT NOT NULL,
  platform     TEXT NOT NULL CHECK (platform IN ('fcm', 'apns', 'web')),
  token        TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet, token)
);
```

---

## 19. Redis Cache

### Purpose
Three distinct roles: hot data cache (read acceleration), pub/sub message bus (WebSocket fan-out), and job queue backend (BullMQ).

### Cache Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                      REDIS CLUSTER                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Database 0: Application Cache                          │  │
│  │                                                          │  │
│  │  coin:{id}:state        HASH    TTL: 3s                 │  │
│  │  coin:{id}:subscribers  SET     TTL: 1h (renewed)       │  │
│  │  user:{id}:session      STRING  TTL: 15m                │  │
│  │  user:{id}:portfolio    STRING  TTL: 5s                 │  │
│  │  user:{id}:rate:{ep}    STRING  TTL: 60s (sliding)      │  │
│  │  analytics:trending     ZSET    TTL: 10s                │  │
│  │  analytics:volume:24h   ZSET    rolling window          │  │
│  │  referral:leaderboard   ZSET    TTL: 60s                │  │
│  │  coins:feed:hot         LIST    TTL: 5s                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Database 1: Pub/Sub Channels (WebSocket fan-out)        │  │
│  │                                                          │  │
│  │  ws:coin:{id}           ← price + trade events          │  │
│  │  ws:notify:{user_id}    ← personal notifications        │  │
│  │  ws:global              ← protocol-wide broadcasts      │  │
│  │  ws:graduation          ← graduation alerts             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Database 2: BullMQ Job Queues                          │  │
│  │                                                          │  │
│  │  bull:trade-events:{...}                                │  │
│  │  bull:graduation:{...}                                  │  │
│  │  bull:notifications:{...}                               │  │
│  │  bull:analytics:{...}                                   │  │
│  │  bull:maintenance:{...}                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Cache Invalidation Strategy

| Data | Invalidation Trigger |
|---|---|
| Coin state (`coin:{id}:state`) | After every confirmed trade on this coin; TTL expiry as backstop |
| User portfolio (`user:{id}:portfolio`) | After any trade where user is buyer or seller |
| Trending list (`analytics:trending`) | Every 10s via Analytics Worker cron |
| Session (`user:{id}:session`) | On logout, on ban; TTL expiry normally |

---

## 20. Queue System

### Purpose
Decouples services that produce work (Trading Service confirms a trade) from services that consume it (Analytics, Notification, Portfolio). Ensures no work is lost if a consumer is temporarily down.

### Queue Map

```
Producer                 Queue                    Consumers
─────────────────────────────────────────────────────────────────
Trading Service  ──▶  trade-events         ──▶  Analytics Worker
                                                 Portfolio Worker
                                                 Notification Worker
                                                 Graduation Watcher

Blockchain       ──▶  indexer-events       ──▶  Coin State Worker
Indexer                                          Graduation Worker
                                                 Analytics Worker

Graduation       ──▶  graduation           ──▶  Graduation Worker
Watcher                                          Notification Worker

Admin Service    ──▶  admin-ops            ──▶  Treasury Worker
                                                 Protocol Worker

Notification     ──▶  push-notifications   ──▶  FCM Worker
Worker                                           APNs Worker
```

### Job Schema Example: `trade-events`

```json
{
  "jobId": "trade-abc123-1751500000000",
  "data": {
    "type": "buy",
    "coin_id": "uuid",
    "tx_sig": "5abc...",
    "buyer_wallet": "wallet...",
    "sol_amount": 1500000000,
    "sol_net": 1477500000,
    "tokens_out": 36500000000,
    "treasury_fee": 9000000,
    "creator_fee": 9000000,
    "referrer_fee": 4500000,
    "referrer_wallet": "wallet...",
    "new_virtual_sol": 32500000000,
    "new_virtual_tokens": 1040000000000000,
    "new_real_sol": 2500000000,
    "slot": 285000000,
    "timestamp": 1751500000
  },
  "opts": {
    "attempts": 3,
    "backoff": { "type": "exponential", "delay": 2000 }
  }
}
```

---

## 21. Rate Limiter

### Purpose
Protects the platform from abuse, bot trading, and denial-of-service attacks without blocking legitimate users.

### Strategy

```
Three-layer rate limiting:

Layer 1: CDN / DDoS Shield (Cloudflare)
  • IP-level flood protection (SYN floods, UDP amplification)
  • Geographic blocking for restricted regions
  • Bot fingerprinting (challenge suspicious IPs)

Layer 2: API Gateway (Redis sliding window)
  • Applied before any business logic
  • Per-IP and per-user limits simultaneously

Layer 3: Service-level (per-endpoint)
  • Applied inside individual services for expensive operations
```

### Rate Limit Table

| Endpoint Group | Limit | Window | Key |
|---|---|---|---|
| `POST /trade/buy` | 60 req | 60s | per user |
| `POST /trade/sell` | 60 req | 60s | per user |
| `POST /coins/create` | 10 req | 60s | per user |
| `POST /wallet/reveal-mnemonic` | 5 req | 60s | per user |
| `POST /wallet/withdraw` | 10 req | 60s | per user |
| `GET /coins/*` | 300 req | 60s | per IP |
| `GET /analytics/*` | 100 req | 60s | per IP |
| `POST /auth/*` | 20 req | 60s | per IP |
| `POST /admin/*` | 30 req | 60s | per admin |
| Global (all endpoints) | 1000 req | 60s | per IP |

### Implementation (Redis Sliding Window)

```
FUNCTION checkRateLimit(key, limit, windowSeconds):
  now = current_timestamp_ms
  windowStart = now - (windowSeconds * 1000)

  ZREMRANGEBYSCORE key 0 windowStart          -- remove old entries
  count = ZCARD key                            -- count in window
  if count >= limit: return RATE_LIMITED
  ZADD key now now                             -- add current request
  EXPIRE key windowSeconds
  return ALLOWED

Response headers:
  X-RateLimit-Limit: 60
  X-RateLimit-Remaining: 47
  X-RateLimit-Reset: 1751500060
  Retry-After: 13   (only on 429)
```

---

## 22. Monitoring & Logging

### Purpose
Provides full observability into system health, performance, and correctness. Critical for a financial platform where bugs cost users money.

### Observability Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY STACK                          │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Metrics (Prometheus + Grafana)                        │    │
│  │  • Request latency per endpoint (p50, p95, p99)        │    │
│  │  • Trade success/failure rate                          │    │
│  │  • Queue depth per queue                               │    │
│  │  • Blockchain indexer slot lag                         │    │
│  │  • WebSocket connection count                          │    │
│  │  • Redis hit rate                                      │    │
│  │  • DB connection pool utilization                      │    │
│  │  • Error rate per service                              │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Logging (structured JSON → Datadog / Loki)            │    │
│  │  Every log entry includes:                             │    │
│  │    { timestamp, service, level, trace_id,              │    │
│  │      user_id, coin_id, tx_sig, duration_ms, ... }      │    │
│  │  Sensitive fields (mnemonic, keys) are NEVER logged     │    │
│  │  Log levels: error → warn → info → debug               │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Tracing (OpenTelemetry → Jaeger / Tempo)              │    │
│  │  • Trace ID propagated across all service calls        │    │
│  │  • Every trade has a single trace from gateway → DB    │    │
│  │  • Identify slow DB queries, slow RPC calls            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Alerting (PagerDuty)                                  │    │
│  │  P1 (immediate): Trade failure rate > 5%               │    │
│  │  P1 (immediate): Blockchain indexer lag > 50 slots     │    │
│  │  P1 (immediate): Graduation Worker dead job count > 0  │    │
│  │  P2 (urgent):    p99 trade latency > 5s                │    │
│  │  P2 (urgent):    DB connection pool > 90% full         │    │
│  │  P3 (warning):   Redis hit rate < 90%                  │    │
│  │  P3 (warning):   Treasury balance > 50 SOL (sweep)     │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Dashboards

| Dashboard | Metrics |
|---|---|
| **Trading Health** | Trade/s, success rate, p99 latency, Solana RPC status |
| **Protocol Revenue** | SOL collected today, graduation count, fee breakdown |
| **User Activity** | DAU, new registrations, active traders, WebSocket connections |
| **Infrastructure** | CPU/memory per service, DB pool, Redis memory, queue depth |
| **Blockchain** | Indexer slot lag, RPC latency, failed tx rate |

---

## 23. Deployment Topology

### Kubernetes Cluster Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                   KUBERNETES CLUSTER                           │
│                                                                 │
│  Namespace: funrun-prod                                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Tier 1: Critical (no autoscaling throttle)              │  │
│  │  • trading-service        5-20 replicas  HPA on CPU      │  │
│  │  • api-gateway            3-10 replicas  HPA on req/s    │  │
│  │  • websocket-service      3-10 replicas  HPA on conns    │  │
│  │  • blockchain-indexer     2 replicas     (active/standby)│  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Tier 2: Standard (normal autoscaling)                   │  │
│  │  • auth-service           2-5 replicas                   │  │
│  │  • coin-service           2-5 replicas                   │  │
│  │  • wallet-service         2-3 replicas  (keep low)       │  │
│  │  • notification-service   2-5 replicas                   │  │
│  │  • portfolio-service      2-5 replicas                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Tier 3: Background (can tolerate restart)               │  │
│  │  • analytics-service      1-3 replicas                   │  │
│  │  • creator-service        1-3 replicas                   │  │
│  │  • referral-service       1-3 replicas                   │  │
│  │  • treasury-service       1-2 replicas                   │  │
│  │  • admin-service          1 replica     (VPN only)       │  │
│  │  • worker-graduation      1-3 replicas                   │  │
│  │  • worker-analytics       1-2 replicas                   │  │
│  │  • worker-push            2-5 replicas                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Environment Variables (per service)

```
Shared (all services):
  DATABASE_URL          → PgBouncer connection string
  REDIS_URL             → Redis cluster URL
  INTERNAL_JWT_SECRET   → Service-to-service auth
  LOG_LEVEL             → info (prod) / debug (staging)
  ENVIRONMENT           → production / staging

Wallet Service only:
  MNEMONIC_SECRET       → AES-256-GCM encryption key
  TREASURY_KEYPAIR      → Base58 treasury keypair
  SOLANA_RPC            → Primary RPC endpoint
  SOLANA_RPC_FALLBACK   → Fallback RPC endpoint

Trading Service:
  SOLANA_RPC            → Dedicated high-rate RPC
  MAX_TX_RETRY          → 3

Blockchain Indexer:
  SOLANA_RPC_WS         → WebSocket RPC for log subscriptions
  PROGRAM_ID            → Fun.Run V2 program ID
```

---

## 24. Failure Modes & Resilience

### Failure Matrix

| Component Fails | Impact | Mitigation |
|---|---|---|
| Trading Service pod | Some users get 503 | Load balancer routes to healthy pods; auto-restart |
| API Gateway pod | Some requests fail | Load balancer; multiple gateway pods |
| Blockchain Indexer | DB falls behind chain | Slot-tracker enables catchup on restart; alert fires |
| Redis | Cache miss on all reads | Services fall back to PostgreSQL (slower but correct) |
| PostgreSQL primary | All writes fail | Automatic failover to replica (Neon built-in); trades pause briefly |
| Wallet Service | Trades cannot sign | Trading Service returns 503; queue accumulates |
| Raydium RPC | Graduation fails | Graduation Worker retries 5× then alerts operator |
| BullMQ / Redis queue | Jobs lost | Jobs survive in Redis AOF persistence; resume on restart |
| WebSocket Service pod | Clients disconnect | Clients reconnect to another pod (exponential backoff) |
| Push notification API | Push not delivered | Retry queue; users still receive WebSocket notifications |
| Admin Service | Operators cannot manage | Admin functions non-critical to user trading |

### Circuit Breakers

Implemented in Trading Service for external calls:

```
Solana RPC circuit breaker:
  • State: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing)
  • Threshold: 5 failures in 30s → OPEN
  • Recovery: try 1 request after 10s → if success → CLOSED

PgBouncer circuit breaker:
  • Threshold: connection timeout > 5s for 3 consecutive requests
  • Action: return 503 immediately (don't queue more DB connections)

Raydium RPC circuit breaker:
  • Applied in Graduation Worker
  • Threshold: 3 consecutive failures → alert + pause graduation attempts
```

### Data Durability Guarantees

| Data | Guarantee |
|---|---|
| Confirmed trades | Durable in PostgreSQL after on-chain confirmation |
| Candle data | Rebuilt from transactions if lost (indexer replay) |
| Coin state | Rebuilt from blockchain if lost (full indexer replay) |
| User sessions | Ephemeral — user re-logs in on loss |
| Job queue | Redis AOF persistence — survives restart |
| Encrypted mnemonics | In PostgreSQL — backed up nightly |

---

*End of Fun.Run V2 — Phase 8.0 Backend Architecture*  
*Protocol: v1.0.0-rc1 · Architecture Version: 8.0 · Date: 2026-07-03*
