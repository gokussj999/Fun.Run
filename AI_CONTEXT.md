# AI_CONTEXT.md

> **Project Constitution** — Permanent reference for all AI agents working on FUN.RUN.  
> Read this file before any code change. When in doubt, follow this document over inferred behavior.

---

# Project Overview

| Field | Value |
|---|---|
| **Project Name** | FUN.RUN |
| **Category** | Solana meme-coin launchpad |
| **Inspiration** | Pump.fun — designed to surpass it |
| **Protocol Version** | v1.0.0-rc1 (frozen) |
| **Program ID (Devnet)** | `HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP` |

## Goal

Build a **production-grade, solvent, secure Solana launchpad** where users create SPL tokens, trade on an on-chain constant-product bonding curve, earn creator and referral fees, and graduate successful coins to Raydium CPMM with permanently locked liquidity.

## Vision

Become the **most professional Solana launchpad** — better UX, trading experience, analytics, creator tools, infrastructure reliability, and security than Pump.fun.

## Long-term Mission

Deliver an enterprise-grade open-source launchpad stack:

- **On-chain truth** — all trading, fees, and graduation enforced by the Anchor program
- **Off-chain excellence** — indexer, trading service, real-time WebSocket, portfolio analytics
- **Creator ecosystem** — dashboards, referral rewards, transparent fee accounting
- **Operational maturity** — monitoring, audit trails, multisig governance, mainnet certification

---

# Tech Stack

## Frontend

| Component | Technology |
|---|---|
| Framework | React 19 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Auth / Wallets | Privy (`@privy-io/react-auth`) |
| Solana Client | `@solana/kit`, `@solana-program/*` |
| Charts | Lightweight Charts |
| Location | `frontend/` |

## Backend

| Layer | Technology | Location |
|---|---|---|
| **Legacy monolith** | Node.js, Express, WebSocket | `backend/server.js` |
| **Production platform** | TypeScript, Fastify, pnpm monorepo | `platform/` |
| API Gateway | Fastify | `platform/apps/api-gateway/` |
| Auth Service | JWT, RBAC, API keys | `platform/services/auth/` |
| Trading Service | Anchor client, tx lifecycle | `platform/services/trading/` |
| Indexer | Solana subscriber, event processor | `platform/services/indexer/` |
| WS Gateway | Redis pub/sub, subscriptions | `platform/services/ws-gateway/` |

## Solana Program

| Component | Technology |
|---|---|
| Framework | Anchor 0.31.1 |
| Language | Rust (SBF) |
| Program | `funrun_v2` |
| Instructions | 13 (create, buy, sell, fees, graduation, admin) |
| Tests | 544 unit tests (all passing) |
| Location | `anchor/programs/funrun_v2/` |

## Database

| Component | Technology |
|---|---|
| Primary DB | PostgreSQL 16 |
| ORM | Prisma (`platform/packages/database/`) |
| Legacy | Raw SQL via `postgres` driver in `backend/server.js` |
| Hosting | Neon (production) |

## Infrastructure

| Component | Technology |
|---|---|
| Package manager (platform) | pnpm ≥ 9 |
| Node | ≥ 22 |
| Cache / Pub-Sub | Redis 7 (ioredis) |
| Job queues | BullMQ (`platform/packages/redis/`) |
| Containers | Docker Compose (`platform/docker-compose.*.yml`) |
| CI | GitHub Actions (`platform/.github/workflows/`) |

## Monitoring

| Component | Purpose |
|---|---|
| Prometheus metrics | API Gateway port `9090` |
| Health checks | `/healthz` on all services |
| Structured logging | `@funrun/logger` package |
| Alert configs | `platform/services/trading/monitoring/alerts.yaml` |
| Audit logs | Immutable `audit_logs` table — never delete rows |

## Deployment

| Environment | Status | Notes |
|---|---|---|
| **Devnet** | Active | Program deployed; smoke tests passing |
| **Staging** | Docker Compose | Single-node via `platform/docker-compose.prod.yml` |
| **Production** | Not ready | Kubernetes recommended for true production |
| **Legacy backend** | Railway-compatible | `backend/railway.json` |

---

# Architecture

