// backend/server.js
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
const PORT = Number(process.env.PORT || 5000);
const TRUST_PROXY = String(process.env.TRUST_PROXY || "") === "1";

const DB_MODE = String(process.env.DB_MODE || "supabase").toLowerCase();
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_TABLE = String(process.env.SUPABASE_TABLE || "pumpmini_store");

const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.devnet.solana.com";
const JSON_LIMIT = process.env.JSON_LIMIT || "15mb";

const CORS_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// fees
// fees
const FEE_PCT = clampNum(Number(process.env.FEE_PCT || 1), 0, 10);

// 1% fee ka breakdown:
// 40% app owner
// 40% coin creator
// 20% referral
const OWNER_PCT_OF_FEE = clampNum(Number(process.env.OWNER_PCT_OF_FEE || 40), 0, 100);
const CREATOR_PCT_OF_FEE = clampNum(Number(process.env.CREATOR_PCT_OF_FEE || 40), 0, 100);
const REFERRAL_PCT_OF_FEE = clampNum(Number(process.env.REFERRAL_PCT_OF_FEE || 20), 0, 100);

const APP_OWNER_WALLET = String(process.env.APP_OWNER_WALLET || "").trim();

const SOL_USD = clampNum(Number(process.env.SOL_USD || 80), 1, 100000);

// amm
const VIRTUAL_SOL = clampNum(Number(process.env.VIRTUAL_SOL || 30), 0, 1000000);
const VIRTUAL_TOKEN_PCT = clampNum(Number(process.env.VIRTUAL_TOKEN_PCT || 2), 0.1, 95);
const salePct = clampNum(Number(process.env.SALE_SUPPLY_PCT || 80), 1, 100);

const TOTAL_SUPPLY = Number(process.env.TOTAL_SUPPLY || 1000000000);

// limits
const MAX_LAST_TX = 400;
const MAX_COINS = 5000;

// -------------------- APP SETUP --------------------
if (TRUST_PROXY) app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: false }));
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

// -------------------- CLIENTS --------------------
const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

const connection = new Connection(SOLANA_RPC, "confirmed");

// -------------------- HELPERS --------------------
function nowMS() {
  return Date.now();
}

function clampNum(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function safeNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function uid() {
  return Math.random().toString(36).slice(2) + nowMS().toString(36);
}

function asObj(v, fallback = {}) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : fallback;
}

function defaultStore() {
  return {
    coins: [],
    profiles: {},
    lastTx: [],
    createdAt: nowMS(),
    updatedAt: nowMS(),
    feePct: FEE_PCT,
  };
}

function ensureProfile(store, wallet) {
  store.profiles = asObj(store.profiles, {});
  const w = String(wallet || "").trim();
  if (!w) return null;

  if (!store.profiles[w]) {
    store.profiles[w] = {
      referrer: "",
      referralRewardsSol: 0,
      creatorRewardsSol: 0,
      createdAt: nowMS(),
      updatedAt: nowMS(),
    };
  }

  return store.profiles[w];
}

function calcPricing({ totalSupply, solReserve, tokenReserve, vSol, vTokens }) {
  const total = Math.max(1, safeNum(totalSupply, 0));
  const reserveSol = Math.max(0, safeNum(solReserve, 0));
  const reserveTokens = Math.max(0, safeNum(tokenReserve, 0));
  const virtSol = Math.max(1e-9, safeNum(vSol, 0));
  const virtTokens = Math.max(1, safeNum(vTokens, 0));

  const x = reserveSol + virtSol;
  const y = Math.max(1e-9, reserveTokens + virtTokens);

  const priceSol = x / y;
  const priceUsd = Math.max(0, priceSol * SOL_USD);

  const circulating = Math.max(1, total - reserveTokens);
  const mcUsd = Math.max(0, priceUsd * circulating);

  return { priceSol, priceUsd, mcUsd, circulating };
}

async function uploadLogoToIPFS(dataUrl, fileName = "coin-logo.webp") {
  const m = String(dataUrl || "").match(/^data:(.+?);base64,(.+)$/);
  if (!m) throw new Error("Invalid logo data");

  const mimeType = m[1];
  const base64Data = m[2];
  const buffer = Buffer.from(base64Data, "base64");

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimeType }), fileName);

  const meta = JSON.stringify({
    name: fileName,
  });
  form.append("pinataMetadata", meta);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
    },
    body: form,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json?.IpfsHash) {
    throw new Error(json?.error?.reason || json?.message || "Logo IPFS upload failed");
  }

  return {
    cid: json.IpfsHash,
    url: `https://gateway.pinata.cloud/ipfs/${json.IpfsHash}`,
    ipfs: `ipfs://${json.IpfsHash}`,
  };
}

async function uploadMetadataToIPFS(metadata) {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataContent: metadata,
    }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json?.IpfsHash) {
    throw new Error(json?.error?.reason || json?.message || "Metadata IPFS upload failed");
  }

  return {
    cid: json.IpfsHash,
    url: `https://gateway.pinata.cloud/ipfs/${json.IpfsHash}`,
    ipfs: `ipfs://${json.IpfsHash}`,
  };
}

