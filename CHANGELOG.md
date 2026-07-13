# CHANGELOG.md

All notable changes to the FUN.RUN project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Entries are in **reverse chronological order** (newest first).

---

## 2026-07-10

### Added

- **Sprint 7 — Platform Completion (complete)**
  - **Trading** — Native platform routes: market, profile, wallet, create coin, withdraw, claim, referral
  - **Trading** — `CreateCoinExecutor` + `CreateCoinOrchestrator` (on-chain create)
  - **Trading** — `DepositScanner` background worker (custodial SOL deposits → `run_balance_sol`)
  - **Database** — Deposit, DepositScan, Withdrawal models + profile balance fields (baseline squash)
  - **Gateway** — Extended `proxy-trading.ts`; removed `proxy-legacy.ts` and `LEGACY_BACKEND_URL`
  - **Frontend** — `normalizeCreateResponse` + on-chain create UX
  - **Tests** — `sprint7-platform-completion.test.ts`; proxy-trading platform route tests
  - **Docs** — DEVNET_E2E updated (legacy backend not required)

### Removed

- **API Gateway** — `proxy-legacy.ts` (Sprint 6 temporary bridge)
- **Config** — `LEGACY_BACKEND_URL`

### Added

- **Sprint 6 — Frontend Platform Migration (complete)**
  - **API Gateway** — `proxy-legacy.ts`: `/api/v1/market|profile|wallet|coins|rewards|referral/*` → legacy backend
  - **Config** — `LEGACY_BACKEND_URL` in `@funrun/config`
  - **Frontend** — `platform-api.js`, `ws-client.js`, `usePlatformWs.js`
  - **Frontend** — App.jsx migrated to platform REST + ws-gateway protocol
  - **Frontend** — Vite proxy `/api` → gateway :3000
  - **Tests** — `proxy-legacy.test.ts`, `sprint6-frontend-matrix.test.ts`
  - **Scripts** — `sprint6-smoke-frontend.mjs`
  - **Docs** — `DEVNET_E2E.md` (root), Sprint 6 validation checklist

### Changed

- `tests/integration/e2e-flow-matrix.test.ts` — frontend flows → `platform-wired`
- `frontend/src/lib/env.js` — `VITE_WS_URL`, `VITE_USE_PLATFORM`, `TOKEN_DECIMALS`
- `frontend/src/hooks/useCandles.js` — platform candle API

- **Sprint 5 — Cross-System Integration (complete)**
  - **Indexer publishers** — `events:coin_created`, `events:creator:{wallet}`, `events:referral:{wallet}`, `events:portfolio:{wallet}`, `events:notifications:{wallet}`, `events:fee_claimed`, `events:treasury_sweep`
  - **Trade side-effects** — portfolio, creator fee, referral fee, notification publishes on buy/sell
  - **WS Gateway** — `notifications:{wallet}` channel; dispatcher routes creator/referral/portfolio/notifications Redis channels
  - **E2E** — `tests/integration/e2e-flow-matrix.test.ts` (13-flow structural matrix)
  - **Scripts** — `smoke-cross-system.mjs`, `load-baseline.mjs` (100-concurrent quote baseline)
  - **Docs** — `DEVNET_E2E.md` expanded (buy/sell/claim/WS channels/load baseline)

### Changed

- `services/indexer/src/processor/handlers/coin-created.ts` — publishes market + creator + notification events
- `services/indexer/src/processor/handlers/fees.ts` — publishes fee_claimed, creator, referral, treasury, notifications
- `services/ws-gateway/src/redis/dispatcher.ts` — dynamic routing for wallet-scoped channels

