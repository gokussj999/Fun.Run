# DEVNET_E2E.md — updated Sprint 7

> Sprint 7 — Platform completion (native trading routes, no legacy proxy).

## Prerequisites

| Item | Value |
|------|-------|
| Solana network | Devnet |
| Program ID | `HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP` |
| `TRADING_MODE` | `onchain` |
| Frontend | `VITE_USE_PLATFORM=1` (default), `VITE_WS_URL=ws://localhost:3001/ws` |
| Services | PostgreSQL, Redis, **trading :3003**, indexer, ws-gateway, api-gateway :3000 |

**Note:** Legacy backend `:5000` is **no longer required** for platform flows.

## 1. Start infrastructure

```bash
cd platform
cp .env.example .env
# Fill: DATABASE_URL, REDIS_URL, PRIVY_*, TREASURY_PRIVATE_KEY, MNEMONIC_ENCRYPTION_KEY

docker compose -f docker-compose.prod.yml up -d
```

Start frontend:

```bash
cd frontend
# .env.local: VITE_API_BASE= (empty — vite proxies /api → gateway)
npm run dev
```

## 2. Cross-system smoke

```bash
cd platform
node scripts/smoke-cross-system.mjs
node scripts/sprint6-smoke-frontend.mjs
```

## 3. Flow matrix (Sprint 6)

| Flow | Platform REST | WS Channels |
|------|---------------|-------------|
| Create coin | `POST /api/v1/coins` | `market`, `creator:{w}`, `notifications:{w}` |
| Deposit | Profile `depositAddress` + background scanner | — |
| Withdraw | `POST /api/v1/wallet/withdraw` | — |
| Buy | `POST /api/v1/trade/buy` | `trades:{mint}`, `portfolio:{w}` |
| Sell | `POST /api/v1/trade/sell` | `trades:{mint}`, `portfolio:{w}` |
| Portfolio | `GET /api/v1/profile/:wallet` | `portfolio:{wallet}` |
| Creator | `GET /api/v1/profile/:wallet` | `creator:{wallet}` |
| Referral | `POST /api/v1/referral/bind` | `referral:{wallet}` |
| Notifications | — | `notifications:{wallet}` |

## 4. Execute buy via API Gateway

```bash
export GATEWAY_URL=http://localhost:3000
export AUTH_TOKEN=<privy-jwt>
export COIN_ID=<coin-uuid>

curl -s -X POST "$GATEWAY_URL/api/v1/trade/buy" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Idempotency-Key: devnet-e2e-$(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "coinId": "'"$COIN_ID"'",
    "solAmountLamports": "10000000",
    "minTokensOut": "0",
    "slippageBps": 500
  }' | jq .
```

## 5. Execute sell

```bash
curl -s -X POST "$GATEWAY_URL/api/v1/trade/sell" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Idempotency-Key: devnet-sell-$(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "coinId": "'"$COIN_ID"'",
    "tokenAmountRaw": "1000000",
    "minSolOut": "0",
    "slippageBps": 500
  }' | jq .
```

## 6. Verify indexer wrote the trade

```bash
node scripts/verify-trade-indexed.mjs --signature <signature> --max-wait-ms 120000
```

## 7. Verify WebSocket channels (ws-gateway protocol)

Connect to `ws://localhost:3001/ws`:

```json
{"type":"auth","id":"1","token":"<privy-jwt>"}
{"type":"subscribe","id":"2","channel":"trades:<mintAddress>","fromSeq":0}
{"type":"subscribe","id":"3","channel":"portfolio:<walletAddress>","fromSeq":0}
{"type":"subscribe","id":"4","channel":"creator:<creatorWallet>","fromSeq":0}
{"type":"subscribe","id":"5","channel":"notifications:<walletAddress>","fromSeq":0}
```

## 8. Load baseline

```bash
DRY_RUN=true node scripts/load-baseline.mjs
CONCURRENCY=100 node scripts/load-baseline.mjs
```

## 9. Frontend validation checklist

- [ ] Login via Privy → profile loads via `/api/v1/profile/:wallet`
- [ ] Deposit address visible in profile
- [ ] Buy/sell from coin page → gateway trade endpoints
- [ ] Portfolio refreshes on `portfolio:{wallet}` WS event
- [ ] Creator dashboard updates on `creator:{wallet}` WS event
- [ ] Referral dashboard updates on `referral:{wallet}` WS event
- [ ] Toast on `notifications:{wallet}` event
- [ ] Create coin → `/api/v1/coins`
- [ ] Withdraw → `/api/v1/wallet/withdraw`

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Gateway 502 on profile/coins | Trading service :3003 running; check `TRADING_SERVICE_URL` |
| WS auth fails | Privy JWT, ws-gateway `PRIVY_*` env |
| No portfolio events | Indexer trade handler logs |
| Frontend CORS | Gateway allows `localhost:5173` |

---

*Last updated: 2026-07-10 · Sprint 6*
