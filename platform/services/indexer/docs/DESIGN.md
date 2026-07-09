# Phase 8.3 — Blockchain Indexer Design

## 1. Overview

The **Blockchain Indexer** is a stateful Node.js service that bridges the Fun.Run Anchor
program on Solana with the PostgreSQL database used by the API gateway.

It has two concurrent modes:

| Mode | Source | When |
|---|---|---|
| **Live** | WebSocket `onLogs` subscription | Always running |
| **Backfill** | RPC `getSignaturesForAddress` | On startup and WS reconnect |

Both modes produce `ParsedEvent` objects that flow through the same `EventProcessor` pipeline.

---

## 2. Component Map

```
Solana Network
├─ WebSocket (confirmed)
│    └─ LogSubscriber ──────────────────────────────────────────┐
│                                                               │
└─ RPC (confirmed / finalized)                                  │
     ├─ SlotTracker   ─── finalized slot pointer                │
     └─ TransactionFetcher ── BackfillOrchestrator              │
                                      │                         │
                                      ▼                         ▼
                               parseEvents()  ◄─── parseEvents()
                                      │
                                      ▼
                              EventProcessor
                            (Redis NX dedup gate)
                                      │
                    ┌─────────────────┼──────────────────────┐
                    ▼                 ▼                       ▼
             CoinCreated         Buy / Sell          Graduation / Fees
             handler             handler             handler
                    └─────────────────┼──────────────────────┘
                                      │
                              db.$transaction
                          (coin + trades + holdings
                           + candles + treasuryEvent)
                                      │
                                      ▼
                            CursorManager.advance()
                                      │
                              RedisPublisher
                           (price:mint  channels)
```

---

## 3. Event Flow

```
Solana tx confirmed
      │
      ▼
 onLogs callback fires (WebSocket)
      │
      ├── err != null?  → discard (failed tx)
      │
      └── extractEventsFromLogs(logs)
            │
            ├── base64 decode each "Program data:" line
            ├── check discriminator[0..8] against DISCRIMINATOR_TO_EVENT map
            └── decode payload with BorshReader
                    │
                    ▼
              ParsedEvent[]
                    │
                    ▼
          EventProcessor.processEvent(event)
                    │
                    ├── Redis SET NX  indexer:sig:<signature>  EX 604800
                    │      null?  → already seen → SKIP
                    │
                    └── dispatch(event.name)
                           │
                           ├── CoinCreated  → coin.create (idempotent: findUnique check)
                           ├── Buy/Sell     → transaction.create + coin.update + holding.upsert
                           │                  + upsertCandles (6 TFs) + publish price:mint
                           ├── Graduation   → coin.update status + publish graduation:mint
                           ├── Fees         → treasuryEvent.create + coin.update
                           └── Informational → no-op
```

---

## 4. Database Write Flow (Buy event example)

```
db.$transaction(async tx => {
  1. tx.coin.findUnique(mintAddress)          → get coin.id
  2. tx.profile.upsert(buyer)                 → ensure profile exists
  3. tx.transaction.create(...)               → append-only trade log
  4. tx.coin.update(reserves, version++)      → update bonding curve state
  5. tx.holding.upsert(buyer, coinId, ...)    → update token balance
  6. tx.treasuryEvent.create(treasuryFee)     → fee accounting
  7. upsertCandles(coinId, price, volume)     → 6× raw SQL INSERT ON CONFLICT
})
```

All 7 writes are in a single Prisma interactive transaction. If any step fails, the
entire transaction rolls back. The Redis dedup key is deleted on failure so the retry
system can reclaim the event.

---

## 5. Candle Upsert SQL

```sql
INSERT INTO candles (id, coin_id, timeframe, open_time, open, high, low, close, volume, trades, updated_at)
VALUES (gen_random_uuid(), $coinId, $tf, $bucket, $price, $price, $price, $price, $volume, 1, NOW())
ON CONFLICT (coin_id, timeframe, open_time) DO UPDATE SET
  high       = GREATEST(candles.high, EXCLUDED.high),
  low        = LEAST(candles.low, EXCLUDED.low),
  close      = EXCLUDED.close,
  volume     = candles.volume + EXCLUDED.volume,
  trades     = candles.trades + 1,
  updated_at = NOW()
```

**Why `close = EXCLUDED.close` (not GREATEST)?**
Events arrive in slot order. The last write in a time bucket IS the most recent trade — so
`EXCLUDED.close` (the incoming value) is always the correct close price.

**Why raw SQL instead of Prisma `upsert`?**
Prisma doesn't support `GREATEST`/`LEAST` in `onConflict` update clauses. Raw SQL is
necessary for atomic high/low updates.

---

## 6. Cursor Persistence

```
In-memory cursor (CursorManager)
  advance(slot, sig)  →  dirty = true
  periodic flush every 2s  →  CursorStore.write()
         │
         ├─ DB: indexerState.upsert(id='singleton')   ← durable
         └─ Redis: SET indexer:cursor EX 300          ← fast read cache

On startup:
  CursorStore.read()
    1. Redis GET → parse
    2. DB fallback (if Redis miss or invalid)
```

Worst-case data loss on crash: 2 seconds of cursor progress. The event dedup key in Redis
(7-day TTL) prevents reprocessing of events that were already written to the DB.