- **Sprint 4 — Indexer & WebSocket Hardening (complete)**
  - **Indexer** — Per-event dedup (`indexer:sig:{sig}:{eventName}`); cache DB (0) vs pubsub DB (1) split
  - **Indexer** — `isSafeSlot()` enforced on live path + backfill; reorg-safe event ordering
  - **Indexer** — `WorkerLeaderLock` + `WORKER_LEADER_ELECTION` (single active indexer pod)
  - **Indexer** — `/readyz` on :9091 (DB, Redis cache/pubsub, RPC, WS subscriber)
  - **Indexer** — `SOLANA_RPC_FALLBACK` wired to `RpcCircuitBreaker`
  - **Indexer** — WS reconnect listener leak fix in `LogSubscriber`
  - **Indexer** — Trade publish payload includes `buyer`/`seller` for `holders:` channel
  - **WS Gateway** — Privy `extractSolanaWallet()` auth + `privyUserId` DB fallback
  - **WS Gateway** — Redis pub/sub resubscribe on `ready` event
  - **WS Gateway** — Per-connection `sentSeqs` message deduplication
  - **WS Gateway** — `REDIS_DEPENDENCY_MODE=strict` drops events when seq INCR fails
  - **WS Gateway** — Enhanced `/readyz` with DB + Redis + pubsub components
  - **WS Gateway** — `fromSeq` replay updates `sentSeqs` for reconnect recovery
  - Unit tests: event-dedup, indexer-hardening, redis-subscriber, dispatcher-dedup, ws redis-dependency

### Changed

- `services/indexer/src/worker.ts` — removed `require()` for Connection; explicit import
- `platform/.env.example` — indexer + ws-gateway hardening vars documented

- **Sprint 3 — Trading Engine Hardening (complete)**
  - **H-01** — `REDIS_DEPENDENCY_MODE` (`degraded` default | `strict` fail-closed) for rate-limit, idempotency, IP guard
  - **H-02** — `REQUIRE_TRADE_IDEMPOTENCY_KEY` env flag (default `false` for backward compat)
  - **H-03** — IP-based rate limit on `GET /trade/quote` (300/min via `COIN_READ` limits)
  - **H-22** — Redis leader election for `TxConfirmer`, `TxReconciler`, `GraduationCrank` (`WorkerLeaderLock`)
  - **H-23** — Main port `/readyz` wired to `HealthChecker` (DB + RPC probes)
  - **H-21** — Trading service uses `resolveMnemonicEncryptionKey()` from `@funrun/config`
  - Shared auth helpers in `@funrun/shared` (`extractBearerToken`, `extractIp`, `extractSolanaWallet`)
  - Unit tests: redis-dependency, trading-hardening, idempotency-store, ip-guard, leader-lock, auth-http

### Changed

- `services/trading/src/server.ts` — `/healthz` includes `alive: true`; quote rate limit on `onRequest`
- `services/auth/src/privy/verify.ts` — imports shared auth helpers
- `platform/.env.example` — `REDIS_DEPENDENCY_MODE`, `REQUIRE_TRADE_IDEMPOTENCY_KEY`, `WORKER_LEADER_ELECTION`

- **Sprint 2 — Authentication & Security (complete)**
  - **C-06** — API keys persisted in Redis (`api-keys/store.ts`) instead of in-memory `Map`
  - **C-07** — API key auth wired in `authenticate.ts` (Bearer `fr_*` or `X-Api-Key`)
  - **H-05** — Service HMAC uses `rawBody` captured in `preParsing` (`service-raw-body.ts`)
  - **H-06** — Session validation binds `x-session-id` to token wallet
  - **H-07** — RBAC integration tests (`tests/integration/rbac.test.ts`)
  - **H-08** — `@funrun/auth` registered on API Gateway (`app.ts`)
  - **H-21** — `resolveMnemonicEncryptionKey()` with `MNEMONIC_SECRET` fallback
  - **H-24** — Session sliding window: TTL extended on every validation
  - Auth error handler (`plugins/error-handler.ts`) — fixes integration test 401 body shape
  - Tests: `api-key.test.ts`, `mnemonic-key.test.ts`, RBAC + auth-flow integration fixes

### Changed

- **H-04** — Admin roles (`SUPER_ADMIN`, `ADMIN`, `MODERATOR`) removed from `TRADEABLE_ROLES`
- Gateway rate limit uses `request.actor.walletAddress` when authenticated
- Gateway health + quote routes marked `skipAuth: true`
- `api-gateway/Dockerfile` — builds `@funrun/auth` dependency

