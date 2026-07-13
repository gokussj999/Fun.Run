# Devnet End-to-End Runbook

> Sprint 5 — Full cross-system integration validation.

## Prerequisites

| Item | Value |
|------|-------|
| Solana network | Devnet |
| Program ID | `HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP` |
| `TRADING_MODE` | `onchain` (platform) or `offchain` (legacy DB AMM) |
| Services | PostgreSQL, Redis, trading, indexer, ws-gateway, api-gateway |

## 1. Start infrastructure

```bash
cd platform
cp .env.example .env
# Fill: DATABASE_URL, REDIS_URL, PRIVY_*, TREASURY_PRIVATE_KEY, MNEMONIC_ENCRYPTION_KEY

docker compose -f docker-compose.prod.yml up -d
```

## 2. Cross-system smoke

```bash
node scripts/smoke-cross-system.mjs
```

Checks: gateway, trading, indexer `:9091/readyz`, ws-gateway `:3002/readyz`, quote proxy.

## 3. Flow matrix (Sprint 5)

| Flow | Platform Path | Legacy Path | WS Channels |
|------|---------------|-------------|-------------|
| Create coin | Indexer `CoinCreated` event | `POST /coin/create` | `market`, `creator:{w}`, `notifications:{w}` |
| Deposit | — | Background scanner → `run_balance` | — |
| Withdraw | — | `POST /withdraw` | — |
| Buy | `POST /api/v1/trade/buy` | `POST /coin/buy` | `trades:{mint}`, `portfolio:{w}` |
| Sell | `POST /api/v1/trade/sell` | `POST /coin/sell` | `trades:{mint}`, `portfolio:{w}` |
| Claim fees | Indexer `CreatorFeesClaimed` | `POST /claim` | `creator:{w}`, `referral:{w}` |
| Portfolio | Indexer holding upsert | `GET /profile/:wallet` | `portfolio:{wallet}` |
| Holdings | Indexer trade handler | `GET /profile/:wallet` | `holders:{mint}` |

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
    "tokenAmount": "1000000",
    "minSolOut": "0",
    "slippageBps": 500
  }' | jq .
```

## 6. Verify indexer wrote the trade

```bash
export DATABASE_URL=postgresql://funrun:secret@localhost:5432/funrun
node scripts/verify-trade-indexed.mjs --signature <signature> --max-wait-ms 120000
```

## 7. Verify WebSocket channels

Connect to `ws://localhost:3001/ws` using ws-gateway protocol:

```json
{"type":"auth","id":"1","token":"<privy-jwt>"}
{"type":"subscribe","id":"2","channel":"trades:<mintAddress>","fromSeq":0}
{"type":"subscribe","id":"3","channel":"portfolio:<walletAddress>","fromSeq":0}
{"type":"subscribe","id":"4","channel":"creator:<creatorWallet>","fromSeq":0}
{"type":"subscribe","id":"5","channel":"notifications:<walletAddress>","fromSeq":0}
```

Expected events after buy: `trade_buy` on `trades:`, `portfolio_updated` on `portfolio:`, `trade_buy` notification.

## 8. Load baseline

```bash
# Dry-run (no services required)
DRY_RUN=true node scripts/load-baseline.mjs

# Live (100 concurrent quote requests)
CONCURRENCY=100 node scripts/load-baseline.mjs
```

## 9. Rollback

Set `TRADING_MODE=offchain` and restart trading service for legacy DB AMM behavior.

## Publisher channels (Sprint 5)

| Redis Channel | WS Channel | Trigger |
|---------------|------------|---------|
| `events:coin_created` | `market` | CoinCreated indexed |
| `events:creator:{wallet}` | `creator:{wallet}` | Fee earned / claim / launch |
| `events:referral:{wallet}` | `referral:{wallet}` | Referral fee / claim / bind |
| `events:portfolio:{wallet}` | `portfolio:{wallet}` | Buy/sell holding update |
| `events:notifications:{wallet}` | `notifications:{wallet}` | Trade, claim, launch alerts |
| `events:fee_claimed` | `admin` | Creator/referrer claims |
| `events:treasury_sweep` | `treasury` | TreasurySweep indexed |
| `price:{mint}` | `trades:`, `candles:`, `holders:`, `coin:` | Trade indexed |

## Troubleshooting

| Symptom | Check |
|---------|-------|
| No portfolio WS events | Indexer trade handler `publishPortfolioUpdate` logs |
| Creator channel empty | Verify `events:creator:{wallet}` in Redis MONITOR |
| Frontend no events | Verify `VITE_WS_URL=ws://localhost:3001/ws`, Privy JWT auth |
| Gateway 502 on profile/coins | Trading service :3003; check `TRADING_SERVICE_URL` |

---

*Last updated: 2026-07-10 · Sprint 6*
