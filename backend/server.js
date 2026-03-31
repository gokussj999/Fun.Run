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

const FEE_PCT = clampNum(Number(process.env.FEE_PCT || 1), 0, 10);
const OWNER_PCT_OF_FEE = clampNum(Number(process.env.OWNER_PCT_OF_FEE || 40), 0, 100);
const CREATOR_PCT_OF_FEE = clampNum(Number(process.env.CREATOR_PCT_OF_FEE || 40), 0, 100);
const REFERRAL_PCT_OF_FEE = clampNum(Number(process.env.REFERRAL_PCT_OF_FEE || 20), 0, 100);

const APP_OWNER_WALLET = String(process.env.APP_OWNER_WALLET || "").trim();

const SOL_USD = clampNum(Number(process.env.SOL_USD || 80), 1, 100000);

const VIRTUAL_SOL = clampNum(Number(process.env.VIRTUAL_SOL || 30), 0, 1000000);
const VIRTUAL_TOKEN_PCT = clampNum(Number(process.env.VIRTUAL_TOKEN_PCT || 2), 0.1, 95);
const SALE_SUPPLY_PCT = clampNum(Number(process.env.SALE_SUPPLY_PCT || 80), 1, 100);

const TOTAL_SUPPLY = Math.max(1, Number(process.env.TOTAL_SUPPLY || 1_000_000_000));
const MAX_LAST_TX = 400;
const MAX_COINS = 5000;
const MAX_CHART_POINTS = 140;

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
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});
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
      ownerRewardsSol: 0,

      // 🔥 NEW
      referralCode: w.slice(0, 6),
      referralCount: 0,

      createdAt: nowMS(),
      updatedAt: nowMS(),
    };
  }

  // 🔥 ensure fields exist (old users ke liye)
  const p = store.profiles[w];

  if (!p.referralCode) {
    p.referralCode = w.slice(0, 6);
  }

  if (!p.referralCount) {
    p.referralCount = 0;
  }

  return p;
}

function saleSupplyFromTotal(totalSupply) {
  const total = Math.max(1, safeNum(totalSupply, TOTAL_SUPPLY));
  return Math.max(1, Math.floor(total * (SALE_SUPPLY_PCT / 100)));
}

function calcVirtualTokens(totalSupply, curveSupply, explicitVTokens) {
  const total = Math.max(1, safeNum(totalSupply, TOTAL_SUPPLY));
  const curve = Math.max(1, safeNum(curveSupply, saleSupplyFromTotal(total)));
  return Math.max(1, safeNum(explicitVTokens, (curve * VIRTUAL_TOKEN_PCT) / 100));
}

function calcPricing(input) {
  const totalSupply = Math.max(1, safeNum(input?.totalSupply, TOTAL_SUPPLY));
  const curveSupply = Math.max(
    1,
    safeNum(input?.curveSupply, saleSupplyFromTotal(totalSupply))
  );
  const solReserve = Math.max(0, safeNum(input?.solReserve, 0));
  const tokenReserve = Math.max(1, safeNum(input?.tokenReserve, curveSupply));

  const vSol = Math.max(1e-9, safeNum(input?.vSol, VIRTUAL_SOL));
  const vTokens = calcVirtualTokens(totalSupply, curveSupply, input?.vTokens);

  const priceSol = (solReserve + vSol) / (tokenReserve + vTokens);
  const priceUsd = priceSol * SOL_USD;

  const circulating = Math.max(0, totalSupply - tokenReserve);
  const mcUsd = priceUsd * circulating;

  return {
    priceSol,
    priceUsd,
    mcUsd,
    circulating,
  };
}