function ensureCoin(input = {}) {
  const totalSupply = safeNum(input.totalSupply, TOTAL_SUPPLY);

  const rawCurveSupply = safeNum(
    input.curveSupply,
    safeNum(input.tokenReserve, totalSupply)
  );
  const curveSupply = clampNum(rawCurveSupply, 0, totalSupply);

  const rawCurveSold = safeNum(input.curveSold, Math.max(0, curveSupply - safeNum(input.tokenReserve, curveSupply)));
  const curveSold = clampNum(rawCurveSold, 0, curveSupply);

  const tokenReserve = clampNum(curveSupply - curveSold, 0, totalSupply);

  const vTokens = safeNum(input.vTokens, (curveSupply * VIRTUAL_TOKEN_PCT) / 100);
  const vSol = safeNum(input.vSol, VIRTUAL_SOL);
  const solReserve = Math.max(0, safeNum(input.solReserve, 0));

  const pricing = calcPricing({
    totalSupply,
    solReserve,
    tokenReserve,
    vSol,
    vTokens,
  });

  const holders = asObj(input.holders, {});
  const chartInput = Array.isArray(input.chart)
    ? input.chart.filter((n) => Number.isFinite(Number(n))).map(Number)
    : [];

  const mc = pricing.mcUsd;
  const ath = Math.max(safeNum(input.ath, mc), mc);
  const chart =
    chartInput.length > 0
      ? chartInput.slice(-120)
      : [mc, mc, mc, mc, mc].map((n) => safeNum(n, 0));

  return {
    id: String(input.id || uid()),
    name: String(input.name || "").trim(),
    symbol: String(input.symbol || "").trim().toUpperCase(),
    story: String(input.story || "").trim(),
    logo: String(input.logo || ""),
    creatorWallet: String(input.creatorWallet || input.creator_wallet || input.owner || "").trim(),
    owner: String(input.owner || input.creatorWallet || input.creator_wallet || "").trim(),
    createdAt: safeNum(input.createdAt, nowMS()),
    status: String(input.status || "LIVE").toUpperCase(),

    totalSupply,
    curveSupply,
    curveSold,
    vTokens,
    vSol,
    solReserve,
    tokenReserve,
    holders,

    volumeSol: Math.max(0, safeNum(input.volumeSol, 0)),
    lastTradeAt: safeNum(input.lastTradeAt, 0),

    priceSol: pricing.priceSol,
    priceUsd: pricing.priceUsd,
    mc,
    ath,
    chart,

    creatorRewardsSol: Math.max(0, safeNum(input.creatorRewardsSol, 0)),
  };
}

function sanitizeStore(storeLike) {
  const src = storeLike && typeof storeLike === "object" ? storeLike : defaultStore();
  const store = defaultStore();

  store.createdAt = safeNum(src.createdAt, nowMS());
  store.updatedAt = safeNum(src.updatedAt, nowMS());
  store.feePct = safeNum(src.feePct, FEE_PCT);

  store.coins = Array.isArray(src.coins) ? src.coins.map(ensureCoin).slice(0, MAX_COINS) : [];
  store.profiles = asObj(src.profiles, {});
  store.lastTx = Array.isArray(src.lastTx)
    ? src.lastTx
        .map((t) => ({
          id: String(t?.id || uid()),
          type: String(t?.type || t?.side || "TX").toUpperCase(),
          side: String(t?.side || t?.type || "TX").toUpperCase(),
          coinId: String(t?.coinId || ""),
          wallet: String(t?.wallet || ""),
          sol: Math.max(0, safeNum(t?.sol, 0)),
          tokens: Math.max(0, safeNum(t?.tokens, 0)),
          fee: Math.max(0, safeNum(t?.fee, 0)),
          ts: safeNum(t?.ts || t?.t, nowMS()),
        }))
        .slice(0, MAX_LAST_TX)
    : [];

  for (const wallet of Object.keys(store.profiles)) {
    const p = asObj(store.profiles[wallet], {});
    store.profiles[wallet] = {
      referrer: String(p.referrer || "").trim(),
      referralRewardsSol: Math.max(0, safeNum(p.referralRewardsSol, 0)),
      creatorRewardsSol: Math.max(0, safeNum(p.creatorRewardsSol, 0)),
      createdAt: safeNum(p.createdAt, nowMS()),
      updatedAt: safeNum(p.updatedAt, nowMS()),
    };
  }

  return store;
}

function pushLastTx(store, tx) {
  store.lastTx = Array.isArray(store.lastTx) ? store.lastTx : [];
  store.lastTx.unshift({
    id: String(tx?.id || uid()),
    type: String(tx?.type || tx?.side || "TX").toUpperCase(),
    side: String(tx?.side || tx?.type || "TX").toUpperCase(),
    coinId: String(tx?.coinId || ""),
    wallet: String(tx?.wallet || ""),
    sol: Math.max(0, safeNum(tx?.sol, 0)),
    tokens: Math.max(0, safeNum(tx?.tokens, 0)),
    fee: Math.max(0, safeNum(tx?.fee, 0)),
    ts: safeNum(tx?.ts, nowMS()),
  });
  store.lastTx = store.lastTx.slice(0, MAX_LAST_TX);
}

function findCoinIndex(store, coinId) {
  return (store.coins || []).findIndex((c) => String(c.id) === String(coinId));
}

function countReferrals(store, wallet) {
  const w = String(wallet || "").trim();
  if (!w) return 0;
  const profiles = asObj(store.profiles, {});
  let count = 0;
  for (const key of Object.keys(profiles)) {
    if (String(profiles[key]?.referrer || "").trim() === w) count += 1;
  }
  return count;
}

// -------------------- STORE CACHE --------------------
let STORE_CACHE = null;
let WRITE_TIMER = null;
let WRITE_IN_FLIGHT = false;
let WRITE_AGAIN = false;

