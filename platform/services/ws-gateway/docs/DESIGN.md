# Phase 8.4 — Real-Time WebSocket Gateway Design

## 1. Architecture Overview

The **WebSocket Gateway** is a stateless Node.js service that bridges the Redis pub/sub
event bus (fed by the Blockchain Indexer) to WebSocket clients in real-time.

```
                         ┌─────────────────────────────────────────┐
                         │          ws-gateway worker               │
                         │                                          │
Browser / App ──── WS ──►│  ConnectionManager                       │
                    ▲    │    ├── auth → DB (role lookup)           │
                    │    │    ├── SubscriptionManager               │
                    │    │    │      ├── local channel→conns Map    │
                    │    │    │      └── RedisSubscriber (ref cnt)  │
                    │    │    ├── HeartbeatManager (ping/pong)      │
                    │    │    ├── RateLimiter (20 msg/s per conn)   │
                    │    │    └── BackpressureHandler               │
                    │    │                                          │
                    └────│◄── EventDispatcher                       │
                         │      ├── Redis INCR → seq number         │
                         │      ├── ReplayBuffer (ZADD)             │
                         │      └── fan-out → WS clients            │
                         │                        ▲                 │
                         │    RedisSubscriber ─────┘                │
                         └──────────────┬──────────────────────────┘
                                        │ SUBSCRIBE
                                        ▼
                                    Redis Pub/Sub
                                        ▲
                                        │ PUBLISH
                               Blockchain Indexer
```

---

## 2. Message Protocol

### 2.1 Client → Server

All messages are JSON with a required `type` field.

#### `auth` — Authenticate the connection

```json
{ "type": "auth", "id": "req-1", "token": "<privy_jwt>" }
```

The token can also be passed in the query string:  
`wss://gateway/ws?token=<jwt>`

#### `subscribe` — Subscribe to a channel

```json
{
  "type":    "subscribe",
  "id":      "req-2",
  "channel": "coin:So11111111111111111111111111111111111111112",
  "fromSeq": 142   // optional: replay events since this seq on reconnect
}
```

#### `unsubscribe` — Leave a channel

```json
{ "type": "unsubscribe", "id": "req-3", "channel": "coin:MINT..." }
```

#### `ping` — Application-level keepalive

```json
{ "type": "ping", "id": "req-4" }
```

---

### 2.2 Server → Client

#### `welcome` — Sent immediately on connection

```json
{
  "type":         "welcome",
  "connectionId": "550e8400-e29b-41d4-a716-446655440000",
  "serverTime":   1700000000000,
  "version":      "1.0.0"
}
```

#### `authed` — Authentication success

```json
{ "type": "authed", "id": "req-1", "wallet": "WALLET...", "role": "CREATOR" }
```

#### `subscribed` — Subscription confirmed

```json
{ "type": "subscribed", "id": "req-2", "channel": "coin:MINT...", "seq": 1042 }
```
`seq` is the current head sequence — client uses this for future reconnect replay.

#### `event` — Real-time update

```json
{
  "type":    "event",
  "channel": "coin:MINT...",
  "seq":     1043,
  "ts":      1700000001234,
  "event":   "trade_buy",
  "data": {
    "price":       "0.000031500000000",
    "solAmount":   "500000000",
    "tokenAmount": "15873016",
    "tradeType":   "BUY",
    "slot":        "250123456",
    "signature":   "5KNt...",
    "blockTime":   1700000001
  }
}
```

#### `pong` — Response to application-level ping

```json
{ "type": "pong", "id": "req-4", "time": 1700000001234 }
```

#### `error` — Error response

```json
{
  "type":    "error",
  "id":      "req-2",
  "code":    "FORBIDDEN",
  "message": "You can only subscribe to your own portfolio channel"
}
```

**Error codes:** `UNAUTHORIZED`, `FORBIDDEN`, `INVALID_CHANNEL`, `INVALID_MESSAGE`,
`SUBSCRIPTION_LIMIT`, `RATE_LIMITED`, `CHANNEL_REQUIRES_AUTH`, `INTERNAL_ERROR`

---

## 3. Channel Reference

