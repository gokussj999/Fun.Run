// backend/server.js (FULL FILE) — STABLE AMM + CREATOR REWARDS + REFERRAL (DEMO)

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

const DB_MODE = String(process.env.DB_MODE || "supabase").toLowerCase(); // "supabase"
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_TABLE = String(process.env.SUPABASE_TABLE || "pumpmini_store");

const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.devnet.solana.com";

const CORS_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const JSON_LIMIT = process.env.JSON_LIMIT || "15mb";

// Fees & rewards
const FEE_PCT = clampNum(Number(process.env.FEE_PCT || 1), 0, 10); // 1% default
const REFERRAL_PCT_OF_FEE = clampNum(Number(process.env.REFERRAL_PCT_OF_FEE || 20), 0, 100); // 20% of fee
const CREATOR_PCT_OF_FEE = clampNum(Number(process.env.CREATOR_PCT_OF_FEE || 50), 0, 100); // 50% of fee
const SOL_USD = clampNum(Number(process.env.SOL_USD || 80), 1, 10000); // demo conversion (for UI MC)

// AMM stability (virtual liquidity)
const VIRTUAL_SOL = clampNum(Number(process.env.VIRTUAL_SOL || 10), 0, 1_000_000);
const VIRTUAL_TOKEN_PCT = clampNum(Number(process.env.VIRTUAL_TOKEN_PCT || 20), 1, 95); // 20% of supply as vTokens

// Coin supply
const TOTAL_SUPPLY = clampNum(Number(process.env.TOTAL_SUPPLY || 1_000_000_000), 1, 10_000_000_000);

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
    dbMode: DB_MODE,
    ts: Date.now(),
  });
});

// -------------------- SUPABASE + SOLANA --------------------
const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

const connection = new Connection(SOLANA_RPC, "confirmed");

// -------------------- HELPERS --------------------
const nowMS = () => Date.now();
function clampNum(n, a, b) {
  const x = Number(n);
  if (!Number.isFinite(x)) return a;
  return Math.max(a, Math.min(b, x));
}
const safeNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const uid = () => Math.random().toString(36).slice(2) + nowMS().toString(36);

function defaultStore() {
  return {
    coins: [],
    profiles: {}, // wallet => { referrer?, referralRewardsSol?, creatorRewardsSol? }
    lastTx: [],
    createdAt: nowMS(),
    updatedAt: nowMS(),
    feePct: FEE_PCT,
  };
}

function ensureProfile(store, wallet) {
  store.profiles = store.profiles && typeof store.profiles === "object" ? store.profiles : {};
  if (!store.profiles[wallet]) {
    store.profiles[wallet] = {
      referrer: "",
      referralRewardsSol: 0,
      creatorRewardsSol: 0,
      createdAt: nowMS(),
      updatedAt: nowMS(),
    };
  }
  return store.profiles[wallet];
}

function pushLastTx(store, tx) {
  store.lastTx = Array.isArray(store.lastTx) ? store.lastTx : [];
  store.lastTx.unshift(tx);
  store.lastTx = store.lastTx.slice(0, 200);
}

function ensureCoin(c = {}) {
  const createdAt = safeNum(c?.createdAt, nowMS());
  const status = c?.status || "DRAFT";

  const totalSupply = safeNum(c?.totalSupply, TOTAL_SUPPLY);
  const vTokens = safeNum(c?.vTokens, (totalSupply * VIRTUAL_TOKEN_PCT) / 100);
  const vSol = safeNum(c?.vSol, VIRTUAL_SOL);

  const solReserve = safeNum(c?.solReserve, 0);
  const tokenReserve = clampNum(safeNum(c?.tokenReserve, totalSupply), 0, totalSupply);

  const { priceSol, priceUsd, mcUsd } = calcPricing({
    totalSupply,
    solReserve,
    tokenReserve,
    vSol,
    vTokens,
  });

  const mc = safeNum(c?.mc, status === "LIVE" ? mcUsd : 0);
  const ath = safeNum(c?.ath, mc || 0);

  const chart =
    Array.isArray(c?.chart) && c.chart.length
      ? c.chart
      : status === "LIVE"
      ? [mc, mc, mc, mc, mc]
      : [0, 0, 0, 0, 0];

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

    totalSupply,
    holders: c?.holders && typeof c.holders === "object" ? c.holders : {},

    // AMM reserves
    solReserve,
    tokenReserve,
    vSol,
    vTokens,

    // analytics
    volumeSol: safeNum(c?.volumeSol, 0),
    lastTradeAt: safeNum(c?.lastTradeAt, 0),

    // UI-facing values (USD-based MC like your frontend expects)
    priceSol,
    priceUsd,
    mc: mc,
    ath: ath,
    chart,

    // rewards
    creatorRewardsSol: safeNum(c?.creatorRewardsSol, 0),
  };
}

