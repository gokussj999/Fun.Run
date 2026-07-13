# ROADMAP.md

> **Master Roadmap** — FUN.RUN platform certification and launch sequence.  
> One phase at a time. No mainnet until Phase 8 is complete.

---

# Project Goal

**Build the most professional Solana Launchpad that surpasses Pump.fun.**

Success criteria:

- On-chain protocol audited and certified
- Backend microservices production-hardened
- Frontend UX polished and mobile-responsive
- Cross-system integration verified end-to-end
- Mainnet deployment with multisig governance and monitoring

---

# Phase Overview

| Phase | Name | Status |
|---|---|---|
| **Phase 1** | Final Solana Audit | ✅ Completed |
| **Phase 2** | Backend Audit | ⏳ Pending |
| **Phase 3** | Backend Security | ⏳ Pending |
| **Phase 4** | Frontend Audit | ⏳ Pending |
| **Phase 5** | UI/UX Audit | ⏳ Pending |
| **Phase 6** | Cross-System Audit | ⏳ Pending |
| **Phase 7** | Deployment Audit | ⏳ Pending |
| **Phase 8** | Mainnet Certification | ⏳ Pending |

---

# Phase 1 — Final Solana Audit

**Status:** ✅ **Completed**

Comprehensive review of the frozen `funrun_v2` Anchor program (RC1).

## Checklist

- [x] Program architecture reviewed (`anchor/docs/AUDIT_PACKAGE.md`)
- [x] 13 instructions documented with CU budgets
- [x] 20 security invariants verified
- [x] 544 unit tests passing
- [x] 28 graduation simulation tests passing
- [x] Devnet smoke tests (17/17 passing)
- [x] PDA signer pattern validated
- [x] Fee split math verified (40/40/20)
- [x] Threat model documented (10 scenarios)
- [x] Known limitations catalogued
- [x] Operator runbook published
- [x] Protocol reference published
- [x] Release candidate tagged (`v1.0.0-rc1`)

## Outcome

**Pass with Required Fixes** — see `CHANGELOG.md` for H-1 and M-series findings.

---

# Phase 2 — Backend Audit

**Status:** ⏳ **Pending**

Audit of the production platform (`platform/`) and legacy backend (`backend/`).

## Checklist

- [ ] API Gateway route inventory and auth coverage
- [ ] Auth service: JWT lifecycle, RBAC, API key scoping, replay protection
- [ ] Trading service: tx state machine, idempotency, double-spend guards
- [ ] Indexer: event parsing accuracy, reorg handling, backfill correctness
- [ ] WS Gateway: subscription auth, rate limits, presence tracking
- [ ] Database schema review (Prisma migrations + legacy SQL)
- [ ] Redis usage audit (cache TTLs, pub/sub channels, BullMQ jobs)
- [ ] Legacy backend parity check during migration
- [ ] Error handling — no internal detail leakage
- [ ] Rate limit coverage on all mutating endpoints
- [ ] Audit log completeness for money movements
- [ ] Integration tests for service-to-service calls
- [ ] Load test baseline (k6 scripts in `platform/services/trading/tests/load/`)
- [ ] Documentation of all environment variables
- [ ] Final audit report published

---

# Phase 3 — Backend Security

**Status:** ⏳ **Pending**

Security hardening based on Phase 2 findings.

## Checklist

- [ ] Secret management review (no keys in repo, fail-fast on missing env)
- [ ] CORS policy locked to production origins
- [ ] Helmet / security headers on all HTTP services
- [ ] SQL injection prevention verified (parameterized queries only)
- [ ] SSRF protection on external URL fetches
- [ ] Input validation on all endpoints (Zod schemas)
- [ ] Service-to-service auth (mTLS or signed tokens)
- [ ] Redis AUTH enforced in production
- [ ] PostgreSQL TLS enforced
- [ ] Mnemonic encryption audit (AES-256-GCM, key rotation path)
- [ ] Withdrawal gates and kill-switch verification
- [ ] Idempotency store tamper resistance
- [ ] Security test suite green (`tests/security/`)
- [ ] Dependency vulnerability scan (npm audit / cargo audit)
- [ ] Penetration test report (external or internal red team)

---

# Phase 4 — Frontend Audit

**Status:** ⏳ **Pending**

Code and architecture review of `frontend/`.

## Checklist

- [ ] No business logic in frontend (display + signing only)
- [ ] Privy integration: auth flows, wallet creation, session handling
- [ ] API client: error handling, retry logic, auth header injection
- [ ] WebSocket client: reconnect, subscription cleanup
- [ ] Trade preview matches backend/on-chain math
- [ ] No secrets in client bundle (env var audit)
- [ ] XSS prevention (no `dangerouslySetInnerHTML` without sanitization)
- [ ] CSRF not applicable (Bearer auth) — verify
- [ ] Route/navigation state management review
- [ ] Bundle size analysis and code-splitting
- [ ] ESLint clean (`npm run lint`)
- [ ] Accessibility baseline (ARIA, keyboard nav)
- [ ] PWA manifest and service worker review

---

# Phase 5 — UI/UX Audit

**Status:** ⏳ **Pending**

Design and user experience review.

## Checklist

- [ ] Landing page: value prop, CTA, trust signals
- [ ] Home / coin discovery: sorting, filters, hot coins
- [ ] Coin detail page: chart, trade panel, holders, activity feed
- [ ] Create coin flow: validation, fee display, success state
- [ ] Portfolio page: holdings, PnL, history
- [ ] Creator dashboard: earnings, coin management
- [ ] Referral dashboard: link sharing, earnings breakdown
- [ ] Admin dashboard: protocol controls (read-only until mainnet)
- [ ] Mobile responsive on all pages
- [ ] Dark/light theme consistency
- [ ] Loading states and skeleton screens
- [ ] Error states and empty states
- [ ] Toast/notification patterns
- [ ] Typography and spacing token audit (`frontend/src/styles/tokens.css`)
- [ ] User testing session (≥ 5 participants)