End-to-end data and control flow:

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  React SPA · Privy auth · Trade UI · Charts · Dashboards        │
│  frontend/                                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / WSS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  API Gateway → Auth · Trading · Indexer · WS Gateway            │
│  platform/  (+ legacy backend/ during migration)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ RPC + Anchor TX
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SOLANA PROGRAM                              │
│  funrun_v2 · Bonding curve AMM · Fees · Graduation              │
│  anchor/programs/funrun_v2/                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ On-chain events / account updates
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         INDEXER                                  │
│  Slot tracker · Event parser · DB writer · Candle builder       │
│  platform/services/indexer/                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ Publish
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                           REDIS                                  │
│  Pub/sub channels · Quote cache · Session store · BullMQ        │
│  platform/packages/redis/                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │ Subscribe
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       WEBSOCKET                                  │
│  Real-time prices · Trades · Graduation events · Presence       │
│  platform/services/ws-gateway/                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │ Metrics + alerts
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MONITORING                                 │
│  Prometheus · Health checks · Audit logs · Operator runbook     │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Owns | Must NOT |
|---|---|---|
| Frontend | UI/UX, wallet signing UX, display | Business logic, fee math, reserve updates |
| Backend | Auth, tx orchestration, indexing, APIs | On-chain invariant enforcement |
| Solana Program | AMM math, fee split, graduation CPIs | Off-chain caching or UI state |
| Indexer | Event → DB sync, candles, backfill | User-facing auth |
| Redis | Ephemeral cache, pub/sub, job queues | Source of truth for balances |
| WebSocket | Push updates to clients | Direct DB writes |
| Monitoring | Observability, alerting | Protocol economics |

**Golden rule:** `Frontend → Backend → Solana Program`. Never bypass this chain.

---

# Repository Structure

| Path | Purpose |
|---|---|
| `anchor/` | Solana Anchor workspace — **frozen protocol** (RC1) |
| `anchor/programs/funrun_v2/` | On-chain program source (13 instructions, ~4,200 LOC) |
| `anchor/docs/` | Protocol reference, audit package, operator runbook, developer guide |
| `backend/` | Legacy Express monolith — custodial wallets, virtual curve trading, OHLCV |
| `backend/solana/` | Legacy Solana helpers (create-token, treasury, decrypt-wallet) |
| `backend/routes/` | Legacy route modules (wallet, onchain) |
| `backend/scripts/` | Security verification scripts (`verify-*.mjs`) |
| `frontend/` | React/Vite SPA — landing, trading, portfolio, dashboards |
| `frontend/src/pages/` | Page-level components (Home, Coin, Create, Portfolio, etc.) |
| `frontend/src/components/` | Reusable UI (coin, layout, landing, admin) |
| `frontend/src/services/` | API client layer |
| `frontend/src/lib/` | Display helpers, chart utils, trade preview |
| `platform/` | Production TypeScript monorepo (pnpm workspaces) |
| `platform/apps/api-gateway/` | Public HTTP entry point, CORS, routing |
| `platform/services/auth/` | Authentication, sessions, RBAC, API keys |
| `platform/services/trading/` | Buy/sell/create/graduation tx executors |
| `platform/services/indexer/` | Blockchain event ingestion and DB sync |
| `platform/services/ws-gateway/` | WebSocket server with Redis fan-out |
| `platform/packages/database/` | Prisma schema, migrations, generated client |
| `platform/packages/redis/` | Redis client, BullMQ helpers |
| `platform/packages/shared/` | Shared types, errors, utilities |
| `platform/packages/logger/` | Structured logging |
| `platform/packages/config/` | Environment configuration |
| `platform/workers/` | Background worker stubs |
| `platform/config/` | Environment-specific config (dev, production) |
| `.ai/` | Internal AI development guides (supplementary to this file) |
| `CLAUDE.md` | Claude Code workspace rules |
| `roadmap.md` | Legacy solvency-focused roadmap (Roman Urdu) |

---

# Coding Standards

## Naming Conventions

| Context | Convention | Example |
|---|---|---|
| TypeScript files | kebab-case | `tx-confirmer.ts` |
| React components | PascalCase | `CoinHeader.jsx` |
| Rust modules | snake_case | `bonding_curve.rs` |
| DB tables | snake_case plural | `audit_logs`, `bonding_curves` |
| Env vars | SCREAMING_SNAKE | `DATABASE_URL`, `MNEMONIC_SECRET` |
| API routes | kebab or REST nouns | `/api/v1/trades`, `/healthz` |
| Package scope | `@funrun/*` | `@funrun/database` |

## Folder Rules

- One service = one folder under `platform/services/`
- Shared code goes in `platform/packages/` — never duplicate across services
- Frontend business display logic in `frontend/src/lib/`; API calls in `frontend/src/services/`
- Solana program changes only in `anchor/` with explicit owner approval
- Tests co-located: `tests/unit/`, `tests/security/`, `tests/load/` per service

## Error Handling