| Channel | Auth | Description | Redis source |
|---|---|---|---|
| `market` | Public | All trades + coin creations + graduations | `events:all_trades`, `events:all_graduations`, `events:coin_created` |
| `coin:{mint}` | Public | Price + reserve updates for one coin | `price:{mint}` |
| `trades:{mint}` | Public | Buy/sell events for one coin | `price:{mint}` (filtered) |
| `candles:{mint}` | Public | OHLCV tick updates for one coin | `price:{mint}` (filtered) |
| `holders:{mint}` | Public | Holder balance changes | `price:{mint}` (filtered) |
| `graduation` | Public | All graduation events platform-wide | `events:all_graduations` |
| `creator:{wallet}` | Own or Admin | Creator fees + stats | `events:creator:{wallet}` |
| `referral:{wallet}` | Own or Admin | Referral fee events | `events:referral:{wallet}` |
| `portfolio:{wallet}` | Own or Admin | Holdings + P&L for own wallet | `events:portfolio:{wallet}` |
| `treasury` | Admin only | Treasury sweeps + fee events | `events:treasury_sweep` |
| `admin` | Admin only | Admin actions + indexer events | `events:admin_action`, `events:indexer` |

---

## 4. Connection Lifecycle

```
[Client connects to wss://gateway/ws]
        │
        ▼
IP rate check (MAX_CONNECTIONS_PER_IP = 20)
        │ pass
        ▼
Create ClientConnection (uuid, timestamp, ip, unauthenticated)
        │
        ├── Token in ?token= query param?  →  authenticate immediately
        │
        ▼
Send: { type: "welcome", connectionId, serverTime, version }
        │
[Client sends auth message]
        │
        ▼
verifyPrivyToken()  →  DB role lookup  →  attach wallet + role to connection
Send: { type: "authed", wallet, role }
        │
[Client sends subscribe messages]
        │
        ▼
validateSubscription (auth requirements check)
        │ pass
        ▼
Add to local subscription map
Redis subscribe (if first local subscriber)
Send: { type: "subscribed", channel, seq: headSeq }
        │
        ├── fromSeq provided?  →  replay missed events from ReplayBuffer
        │
[Events arrive via Redis pub/sub]
        │
        ▼
EventDispatcher:
  1. Redis INCR → assign seq
  2. ReplayBuffer.push (ZADD replay:{channel} seq {json})
  3. Fan out to all local subscribers via ws.send (compressed)
        │
[Heartbeat: every 30s]
        │
        ▼
Server sends WebSocket PING frame
Client browser responds with PONG frame automatically
HeartbeatManager marks conn alive
        │
[No PONG within 60s]
        │
        ▼
socket.terminate()  →  handleClose()  →  unsubscribeAll()  →  deregister()
        │
[Client sends close frame]
        │
        ▼
handleClose():
  unsubscribeAll(conn)
  registry.remove(connId)
  presence.deregister(connId)
  rateLimiter.remove(connId)
```

---

## 5. Sequence Numbers & Replay

```
Redis key: wsg:seq:{channel}
Redis key: wsg:replay:{channel}   [Sorted Set, score = seq, member = JSON]

On event dispatch:
  seq = INCR wsg:seq:{channel}               ← atomic, globally ordered
  ZADD wsg:replay:{channel} NX seq {json}    ← store with NX (no overwrite)
  ZREMRANGEBYRANK wsg:replay:{channel} 0 -1001  ← keep last 1000

On reconnect with fromSeq:
  ZRANGEBYSCORE wsg:replay:{channel} {fromSeq+1} +inf
  → return in order → client receives missed events in seq order
```

**Why Sorted Set + ZADD NX?**
Multiple gateway workers all receive the same Redis pub/sub message. The `NX` flag prevents
them from overwriting each other's replay entry. The `INCR` is atomic, so only one worker
gets a given sequence number — the other workers' `ZADD NX` will fail (seq already exists).
This makes the replay buffer effectively deduplicated across workers.

---

## 6. Horizontal Scaling

```
                   Nginx (ip_hash sticky sessions)
                   ┌──────────────────────────────┐
                   │   upstream ws-gateway         │
                   │     server worker-1:3001      │
                   │     server worker-2:3001      │
                   │     server worker-N:3001      │
                   └──────────────────────────────┘
                          │         │
              ┌───────────┘         └────────────┐
              ▼                                  ▼
         worker-1                           worker-2
    local connections                  local connections
    local subscription map             local subscription map
              │                                  │
              └───────────┐ ┌────────────────────┘
                          ▼ ▼
                      Redis Pub/Sub
                    (shared event bus)
```

