// backend/server.js (FULL FILE)

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { createClient } from "@supabase/supabase-js";
import { Connection, PublicKey } from "@solana/web3.js";

const app = express();

// -------------------- ENV --------------------
const PORT = Number(process.env.PORT || 8080);
const TRUST_PROXY = String(process.env.TRUST_PROXY || "") === "1";

const DB_MODE = String(process.env.DB_MODE || "supabase").toLowerCase(); // "supabase" | "file" (we keep supabase)
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || "";
const SUPABASE_TABLE = String(process.env.SUPABASE_TABLE || "pumpmini_store"); // your key-value store table

const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.devnet.solana.com";

const CORS_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const FEE_PCT = Math.max(0, Math.min(10, Number(process.env.FEE_PCT || 1))); // 1% default
const JSON_LIMIT = process.env.JSON_LIMIT || "15mb";

// -------------------- APP SETUP --------------------
if (TRUST_PROXY) app.set("trust proxy", 1);

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: JSON_LIMIT }));
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (CORS_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked: " + origin));
    },
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 240,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(morgan("tiny"));
app.get("/", (req, res) => {
  res.json({
    ok: true,
    name: "pumpmini-backend",
    dbMode: process.env.DB_MODE || "unknown",
    ts: Date.now(),
  });
});
// -------------------- SUPABASE + SOLANA --------------------
const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
      })
    : null;

const connection = new Connection(SOLANA_RPC, "confirmed");

// -------------------- HELPERS --------------------
const nowMS = () => Date.now();
const safeNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const uid = () => Math.random().toString(36).slice(2) + nowMS().toString(36);

function defaultStore() {
  return {
    coins: [],
    profiles: {}, // wallet => { referral?, rewards? ... }
    lastTx: [], // simple recent tx list
    feePct: FEE_PCT,
    createdAt: nowMS(),
    updatedAt: nowMS(),
  };
}

function ensureCoin(c = {}) {
  const createdAt = safeNum(c?.createdAt, nowMS());
  const status = c?.status || "DRAFT";
  const mc = safeNum(c?.mc, status === "LIVE" ? 0 : 0);
  const ath = safeNum(c?.ath, mc || 0);
  const chart = Array.isArray(c?.chart) && c.chart.length ? c.chart : [mc, mc, mc, mc, mc];

  return {
    id: c?.id || uid(),
    name: String(c?.name || "").trim(),
    symbol: String(c?.symbol || "").trim().toUpperCase(),
    story: String(c?.story || "").trim(),
    logo: c?.logo || "",
    creatorWallet: c?.creatorWallet || c?.owner || "",
    owner: c?.owner || c?.creatorWallet || "",
    createdAt,
    status,
    mc,
    ath,
    chart,
    volumeSol: safeNum(c?.volumeSol, 0),
    totalSupply: safeNum(c?.totalSupply, 1_000_000_000),
    holders: c?.holders && typeof c.holders === "object" ? c.holders : {}, // wallet => token balance
    lastTradeAt: safeNum(c?.lastTradeAt, 0),
  };
}

function pushLastTx(store, tx) {
  store.lastTx = Array.isArray(store.lastTx) ? store.lastTx : [];
  store.lastTx.unshift(tx);
  store.lastTx = store.lastTx.slice(0, 200);
}

// super simple pricing (demo): tokens per SOL based on mc-ish
function buyTokens(coin, wallet, sol) {
  const fee = sol * (FEE_PCT / 100);
  const net = Math.max(0, sol - fee);

  // demo rate: more volume => slightly worse rate (keeps stable)
  const baseRate = 100_000; // tokens per SOL baseline
  const rate = Math.max(10_000, baseRate - Math.floor(coin.volumeSol * 500));
  const tokens = Math.floor(net * rate);

  coin.volumeSol = safeNum(coin.volumeSol, 0) + sol;
  coin.lastTradeAt = nowMS();
  coin.mc = Math.max(coin.mc, coin.volumeSol * 1000); // demo mc
  coin.ath = Math.max(coin.ath, coin.mc);
  coin.chart = [...(coin.chart || [])].slice(-4).concat([coin.mc]);

  coin.holders[wallet] = safeNum(coin.holders[wallet], 0) + tokens;

  return { tokens, fee };
}