- Backend: typed errors from `@funrun/shared/errors`; never leak stack traces to clients
- Trading service: tx state machine with idempotency keys; failed txs logged to audit
- Solana program: 51 typed error codes — always use `errors.rs` variants
- Frontend: user-friendly messages; log details to console in dev only

## Logging

- Use `@funrun/logger` in platform services (structured JSON)
- Legacy backend: `morgan` for HTTP; custom audit log for money movements
- **Never log:** mnemonics, private keys, session tokens, full JWT payloads
- Money movements: always write to immutable `audit_logs`

## Formatting

| Area | Tool |
|---|---|
| Platform TypeScript | Prettier + ESLint (husky pre-commit) |
| Frontend | ESLint flat config |
| Rust | `cargo fmt` |
| Markdown | Prettier (via platform `format` script) |

## API Conventions

- REST over HTTPS; WebSocket for real-time streams
- Auth: Bearer JWT or API key (service-to-service)
- Idempotency: `Idempotency-Key` header on mutating trade endpoints
- Rate limits enforced at gateway and service level
- Version prefix: `/api/v1/` for platform APIs
- Health: `GET /healthz` on every service

---

# Security Rules

## Wallet Security

- Prefer **Privy embedded self-custodial wallets** for new users (target architecture)
- Legacy custodial wallets: AES-256-GCM encrypted BIP39 mnemonics in DB
- Decrypt mnemonics **only** at tx signing time; never cache plaintext
- Mnemonic reveal endpoint: rate-limited (5/min), audit-logged

## Never Expose Private Keys

| Forbidden | Allowed |
|---|---|
| Log mnemonics or keypairs | Public wallet addresses |
| Return private keys in API responses | Transaction signatures |
| Store plaintext secrets in repo | Encrypted ciphertext in DB |
| Commit `.env` files | `.env.example` templates |

## Encryption

- Mnemonic encryption: AES-256-GCM with `MNEMONIC_SECRET` / `ENCRYPTION_KEY`
- Redis: password required in production (`REDIS_PASSWORD`)
- PostgreSQL: TLS in production; credentials via env only
- Key rotation scripts: `backend/scripts/migrate-cbc-to-gcm.mjs`, `verify-key-rotation.js`

## Admin Permissions

- On-chain admin: `GlobalConfig.admin` — pause, fee config, treasury sweep
- Off-chain admin: RBAC in auth service; API keys with scoped permissions
- Admin actions: audit-logged with actor, timestamp, payload hash
- **Before mainnet:** admin and upgrade authority must move to multisig

## Program Safety

- Program is **frozen** at RC1 — no instruction changes without explicit owner request
- All CPIs use PDA signing — no raw keypairs in program state
- Graduation: 14 pre-CPI checks + 14 post-CPI assertions
- Trading fee split is deterministic: 40% creator / 20% referrer / 40% treasury

---

# Things AI Must NEVER Change

> Without **explicit instruction from the project owner**, do not modify:

| Item | Reason |
|---|---|
| **Program ID** | Breaks all client integrations and PDAs |
| **Core Tokenomics** | Virtual reserves (30 SOL / 1.073B tokens), k constant, supply caps |
| **Fee Model** | 1.5% default trading fee; 40/40/20 split; creation fee bounds |
| **PDA Seeds** | `global_config`, `bonding_curve`, `treasury`, `creator_profile`, `referral_account` |
| **Graduation Logic** | 85 SOL threshold, 6 SOL DEX fee, Raydium CPMM CPI flow, LP burn |
| **Creator Reward Logic** | Fee accrual in PDA, claim instruction semantics |
| **Referral Logic** | Write-once referrer, no self-referral, fee routing |

If a bug is found in any of the above, **report it** — do not silently patch unless explicitly authorized.

---

# Development Rules

1. **Work phase by phase** — complete current audit/roadmap phase before starting the next
2. **Never rewrite unrelated code** — minimal diffs; match existing patterns
3. **Never break APIs** — maintain backward compatibility for frontend and external consumers
4. **Always maintain backward compatibility** — especially during legacy → platform migration
5. **Money code requires manual review** — no auto-accept on fund-moving changes
6. **Devnet first** — test on Solana devnet before any mainnet consideration
7. **Read before coding** — `AI_CONTEXT.md`, `PROJECT_STATUS.md`, `AI_HANDOFF.md`, `.ai/02_RULES.md`
8. **Plan before implementation** — explain approach; do not code immediately on ambiguous tasks
9. **Only open files needed** — do not scan the entire repository unnecessarily
10. **Never modify source code when updating documentation** — docs-only tasks stay docs-only

---

*Last updated: 2026-07-10 · Maintained alongside `PROJECT_STATUS.md` and `AI_HANDOFF.md`*