async function loadLegacyCoinsIfNeeded(store) {
  if (!supabase) return sanitizeStore(store);

  try {
    const baseCoins = Array.isArray(store?.coins) ? store.coins.map(ensureCoin) : [];

    const { data, error } = await supabase
      .from("coins")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !Array.isArray(data)) {
      return sanitizeStore(store);
    }

    const tableCoins = data.map((r) =>
      ensureCoin({
        id: r.id,
        name: r.name || "",
        symbol: r.symbol || "",
        story: r.story || "",
        logo: r.logo || "",
        creatorWallet: r.creator_wallet || "",
        owner: r.creator_wallet || "",
        createdAt: r.created_at ? new Date(r.created_at).getTime() : nowMS(),
        status: "LIVE",
        holders: r.holders || {},
        volumeSol: r.volume_sol || 0,
        lastTradeAt: r.last_trade_at || 0,
        totalSupply: r.total_supply || TOTAL_SUPPLY,
        solReserve: r.reserve_sol || 0,
        tokenReserve: r.reserve_token || TOTAL_SUPPLY,
        mc: r.market_cap || 0,
        priceSol: r.last_price || 0,
      })
    );

    const merged = new Map();

    for (const c of tableCoins) {
      if (c?.id) merged.set(c.id, c);
    }

    for (const c of baseCoins) {
      if (!c?.id) continue;
      const prev = merged.get(c.id) || {};
      merged.set(c.id, {
        ...prev,
        ...c,
        holders:
          c.holders && Object.keys(c.holders).length
            ? c.holders
            : (prev.holders || {}),
      });
    }

    return sanitizeStore({
      ...store,
      coins: Array.from(merged.values()).sort(
        (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)
      ),
    });
  } catch (e) {
    console.log("Legacy coins merge failed:", e?.message || e);
    return sanitizeStore(store);
  }
}

async function loadStoreOnce() {
  if (STORE_CACHE) return STORE_CACHE;

  if (DB_MODE !== "supabase" || !supabase) {
    STORE_CACHE = defaultStore();
    return STORE_CACHE;
  }

  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLE)
      .select("id, data, updated_at")
      .eq("id", "main")
      .maybeSingle();

    if (error) {
      console.log("Store read error:", error.message);
      STORE_CACHE = await loadLegacyCoinsIfNeeded(defaultStore());
      return STORE_CACHE;
    }

    const base = sanitizeStore(data?.data || defaultStore());
    STORE_CACHE = await loadLegacyCoinsIfNeeded(base);
    await flushStoreNow();

    if (!data?.data && STORE_CACHE) {
      await flushStoreNow();
    }

    return STORE_CACHE;
  } catch (e) {
    console.log("Store load exception:", e?.message || e);
    STORE_CACHE = await loadLegacyCoinsIfNeeded(defaultStore());
    return STORE_CACHE;
  }
}