function calcPricing({ totalSupply, solReserve, tokenReserve, vSol, vTokens }) {
  const x = Math.max(0, solReserve) + Math.max(0, vSol);
  const y = Math.max(1e-9, Math.max(0, tokenReserve) + Math.max(0, vTokens));

  const priceSol = x / y; // SOL per token
  const priceUsd = priceSol * SOL_USD;

  const circulating = Math.max(0, totalSupply - Math.max(0, tokenReserve));
  const mcUsd = priceUsd * circulating;

  return { priceSol, priceUsd, mcUsd };
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

  // ---------- FILE MODE ----------
  if (DB_MODE !== "supabase") {
    try {
      const raw = await fs.readFile(DB_FILE, "utf8");
      const parsed = JSON.parse(raw || "{}");
      STORE_CACHE = {
        coins: Array.isArray(parsed.coins) ? parsed.coins.map(ensureCoin) : [],
        profiles: parsed.profiles || {},
        txs: Array.isArray(parsed.txs) ? parsed.txs : [],
      };
      return STORE_CACHE;
    } catch {
      STORE_CACHE = { coins: [], profiles: {}, txs: [] };
      return STORE_CACHE;
    }
  }

  // ---------- SUPABASE MODE ----------
  // 1) Pehle unified store se read karo
  let unifiedStore = { coins: [], profiles: {}, txs: [] };

  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLE)
      .select("data")
      .eq("id", "main")
      .single();

    if (!error && data?.data) {
      unifiedStore = {
        coins: Array.isArray(data.data.coins) ? data.data.coins.map(ensureCoin) : [],
        profiles: data.data.profiles || {},
        txs: Array.isArray(data.data.txs) ? data.data.txs : [],
      };
    }
  } catch (e) {
    console.log("loadStoreOnce unified read failed:", e?.message || e);
  }

  // 2) Agar unified store me coins empty hon to legacy `coins` table se fallback lo
  if (!unifiedStore.coins.length) {
    try {
      const { data: legacyCoins, error: legacyErr } = await supabase
        .from("coins")
        .select("*")
        .order("created_at", { ascending: false });

      if (!legacyErr && Array.isArray(legacyCoins) && legacyCoins.length) {
        unifiedStore.coins = legacyCoins.map((r) =>
          ensureCoin({
            id: r.id,
            name: r.name,
            symbol: r.symbol,
            story: r.story || "",
            logo: r.logo || "",
            creatorWallet: r.creator_wallet || "",
            owner: r.creator_wallet || "",
            status: "LIVE",
            createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
          })
        );

        // fallback se load karne ke baad unified store me bhi save kar do
        STORE_CACHE = unifiedStore;
        await flushSupabaseNow();
        return STORE_CACHE;
      }
    } catch (e) {
      console.log("loadStoreOnce legacy coin fallback failed:", e?.message || e);
    }
  }

  STORE_CACHE = unifiedStore;
  return STORE_CACHE;
}

function scheduleWrite() {
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

      if (Array.isArray(store.lastTx))
        store.lastTx = store.lastTx.slice(0, 200);

      if (Array.isArray(store.coins))
        store.coins = store.coins.slice(0, 2000);

      const { error } = await supabase
        .from(SUPABASE_TABLE)
        .upsert({ id: "main", data: store }, { onConflict: "id" });

      if (error) console.log("Supabase write failed:", error.message);
    } catch (e) {
      console.log("Supabase write exception:", e?.message || e);
    }
  }, 700);
}
process.on("SIGTERM", () => scheduleWrite());
process.on("SIGINT", () => scheduleWrite());
// -------------------- AMM CORE --------------------
function applyFee(solAmount) {
  const fee = solAmount * (FEE_PCT / 100);
  const net = Math.max(0, solAmount - fee);
  return { fee, net };
}