- **Sprint 1 Tasks 13–22 — Gateway, infra, and docs (batch)**
  - **Task 13** — `TRADING_SERVICE_URL` in `@funrun/config` Zod schema
  - **Task 14** — API Gateway proxy: `/api/v1/trade/*` → trading service (auth + idempotency headers)
  - **Task 15** — Gateway proxy unit tests (`apps/api-gateway/tests/proxy-trading.test.ts`)
  - **Task 16** — Multi-stage `services/indexer/Dockerfile`; fixed `services/trading/Dockerfile` for platform context
  - **Task 17** — Full staging stack in `docker-compose.prod.yml` (migrate, trading, indexer, ws-gateway)
  - **Task 18** — Staging smoke script: `platform/scripts/smoke-staging.mjs`; gateway `/readyz` checks trading
  - **Task 19** — CI dry-run Docker builds for trading + indexer images
  - **Task 20** — Security tests updated for onchain/offchain response shapes
  - **Task 21** — Devnet E2E runbook: `platform/docs/DEVNET_E2E.md`
  - **Task 22** — `PROJECT_STATUS.md`, `AI_HANDOFF.md` updated — **Sprint 1 complete**

### Changed

- `platform/apps/api-gateway/src/routes/health.ts` — readiness includes trading service probe
- `platform/.env.example` — service URLs, compose Postgres vars, `SOLANA_WS_URL`

- **Sprint 1 Tasks 6–12 — On-chain trade routing (batch)**
  - **Task 6** — `OnChainTradeOrchestrator`: wires `BuyExecutor` / `SellExecutor` with profile + coin context
  - **Task 7** — Trading service startup: instantiates executors, orchestrator, and `TradeRouter`; requires `MNEMONIC_ENCRYPTION_KEY` when `TRADING_MODE=onchain`
  - **Task 8** — `TradeRouter` branches `/trade/buy` and `/trade/sell` by `TRADING_MODE`
  - **Task 9** — `profile-loader.ts`: coin/profile load, `iv:ciphertext` mnemonic format, ban + mint guards
  - **Task 10** — `trade-response.ts`: separate offchain (legacy) vs onchain (`signature`, `status`, `mode`) HTTP bodies
  - **Task 11** — Offchain path deprecated via startup warnings; default remains `TRADING_MODE=offchain`
  - **Task 12** — Indexer E2E poll script: `platform/scripts/verify-trade-indexed.mjs`
  - Tests: `onchain-wiring.test.ts`, `trade-router.test.ts`

### Changed

- `platform/services/trading/src/routes/trade.ts` — uses `TradeRouter` + mode-aware response builders
- `platform/services/trading/src/server.ts` — `tradeRouter` dependency (replaces `executor`)
- `platform/.env.example` — documents `MNEMONIC_ENCRYPTION_KEY` for onchain mode

- **Sprint 1 Task 5 — Trading mode feature flag**
  - `TRADING_MODE` env: `offchain` (default) | `onchain`
  - Config: `platform/services/trading/src/config/trading-mode.ts`
  - Startup validation + log in trading service (no routing change)
  - Tests: `platform/services/trading/tests/unit/trading-mode.test.ts`

- **Sprint 1 Task 4 — CI migration smoke test (C-03)**
  - Dedicated `db-migrate-smoke` GitHub Actions job (empty Postgres → `db:migrate` → verify)
  - Schema smoke script: `platform/packages/database/scripts/verify-schema-smoke.mjs`
  - CI `DATABASE_URL_REPLICA` aligned with `DATABASE_URL` for single-node Postgres
  - Tests: `platform/packages/database/tests/unit/schema-smoke-constants.test.ts`

- **Sprint 1 Task 3 — Migration reconciliation (C-03)**
  - Removed orphan `prisma/migrations/20260710000000_add_pending_tx/`
  - Single baseline migration history; `db:migrate` works on empty PostgreSQL
  - Verification: `platform/packages/database/scripts/verify-migration-tree.mjs`
  - Tests: `platform/packages/database/tests/unit/migration-reconcile.test.ts`

- **Sprint 1 Task 2 — Baseline Prisma migration (C-03)**
  - `prisma/migrations/20260709000000_baseline/migration.sql` — full schema via `migrate diff --from-empty`
  - `prisma/migrations/migration_lock.toml`
  - Verification: `platform/packages/database/scripts/verify-baseline-migration.mjs`
  - Tests: `platform/packages/database/tests/unit/baseline-migration.test.ts`

- **Sprint 1 Task 1 — Prisma migration strategy decision (C-03)**
  - Locked strategy: `prisma migrate diff` baseline squash (`20260709000000_baseline`)
  - Decision doc: `platform/packages/database/MIGRATIONS.md`
  - Inventory script: `platform/packages/database/scripts/migration-inventory.mjs`
  - Precondition tests: `platform/packages/database/tests/unit/migration-strategy.test.ts`
  - Diff integration test: `platform/packages/database/tests/integration/migration-diff.test.ts`