async function uploadLogoToIPFS(dataUrl, fileName = "coin-logo.webp") {
  const m = String(dataUrl || "").match(/^data:(.+?);base64,(.+)$/);
  if (!m) throw new Error("Invalid logo data");

  const mimeType = m[1];
  const base64Data = m[2];
  const buffer = Buffer.from(base64Data, "base64");

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimeType }), fileName);
  form.append("pinataMetadata", JSON.stringify({ name: fileName }));

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
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
    body: JSON.stringify({ pinataContent: metadata }),
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
  const totalSupply = Math.max(1, safeNum(input.totalSupply, TOTAL_SUPPLY));
  const curveSupplyDefault = saleSupplyFromTotal(totalSupply);

  const rawCurveSupply = safeNum(
    input.curveSupply,
    safeNum(input.tokenReserve, curveSupplyDefault)
  );
  const curveSupply = clampNum(rawCurveSupply, 1, totalSupply);

  const rawCurveSold = safeNum(
    input.curveSold,
    Math.max(0, curveSupply - safeNum(input.tokenReserve, curveSupply))
  );
  const curveSold = clampNum(rawCurveSold, 0, curveSupply);

  const tokenReserve = clampNum(
    safeNum(input.tokenReserve, curveSupply - curveSold),
    1,
    curveSupply
  );

  const vTokens = calcVirtualTokens(totalSupply, curveSupply, input.vTokens);
  const vSol = Math.max(1e-9, safeNum(input.vSol, VIRTUAL_SOL));
  const solReserve = Math.max(0, safeNum(input.solReserve, 0));

  const pricing = calcPricing({
    totalSupply,
    curveSupply,
    solReserve,
    tokenReserve,
    vSol,
    vTokens,
  });

  const chartInput = Array.isArray(input.chart)
    ? input.chart.filter((n) => Number.isFinite(Number(n))).map(Number)
    : [];

  const seedPrice = Math.max(0, safeNum(pricing.priceUsd, 0));
  const chart =
    chartInput.length > 0
      ? chartInput.slice(-MAX_CHART_POINTS)
      : [seedPrice, seedPrice, seedPrice, seedPrice, seedPrice];

  return {
    id: String(input.id || uid()),
    name: String(input.name || "").trim(),
    symbol: String(input.symbol || "").trim().toUpperCase(),
    story: String(input.story || "").trim(),
    logo: String(input.logo || ""),
    metadataUri: String(input.metadataUri || input.metadata_uri || ""),
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
    holders: asObj(input.holders, {}),

    volumeSol: Math.max(0, safeNum(input.volumeSol, 0)),
    lastTradeAt: safeNum(input.lastTradeAt, 0),

    priceSol: pricing.priceSol,
    priceUsd: pricing.priceUsd,
    price: pricing.priceUsd,
    lastPriceUsd: pricing.priceUsd,
    mc: Math.max(0, safeNum(input.mc, pricing.mcUsd)),
    ath: Math.max(
      Math.max(0, safeNum(input.ath, 0)),
      Math.max(0, safeNum(input.mc, pricing.mcUsd)),
      pricing.mcUsd
    ),
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
      ownerRewardsSol: Math.max(0, safeNum(p.ownerRewardsSol, 0)),
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

function syncCreatorRewardsFromCoins(store, wallet) {
  const w = String(wallet || "").trim();
  if (!w) return 0;

  const total = (store.coins || []).reduce((sum, coin) => {
    const c = ensureCoin(coin);
    if (String(c.creatorWallet || c.owner || "").trim() !== w) return sum;
    return sum + Math.max(0, safeNum(c.creatorRewardsSol, 0));
  }, 0);

  const profile = ensureProfile(store, w);
  if (profile) {
    profile.creatorRewardsSol = Math.max(0, total);
    profile.updatedAt = nowMS();
  }

  return total;
}

function deductCreatorRewardsFromCoins(store, wallet, amountSol) {
  const w = String(wallet || "").trim();
  let remaining = Math.max(0, safeNum(amountSol, 0));
  if (!w || remaining <= 0) return 0;

  const creations = (store.coins || [])
    .map((coin, idx) => ({ idx, coin: ensureCoin(coin) }))
    .filter(({ coin }) => String(coin.creatorWallet || coin.owner || "").trim() === w)
    .sort((a, b) => safeNum(b.coin.creatorRewardsSol, 0) - safeNum(a.coin.creatorRewardsSol, 0));

  let deducted = 0;

  for (const row of creations) {
    if (remaining <= 0) break;
    const current = Math.max(0, safeNum(row.coin.creatorRewardsSol, 0));
    if (current <= 0) continue;

    const take = Math.min(current, remaining);
    row.coin.creatorRewardsSol = Math.max(0, current - take);
    store.coins[row.idx] = ensureCoin(row.coin);

    deducted += take;
    remaining -= take;
  }

  syncCreatorRewardsFromCoins(store, w);
  return deducted;
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
        curveSupply: saleSupplyFromTotal(r.total_supply || TOTAL_SUPPLY),
        solReserve: r.reserve_sol || 0,
        tokenReserve: r.reserve_token || saleSupplyFromTotal(r.total_supply || TOTAL_SUPPLY),
        mc: r.market_cap || 0,
        ath: r.ath_market_cap || 0,
        priceSol: r.last_price || 0,
        creatorRewardsSol: r.creator_rewards || 0,
        chart: Array.isArray(r.chart) ? r.chart : [],
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
            : prev.holders || {},
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

  for (const wallet of Object.keys(store.profiles || {})) {
    syncCreatorRewardsFromCoins(store, wallet);
  }

  STORE_CACHE = store;

  const payload = {
    id: "main",
    data: store,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from(SUPABASE_TABLE)
    .upsert(payload, { onConflict: "id" });

  if (error) throw error;

  if (Array.isArray(store.coins) && store.coins.length) {
    const coinRows = store.coins.map((c) => {
      const coin = ensureCoin(c);
      return {
        id: coin.id,
        name: coin.name || "",
        symbol: coin.symbol || "",
        story: coin.story || "",
        logo: coin.logo || "",
        creator_wallet: coin.creatorWallet || coin.owner || "",
        created_at: new Date(coin.createdAt || Date.now()).toISOString(),
        volume_sol: coin.volumeSol || 0,
        last_trade_at: coin.lastTradeAt || 0,
        total_supply: coin.totalSupply || TOTAL_SUPPLY,
        reserve_sol: coin.solReserve || 0,
        reserve_token:
          coin.tokenReserve ||
          coin.curveSupply ||
          saleSupplyFromTotal(coin.totalSupply || TOTAL_SUPPLY),
        market_cap: coin.mc || 0,
        last_price: coin.priceSol || 0,
        ath_market_cap: coin.ath || 0,
        creator_rewards: coin.creatorRewardsSol || 0,
        chart: Array.isArray(coin.chart) ? coin.chart.slice(-MAX_CHART_POINTS) : [],
        holders: coin.holders || {},
      };
    });

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
  }, 180);
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

  if (APP_OWNER_WALLET && ownerPart > 0) {
    const ownerProfile = ensureProfile(store, APP_OWNER_WALLET);
    ownerProfile.ownerRewardsSol = Math.max(
      0,
      safeNum(ownerProfile.ownerRewardsSol, 0) + ownerPart
    );
    ownerProfile.updatedAt = nowMS();
  }

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

  if (referrer && refPart > 0) {
    const refProfile = ensureProfile(store, referrer);
    refProfile.referralRewardsSol = Math.max(
      0,
      safeNum(refProfile.referralRewardsSol, 0) + refPart
    );
    refProfile.updatedAt = nowMS();
  }
}

function recalcCoin(coin, opts = {}) {
  const fixed = ensureCoin(coin);

  const pricing = calcPricing({
    totalSupply: fixed.totalSupply,
    curveSupply: fixed.curveSupply,
    solReserve: fixed.solReserve,
    tokenReserve: fixed.tokenReserve,
    vSol: fixed.vSol,
    vTokens: fixed.vTokens,
  });

  fixed.priceSol = pricing.priceSol;
  fixed.priceUsd = pricing.priceUsd;
  fixed.price = pricing.priceUsd;
  fixed.lastPriceUsd = pricing.priceUsd;
  fixed.mc = pricing.mcUsd;

  const point = Math.max(0, safeNum(pricing.priceUsd, 0));
  const prev = Array.isArray(fixed.chart) ? fixed.chart : [];
  const shouldAppend = opts.appendChart !== false;

  fixed.chart = shouldAppend
    ? prev.length
      ? prev.slice(-(MAX_CHART_POINTS - 1)).concat([point])
      : [point, point, point, point, point]
    : prev.length
    ? prev.slice(-MAX_CHART_POINTS)
    : [point, point, point, point, point];

  fixed.lastTradeAt = nowMS();
  fixed.ath = Math.max(safeNum(fixed.ath, 0), pricing.mcUsd);

  return fixed;
}

function ammBuy(coin, wallet, solInGross) {
  const { fee, net } = applyFee(solInGross);
  if (net <= 0) return { ok: false, error: "Invalid amount" };

  const totalSupply = Math.max(1, safeNum(coin.totalSupply, TOTAL_SUPPLY));
  const curveSupply = Math.max(1, safeNum(coin.curveSupply, saleSupplyFromTotal(totalSupply)));

  coin.holders = asObj(coin.holders, {});
  coin.solReserve = Math.max(0, safeNum(coin.solReserve, 0));

  const currentTokenReserve = clampNum(
    safeNum(coin.tokenReserve, curveSupply),
    1,
    curveSupply
  );

  const vSol = Math.max(1e-9, safeNum(coin.vSol, VIRTUAL_SOL));
  const vTokens = calcVirtualTokens(totalSupply, curveSupply, coin.vTokens);

  const minTokenReserve = Math.max(1, Math.floor(curveSupply * 0.02));

  const x = coin.solReserve + vSol;
  const y = currentTokenReserve + vTokens;
  const k = x * y;

  const newX = x + net;
  const newY = k / Math.max(1e-9, newX);

  let tokensOut = Math.max(0, y - newY);

  const maxTokensOut = Math.max(0, currentTokenReserve - minTokenReserve);
  tokensOut = Math.min(tokensOut, maxTokensOut);

  if (tokensOut <= 0.0000001) {
    return { ok: false, error: "Buy amount too small or reserve floor reached" };
  }

  coin.vSol = vSol;
  coin.vTokens = vTokens;
  coin.curveSupply = curveSupply;

  coin.solReserve = Math.max(0, coin.solReserve + net);
  coin.tokenReserve = Math.max(minTokenReserve, currentTokenReserve - tokensOut);
  coin.curveSold = clampNum(curveSupply - coin.tokenReserve, 0, curveSupply);

  coin.holders[wallet] = Math.max(
    0,
    safeNum(coin.holders[wallet], 0) + tokensOut
  );

  coin.volumeSol = Math.max(0, safeNum(coin.volumeSol, 0) + solInGross);
  coin.lastTradeAt = nowMS();
  coin.status = "LIVE";

  const pricing = calcPricing({
    totalSupply,
    curveSupply,
    solReserve: coin.solReserve,
    tokenReserve: coin.tokenReserve,
    vSol: coin.vSol,
    vTokens: coin.vTokens,
  });

  coin.priceSol = pricing.priceSol;
  coin.priceUsd = pricing.priceUsd;
  coin.price = pricing.priceUsd;
  coin.lastPriceUsd = pricing.priceUsd;
  coin.marketCapUsd = pricing.mcUsd;
  coin.marketCapSol = pricing.priceSol * totalSupply;
  coin.mc = pricing.mcUsd || 0;
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

function ammSellBySolOut(coin, wallet, solOutGrossRequested) {
  const requested = Math.max(0, safeNum(solOutGrossRequested, 0));
  if (requested <= 0) return { ok: false, error: "Invalid amount" };

  const totalSupply = Math.max(1, safeNum(coin.totalSupply, TOTAL_SUPPLY));
  const curveSupply = Math.max(1, safeNum(coin.curveSupply, saleSupplyFromTotal(totalSupply)));

  coin.holders = asObj(coin.holders, {});
  coin.solReserve = Math.max(0, safeNum(coin.solReserve, 0));
  coin.tokenReserve = clampNum(
    safeNum(coin.tokenReserve, curveSupply),
    1,
    curveSupply
  );

  const holderBal = Math.max(0, safeNum(coin.holders[wallet], 0));
  if (holderBal <= 0) return { ok: false, error: "Not enough tokens" };

  const vSol = Math.max(1e-9, safeNum(coin.vSol, VIRTUAL_SOL));
  const vTokens = calcVirtualTokens(totalSupply, curveSupply, coin.vTokens);

  const maxGrossPossible = Math.max(0, coin.solReserve);
  const grossSolOut = Math.min(requested, maxGrossPossible);

  if (grossSolOut <= 0.0000001) {
    return { ok: false, error: "Pool has no SOL" };
  }

  const x = coin.solReserve + vSol;
  const y = coin.tokenReserve + vTokens;
  const k = x * y;

  const newX = x - grossSolOut;
  if (newX <= 1e-9) {
    return { ok: false, error: "Sell too large" };
  }

  const newY = k / newX;
  const tokensIn = Math.max(0, newY - y);

  if (tokensIn <= 0.0000001) {
    return { ok: false, error: "Sell too small" };
  }

  if (tokensIn > holderBal) {
    return { ok: false, error: "Not enough tokens" };
  }

  const fee = grossSolOut * (FEE_PCT / 100);
  const netSol = Math.max(0, grossSolOut - fee);

  coin.solReserve = Math.max(0, coin.solReserve - grossSolOut);
  coin.tokenReserve = clampNum(coin.tokenReserve + tokensIn, 1, curveSupply);
  coin.curveSupply = curveSupply;
  coin.curveSold = clampNum(curveSupply - coin.tokenReserve, 0, curveSupply);
  coin.holders[wallet] = Math.max(0, holderBal - tokensIn);

  if (coin.holders[wallet] <= 0.0000001) {
    delete coin.holders[wallet];
  }

  coin.volumeSol = Math.max(0, safeNum(coin.volumeSol, 0) + grossSolOut);
  coin.lastTradeAt = nowMS();
  coin.status = "LIVE";

  const pricing = calcPricing({
    totalSupply,
    curveSupply,
    solReserve: coin.solReserve,
    tokenReserve: coin.tokenReserve,
    vSol,
    vTokens,
  });

  coin.vSol = vSol;
  coin.vTokens = vTokens;
  coin.priceSol = pricing.priceSol;
  coin.priceUsd = pricing.priceUsd;
  coin.price = pricing.priceUsd;
  coin.lastPriceUsd = pricing.priceUsd;
  coin.marketCapUsd = pricing.mcUsd;
  coin.marketCapSol = pricing.priceSol * totalSupply;
  coin.mc = pricing.mcUsd || 0;
  coin.ath = Math.max(safeNum(coin.ath, 0), safeNum(coin.mc, 0));

  return {
    ok: true,
    tokensIn,
    solOut: grossSolOut,
    solOutGross: grossSolOut,
    solOutNet: netSol,
    feeSol: fee,
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
  } catch {
    return res.json({ ok: true, sol: 0 });
  }
});

app.get("/api/coin/list", async (req, res) => {
  try {
    const page = Math.max(0, Number(req.query?.page || 0));
    const pageSize = 100;
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let allCoins = [];

    if (DB_MODE === "supabase" && supabase) {
      const { data, error, count } = await supabase
        .from("coins")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const rows = Array.isArray(data) ? data : [];
      allCoins = rows.map((r) =>
        ensureCoin({
          id: r.id,
          name: r.name || "",
          symbol: r.symbol || "",
          story: r.story || "",
          logo: r.logo || "",
          creatorWallet: r.creator_wallet || "",
          owner: r.creator_wallet || "",
          status: "LIVE",
          createdAt: r.created_at ? new Date(r.created_at).getTime() : nowMS(),
          holders: r.holders || {},
          volumeSol: r.volume_sol || 0,
          lastTradeAt: r.last_trade_at || 0,
          totalSupply: r.total_supply || TOTAL_SUPPLY,
          curveSupply: saleSupplyFromTotal(r.total_supply || TOTAL_SUPPLY),
          solReserve: r.reserve_sol || 0,
          tokenReserve: r.reserve_token || saleSupplyFromTotal(r.total_supply || TOTAL_SUPPLY),
          mc: r.market_cap || 0,
          ath: r.ath_market_cap || 0,
          priceSol: r.last_price || 0,
          creatorRewardsSol: r.creator_rewards || 0,
          chart: Array.isArray(r.chart) ? r.chart : [],
        })
      );

      const store = await loadStoreOnce();
      const memMap = new Map((store.coins || []).map((c) => [String(c.id), ensureCoin(c)]));

      allCoins = allCoins.map((c) => {
        const mem = memMap.get(String(c.id));
        if (!mem) return c;
        return ensureCoin({
          ...c,
          holders:
            mem.holders && Object.keys(mem.holders).length
              ? mem.holders
              : c.holders || {},
          chart:
            Array.isArray(mem.chart) && mem.chart.length
              ? mem.chart
              : c.chart || [],
          lastTradeAt: Math.max(safeNum(c.lastTradeAt, 0), safeNum(mem.lastTradeAt, 0)),
          volumeSol: Math.max(safeNum(c.volumeSol, 0), safeNum(mem.volumeSol, 0)),
          mc: safeNum(mem.mc, 0) > 0 ? mem.mc : c.mc,
          ath: Math.max(safeNum(c.ath, 0), safeNum(mem.ath, 0)),
          creatorRewardsSol: Math.max(
            safeNum(c.creatorRewardsSol, 0),
            safeNum(mem.creatorRewardsSol, 0)
          ),
        });
      });

      let hot15m = [];
      try {
        const hotCutoff = nowMS() - 15 * 60 * 1000;
        hot15m = (store.coins || [])
          .map(ensureCoin)
          .filter((c) => safeNum(c.lastTradeAt, 0) >= hotCutoff)
          .sort((a, b) => safeNum(b.volumeSol, 0) - safeNum(a.volumeSol, 0))
          .slice(0, 10);
      } catch {}

      return res.json({
        ok: true,
        coins: allCoins,
        count: count || 0,
        page,
        pageSize,
        hot15m,
      });
    }

    const store = await loadStoreOnce();
    const latest = (store.coins || [])
      .map(ensureCoin)
      .sort((a, b) => safeNum(b.createdAt, 0) - safeNum(a.createdAt, 0));

    const hotCutoff = nowMS() - 15 * 60 * 1000;

    const hot15m = latest
      .filter((c) => safeNum(c.lastTradeAt, 0) >= hotCutoff)
      .sort((a, b) => safeNum(b.volumeSol, 0) - safeNum(a.volumeSol, 0))
      .slice(0, 10);

    return res.json({
      ok: true,
      coins: latest.slice(from, to + 1),
      count: latest.length,
      page,
      pageSize,
      hot15m,
    });
  } catch (e) {
    console.log("coin/list error:", e?.message || e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.get("/api/migrate-coins", async (req, res) => {
  try {
    if (!supabase) return res.json({ ok: false, error: "supabase not configured" });

    const store = await loadStoreOnce();
    const coins = Array.isArray(store.coins) ? store.coins.map(ensureCoin) : [];

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
      total_supply: c.totalSupply || TOTAL_SUPPLY,
      reserve_sol: c.solReserve || 0,
      reserve_token:
        c.tokenReserve || c.curveSupply || saleSupplyFromTotal(c.totalSupply || TOTAL_SUPPLY),
      market_cap: c.mc || 0,
      last_price: c.priceSol || 0,
      ath_market_cap: c.ath || 0,
      creator_rewards: c.creatorRewardsSol || 0,
      chart: Array.isArray(c.chart) ? c.chart : [],
      holders: c.holders || {},
    }));

    const { error } = await supabase.from("coins").upsert(rows, { onConflict: "id" });
    if (error) return res.json({ ok: false, error: error.message || String(error) });

    return res.json({ ok: true, migrated: rows.length });
  } catch (e) {
    console.log("Migration exception:", e);
    return res.json({ ok: false, error: String(e?.message || e) });
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

    if (!name || !symbol || !creatorWallet) {
      return res.json({ ok: false, error: "name/symbol/creatorWallet required" });
    }

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

    const store = await loadStoreOnce();
    ensureProfile(store, creatorWallet);

    const createdCoin = ensureCoin({
      id: uid(),
      name,
      symbol,
      story,
      logo: finalLogo,
      metadataUri,
      creatorWallet,
      owner: creatorWallet,
      createdAt: nowMS(),
      status: "LIVE",
      totalSupply: TOTAL_SUPPLY,
      curveSupply: saleSupplyFromTotal(TOTAL_SUPPLY),
      curveSold: 0,
      solReserve: 0,
      tokenReserve: saleSupplyFromTotal(TOTAL_SUPPLY),
      holders: {},
      volumeSol: 0,
      lastTradeAt: 0,
      creatorRewardsSol: 0,
      chart: [],
    });

    store.coins.unshift(createdCoin);
    STORE_CACHE = sanitizeStore(store);

    if (initialSol > 0) {
      const idx = findCoinIndex(STORE_CACHE, createdCoin.id);
      let coin = ensureCoin(STORE_CACHE.coins[idx]);
      const buyRes = ammBuy(coin, creatorWallet, initialSol);

      if (!buyRes.ok) {
        return res.json({ ok: false, error: buyRes.error || "Initial buy failed" });
      }

      distributeFee(STORE_CACHE, coin, creatorWallet, buyRes.feeSol);
      coin = recalcCoin(coin);
      STORE_CACHE.coins[idx] = coin;

      pushLastTx(STORE_CACHE, {
        id: uid(),
        type: "BUY",
        side: "BUY",
        coinId: coin.id,
        wallet: creatorWallet,
        sol: initialSol,
        tokens: Math.max(0, safeNum(buyRes.tokensOut, 0)),
        fee: Math.max(0, safeNum(buyRes.feeSol, 0)),
        ts: nowMS(),
      });
    }

    syncCreatorRewardsFromCoins(STORE_CACHE, creatorWallet);

    const finalCoin = ensureCoin(
      STORE_CACHE.coins[findCoinIndex(STORE_CACHE, createdCoin.id)]
    );

    await flushStoreNow();

    return res.json({ ok: true, coin: finalCoin, imageUri, metadataUri });
  } catch (e) {
    console.log("coin/create error:", e?.message || e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.post("/api/referral/set", async (req, res) => {
  try {
    const wallet = String(req.body?.wallet || "").trim();
    const referrer = String(req.body?.referrer || "").trim();

    if (!wallet || !referrer) {
      return res.json({ ok: false, error: "wallet/referrer required" });
    }
    if (wallet === referrer) {
      return res.json({ ok: false, error: "invalid referrer" });
    }
    if (referrer.length < 20) {
      return res.json({ ok: false, error: "invalid referrer" });
    }

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




// -------------------- TRADE LOCK --------------------
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
  const sideLower = String(side).toLowerCase();

  if (!wallet || !coinId) {
    return res.json({ ok: false, error: "wallet/coinId required" });
  }

  if (sol <= 0) {
    return res.json({ ok: false, error: "sol required" });
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

      if (sideLower === "buy") {
        tradeResult = ammBuy(coin, wallet, sol);
      } else if (sideLower === "sell") {
        tradeResult = ammSellBySolOut(coin, wallet, sol);
      } else {
        return { ok: false, error: "invalid side" };
      }

      if (!tradeResult?.ok) {
        return { ok: false, error: tradeResult?.error || "Trade failed" };
      }

      distributeFee(store, coin, wallet, tradeResult.feeSol);
      coin = recalcCoin(coin);

      store.coins[idx] = coin;
      syncCreatorRewardsFromCoins(
        store,
        String(coin.creatorWallet || coin.owner || "").trim()
      );

      pushLastTx(store, {
        id: uid(),
        type: String(side).toUpperCase(),
        side: String(side).toUpperCase(),
        coinId,
        wallet,
        sol:
          sideLower === "buy"
            ? sol
            : Math.max(0, safeNum(tradeResult.solOutNet, 0)),
        tokens:
          sideLower === "buy"
            ? Math.max(0, safeNum(tradeResult.tokensOut, 0))
            : Math.max(0, safeNum(tradeResult.tokensIn, 0)),
        fee: Math.max(0, safeNum(tradeResult.feeSol, 0)),
        ts: nowMS(),
      });

      STORE_CACHE = sanitizeStore(store);
      scheduleStoreWrite();

      return {
        ok: true,
        coin,
        tokens:
          sideLower === "buy"
            ? Math.max(0, safeNum(tradeResult.tokensOut, 0))
            : Math.max(0, safeNum(tradeResult.tokensIn, 0)),
        fee: Math.max(0, safeNum(tradeResult.feeSol, 0)),
        netSol:
          sideLower === "buy"
            ? Math.max(0, safeNum(tradeResult.netSol, 0))
            : Math.max(0, safeNum(tradeResult.solOutNet, 0)),
        grossSol:
          sideLower === "sell"
            ? Math.max(0, safeNum(tradeResult.solOutGross, 0))
            : Math.max(0, safeNum(sol, 0)),
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

 app.post("/api/coin/buy", (req, res) => doTrade(req, res, "buy"));
app.post("/api/coin/sell", (req, res) => doTrade(req, res, "sell"));



app.post("/api/claim", async (req, res) => {
  try {
    const { wallet, kind } = req.body;
    console.log("CLAIM BODY:", req.body);

    const store = await loadStoreOnce();
    const profile = ensureProfile(store, wallet);

    if (!profile) {
      return res.status(400).json({ error: "Invalid wallet" });
    }

    let amount = 0;

    if (kind === "CREATOR") {
      amount = Math.max(0, profile.creatorRewardsSol);
      if (amount <= 0) return res.json({ ok: true, amount: 0 });

      deductCreatorRewardsFromCoins(store, wallet, amount);
      profile.creatorRewardsSol = 0;
    }

    else if (kind === "REF") {
      amount = Math.max(0, profile.referralRewardsSol);
      if (amount <= 0) return res.json({ ok: true, amount: 0 });

      profile.referralRewardsSol = 0;
    }

    else {
      return res.status(400).json({ error: "Unsupported kind" });
    }

    profile.updatedAt = Date.now();

    scheduleStoreWrite();

    return res.json({
      ok: true,
      amount,
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



app.post("/api/withdraw", async (req, res) => {
  try {
    const { wallet, to, amount } = req.body;

    if (!wallet || !to || !amount) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // ⚠️ Abhi simulation
    return res.json({
      ok: true,
      message: "Withdraw simulated",
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});




app.get("/api/profile/:wallet", async (req, res) => {
  try {
    const wallet = String(req.params.wallet || "").trim();
    if (!wallet) return res.json({ ok: false, error: "wallet required" });

    const store = await loadStoreOnce();
    const p = ensureProfile(store, wallet);
    syncCreatorRewardsFromCoins(store, wallet);

    let coins = (store.coins || []).map(ensureCoin);

    if (DB_MODE === "supabase" && supabase) {
      const { data, error } = await supabase
        .from("coins")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) {
        console.log("Supabase query error:", error);
        throw error;
      }

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
          createdAt: r.created_at ? new Date(r.created_at).getTime() : nowMS(),
          holders: r.holders || {},
          volumeSol: r.volume_sol || 0,
          lastTradeAt: r.last_trade_at || 0,
          totalSupply: r.total_supply || TOTAL_SUPPLY,
          curveSupply: saleSupplyFromTotal(r.total_supply || TOTAL_SUPPLY),
          solReserve: r.reserve_sol || 0,
          tokenReserve: r.reserve_token || saleSupplyFromTotal(r.total_supply || TOTAL_SUPPLY),
          mc: r.market_cap || 0,
          ath: r.ath_market_cap || 0,
          priceSol: r.last_price || 0,
          creatorRewardsSol: r.creator_rewards || 0,
          chart: Array.isArray(r.chart) ? r.chart : [],
        })
      );

      const memMap = new Map((store.coins || []).map((c) => [String(c.id), ensureCoin(c)]));
      coins = coins.map((c) => {
        const mem = memMap.get(String(c.id));
        if (!mem) return c;
        return ensureCoin({
          ...c,
          holders:
            mem.holders && Object.keys(mem.holders).length
              ? mem.holders
              : c.holders || {},
          chart:
            Array.isArray(mem.chart) && mem.chart.length
              ? mem.chart
              : c.chart || [],
          creatorRewardsSol: Math.max(
            0,
            safeNum(mem.creatorRewardsSol, c.creatorRewardsSol || 0)
          ),
          lastTradeAt: Math.max(
            safeNum(mem.lastTradeAt, 0),
            safeNum(c.lastTradeAt, 0)
          ),
          volumeSol: Math.max(
            safeNum(mem.volumeSol, 0),
            safeNum(c.volumeSol, 0)
          ),
          mc: Math.max(
            safeNum(mem.mc, 0),
            safeNum(c.mc, 0)
          ),
          ath: Math.max(
            safeNum(mem.ath, 0),
            safeNum(c.ath, 0)
          ),
        });
      });
    }

    const myCreations = coins
      .filter((c) => String(c.creatorWallet || c.owner || "").trim() === wallet)
      .sort((a, b) => safeNum(b.createdAt, 0) - safeNum(a.createdAt, 0));

    const holdings = coins
      .map((c) => {
        const amount = Math.max(0, safeNum(c.holders?.[wallet], 0));
        if (amount <= 0) return null;

        return {
          coinId: c.id,
          symbol: c.symbol,
          name: c.name,
          logo: c.logo,
          amount,
          totalSupply: Math.max(1, safeNum(c.totalSupply, TOTAL_SUPPLY)),
          pct:
            Math.max(1, safeNum(c.totalSupply, TOTAL_SUPPLY)) > 0
              ? (amount / Math.max(1, safeNum(c.totalSupply, TOTAL_SUPPLY))) * 100
              : 0,
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
        referralCode: p?.referralCode || wallet.slice(0, 6),
        referralCount: countReferrals(store, wallet),
        referralRewards: {
          totalSol: Math.max(0, safeNum(p?.referralRewardsSol, 0)),
        },
        ownerRewards: {
          totalSol: Math.max(0, safeNum(p?.ownerRewardsSol, 0)),
        },
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

async function handleWithdraw(req, res, forcedKind = "") {
  try {
    const wallet = String(req.body?.wallet || "").trim();
    const kindRaw = String(forcedKind || req.body?.kind || "")
      .trim()
      .toUpperCase();

    if (!wallet) {
      return res.json({ ok: false, error: "wallet required" });
    }

    const kind =
      kindRaw === "REFERRAL"
        ? "REF"
        : kindRaw === "REF"
        ? "REF"
        : kindRaw === "CREATOR"
        ? "CREATOR"
        : kindRaw === "OWNER"
        ? "OWNER"
        : kindRaw === "MANUAL"
        ? "MANUAL"
        : "";

    if (kind === "MANUAL") {
      return res.json({
        ok: false,
        error: "Manual withdraw not enabled in demo backend",
      });
    }

    if (!["REF", "CREATOR", "OWNER"].includes(kind)) {
      return res.json({ ok: false, error: "Unsupported kind" });
    }

    const store = await loadStoreOnce();
    const p = ensureProfile(store, wallet);

    if (kind === "REF") {
      const amt = Math.max(0, safeNum(p.referralRewardsSol, 0));
      if (amt <= 0) {
        return res.json({ ok: false, error: "No referral rewards" });
      }

      p.ownerRewardsSol = Math.max(0, safeNum(p.ownerRewardsSol, 0)) + amt;
      p.referralRewardsSol = 0;
      p.updatedAt = nowMS();

      STORE_CACHE = sanitizeStore(store);
      await flushStoreNow();

      return res.json({ ok: true, kind: "REF", amountSol: amt, to: wallet });
    }

    if (kind === "CREATOR") {
      const amt = Math.max(0, safeNum(p.creatorRewardsSol, 0));
      if (amt <= 0) {
        return res.json({ ok: false, error: "No creator rewards" });
      }

      if (typeof deductCreatorRewardsFromCoins === "function") {
        deductCreatorRewardsFromCoins(store, wallet, amt);
      }

      const fresh = ensureProfile(store, wallet);
      fresh.ownerRewardsSol =
        Math.max(0, safeNum(fresh.ownerRewardsSol, 0)) + amt;
      fresh.creatorRewardsSol = 0;
      fresh.updatedAt = nowMS();

      STORE_CACHE = sanitizeStore(store);
      await flushStoreNow();

      return res.json({
        ok: true,
        kind: "CREATOR",
        amountSol: amt,
        to: wallet,
      });
    }

    if (kind === "OWNER") {
      const amt = Math.max(0, safeNum(p.ownerRewardsSol, 0));
      if (amt <= 0) {
        return res.json({ ok: false, error: "No wallet balance" });
      }

      p.ownerRewardsSol = 0;
      p.updatedAt = nowMS();

      STORE_CACHE = sanitizeStore(store);
      await flushStoreNow();

      return res.json({ ok: true, kind: "OWNER", amountSol: amt, to: wallet });
    }

    return res.json({ ok: false, error: "Unsupported kind" });
  } catch (e) {
    console.log("withdraw error:", e?.message || e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

app.post("/api/withdraw", (req, res) => handleWithdraw(req, res));
app.post("/api/withdraw/creator", (req, res) => handleWithdraw(req, res, "CREATOR"));
app.post("/api/withdraw/referral", (req, res) => handleWithdraw(req, res, "REF"));

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
        CREATOR_PCT_OF_FEE + "% of fee, owner",
        OWNER_PCT_OF_FEE + "% of fee, referral",
        REFERRAL_PCT_OF_FEE + "% of fee"
      );
      console.log("✅ AMM virtual:", "vSOL", VIRTUAL_SOL, "vTOK%", VIRTUAL_TOKEN_PCT);
      console.log("✅ SOL_USD:", SOL_USD);
      console.log(
        "✅ Cached coins:",
        Array.isArray(STORE_CACHE?.coins) ? STORE_CACHE.coins.length : 0
      );
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