function distributeFee(store, coin, feeSol) {
  if (!feeSol || feeSol <= 0) return;

  const creator = String(coin.creatorWallet || coin.owner || "").trim();
  const creatorPart = feeSol * (CREATOR_PCT_OF_FEE / 100);

  if (creator) {
    const p = ensureProfile(store, creator);
    p.creatorRewardsSol = safeNum(p.creatorRewardsSol, 0) + creatorPart;
    p.updatedAt = nowMS();
    coin.creatorRewardsSol = safeNum(coin.creatorRewardsSol, 0) + creatorPart;
  }

  // Referral is paid to the referrer of the TRADER (wallet), handled in doTrade after wallet known
}

function distributeReferral(store, traderWallet, feeSol) {
  if (!feeSol || feeSol <= 0) return;
  const trader = String(traderWallet || "").trim();
  if (!trader) return;

  const traderProfile = ensureProfile(store, trader);
  const ref = String(traderProfile.referrer || "").trim();
  if (!ref) return;

  const refPart = feeSol * (REFERRAL_PCT_OF_FEE / 100);
  if (refPart <= 0) return;

  const refProf = ensureProfile(store, ref);
  refProf.referralRewardsSol = safeNum(refProf.referralRewardsSol, 0) + refPart;
  refProf.updatedAt = nowMS();
}

function ammBuy(coin, wallet, solInGross) {
  const { fee, net } = applyFee(solInGross);

  const totalSupply = coin.totalSupply;
  const x = coin.solReserve + coin.vSol;
  const y = coin.tokenReserve + coin.vTokens;
  const k = x * y;

  const newX = x + net;
  const newY = k / Math.max(1e-9, newX);
  const tokensOut = Math.max(0, y - newY);

  // Cap: can't take more than tokenReserve
  const out = Math.min(tokensOut, coin.tokenReserve);

  coin.solReserve = coin.solReserve + net;
  coin.tokenReserve = Math.max(0, coin.tokenReserve - out);

  coin.holders = coin.holders && typeof coin.holders === "object" ? coin.holders : {};
  coin.holders[wallet] = safeNum(coin.holders[wallet], 0) + out;

  coin.volumeSol = safeNum(coin.volumeSol, 0) + solInGross;
  coin.lastTradeAt = nowMS();
  coin.status = "LIVE";

  const { mcUsd } = calcPricing({
    totalSupply: totalSupply,
    solReserve: coin.solReserve,
    tokenReserve: coin.tokenReserve,
    vSol: coin.vSol,
    vTokens: coin.vTokens,
  });

  coin.mc = mcUsd;
  coin.ath = Math.max(safeNum(coin.ath, 0), coin.mc);
  coin.chart = [...(coin.chart || [])].slice(-70).concat([coin.mc]);

  return { tokensOut: out, feeSol: fee, netSol: net };
}

// SELL: frontend sends "sol" input. We'll interpret it as "SOL OUT (gross)" target for demo.
function ammSellBySolOut(coin, wallet, solOutGross) {
  const { fee, net } = applyFee(solOutGross);
  // We'll actually remove solOutGross from pool, fee counted as cost (for rewards)
  // User would receive net, fee goes to rewards. (Demo)

  const totalSupply = coin.totalSupply;
  const x = coin.solReserve + coin.vSol;
  const y = coin.tokenReserve + coin.vTokens;
  const k = x * y;

  const desiredGross = solOutGross;
  if (desiredGross <= 0) return { ok: false, error: "Invalid amount" };
  if (coin.solReserve < desiredGross) return { ok: false, error: "Pool has low SOL liquidity" };

  const newX = Math.max(1e-9, x - desiredGross);
  const newY = k / newX;
  const tokensIn = Math.max(0, newY - y); // tokens required to pay out that SOL

  const have = safeNum(coin.holders?.[wallet], 0);
  if (have < tokensIn) return { ok: false, error: "Not enough tokens" };

  coin.holders[wallet] = have - tokensIn;

  coin.solReserve = Math.max(0, coin.solReserve - desiredGross);
  coin.tokenReserve = Math.min(totalSupply, coin.tokenReserve + tokensIn);

  coin.volumeSol = safeNum(coin.volumeSol, 0) + solOutGross;
  coin.lastTradeAt = nowMS();
  coin.status = "LIVE";

  const { mcUsd } = calcPricing({
    totalSupply: totalSupply,
    solReserve: coin.solReserve,
    tokenReserve: coin.tokenReserve,
    vSol: coin.vSol,
    vTokens: coin.vTokens,
  });

  coin.mc = mcUsd;
  coin.ath = Math.max(safeNum(coin.ath, 0), coin.mc);
  coin.chart = [...(coin.chart || [])].slice(-70).concat([coin.mc]);

  return { ok: true, tokensIn, feeSol: fee, netSol: net };
}

