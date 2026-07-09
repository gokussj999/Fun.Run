# WebSocket Gateway Load Test Design

## Targets

| Metric | Target |
|---|---|
| Concurrent connections | 100,000 |
| Events/hour dispatched | 1,000,000+ |
| Subscribe latency (p95) | < 50ms |
| Event dispatch latency p95 (Redis → client) | < 100ms |
| Memory per connection | < 5KB |
| CPU under 100k conns + 1M events/hr | < 70% single core |
| Graceful shutdown drain | < 10s |

---

## Scenario 1 — Connection Ramp

**Goal:** Verify gateway handles gradual ramp to 100k connections without OOM or event loop lag.

**Setup:**
```bash
# Use k6 or artillery
k6 run --vus 100000 --duration 5m scripts/load/ramp-connections.js
```

**Script:**
- Each VU opens 1 WebSocket connection to `wss://gateway:3001/ws`
- On `welcome`: subscribe to `market` + `coin:<random_mint>`
- Measure: time to first `subscribed` ACK
- Hold connection for 5 minutes, then close

**Pass criteria:**
- All 100k connections accepted (no HTTP 503)
- p95 subscribe latency < 50ms
- Worker heap < 2GB total (≈ 20KB/conn budget)
- No `slow consumer` errors during ramp

---

## Scenario 2 — Event Throughput (1M events/hour)

**Goal:** Verify gateway can dispatch ~278 events/second under sustained load.

**Setup:**
- 10,000 connections each subscribed to `market`
- Inject 300 trade events/second into Redis `events:all_trades`
- Each event fans out to all 10,000 subscribers = 3M send calls/second (but compressed)

**Tool:** Redis CLI pipeline in a loop:
```bash
node scripts/load/inject-trades.mjs --rate 300 --duration 60
```

**Pass criteria:**
- All events dispatched within 100ms of Redis pub
- Gateway CPU < 70%
- Redis pub/sub latency < 10ms
- No connections terminated by backpressure handler at steady state

---

## Scenario 3 — Reconnect + Replay

**Goal:** Verify missed events are replayed correctly on reconnect.

**Setup:**
1. Connect 1,000 clients, subscribe to `coin:MINT123`, track last received seq
2. Disconnect all clients (simulate network interruption)
3. Inject 100 events into `price:MINT123` while disconnected
4. Reconnect all clients with `fromSeq: {lastSeq}` in subscribe message
5. Verify each client receives exactly the 100 missed events

**Pass criteria:**
- Replay delivers events in seq order
- No duplicate events
- fromSeq = 0 delivers up to REPLAY_BUFFER_SIZE events (1000)
- fromSeq beyond buffer returns empty (no error)

---

## Scenario 4 — Slow Consumer Handling

**Goal:** Verify slow consumers are isolated and terminated without affecting fast consumers.

**Setup:**
- 999 fast connections + 1 throttled connection (TCP receive window filled)
- Inject 500 events/second into a shared channel
- Throttled connection's `bufferedAmount` grows past SLOW_CONSUMER_THRESHOLD_BYTES

**Pass criteria:**
- 999 fast connections continue receiving events without delay
- Throttled connection receives `SlowConsumerGrace` warning (logged)
- After SLOW_CONSUMER_GRACE_MS, throttled connection is terminated
- No memory growth on the gateway worker after termination

---

## Scenario 5 — Redis Failover

**Goal:** Verify gateway survives a Redis primary failover gracefully.

**Setup:**
1. 5,000 connected clients subscribed to `market`
2. Kill Redis primary
3. Sentinel promotes replica (takes ~5s)
4. Resume injecting events

**Pass criteria:**
- All connections stay open during failover (no `close` events)
- Events resume within 10s of Redis recovery (ioredis auto-reconnects)
- No missed events after Redis recovers are double-delivered
- `/readyz` returns 503 during failover, 200 after recovery

---

## Scenario 6 — Graceful Shutdown Drain

**Goal:** Verify all connections receive close frame before process exits.

**Setup:**
- 10,000 connected clients
- Send `SIGTERM` to gateway process
- Measure time until last client receives `close(1001, 'Server shutting down')`

**Pass criteria:**
- All 10,000 clients receive close frame within 10s
- No `ERR_CONNECTION_RESET` errors on client side
- `/healthz` returns 503 immediately after SIGTERM
- Process exits with code 0

---

## Tooling

```bash
# k6 load test (Scenario 1 + 2)
k6 run tests/load/scripts/connections.js

# Artillery load test
npx artillery run tests/load/artillery.yaml

# Redis event injector
node tests/load/scripts/inject-events.mjs --channel events:all_trades --rate 300

# Monitor during run
curl -s localhost:3002/metrics | grep wsg_
watch -n1 "curl -s localhost:3002/status | jq '.connectionsActive'"
```

---

## Bottleneck Analysis

| Bottleneck | Symptom | Mitigation |
|---|---|---|
| JSON.stringify per subscriber | High CPU at 100k conns | Pre-serialize once, send raw buffer to all |
| Redis INCR per event (seq) | Redis RTT × events/s | Batch INCR with Lua script, or local atomic counter |
| perMessageDeflate CPU | CPU spikes at high throughput | Disable compression for small messages (< 1KB threshold) |
| ws.send backpressure buildup | OOM on gateway worker | Slow consumer detection (already implemented) |
| Single Redis pub/sub connection | Message lag at 1M/hr | Use Redis Cluster sharding by mint prefix |
| ioredis reconnect delay | Events dropped during Redis restart | Redis Sentinel + ioredis auto-reconnect (lazyConnect: false) |

---

## Node.js Tuning for 100k Connections

```bash
# Increase file descriptor limit
ulimit -n 200000

# Node.js flags for large event loops
node --max-old-space-size=4096 \
     --uv-threadpool-size=8 \
     dist/index.js
```

In `docker-compose.prod.yml`, add:
```yaml
ulimits:
  nofile:
    soft: 200000
    hard: 200000
```