async function flushStoreNow() {
  if (DB_MODE !== "supabase" || !supabase) return;

  const store = sanitizeStore(STORE_CACHE || defaultStore());
  store.updatedAt = nowMS();
  STORE_CACHE = store;

  const payload = {
    id: "main",
    data: store,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from(SUPABASE_TABLE).upsert(payload, { onConflict: "id" });
  if (error) throw error;
  if (Array.isArray(store.coins) && store.coins.length) {
  const coinRows = store.coins.map((c) => ({
    id: c.id,
    name: c.name || "",
    symbol: c.symbol || "",
    story: c.story || "",
    logo: c.logo || "",
    creator_wallet: c.creatorWallet || c.owner || "",
    created_at: new Date(c.createdAt || Date.now()).toISOString(),
    volume_sol: c.volumeSol || 0,
    last_trade_at: c.lastTradeAt || 0,
    total_supply: c.totalSupply || TOTAL_SUPPLY,
    reserve_sol: c.solReserve || 0,
    reserve_token: c.tokenReserve || c.totalSupply || TOTAL_SUPPLY,
    market_cap: c.mc || 0,
    last_price: c.priceSol || 0,
    ath_market_cap: c.ath || 0,
creator_rewards: c.creatorRewardsSol || 0,
chart: Array.isArray(c.chart) ? c.chart : [],
holders: c.holders || {},
  }));

  const { error: coinsSyncError } = await supabase
    .from("coins")
    .upsert(coinRows, { onConflict: "id" });

  if (coinsSyncError) throw coinsSyncError;
}
}

function scheduleStoreWrite() {
  if (DB_MODE !== "supabase" || !supabase) return;

  if (WRITE_IN_FLIGHT) {
    WRITE_AGAIN = true;
    return;
  }

  if (WRITE_TIMER) return;

  WRITE_TIMER = setTimeout(async () => {
    WRITE_TIMER = null;
    WRITE_IN_FLIGHT = true;

    try {
      await flushStoreNow();
    } catch (e) {
      console.log("Store write failed:", e?.message || e);
    } finally {
      WRITE_IN_FLIGHT = false;
      if (WRITE_AGAIN) {
        WRITE_AGAIN = false;
        scheduleStoreWrite();
      }
    }
  }, 250);
}

// -------------------- AMM --------------------
function applyFee(solAmount) {
  const gross = Math.max(0, safeNum(solAmount, 0));
  const fee = gross * (FEE_PCT / 100);
  const net = Math.max(0, gross - fee);
  return { fee, net };
}

function distributeFee(store, coin, traderWallet, feeSol) {
  if (feeSol <= 0) return;

  const creatorWallet = String(coin.creatorWallet || coin.owner || "").trim();
  const trader = String(traderWallet || "").trim();

  const ownerPart = feeSol * (OWNER_PCT_OF_FEE / 100);
  const creatorPart = feeSol * (CREATOR_PCT_OF_FEE / 100);

  let referrer = "";
  let refPart = 0;

  if (trader) {
    const traderProfile = ensureProfile(store, trader);
    referrer = String(traderProfile?.referrer || "").trim();

    if (referrer && referrer !== trader) {
      refPart = feeSol * (REFERRAL_PCT_OF_FEE / 100);
    }
  }

  // app owner
  if (APP_OWNER_WALLET && ownerPart > 0) {
    const ownerProfile = ensureProfile(store, APP_OWNER_WALLET);
    ownerProfile.ownerRewardsSol = Math.max(
      0,
      safeNum(ownerProfile.ownerRewardsSol, 0) + ownerPart
    );
    ownerProfile.updatedAt = nowMS();
  }

  // coin creator
  if (creatorWallet && creatorPart > 0) {
    const creatorProfile = ensureProfile(store, creatorWallet);
    creatorProfile.creatorRewardsSol = Math.max(
      0,
      safeNum(creatorProfile.creatorRewardsSol, 0) + creatorPart
    );
    creatorProfile.updatedAt = nowMS();

    coin.creatorRewardsSol = Math.max(
      0,
      safeNum(coin.creatorRewardsSol, 0) + creatorPart
    );
  }

  // referral
  if (referrer && refPart > 0) {
    const refProfile = ensureProfile(store, referrer);
    refProfile.referralRewardsSol = Math.max(
      0,
      safeNum(refProfile.referralRewardsSol, 0) + refPart
    );
    refProfile.updatedAt = nowMS();
  }
}



function recalcCoin(coin) {
  const fixed = ensureCoin(coin);

  const point = Math.max(
    0,
    safeNum(
      fixed.priceUsd ??
      fixed.price ??
      fixed.lastPriceUsd ??
      0,
      0
    )
  );

  const prev = Array.isArray(coin.chart) ? coin.chart : [];
  const nextChart = prev.length
    ? prev.slice(-119).concat([point])
    : [point, point, point, point, point];

  fixed.chart = nextChart.slice(-120);

  const currentMc = Math.max(0, safeNum(fixed.mc, 0));
  fixed.ath = Math.max(safeNum(coin.ath, 0), currentMc);

  return fixed;
}

function ammBuy(coin, wallet, solInGross) {
  const { fee, net } = applyFee(solInGross);
  if (net <= 0) return { ok: false, error: "Invalid amount" };

  const totalSupply = Math.max(1, safeNum(coin.totalSupply, TOTAL_SUPPLY));
  const curveSupply = Math.max(1, safeNum(coin.curveSupply, totalSupply));
  const curveSold = Math.max(0, safeNum(coin.curveSold, 0));
  const remainingCurve = Math.max(0, curveSupply - curveSold);

  if (remainingCurve <= 0.0000001) {
    return { ok: false, error: "Curve completed" };
  }

  const vSol = Math.max(1e-9, safeNum(coin.vSol, VIRTUAL_SOL));
  const vTokens = Math.max(
    1,
    safeNum(coin.vTokens, (curveSupply * VIRTUAL_TOKEN_PCT) / 100)
  );

  coin.solReserve = Math.max(0, safeNum(coin.solReserve, 0));
  coin.holders = asObj(coin.holders, {});

  // bonding curve now uses remaining curve allocation, not old free token pool
  const x = coin.solReserve + vSol;
  const y = remainingCurve + vTokens;
  const k = x * y;

  const newX = x + net;
  const newY = k / Math.max(1e-9, newX);

  let tokensOut = Math.max(0, y - newY);

  // user can never get more than remaining curve allocation
  tokensOut = Math.min(tokensOut, remainingCurve);

  if (tokensOut <= 0.0000001) {
    return { ok: false, error: "Trade too small" };
  }

  coin.vSol = vSol;
  coin.vTokens = vTokens;
  coin.solReserve = coin.solReserve + net;

  coin.curveSupply = curveSupply;
  coin.curveSold = Math.min(curveSupply, curveSold + tokensOut);

  // keep this for UI/backward compatibility
  coin.tokenReserve = Math.max(0, curveSupply - coin.curveSold);

  coin.holders[wallet] = Math.max(
    0,
    safeNum(coin.holders[wallet], 0) + tokensOut
  );

  coin.volumeSol = Math.max(0, safeNum(coin.volumeSol, 0) + solInGross);
  coin.lastTradeAt = nowMS();
  coin.status = coin.curveSold >= curveSupply - 0.0000001 ? "CURVE_COMPLETE" : "LIVE";

  // curve-driven price
  coin.priceSol =
    (safeNum(coin.vSol, VIRTUAL_SOL) / Math.max(1, curveSupply)) *
    (1 + (safeNum(coin.curveSold, 0) / Math.max(1, curveSupply)) * 20);

  const solUsd = Math.max(0, safeNum(coin.solUsd, safeNum(globalThis?.SOL_USD, 0)));
  coin.priceUsd = solUsd > 0 ? coin.priceSol * solUsd : 0;
  coin.marketCapSol = coin.priceSol * totalSupply;
  coin.marketCapUsd = coin.priceUsd * totalSupply;
  coin.mc = coin.marketCapUsd || coin.marketCapSol || 0;
  coin.ath = Math.max(safeNum(coin.ath, 0), safeNum(coin.mc, 0));

  return {
    ok: true,
    tokensOut,
    feeSol: fee,
    netSol: net,
    priceSol: coin.priceSol,
    priceUsd: coin.priceUsd,
    marketCapSol: coin.marketCapSol,
    marketCapUsd: coin.marketCapUsd,
  };
}

function ammSellBySolOut(coin, wallet, solOutGross) {
  const gross = Math.max(0, safeNum(solOutGross, 0));
  if (gross <= 0) return { ok: false, error: "Invalid amount" };

  const { fee, net } = applyFee(gross);
  if (net <= 0) return { ok: false, error: "Invalid amount" };

  const totalSupply = Math.max(1, safeNum(coin.totalSupply, TOTAL_SUPPLY));
  const curveSupply = Math.max(1, safeNum(coin.curveSupply, totalSupply));
  const curveSold = Math.max(0, safeNum(coin.curveSold, 0));

  const vSol = Math.max(1e-9, safeNum(coin.vSol, VIRTUAL_SOL));
  const vTokens = Math.max(
    1,
    safeNum(coin.vTokens, (curveSupply * VIRTUAL_TOKEN_PCT) / 100)
  );

  coin.solReserve = Math.max(0, safeNum(coin.solReserve, 0));
  coin.holders = asObj(coin.holders, {});

  if (coin.solReserve < gross) {
    return { ok: false, error: "Pool has low SOL liquidity" };
  }

  const have = Math.max(0, safeNum(coin.holders[wallet], 0));
  if (have <= 0) return { ok: false, error: "Not enough tokens" };

  // curve uses remaining allocation
  const remainingBefore = Math.max(0, curveSupply - curveSold);

  const x = coin.solReserve + vSol;
  const y = remainingBefore + vTokens;
  const k = x * y;

  const newX = Math.max(1e-9, x - gross);
  const newY = k / newX;

  let tokensIn = Math.max(0, newY - y);
  tokensIn = Math.min(tokensIn, have);

  if (tokensIn <= 0.0000001) {
    return { ok: false, error: "Trade too small" };
  }

  coin.vSol = vSol;
  coin.vTokens = vTokens;

  coin.holders[wallet] = Math.max(0, have - tokensIn);
  if (coin.holders[wallet] <= 0.0000001) delete coin.holders[wallet];

  coin.solReserve = Math.max(0, coin.solReserve - net);

  coin.curveSupply = curveSupply;
  coin.curveSold = Math.max(0, curveSold - tokensIn);

  // keep for UI/backward compatibility
  coin.tokenReserve = Math.max(0, curveSupply - coin.curveSold);

  coin.volumeSol = Math.max(0, safeNum(coin.volumeSol, 0) + gross);
  coin.lastTradeAt = nowMS();
  coin.status = "LIVE";

  coin.priceSol =
    (safeNum(coin.vSol, VIRTUAL_SOL) / Math.max(1, curveSupply)) *
    (1 + (safeNum(coin.curveSold, 0) / Math.max(1, curveSupply)) * 20);

  const solUsd = Math.max(0, safeNum(coin.solUsd, safeNum(globalThis?.SOL_USD, 0)));
  coin.priceUsd = solUsd > 0 ? coin.priceSol * solUsd : 0;
  coin.marketCapSol = coin.priceSol * totalSupply;
  coin.marketCapUsd = coin.priceUsd * totalSupply;
  coin.mc = coin.marketCapUsd || coin.marketCapSol || 0;
  coin.ath = Math.max(safeNum(coin.ath, 0), safeNum(coin.mc, 0));

  return {
    ok: true,
    tokensIn,
    feeSol: fee,
    netSol: net,
    priceSol: coin.priceSol,
    priceUsd: coin.priceUsd,
    marketCapSol: coin.marketCapSol,
    marketCapUsd: coin.marketCapUsd,
  };
}

// -------------------- ROUTES --------------------
app.get("/", async (req, res) => {
  return res.json({
    ok: true,
    name: "pumpmini-backend",
    dbMode: DB_MODE,
    ts: nowMS(),
  });
});

app.get("/health", async (req, res) => {
  const store = await loadStoreOnce();
  return res.json({
    ok: true,
    dbMode: DB_MODE,
    coins: Array.isArray(store?.coins) ? store.coins.length : 0,
    ts: nowMS(),
  });
});

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

app.get("/api/coin/list", async (req, res) => {
  try {
    const page = Math.max(0, Number(req.query?.page || 0));
    const pageSize = 100;
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("coins")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.log("Supabase coin/list error:", error);
      throw error;
    }

    const coins = (data || []).map((r) =>
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
        holders: r.holders || {},
        volumeSol: r.volume_sol || 0,
        lastTradeAt: r.last_trade_at || 0,
        totalSupply: r.total_supply || TOTAL_SUPPLY,
        solReserve: r.reserve_sol || 0,
        tokenReserve: r.reserve_token || TOTAL_SUPPLY,
        mc: r.market_cap || 0,
        ath: r.ath_market_cap || 0,
        priceSol: r.last_price || 0,
        ath: r.ath_market_cap || 0,
creatorRewardsSol: r.creator_rewards || 0,
chart: Array.isArray(r.chart) ? r.chart : [],
holders: r.holders || {},
      })
    );

    return res.json({
      ok: true,
      coins,
      count: count || coins.length,
      page,
      pageSize,
    });

  } catch (e) {
    console.log("coin/list error:", e);
    res.status(500).json({ ok: false });
  }
});

