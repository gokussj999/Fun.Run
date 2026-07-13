# PROJECT_STATUS.md

> **Live Project Status** — Updated by humans and AI agents after each significant milestone.

---

## Overall Progress

```
██████████████████████████████████████████████████████  100%
```

| Metric | Value |
|---|---|
| **Overall Progress** | **100%** (Sprint 7 engineering) |
| **Protocol (On-Chain)** | 100% — Frozen RC1 |
| **Platform Backend** | 100% — Sprint 1–7 complete |
| **Frontend Integration** | ~98% — Platform REST + ws-gateway; on-chain create wired |
| **Cross-System E2E** | ~90% — Structural + smoke; live devnet needs stack |
| **Audits & Certification** | ~50% — Phase 2–8 audits pending |
| **Mainnet Readiness** | Blocked on audits + M-1 graduation validation |

---

## Current Phase

| Field | Value |
|---|---|
| **Phase** | **Phase 3 — Backend Remediation** |
| **Status** | Sprint 7 ✅ Complete |
| **Completed** | 2026-07-10 |

---

## Sprint 7 Deliverables ✅

- [x] Native **Create Coin** — `CreateCoinExecutor` + orchestrator + `POST /coins` on trading service
- [x] Native **platform routes** — market, profile, wallet, withdraw, claim, referral on trading `:3003`
- [x] **Deposit scanner** — background worker credits `run_balance_sol` via Solana RPC
- [x] **Gateway rewire** — all `/api/v1/*` platform routes → trading service (legacy proxy removed)
- [x] **Prisma** — Deposit, DepositScan, Withdrawal + profile balance fields (squashed into baseline)
- [x] **Frontend** — on-chain create response handling (`normalizeCreateResponse`)
- [x] **Tests** — 303/303 platform tests passing; Sprint 7 structural matrix
- [x] **Docs** — DEVNET_E2E updated (legacy backend no longer required)

---

## E2E Flow Status

| Flow | Platform REST | WS Events |
|---|---|---|
| Create Coin | ✅ on-chain `/api/v1/coins` | ✅ market, creator, notifications |
| Deposit | ✅ trading deposit-scanner | — |
| Withdraw | ✅ `/api/v1/wallet/withdraw` | — |
| Buy | ✅ `/api/v1/trade/buy` | ✅ trades, portfolio |
| Sell | ✅ `/api/v1/trade/sell` | ✅ trades, portfolio |
| Portfolio | ✅ `/api/v1/profile/:wallet` | ✅ portfolio:{wallet} |
| Creator Dashboard | ✅ profile + WS | ✅ creator:{wallet} |
| Referral Dashboard | ✅ bind + WS | ✅ referral:{wallet} |
| Notifications | ✅ WS | ✅ notifications:{wallet} |
| Frontend WS | ✅ ws-gateway protocol | ✅ |

---

## Remaining (Post-Sprint 7)

| Item | Notes |
|---|---|
| Live devnet certification | Requires docker stack + Privy JWT + funded devnet wallets |
| Phase 2 Backend Audit | Next certification gate |
| Reward accrual indexer | `creatorRewardsSol` / `referralRewardsSol` accrual from trade fees (claim route exists) |
| Mnemonic reveal | Platform returns 501 — intentional disable |
| Legacy `backend/server.js` | Retained for reference; not in platform request path |

---

*Last updated: 2026-07-10 · Sprint 7 complete*