function sellTokens(coin, wallet, sol) {
  // in this demo API: client sends sol they want to sell equivalent (same as buy input)
  const fee = sol * (FEE_PCT / 100);
  const net = Math.max(0, sol - fee);

  const baseRate = 100_000;
  const rate = Math.max(10_000, baseRate - Math.floor(coin.volumeSol * 500));
  const tokensToRemove = Math.floor(net * rate);

  const have = safeNum(coin.holders[wallet], 0);
  if (have < tokensToRemove) {
    return { ok: false, error: "Not enough tokens" };
  }

  coin.holders[wallet] = have - tokensToRemove;
  coin.volumeSol = Math.max(0, safeNum(coin.volumeSol, 0) - sol);
  coin.lastTradeAt = nowMS();
  coin.mc = Math.max(0, coin.volumeSol * 1000);
  coin.chart = [...(coin.chart || [])].slice(-4).concat([coin.mc]);

  return { ok: true, tokens: tokensToRemove, fee };
}

function findCoin(store, coinId) {
  const arr = Array.isArray(store.coins) ? store.coins : [];
  return arr.find((x) => String(x.id) === String(coinId)) || null;
}

// -------------------- STORE CACHE + FAST WRITE (SUPABASE) --------------------
let STORE_CACHE = null;
let STORE_LOADING = null;

let WRITE_TIMER = null;
let WRITE_PENDING = false;

async function loadStoreOnce() {
  if (STORE_CACHE) return STORE_CACHE;
  if (STORE_LOADING) return STORE_LOADING;

  STORE_LOADING = (async () => {
    if (DB_MODE !== "supabase") {
      STORE_CACHE = defaultStore();
      return STORE_CACHE;
    }
    if (!supabase) {
      STORE_CACHE = defaultStore();
      return STORE_CACHE;
    }

    const { data, error } = await supabase.from(SUPABASE_TABLE).select("data").eq("id", "main").maybeSingle();
    if (error) throw new Error("Supabase read failed: " + error.message);

    if (!data?.data) {
      const init = defaultStore();
      const { error: e2 } = await supabase.from(SUPABASE_TABLE).upsert({ id: "main", data: init }, { onConflict: "id" });
      if (e2) throw new Error("Supabase init failed: " + e2.message);
      STORE_CACHE = init;
      return STORE_CACHE;
    }

    STORE_CACHE = data.data;
    return STORE_CACHE;
  })();

  const s = await STORE_LOADING;
  STORE_LOADING = null;
  return s;
}

function scheduleSupabaseWrite() {
  if (DB_MODE !== "supabase" || !supabase) return;
  WRITE_PENDING = true;

  if (WRITE_TIMER) return;
  WRITE_TIMER = setTimeout(async () => {
    WRITE_TIMER = null;
    if (!WRITE_PENDING) return;
    WRITE_PENDING = false;

    try {
      const store = STORE_CACHE || defaultStore();
      store.updatedAt = nowMS();

      // keep store light always
      if (Array.isArray(store.lastTx)) store.lastTx = store.lastTx.slice(0, 200);
      if (Array.isArray(store.coins)) store.coins = store.coins.slice(0, 2000); // safety cap

      const { error } = await supabase.from(SUPABASE_TABLE).upsert({ id: "main", data: store }, { onConflict: "id" });
      if (error) console.log("Supabase write failed:", error.message);
    } catch (e) {
      console.log("Supabase write exception:", e?.message || e);
    }
  }, 700); // debounce
}

// flush on exit (best effort)
process.on("SIGTERM", () => scheduleSupabaseWrite());
process.on("SIGINT", () => scheduleSupabaseWrite());

// -------------------- ROUTES --------------------
app.get("/health", (req, res) =>
  res.json({
    ok: true,
    name: "funrun-backend",
    ts: Date.now(),
    dbMode: DB_MODE,
  })
);

// balance
app.get("/api/balance/:wallet", async (req, res) => {
  try {
    const wallet = String(req.params.wallet || "").trim();
    if (!wallet) return res.json({ ok: false, error: "wallet required" });

    const pub = new PublicKey(wallet);
    const lamports = await connection.getBalance(pub);
    return res.json({ ok: true, sol: lamports / 1_000_000_000 });
  } catch (e) {
    return res.json({ ok: true, sol: 0 }); // don't break UI
  }
});

