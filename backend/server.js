import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import morgan from "morgan";
import { createClient } from "@supabase/supabase-js";
import { Connection, PublicKey } from "@solana/web3.js";
import { fileURLToPath } from "url";

const app = express();

/* -------------------- CONFIG -------------------- */
const PORT = Number(process.env.PORT || 5000);
const DB_MODE = String(process.env.DB_MODE || "supabase").toLowerCase();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || "pumpmini_store";

const SOLANA_RPC =
  process.env.SOLANA_RPC ||
  process.env.SOLANA_RPC_URL ||
  "https://api.devnet.solana.com";

const connection = new Connection(SOLANA_RPC, "processed");

/* -------------------- SUPABASE -------------------- */
const supabase =
  DB_MODE === "supabase" && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

/* -------------------- MIDDLEWARE -------------------- */
app.use(morgan("tiny"));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
  })
);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

/* -------------------- UTIL -------------------- */
function now() {
  return Date.now();
}
function uid() {
  return crypto.randomUUID();
}
function safeNum(n, d = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : d;
}
function pct(p) {
  return safeNum(p, 0) / 100;
}

/* -------------------- DEFAULT STORE -------------------- */
function defaultStore() {
  return {
    coins: [],
    profiles: {},
    referrals: {},
    treasury: { devSol: 0, reserveSol: 0 },
    logs: [],
  };
}

/* =========================================================
   🔥 FAST SUPABASE CACHE LAYER
========================================================= */

let STORE_CACHE = null;
let STORE_LOADING = null;

let writeTimer = null;
let writeInFlight = false;
let writeQueued = false;

async function readDB() {
  if (STORE_CACHE) return STORE_CACHE;
  if (STORE_LOADING) return STORE_LOADING;

  STORE_LOADING = (async () => {
    if (!supabase) throw new Error("Supabase not configured");

    const { data, error } = await supabase
      .from(SUPABASE_TABLE)
      .select("data")
      .eq("id", "main")
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data?.data) {
      const init = defaultStore();
      await supabase
        .from(SUPABASE_TABLE)
        .upsert({ id: "main", data: init }, { onConflict: "id" });

      STORE_CACHE = init;
      return STORE_CACHE;
    }

    STORE_CACHE = data.data || defaultStore();
    return STORE_CACHE;
  })();

  const s = await STORE_LOADING;
  STORE_LOADING = null;
  return s;
}

function scheduleWrite() {
  if (writeTimer) return;

  writeTimer = setTimeout(async () => {
    writeTimer = null;

    if (writeInFlight) {
      writeQueued = true;
      return;
    }

    try {
      await flushNow();
    } catch (e) {
      console.error("Supabase flush error:", e.message);
      scheduleWrite();
    }
  }, 600); // debounce
}

async function flushNow() {
  if (!supabase || !STORE_CACHE) return;

  writeInFlight = true;

  try {
    const { error } = await supabase
      .from(SUPABASE_TABLE)
      .upsert(
        { id: "main", data: STORE_CACHE },
        { onConflict: "id" }
      );

    if (error) throw new Error(error.message);
  } finally {
    writeInFlight = false;
  }

  if (writeQueued) {
    writeQueued = false;
    scheduleWrite();
  }
}

async function writeDB(store) {
  STORE_CACHE = store; // update RAM
  scheduleWrite();     // background write
}

/* -------------------- SOL BALANCE -------------------- */
async function getSolBalance(wallet) {
  try {
    const pub = new PublicKey(wallet);
    const lamports = await connection.getBalance(pub);
    return lamports / 1_000_000_000;
  } catch {
    return 0;
  }
}

/* -------------------- ROUTES -------------------- */
app.get("/", (req, res) =>
  res.json({ ok: true, dbMode: DB_MODE, rpc: SOLANA_RPC })
);

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/api/coin/list", async (req, res) => {
  const store = await readDB();
  res.json({ ok: true, coins: store.coins });
});

app.get("/api/profile/:wallet", async (req, res) => {
  const wallet = String(req.params.wallet || "").trim();
  const store = await readDB();
  const p = store.profiles[wallet] || {
    wallet,
    holdings: [],
    rewards: { totalSol: 0 },
    referralRewards: { totalSol: 0 },
  };
  store.profiles[wallet] = p;
  writeDB(store);
  res.json({ ok: true, profile: p });
});

app.get("/api/balance/:wallet", async (req, res) => {
  const sol = await getSolBalance(req.params.wallet);
  res.json({ ok: true, sol });
});

/* -------------------- CREATE COIN -------------------- */
app.post("/api/coin/create", async (req, res) => {
  const { name, symbol, creatorWallet, initialSol = 0 } = req.body;
  if (!name || !symbol || !creatorWallet)
    return res.json({ ok: false });

  const store = await readDB();

  const coin = {
    id: uid(),
    name,
    symbol,
    creatorWallet,
    mc: 6500,
    totalSupply: 1_000_000_000,
    holders: {},
  };

  store.coins.unshift(coin);
  writeDB(store);

  res.json({ ok: true, coin });
});

/* -------------------- TRADE -------------------- */
async function handleTrade(req, res, forcedSide) {
  const { wallet, coinId, sol } = req.body;
  const side = forcedSide || req.body.side;

  if (!wallet || !coinId || !side || !sol)
    return res.json({ ok: false });

  const store = await readDB();
  const coin = store.coins.find((c) => c.id === coinId);
  if (!coin) return res.json({ ok: false });

  const tokensPerSol = 1000;
  const tokens = Math.floor(sol * tokensPerSol);

  coin.holders = coin.holders || {};

  if (side === "buy") {
    coin.holders[wallet] =
      (coin.holders[wallet] || 0) + tokens;
  } else {
    const have = coin.holders[wallet] || 0;
    if (have <= 0) return res.json({ ok: false });
    coin.holders[wallet] = Math.max(0, have - tokens);
  }

  store.profiles[wallet] = store.profiles[wallet] || {
    wallet,
    holdings: [],
  };

  const profile = store.profiles[wallet];
  const existing = profile.holdings.find(
    (h) => h.coinId === coinId
  );

  if (side === "buy") {
    if (existing) existing.amount += tokens;
    else
      profile.holdings.push({
        coinId,
        symbol: coin.symbol,
        amount: tokens,
      });
  } else {
    if (existing)
      existing.amount = Math.max(
        0,
        existing.amount - tokens
      );
  }

  coin.mc += side === "buy" ? sol * 100 : -sol * 90;

  writeDB(store);

  res.json({
    ok: true,
    coin,
    profile,
  });
}

app.post("/api/trade", (req, res) =>
  handleTrade(req, res)
);
app.post("/api/coin/buy", (req, res) =>
  handleTrade(req, res, "buy")
);
app.post("/api/coin/sell", (req, res) =>
  handleTrade(req, res, "sell")
);
app.post("/api/coin/buy", (req, res) => {
  req.body.side = "buy";
  req.url = "/api/trade";
  app._router.handle(req, res);
});

app.post("/api/coin/sell", (req, res) => {
  req.body.side = "sell";
  req.url = "/api/trade";
  app._router.handle(req, res);
});

/* -------------------- START -------------------- */
app.listen(PORT, () => {
  console.log("🚀 Backend running on port", PORT);
  console.log("DB MODE:", DB_MODE);
});