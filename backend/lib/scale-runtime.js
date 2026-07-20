/**
 * Scale runtime helpers for Fun.Run monolith.
 * Goals: thinner trade hot-path, coalesced WS fan-out, optional Redis cache.
 * Does not by itself deliver 50k concurrent traders — needs Redis + multi-instance + PgBouncer.
 */

import crypto from "crypto";

export function createJobQueue({ name = "jobs", concurrency = 4, onError } = {}) {
  const q = [];
  let active = 0;
  let dropped = 0;

  function pump() {
    while (active < concurrency && q.length) {
      const job = q.shift();
      active += 1;
      Promise.resolve()
        .then(() => job.fn())
        .catch((e) => {
          onError?.(e, job.label);
          console.log(`[queue:${name}] ${job.label || "job"} error:`, e?.message || e);
        })
        .finally(() => {
          active -= 1;
          pump();
        });
    }
  }

  return {
    get size() {
      return q.length;
    },
    get active() {
      return active;
    },
    get dropped() {
      return dropped;
    },
    enqueue(label, fn, { maxQueue = 50_000 } = {}) {
      if (q.length >= maxQueue) {
        dropped += 1;
        return false;
      }
      q.push({ label, fn });
      pump();
      return true;
    },
  };
}

/**
 * WebSocket hub:
 * - clients may subscribe to coinIds / wallet
 * - trade:new + coin:update are coalesced per coin (flush every tickMs)
 * - personal events (portfolio/notification) go to matching wallet subscribers (or all if none set)
 */
export function createWsHub({ tickMs = 80 } = {}) {
  const clients = new Set(); // { ws, coins:Set, wallet:string, lastPing }

  const pendingTrades = new Map(); // coinId -> latest trade payload
  const pendingCoins = new Map(); // coinId -> latest coin payload
  let flushTimer = null;

  function ensureFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flush();
    }, Math.max(16, tickMs));
  }

  function sendRaw(ws, obj) {
    if (!ws || ws.readyState !== 1) return;
    try {
      ws.send(typeof obj === "string" ? obj : JSON.stringify(obj));
    } catch {
      // ignore broken sockets
    }
  }

  function interestedInCoin(client, coinId) {
    const id = String(coinId || "");
    if (!id) return true;
    // No subscriptions yet → receive global feed (backward compatible)
    if (!client.coins || client.coins.size === 0) return true;
    return client.coins.has(id) || client.coins.has("*");
  }

  function interestedInWallet(client, wallet) {
    const w = String(wallet || "").trim();
    if (!w) return true; // global
    if (!client.wallet) return true; // unauthenticated socket still gets wallet events? keep legacy
    return client.wallet === w;
  }

  function flush() {
    const tradeEntries = [...pendingTrades.entries()];
    const coinEntries = [...pendingCoins.entries()];
    pendingTrades.clear();
    pendingCoins.clear();

    for (const [coinId, payload] of tradeEntries) {
      const msg = JSON.stringify({ event: "trade:new", payload });
      for (const c of clients) {
        if (interestedInCoin(c, coinId)) sendRaw(c.ws, msg);
      }
    }
    for (const [coinId, payload] of coinEntries) {
      const msg = JSON.stringify({ event: "coin:update", payload });
      for (const c of clients) {
        if (interestedInCoin(c, coinId)) sendRaw(c.ws, msg);
      }
    }
  }

  function broadcast(event, payload) {
    const e = String(event || "");

    if (e === "trade:new") {
      const coinId = String(payload?.coinId || payload?.coin_id || "").trim();
      if (coinId) {
        pendingTrades.set(coinId, payload);
        ensureFlush();
        return;
      }
    }

    if (e === "coin:update") {
      const coinId = String(payload?.id || payload?.coinId || "").trim();
      if (coinId) {
        pendingCoins.set(coinId, payload);
        ensureFlush();
        return;
      }
    }

    // Immediate for everything else (notifications, portfolio, etc.)
    const msg = JSON.stringify({ event: e, payload });
    const wallet = payload?.wallet;
    const isGlobal = payload?.global === true || !wallet;

    for (const c of clients) {
      if (e === "portfolio:update" || e === "creator:update" || e === "referral:update" || e === "owner:update") {
        if (!interestedInWallet(c, wallet)) continue;
      } else if (e === "notification:new" && !isGlobal) {
        if (!interestedInWallet(c, wallet)) continue;
      }
      sendRaw(c.ws, msg);
    }
  }

  function attach(ws) {
    const client = { ws, coins: new Set(), wallet: "", lastPing: Date.now() };
    clients.add(client);

    ws.on("message", (raw) => {
      let msg = null;
      try {
        msg = JSON.parse(String(raw || ""));
      } catch {
        return;
      }
      const type = String(msg?.type || msg?.event || "").toLowerCase();
      if (type === "subscribe" || type === "ws:subscribe") {
        const coinId = String(msg.coinId || msg.coin_id || "").trim();
        if (coinId) client.coins.add(coinId);
        if (msg.all === true) client.coins.add("*");
        const wallet = String(msg.wallet || "").trim();
        if (wallet) client.wallet = wallet;
        return;
      }
      if (type === "unsubscribe" || type === "ws:unsubscribe") {
        const coinId = String(msg.coinId || msg.coin_id || "").trim();
        if (coinId) client.coins.delete(coinId);
        return;
      }
      if (type === "ping") {
        client.lastPing = Date.now();
        sendRaw(ws, { event: "pong", payload: { ts: Date.now() } });
      }
    });

    ws.on("close", () => {
      clients.delete(client);
    });

    return client;
  }

  return {
    broadcast,
    attach,
    get clientCount() {
      return clients.size;
    },
    flushNow: flush,
  };
}

export function createRedisCache(redis, { prefix = "fr" } = {}) {
  if (!redis) {
    return {
      enabled: false,
      async get() {
        return null;
      },
      async set() {},
      async del() {},
    };
  }

  return {
    enabled: true,
    async get(key) {
      try {
        const raw = await redis.get(`${prefix}:${key}`);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    async set(key, value, ttlSec = 3) {
      try {
        const body = JSON.stringify(value);
        if (ttlSec > 0) await redis.set(`${prefix}:${key}`, body, "EX", ttlSec);
        else await redis.set(`${prefix}:${key}`, body);
      } catch {
        // ignore
      }
    },
    async del(key) {
      try {
        await redis.del(`${prefix}:${key}`);
      } catch {
        // ignore
      }
    },
  };
}

export function coinLockId(coinId) {
  const h = crypto.createHash("sha256").update(String(coinId)).digest();
  return h.readBigInt64BE(0);
}