---

# Phase 6 — Cross-System Audit

**Status:** ⏳ **Pending**

End-to-end integration verification across all layers.

## Checklist

- [ ] Create coin: frontend → trading service → on-chain → indexer → DB → WS
- [ ] Buy flow: quote → sign → submit → confirm → index → candle → WS push
- [ ] Sell flow: same as buy with solvency verification
- [ ] Fee claim: creator and referrer paths
- [ ] Graduation: initiate → complete → indexer → WS → frontend update
- [ ] Auth: login → session → protected API → WS auth
- [ ] Portfolio: DB holdings match on-chain token accounts
- [ ] Candle data: indexer OHLCV matches trade history
- [ ] Reorg / missed slot recovery tested
- [ ] RPC failover tested (`health-manager.ts`)
- [ ] Concurrent trade stress test (k6)
- [ ] Graduation stress test (k6)
- [ ] Legacy backend ↔ platform migration data integrity
- [ ] Full regression test script documented

---

# Phase 7 — Deployment Audit

**Status:** ⏳ **Pending**

Infrastructure and deployment readiness.

## Checklist

- [ ] Docker images: multi-stage builds, non-root user, minimal attack surface
- [ ] Docker Compose prod config reviewed (`platform/docker-compose.prod.yml`)
- [ ] Kubernetes manifests (if applicable) — resource limits, probes, HPA
- [ ] CI/CD pipeline: build, test, lint, typecheck on every PR
- [ ] Database migration strategy (zero-downtime)
- [ ] Redis persistence config (AOF, maxmemory policy)
- [ ] Backup and restore procedure for PostgreSQL
- [ ] Log aggregation (JSON → centralized store)
- [ ] Prometheus metrics scraped from all services
- [ ] Alert rules configured (`monitoring/alerts.yaml`)
- [ ] SSL/TLS termination
- [ ] CDN for frontend static assets
- [ ] Environment separation (dev / staging / prod)
- [ ] Rollback procedure documented and tested
- [ ] Disaster recovery runbook

---

# Phase 8 — Mainnet Certification

**Status:** ⏳ **Pending**

Final gate before public mainnet launch.

## Checklist

- [ ] All Phase 1–7 checklists complete
- [ ] H-1 and all M-series findings resolved or accepted with mitigation
- [ ] External security audit complete (no unresolved critical/high)
- [ ] `complete_graduation` live-tested on mainnet (low-liquidity test coin)
- [ ] Admin keypair on hardware wallet
- [ ] Upgrade authority on multisig (or burned for immutability)
- [ ] Fee recipient on cold multisig
- [ ] Off-chain graduation monitor deployed
- [ ] Mainnet program deployed with verified binary hash
- [ ] Solvency monitor active
- [ ] Soft launch with transaction limits
- [ ] Incident response plan published
- [ ] Public launch announcement

---

# After Mainnet — Platform Services

Post-certification feature completion and operational maturity.

## Wallet Service

**Status:** ⏳ Not started

- [ ] Privy self-custodial wallet provisioning
- [ ] Custodial → self-custodial migration path
- [ ] Balance sync (on-chain ↔ DB)
- [ ] Deposit detection and confirmation
- [ ] Withdrawal with dual-gate (entitlement + on-chain balance)
- [ ] Mnemonic export (rate-limited, audit-logged)
- [ ] Phase out legacy encrypted mnemonic storage

## Coin Service

**Status:** ⏳ Not started

- [ ] Coin metadata CRUD (name, symbol, image, description)
- [ ] IPFS image upload and pinning
- [ ] Coin discovery API (sort, filter, search)
- [ ] Trending / hot coins algorithm
- [ ] Coin analytics (volume, holders, market cap)
- [ ] Graduation status tracking

## Portfolio Service

**Status:** ⏳ Not started

- [ ] User holdings aggregation
- [ ] PnL calculation (realized + unrealized)
- [ ] Trade history with pagination
- [ ] Creator earnings summary
- [ ] Referral earnings summary
- [ ] Export (CSV / JSON)

## Workers

**Status:** ⏳ Not started

- [ ] Graduation crank (monitor threshold → initiate/complete)
- [ ] Tx reconciler (stuck tx recovery)
- [ ] Solvency monitor (obligations vs real SOL)
- [ ] Candle backfill worker
- [ ] Deposit scanner
- [ ] Treasury sweep scheduler
- [ ] Dead letter queue processor

## Admin Platform

**Status:** ⏳ Not started

- [ ] Protocol pause/unpause UI
- [ ] Fee configuration UI
- [ ] Treasury sweep UI
- [ ] User lookup and support tools
- [ ] Audit log viewer
- [ ] System health dashboard
- [ ] Kill-switch controls
- [ ] RBAC admin role management

---

# Protocol Development (Historical — Frozen)

The on-chain protocol phases are **complete and frozen**:

| Protocol Phase | Status |
|---|---|
| Phase 0 — Foundation | ✅ |
| Phase 1 — Admin System | ✅ |
| Phase 2 — Creator & Referral | ✅ |
| Phase 3 — Coin Creation | ✅ |
| Phase 4 — AMM Trading | ✅ |
| Phase 5 — Fee Claim | ✅ |
| Phase 6 — Graduation | ✅ |
| Phase 7 — Devnet Deployment | ✅ |

See `anchor/RELEASE_RC1.md` and `anchor/docs/PROTOCOL_REFERENCE.md` for details.

---

*Last updated: 2026-07-10 · See also `PROJECT_STATUS.md` for live progress*