app.get("/api/migrate-coins", async (req, res) => {
  try {
    const store = await loadStoreOnce();
    const coins = Array.isArray(store.coins) ? store.coins : [];

    const rows = coins.map((c) => ({
      id: c.id,
      name: c.name || "",
      symbol: c.symbol || "",
      story: c.story || "",
      logo: c.logo || "",
      creator_wallet: c.creatorWallet || c.owner || "",
      created_at: new Date(c.createdAt || Date.now()).toISOString(),
      volume_sol: c.volumeSol || 0,
      last_trade_at: c.lastTradeAt || 0,
      total_supply: c.totalSupply || 0,
      reserve_sol: c.solReserve || 0,
      reserve_token: c.tokenReserve || 0,
      market_cap: c.mc || 0,
      last_price: c.priceSol || 0,
    }));

    const { error } = await supabase
      .from("coins")
      .upsert(rows, { onConflict: "id" });

    if (error) {
      console.log("Migration error:", error);
      return res.json({ ok: false, error });
    }

    return res.json({
      ok: true,
      migrated: rows.length,
    });
  } catch (e) {
    console.log("Migration exception:", e);
    return res.json({ ok: false, error: String(e) });
  }
});
  

app.post("/api/coin/create", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const symbol = String(req.body?.symbol || "").trim().toUpperCase();
    const story = String(req.body?.story || "").trim();
    const logo = String(req.body?.logo || "");
    const creatorWallet = String(req.body?.creatorWallet || "").trim();
    const initialSol = Math.max(0, safeNum(req.body?.initialSol, 0));

    let finalLogo = logo;
    let imageUri = "";
    let metadataUri = "";

    if (logo && process.env.PINATA_JWT) {
      const uploadedLogo = await uploadLogoToIPFS(
        logo,
        `${symbol || "coin"}-${Date.now()}.webp`
      );

      finalLogo = uploadedLogo.url;
      imageUri = uploadedLogo.ipfs;

      const uploadedMeta = await uploadMetadataToIPFS({
        name,
        symbol,
        description: story || `${name} (${symbol})`,
        image: uploadedLogo.ipfs,
      });

      metadataUri = uploadedMeta.ipfs;
    }

    if (!name || !symbol || !creatorWallet) {
      return res.json({ ok: false, error: "name/symbol/creatorWallet required" });
    }

    const store = await loadStoreOnce();
    ensureProfile(store, creatorWallet);

  const launchSol = Math.max(0, safeNum(req.body?.initialSol, 0));

let totalSupply = 1_000_000;

if (launchSol >= 0.01 && launchSol < 0.05) totalSupply = 10_000_000_000;
else if (launchSol >= 0.05 && launchSol < 0.1) totalSupply = 5_000_000_000;
else if (launchSol >= 0.1 && launchSol < 0.2) totalSupply = 2_000_000_000;
else if (launchSol >= 0.2 && launchSol < 0.5) totalSupply = 1_000_000_000;
else if (launchSol >= 0.5 && launchSol < 1) totalSupply = 500_000_000;
else if (launchSol >= 1 && launchSol < 2) totalSupply = 200_000_000;
else if (launchSol >= 2 && launchSol < 5) totalSupply = 100_000_000;
else if (launchSol >= 5 && launchSol < 10) totalSupply = 50_000_000;
else if (launchSol >= 10 && launchSol < 20) totalSupply = 20_000_000;
else if (launchSol >= 20 && launchSol < 50) totalSupply = 10_000_000;
else if (launchSol >= 50) totalSupply = 5_000_000;

const vTokens = (totalSupply * VIRTUAL_TOKEN_PCT) / 100;
const vSol = VIRTUAL_SOL;

    const coin = ensureCoin({
      id: uid(),
      name,
      symbol,
      story,
      logo: finalLogo,
      imageUri,
      metadataUri,
      creatorWallet,
      owner: creatorWallet,
      createdAt: nowMS(),
      status: "LIVE",
      totalSupply,
      vTokens,
      vSol,
      solReserve: 0,
      curveSupply: totalSupply,
curveSold: 0,
tokenReserve: totalSupply,
      holders: {},
      volumeSol: 0,
    });

    let createdCoin = coin;
    let createdTokens = 0;
    let createdFee = 0;

    if (initialSol > 0) {
      const firstBuy = ammBuy(createdCoin, creatorWallet, initialSol);
      if (!firstBuy?.ok) {
        return res.json({ ok: false, error: firstBuy?.error || "Initial buy failed" });
      }

      createdCoin = recalcCoin(createdCoin);
      createdTokens = Math.max(0, safeNum(firstBuy.tokensOut, 0));
      createdFee = Math.max(0, safeNum(firstBuy.feeSol, 0));

      distributeFee(store, createdCoin, creatorWallet, createdFee);
      createdCoin = recalcCoin(createdCoin);
    }

    store.coins.unshift(createdCoin);
    store.coins = store.coins.slice(0, MAX_COINS);

    pushLastTx(store, {
      id: uid(),
      type: "CREATE",
      side: "CREATE",
      coinId: createdCoin.id,
      wallet: creatorWallet,
      sol: initialSol,
      tokens: createdTokens,
      fee: createdFee,
      ts: nowMS(),
    });

   const { error: coinUpsertError } = await supabase
  .from("coins")
  .upsert({
    id: createdCoin.id,
    name: createdCoin.name,
    symbol: createdCoin.symbol,
    story: createdCoin.story || "",
    logo: createdCoin.logo || "",
    creator_wallet: createdCoin.creatorWallet || "",
    status: createdCoin.status || "LIVE",
    created_at: new Date(createdCoin.createdAt || Date.now()).toISOString(),
    holders: createdCoin.holders || {},
    volume_sol: createdCoin.volumeSol || 0,
    last_trade_at: createdCoin.lastTradeAt || 0,
    total_supply: createdCoin.totalSupply || TOTAL_SUPPLY,
    reserve_sol: createdCoin.solReserve || 0,
    reserve_token: createdCoin.tokenReserve || createdCoin.totalSupply || TOTAL_SUPPLY,
    market_cap: createdCoin.mc || 0,
    ath_market_cap: createdCoin.ath || createdCoin.mc || 0,
    last_price: createdCoin.priceSol || 0,
  }, { onConflict: "id" });

if (coinUpsertError) {
  console.log("SUPABASE CREATE UPSERT ERROR:", coinUpsertError);
  throw new Error(`Coin save failed: ${coinUpsertError.message || coinUpsertError}`);
}

STORE_CACHE = sanitizeStore(store);
await flushStoreNow();

return res.json({ ok: true, coin: createdCoin });



  } catch (e) {
    console.log("coin/create error:", e?.message || e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.post("/api/referral/set", async (req, res) => {
  try {
    const wallet = String(req.body?.wallet || "").trim();
    const referrer = String(req.body?.referrer || "").trim();

    if (!wallet || !referrer) return res.json({ ok: false, error: "wallet/referrer required" });
    if (wallet === referrer) return res.json({ ok: false, error: "invalid referrer" });
    if (referrer.length < 20) return res.json({ ok: false, error: "invalid referrer" });

    const store = await loadStoreOnce();
    const p = ensureProfile(store, wallet);

    if (p.referrer) {
      return res.json({ ok: false, error: "immutable: already set" });
    }

    p.referrer = referrer;
    p.updatedAt = nowMS();

    ensureProfile(store, referrer);

    STORE_CACHE = sanitizeStore(store);
    scheduleStoreWrite();

    return res.json({ ok: true, referrer });
  } catch (e) {
    console.log("referral/set error:", e?.message || e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

const COIN_TRADE_LOCKS = new Map();

async function runCoinLocked(coinId, fn) {
  const key = String(coinId || "");
  const prev = COIN_TRADE_LOCKS.get(key) || Promise.resolve();

  let release;
  const next = new Promise((resolve) => {
    release = resolve;
  });

  COIN_TRADE_LOCKS.set(key, prev.then(() => next));

  try {
    await prev;
    return await fn();
  } finally {
    release();
    if (COIN_TRADE_LOCKS.get(key) === next) {
      COIN_TRADE_LOCKS.delete(key);
    }
  }
}

async function doTrade(req, res, side) {
  const wallet = String(req.body?.wallet || "").trim();
  const coinId = String(req.body?.coinId || "").trim();
  const sol = Math.max(0, safeNum(req.body?.sol, 0));

  if (!wallet || !coinId || sol <= 0) {
    return res.json({ ok: false, error: "wallet/coinId/sol required" });
  }

  try {
    const result = await runCoinLocked(coinId, async () => {
      const store = await loadStoreOnce();
      ensureProfile(store, wallet);

      const idx = findCoinIndex(store, coinId);
      if (idx < 0) {
        return { ok: false, error: "token not found" };
      }

      let coin = ensureCoin(store.coins[idx]);
      let tradeResult = null;
      const sideLower = String(side).toLowerCase();

      if (sideLower === "buy") {
        tradeResult = ammBuy(coin, wallet, sol);
        if (!tradeResult.ok) return { ok: false, error: tradeResult.error };
      } else if (sideLower === "sell") {
        tradeResult = ammSellBySolOut(coin, wallet, sol);
        if (!tradeResult.ok) return { ok: false, error: tradeResult.error };
      } else {
        return { ok: false, error: "invalid side" };
      }

      distributeFee(store, coin, wallet, tradeResult.feeSol);
      coin = recalcCoin(coin);

      store.coins[idx] = coin;

      pushLastTx(store, {
        id: uid(),
        type: String(side).toUpperCase(),
        side: String(side).toUpperCase(),
        coinId,
        wallet,
        sol,
        tokens:
          sideLower === "buy"
            ? Math.max(0, safeNum(tradeResult.tokensOut, 0))
            : Math.max(0, safeNum(tradeResult.tokensIn, 0)),
        fee: Math.max(0, safeNum(tradeResult.feeSol, 0)),
        ts: nowMS(),
      });

      STORE_CACHE = sanitizeStore(store);

      // trade ke baad delayed write nahi, turant flush
      await flushStoreNow();

      return {
        ok: true,
        coin,
        tokens:
          sideLower === "buy"
            ? Math.max(0, safeNum(tradeResult.tokensOut || tradeResult.cappedTokensOut, 0))
            : Math.max(0, safeNum(tradeResult.tokensIn, 0)),
        fee: Math.max(0, safeNum(tradeResult.feeSol, 0)),
        netSol: Math.max(0, safeNum(tradeResult.netSol, 0)),
      };
    });

    if (!result?.ok) {
      return res.json(result || { ok: false, error: "Trade failed" });
    }

    return res.json(result);
  } catch (e) {
    console.log("trade error:", e?.message || e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

app.post("/api/coin/buy", (req, res) => doTrade(req, res, "buy"));
app.post("/api/coin/sell", (req, res) => doTrade(req, res, "sell"));

app.get("/api/profile/:wallet", async (req, res) => {
  try {
    const wallet = String(req.params.wallet || "").trim();
    if (!wallet) return res.json({ ok: false, error: "wallet required" });

    const store = await loadStoreOnce();
    const p = ensureProfile(store, wallet);

    let coins = (store.coins || []).map(ensureCoin);

// Supabase mode
if (DB_MODE === "supabase") {

  const page = Math.max(0, Number(req.query.page || 0));
const PAGE_SIZE = 100;

  const { data, error } = await supabase
    .from("coins")
    .select("*")
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

  if (error) {
    console.log("Supabase query error:", error);
    throw error;
  }

  console.log("DB_MODE:", DB_MODE, "supabase rows:", data?.length);

  coins = (data || []).map((r) =>
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
      holders: r.holders || {},
      volumeSol: r.volume_sol || 0,
      lastTradeAt: r.last_trade_at || 0,
      totalSupply: r.total_supply || TOTAL_SUPPLY,
      solReserve: r.reserve_sol || 0,
      tokenReserve: r.reserve_token || TOTAL_SUPPLY,
      mc: r.market_cap || 0,
      ath: r.ath_market_cap || 0,
      priceSol: r.last_price || 0,
    })
  );

}

    let myCreations = coins
  .filter((c) => String(c.creatorWallet || c.owner || "").trim() === wallet)
  .sort((a, b) => safeNum(b.createdAt, 0) - safeNum(a.createdAt, 0));

if (DB_MODE === "supabase") {
  const { data: myCoinsRows, error: myCoinsError } = await supabase
    .from("coins")
    .select("*")
    .eq("creator_wallet", wallet)
    .order("created_at", { ascending: false });

  if (myCoinsError) {
    console.log("Supabase myCreations error:", myCoinsError);
  } else {
    myCreations = (myCoinsRows || []).map((r) =>
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
        holders: r.holders || {},
        volumeSol: r.volume_sol || 0,
        lastTradeAt: r.last_trade_at || 0,
        totalSupply: r.total_supply || TOTAL_SUPPLY,
        solReserve: r.reserve_sol || 0,
        tokenReserve: r.reserve_token || TOTAL_SUPPLY,
        mc: r.market_cap || 0,
        ath: r.ath_market_cap || 0,
        priceSol: r.last_price || 0,
      })
    );
  }
}

    const holdings = coins
      .map((c) => {
        const amount = Math.max(0, safeNum(c.holders?.[wallet], 0));
        if (amount <= 0) return null;
        return {
          coinId: c.id,
          amount,
          lastAt: Math.max(
            safeNum(c.lastTradeAt, 0),
            ...((store.lastTx || [])
              .filter((t) => String(t.wallet || "") === wallet && String(t.coinId || "") === c.id)
              .map((t) => safeNum(t.ts, 0)))
          ),
        };
      })
      .filter(Boolean)
      .sort((a, b) => safeNum(b.lastAt, 0) - safeNum(a.lastAt, 0));

    const txs = (store.lastTx || [])
      .filter((t) => String(t.wallet || "") === wallet)
      .map((t) => ({
        id: t.id,
        coinId: t.coinId,
        side: t.side,
        sol: safeNum(t.sol, 0),
        tokens: safeNum(t.tokens, 0),
        fee: safeNum(t.fee, 0),
        t: safeNum(t.ts, 0),
      }))
      .sort((a, b) => safeNum(b.t, 0) - safeNum(a.t, 0))
      .slice(0, 120);

    const rewardsByCoin = {};
    for (const c of myCreations) {
      rewardsByCoin[c.id] = {
        coinId: c.id,
        symbol: c.symbol,
        sol: Math.max(0, safeNum(c.creatorRewardsSol, 0)),
      };
    }

    return res.json({
      ok: true,
      profile: {
        referrer: p?.referrer || "",
        referralCount: countReferrals(store, wallet),
        referralRewards: { totalSol: Math.max(0, safeNum(p?.referralRewardsSol, 0)) },
        rewards: {
          totalSol: Math.max(0, safeNum(p?.creatorRewardsSol, 0)),
          byCoin: rewardsByCoin,
        },
        holdings,
        txs,
      },
      myCreations,
      lastTx: (store.lastTx || []).slice(0, 120),
      feePct: FEE_PCT,
    });
  } catch (e) {
    console.log("profile error:", e?.message || e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.post("/api/withdraw", async (req, res) => {
  try {
    const wallet = String(req.body?.wallet || "").trim();
    const kindRaw = String(req.body?.kind || "").trim().toUpperCase();

    if (!wallet) return res.json({ ok: false, error: "wallet required" });

    const kind =
      kindRaw === "REFERRAL"
        ? "REF"
        : kindRaw === "REF"
        ? "REF"
        : kindRaw === "CREATOR"
        ? "CREATOR"
        : kindRaw === "MANUAL"
        ? "MANUAL"
        : "";

    if (!kind) return res.json({ ok: false, error: "Unsupported kind (use REF or CREATOR)" });
    if (kind === "MANUAL") return res.json({ ok: false, error: "Manual withdraw not enabled in demo backend" });

    const store = await loadStoreOnce();
    const p = ensureProfile(store, wallet);

    if (kind === "REF") {
      const amt = Math.max(0, safeNum(p.referralRewardsSol, 0));
      if (amt <= 0) return res.json({ ok: false, error: "No referral rewards" });

      p.referralRewardsSol = 0;
      p.updatedAt = nowMS();

      STORE_CACHE = sanitizeStore(store);
      scheduleStoreWrite();

      return res.json({ ok: true, kind: "REF", amountSol: amt, to: wallet });
    }

    if (kind === "CREATOR") {
      const amt = Math.max(0, safeNum(p.creatorRewardsSol, 0));
      if (amt <= 0) return res.json({ ok: false, error: "No creator rewards" });

      p.creatorRewardsSol = 0;
      p.updatedAt = nowMS();

      STORE_CACHE = sanitizeStore(store);
      scheduleStoreWrite();

      return res.json({ ok: true, kind: "CREATOR", amountSol: amt, to: wallet });
    }

    return res.json({ ok: false, error: "Unsupported kind (use REF or CREATOR)" });
  } catch (e) {
    console.log("withdraw error:", e?.message || e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.post("/api/withdraw/creator", async (req, res) => {
  req.body = { ...(req.body || {}), kind: "CREATOR" };
  return app._router.handle(req, res, () => {});
});

app.post("/api/withdraw/referral", async (req, res) => {
  req.body = { ...(req.body || {}), kind: "REF" };
  return app._router.handle(req, res, () => {});
});

// -------------------- START --------------------
async function start() {
  try {
    await loadStoreOnce();

    app.listen(PORT, () => {
      console.log("✅ Backend running on port:", PORT);
      console.log("✅ Solana RPC:", SOLANA_RPC);
      console.log("✅ DB MODE:", DB_MODE);
      console.log("✅ CORS_ORIGINS:", CORS_ORIGINS.join(", "));
      console.log("✅ JSON_LIMIT:", JSON_LIMIT);
      console.log("✅ Fee:", FEE_PCT + "%");
      console.log(
        "✅ Rewards: creator",
        CREATOR_PCT_OF_FEE + "% of fee, referral",
        REFERRAL_PCT_OF_FEE + "% of fee"
      );
      console.log("✅ AMM virtual:", "vSOL", VIRTUAL_SOL, "vTOK%", VIRTUAL_TOKEN_PCT);
      console.log("✅ SOL_USD:", SOL_USD);
      console.log("✅ Cached coins:", Array.isArray(STORE_CACHE?.coins) ? STORE_CACHE.coins.length : 0);
    });
  } catch (e) {
    console.error("❌ Startup failed:", e?.message || e);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  try {
    await flushStoreNow();
  } catch {}
  process.exit(0);
});

process.on("SIGTERM", async () => {
  try {
    await flushStoreNow();
  } catch {}
  process.exit(0);
});

start();