// coin list (FAST from cache)
app.get("/api/coin/list", async (req, res) => {
  try {
    const store = await loadStoreOnce();
    const coins = (store.coins || []).map(ensureCoin);
    coins.sort((a, b) => safeNum(b.createdAt) - safeNum(a.createdAt));
    return res.json({ ok: true, coins });
  } catch (e) {
    console.log("coin/list error:", e?.message || e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// create coin (FAST: update cache + schedule write)
app.post("/api/coin/create", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const symbol = String(req.body?.symbol || "").trim().toUpperCase();
    const story = String(req.body?.story || "").trim();
    const logo = req.body?.logo || "";
    const initialSol = safeNum(req.body?.initialSol, 0);
    const creatorWallet = String(req.body?.creatorWallet || "").trim();

    if (!name || !symbol || !creatorWallet) {
      return res.json({ ok: false, error: "name/symbol/creatorWallet required" });
    }

    const store = await loadStoreOnce();
    store.coins = Array.isArray(store.coins) ? store.coins : [];

    const coin = ensureCoin({
      id: uid(),
      name,
      symbol,
      story,
      logo,
      creatorWallet,
      owner: creatorWallet,
      status: initialSol > 0 ? "LIVE" : "DRAFT",
      createdAt: nowMS(),
      volumeSol: initialSol > 0 ? initialSol : 0,
    });

    // push into cache
    store.coins.unshift(coin);
    store.coins = store.coins.slice(0, 2000);

    pushLastTx(store, {
      type: "CREATE",
      coinId: coin.id,
      wallet: creatorWallet,
      sol: safeNum(initialSol, 0),
      ts: nowMS(),
    });

    STORE_CACHE = store;
    scheduleSupabaseWrite();

    return res.json({ ok: true, coin });
  } catch (e) {
    console.log("coin/create error:", e?.message || e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// unified trade (used by buy/sell routes)
async function doTrade(req, res, side) {
  try {
    const wallet = String(req.body?.wallet || "").trim();
    const coinId = String(req.body?.coinId || "").trim();
    const sol = safeNum(req.body?.sol, 0);

    if (!wallet || !coinId || sol <= 0) {
      return res.json({ ok: false, error: "wallet/coinId/sol required" });
    }

    const store = await loadStoreOnce();
    const coinRaw = findCoin(store, coinId);
    if (!coinRaw) return res.json({ ok: false, error: "token not found" });

    const coin = ensureCoin(coinRaw);

    if (side === "buy") {
      const { tokens, fee } = buyTokens(coin, wallet, sol);

      // write back into store
      const idx = store.coins.findIndex((c) => String(c.id) === String(coinId));
      if (idx >= 0) store.coins[idx] = coin;

      pushLastTx(store, { type: "BUY", coinId, wallet, sol, tokens, fee, ts: nowMS() });

      STORE_CACHE = store;
      scheduleSupabaseWrite();

      return res.json({ ok: true, coin, tokens, fee });
    }

    if (side === "sell") {
      const r = sellTokens(coin, wallet, sol);
      if (!r.ok) return res.json({ ok: false, error: r.error });

      const idx = store.coins.findIndex((c) => String(c.id) === String(coinId));
      if (idx >= 0) store.coins[idx] = coin;

      pushLastTx(store, { type: "SELL", coinId, wallet, sol, tokens: r.tokens, fee: r.fee, ts: nowMS() });

      STORE_CACHE = store;
      scheduleSupabaseWrite();

      return res.json({ ok: true, coin, tokens: r.tokens, fee: r.fee });
    }

    return res.json({ ok: false, error: "invalid side" });
  } catch (e) {
    console.log("trade error:", e?.message || e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

// buy/sell endpoints used by frontend
app.post("/api/coin/buy", (req, res) => doTrade(req, res, "buy"));
app.post("/api/coin/sell", (req, res) => doTrade(req, res, "sell"));

// profile (FAST from cache)
app.get("/api/profile/:wallet", async (req, res) => {
  try {
    const wallet = String(req.params.wallet || "").trim();
    const store = await loadStoreOnce();

    // super light profile (keeps UI alive fast)
    const profile = (store.profiles && store.profiles[wallet]) || {};
    const myCreations = (store.coins || [])
      .map(ensureCoin)
      .filter((c) => (c.creatorWallet || c.owner) === wallet)
      .slice(0, 50);

    const lastTx = (store.lastTx || []).slice(0, 50);

    return res.json({
      ok: true,
      profile,
      myCreations,
      lastTx,
      feePct: FEE_PCT,
    });
  } catch (e) {
    console.log("profile error:", e?.message || e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// -------------------- START --------------------
app.listen(PORT, () => {
  console.log("✅ Backend running on port:", PORT);
  console.log("✅ Solana RPC:", SOLANA_RPC);
  console.log("✅ DB MODE:", DB_MODE);
  console.log("✅ CORS_ORIGINS:", CORS_ORIGINS.join(", "));
  console.log("✅ JSON_LIMIT:", JSON_LIMIT);
  console.log("✅ Fee:", FEE_PCT + "%");
});