---

## 7. Failure Recovery

### 7.1 WebSocket Disconnect

```
ping fails or health timeout (60s)
  → scheduleReconnect()  (exponential back-off: 1s → 30s)
  → on reconnect: onReconnect() callback
      → BackfillOrchestrator.run({ fromSignature: cursor.lastSig })
      → catches up all missed slots before resuming live
```

### 7.2 RPC Failure (Circuit Breaker)

```
RpcCircuitBreaker tracks failures per endpoint:
  < 5 failures  → primary RPC
  5th failure   → OPEN → switch to fallback RPC
  60s elapsed   → HALF_OPEN → probe primary
  probe success → CLOSED → back to primary
```

### 7.3 Event Processing Error

```
handler throws
  → Redis del(dedupKey)   // release claim so retry can reprocess
  → RetryManager.enqueue(entry, attempts)
  → exponential back-off: 500ms → 1s → 2s → 4s → 8s
  → after 5 attempts: DLQ (log.error + discard)
```

### 7.4 Partial Transaction Failure

Prisma `db.$transaction` rolls back atomically. The Redis dedup key is released. The event
is enqueued for retry. Because the DB write never committed, the retry will re-run all
writes cleanly.

---

## 8. Reorg Protection

```
SlotTracker polls every 2s:
  confirmed slot  → current chain tip
  finalized slot  → irreversible (32+ confirmations)

SafeSlot = finalizedSlot - REORG_SAFE_DEPTH (32)

Backfill:
  only processes transactions at slot ≤ safeSlot
  live events at slot > safeSlot are buffered until finalized
```

This means the indexer trails the tip by ~32 slots (~13s on Solana) but never
processes a block that gets reorganized away.

---

## 9. Horizontal Scaling

The indexer is designed to run as multiple workers behind a Redis-coordinated leader lock:

```
Redis key: indexer:worker_lock  (SET NX EX 30)

Leader worker:
  Holds the lock, renewed every 10s
  Runs WebSocket subscription + cursor writes

Follower workers:
  Periodically attempt to acquire lock
  If leader dies (lock expires), a follower promotes itself
  Meanwhile followers can still process backfill independently
  (Redis NX dedup prevents duplicate DB writes)
```

Because every event is gated by `SET NX` on its signature, multiple workers processing
the same events simultaneously is safe — only one write succeeds per signature.

---

## 10. Event Reference

| Event | Handler | DB Writes |
|---|---|---|
| CoinCreated | coin-created.ts | profile.upsert, coin.create |
| TokensPurchased | trade.ts | profile.upsert, transaction.create, coin.update, holding.upsert, treasuryEvent.create, candles×6 |
| TokensSold | trade.ts | same as Buy, but decrement holding |
| GraduationInitiated | graduation.ts | coin.update(status=GRADUATING) |
| GraduationCompleted | graduation.ts | coin.update(status=GRADUATED), treasuryEvent.create |
| CreatorFeesClaimed | fees.ts | coin.update(pendingCreatorFees=0), treasuryEvent.create |
| CreatorReferrerFeesClaimed | fees.ts | coin.update(pendingReferrerFees=0), treasuryEvent.create |
| CreatorReferrerSet | fees.ts | coin.update(referrerWallet) |
| TreasurySweep | fees.ts | treasuryEvent.create |
| GlobalConfigUpdated | processor/index.ts | publish only (Redis) |
| LiquidityLocked | — | no-op |
| MintAuthorityRevoked | — | no-op |
| FreezeAuthorityRevoked | — | no-op |
| CoinGraduated | — | no-op |

---

## 11. Redis Key Namespace

| Key | TTL | Purpose |
|---|---|---|
| `indexer:sig:<signature>` | 7 days | Event dedup (SET NX) |
| `indexer:cursor` | 5 min | Cursor read cache |
| `indexer:worker_lock` | 30s | Leader election |
| `indexer:metrics` | 5 min | Latest metrics snapshot |
| `price:<mint>` | — | Pub/sub channel (no TTL) |
| `graduation:<mint>` | — | Pub/sub channel |
| `events:all_trades` | — | Global trade feed |
| `events:all_graduations` | — | Global graduation feed |
| `events:indexer` | — | Indexer lifecycle events |
| `metrics:indexer` | — | Metrics pub/sub |

---

## 12. Production Checklist

- [ ] Set `PROGRAM_ID`, `SOLANA_RPC_PRIMARY`, `SOLANA_WS_URL`, `DATABASE_URL`, `REDIS_URL` in env
- [ ] PgBouncer pool size ≥ 20 (each trade event uses 1 connection for the tx duration)
- [ ] Redis `maxmemory-policy = noeviction` — dedup keys must never be evicted
- [ ] Prometheus scraping at `http://indexer:9091/metrics`
- [ ] Alert on `indexer_lag_slots > 100` (seriously behind)
- [ ] Alert on `indexer_events_failed_total` rate > 0 sustained
- [ ] Alert on `indexer_ws_connected == 0` for > 60s
- [ ] Solana RPC node: use a dedicated RPC (Helius, QuickNode) — public endpoints rate-limit WS
- [ ] Run 2 replicas (1 leader + 1 standby) for HA; dedup prevents double-writes