// -------------------- ROUTES --------------------
app.get("/health", (req, res) =>
  res.json({
    ok: true,
    name: "pumpmini-backend",
    ts: Date.now(),
    dbMode: DB_MODE,
  })
);

// balance (chain read)
app.get("/api/balance/:wallet", async (req, res) => {
  try {
    const wallet = String(req.params.wallet || "").trim();
    if (!wallet) return res.json({ ok: false, error: "wallet required" });

    const pub = new PublicKey(wallet);
    const lamports = await connection.getBalance(pub);
    return res.json({ ok: true, sol: lamports / 1_000_000_000 });
  } catch (e) {
    return res.json({ ok: true, sol: 0 });
  }
});


// coin list
app.get("/api/coin/list", async (req, res) => {
  try {
    if (DB_MODE === "supabase") {
      const { data, error } = await supabase
        .from("coins")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.log("coin/list supabase error:", error.message);
        return res.status(500).json({ ok: false, error: error.message });
      }

      const coinsOut = (data || []).map((r) =>
        ensureCoin({
          id: r.id,
          name: r.name,
          symbol: r.symbol,
          story: r.story || "",
          logo: r.logo || "",
          creatorWallet: r.creator_wallet || "",
          owner: r.creator_wallet || "",
          status: "LIVE",
          createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
        })
      );

      return res.json({ ok: true, coins: coinsOut });
    }

    const store = await loadStoreOnce();
    const coinsOut = (store?.coins || [])
      .map((c) => ensureCoin(c))
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

    return res.json({ ok: true, coins: coinsOut });
  } catch (e) {
    console.log("coin/list route error:", e?.message || e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

     

// create coin
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

  

    const totalSupply = TOTAL_SUPPLY;
    const vTokens = (totalSupply * VIRTUAL_TOKEN_PCT) / 100;
    const vSol = VIRTUAL_SOL;

    // Start reserves
    const solReserve = Math.max(0, initialSol); // if 0, still stable because vSol exists
    const tokenReserve = totalSupply; // initially all tokens in pool

    const coin = ensureCoin({
      id: uid(),
      name,
      symbol,
      story,
      logo,
      creatorWallet,
      owner: creatorWallet,
      status: "LIVE",
      createdAt: nowMS(),

      totalSupply,
      vTokens,
      vSol,
      solReserve,
      tokenReserve,

      volumeSol: Math.max(0, initialSol),
      holders: {},
      chart: [], // will be created in ensureCoin
    });  
    
    if (DB_MODE === "supabase") {
  const row = {
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol,
    story: coin.story || "",
    logo: coin.logo || "",
    creator_wallet: creatorWallet,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("coins").insert([row]);
  if (error) return res.json({ ok: false, error: "Supabase insert failed: " + error.message });

  return res.json({ ok: true, coin });
}

    // push into store
    store.coins.unshift(coin);
    store.coins = store.coins.slice(0, 2000);

    pushLastTx(store, {
      id: uid(),
      type: "CREATE",
      side: "CREATE",
      coinId: coin.id,
      wallet: creatorWallet,
      sol: Math.max(0, initialSol),
      ts: nowMS(),
    });

    STORE_CACHE = store;
    scheduleWrite();

    return res.json({ ok: true, coin });
  } catch (e) {
    console.log("coin/create error:", e?.message || e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// referral set (locks once)
app.post("/api/referral/set", async (req, res) => {
  try {
    const wallet = String(req.body?.wallet || "").trim();
    const referrer = String(req.body?.referrer || "").trim();

    if (!wallet || !referrer) return res.json({ ok: false, error: "wallet/referrer required" });
    if (wallet === referrer) return res.json({ ok: false, error: "invalid referrer" });

    const store = await loadStoreOnce();
    const p = ensureProfile(store, wallet);

    if (p.referrer && String(p.referrer).trim()) {
      return res.json({ ok: false, error: "immutable: already set" });
    }

    // soft validate (just length)
    if (referrer.length < 20) return res.json({ ok: false, error: "invalid referrer" });

    p.referrer = referrer;
    p.updatedAt = nowMS();

    STORE_CACHE = store;
    scheduleStoreWrite();

    return res.json({ ok: true, referrer });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// trade
async function doTrade(req, res, side) {
  try {
    const wallet = String(req.body?.wallet || "").trim();
    const coinId = String(req.body?.coinId || "").trim();
    const sol = safeNum(req.body?.sol, 0);

    if (!wallet || !coinId || sol <= 0) {
      return res.json({ ok: false, error: "wallet/coinId/sol required" });
    }

   let store = null;
let coin = null;

// ✅ Supabase mode: coins table se coin lao
if (DB_MODE === "supabase") {
  const { data, error } = await supabase
    .from("coins")
    .select("*")
    .eq("id", coinId)
    .maybeSingle();

  if (error || !data) {
    return res.json({ ok: false, error: "token not found" });
    store = await loadStoreOnce();
  }

  coin = ensureCoin({
    id: data.id,
    name: data.name,
    symbol: data.symbol,
    story: data.story || "",
    logo: data.logo || "",
    creatorWallet: data.creator_wallet || "",
    owner: data.creator_wallet || "",
    status: "LIVE",
    createdAt: data.created_at ? new Date(data.created_at).getTime() : nowMS(),
  });

  // store rewards/logs ke liye (agar use ho raha)
  store = await loadStoreOnce();
} else {
  store = await loadStoreOnce();
  const coinRaw = findCoin(store, coinId);
  if (!coinRaw) return res.json({ ok: false, error: "token not found" });
  coin = ensureCoin(coinRaw);
}
    ensureProfile(store, wallet);

    if (String(side).toLowerCase() === "buy") {
      const r = ammBuy(coin, wallet, sol);

      // fee distribution (creator + referral)
      distributeFee(store, coin, r.feeSol);
      distributeReferral(store, wallet, r.feeSol);

      const idx = store.coins.findIndex((c) => String(c.id) === String(coinId));
      if (idx >= 0) store.coins[idx] = coin;

      pushLastTx(store, {
        id: uid(),
        type: "BUY",
        side: "BUY",
        coinId,
        wallet,
        sol,
        tokens: r.tokensOut,
        fee: r.feeSol,
        ts: nowMS(),
      });

      STORE_CACHE = store;
      scheduleStoreWrite();

      return res.json({ ok: true, coin, tokens: r.tokensOut, fee: r.feeSol });
    }

    if (String(side).toLowerCase() === "sell") {
      const r = ammSellBySolOut(coin, wallet, sol);
      if (!r.ok) return res.json({ ok: false, error: r.error });

      distributeFee(store, coin, r.feeSol);
      distributeReferral(store, wallet, r.feeSol);

      const idx = store.coins.findIndex((c) => String(c.id) === String(coinId));
      if (idx >= 0) store.coins[idx] = coin;

      pushLastTx(store, {
        id: uid(),
        type: "SELL",
        side: "SELL",
        coinId,
        wallet,
        sol,
        tokens: r.tokensIn,
        fee: r.feeSol,
        ts: nowMS(),
      });

      STORE_CACHE = store;
      scheduleStoreWrite();

      return res.json({ ok: true, coin, tokens: r.tokensIn, fee: r.feeSol });
    }

    return res.json({ ok: false, error: "invalid side" });
  } catch (e) {
    console.log("trade error:", e?.message || e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

app.post("/api/coin/buy", (req, res) => doTrade(req, res, "buy"));
app.post("/api/coin/sell", (req, res) => doTrade(req, res, "sell"));

// profile
app.get("/api/profile/:wallet", async (req, res) => {
  try {
    const wallet = String(req.params.wallet || "").trim();
    const store = await loadStoreOnce();

    const p = wallet ? ensureProfile(store, wallet) : {};
    const myCreations = (store.coins || [])
      .map(ensureCoin)
      .filter((c) => String(c.creatorWallet || c.owner || "") === String(wallet))
      .slice(0, 50);

    const lastTx = (store.lastTx || []).slice(0, 80);

    const profile = {
      referrer: p?.referrer || "",
      referralRewards: { totalSol: safeNum(p?.referralRewardsSol, 0) },
      rewards: { totalSol: safeNum(p?.creatorRewardsSol, 0), byCoin: {} },
    };

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

// withdraw endpoints (DEMO: just resets counters, no on-chain transfer)
app.post("/api/withdraw", async (req, res) => {
  try {
    const wallet = String(req.body?.wallet || "").trim();
    const kind = String(req.body?.kind || "").trim().toUpperCase(); // "CREATOR" | "REF" | "MANUAL"
    if (!wallet) return res.json({ ok: false, error: "wallet required" });

    const store = await loadStoreOnce();
    const p = ensureProfile(store, wallet);

    if (kind === "REF") {
      const amt = safeNum(p.referralRewardsSol, 0);
      if (amt <= 0) return res.json({ ok: false, error: "No referral rewards" });
      p.referralRewardsSol = 0;
      p.updatedAt = nowMS();

      STORE_CACHE = store;
      scheduleStoreWrite();

      return res.json({ ok: true, kind: "REF", amountSol: amt, to: wallet });
    }

async function flushSupabaseNow() {
  const store = STORE_CACHE || { coins: [], profiles: {}, txs: [] };

  const cleanStore = {
    coins: Array.isArray(store.coins) ? store.coins.map(ensureCoin) : [],
    profiles: store.profiles || {},
    txs: Array.isArray(store.txs) ? store.txs : [],
  };

  const { error } = await supabase
    .from(SUPABASE_TABLE)
    .upsert(
      {
        id: "main",
        data: cleanStore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (error) throw error;
}

let writeTimer = null;

function scheduleSupabaseWrite() {
  if (writeTimer) return;
  writeTimer = setTimeout(async () => {
    writeTimer = null;
    try {
      await flushSupabaseNow();
    } catch (e) {
      console.error("Supabase DB flush failed:", e?.message || e);
    }
  }, 600);
}

function scheduleStoreWrite() {
  if (DB_MODE === "supabase") scheduleSupabaseWrite();
  else scheduleFileWrite();
}

if (kind === "CREATOR") {
  const amt = safeNum(p.creatorRewardsSol, 0);
  if (amt <= 0) return res.json({ ok: false, error: "No creator rewards" });
  p.creatorRewardsSol = 0;
  p.updatedAt = nowMS();

  STORE_CACHE = store;
  scheduleStoreWrite();

  return res.json({ ok: true, kind: "CREATOR", amountSol: amt, to: wallet });
}


if (kind === "CREATOR") {
  const amt = safeNum(p.creatorRewardsSol, 0);
  if (amt <= 0) return res.json({ ok: false, error: "No creator rewards" });
  p.creatorRewardsSol = 0;
  p.updatedAt = nowMS();

  STORE_CACHE = store;
  scheduleStoreWrite();

  return res.json({ ok: true, kind: "CREATOR", amountSol: amt, to: wallet });
}

return res.json({ ok: false, error: "Unsupported kind (use REF or CREATOR)" });
} catch (e) {
  return res.status(500).json({ ok: false, error: String(e?.message || e) });
}
});

// aliases your frontend tries
app.post("/api/withdraw/creator", (req, res) => app._router.handle({ ...req, url: "/api/withdraw" }, res, () => {}));
app.post("/api/withdraw/referral", (req, res) => app._router.handle({ ...req, url: "/api/withdraw" }, res, () => {}));

// -------------------- START --------------------
function startServer(port) {

  const server = app.listen(port, () => {
    console.log("✅ Backend running on port:", port);
    console.log("✅ Solana RPC:", SOLANA_RPC);
    console.log("✅ DB MODE:", DB_MODE);
    console.log("✅ CORS_ORIGINS:", CORS_ORIGINS.join(", "));
    console.log("✅ JSON_LIMIT:", JSON_LIMIT);
    console.log("✅ Fee:", FEE_PCT + "%");
    console.log("✅ Rewards: creator", CREATOR_PCT_OF_FEE + "% of fee,", "referral", REFERRAL_PCT_OF_FEE + "% of fee");
    console.log("✅ AMM virtual:", "vSOL", VIRTUAL_SOL, "vTOK%", VIRTUAL_TOKEN_PCT);
    console.log("✅ SOL_USD:", SOL_USD);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && !process.env.PORT) {
      console.log(`⚠️ Port ${port} busy hai, ${port + 1} try kar raha hoon...`);
      startServer(port + 1);
      return;
    }
    throw err;
  });

}

startServer(Number(process.env.PORT || 5000));