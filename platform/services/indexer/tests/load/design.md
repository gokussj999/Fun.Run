# Indexer Load Test Design

## Objective

Verify the indexer sustains **100,000+ events/hour** under sustained peak trading activity
without falling behind the chain tip or dropping events.

---

## Baseline Targets

| Metric | Target |
|---|---|
| Throughput | ≥ 100k events/hour (~27 events/sec) |
| End-to-end latency (log → DB) | p95 < 500ms |
| DB candle upsert (6 TFs) | < 50ms per trade event |
| Cursor lag | ≤ 5 slots behind finalized tip |
| Retry queue at steady state | 0 |
| Memory (heap) | < 512MB |
| CPU | < 60% single core |

---

## Test Scenarios

### Scenario 1 — Sustained Throughput

**Goal:** Measure max sustainable events/second without queue buildup.

**Setup:**
- Replay 10,000 historical program transactions from mainnet (use `scripts/seed-load-data.ts`)
- Feed them into the processor in parallel batches of 50
- Measure time from first event ingestion to last DB write confirmed

**Success:** 10,000 events processed in < 6 minutes (= 100k/hr baseline)

---

### Scenario 2 — Burst Handling (Graduation Event)

**Goal:** Verify the system handles a graduation spike (10× normal traffic for 30s).

**Setup:**
- Interleave 500 TokensPurchased events in 30 seconds (burst)
- Followed by GraduationInitiated + GraduationCompleted
- Verify: graduation status correctly written after all buy events, candles consistent

**Success:** No events lost, graduation status = GRADUATED, candles not corrupted.

---

### Scenario 3 — WebSocket Reconnect Recovery

**Goal:** Confirm backfill correctly catches up after a simulated 60-second WS outage.

**Setup:**
- Generate 1,000 events during the "outage" period (written to a fixture file)
- Trigger WS reconnect
- Verify all 1,000 events are backfilled in the correct slot order

**Success:** All 1,000 events appear in DB; cursor advances to the correct slot.

---

### Scenario 4 — Duplicate Detection (Idempotency)

**Goal:** Confirm replay of the same 1,000 signatures does not double-insert.

**Setup:**
- Process 1,000 events once (seed)
- Replay the same 1,000 events again
- Count DB rows for coins, transactions, holdings

**Success:** Row counts identical after replay. No constraint violations.

---

### Scenario 5 — Retry Queue Drain

**Goal:** Verify retry manager clears a 100-item backlog without memory growth.

**Setup:**
- Inject 100 events where the DB handler throws on the first attempt (mock)
- Allow retry queue to process with exponential back-off
- After MAX_RETRY_ATTEMPTS, verify DLQ log entries appear

**Success:** All 100 items either succeed on retry or appear in DLQ log. No memory leak.

---

## Tooling

```bash
# Seed 10k historical events from fixtures
node tests/load/scripts/seed.mjs

# Run throughput scenario
vitest bench tests/load/throughput.bench.ts

# Run reconnect scenario
node tests/load/scripts/reconnect-sim.mjs

# Monitor during run
curl localhost:9091/metrics | grep indexer_
```

---

## Monitoring During Load Tests

Watch these Prometheus metrics at `http://localhost:9091/metrics`:

- `indexer_events_processed_total` — should increase monotonically
- `indexer_events_failed_total` — should remain 0 in normal scenarios
- `indexer_lag_slots` — should stay ≤ 5
- `indexer_retry_queue_size` — should drain to 0 between bursts
- `indexer_ws_connected` — should be 1 (reconnect test: briefly 0)

---

## Bottleneck Candidates

1. **Candle upsert** — 6 parallel raw SQL upserts per trade. If this becomes the
   bottleneck, batch them into a single multi-row upsert.

2. **Redis dedup SET NX** — should be sub-ms; watch for Redis connection pool saturation.

3. **DB `$transaction` serialization** — Prisma interactive transactions hold a connection
   for the duration. Pool size (PgBouncer default 20) caps concurrent processing.
   Mitigation: increase pool, or pipeline non-dependent writes.

4. **WebSocket message queue** — if the live handler is slower than message arrival rate,
   messages buffer in Node.js event loop. Use a BullMQ worker to offload to Redis.