**Key design decision:** Each worker subscribes to Redis channels independently. When
`price:MINT123` is published, ALL workers receive it and fan out to their local subscribers.
This is correct because a given client only exists on ONE worker (sticky sessions).

**Zero shared state:** Workers do NOT communicate with each other. The Redis pub/sub
acts as the broadcast bus. No ZooKeeper, no gRPC, no gossip protocol.

**Sticky sessions:** Required for reconnect replay (client must reconnect to the same
worker to get locally buffered state). Nginx `ip_hash` or cookie-based stickiness.

If sticky sessions are unavailable, replay still works via Redis (the ReplayBuffer is
stored in Redis, readable by any worker).

---

## 7. Failure Recovery

### 7.1 Redis Pub/Sub Disconnect

ioredis auto-reconnects on connection loss. During reconnect, events from the Indexer are
lost (the Indexer's `publishPriceUpdate` calls will succeed but no subscriber is listening).

Mitigation: The Indexer writes to both Redis pub/sub AND a Redis Stream (planned). The
WS gateway reads from the Stream on reconnect for guaranteed delivery.

Current (Phase 8.4): Best-effort. Events during Redis outage are lost. Clients can
replay from the buffer for events before the outage.

### 7.2 Worker Crash

All connections on that worker disconnect. Clients auto-reconnect via the browser/app
reconnect logic (standard WebSocket reconnect pattern). They reconnect to a live worker
(sticky sessions may redirect to a different worker). They send `fromSeq` → replay
delivers missed events from Redis.

### 7.3 Slow Consumer

```
ws.bufferedAmount > 512KB
  → mark isSlowConsumer = true
  → skip sending events to this connection (drop)
  → if still slow after SLOW_CONSUMER_GRACE_MS (10s)
      → socket.terminate()
      → handleClose() cleans up subscriptions
```

Fast consumers are never blocked by slow ones because dispatch is per-connection.

### 7.4 Client Sends Too Fast (Rate Limit)

More than 20 messages/second from one connection:
```
error: { type: 'error', code: 'RATE_LIMITED', message: 'Too many messages' }
```
Persistent abuse: ConnectionManager can close the socket after N consecutive violations
(not currently implemented — can be added as an enhancement).

---

## 8. Compression

`perMessageDeflate` is enabled with a 1KB threshold:
- Messages < 1KB are sent uncompressed (compression overhead would be negative)
- Messages ≥ 1KB are compressed at `zlib` level 6 (balanced CPU/ratio)

For 100k connections all receiving the same event, the gateway serializes JSON once
and sends the same buffer to all subscribers. The WS library handles per-connection
deflate state independently.

**Optimization (future):** Pre-serialize the JSON once, call `ws.send(buffer)` with
`compress: false` after manual zlib compression with a shared context. This avoids
per-connection zlib initialization overhead at very high fan-out.

---

## 9. Redis Key Namespace

| Key | TTL | Purpose |
|---|---|---|
| `wsg:seq:{channel}` | — (persists) | Atomic sequence counter per channel |
| `wsg:replay:{channel}` | 5 min (per EXPIRE) | Sorted set of last 1000 events |
| `wsg:presence:{connId}` | 45s (renewed) | Presence heartbeat for monitoring |

---

## 10. Production Checklist

- [ ] Nginx `ip_hash` sticky sessions (or AWS ALB sticky target groups)
- [ ] `ulimit -n 200000` on gateway nodes (each WS conn uses 1 fd)
- [ ] Redis `maxmemory-policy = noeviction` (replay keys must not be evicted)
- [ ] Node.js flag `--max-old-space-size=4096` for 100k connections
- [ ] Prometheus scraping at `http://gateway:3002/metrics`
- [ ] Alert: `wsg_slow_consumers > 10` sustained for > 1 minute
- [ ] Alert: `wsg_connections_active > 90000` (approaching capacity)
- [ ] Alert: `wsg_errors_total` rate > 50/min
- [ ] TLS termination at Nginx / load balancer (do not run TLS in Node.js)
- [ ] `PRIVY_APP_ID` + `PRIVY_APP_SECRET` in secret manager (not .env in production)
- [ ] Run ≥ 2 worker replicas for HA; clients reconnect automatically on worker restart
- [ ] Health check: `GET /healthz` for liveness, `GET /readyz` for readiness (Redis ping)