---

## 2026-07-03

### Completed

- **Phase 1 — Final Solana Audit Completed**

  Comprehensive security and architecture review of the `funrun_v2` Anchor program (v1.0.0-rc1).

  **Summary:**

  - Program architecture reviewed across 13 instructions, 5 PDA account types, and 9 external CPIs
  - 20 on-chain security invariants documented and verified
  - 544 unit tests passing (0 failures)
  - 28 graduation simulation tests covering all 35 `complete_graduation` steps
  - 17/17 devnet smoke tests passing
  - Audit package published: `anchor/docs/AUDIT_PACKAGE.md`
  - Operator runbook published: `anchor/docs/OPERATOR_RUNBOOK.md`
  - Protocol reference published: `anchor/docs/PROTOCOL_REFERENCE.md`
  - Release candidate tagged: `v1.0.0-rc1`

  **Critical Findings:**

  | ID | Finding | Severity | Description |
  |---|---|---|---|
  | **H-1** | Sell Execution Order | High | Sell handler CPI ordering must ensure fee transfers precede direct lamport manipulation; state writes must not create solvency windows between CPI steps |
  | **M-1** | Live Graduation Validation | Medium | `complete_graduation` Raydium CPI not testable on devnet; requires mandatory mainnet validation before production |
  | **M-2** | Multisig | Medium | Single admin key — no on-chain multisig enforced; admin compromise enables fee manipulation and protocol pause |
  | **M-3** | Admin Rotation | Medium | No admin key rotation instruction; lost admin key permanently disables admin functions |
  | **M-4** | Compute Budget | Medium | `complete_graduation` requires ~1,400,000 CU; callers must set compute budget or tx will fail |
  | **M-6** | Treasury Analytics | Medium | Off-chain treasury tracking and sweep analytics need dedicated monitoring before mainnet |

  **Status:** Pass with Required Fixes

---

## 2026-07-03

### Completed

- Protocol frozen at RC1 — no further instruction or economic changes before mainnet
- Devnet program deployed: `HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP`
- Binary size: 614,896 bytes; Anchor 0.31.1; Solana SBF target

### Changed

- Documentation deliverables consolidated under `anchor/docs/`
- `PROTOCOL_VERSION` guard active — prevents graduation of stale bonding curves

### Security

- 10 threat scenarios documented in audit package
- Lamport and token accounting proofs included
- Post-CPI assertion suite (14 checks) for graduation flow

### Performance

- Instruction CU budgets documented per instruction
- `buy` / `sell`: 80,000 CU; `create_coin`: 200,000 CU; `complete_graduation`: 1,400,000 CU

---

## 2026-06 — Platform Foundation

### Completed

- Production platform monorepo scaffolded (`platform/`)
- Auth service: JWT, RBAC, API keys, session store
- Indexer service: Solana subscriber, event parser, candle builder
- WS Gateway: Redis pub/sub, subscription manager, presence tracking
- Trading service: Anchor client, tx lifecycle, graduation executor (in progress)
- API Gateway: Fastify entry point with CORS and health checks
- Prisma database package with migrations
- Docker Compose dev and prod configurations
- CI pipeline (GitHub Actions)

### Changed

- Frontend migrated from single `App.jsx` to page-based architecture
- Privy auth integration for Google OAuth + embedded Solana wallets

---

## 2026-05 — Legacy Backend Hardening

### Completed

- Security hardening on legacy Express backend
- Atomic claims, withdraw idempotency, kill switch
- Startup reconciliation, secrets fail-fast
- Phase 0 solvency migration (`run_tokens` separated from `run_balance`)

### Fixed

- Frontend RUN card display (`runTokens` from DB)
- Withdrawals gated (`WITHDRAWALS_ENABLED=0`)

### Security

- AES-256-GCM mnemonic encryption (migrated from CBC)
- Rate limits: mnemonic reveal 5/min, trades 60/min, withdrawals 10/min
- Verification scripts added (`backend/scripts/verify-*.mjs`)

---

*For live status of open findings, see `PROJECT_STATUS.md`.*
