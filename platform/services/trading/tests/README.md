# Phase 8.5.9J — Load Testing & Security Validation

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| k6   | ≥ 0.50  | Load tests |
| Node | ≥ 20    | Security tests (`node:test`, `node:crypto`) |
| ws   | ≥ 8     | Fault injection WS tests (`npm i -D ws`) |

Install k6: https://k6.io/docs/get-started/installation/

---

## Environment Variables

Copy and fill in before running:

```sh
export TRADING_URL=http://localhost:3003   # Trading service (Fastify)
export BACKEND_URL=http://localhost:5000   # Backend monolith (Express)
export METRICS_URL=http://localhost:9090   # Monitoring server (Prometheus)
export AUTH_TOKEN=<privy_jwt>             # Valid Privy auth token
export COIN_ID=<uuid>                     # Active coin for trade tests
export WS_URL=ws://localhost:5000         # WebSocket endpoint
```

---

## Load Tests (k6)

### Concurrent Buy & Sell

```sh
k6 run \
  -e TRADING_URL=$TRADING_URL \
  -e AUTH_TOKEN=$AUTH_TOKEN \
  -e COIN_ID=$COIN_ID \
  tests/load/concurrent-trades.k6.js
```

Scenarios: 50 VUs buying (60s) → 25 VUs selling (60s) → rate-limit burst (30s)  
Pass: `trade_success_rate > 80%`, `p95 < 3s`, `p99 < 5s`

### Idempotency Stress (SEC-02 fix validation)

```sh
k6 run \
  -e TRADING_URL=$TRADING_URL \
  -e AUTH_TOKEN=$AUTH_TOKEN \
  -e COIN_ID=$COIN_ID \
  tests/load/idempotency-stress.k6.js
```

20 VUs all racing with the same `Idempotency-Key`.  
Pass: `idempotency_conflict_409 > 0`, zero double-executions.

### Graduation Stress

```sh
k6 run \
  -e TRADING_URL=$TRADING_URL \
  -e BACKEND_URL=$BACKEND_URL \
  -e AUTH_TOKEN=$AUTH_TOKEN \
  -e COIN_IDS=uuid1,uuid2,uuid3 \
  tests/load/graduation-stress.k6.js
```

Pass: `graduation_double == 0`

### RPC Failover

```sh
k6 run \
  -e TRADING_URL=$TRADING_URL \
  -e METRICS_URL=$METRICS_URL \
  -e AUTH_TOKEN=$AUTH_TOKEN \
  -e COIN_ID=$COIN_ID \
  tests/load/rpc-failover.k6.js
```

Manually block/unblock the primary RPC during the `degraded` scenario.  
Pass: no 500 cascades during degradation, trades succeed after recovery.

### Fault Injection (WebSocket, Redis, DB, Reconciler)

```sh
node tests/load/fault-injection.js
```

---

## Security Tests (Node.js `node:test`)

### Run all security tests at once

```sh
node --test tests/security/*.test.mjs
```

### Auth Validation

```sh
node --test \
  -e TRADING_URL=$TRADING_URL \
  -e VALID_TOKEN=$AUTH_TOKEN \
  -e COIN_ID=$COIN_ID \
  tests/security/auth-validation.test.mjs
```

### Double-Spend / Idempotency (SEC-02 validation)

```sh
node --test \
  -e TRADING_URL=$TRADING_URL \
  -e AUTH_TOKEN=$AUTH_TOKEN \
  -e COIN_ID=$COIN_ID \
  tests/security/double-spend.test.mjs
```

### Wallet Encryption

```sh
node --test \
  -e BACKEND_URL=$BACKEND_URL \
  -e AUTH_TOKEN=$AUTH_TOKEN \
  tests/security/wallet-encryption.test.mjs
```

### Rate Limit & DoS

```sh
node --test \
  -e TRADING_URL=$TRADING_URL \
  -e BACKEND_URL=$BACKEND_URL \
  -e AUTH_TOKEN=$AUTH_TOKEN \
  -e COIN_ID=$COIN_ID \
  tests/security/rate-limit.test.mjs
```

### Input Validation

```sh
node --test \
  -e TRADING_URL=$TRADING_URL \
  -e BACKEND_URL=$BACKEND_URL \
  -e AUTH_TOKEN=$AUTH_TOKEN \
  -e COIN_ID=$COIN_ID \
  tests/security/input-validation.test.mjs
```

### Secret Scan (static analysis, no services needed)

```sh
node tests/security/secret-scan.mjs
```

Exits with code 1 if CRITICAL or HIGH patterns are found in source files.

---

## Backend-Specific Tests

```sh
node --test \
  -e BACKEND_URL=$BACKEND_URL \
  -e AUTH_TOKEN=$AUTH_TOKEN \
  backend/tests/security/wallet-route.test.mjs
```

---

## Interpreting Results

| Result | Meaning |
|--------|---------|
| `trade_success_rate < 80%` | Too many non-429 failures — investigate executor logs |
| `idempotency_conflict_409 == 0` | SEC-02 fix may not be active — check Redis connection |
| `graduation_double > 0` | **CRITICAL** — GraduationCrank double-graduated a coin |
| Secret scan exit 1 | Hardcoded secret found — must be rotated before mainnet |
| `wallet-route` test fails with 200 | Unauthenticated wallet route is live — delete routes/wallet.js immediately |
