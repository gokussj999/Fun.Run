# AI_HANDOFF.md

> **Instant Context for AI Agents** — Read this file first when resuming work on FUN.RUN.

---

## Quick Resume

| Field | Value |
|---|---|
| **Current Phase** | Phase 3 — Backend Remediation |
| **Current Task** | **Phase 2 Backend Audit** (next certification gate) |
| **Last Completed** | Sprint 7 — Platform Completion (2026-07-10) |
| **Blocked By** | Nothing for devnet engineering; live cert needs stack |

---

## Resume From Here

```
1. Read PROJECT_STATUS.md      → Sprint 7 complete
2. Read DEVNET_E2E.md          → live validation runbook (no legacy backend)
3. Start Phase 2 Backend Audit → gateway auth inventory, load cert
4. Do NOT touch anchor/        → protocol frozen
```

---

## Sprint 7 Summary (Complete ✅)

### Architecture

```
Frontend → API Gateway :3000 → Trading Service :3003 (trade + platform routes)
Frontend → WS Gateway :3001/ws
Trading → Solana devnet (buy/sell/create on-chain)
Indexer → DB + Redis → WS Gateway
Legacy backend :5000 → NOT in platform path
```

### Key Files

| Component | Path |
|---|---|
| Platform routes | `platform/services/trading/src/routes/platform.ts` |
| Create coin | `platform/services/trading/src/executors/create-coin-executor.ts` |
| Deposit scanner | `platform/services/trading/src/wallet/deposit-scanner.ts` |
| Gateway proxy | `platform/apps/api-gateway/src/plugins/proxy-trading.ts` |
| Frontend API | `frontend/src/services/platform-api.js` |

### Gateway Routes (Sprint 7)

All `/api/v1/market|profile|wallet|coins|rewards|referral|trade/*` → **trading service**.

---

## Test Commands

```bash
cd platform && pnpm test          # 303 tests
node platform/scripts/sprint6-smoke-frontend.mjs
```

---

*Last updated: 2026-07-10 · Sprint 7*
