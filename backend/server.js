console.log("FUNRUN SERVER UPDATED");

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import postgres from "postgres";
import { WebSocketServer } from "ws";
import NodeCache from "node-cache";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
} from "@solana/web3.js";
import treasury from "./solana/treasury.js";
import { createMint } from "@solana/spl-token";
import morgan from "morgan";
import crypto from "crypto";

// ---- F-08: Optional Redis client for distributed rate limiting ----
// Agar REDIS_URL set hai to ioredis use karo; warna in-memory fallback (single-instance).
let _redis = null;
if (process.env.REDIS_URL) {
  try {
    const { default: Redis } = await import("ioredis");
    _redis = new Redis(process.env.REDIS_URL, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      lazyConnect: false,
    });
    _redis.on("error", (e) => console.error("[redis:ratelimit] error:", e.message));
    console.log("[redis:ratelimit] connected — distributed rate limiting active");
  } catch (e) {
    console.warn("[redis:ratelimit] ioredis unavailable, falling back to in-memory:", e.message);
  }
}

class RedisRateLimitStore {
  constructor(prefix) {
    this.prefix = prefix;
    this.windowMs = 60_000;
  }
  init(opts) { this.windowMs = opts.windowMs; }
  async increment(key) {
    const rkey = `rl:${this.prefix}:${key}`;
    const total = await _redis.incr(rkey);
    if (total === 1) await _redis.pexpire(rkey, this.windowMs);
    const ttlMs = await _redis.pttl(rkey);
    return { totalHits: total, resetTime: new Date(Date.now() + Math.max(0, ttlMs)) };
  }
  async decrement(key) {
    const rkey = `rl:${this.prefix}:${key}`;
    const val = await _redis.decr(rkey);
    if (val <= 0) await _redis.del(rkey);
  }
  async resetKey(key) { await _redis.del(`rl:${this.prefix}:${key}`); }
  async resetAll() {}
}

function makeRlStore(prefix) {
  return _redis ? new RedisRateLimitStore(prefix) : undefined;
}

console.log("SERVER UPDATED");

const app = express();

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

const coinCache = new NodeCache({
  stdTTL: 3,
  checkperiod: 5,
  useClones: false,
});

const profileCache = new NodeCache({
  stdTTL: 10,
  checkperiod: 20,
  useClones: false,
});

app.use(express.json({ limit: "15mb" }));

// -------------------- ENV --------------------
const PORT = process.env.PORT || 5000;
const TRUST_PROXY = String(process.env.TRUST_PROXY || "") === "1";

const DATABASE_URL = String(process.env.DATABASE_URL || "").trim();

const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";
const SOLANA_NETWORK = String(process.env.SOLANA_NETWORK || "mainnet").trim().toLowerCase();
const JSON_LIMIT = process.env.JSON_LIMIT || "15mb";

const CORS_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
  console.log("CORS_ORIGINS:", CORS_ORIGINS);

// Strict localhost / loopback pattern — http://localhost:PORT or http://127.0.0.1:PORT
const _localhostRe = /^http:\/\/(localhost|127\.0\.0\.1):\d{1,5}$/;
// Fun.Run Vercel production + preview URLs (e.g. fun-run-lovat.vercel.app, fun-xxx-funrun.vercel.app)
const _vercelFunRunRe = /^https:\/\/[a-z0-9-]*(fun-?run)[a-z0-9-]*\.vercel\.app$/i;

function isAllowedOrigin(origin) {
  if (!origin) return true; // non-browser requests (curl, server-to-server)
  if (CORS_ORIGINS.includes(origin)) return true;
  if (_vercelFunRunRe.test(origin)) return true;
  // In dev, allow any localhost/loopback port; in production ONLY list + Fun.Run Vercel
  if (process.env.NODE_ENV !== "production" && _localhostRe.test(origin)) return true;
  return false;
}

const FEE_PCT = clampNum(Number(process.env.FEE_PCT || 1), 0, 10);
const OWNER_PCT_OF_FEE = clampNum(Number(process.env.OWNER_PCT_OF_FEE || 40), 0, 100);
const CREATOR_PCT_OF_FEE = clampNum(Number(process.env.CREATOR_PCT_OF_FEE || 40), 0, 100);
const REFERRAL_PCT_OF_FEE = clampNum(Number(process.env.REFERRAL_PCT_OF_FEE || 20), 0, 100);

const APP_OWNER_WALLET = String(process.env.APP_OWNER_WALLET || "29QQikVXzYSzk15ELXtERgydrAKWwpLoxBqL5Q4eVNdu").trim();
const SOL_USD = clampNum(Number(process.env.SOL_USD || 80), 1, 100000);

let currentSolUsd = SOL_USD;
let _solPriceCache = { price: SOL_USD, ts: 0 };

async function fetchLiveSolUsd() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const price = Number(data?.solana?.usd);
    if (price > 1 && price < 100000) return price;
  } catch {}
  return null;
}

async function getLiveSolUsd() {
  const now = Date.now();
  if (now - _solPriceCache.ts < 45_000) return _solPriceCache.price;
  const live = await fetchLiveSolUsd();
  if (live) {
    _solPriceCache = { price: live, ts: now };
    currentSolUsd = live;
  }
  return _solPriceCache.price;
}

fetchLiveSolUsd()
  .then((p) => { if (p) { currentSolUsd = p; _solPriceCache = { price: p, ts: Date.now() }; } })
  .catch(() => {});

const VIRTUAL_SOL = clampNum(Number(process.env.VIRTUAL_SOL || 15), 0, 1000000);
const VIRTUAL_TOKEN_PCT = clampNum(Number(process.env.VIRTUAL_TOKEN_PCT || 30), 0.1, 95);
const SALE_SUPPLY_PCT = clampNum(Number(process.env.SALE_SUPPLY_PCT || 80), 1, 100);

const TOTAL_SUPPLY = Math.max(1, Number(process.env.TOTAL_SUPPLY || 1_000_000_000));
const MAX_CHART_POINTS = 140;
const PROFILE_TX_LIMIT = 120;
const PROFILE_HOLDING_TX_SCAN = 500;
const DEX_LAUNCH_MC_USD = 5_000_000;

// Treasury minimum reserve — is se neeche withdraw NAHI hoga
const TREASURY_MIN_RESERVE_SOL = clampNum(
  Number(process.env.TREASURY_MIN_RESERVE_SOL || 0.05), 0, 1000
);

// Deposit -> treasury sweep sirf tab chale jab env me ENABLE_SWEEP=1 ho.
// Pehle encryption key rotate karo + devnet par test karo, PHIR enable karo.
const ENABLE_SWEEP = String(process.env.ENABLE_SWEEP || "") === "1";
// Custodial wallet me itna SOL chhod do (rent + fee buffer), baaki sweep ho.
const SWEEP_BUFFER_SOL = clampNum(Number(process.env.SWEEP_BUFFER_SOL || 0.003), 0, 1);

// Kill switches — explicitly '1' set karo tabhi enable hoga.
// Emergency mein env var hataao ya '0' karo aur server restart — turant band.
const WITHDRAWALS_ENABLED = String(process.env.WITHDRAWALS_ENABLED || "") === "1";
const TRADING_ENABLED     = String(process.env.TRADING_ENABLED     || "") === "1";

// Withdrawal limits — 0 matlab no limit (default off)
const MAX_WITHDRAW_SOL       = clampNum(Number(process.env.MAX_WITHDRAW_SOL       || 0), 0, 1_000_000);
const DAILY_WITHDRAW_CAP_SOL = clampNum(Number(process.env.DAILY_WITHDRAW_CAP_SOL || 0), 0, 1_000_000);

function getSupplyFromInitialSol(sol) {
  const s = Number(sol || 0);

  if (s >= 0.001 && s <= 0.005) return 100_000_000_000; // 100B
  if (s > 0.005 && s <= 0.01) return 50_000_000_000;    // 50B
  if (s > 0.01 && s <= 0.1) return 10_000_000_000;      // 10B
  if (s > 0.1 && s <= 0.2) return 800_000_000;          // 800M
  if (s > 0.2 && s <= 0.5) return 700_000_000;          // 700M
  if (s > 0.5 && s <= 1) return 500_000_000;            // 500M
  if (s > 1 && s <= 10) return 400_000_000;             // 400M
  if (s > 10 && s <= 50) return 300_000_000;            // 300M
  if (s > 50 && s <= 100) return 200_000_000;           // 200M

  return 100_000_000; // >100 SOL
}


const DEX_OPTIONS = ["Raydium", "Orca", "Meteora"];

// -------------------- APP SETUP --------------------
if (TRUST_PROXY) app.set("trust proxy", 1);

// ---- Helmet security headers ----
// Yeh server sirf JSON serve karta hai — koi HTML nahi.
// CSP isliye restrictive hai; baaki headers sab responses par lagte hain.
app.use(
  helmet({
    // Content-Security-Policy — JSON API ke liye strict defaults
    contentSecurityPolicy: {
      directives: {
        defaultSrc:     ["'none'"],   // koi bhi external resource by default nahi
        scriptSrc:      ["'none'"],
        styleSrc:       ["'none'"],
        imgSrc:         ["'none'"],
        connectSrc:     ["'self'"],   // sirf same-origin connections
        fontSrc:        ["'none'"],
        objectSrc:      ["'none'"],
        mediaSrc:       ["'none'"],
        frameSrc:       ["'none'"],
        frameAncestors: ["'none'"],   // yeh API kabhi frame nahi hogi
        formAction:     ["'none'"],
        baseUri:        ["'none'"],
      },
    },
    // X-Frame-Options: DENY — CSP frameAncestors ka backup (older browsers ke liye)
    frameguard: { action: "deny" },
    // X-Content-Type-Options: nosniff — MIME sniffing band karo
    noSniff: true,
    // Referrer-Policy — API calls mein referrer URLs leak na hon
    referrerPolicy: { policy: "no-referrer" },
    // HSTS — sirf production mein; local HTTP dev ko nahi todega
    hsts: process.env.NODE_ENV === "production"
      ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
      : false,
    // Cross-Origin-Resource-Policy: cross-origin ZAROORI hai —
    // helmet ka default "same-origin" Vercel frontend ko Railway API access se rokta hai
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Cross-Origin-Opener-Policy: off — Privy popup auth ke liye
    crossOriginOpenerPolicy: false,
    // Cross-Origin-Embedder-Policy: helmet v7 mein already off hai by default
    crossOriginEmbedderPolicy: false,
  })
);

const corsOptions = {
  origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
  credentials: true,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // preflight — same policy, not a wildcard
app.use(compression());

const mnemonicLimiter = rateLimit({ windowMs: 60_000, max: 5,   store: makeRlStore("mnemonic") });
const tradeLimiter    = rateLimit({ windowMs: 60_000, max: 60,  store: makeRlStore("trade"),    message: { ok: false, error: "Too many requests" } });
const withdrawLimiter = rateLimit({ windowMs: 60_000, max: 10,  store: makeRlStore("withdraw"), message: { ok: false, error: "Too many withdrawal requests" } });
const claimLimiter    = rateLimit({ windowMs: 60_000, max: 10,  store: makeRlStore("claim"),    message: { ok: false, error: "Too many claim requests" } });
const createLimiter   = rateLimit({ windowMs: 60_000, max: 10,  store: makeRlStore("create"),   message: { ok: false, error: "Too many create requests" } });

app.use(
  rateLimit({
    windowMs: 60_000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeRlStore("global"),
  })
);

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("tiny"));
}

// ── /api/v1/* → legacy path rewrites ─────────────────────────────────────────
// Platform microservices deploy nahi hain — Express req.url rewrite se
// existing handlers /api/v1/* requests serve karte hain.
app.use((req, _res, next) => {
  const p = req.path;
  if (!p.startsWith("/api/v1/")) return next();

  let legacy = null;

  if (p === "/api/v1/market/sol-price")
    legacy = "/sol-price";
  else if (p === "/api/v1/market/coins")
    legacy = "/coin/list";
  else if (/^\/api\/v1\/market\/coins\/[^/]+\/candles$/.test(p))
    legacy = p.replace(/^\/api\/v1\/market\/coins\//, "/coin/");      // /coin/:id/candles
  else if (/^\/api\/v1\/market\/coins\/[^/]+$/.test(p))
    legacy = p.replace(/^\/api\/v1\/market\/coins\//, "/coin/");      // /coin/:id
  else if (p === "/api/v1/trade/buy")
    legacy = "/coin/buy";
  else if (p === "/api/v1/trade/sell")
    legacy = "/coin/sell";
  else if (/^\/api\/v1\/profile\/[^/]+$/.test(p))
    legacy = p.replace(/^\/api\/v1\/profile\//, "/profile/");         // /profile/:wallet
  else if (/^\/api\/v1\/wallet\/[^/]+\/balance$/.test(p))
    legacy = p.replace(/^\/api\/v1\/wallet\/([^/]+)\/balance$/, "/balance/$1"); // /balance/:wallet
  else if (p === "/api/v1/wallet/withdraw")
    legacy = "/withdraw";
  else if (p === "/api/v1/wallet/reveal-mnemonic")
    legacy = "/wallet/reveal-mnemonic";
  else if (p === "/api/v1/rewards/claim")
    legacy = "/claim";
  else if (p === "/api/v1/referral/bind")
    legacy = "/referral/set";
  else if (p === "/api/v1/coins")
    legacy = "/coin/create";

  if (legacy) {
    const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    req.url = legacy + qs;
  }
  next();
});

// ---- C2: /wallet/create — auth required, encrypted_mnemonic never returned ----
// This handler shadows the old unauthenticated route in routes/wallet.js
app.post("/wallet/create", async (req, res) => {
  const auth = await requireAuthWallet(req, res);
  if (!auth) return;
  try {
    const walletData = await createCustodialWallet();
    await requireDb();
    // Link custodial wallet to the authenticated user's profile (only if not already set)
    await sql`
      update profiles
      set wallet_address    = ${walletData.address},
          encrypted_mnemonic = ${walletData.encryptedMnemonic},
          updated_at         = now()
      where wallet = ${auth.wallet}
        and (wallet_address is null or wallet_address = '')
    `;
    return res.json({ ok: true, success: true, address: walletData.address });
  } catch (e) {
    return serverErr(e, res, "wallet/create");
  }
});

// ---- C1: /api/onchain/* — auth + server-side encrypted_mnemonic lookup ----
// POST routes require a valid Privy token; encrypted_mnemonic is NEVER accepted from client.
const { default: onchainRoutes } = await import("./routes/onchain.js");
app.use("/api/onchain", async (req, res, next) => {
  if (req.method === "GET") return next(); // read-only endpoints stay public
  const auth = await requireAuthWallet(req, res);
  if (!auth) return;
  await requireDb();
  const rows = await sql`
    select encrypted_mnemonic from profiles where wallet = ${auth.wallet} limit 1
  `;
  if (!rows[0]?.encrypted_mnemonic) {
    return res.status(400).json({ success: false, error: "No custodial wallet found" });
  }
  req._encryptedMnemonic = rows[0].encrypted_mnemonic;
  req._authWallet = auth.wallet;
  next();
}, onchainRoutes);

// -------------------- CLIENTS --------------------
const sql = DATABASE_URL
  ? postgres(DATABASE_URL, {
      ssl: "require",
      max: Math.max(5, Math.min(30, Number(process.env.PG_MAX_CONNECTIONS || 12))),
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false,
    })
  : null;

const connection = new Connection(
  SOLANA_RPC,
  {
    commitment: "confirmed",
    disableRetryOnRateLimit: false,
    confirmTransactionInitialTimeout: 60000,
  }
);

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

function broadcast(event, payload) {
  const msg = JSON.stringify({
    event,
    payload,
  });

  if (typeof wsClients !== "undefined") {
    wsClients.forEach((ws) => {
      if (ws.readyState === 1) {
        ws.send(msg);
      }
    });
  }
}

function notifyWallet(wallet, title, extra = {}) {
  broadcast("notification:new", {
    wallet: String(wallet || "").trim(),
    title,
    ...extra,
  });
}

function notifyGlobal(title, extra = {}) {
  broadcast("notification:new", {
    wallet: "",
    global: true,
    title,
    ...extra,
  });
}

async function notifyCreatorFollowers(creatorWallet, title, extra = {}) {
  const creator = String(creatorWallet || "").trim();
  if (!creator) return;
  try {
    const rows = await sql`
      select follower_wallet from creator_follows where creator_wallet = ${creator}
    `;
    for (const row of rows || []) {
      const follower = String(row.follower_wallet || "").trim();
      if (!follower || follower === creator) continue;
      notifyWallet(follower, title, { type: "followed_creator_coin", ...extra });
    }
  } catch (e) {
    console.log("notifyCreatorFollowers error:", e?.message || e);
  }
}

// -------------------- AES-256-GCM SHARED CRYPTO HELPERS --------------------
// Accepts string or Buffer. Returns "gcm:<iv_hex>:<ct_hex>:<tag_hex>".
function _encryptGCM(plaintext, keyStr) {
  const key = Buffer.from(keyStr);
  const iv  = crypto.randomBytes(12); // 96-bit IV (GCM spec)
  const buf = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext, "utf8");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct  = Buffer.concat([cipher.update(buf), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `gcm:${iv.toString("hex")}:${ct.toString("hex")}:${tag.toString("hex")}`;
}

// Decrypts GCM ("gcm:…") or legacy CBC ("<iv>:<ct>") ciphertexts.
// Returns a Buffer — caller calls .toString() for strings, uses directly for binary.
function _decryptFlexible(enc, keyStr) {
  const key   = Buffer.from(keyStr);
  const parts = String(enc).split(":");
  if (parts[0] === "gcm" && parts.length === 4) {
    const iv  = Buffer.from(parts[1], "hex");
    const ct  = Buffer.from(parts[2], "hex");
    const tag = Buffer.from(parts[3], "hex");
    const dc  = crypto.createDecipheriv("aes-256-gcm", key, iv);
    dc.setAuthTag(tag);
    return Buffer.concat([dc.update(ct), dc.final()]);
  }
  if (parts.length === 2) {
    const iv   = Buffer.from(parts[0], "hex");
    const data = Buffer.from(parts[1], "hex");
    const dc   = crypto.createDecipheriv("aes-256-cbc", key, iv);
    return Buffer.concat([dc.update(data), dc.final()]);
  }
  throw new Error("Invalid encrypted format — expected gcm:… or <iv>:<ct>");
}

// -------------------- CUSTODIAL WALLET CREATION HELPER --------------------
async function createCustodialWallet() {
  try {
    const bip39 = (await import("bip39")).default;
    const { derivePath } = await import("ed25519-hd-key");

    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
      throw new Error("ENCRYPTION_KEY must be exactly 32 characters in .env");
    }

    const mnemonic = bip39.generateMnemonic();
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const path = "m/44'/501'/0'/0'";
    const derivedSeed = derivePath(path, seed.toString("hex")).key;
    const keypair = Keypair.fromSeed(derivedSeed);

    const encryptedMnemonic = _encryptGCM(mnemonic, ENCRYPTION_KEY);

    const address = keypair.publicKey.toBase58();

    return { address, encryptedMnemonic };
  } catch (err) {
    console.log("createCustodialWallet failed:", err?.message || err);
    throw err;
  }
}

// Encrypted mnemonic -> Keypair (sweep/withdraw ke liye). Mnemonic kabhi log na karo.
async function getCustodialKeypairFromMnemonic(encryptedMnemonic) {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be exactly 32 characters in .env");
  }

  const enc = String(encryptedMnemonic || "").trim();
  if (!enc) throw new Error("Invalid encrypted mnemonic");
  const mnemonic = _decryptFlexible(enc, ENCRYPTION_KEY).toString();

  const bip39 = (await import("bip39")).default;
  const { derivePath } = await import("ed25519-hd-key");
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const path = "m/44'/501'/0'/0'";
  const derivedSeed = derivePath(path, seed.toString("hex")).key;
  return Keypair.fromSeed(derivedSeed);
}

// Deposit ke baad custodial wallet ka SOL treasury me forward (sweep) karo.
// Sirf tab chale jab ENABLE_SWEEP=1. Buffer chhodta hai taake rent/fee bach jaye.
async function sweepCustodialToTreasury(custodialWallet) {
  try {
    if (!ENABLE_SWEEP) return;

    const w = String(custodialWallet || "").trim();
    if (!w) return;

    const rows = await sql`
      select encrypted_mnemonic from profiles where wallet_address = ${w} limit 1
    `;
    const enc = String(rows?.[0]?.encrypted_mnemonic || "").trim();
    if (!enc) return;

    const pub = new PublicKey(w);
    const lamports = await connection.getBalance(pub);
    const sol = lamports / 1_000_000_000;

    const sendable = sol - SWEEP_BUFFER_SOL;
    if (sendable <= 0.0005) return; // kuch bhejne layak nahi

    const kp = await getCustodialKeypairFromMnemonic(enc);

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: kp.publicKey,
        toPubkey: treasury.publicKey,
        lamports: Math.floor(sendable * 1_000_000_000),
      })
    );

    await sendAndConfirmTransaction(connection, tx, [kp]);
  } catch (e) {
    console.log("sweep error:", e?.message || e);
  }
}

async function scanWalletDeposits(wallet) {
  try {
    const w = String(wallet || "").trim();
    if (!w) return;

    const pub = new PublicKey(w);
    const lastSignature = await getLastDepositSignature(w);
    const treasuryAddr = treasury.publicKey.toBase58();

    // Paginate until we reach lastSignature or run out of results.
    // Using `until` param: RPC stops AT lastSignature (exclusive), so we get only NEW sigs.
    // If batch is full (100), there may be more — keep fetching with `before` cursor.
    const allSignatures = [];
    let before = undefined;
    for (;;) {
      const batch = await connection.getSignaturesForAddress(pub, {
        limit: 100,
        ...(before        ? { before }               : {}),
        ...(lastSignature ? { until: lastSignature } : {}),
      });
      if (!batch?.length) break;
      allSignatures.push(...batch);
      if (batch.length < 100) break; // last page — no more to fetch
      before = batch[batch.length - 1].signature; // cursor = oldest sig in batch
    }

    if (!allSignatures.length) return;

    let creditedAny = false;

    for (const sig of allSignatures) {
      const signature = String(sig?.signature || "").trim();
      if (!signature) continue;

      const tx = await connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      const accountKeys = tx?.transaction?.message?.accountKeys || [];
      const walletIndex = accountKeys.findIndex(
        (k) => String(k?.pubkey?.toString?.() || "") === w
      );
      if (walletIndex === -1) continue;

      // H4 fix: use actual on-chain balance diff as the authoritative amount.
      // This captures ALL incoming SOL (SystemProgram transfers, staking payouts,
      // program-mediated sends) — not just parsed `transfer` instructions.
      const pre  = safeNum(tx?.meta?.preBalances?.[walletIndex],  0) / 1_000_000_000;
      const post = safeNum(tx?.meta?.postBalances?.[walletIndex], 0) / 1_000_000_000;
      const diff = post - pre; // positive = wallet received SOL

      if (diff <= 0) continue; // wallet sent SOL (not a deposit) or no change

      // Internal platform funding (treasury → custodial for mint/rent) is NOT a user deposit.
      // Previously this wrongly inflated run_balance by ~0.02 SOL on every coin create.
      const treasuryIndex = accountKeys.findIndex(
        (k) => String(k?.pubkey?.toString?.() || "") === treasuryAddr
      );
      let fromTreasury = false;
      if (treasuryIndex >= 0) {
        const tPre  = safeNum(tx?.meta?.preBalances?.[treasuryIndex],  0);
        const tPost = safeNum(tx?.meta?.postBalances?.[treasuryIndex], 0);
        fromTreasury = tPost < tPre;
      }

      if (fromTreasury) {
        await reverseInternalDepositIfCredited({ wallet: w, txHash: signature, amount: diff });
        continue;
      }

      const ok = await creditDeposit({
        wallet: w,
        txHash: signature,
        amount: diff,
      });
      if (ok) creditedAny = true;
    }

    // Advance cursor to the newest signature processed
    if (allSignatures[0]?.signature) {
      await setLastDepositSignature(w, allSignatures[0].signature);
    }

    if (creditedAny) {
      await sweepCustodialToTreasury(w);
    }
  } catch (e) {
    console.log("scanWalletDeposits error:", e?.message || e);
  }
}

/** Undo a deposit that was credited from an internal treasury→custodial transfer. */
async function reverseInternalDepositIfCredited({ wallet, txHash, amount }) {
  const w = String(wallet || "").trim();
  const hash = String(txHash || "").trim();
  const amt = Math.max(0, safeNum(amount, 0));
  if (!w || !hash || amt <= 0) return false;

  try {
    const reversed = await sql.begin(async (tx) => {
      const rows = await tx`
        select id, wallet, amount, status
        from deposits
        where tx_hash = ${hash}
        limit 1
        for update
      `;
      if (!rows.length) return false;
      if (String(rows[0].status || "") === "reversed_internal") return false;

      const depWallet = String(rows[0].wallet || w).trim();
      const depAmt = Math.max(0, safeNum(rows[0].amount, amt));

      const ownerRows = await tx`
        select wallet from profiles
        where wallet = ${depWallet} or wallet_address = ${depWallet}
        limit 1
      `;
      const primary = String(ownerRows?.[0]?.wallet || depWallet).trim();

      await tx`
        update deposits
        set status = 'reversed_internal'
        where id = ${rows[0].id}
      `;

      await tx`
        update profiles
        set run_balance = greatest(0, run_balance - ${depAmt}),
            updated_at = now()
        where wallet = ${primary}
      `;

      return { primary, depAmt };
    });

    if (reversed) {
      console.log(
        `[deposit] reversed internal treasury credit ${reversed.depAmt} SOL for ${reversed.primary} tx=${hash.slice(0, 8)}…`
      );
      writeAudit("DEPOSIT_REVERSED_INTERNAL", reversed.primary, reversed.depAmt, {
        meta: { txHash: hash, reason: "treasury_funding" },
      }).catch(() => {});
      broadcast("portfolio:update", {
        wallet: reversed.primary,
        type: "DEPOSIT_REVERSED",
        amount: reversed.depAmt,
        txHash: hash,
      });
      return true;
    }
  } catch (e) {
    console.log("reverseInternalDepositIfCredited error:", e?.message || e);
  }
  return false;
}

/** One-shot: reverse any already-credited deposits that were treasury→custodial funding. */
async function reconcileInternalDeposits(limit = 80) {
  try {
    await requireDb();
    const treasuryAddr = treasury.publicKey.toBase58();
    const rows = await sql`
      select wallet, tx_hash, amount
      from deposits
      where status = 'confirmed'
      order by created_at desc
      limit ${limit}
    `;
    let fixed = 0;
    for (const row of rows || []) {
      const hash = String(row.tx_hash || "").trim();
      const custodial = String(row.wallet || "").trim();
      if (!hash || !custodial) continue;
      try {
        const tx = await connection.getParsedTransaction(hash, {
          maxSupportedTransactionVersion: 0,
        });
        if (!tx?.meta) continue;
        const accountKeys = tx.transaction?.message?.accountKeys || [];
        const treasuryIndex = accountKeys.findIndex(
          (k) => String(k?.pubkey?.toString?.() || "") === treasuryAddr
        );
        if (treasuryIndex < 0) continue;
        const tPre  = safeNum(tx.meta.preBalances?.[treasuryIndex],  0);
        const tPost = safeNum(tx.meta.postBalances?.[treasuryIndex], 0);
        if (!(tPost < tPre)) continue;

        const ok = await reverseInternalDepositIfCredited({
          wallet: custodial,
          txHash: hash,
          amount: row.amount,
        });
        if (ok) fixed += 1;
      } catch (e) {
        console.log(`[deposit] reconcile skip ${hash.slice(0, 8)}:`, e?.message || e);
      }
    }
    if (fixed > 0) console.log(`[deposit] reconciled ${fixed} internal treasury credits`);
  } catch (e) {
    console.log("reconcileInternalDeposits error:", e?.message || e);
  }
}

// NOTE: purana `balances` table system hata diya gaya hai.
// Single source of truth ab profiles.run_balance hai (decreaseRun/increaseRun).

// -------------------- RUN BALANCE (single spendable balance) --------------------
// Sab kuch profiles.run_balance par chalta hai (primary wallet ke under).
// ATOMIC (FOR UPDATE) — race-safe.
async function decreaseRun(wallet, amount, _tx = null) {
  const w = String(wallet || "").trim();
  const amt = Math.max(0, safeNum(amount, 0));

  const exec = async (tx) => {
    const rows = await tx`
      select run_balance from profiles where wallet = ${w} for update
    `;
    const currentRun = Math.max(0, safeNum(rows?.[0]?.run_balance, 0));
    const nextRun = currentRun - amt;

    if (nextRun < 0) {
      throw new Error("Insufficient balance");
    }

    await tx`
      update profiles set
        run_balance = ${nextRun},
        updated_at = now()
      where wallet = ${w}
    `;

    return nextRun;
  };

  return _tx ? exec(_tx) : sql.begin(exec);
}

async function increaseRun(wallet, amount, _tx = null) {
  const w = String(wallet || "").trim();
  const amt = Math.max(0, safeNum(amount, 0));

  const exec = async (tx) => {
    const rows = await tx`
      select run_balance from profiles where wallet = ${w} for update
    `;
    const currentRun = Math.max(0, safeNum(rows?.[0]?.run_balance, 0));
    const nextRun = currentRun + amt;

    await tx`
      update profiles set
        run_balance = ${nextRun},
        updated_at = now()
      where wallet = ${w}
    `;

    return nextRun;
  };

  return _tx ? exec(_tx) : sql.begin(exec);
}

// primary ya custodial — dono se run_balance dhoondo
async function getRunBalanceFlexible(walletOrCustodial) {
  const w = String(walletOrCustodial || "").trim();
  if (!w) return 0;
  const rows = await sql`
    select run_balance from profiles
    where wallet = ${w} or wallet_address = ${w}
    limit 1
  `;
  return Math.max(0, safeNum(rows?.[0]?.run_balance, 0));
}

async function hasDeposit(txHash) {
  const hash = String(txHash || "").trim();
  if (!hash) return true;

  const rows = await sql`
    select id from deposits where tx_hash = ${hash} limit 1
  `;

  return !!rows?.[0];
}

async function saveDeposit({ wallet, txHash, amount, token = "SOL" }) {
  await sql`
    insert into deposits (id, wallet, tx_hash, amount, token, status, created_at)
    values (
      ${crypto.randomUUID()},
      ${wallet},
      ${txHash},
      ${Math.max(0, safeNum(amount, 0))},
      ${token},
      'confirmed',
      now()
    )
  `;
}

async function saveWithdrawal({ wallet, destination, amount, txHash, status = "confirmed" }) {
  await sql`
    insert into withdrawals (id, wallet, destination, amount, tx_hash, status)
    values (
      ${crypto.randomUUID()},
      ${wallet},
      ${destination},
      ${amount},
      ${txHash},
      ${status}
    )
  `;
}

async function creditDeposit({ wallet, txHash, amount }) {
  const w = String(wallet || "").trim();
  const hash = String(txHash || "").trim();
  if (!w || !hash) return false;

  const amt = Math.max(0, safeNum(amount, 0));
  if (amt <= 0) return false;

  // Single atomic transaction: INSERT deposit + UPDATE balance.
  // ON CONFLICT (tx_hash) DO NOTHING guarantees exactly-once credit even under
  // concurrent workers or scan-loop overlap — PostgreSQL UNIQUE constraint on
  // tx_hash ensures only one INSERT ever commits. If count === 0, this txHash
  // was already processed by another worker; we return false without crediting.
  // If the server crashes after INSERT but before UPDATE, the whole transaction
  // rolls back, so tx_hash is NOT in deposits — the next scan re-processes it.
  const primaryWallet = await sql.begin(async (tx) => {
    const inserted = await tx`
      insert into deposits (id, wallet, tx_hash, amount, token, status, created_at)
      values (
        ${crypto.randomUUID()},
        ${w},
        ${hash},
        ${amt},
        'SOL',
        'confirmed',
        now()
      )
      on conflict (tx_hash) do nothing
    `;

    // count === 0 → duplicate txHash already exists → skip
    if (inserted.count === 0) return null;

    // Resolve custodial wallet → primary profile wallet
    const ownerRows = await tx`
      select wallet from profiles
      where wallet = ${w} or wallet_address = ${w}
      limit 1
    `;
    const primary = String(ownerRows?.[0]?.wallet || w).trim();
    if (!primary) return null;

    // Credit balance in same transaction — atomic with the deposit insert
    await tx`
      update profiles
      set run_balance = run_balance + ${amt},
          updated_at  = now()
      where wallet = ${primary}
    `;

    return primary;
  });

  if (!primaryWallet) return false;

  // Audit log is fire-and-forget — failure here does not affect the credit
  writeAudit("DEPOSIT", primaryWallet, amt, { meta: { txHash: hash, custodial: w } }).catch(() => {});
  broadcast("portfolio:update", {
    wallet: primaryWallet,
    type: "DEPOSIT",
    amount: amt,
    txHash: hash,
  });
  broadcast("notification:new", {
    wallet: primaryWallet,
    type: "deposit",
    title: `Deposit confirmed: ${amt.toFixed(4)} SOL`,
    txHash: hash,
  });

  return true;
}

async function getLastDepositSignature(wallet) {
  const w = String(wallet || "").trim();

  const rows = await sql`
    select last_signature from deposit_scans where wallet = ${w} limit 1
  `;

  return String(rows?.[0]?.last_signature || "").trim();
}

async function setLastDepositSignature(wallet, signature) {
  const w = String(wallet || "").trim();

  await sql`
    insert into deposit_scans (wallet, last_signature, updated_at)
    values (${w}, ${signature}, now())
    on conflict (wallet)
    do update set
      last_signature = excluded.last_signature,
      updated_at = now()
  `;
}

function uid() {
  return crypto.randomUUID().replace(/-/g, "");
}

function asObj(v, fallback = {}) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : fallback;
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
  const priceUsd = priceSol * currentSolUsd;
  const circulating = Math.max(0, totalSupply - tokenReserve);
  const mcUsd = priceUsd * circulating;

  return {
    priceSol,
    priceUsd,
    mcUsd,
    circulating,
  };
}

function mapDbCoinToApi(row = {}) {
  const totalSupply = Math.max(1, safeNum(row.total_supply, TOTAL_SUPPLY));
  const curveSupply = Math.max(1, safeNum(row.curve_supply, saleSupplyFromTotal(totalSupply)));
  const tokenReserve = clampNum(safeNum(row.reserve_token, curveSupply), 1, curveSupply);
  const curveSold = clampNum(safeNum(row.curve_sold, curveSupply - tokenReserve), 0, curveSupply);
  const vSol = Math.max(1e-9, safeNum(row.v_sol, VIRTUAL_SOL));
  const vTokens = calcVirtualTokens(totalSupply, curveSupply, row.v_tokens);

  const pricing = calcPricing({
    totalSupply,
    curveSupply,
    solReserve: safeNum(row.reserve_sol, 0),
    tokenReserve,
    vSol,
    vTokens,
  });

  const chartInput = Array.isArray(row.chart)
    ? row.chart.filter((n) => Number.isFinite(Number(n))).map(Number)
    : [];

  const seedPrice = Math.max(0, safeNum(pricing.priceUsd, 0));

  const chart =
    chartInput.length > 0
      ? chartInput.slice(-MAX_CHART_POINTS)
      : [seedPrice, seedPrice, seedPrice, seedPrice, seedPrice];

  const safeId = String(row.id || row.coin_id || "").trim();
  if (!safeId) return null;

  return {
    id: safeId,
    name: String(row.name || "").trim(),
    symbol: String(row.symbol || "").trim().toUpperCase(),
    story: String(row.story || "").trim(),
    logo: String(row.logo || ""),
    metadataUri: String(row.metadata_uri || ""),
    creatorWallet: String(row.creator_wallet || "").trim(),
    owner: String(row.creator_wallet || "").trim(),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : nowMS(),
    status: "LIVE",
    totalSupply,
    curveSupply,
    curveSold,
    vTokens,
    vSol,
    solReserve: Math.max(0, safeNum(row.reserve_sol, 0)),
    tokenReserve,
    volumeSol: Math.max(0, safeNum(row.volume_sol, 0)),
    lastTradeAt: safeNum(row.last_trade_at, 0),
    priceSol: pricing.priceSol,
    priceUsd: pricing.priceUsd,
    price: pricing.priceUsd,
    lastPriceUsd: pricing.priceUsd,
    mc: Math.max(0, safeNum(row.market_cap, pricing.mcUsd)),
    ath: Math.max(
      Math.max(0, safeNum(row.ath_market_cap, 0)),
      Math.max(0, safeNum(row.market_cap, pricing.mcUsd)),
      pricing.mcUsd
    ),
    chart,
    holders: asObj(row.holders, {}),
    creatorRewardsSol: Math.max(0, safeNum(row.creator_rewards, 0)),
    mintAddress: String(row.mint_address || ""),
    migrated: Boolean(row.migrated),
    reserveWalletAddress: String(row.reserve_wallet_address || ""),
  };
}

function coinToDbUpdate(coin = {}) {
  // Market cap derived directly from bonding curve reserves — never randomised.
  const marketCap = Math.max(0, safeNum(coin.mc, 0));

  return {
    name: coin.name || "",
    symbol: coin.symbol || "",
    story: coin.story || "",
    logo: coin.logo || "",
    metadata_uri: coin.metadataUri || "",
    mint_address: coin.mintAddress || "",
    mint_signature: coin.mintSignature || "",
    creator_wallet: coin.creatorWallet || coin.owner || "",
    created_at: new Date(coin.createdAt || Date.now()).toISOString(),
    total_supply: coin.totalSupply || TOTAL_SUPPLY,
    curve_supply:
      coin.curveSupply || saleSupplyFromTotal(coin.totalSupply || TOTAL_SUPPLY),
    curve_sold: coin.curveSold || 0,
    v_sol: coin.vSol || VIRTUAL_SOL,
    v_tokens:
      coin.vTokens ||
      calcVirtualTokens(
        coin.totalSupply || TOTAL_SUPPLY,
        coin.curveSupply || saleSupplyFromTotal(coin.totalSupply || TOTAL_SUPPLY),
        coin.vTokens
      ),
    reserve_sol: coin.solReserve || 0,
    reserve_token:
      coin.tokenReserve || coin.curveSupply || saleSupplyFromTotal(coin.totalSupply || TOTAL_SUPPLY),
    market_cap: marketCap,
    last_price: coin.priceSol || 0,
    ath_market_cap: Math.max(marketCap, safeNum(coin.ath, 0)),
    volume_sol: coin.volumeSol || 0,
    last_trade_at: coin.lastTradeAt || 0,
    creator_rewards: coin.creatorRewardsSol || 0,
    holders: asObj(coin.holders, {}),
    chart: Array.isArray(coin.chart) ? coin.chart.slice(-MAX_CHART_POINTS) : [],
    reserve_wallet_address: coin.reserveWalletAddress || null,
    reserve_wallet_encrypted: coin.reserveWalletEncrypted || null,
  };
}

function ensureProfileShape(row = {}, wallet = "") {
  const primaryWallet = String(row.wallet || wallet || "").trim();
  const custodialWallet = String(row.wallet_address || row.connectedWallet || "").trim();

  return {
    wallet: primaryWallet,
    custodialWallet,
    depositAddress: custodialWallet,
    encrypted_mnemonic: String(row.encrypted_mnemonic || "").trim(),
    referrer: String(row.referrer || "").trim(),
    referral_rewards: Math.max(0, safeNum(row.referral_rewards, 0)),
    run_balance: Math.max(0, safeNum(row.run_balance, 0)),
    run_tokens:  Math.max(0, safeNum(row.run_tokens, 0)),
    sol_balance: Math.max(0, safeNum(row.sol_balance, 0)),
    creator_rewards: Math.max(0, safeNum(row.creator_rewards, 0)),
    owner_rewards: Math.max(0, safeNum(row.owner_rewards, 0)),
    referral_code: String(row.referral_code || primaryWallet.slice(0, 6)),
    referral_count: Math.max(0, safeNum(row.referral_count, 0)),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
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
    url: `https://ipfs.io/ipfs/${json.IpfsHash}`,
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
    url: `https://ipfs.io/ipfs/${json.IpfsHash}`,
    ipfs: `ipfs://${json.IpfsHash}`,
  };
}

async function requireDb() {
  if (!sql) throw new Error("DATABASE_URL not configured");
}

async function ensureSchema() {
  await requireDb();

  await sql`
    create table if not exists coins (
      id text primary key,
      name text,
      symbol text,
      story text,
      logo text,
      metadata_uri text,
      creator_wallet text,
      created_at timestamptz default now(),
      total_supply numeric,
      curve_supply numeric,
      curve_sold numeric,
      v_sol numeric,
      v_tokens numeric,
      reserve_sol numeric,
      reserve_token numeric,
      market_cap numeric,
      last_price numeric,
      ath_market_cap numeric,
      volume_sol numeric default 0,
      last_trade_at bigint default 0,
      creator_rewards numeric default 0,
      holders jsonb default '{}'::jsonb
    )`;

    await sql`
  alter table coins
  add column if not exists mint_address text
`;

await sql`
  alter table coins
  add column if not exists mint_signature text
`;

await sql`
  alter table coins
  add column if not exists migrated boolean default false
`;

await sql`
  alter table coins
  add column if not exists reserve_wallet_address text
`;

await sql`
  alter table coins
  add column if not exists reserve_wallet_encrypted text
`;

  await sql`
    create table if not exists profiles (
      wallet text primary key,
      referrer text,
      referral_rewards numeric default 0,
      creator_rewards numeric default 0,
      owner_rewards numeric default 0,
      referral_code text,
      referral_count integer default 0,
      created_at timestamptz default now(),
      updated_at timestamptz default now(),
      wallet_address text,
run_balance numeric default 0,
encrypted_mnemonic text
    )`;

  await sql`alter table profiles add column if not exists wallet_address text`;
  await sql`alter table profiles add column if not exists encrypted_mnemonic text`;
  await sql`alter table profiles add column if not exists run_balance numeric default 0`;

  await sql`
    create table if not exists transactions (
      id text primary key,
      wallet text,
      coin_id text,
      type text,
      sol numeric default 0,
      tokens numeric default 0,
      fee numeric default 0,
      created_at timestamptz default now()
    )`;

  await sql`
    create table if not exists holdings (
      wallet text not null,
      coin_id text not null,
      tokens numeric default 0,
      updated_at timestamptz default now(),
      primary key (wallet, coin_id)
    )`;

  await sql`
    create table if not exists deposits (
      id text primary key,
      wallet text not null,
      tx_hash text unique not null,
      amount numeric not null default 0,
      token text not null default 'SOL',
      status text not null default 'confirmed',
      created_at timestamptz not null default now()
    )`;

  await sql`
    create table if not exists withdrawals (
      id text primary key,
      wallet text not null,
      destination text not null,
      amount numeric not null default 0,
      tx_hash text,
      status text not null default 'pending',
      created_at timestamptz not null default now()
    )`;

  await sql`
    create table if not exists deposit_scans (
      wallet text primary key,
      last_signature text,
      updated_at timestamptz not null default now()
    )`;

  // Immutable audit log — kabhi delete na ho, sirf insert
  await sql`
    create table if not exists audit_logs (
      id text primary key,
      event_type text not null,
      wallet text not null,
      amount numeric default 0,
      coin_id text,
      meta jsonb default '{}'::jsonb,
      created_at timestamptz not null default now()
    )`;

  await sql`create index if not exists audit_logs_wallet_idx on audit_logs (wallet, created_at desc)`;
  await sql`create index if not exists audit_logs_type_idx on audit_logs (event_type, created_at desc)`;

  await sql`
    create table if not exists candles (
      coin_id text not null,
      timeframe text not null,
      bucket_time bigint not null,
      open numeric default 0,
      high numeric default 0,
      low numeric default 0,
      close numeric default 0,
      volume_sol numeric default 0,
      trades_count integer default 0,
      updated_at timestamptz default now(),
      primary key (coin_id, timeframe, bucket_time)
    )`;

  await sql`create index if not exists coins_created_at_idx on coins (created_at desc)`;
  await sql`create index if not exists coins_creator_wallet_idx on coins (creator_wallet)`;
  await sql`create index if not exists tx_coin_id_created_at_idx on transactions (coin_id, created_at desc)`;
  await sql`create index if not exists tx_wallet_created_at_idx on transactions (wallet, created_at desc)`;
  await sql`create index if not exists profiles_referrer_idx on profiles (referrer)`;
  await sql`create index if not exists holdings_wallet_idx on holdings (wallet)`;
  await sql`create index if not exists holdings_coin_id_idx on holdings (coin_id)`;
  await sql`create index if not exists candles_coin_tf_bucket_idx on candles (coin_id, timeframe, bucket_time desc)`;
  await sql`create index if not exists profiles_wallet_address_idx on profiles (wallet_address)`;

  // Unique constraints (idempotent)
  await sql`create unique index if not exists profiles_referral_code_unique on profiles (referral_code) where referral_code is not null and referral_code != ''`;
  await sql`create unique index if not exists coins_mint_address_unique on coins (mint_address) where mint_address is not null and mint_address != ''`;

  // Withdraw idempotency key (nullable — purane records NULL rahenge, naye unique honge)
  await sql`alter table withdrawals add column if not exists idempotency_key text`;
  await sql`create unique index if not exists withdrawals_idempotency_key_unique on withdrawals (idempotency_key) where idempotency_key is not null`;

  await sql`alter table profiles add column if not exists run_tokens numeric not null default 0`;
  await sql`alter table profiles alter column run_balance set default 0`;

  // One-time align old 300k signup airdrop → 200k
  await sql`
    update profiles
    set run_tokens = 200000, updated_at = now()
    where run_tokens = 300000
  `;

  await sql`
    create table if not exists creator_follows (
      follower_wallet text not null,
      creator_wallet text not null,
      created_at timestamptz default now(),
      primary key (follower_wallet, creator_wallet)
    )
  `;
  await sql`create index if not exists creator_follows_creator_idx on creator_follows (creator_wallet)`;

  await sql`alter table coins add column if not exists notified_mc_100k boolean not null default false`;
}

// -------------------- AUDIT LOG --------------------
async function writeAudit(eventType, wallet, amount = 0, opts = {}) {
  try {
    await sql`
      insert into audit_logs (id, event_type, wallet, amount, coin_id, meta, created_at)
      values (
        ${crypto.randomUUID()},
        ${String(eventType)},
        ${String(wallet || "")},
        ${Math.max(0, safeNum(amount, 0))},
        ${String(opts.coinId || "") || null},
        ${JSON.stringify(opts.meta || {})},
        now()
      )
    `;
  } catch (e) {
    // Audit log failure kabhi main flow block na kare
    console.log("audit_log write error:", e?.message || e);
  }
}

function profileToDbRow(profile = {}) {
  return {
    wallet: String(profile.wallet || "").trim(),
    referrer: String(profile.referrer || "").trim(),
    referral_rewards: Math.max(0, safeNum(profile.referral_rewards, 0)),
    run_balance: Math.max(0, safeNum(profile.run_balance, 0)),
    run_tokens:  Math.max(0, safeNum(profile.run_tokens, 0)),
    sol_balance: Math.max(0, safeNum(profile.sol_balance, 0)),
    creator_rewards: Math.max(0, safeNum(profile.creator_rewards, 0)),
    owner_rewards: Math.max(0, safeNum(profile.owner_rewards, 0)),
    referral_code: String(profile.referral_code || ""),
    referral_count: Math.max(0, safeNum(profile.referral_count, 0)),
    wallet_address: String(profile.wallet_address || "").trim(),
    encrypted_mnemonic: String(profile.encrypted_mnemonic || "").trim(),
    created_at: profile.created_at || new Date().toISOString(),
    updated_at: profile.updated_at || new Date().toISOString(),
  };
}

async function getProfile(wallet, createIfMissing = true) {
  const w = String(wallet || "").trim();
  if (!w) return null;

  await requireDb();

  const rows = await sql`select wallet, wallet_address, encrypted_mnemonic, referrer, referral_rewards, run_balance, run_tokens, sol_balance, creator_rewards, owner_rewards, referral_code, referral_count, created_at, updated_at from profiles where wallet = ${w} limit 1`;

  if (rows[0]) {
    const profile = rows[0];

    if (!profile.wallet_address) {
      try {
        const walletData = await createCustodialWallet();

        // CAS guard: only write if no concurrent request already assigned a wallet.
        // Two simultaneous first-logins both generate keypairs; only one must win.
        // RETURNING lets us read back the committed address in the same round-trip.
        const updated = await sql`
          update profiles
          set
            wallet_address     = ${walletData.address},
            encrypted_mnemonic = ${walletData.encryptedMnemonic},
            updated_at         = now()
          where wallet = ${w}
            and (wallet_address is null or wallet_address = '')
          returning wallet_address, encrypted_mnemonic
        `;

        if (updated.length > 0) {
          // This process won the race — use the address we just wrote.
          profile.wallet_address    = updated[0].wallet_address;
          profile.encrypted_mnemonic = updated[0].encrypted_mnemonic;
        } else {
          // Another request won — read whichever address it committed.
          const winner = await sql`
            select wallet_address, encrypted_mnemonic
            from   profiles
            where  wallet = ${w}
            limit  1
          `;
          profile.wallet_address    = winner[0]?.wallet_address    || "";
          profile.encrypted_mnemonic = winner[0]?.encrypted_mnemonic || "";
        }
      } catch (err) {
        console.log("Failed to generate custodial wallet:", err?.message || err);
      }
    }

    

    return ensureProfileShape(profile, w);
  }

  if (!createIfMissing) return null;

  let walletData = { address: "", encryptedMnemonic: "" };

  try {
    walletData = await createCustodialWallet();
  } catch (err) {
    console.log("Custodial wallet creation failed during new profile:", err?.message || err);
  }

  const SIGNUP_AIRDROP_RUN = 200000;

  const payload = profileToDbRow(
    ensureProfileShape(
      {
        wallet: w,
        wallet_address: walletData.address,
        encrypted_mnemonic: walletData.encryptedMnemonic,
        run_balance: 0,
        run_tokens: SIGNUP_AIRDROP_RUN,
      },
      w
    )
  );

  const inserted = await sql`
    insert into profiles (
      wallet, referrer, referral_rewards, run_balance, run_tokens, sol_balance, creator_rewards, owner_rewards,
      referral_code, referral_count, wallet_address, encrypted_mnemonic,
      created_at, updated_at
    )
    values (
      ${payload.wallet},
      ${payload.referrer},
      ${payload.referral_rewards},
      ${payload.run_balance},
      ${payload.run_tokens},
      ${payload.sol_balance},
      ${payload.creator_rewards},
      ${payload.owner_rewards},
      ${payload.referral_code},
      ${payload.referral_count},
      ${payload.wallet_address},
      ${payload.encrypted_mnemonic},
      ${payload.created_at},
      ${payload.updated_at}
    )
    on conflict (wallet)
    do update set
      wallet_address = coalesce(nullif(excluded.wallet_address, ''), profiles.wallet_address),
      encrypted_mnemonic = coalesce(nullif(excluded.encrypted_mnemonic, ''), profiles.encrypted_mnemonic),
      updated_at = excluded.updated_at
    returning *`;

  return ensureProfileShape(inserted[0], w);
}

async function patchProfile(wallet, patch = {}) {
  const w = String(wallet || "").trim();
  if (!w) throw new Error("wallet required");

  const current = await getProfile(w, true);
  const next = profileToDbRow(
    ensureProfileShape(
      {
        ...current,
        ...patch,
        wallet: w,
        updated_at: new Date().toISOString(),
      },
      w
    )
  );

  const rows = await sql`
    insert into profiles (
      wallet, referrer, referral_rewards, run_balance, creator_rewards, owner_rewards,
      referral_code, referral_count, wallet_address, encrypted_mnemonic,
      created_at, updated_at
    )
    values (
      ${next.wallet}, ${next.referrer}, ${next.referral_rewards},
      ${next.run_balance},
      ${next.creator_rewards}, ${next.owner_rewards}, ${next.referral_code},
      ${next.referral_count}, ${next.wallet_address}, ${next.encrypted_mnemonic},
      ${next.created_at}, ${next.updated_at}
    )
    on conflict (wallet) do update set
      referrer = excluded.referrer,
      referral_rewards = excluded.referral_rewards,
      run_balance = excluded.run_balance,
      creator_rewards = excluded.creator_rewards,
      owner_rewards = excluded.owner_rewards,
      referral_code = excluded.referral_code,
      referral_count = excluded.referral_count,
      wallet_address = coalesce(nullif(excluded.wallet_address, ''), profiles.wallet_address),
      encrypted_mnemonic = coalesce(nullif(excluded.encrypted_mnemonic, ''), profiles.encrypted_mnemonic),
      updated_at = excluded.updated_at
    returning *`;

  return ensureProfileShape(rows[0], w);
}

async function addProfileReward(wallet, column, amount) {
  const w = String(wallet || "").trim();
  const col = String(column || "").trim();
  const delta = Math.max(0, safeNum(amount, 0));

  if (!w || delta <= 0) return null;

  const allowed = new Set(["referral_rewards", "creator_rewards", "owner_rewards"]);
  if (!allowed.has(col)) throw new Error("invalid rewards column");

  await getProfile(w, true);

  const rows = await sql`
    update profiles
    set
      ${sql(col)} = profiles.${sql(col)} + ${delta},
      updated_at = now()
    where wallet = ${w}
    returning *
  `;

  return ensureProfileShape(rows[0], w);
}

async function countReferrals(wallet) {
  const w = String(wallet || "").trim();
  if (!w) return 0;
  await requireDb();
  const rows = await sql`select count(*)::int as count from profiles where referrer = ${w}`;
  return safeNum(rows?.[0]?.count, 0);
}

async function syncReferralCount(wallet) {
  const count = await countReferrals(wallet);
  await patchProfile(wallet, { referral_count: count });
  return count;
}

async function insertTransaction(tx = {}) {
  await requireDb();
  const row = {
    id: String(tx.id || uid()),
    wallet: String(tx.wallet || ""),
    coin_id: String(tx.coinId || tx.coin_id || ""),
    type: String(tx.type || tx.side || "TX").toUpperCase(),
    sol: Math.max(0, safeNum(tx.sol, 0)),
    tokens: Math.max(0, safeNum(tx.tokens, 0)),
    fee: Math.max(0, safeNum(tx.fee, 0)),
    created_at: new Date().toISOString(),
  };

  const cachedCoin = coinCache.get(row.coin_id);
  if (cachedCoin) {
    cachedCoin.last_trade_at = Date.now();
  }

  await sql`
    insert into transactions (id, wallet, coin_id, type, sol, tokens, fee, created_at)
    values (${row.id}, ${row.wallet}, ${row.coin_id}, ${row.type}, ${row.sol}, ${row.tokens}, ${row.fee}, ${row.created_at})`;

  broadcast("trade:new", {
    coinId: row.coin_id,
    type: row.type,
    sol: row.sol,
    tokens: row.tokens,
    price: row.price,
    ts: Date.now(),
  });

  return row;
}

async function upsertHolding(wallet, coinId, mode = "set", amount = 0, _tx = null) {
  const w = String(wallet || "").trim();
  const c = String(coinId || "").trim();

  if (!w || !c) return 0;

  const delta = Number(amount || 0);

  const exec = async (tx) => {
    const current = await tx`
      SELECT tokens FROM holdings
      WHERE wallet = ${w} AND coin_id = ${c}
      FOR UPDATE
    `;

    const prev = Number(current?.[0]?.tokens || 0);

    let next = prev;

    if (mode === "inc") {
      next = prev + delta;
    } else if (mode === "dec") {
      next = Math.max(0, prev - delta);
    } else {
      next = Math.max(0, delta);
    }

    await tx`
      INSERT INTO holdings (wallet, coin_id, tokens, updated_at)
      VALUES (${w}, ${c}, ${next}, NOW())
      ON CONFLICT (wallet, coin_id)
      DO UPDATE SET
        tokens = EXCLUDED.tokens,
        updated_at = NOW()
    `;

    return next;
  };

  return _tx ? exec(_tx) : sql.begin(exec);
}

async function getCoinRowById(coinId) {
  const id = String(coinId || "").trim();
  if (!id) return null;

  const cached = coinCache.get(id);
  if (cached) return cached;

  await requireDb();

  const rows = await sql`select * from coins where id = ${id} limit 1`;
  const row = rows[0] || null;

  if (row) {
    coinCache.set(id, row);
  }

  return row;
}

async function getRecentCoinActivity(coinId, limit = 50) {
  const id = String(coinId || "").trim();
  const cacheKey = `activity_${id}_${limit}`;
  const cached = coinCache.get(cacheKey);
  if (cached) return cached;

  if (!id) return [];
  await requireDb();
  const safeLimit = Math.max(1, Math.min(120, safeNum(limit, 50)));
  const rows = await sql`
    select id, coin_id, type, sol, tokens, fee, created_at, wallet
    from transactions where coin_id = ${id} order by created_at desc limit ${safeLimit}
  `;

  const activity = Array.isArray(rows)
    ? rows.map((t) => ({
        id: t.id,
        coinId: t.coinId || t.coin_id,
        side: String(t.type || "TX").toUpperCase(),
        type: String(t.type || "TX").toUpperCase(),
        sol: safeNum(t.sol, 0),
        tokens: safeNum(t.tokens, 0),
        fee: safeNum(t.fee, 0),
        ts: t.createdAt
          ? new Date(t.createdAt).getTime()
          : t.created_at
          ? new Date(t.created_at).getTime()
          : nowMS(),
        wallet: t.wallet,
      }))
    : [];

  coinCache.set(cacheKey, activity);
  return activity;
}

async function saveCoin(coin, _tx = null) {
  await requireDb();
  const db = _tx || sql;
  const payload = {
    id: String(coin.id || uid()),
    ...coinToDbUpdate(coin),
  };

  const rows = await db`
    insert into coins (
      id, name, symbol, story, logo, metadata_uri, mint_address, mint_signature, creator_wallet, created_at,
      total_supply, curve_supply, curve_sold, v_sol, v_tokens,
      reserve_sol, reserve_token, market_cap, last_price, ath_market_cap,
      volume_sol, last_trade_at, creator_rewards, chart, holders,
      reserve_wallet_address, reserve_wallet_encrypted
    )
    values (
      ${payload.id}, ${payload.name}, ${payload.symbol}, ${payload.story},
      ${payload.logo}, ${payload.metadata_uri},
      ${payload.mint_address}, ${payload.mint_signature},
      ${payload.creator_wallet}, ${payload.created_at},
      ${payload.total_supply}, ${payload.curve_supply}, ${payload.curve_sold},
      ${payload.v_sol}, ${payload.v_tokens},
      ${payload.reserve_sol}, ${payload.reserve_token},
      ${payload.market_cap}, ${payload.last_price}, ${payload.ath_market_cap},
      ${payload.volume_sol}, ${payload.last_trade_at},
      ${payload.creator_rewards}, ${payload.chart || []}, ${payload.holders || {}},
      ${payload.reserve_wallet_address}, ${payload.reserve_wallet_encrypted}
    )
    on conflict (id) do update set
      name = excluded.name,
      symbol = excluded.symbol,
      story = excluded.story,
      logo = excluded.logo,
      metadata_uri = excluded.metadata_uri,
      mint_address = excluded.mint_address,
      mint_signature = excluded.mint_signature,
      creator_wallet = excluded.creator_wallet,
      created_at = excluded.created_at,
      total_supply = excluded.total_supply,
      curve_supply = excluded.curve_supply,
      curve_sold = excluded.curve_sold,
      v_sol = excluded.v_sol,
      v_tokens = excluded.v_tokens,
      reserve_sol = excluded.reserve_sol,
      reserve_token = excluded.reserve_token,
      market_cap = excluded.market_cap,
      last_price = excluded.last_price,
      ath_market_cap = excluded.ath_market_cap,
      volume_sol = excluded.volume_sol,
      last_trade_at = excluded.last_trade_at,
      creator_rewards = excluded.creator_rewards,
      chart = excluded.chart,
      holders = excluded.holders,
      reserve_wallet_address = excluded.reserve_wallet_address,
      reserve_wallet_encrypted = coalesce(nullif(excluded.reserve_wallet_encrypted, ''), coins.reserve_wallet_encrypted)
    returning *`;

  coinCache.set(payload.id, rows[0]);
  broadcast("coin:update", mapDbCoinToApi(rows[0]));

  return mapDbCoinToApi(rows[0]);
}

function buildChartTrail(prevChart, nextPoint, sideHint = "") {
  const history = Array.isArray(prevChart)
    ? prevChart.map((x) => Math.max(0, safeNum(x, 0))).filter((x) => Number.isFinite(x) && x > 0)
    : [];

  const point = Math.max(0, safeNum(nextPoint, 0));

  if (!point) {
    return history.length ? history.slice(-MAX_CHART_POINTS) : [0];
  }

  if (!history.length) {
    // Flat seed — do not fabricate a fake pump/dump trail for brand-new coins.
    return [point, point, point, point, point];
  }

  // Append the actual AMM-derived price — no random noise or direction correction.
  // The bonding curve already produces the correct price; fabricated adjustments
  // would make displayed price history diverge from on-chain reality.
  return history.slice(-(MAX_CHART_POINTS - 1)).concat([Math.max(0.00000001, point)]);
}

function recalcCoin(coin, opts = {}) {
  const fixed = {
    ...coin,
    totalSupply: Math.max(1, safeNum(coin.totalSupply, TOTAL_SUPPLY)),
    curveSupply: Math.max(1, safeNum(coin.curveSupply, saleSupplyFromTotal(coin.totalSupply || TOTAL_SUPPLY))),
    tokenReserve: Math.max(1, safeNum(coin.tokenReserve, saleSupplyFromTotal(coin.totalSupply || TOTAL_SUPPLY))),
    solReserve: Math.max(0, safeNum(coin.solReserve, 0)),
    vSol: Math.max(1e-9, safeNum(coin.vSol, VIRTUAL_SOL)),
    vTokens: calcVirtualTokens(
      coin.totalSupply || TOTAL_SUPPLY,
      coin.curveSupply || saleSupplyFromTotal(coin.totalSupply || TOTAL_SUPPLY),
      coin.vTokens
    ),
    holders: asObj(coin.holders, {}),
  };

  fixed.curveSold = clampNum(
    safeNum(fixed.curveSold, fixed.curveSupply - fixed.tokenReserve),
    0,
    fixed.curveSupply
  );

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
    ? buildChartTrail(prev, point, opts.sideHint)
    : prev.length
    ? prev.slice(-MAX_CHART_POINTS)
    : [point, point, point, point, point];

  fixed.lastTradeAt = nowMS();
  fixed.ath = Math.max(safeNum(fixed.ath, 0), pricing.mcUsd);

  return fixed;
}

async function upsertCandlesForTrade(coinId, price, volumeSol) {
  await requireDb();

  const id = String(coinId || "").trim();
  if (!id) return;

  const now = Date.now();
  const p = Math.max(0.00000001, safeNum(price, 0.00000001));
  const vol = Math.max(0, safeNum(volumeSol, 0));

  const timeframes = [
    ["5m", 300_000],
    ["15m", 900_000],
    ["1h", 3_600_000],
    ["4h", 14_400_000],
    ["1d", 86_400_000],
    ["1w", 604_800_000],
    ["1m", 2_592_000_000],
  ];

  // One atomic UPSERT per TF — avoids read/modify/write races when buy+sell
  // hit the same bucket in parallel (high/low were getting lost).
  await Promise.all(
    timeframes.map(async ([tf, ms]) => {
      const bucket = Math.floor(now / ms) * ms;

      let openPrice = p;
      try {
        const prev = await sql`
          select close from candles
          where coin_id = ${id} and timeframe = ${tf} and bucket_time < ${bucket}
          order by bucket_time desc limit 1
        `;
        openPrice = Math.max(0.00000001, safeNum(prev?.[0]?.close, p));
      } catch {}

      await sql`
        insert into candles (
          coin_id, timeframe, bucket_time,
          open, high, low, close,
          volume_sol, trades_count, updated_at
        )
        values (
          ${id}, ${tf}, ${bucket},
          ${openPrice}, ${p}, ${p}, ${p},
          ${vol}, 1, now()
        )
        on conflict (coin_id, timeframe, bucket_time)
        do update set
          high = greatest(candles.high, excluded.close),
          low = least(candles.low, excluded.close),
          close = excluded.close,
          volume_sol = candles.volume_sol + excluded.volume_sol,
          trades_count = candles.trades_count + 1,
          updated_at = now()
      `;
    })
  );
}

function applyFee(solAmount) {
  const gross = Math.max(0, safeNum(solAmount, 0));
  const fee = gross * (FEE_PCT / 100);
  const net = Math.max(0, gross - fee);
  return { fee, net };
}

async function distributeFeeDirect(coin, traderWallet, feeSol) {
  const fee = Math.max(0, safeNum(feeSol, 0));
  if (fee <= 0) return;

  const creatorWallet = String(coin?.creatorWallet || coin?.owner || "").trim();

  const ownerPart   = fee * (OWNER_PCT_OF_FEE   / 100);
  const creatorPart = fee * (CREATOR_PCT_OF_FEE  / 100);
  const referralPart = fee * (REFERRAL_PCT_OF_FEE / 100);

  // Lookup creator's referral upline before the transaction (read-only, no lock needed).
  const creatorProfileRows =
    creatorWallet && referralPart > 0
      ? await sql`select referrer from profiles where wallet = ${creatorWallet} limit 1`
      : [];
  const creatorUpline = String(creatorProfileRows?.[0]?.referrer || "").trim();

  // Ensure every recipient profile exists before the atomic block.
  // getProfile(w, true) is idempotent — creates the row if absent, no-ops otherwise.
  const profileEnsure = [];
  if (APP_OWNER_WALLET && ownerPart > 0)
    profileEnsure.push(getProfile(APP_OWNER_WALLET, true));
  if (creatorWallet && creatorPart > 0)
    profileEnsure.push(getProfile(creatorWallet, true));
  if (creatorUpline && creatorUpline !== creatorWallet && referralPart > 0)
    profileEnsure.push(getProfile(creatorUpline, true));
  if (profileEnsure.length) await Promise.all(profileEnsure);

  // All three reward UPDATEs run inside one DB transaction.
  // Either all succeed or all roll back — no partial fee distribution.
  await sql.begin(async (tx) => {
    const updates = [];

    if (APP_OWNER_WALLET && ownerPart > 0) {
      updates.push(tx`
        update profiles
        set owner_rewards = owner_rewards + ${ownerPart}, updated_at = now()
        where wallet = ${APP_OWNER_WALLET}
      `);
    }

    if (creatorWallet && creatorPart > 0) {
      updates.push(tx`
        update profiles
        set creator_rewards = creator_rewards + ${creatorPart}, updated_at = now()
        where wallet = ${creatorWallet}
      `);
    }

    if (creatorUpline && creatorUpline !== creatorWallet && referralPart > 0) {
      updates.push(tx`
        update profiles
        set referral_rewards = referral_rewards + ${referralPart}, updated_at = now()
        where wallet = ${creatorUpline}
      `);
    }

    if (updates.length) await Promise.all(updates);
  });

  // In-memory coin state update (outside DB transaction — safe, read from DB on next cache miss).
  if (creatorWallet && creatorPart > 0) {
    coin.creatorRewardsSol = Math.max(0, safeNum(coin.creatorRewardsSol, 0) + creatorPart);
    broadcast("creator:update", {
      wallet: creatorWallet,
      coinId: coin?.id || "",
      amount: creatorPart,
      fee,
    });
  }

  if (creatorUpline && creatorUpline !== creatorWallet && referralPart > 0) {
    broadcast("referral:update", {
      wallet: creatorUpline,
      sourceWallet: traderWallet,
      creatorWallet,
      coinId: coin?.id || "",
      amount: referralPart,
      fee,
    });
    broadcast("notification:new", {
      wallet: creatorUpline,
      type: "referral_reward",
      title: `Affiliate reward earned: ${referralPart.toFixed(6)} SOL`,
      coinId: coin?.id || "",
    });
  }
}

function ammBuy(coin, wallet, solInGross) {
  const { fee, net } = applyFee(solInGross);
  if (net <= 0) return { ok: false, error: "Invalid amount" };

  const totalSupply = Math.max(1, safeNum(coin.totalSupply, TOTAL_SUPPLY));
  const curveSupply = Math.max(1, safeNum(coin.curveSupply, saleSupplyFromTotal(totalSupply)));

  coin.holders = asObj(coin.holders, {});
  coin.solReserve = Math.max(0, safeNum(coin.solReserve, 0));
  coin.tokenReserve = Math.max(1, safeNum(coin.tokenReserve, curveSupply));

  const vSol = Math.max(1e-9, safeNum(coin.vSol, VIRTUAL_SOL));
  const vTokens = calcVirtualTokens(totalSupply, curveSupply, coin.vTokens);

  const x = coin.solReserve + vSol;
  const y = coin.tokenReserve + vTokens;
  const k = x * y;

  const newX = x + net;
  const newY = k / newX;

  const tokensOut = Math.max(0, y - newY);

  if (tokensOut <= 0.0000001) {
    return { ok: false, error: "Buy too small" };
  }

  coin.solReserve += net;
  coin.tokenReserve -= tokensOut;

  coin.holders[wallet] = Math.max(0, safeNum(coin.holders[wallet], 0) + tokensOut);

  coin.volumeSol += solInGross;
  coin.lastTradeAt = nowMS();

  return { ok: true, tokensOut, feeSol: fee, netSol: net };
}

function ammSellByTokensIn(coin, wallet, tokensInRequested) {
  const tokensInRequestedNum = Math.max(0, safeNum(tokensInRequested, 0));
  if (tokensInRequestedNum <= 0) return { ok: false, error: "Invalid token amount" };

  const totalSupply = Math.max(1, safeNum(coin.totalSupply, TOTAL_SUPPLY));
  const curveSupply = Math.max(1, safeNum(coin.curveSupply, saleSupplyFromTotal(totalSupply)));

  coin.holders = asObj(coin.holders, {});
  coin.solReserve = Math.max(0, safeNum(coin.solReserve, 0));
  coin.tokenReserve = Math.max(1, safeNum(coin.tokenReserve, curveSupply));

  const holderBal = Math.max(0, safeNum(coin.holders[wallet], 0));
  if (holderBal <= 0) return { ok: false, error: "Not enough tokens" };

  const tokensIn = Math.min(tokensInRequestedNum, holderBal);

  const vSol = Math.max(1e-9, safeNum(coin.vSol, VIRTUAL_SOL));
  const vTokens = calcVirtualTokens(totalSupply, curveSupply, coin.vTokens);

  const x = coin.solReserve + vSol;
  const y = coin.tokenReserve + vTokens;
  const k = x * y;

  const newY = y + tokensIn;
  const newX = k / newY;

  const grossSolOut = Math.max(0, x - newX);

  if (grossSolOut <= 0.0000001) {
    return { ok: false, error: "Sell too small" };
  }

  if (grossSolOut > coin.solReserve) {
    return { ok: false, error: "Pool empty" };
  }

  const fee = grossSolOut * (FEE_PCT / 100);
  const netSol = Math.max(0, grossSolOut - fee);

  coin.solReserve -= grossSolOut;
  coin.tokenReserve += tokensIn;

  coin.holders[wallet] = Math.max(0, holderBal - tokensIn);
  if (coin.holders[wallet] <= 0.0000001) delete coin.holders[wallet];

  coin.volumeSol += grossSolOut;
  coin.lastTradeAt = nowMS();

  return {
    ok: true,
    tokensIn,
    solOut: grossSolOut,
    solOutGross: grossSolOut,
    solOutNet: netSol,
    feeSol: fee,
  };
}

// -------------------- TRADE LOCK --------------------
// Two-layer locking:
//   1. In-process queue (COIN_TRADE_LOCKS Map) — fast path, avoids DB round-trips
//      for concurrent requests hitting the same instance.
//   2. PostgreSQL advisory xact lock — cross-instance lock for Railway multi-process
//      deploys. pg_advisory_xact_lock is held for the duration of a transaction;
//      any other instance that calls pg_advisory_xact_lock with the same ID blocks
//      until our transaction commits, guaranteeing serialized bonding curve updates.

const COIN_TRADE_LOCKS = new Map();

// Deterministic signed-bigint lock ID from a coinId string (fits pg int8).
function _coinLockId(coinId) {
  const h = crypto.createHash("sha256").update(String(coinId)).digest();
  // Read first 8 bytes as a signed 64-bit big-endian integer.
  return h.readBigInt64BE(0);
}

async function runCoinLocked(coinId, fn) {
  const key = String(coinId || "");

  // Layer 1: same-instance serialization
  const prev = COIN_TRADE_LOCKS.get(key) || Promise.resolve();
  let release;
  const next = new Promise((resolve) => { release = resolve; });
  COIN_TRADE_LOCKS.set(key, prev.then(() => next));

  try {
    await prev;

    if (sql) {
      // Layer 2: cross-instance DB advisory lock (transaction-scoped → auto-released on commit/rollback)
      const lockId = _coinLockId(key);
      return await sql.begin(async (_tx) => {
        await _tx`SELECT pg_advisory_xact_lock(${lockId})`;
        return await fn(_tx); // critical helpers use _tx — atomic with the advisory lock
      });
    }
    return await fn(null);
  } finally {
    release();
    if (COIN_TRADE_LOCKS.get(key) === next) {
      COIN_TRADE_LOCKS.delete(key);
    }
  }
}

// -------------------- OPTIONAL AUTH (Privy) --------------------
// Sensitive endpoints (jaise mnemonic reveal) ke liye Privy access-token verify.
// Iske liye: npm i @privy-io/server-auth  AUR env me PRIVY_APP_ID + PRIVY_APP_SECRET.
// Frontend ko Authorization: Bearer <privy access token> bhejna hoga.
// Agar config nahi hai to protected endpoint 503 dega (kuch leak nahi hoga).
let _privyClient = null;
async function getPrivyClient() {
  if (_privyClient) return _privyClient;
  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) return null;
  try {
    const { PrivyClient } = await import("@privy-io/server-auth");
    _privyClient = new PrivyClient(appId, appSecret);
    return _privyClient;
  } catch (e) {
    console.log("privy client load failed:", e?.message || e);
    return null;
  }
}

async function requireAuth(req, res) {
  const client = await getPrivyClient();
  if (!client) {
    res.status(503).json({ ok: false, error: "auth not configured" });
    return null;
  }
  try {
    const header = String(req.headers.authorization || "");
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) {
      res.status(401).json({ ok: false, error: "missing token" });
      return null;
    }
    const claims = await client.verifyAuthToken(token);
    return claims; // { userId, ... }
  } catch (e) {
    res.status(401).json({ ok: false, error: "invalid token" });
    return null;
  }
}

// userId → { wallet, expiresAt } — Privy getUser calls cache karo (5 min TTL)
// Har ghante expired entries clean karo taake Map unbounded na badhay
const _authWalletCache = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of _authWalletCache) {
    if (entry.expiresAt <= now) _authWalletCache.delete(id);
  }
}, 60 * 60 * 1000);

// Privy token verify karo + authenticated user ka Solana wallet address fetch karo.
// Wallet REQ BODY SE KABHI NAHI AATA — sirf Privy session se.
// Returns { claims, wallet } or null (auth fails → response already sent).
async function requireAuthWallet(req, res) {
  const claims = await requireAuth(req, res);
  if (!claims) return null;

  const userId = String(claims.userId || "").trim();
  if (!userId) {
    res.status(401).json({ ok: false, error: "invalid token" });
    return null;
  }

  // Cache hit — extra Privy API call bachao
  const cached = _authWalletCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return { claims, wallet: cached.wallet };
  }

  try {
    const client = await getPrivyClient();
    const user = await client.getUser(userId);
    // Privy embedded Solana wallet prefer karo; warna pehla linked Solana wallet
    const solAccount =
      user.linkedAccounts?.find(
        (a) => a.type === "wallet" && a.chainType === "solana" && a.walletClient === "privy"
      ) ||
      user.linkedAccounts?.find(
        (a) => a.type === "wallet" && a.chainType === "solana"
      );

    if (!solAccount?.address) {
      res.status(403).json({ ok: false, error: "No Solana wallet linked to this account" });
      return null;
    }

    const wallet = String(solAccount.address).trim();
    _authWalletCache.set(userId, { wallet, expiresAt: Date.now() + 5 * 60 * 1000 });
    return { claims, wallet };
  } catch (e) {
    console.error("[error:requireAuthWallet]", e?.message || e);
    res.status(401).json({ ok: false, error: "Authentication failed" });
    return null;
  }
}

// -------------------- ROUTES --------------------
app.get("/", async (req, res) => {
  return res.json({
    ok: true,
    name: "pumpmini-backend",
    dbMode: "neon-postgres",
    ts: nowMS(),
  });
});

app.get("/health", async (req, res) => {
  try {
    let coins = 0;
    if (sql) {
      const rows = await sql`select count(*)::int as count from coins`;
      coins = safeNum(rows?.[0]?.count, 0);
    }

    return res.json({
      ok: true,
      coins,
      ts: Date.now(),
    });
  } catch (e) {
    return serverErr(e, res, "health");
  }
});

app.get("/sol-price", async (req, res) => {
  try {
    const price = await getLiveSolUsd();
    return res.json({ ok: true, price, ts: _solPriceCache.ts });
  } catch (e) {
    console.error("[error:sol-price]", e?.stack || e?.message || e);
    return res.status(500).json({ ok: false, price: currentSolUsd, error: "Internal server error" });
  }
});

// -------------------- ADMIN MONITORING --------------------
// ADMIN_SECRET env var set karo — bina secret ke access nahi milega

// Dono strings ko SHA-256 se hash karke timingSafeEqual se compare karo.
// Isse response time se secret extract karna impossible hota hai:
// — timingSafeEqual hamesha poore 32 bytes compare karta hai, chahe pehla char match ho ya na ho
// — SHA-256 digest length hamesha 32 bytes hoti hai — string length bhi leak nahi hoti
function checkAdminSecret(provided, expected) {
  if (!expected) return false;
  const a = crypto.createHash("sha256").update(String(provided)).digest();
  const b = crypto.createHash("sha256").update(String(expected)).digest();
  return crypto.timingSafeEqual(a, b);
}

// Client ko hamesha generic message bhejo — DB internals, table names, column names
// kabhi bhi response mein nahi aane chahiye. Full error sirf server logs mein hota hai.
function serverErr(e, res, label = "server") {
  console.error(`[error:${label}]`, e?.stack || e?.message || e);
  return res.status(500).json({ ok: false, error: "Internal server error" });
}

// Saare custodial wallets ka SOL ek baar treasury mein sweep karo (ENABLE_SWEEP bypass)
app.post("/admin/sweep-all", async (req, res) => {
  try {
    const secret = String(req.headers["x-admin-secret"] || "").trim();
    const expected = String(process.env.ADMIN_SECRET || "").trim();
    if (!checkAdminSecret(secret, expected)) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    const profiles = await sql`
      select wallet_address, encrypted_mnemonic
      from profiles
      where wallet_address is not null and encrypted_mnemonic is not null
    `;

    const results = [];
    for (const row of profiles) {
      const addr = String(row.wallet_address || "").trim();
      const enc  = String(row.encrypted_mnemonic || "").trim();
      if (!addr || !enc) continue;

      try {
        const pub      = new PublicKey(addr);
        const lamports = await connection.getBalance(pub);
        const sol      = lamports / 1_000_000_000;
        const sendable = sol - (SWEEP_BUFFER_SOL || 0.002);
        if (sendable <= 0.0005) {
          results.push({ addr, swept: 0, skipped: true });
          continue;
        }
        const kp = await getCustodialKeypairFromMnemonic(enc);
        const tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: kp.publicKey,
            toPubkey:   treasury.publicKey,
            lamports:   Math.floor(sendable * 1_000_000_000),
          })
        );
        const sig = await sendAndConfirmTransaction(connection, tx, [kp]);
        results.push({ addr, swept: sendable, sig });
      } catch (e) {
        console.error(`[error:admin/sweep addr=${addr}]`, e?.message || e);
        results.push({ addr, swept: 0, error: "sweep failed" });
      }
    }

    const totalSwept = results.reduce((s, r) => s + (r.swept || 0), 0);
    return res.json({ ok: true, totalSwept, wallets: results.length, results });
  } catch (e) {
    return serverErr(e, res, "admin/sweep-all");
  }
});

app.get("/admin/stats", async (req, res) => {
  try {
    const secret = String(req.headers["x-admin-secret"] || "").trim();
    const expected = String(process.env.ADMIN_SECRET || "").trim();
    if (!checkAdminSecret(secret, expected)) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    await requireDb();

    const [
      usersRow, coinsRow, depositsRow, withdrawalsRow,
      failedRow, totalMcRow, recentAuditRows, treasuryRow
    ] = await Promise.all([
      sql`select count(*)::int as count from profiles`,
      sql`select count(*)::int as count from coins`,
      sql`select coalesce(sum(amount),0)::numeric as total from deposits`,
      sql`select coalesce(sum(amount),0)::numeric as total from withdrawals where status='confirmed'`,
      sql`select count(*)::int as count from audit_logs where event_type like '%FAILED%'`,
      sql`select coalesce(sum(market_cap),0)::numeric as total from coins`,
      sql`select event_type, wallet, amount, created_at from audit_logs order by created_at desc limit 20`,
      connection.getBalance(treasury.publicKey).then(l => l / 1e9).catch(() => 0),
    ]);

    const totalDeposits    = safeNum(depositsRow?.[0]?.total, 0);
    const totalWithdrawals = safeNum(withdrawalsRow?.[0]?.total, 0);
    const totalUserFunds   = totalDeposits - totalWithdrawals;

    return res.json({
      ok: true,
      ts: new Date().toISOString(),
      treasury: { balanceSol: treasuryRow, minReserveSol: TREASURY_MIN_RESERVE_SOL },
      users: safeNum(usersRow?.[0]?.count, 0),
      coins: safeNum(coinsRow?.[0]?.count, 0),
      totalMarketCapUsd: safeNum(totalMcRow?.[0]?.total, 0),
      funds: { totalDeposits, totalWithdrawals, totalUserFunds },
      failedTransactions: safeNum(failedRow?.[0]?.count, 0),
      recentAudit: recentAuditRows || [],
    });
  } catch (e) {
    return serverErr(e, res, "admin/stats");
  }
});



app.get("/balance/:wallet", async (req, res) => {
  const auth = await requireAuthWallet(req, res);
  if (!auth) return;
  try {
    // URL param ignore karo — sirf authenticated user ki balance
    const wallet = auth.wallet;

    const profileRow = await sql`select wallet_address, sol_balance from profiles where wallet = ${String(wallet)} limit 1`;
    const custodialAddress = String(profileRow?.[0]?.wallet_address || "").trim();

    let sol = 0;

    if (custodialAddress) {
      try {
        const pub = new PublicKey(custodialAddress);
        const lamports = await connection.getBalance(pub);
        sol = lamports / 1_000_000_000;

        // sol_balance update karo
        await sql`update profiles set sol_balance = ${sol}, updated_at = now() where wallet = ${String(wallet)}`;
      } catch {
        sol = Math.max(0, safeNum(profileRow?.[0]?.sol_balance, 0));
      }
    } else {
      sol = Math.max(0, safeNum(profileRow?.[0]?.sol_balance, 0));
    }

    return res.json({ ok: true, sol });
  } catch (e) {
    return res.json({ ok: true, sol: 0 });
  }
});



app.post("/withdraw", withdrawLimiter, async (req, res) => {
  const auth = await requireAuthWallet(req, res);
  if (!auth) return;
  if (!WITHDRAWALS_ENABLED) {
    return res.status(503).json({ ok: false, error: "Withdrawals temporarily disabled" });
  }
  try {
    const wallet = auth.wallet; // Privy session se — req.body.wallet kabhi trust nahi hota
    const destination = String(req.body?.destination || "").trim();
    const amount = Math.max(0, safeNum(req.body?.amount, 0));
    const kind = String(req.body?.kind || "").trim().toUpperCase();
    // Idempotency key (optional — client UUID bheje taake double-click safe ho)
    const idempotencyKey = String(req.body?.idempotencyKey || "").trim() || null;

    // Reward-based withdrawal — auth wallet pass karo
    if (kind === "REF" || kind === "REFERRAL" || kind === "CREATOR" || kind === "OWNER") {
      return handleRewardWithdraw(req, res, kind, wallet);
    }

    // Idempotency check: agar same key se pehle request aayi thi toh duplicate process mat karo
    if (idempotencyKey) {
      const existing = await sql`
        select id, status, tx_hash from withdrawals
        where idempotency_key = ${idempotencyKey} and wallet = ${wallet}
        limit 1
      `;
      const rec = existing?.[0];
      if (rec) {
        if (rec.status === "confirmed") {
          // Pehle se complete — same result return karo (safe to retry)
          return res.json({ ok: true, txHash: rec.tx_hash, idempotent: true });
        }
        if (rec.status === "pending") {
          // Abhi chal rahi hai — client dobara try na kare
          return res.status(409).json({ ok: false, error: "Withdrawal already in progress", withdrawalId: rec.id });
        }
        // status='failed' — retry allowed, neeche normal flow chalega
      }
    }

    if (!destination) {
      return res.status(400).json({ ok: false, error: "destination required" });
    }

    if (amount <= 0) {
      return res.status(400).json({ ok: false, error: "invalid amount" });
    }

    // Per-transaction limit
    if (MAX_WITHDRAW_SOL > 0 && amount > MAX_WITHDRAW_SOL) {
      return res.status(400).json({
        ok: false,
        error: `Maximum withdrawal is ${MAX_WITHDRAW_SOL} SOL per transaction`,
      });
    }

    // Per-user daily cap — last 24h ke confirmed withdrawals ka sum check karo
    if (DAILY_WITHDRAW_CAP_SOL > 0) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const capRows = await sql`
        select coalesce(sum(amount), 0)::numeric as total
        from withdrawals
        where wallet = ${wallet}
          and status = 'confirmed'
          and created_at >= ${since}
      `;
      const usedToday = Math.max(0, safeNum(capRows?.[0]?.total, 0));
      if (usedToday + amount > DAILY_WITHDRAW_CAP_SOL) {
        const remaining = Math.max(0, DAILY_WITHDRAW_CAP_SOL - usedToday);
        return res.status(400).json({
          ok: false,
          error: `Daily withdrawal limit reached. Remaining: ${remaining.toFixed(4)} SOL`,
        });
      }
    }

    // Destination valid Solana address honi chahiye
    let destPub;
    try {
      destPub = new PublicKey(destination);
    } catch {
      return res.status(400).json({ ok: false, error: "invalid destination address" });
    }

    // Treasury balance check — all platform SOL (fees, sweeps) lives in treasury
    const FEE_BUFFER = 0.001;
    const treasuryLamports = await connection.getBalance(treasury.publicKey);
    const treasurySol = treasuryLamports / 1_000_000_000;
    if (treasurySol < amount + FEE_BUFFER) {
      return res.status(400).json({
        ok: false,
        error: `Insufficient treasury balance. Available: ${treasurySol.toFixed(4)} SOL`,
      });
    }

    // STEP 1 — Atomic: run_balance deduct + 'pending' withdrawal record ek saath.
    // FOR UPDATE lock concurrent double-spend rokta hai.
    // Agar Solana TX ke beech server crash ho, ye 'pending' record reconciliation
    // ke liye exist karega — startup pe on-chain check karke restore ya confirm ho sakta hai.
    let withdrawalId;
    try {
      withdrawalId = await sql.begin(async (tx) => {
        const rows = await tx`
          select run_balance from profiles
          where wallet = ${wallet}
          for update
        `;
        if (!rows?.[0]) throw new Error("Profile not found");

        const runBal = Math.max(0, safeNum(rows[0].run_balance, 0));
        if (runBal < amount) throw new Error("Insufficient balance");

        await tx`
          update profiles
          set run_balance = run_balance - ${amount}, updated_at = now()
          where wallet = ${wallet}
        `;

        const wdId = crypto.randomUUID();
        await tx`
          insert into withdrawals (id, wallet, destination, amount, tx_hash, status, idempotency_key, created_at)
          values (${wdId}, ${wallet}, ${destination}, ${amount}, null, 'pending', ${idempotencyKey}, now())
        `;
        return wdId;
      });
    } catch (balErr) {
      return res.status(400).json({ ok: false, error: balErr.message || "Insufficient balance" });
    }

    // STEP 2 — Solana on-chain transfer from treasury
    let signature;
    try {
      const solanaTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: treasury.publicKey,
          toPubkey: destPub,
          lamports: Math.floor(amount * 1_000_000_000),
        })
      );
      signature = await sendAndConfirmTransaction(connection, solanaTx, [treasury]);
    } catch (sendErr) {
      // TX fail: record 'failed' mark karo, phir balance restore karo.
      await sql`
        update withdrawals set status = 'failed' where id = ${withdrawalId}
      `.catch(() => {});
      try {
        await increaseRun(wallet, amount);
      } catch (restoreErr) {
        // Balance restoration failed — user's balance stays decremented.
        // Needs manual reconciliation.
        console.error("[CRITICAL:withdraw/sol balance-restore-failed]", {
          wallet, amount, withdrawalId, restoreErr: restoreErr?.message,
        });
      }
      await writeAudit("WITHDRAW_FAILED", wallet, amount, {
        meta: { error: sendErr?.message, destination, withdrawalId },
      }).catch(() => {});
      console.error("[error:withdraw/sol onchain]", sendErr?.message || sendErr);
      return res.status(502).json({ ok: false, error: "On-chain transfer failed" });
    }

    // STEP 3 — Confirm: record update + audit
    await sql`
      update withdrawals set status = 'confirmed', tx_hash = ${signature}
      where id = ${withdrawalId}
    `;
    await writeAudit("WITHDRAW", wallet, amount, {
      meta: { destination, txHash: signature, withdrawalId },
    });
    broadcast("portfolio:update", {
      wallet,
      type: "WITHDRAW",
      amount,
      destination,
      txHash: signature,
    });
    broadcast("notification:new", {
      wallet,
      type: "withdraw",
      title: `Withdrawal sent: ${amount.toFixed(4)} SOL`,
      txHash: signature,
    });

    return res.json({ ok: true, txHash: signature });

  } catch (e) {
    return serverErr(e, res, "withdraw/sol");
  }
});

async function handleRewardWithdraw(req, res, forcedKind = "", authWallet = null) {
  try {
    await requireDb();

    if (!authWallet) return res.status(401).json({ ok: false, error: "Authentication required" });
    const wallet = authWallet; // Privy session se — req.body.wallet kabhi trust nahi hota

    const kindRaw = String(forcedKind || req.body?.kind || "").trim().toUpperCase();
    const kind =
      kindRaw === "REFERRAL" ? "REF"     :
      kindRaw === "REF"      ? "REF"     :
      kindRaw === "CREATOR"  ? "CREATOR" :
      kindRaw === "OWNER"    ? "OWNER"   : "";

    if (!["REF", "CREATOR", "OWNER"].includes(kind)) {
      return res.json({ ok: false, error: "Unsupported kind" });
    }

    const col =
      kind === "REF"     ? "referral_rewards" :
      kind === "CREATOR" ? "creator_rewards"  :
                           "owner_rewards";

    // Atomic: ek hi DB transaction mein rewards zero + run_balance credit.
    // FOR UPDATE lock ensure karta hai ke do concurrent requests ek hi amount
    // do baar nahi le sakte (same pattern jo /claim mein hai).
    const result = await sql.begin(async (tx) => {
      const rows = await tx`
        select ${tx(col)}, run_balance
        from profiles
        where wallet = ${wallet}
        for update
      `;
      if (!rows?.[0]) throw new Error("Profile not found");

      const amount = Math.max(0, safeNum(rows[0][col], 0));
      if (amount <= 0) return { amount: 0 };

      await tx`
        update profiles
        set
          ${tx(col)} = 0,
          run_balance = run_balance + ${amount},
          updated_at = now()
        where wallet = ${wallet}
      `;
      return { amount };
    });

    if (result.amount <= 0) {
      return res.json({ ok: false, error: `No ${kind.toLowerCase()} rewards to claim` });
    }

    await writeAudit(`CLAIM_${kind}`, wallet, result.amount, {
      meta: { col, kind },
    });
    broadcast("portfolio:update", {
      wallet,
      type: "CLAIM",
      kind,
      amount: result.amount,
    });
    broadcast(kind === "CREATOR" ? "creator:update" : kind === "REF" ? "referral:update" : "owner:update", {
      wallet,
      type: "CLAIM",
      kind,
      amount: result.amount,
    });
    broadcast("notification:new", {
      wallet,
      type: "claim",
      title: `Claimed ${result.amount.toFixed(6)} SOL`,
      kind,
    });

    return res.json({ ok: true, kind, amountSol: result.amount, to: wallet });
  } catch (e) {
    return serverErr(e, res, "withdraw/reward");
  }
}

app.post("/withdraw/creator", async (req, res) => {
  const auth = await requireAuthWallet(req, res);
  if (!auth) return;
  return handleRewardWithdraw(req, res, "CREATOR", auth.wallet);
});
app.post("/withdraw/referral", async (req, res) => {
  const auth = await requireAuthWallet(req, res);
  if (!auth) return;
  return handleRewardWithdraw(req, res, "REF", auth.wallet);
});

app.get("/coin/list*", async (req, res) => {
  try {
    await requireDb();

    const page = Math.max(0, Number(req.query.page || 0));
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 50)));
    const offset = page * limit;

    const rows = await sql`
      select * from coins
      order by created_at desc
      limit ${limit} offset ${offset}
    `;

    const coins = Array.isArray(rows) ? rows.map(mapDbCoinToApi).filter(Boolean) : [];

    return res.json({
      ok: true,
      coins,
      page,
      limit,
      hasMore: coins.length >= limit,
      hot15m: [],
    });
  } catch (e) {
    return serverErr(e, res, "coin/list");
  }
});

app.get("/coin/:id/dex-preview", async (req, res) => {
  const auth = await requireAuthWallet(req, res);
  if (!auth) return;
  try {
    await requireDb();
    const wallet = auth.wallet; // Privy session se — client-supplied param ignored
    const row = await getCoinRowById(req.params.id);
    const coin = row ? mapDbCoinToApi(row) : null;
    if (!coin) return res.status(404).json({ ok: false, error: "Coin not found" });

    const creatorWallet = String(coin.creatorWallet || coin.owner || "").trim();
    const isCreator = Boolean(wallet && creatorWallet && wallet === creatorWallet);
    const mc = Math.max(0, safeNum(coin.mc, 0));

    return res.json({
      ok: true,
      coinId: coin.id,
      eligible: isCreator && mc >= DEX_LAUNCH_MC_USD,
      isCreator,
      currentMc: mc,
      requiredMc: DEX_LAUNCH_MC_USD,
      options: DEX_OPTIONS,
      status: mc >= DEX_LAUNCH_MC_USD ? "READY_PHASE_2" : "LOCKED_UNTIL_5M_MC",
      message: "DEX launch is a safe placeholder. Real pool creation will be enabled after Phase 2 audit.",
    });
  } catch (e) {
    return serverErr(e, res, "coin/dex-preview");
  }
});

// -------------------- METEORA MIGRATION (SCAFFOLD) --------------------
// $5M MC par creator KHUD migrate kar sake. Ye SIRF scaffold hai.
// Asli Meteora DAMM pool creation + SPL mint + LP lock yahan implement karna hai
// (Meteora SDK ke saath, pehle DEVNET par test). Abhi ye sirf eligibility check karta hai.
app.post("/coin/:id/migrate", async (req, res) => {
  const auth = await requireAuthWallet(req, res);
  if (!auth) return;
  try {
    await requireDb();

    const coinId = String(req.params.id || "").trim();
    const wallet = auth.wallet; // Privy session se — req.body.wallet kabhi trust nahi hota

    const row = await getCoinRowById(coinId);
    const coin = row ? mapDbCoinToApi(row) : null;
    if (!coin) return res.status(404).json({ ok: false, error: "Coin not found" });

    const creatorWallet = String(coin.creatorWallet || coin.owner || "").trim();
    if (!creatorWallet || creatorWallet !== wallet) {
      return res.status(403).json({ ok: false, error: "Only the creator can migrate" });
    }

    if (coin.migrated) {
      return res.json({ ok: false, error: "Already migrated" });
    }

    const mc = Math.max(0, safeNum(coin.mc, 0));
    if (mc < DEX_LAUNCH_MC_USD) {
      return res.json({
        ok: false,
        error: "Locked",
        currentMc: mc,
        requiredMc: DEX_LAUNCH_MC_USD,
      });
    }

    // TODO (Meteora step, devnet par banao + test karo):
    //  1) Asli SPL mint banao (createMint, 6 decimals) ya jo mintAddress mojood ho use karo.
    //  2) curve me jama hui SOL + tokens se Meteora DAMM pool banao.
    //  3) LP permanently lock karo.
    //  4) Pool address DB me save karo, coin.migrated = true karo.
    // Filhaal sirf eligibility return kar rahe hain (paisa move NAHI hota).
    return res.json({
      ok: true,
      ready: true,
      coinId: coin.id,
      currentMc: mc,
      requiredMc: DEX_LAUNCH_MC_USD,
      note: "Eligible. Meteora pool creation Phase 4 me implement hoga (devnet test ke baad).",
    });
  } catch (e) {
    return serverErr(e, res, "coin/migrate");
  }
});

app.get("/coin/:id", async (req, res) => {
  try {
    await requireDb();
    const coin = mapDbCoinToApi(await getCoinRowById(req.params.id));
    if (!coin) return res.status(404).json({ ok: false, error: "Coin not found" });
    return res.json({ ok: true, coin });
  } catch (e) {
    return serverErr(e, res, "coin/detail");
  }
});

app.get("/coin/:id/activity", async (req, res) => {
  try {
    await requireDb();
    const limit = Math.min(120, Math.max(20, Number(req.query.limit || 60)));
    const activity = await getRecentCoinActivity(req.params.id, limit);
    return res.json({ ok: true, activity });
  } catch (e) {
    return serverErr(e, res, "coin/activity");
  }
});

app.get("/coin/:id/candles", async (req, res) => {
  try {
    await requireDb();

    const coinId = String(req.params.id || "").trim();
    const tfRaw = String(req.query.tf || "5m").trim().toLowerCase();
    const limit = Math.max(10, Math.min(300, safeNum(req.query.limit, 120)));

    const TF_MS = {
      "5m": 5 * 60 * 1000,
      "15m": 15 * 60 * 1000,
      "1h": 60 * 60 * 1000,
      "4h": 4 * 60 * 60 * 1000,
      "1d": 24 * 60 * 60 * 1000,
      "1w": 7 * 24 * 60 * 60 * 1000,
      "1m": 30 * 24 * 60 * 60 * 1000,
    };

    const tfMap = {
      "5m": "5m", "15m": "15m", "1h": "1h", "4h": "4h",
      "1d": "1d", "1w": "1w", "1m": "1m",
      "5M": "5m", "15M": "15m", "1H": "1h", "4H": "4h",
      "1D": "1d", "1W": "1w", "1M": "1m",
    };

    const tf = tfMap[tfRaw] || "5m";
    const bucketMs = TF_MS[tf] || TF_MS["5m"];

    const coinRows = await sql`select * from coins where id = ${coinId} limit 1`;
    const coin = Array.isArray(coinRows) && coinRows[0] ? coinRows[0] : null;
    if (!coin) {
      return res.status(404).json({ ok: false, error: "Coin not found" });
    }

    const coinApi = mapDbCoinToApi(coin) || {};
    const createdAtMs = coin?.created_at ? new Date(coin.created_at).getTime() : Date.now();
    const now = Date.now();

    let rows = await sql`
      select coin_id, timeframe, bucket_time, open, high, low, close, volume_sol, trades_count
      from candles
      where coin_id = ${coinId} and timeframe = ${tf}
      order by bucket_time desc limit ${limit}
    `;

    let candles = Array.isArray(rows)
      ? rows.slice().reverse().map((r) => ({
          time: safeNum(r.bucket_time, 0),
          open: safeNum(r.open, 0),
          high: safeNum(r.high, 0),
          low: safeNum(r.low, 0),
          close: safeNum(r.close, 0),
          volumeSol: safeNum(r.volume_sol, 0),
          tradesCount: safeNum(r.trades_count, 0),
        }))
        .filter((c) => c.time > 0 && c.open > 0 && c.high > 0 && c.low > 0 && c.close > 0)
      : [];

    if (!candles.length) {
      const txRows = await sql`
        select created_at, sol, tokens, type
        from transactions
        where coin_id = ${coinId}
        order by created_at desc
        limit ${Math.max(400, limit * 8)}
      `;

      const list = Array.isArray(txRows) ? txRows.slice().reverse() : [];
      const map = new Map();

      const fallbackPrice =
        Math.max(
          0.00000001,
          safeNum(coinApi.priceUsd, 0),
          safeNum(coinApi.lastPriceUsd, 0),
          safeNum(coin.market_cap, 0) > 0
            ? safeNum(coin.market_cap, 0) / Math.max(1, safeNum(coin.total_supply, TOTAL_SUPPLY))
            : 0,
          Array.isArray(coin.chart) && coin.chart.length
            ? safeNum(coin.chart[coin.chart.length - 1], 0)
            : 0.000001
        ) || 0.000001;

      for (const tx of list) {
        const ts = new Date(tx.created_at).getTime();
        if (!Number.isFinite(ts) || ts <= 0) continue;

        const sol = Math.max(0, safeNum(tx.sol, 0));
        const tokens = Math.max(0, safeNum(tx.tokens, 0));
        const execPx = tokens > 0 ? (sol / tokens) * currentSolUsd : 0;
        let px = Math.max(0.00000001, execPx || fallbackPrice);
        // Clamp execution-avg outliers so sparse charts don't look like 50% crashes.
        if (fallbackPrice > 0) {
          px = Math.min(fallbackPrice * 1.08, Math.max(fallbackPrice * 0.92, px));
        }

        const bucket = Math.floor(ts / bucketMs) * bucketMs;
        const prev = map.get(bucket);

        if (!prev) {
          map.set(bucket, {
            time: bucket, open: px, high: px, low: px, close: px,
            volumeSol: sol, tradesCount: 1,
          });
        } else {
          prev.high = Math.max(prev.high, px);
          prev.low = Math.min(prev.low, px);
          prev.close = px;
          prev.volumeSol += sol;
          prev.tradesCount += 1;
        }
      }

      candles = Array.from(map.values()).sort((a, b) => a.time - b.time);

      if (!candles.length) {
        const start = Math.floor(
          Math.max(createdAtMs, now - bucketMs * Math.max(30, limit - 1)) / bucketMs
        ) * bucketMs;

        candles = [{
          time: start, open: fallbackPrice, high: fallbackPrice,
          low: fallbackPrice, close: fallbackPrice, volumeSol: 0, tradesCount: 0,
        }];
      }

      const first = candles[0];
      const currentBucket = Math.floor(now / bucketMs) * bucketMs;

      if (first) {
        const filled = [];
        const byTime = new Map(candles.map((c) => [c.time, c]));
        const fillStart = Math.floor(
          Math.max(createdAtMs, now - bucketMs * Math.max(30, limit - 1)) / bucketMs
        ) * bucketMs;

        let cursor = fillStart;
        let prevClose = first.close;

        while (cursor <= currentBucket) {
          const existing = byTime.get(cursor);

          if (existing) {
            filled.push(existing);
            prevClose = existing.close;
          } else {
            filled.push({
              time: cursor, open: prevClose, high: prevClose,
              low: prevClose, close: prevClose, volumeSol: 0, tradesCount: 0,
            });
          }

          cursor += bucketMs;
        }

        candles = filled;
      }
    }

    if (candles.length > limit) {
      candles = candles.slice(-limit);
    }

    return res.json({ ok: true, candles, tf });
  } catch (e) {
    return serverErr(e, res, "coin/candles");
  }
});

app.post("/coin/create", createLimiter, async (req, res) => {
  const auth = await requireAuthWallet(req, res);
  if (!auth) return;
  try {
    await requireDb();
    const _t0 = Date.now();
    console.log("[coin/create] request received, body keys:", Object.keys(req.body || {}));

    const name = String(req.body?.name || "").trim();
    const symbol = String(req.body?.symbol || "").trim().toUpperCase();
    const story = String(req.body?.story || "").trim();
    const logo = String(req.body?.logo || "");
    const creatorWallet = auth.wallet; // Privy session se — req.body.creatorWallet kabhi trust nahi hota
    const initialSol = Math.max(0, safeNum(req.body?.initialSol, 0));

    if (!name || !symbol) {
      return res.json({ ok: false, error: "name/symbol required" });
    }

    if (name.length > 60 || symbol.length > 12) {
      return res.json({ ok: false, error: "name/symbol too long" });
    }

    let finalLogo = logo;
    let imageUri = "";
    let metadataUri = "";

    if (logo && process.env.PINATA_JWT) {
      const IPFS_TIMEOUT = 15000;
      const withTimeout = (promise) =>
        Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("IPFS timeout")), IPFS_TIMEOUT)
          ),
        ]);
      try {
        console.log(`[coin/create] +${Date.now()-_t0}ms — IPFS upload starting`);
        const uploadedLogo = await withTimeout(
          uploadLogoToIPFS(logo, `${symbol || "coin"}-${Date.now()}.webp`)
        );
        finalLogo = uploadedLogo.url;
        imageUri = uploadedLogo.ipfs;
        const uploadedMeta = await withTimeout(
          uploadMetadataToIPFS({
            name, symbol,
            description: story || `${name} (${symbol})`,
            image: uploadedLogo.ipfs,
          })
        );
        metadataUri = uploadedMeta.ipfs;
        console.log(`[coin/create] +${Date.now()-_t0}ms — IPFS done`);
      } catch (ipfsErr) {
        console.error(`[coin/create] IPFS skipped: ${ipfsErr?.message}`);
      }
    }


    let mintAddress = "";
    let mintSignature = "";

    console.log(`[coin/create] +${Date.now()-_t0}ms — starting profile+IPFS`);
    const profile = await getProfile(creatorWallet, true);
    const custodialWallet = String(profile?.wallet_address || creatorWallet).trim();

    // CREATE COIN: initial buy ka SOL creator ke run_balance se kato (kam ho to reject)
    if (initialSol > 0) {
      try {
        await decreaseRun(creatorWallet, initialSol);
      } catch (balErr) {
        return res.json({ ok: false, error: "Insufficient balance for initial buy" });
      }
    }

    const totalSupply = getSupplyFromInitialSol(initialSol);
    const curveSupply = saleSupplyFromTotal(totalSupply);

    // Reserve wallet — isolated keypair per coin, never pool funds across coins
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
    console.log(`[reserve-wallet] ENCRYPTION_KEY set=${!!ENCRYPTION_KEY} len=${ENCRYPTION_KEY?.length}`);
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
      console.error("[error:coin/create] ENCRYPTION_KEY invalid, length:", ENCRYPTION_KEY?.length ?? 0);
      return res.status(500).json({ ok: false, error: "Server configuration error" });
    }
    const reserveKeypair = Keypair.generate();
    const reserveWalletAddress = reserveKeypair.publicKey.toBase58();
    const reserveWalletEncrypted = _encryptGCM(Buffer.from(reserveKeypair.secretKey), ENCRYPTION_KEY);

    let coin = {
      id: uid(),
      name, symbol, story, logo: finalLogo,
      metadataUri, creatorWallet, owner: creatorWallet,
      mintAddress,
      mintSignature,
      reserveWalletAddress,
      reserveWalletEncrypted,
      createdAt: nowMS(), status: "LIVE",
      totalSupply, curveSupply, curveSold: 0,
      vTokens: calcVirtualTokens(totalSupply, curveSupply),
      vSol: VIRTUAL_SOL,
      solReserve: 0, tokenReserve: curveSupply,
      holders: {}, volumeSol: 0, lastTradeAt: 0,
      priceSol: 0, priceUsd: 0, price: 0, lastPriceUsd: 0,
      mc: 0, ath: 0, creatorRewardsSol: 0, chart: [],
    };

    coin = recalcCoin(coin, { appendChart: false });
    coin = await saveCoin(coin);

    if (initialSol > 0) {
      const result = await runCoinLocked(coin.id, async (_tx) => {
        const latestRow = await getCoinRowById(coin.id);
        if (!latestRow) throw new Error("Coin not found after create");

        let latestCoin = mapDbCoinToApi(latestRow);
        const buyRes = ammBuy(latestCoin, creatorWallet, initialSol);

        if (!buyRes.ok) {
          // initial buy fail -> kata hua SOL wapas (_tx ke andar — atomic)
          await increaseRun(creatorWallet, initialSol, _tx);
          return { ok: false, error: buyRes.error || "Initial buy failed" };
        }

        latestCoin = recalcCoin(latestCoin, { appendChart: true, sideHint: "buy" });
        latestCoin = await saveCoin(latestCoin, _tx); // _tx ke andar — atomic

        // Side effects: separate connections, fire-and-forget
        await Promise.allSettled([
          distributeFeeDirect(latestCoin, creatorWallet, buyRes.feeSol),
          insertTransaction({
            id: uid(),
            type: "BUY",
            side: "BUY",
            coinId: latestCoin.id,
            wallet: creatorWallet,
            sol: initialSol,
            tokens: Math.max(0, safeNum(buyRes.tokensOut, 0)),
            fee: Math.max(0, safeNum(buyRes.feeSol, 0)),
            priceUsd: latestCoin.priceUsd,
          }),
          upsertCandlesForTrade(
            latestCoin.id,
            Math.max(0, safeNum(latestCoin?.priceUsd || latestCoin?.price || 0)),
            Math.max(0, safeNum(initialSol, 0))
          ),
        ]);

        return { ok: true, coin: latestCoin };
      });

      if (!result.ok) {
        return res.json(result);
      }

      coin = result.coin;
    }

    await writeAudit("COIN_CREATE", creatorWallet, initialSol, {
      coinId: coin?.id,
      meta: { name: coin?.name, symbol: coin?.symbol, initialSol },
    });

    const creatorLabel = String(coin?.symbol || coin?.name || "coin").trim();
    const creatorShort = creatorWallet.length > 8
      ? `${creatorWallet.slice(0, 4)}…${creatorWallet.slice(-4)}`
      : creatorWallet;
    notifyCreatorFollowers(
      creatorWallet,
      `${creatorShort} launched $${creatorLabel}`,
      { coinId: coin?.id || "", creatorWallet, type: "followed_creator_coin" }
    ).catch(() => {});

    console.log(`[coin/create] +${Date.now()-_t0}ms — sending response`);
    // On-chain mint: background — response block nahi karta, lekin mint ASAP DB me save hota hai
    const _coinId = coin.id;
    const _reserveWalletAddress = coin.reserveWalletAddress;
    const _reserveWalletEncrypted = reserveWalletEncrypted;
    setImmediate(async () => {
      try {
        const { createSPLToken } = await import("./solana/create-token.js");
        const { create_coin, Wallet } = await import("./solana/program.js");

        // Always mint from treasury — never fund custodial with SOL for mint fees.
        // Funding custodial was being picked up by deposit scanner as a user deposit
        // and wrongly inflated run_balance (~0.02 SOL per coin create).
        const payerKeypair = treasury;

        const { mintAddress: onchainMint } = await createSPLToken(payerKeypair);
        if (!onchainMint) {
          throw new Error("createSPLToken returned empty mint");
        }

        // CRITICAL: save mint immediately — create_coin failure must not drop mintAddress
        const latestRow = await getCoinRowById(_coinId);
        if (!latestRow) {
          throw new Error(`coin ${_coinId} missing after mint`);
        }
        const c = mapDbCoinToApi(latestRow);
        c.mintAddress = onchainMint;
        c.reserveWalletAddress = _reserveWalletAddress;
        c.reserveWalletEncrypted = _reserveWalletEncrypted;
        await saveCoin(c);
        console.log(`[onchain] mint saved for ${_coinId}: ${onchainMint}`);

        try {
          broadcast("coin:update", { id: _coinId, mintAddress: onchainMint });
        } catch {}

        try {
          // PDA seed must match trade path (coin.id). Symbol can collide / exceed seed rules.
          const onchainSig = await create_coin(new Wallet(payerKeypair), _coinId);
          const row2 = await getCoinRowById(_coinId);
          if (row2) {
            const c2 = mapDbCoinToApi(row2);
            c2.mintAddress = onchainMint;
            c2.mintSignature = onchainSig || c2.mintSignature || "";
            c2.reserveWalletAddress = _reserveWalletAddress;
            c2.reserveWalletEncrypted = _reserveWalletEncrypted;
            await saveCoin(c2);
            console.log(`[onchain] program create_coin ok for ${_coinId}: ${onchainSig}`);
          }
        } catch (progErr) {
          // Mint already saved — program step is best-effort for bonding-curve PDA
          console.error("[onchain] create_coin failed (mint kept):", progErr?.message || progErr);
        }
      } catch (e) {
        console.error("[onchain] coin mint failed:", e?.message || e);
      }
    });

    return res.json({
      ok: true,
      coin,
      imageUri,
      metadataUri,
      mintAddress,
      mintSignature,
    });

  } catch (e) {
    return serverErr(e, res, "coin/create");
  }
});

// -------------------- CREATOR FOLLOW --------------------
app.get("/creator/follow-status", async (req, res) => {
  const auth = await requireAuthWallet(req, res);
  if (!auth) return;
  try {
    await requireDb();
    const creatorWallet = String(req.query?.creator || req.query?.creatorWallet || "").trim();
    if (!creatorWallet) return res.json({ ok: false, error: "creator required" });
    if (creatorWallet === auth.wallet) {
      return res.json({ ok: true, following: false, self: true });
    }
    const rows = await sql`
      select 1 from creator_follows
      where follower_wallet = ${auth.wallet} and creator_wallet = ${creatorWallet}
      limit 1
    `;
    return res.json({ ok: true, following: Boolean(rows?.[0]), self: false });
  } catch (e) {
    return serverErr(e, res, "creator/follow-status");
  }
});

app.post("/creator/follow", async (req, res) => {
  const auth = await requireAuthWallet(req, res);
  if (!auth) return;
  try {
    await requireDb();
    const creatorWallet = String(req.body?.creatorWallet || req.body?.creator || "").trim();
    if (!creatorWallet) return res.json({ ok: false, error: "creator required" });
    if (creatorWallet === auth.wallet) {
      return res.json({ ok: false, error: "Cannot follow yourself" });
    }
    await sql`
      insert into creator_follows (follower_wallet, creator_wallet)
      values (${auth.wallet}, ${creatorWallet})
      on conflict do nothing
    `;
    return res.json({ ok: true, following: true });
  } catch (e) {
    return serverErr(e, res, "creator/follow");
  }
});

app.post("/creator/unfollow", async (req, res) => {
  const auth = await requireAuthWallet(req, res);
  if (!auth) return;
  try {
    await requireDb();
    const creatorWallet = String(req.body?.creatorWallet || req.body?.creator || "").trim();
    if (!creatorWallet) return res.json({ ok: false, error: "creator required" });
    await sql`
      delete from creator_follows
      where follower_wallet = ${auth.wallet} and creator_wallet = ${creatorWallet}
    `;
    return res.json({ ok: true, following: false });
  } catch (e) {
    return serverErr(e, res, "creator/unfollow");
  }
});

app.post("/referral/set", async (req, res) => {
  const auth = await requireAuthWallet(req, res);
  if (!auth) return;
  try {
    await requireDb();

    const wallet = auth.wallet; // Privy session se — req.body.wallet kabhi trust nahi hota
    const referrer = String(req.body?.referrer || "").trim();

    if (!referrer) {
      return res.json({ ok: false, error: "referrer required" });
    }
    if (wallet === referrer) {
      return res.json({ ok: false, error: "invalid referrer" });
    }
    if (referrer.length < 20) {
      return res.json({ ok: false, error: "invalid referrer" });
    }

    // Referrer profile exist karta hai verify karo (read-only, tx se pehle)
    await getProfile(referrer, true);

    const REFERRAL_RUN_BONUS = 50000;

    // Atomic: referrer set karo + RUN token bonus credit — dono ek hi tx mein
    // WHERE referrer IS NULL guarantee karta hai ke concurrent requests mein
    // sirf ek hi credit hoga, chahe kitni bhi parallel requests aayein
    const credited = await sql.begin(async (tx) => {
      const updated = await tx`
        update profiles
        set referrer = ${referrer}, updated_at = now()
        where wallet = ${wallet} and referrer is null
      `;
      if (updated.count === 0) return false; // already set tha

      await tx`
        update profiles
        set
          run_tokens = coalesce(run_tokens, 0) + ${REFERRAL_RUN_BONUS},
          updated_at = now()
        where wallet = ${referrer}
      `;
      return true;
    });

    if (!credited) {
      return res.json({ ok: false, error: "immutable: already set" });
    }

    // Cache invalidate karo taake agle read pe fresh data mile
    profileCache.del(wallet);
    profileCache.del(referrer);

    // Referral count sync (non-financial, tx ke baad safe hai)
    await syncReferralCount(referrer);

    notifyWallet(referrer, `Referral bonus: +${REFERRAL_RUN_BONUS.toLocaleString()} RUN`, {
      type: "referral_run_bonus",
      amount: REFERRAL_RUN_BONUS,
    });

    return res.json({ ok: true, referrer, runBonus: REFERRAL_RUN_BONUS });
  } catch (e) {
    return serverErr(e, res, "referral/set");
  }
});

async function doTrade(req, res, side, authWallet = null) {
  try {
    await requireDb();
    if (!TRADING_ENABLED) {
      return res.status(503).json({ ok: false, error: "Trading temporarily disabled" });
    }

    if (!authWallet) return res.status(401).json({ ok: false, error: "Authentication required" });
    const wallet = authWallet; // Privy session se — req.body.wallet kabhi trust nahi hota
    const coinId = String(req.body?.coinId || "").trim();
    const sol = Math.max(0, safeNum(req.body?.sol, 0) || safeNum(req.body?.solAmountLamports, 0) / 1e9);
    const tokens = Math.max(0, safeNum(req.body?.tokens, 0) || safeNum(req.body?.tokenAmountRaw, 0) / 1e6);
    const sideLower = String(side || "").trim().toLowerCase();

    if (!coinId) {
      return res.json({ ok: false, error: "coinId required" });
    }

    if (sideLower === "buy" && sol <= 0) {
      return res.json({ ok: false, error: "sol required" });
    }

    if (sideLower === "sell" && tokens <= 0) {
      return res.json({ ok: false, error: "tokens required" });
    }

    const result = await runCoinLocked(coinId, async (_tx) => {
      const row = await getCoinRowById(coinId);
      if (!row) return { ok: false, error: "token not found" };

      let coin = mapDbCoinToApi(row);
      const prevMc = Math.max(0, safeNum(coin.mc, 0));
      const alreadyNotified100k = Boolean(row.notified_mc_100k);
      let tradeResult = null;

      // trader ka profile (run_balance isi primary wallet ke under hai)
      const traderProfile = await getProfile(wallet, true);

      // On-chain trading only when flag is on AND the Anchor CoinState PDA exists.
      // If PDA is missing (mint still pending / create_coin failed), fall back to DB AMM
      // so deposit → create → buy keeps working on mainnet.
      let useOnchain = process.env.ONCHAIN_TRADING === "1";
      let preState = null;
      let _onchainBuy = null;
      let _onchainSell = null;
      let AnchorWallet = null;
      let LAMPS = 1_000_000_000;
      let getCoinState = null;

      if (useOnchain) {
        const mnemonic = traderProfile?.encrypted_mnemonic;
        if (!mnemonic) return { ok: false, error: "No custodial wallet — deposit SOL first" };

        ({
          buy: _onchainBuy, sell: _onchainSell,
          getCoinState, Wallet: AnchorWallet,
        } = await import("./solana/program.js"));
        ({ LAMPORTS_PER_SOL: LAMPS } = await import("@solana/web3.js"));

        try {
          preState = await getCoinState(coinId);
        } catch {
          console.warn(`[trade] on-chain CoinState missing for ${coinId} — using off-chain AMM`);
          useOnchain = false;
        }
      }

      if (useOnchain) {
        // ── ON-CHAIN PATH ───────────────────────────────────────────────────
        // Backend signs with the custodial keypair — same UX, same API contract.
        const mnemonic = traderProfile?.encrypted_mnemonic;
        const custodialKeypair = await getCustodialKeypairFromMnemonic(mnemonic);
        const anchorWallet     = new AnchorWallet(custodialKeypair);

        if (sideLower === "buy") {
          try { await decreaseRun(wallet, sol, _tx); } catch { return { ok: false, error: "Insufficient balance" }; }
          try {
            await _onchainBuy(anchorWallet, coinId, BigInt(Math.floor(sol * LAMPS)));
          } catch (e) {
            await increaseRun(wallet, sol, _tx);
            return { ok: false, error: e?.error?.errorMessage || e?.message || "On-chain buy failed" };
          }
        } else if (sideLower === "sell") {
          try {
            await _onchainSell(anchorWallet, coinId, BigInt(Math.floor(tokens)));
          } catch (e) {
            return { ok: false, error: e?.error?.errorMessage || e?.message || "On-chain sell failed" };
          }
        } else {
          return { ok: false, error: "invalid side" };
        }

        // Post-trade on-chain state — source of truth
        const postState = await getCoinState(coinId);

        const solReservePre  = Number(preState.solReserve)  / LAMPS;
        const solReservePost = Number(postState.solReserve) / LAMPS;
        const tokenSoldPre   = Number(preState.tokenSupply);
        const tokenSoldPost  = Number(postState.tokenSupply);
        const totalSupply    = Number(postState.totalSupply);

        // Sync DB coin reserves from chain after trade
        const curveSupply  = saleSupplyFromTotal(totalSupply);
        coin.solReserve    = solReservePost;
        coin.tokenReserve  = Math.max(0, curveSupply - tokenSoldPost);
        coin.vSol          = solReservePost + VIRTUAL_SOL;
        coin.vTokens       = calcVirtualTokens(totalSupply, curveSupply, coin.vTokens);

        coin.holders = asObj(coin.holders, {});
        if (sideLower === "buy") {
          const tokensOut = Math.max(0, tokenSoldPost - tokenSoldPre);
          coin.holders[wallet] = Math.max(0, safeNum(coin.holders[wallet], 0)) + tokensOut;
          const { fee }   = applyFee(sol);
          tradeResult = { ok: true, tokensOut, feeSol: fee, netSol: sol - fee };
        } else {
          const solOutGross = Math.max(0, solReservePre - solReservePost);
          const { fee }     = applyFee(solOutGross);
          const solOutNet   = Math.max(0, solOutGross - fee);
          const tokensIn    = Math.abs(tokenSoldPre - tokenSoldPost);
          coin.holders[wallet] = Math.max(0, safeNum(coin.holders[wallet], 0) - tokensIn);
          if ((coin.holders[wallet] || 0) <= 0.0000001) delete coin.holders[wallet];
          tradeResult = {
            ok: true,
            solOutNet,
            solOutGross,
            feeSol: fee,
            tokensIn,
          };
          await increaseRun(wallet, solOutNet, _tx);
        }

      } else {
        // ── OFF-CHAIN PATH ──────────────────────────────────────
        if (sideLower === "buy") {
          // BUY: pehle run_balance se SOL kato — _tx ke andar (atomic with advisory lock)
          try {
            await decreaseRun(wallet, sol, _tx);
          } catch (balErr) {
            return { ok: false, error: "Insufficient balance" };
          }

          tradeResult = ammBuy(coin, wallet, sol);

          if (!tradeResult?.ok) {
            // trade fail -> kata hua SOL wapas — same _tx, rollback sab kuch
            await increaseRun(wallet, sol, _tx);
            return { ok: false, error: tradeResult?.error || "Trade failed" };
          }
        } else if (sideLower === "sell") {
          tradeResult = ammSellByTokensIn(coin, wallet, tokens);

          if (!tradeResult?.ok) {
            return { ok: false, error: tradeResult?.error || "Trade failed" };
          }

          // SELL: net SOL credit — _tx ke andar (atomic with advisory lock)
          const netSol = Math.max(0, safeNum(tradeResult.solOutNet, 0));
          await increaseRun(wallet, netSol, _tx);
        } else {
          return { ok: false, error: "invalid side" };
        }
      }

      const tradeFeeSol = Math.max(0, safeNum(tradeResult.feeSol, 0));
      const creatorWallet = String(coin?.creatorWallet || coin?.owner || "").trim();
      if (creatorWallet && tradeFeeSol > 0) {
        coin.creatorRewardsSol = Math.max(
          0,
          safeNum(coin.creatorRewardsSol, 0) + tradeFeeSol * (CREATOR_PCT_OF_FEE / 100)
        );
      }

      coin = recalcCoin(coin, { appendChart: true, sideHint: sideLower });
      const newMc = Math.max(0, safeNum(coin.mc, 0));
      const crossed100k = !alreadyNotified100k && prevMc < 100000 && newMc >= 100000;
      coin = await saveCoin(coin, _tx); // _tx ke andar — atomic with advisory lock
      if (crossed100k) {
        await _tx`
          update coins set notified_mc_100k = true where id = ${coin.id}
        `;
        coinCache.del(coin.id);
      }

      const txPayload = {
        id: uid(),
        type: sideLower.toUpperCase(),
        side: sideLower.toUpperCase(),
        coinId: coin.id,
        wallet,
        sol: sideLower === "buy" ? Math.max(0, sol) : Math.max(0, safeNum(tradeResult.solOutNet, 0)),
        tokens: sideLower === "buy"
          ? Math.max(0, safeNum(tradeResult.tokensOut, 0))
          : Math.max(0, safeNum(tradeResult.tokensIn, 0)),
        fee: tradeFeeSol,
        priceUsd: coin.priceUsd,
      };

      const candleVolumeSol = sideLower === "buy"
        ? Math.max(0, safeNum(sol, 0))
        : Math.max(0, safeNum(tradeResult?.solOutGross || tradeResult?.solOutNet || 0, 0));

      // _tx ke andar: holdings atomic update (advisory lock ke saath)
      await upsertHolding(wallet, coin.id, "set", Math.max(0, safeNum(coin?.holders?.[wallet], 0)), _tx);

      // Side effects AFTER lock — candles/fees must not block the buy/sell response.
      return {
        ok: true,
        coin,
        crossed100k,
        tokens: sideLower === "buy"
          ? Math.max(0, safeNum(tradeResult.tokensOut, 0))
          : Math.max(0, safeNum(tradeResult.tokensIn, 0)),
        fee: Math.max(0, safeNum(tradeResult.feeSol, 0)),
        netSol: sideLower === "buy"
          ? Math.max(0, safeNum(tradeResult.netSol, 0))
          : Math.max(0, safeNum(tradeResult.solOutNet, 0)),
        grossSol: sideLower === "buy"
          ? Math.max(0, sol)
          : Math.max(0, safeNum(tradeResult.solOutGross, 0)),
        _postTrade: {
          sideLower,
          wallet,
          sol,
          tradeFeeSol,
          candleVolumeSol,
          txPayload,
          tradeResult,
        },
      };
    });

    if (result?.ok && result?._postTrade) {
      const pt = result._postTrade;
      const sideCoin = { ...result.coin };
      // Fire-and-forget after response path is ready — do not await before res.json
      Promise.allSettled([
        upsertCandlesForTrade(
          result.coin.id,
          Math.max(0.00000001, safeNum(result.coin?.priceUsd || result.coin?.price || 0, 0.00000001)),
          pt.candleVolumeSol
        ),
        distributeFeeDirect(sideCoin, pt.wallet, pt.tradeFeeSol),
        insertTransaction(pt.txPayload),
        writeAudit(pt.sideLower === "buy" ? "BUY" : "SELL", pt.wallet,
          pt.sideLower === "buy" ? pt.sol : safeNum(pt.tradeResult.solOutNet, 0),
          { coinId: result.coin.id, meta: { fee: pt.tradeFeeSol, tokens: pt.txPayload.tokens } }
        ),
      ]).then((sideEffects) => {
        const failed = sideEffects.find((x) => x.status === "rejected");
        if (failed) console.log("trade side-effect error:", failed.reason?.message || failed.reason);
      }).catch(() => {});
      delete result._postTrade;
    }

    if (result?.ok && result?.crossed100k) {
      const sym = String(result.coin?.symbol || result.coin?.name || "Coin").trim();
      notifyGlobal(`$${sym} crossed $100K market cap`, {
        type: "mc_milestone",
        coinId: result.coin?.id || "",
        mc: result.coin?.mc || 0,
      });
    }

    return res.json(result);
  } catch (e) {
    return serverErr(e, res, "trade");
  }
}

app.post("/coin/buy", tradeLimiter, async (req, res) => {
  const auth = await requireAuthWallet(req, res);
  if (!auth) return;
  return doTrade(req, res, "buy", auth.wallet);
});
app.post("/coin/sell", tradeLimiter, async (req, res) => {
  const auth = await requireAuthWallet(req, res);
  if (!auth) return;
  return doTrade(req, res, "sell", auth.wallet);
});

app.post("/claim", claimLimiter, async (req, res) => {
  const auth = await requireAuthWallet(req, res);
  if (!auth) return;
  try {
    await requireDb();

    const wallet = auth.wallet; // Privy session se — req.body.wallet kabhi trust nahi hota
    const kind = String(req.body?.kind || "").trim().toUpperCase();

    const col =
      kind === "CREATOR" ? "creator_rewards" :
      kind === "REF"     ? "referral_rewards" :
      kind === "OWNER"   ? "owner_rewards" : null;

    if (!col) return res.status(400).json({ error: "Unsupported kind" });

    // ATOMIC: ek hi DB transaction mein rewards zero karo + run_balance badhao
    // Double-claim impossible — FOR UPDATE lock lagta hai
    const result = await sql.begin(async (tx) => {
      const rows = await tx`
        select ${tx(col)}, run_balance
        from profiles
        where wallet = ${wallet}
        for update
      `;
      if (!rows?.[0]) throw new Error("Profile not found");

      const amount = Math.max(0, safeNum(rows[0][col], 0));
      if (amount <= 0) return { amount: 0 };

      await tx`
        update profiles
        set
          ${tx(col)} = 0,
          run_balance = run_balance + ${amount},
          updated_at = now()
        where wallet = ${wallet}
      `;
      return { amount };
    });

    if (result.amount > 0) {
      await writeAudit(`CLAIM_${kind}`, wallet, result.amount);
      broadcast("portfolio:update", {
        wallet,
        type: "CLAIM",
        kind,
        amount: result.amount,
      });
      broadcast(kind === "CREATOR" ? "creator:update" : kind === "REF" ? "referral:update" : "owner:update", {
        wallet,
        type: "CLAIM",
        kind,
        amount: result.amount,
      });
      broadcast("notification:new", {
        wallet,
        type: "claim",
        title: `Claimed ${result.amount.toFixed(6)} SOL`,
        kind,
      });
    }

    return res.json({ ok: true, amount: result.amount });
  } catch (e) {
    return serverErr(e, res, "claim");
  }
});

// -------------------- BACKUP PHRASE (AUTH REQUIRED) --------------------
// Sirf logged-in malik apna mnemonic dekh sake. Privy auth config zaroori (upar dekho).
// NOTE: ye tabhi mehfooz hai jab requireAuth ka userId us wallet se match ho.
// Niche ek basic match diya hai (Privy userId == profile ka linked id). Ise apne
// Privy setup ke mutabiq adjust karna; bina match ke kabhi mnemonic mat do.

app.post("/wallet/reveal-mnemonic", mnemonicLimiter, async (req, res) => {
  const auth = await requireAuthWallet(req, res);
  if (!auth) return;
  try {
    const wallet = auth.wallet; // Privy session se — req.body.wallet kabhi trust nahi hota

    // SECURITY: token ka user isi wallet ka malik hai ye verify karo.
    // Yahan apne Privy linkage ke mutabiq check lagao (e.g. profile me privy_user_id save
    // karo aur claims.userId se match karo). Filhaal sakht: agar match logic set nahi to mana.
    const profile = await getProfile(wallet, false);
    if (!profile || !profile.encrypted_mnemonic) {
      return res.status(404).json({ ok: false, error: "no wallet" });
    }

    // TODO: yahan `claims.userId === profile.privy_user_id` jaisa check lazmi lagao.
    // Bina us check ke ye line uncomment mat karna:
    // const kp = await getCustodialKeypairFromMnemonic(profile.encrypted_mnemonic);

    // Mnemonic decrypt karke 12 words bhejna — sirf verified owner ko.
    // (Auth+ownership match confirm hone tak ye disabled rakha hai.)
    return res.status(501).json({
      ok: false,
      error: "ownership check pending: apne Privy userId<->wallet match ka code laga kar enable karo",
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "reveal failed" });
  }
});

// -------------------- PROFILE ENDPOINT --------------------
app.get("/profile/:wallet", async (req, res) => {
  const auth = await requireAuthWallet(req, res);
  if (!auth) return;
  try {
    await requireDb();

    const wallet = String(req.params.wallet || "").trim();
    if (!wallet) return res.json({ ok: false, error: "wallet required" });

    // Horizontal privilege escalation prevention — only own profile allowed
    if (auth.wallet !== wallet) {
      return res.status(403).json({ ok: false, error: "Access denied" });
    }

    // Step 1: profile (custodial wallet banane ke liye zaroori hai pehle)
    const p = await getProfile(wallet, true);
    const profileRow = await sql`select wallet_address from profiles where wallet = ${String(wallet)} limit 1`;
const debugAddr = profileRow?.[0]?.wallet_address;

const custodialWallet = String(profileRow?.[0]?.wallet_address || "").trim();


    // Step 2: baaki sab queries PARALLEL chalao (8 queries ek saath)
    const [
      referralCountRows,
      creationRows,
      txArr,
      holdingBaseRows,
      deposits,
      withdrawals,
      referralRows,
    ] = await Promise.all([
      sql`select count(*)::int as count from profiles where referrer = ${wallet}`,
      sql`select * from coins where creator_wallet = ${wallet} order by created_at desc limit 100`,
      sql`select * from transactions where wallet = ${wallet} order by created_at desc limit ${PROFILE_TX_LIMIT}`,
      sql`select wallet, coin_id, tokens, updated_at from holdings where wallet = ${wallet} and tokens > 0 order by updated_at desc limit 200`,
      sql`select * from deposits where wallet = ${custodialWallet || wallet} order by created_at desc limit 50`,
      sql`select * from withdrawals where wallet = ${wallet} order by created_at desc limit 50`,
      sql`select wallet, created_at from profiles where referrer = ${wallet} order by created_at desc limit 25`,
    ]);

    const referralCount = safeNum(referralCountRows?.[0]?.count, 0);

    // referral count update (background — response wait nahi karti)
    if (safeNum(p.referral_count, 0) !== referralCount) {
      patchProfile(wallet, { referral_count: referralCount }).catch(() => {});
    }

    const myCreations = Array.isArray(creationRows)
      ? creationRows.map(mapDbCoinToApi).filter(Boolean) : [];

    const lastTx = (Array.isArray(txArr) ? txArr : []).map((t) => ({
      id: t.id,
      coinId: t.coinId || t.coin_id,
      side: String(t.type || "TX").toUpperCase(),
      type: String(t.type || "TX").toUpperCase(),
      sol: safeNum(t.sol, 0),
      tokens: safeNum(t.tokens, 0),
      fee: safeNum(t.fee, 0),
      ts: t.created_at ? new Date(t.created_at).getTime() : nowMS(),
      t: t.created_at ? new Date(t.created_at).getTime() : nowMS(),
      wallet: t.wallet,
    }));

    // holdings: coin detail parallel fetch
    const holdingCoinIds = Array.from(
      new Set((holdingBaseRows || []).map((r) => String(r.coin_id || "").trim()).filter(Boolean))
    );
    const holdingRows = holdingCoinIds.length
      ? await sql`select * from coins where id = any(${holdingCoinIds})`
      : [];

    const holdingMap = new Map(
      (holdingBaseRows || []).map((r) => [String(r.coin_id || "").trim(), r])
    );

    const holdings = holdingRows
      .map(mapDbCoinToApi)
      .filter(Boolean)
      .map((c) => {
        const h = holdingMap.get(String(c.id)) || null;
        const amount = Math.max(0, safeNum(h?.tokens, 0));
        if (amount <= 0) return null;
        return {
          coinId: c.id,
          symbol: c.symbol,
          name: c.name,
          logo: c.logo,
          amount,
          totalSupply: Math.max(1, safeNum(c.totalSupply, TOTAL_SUPPLY)),
          pct: Math.max(1, safeNum(c.totalSupply, TOTAL_SUPPLY)) > 0
            ? (amount / Math.max(1, safeNum(c.totalSupply, TOTAL_SUPPLY))) * 100 : 0,
          lastAt: h?.updated_at ? new Date(h.updated_at).getTime() : safeNum(c.lastTradeAt, 0),
        };
      })
      .filter(Boolean)
      .sort((a, b) => safeNum(b.lastAt, 0) - safeNum(a.lastAt, 0));

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
       wallet: wallet,
custodialWallet: custodialWallet,
depositAddress: custodialWallet,
        primaryWallet: wallet,
        connectedWallet: wallet,
        runBalance: Math.max(0, safeNum(p?.run_balance, 0)),
        runTokens:  Math.max(0, safeNum(p?.run_tokens, 0)),
        solBalance: Math.max(0, safeNum(p?.sol_balance, 0)),
        referrer: p?.referrer || "",
        referralCode: p?.referral_code || wallet.slice(0, 6),
        referralCount,
        referralRewardsSol: Math.max(0, safeNum(p?.referral_rewards, 0)),
        creatorRewardsSol: Math.max(0, safeNum(p?.creator_rewards, 0)),
        ownerRewardsSol: Math.max(0, safeNum(p?.owner_rewards, 0)),
        referralRewards: { totalSol: Math.max(0, safeNum(p?.referral_rewards, 0)) },
        ownerRewards: { totalSol: Math.max(0, safeNum(p?.owner_rewards, 0)) },
        rewards: {
          totalSol: Math.max(0, safeNum(p?.creator_rewards, 0)),
          byCoin: rewardsByCoin,
        },
        holdings,
        txs: lastTx,
        creations: myCreations,
        depositHistory: deposits || [],
        withdrawHistory: withdrawals || [],
        referralActivity: (referralRows || []).map((r) => ({
          wallet: r.wallet,
          createdAt: r.created_at,
          type: "JOIN",
        })),
      },
      myCreations,
      lastTx,
      feePct: FEE_PCT,
    });
  } catch (e) {
    return serverErr(e, res, "profile");
  }
});

// -------------------- API v1 EXPLICIT FALLBACK ROUTES --------------------
// Middleware near the top of this file normally rewrites /api/v1/* → legacy paths.
// These explicit handlers are a guaranteed fallback: they only fire if the URL-rewrite
// middleware did not match (e.g. not yet deployed, or prod-specific quirk).
// Strategy: reset req.url to the legacy path, reset req.params, then call app.handle()
// so the existing route handler (and its limiters) process the request normally.
// No infinite loop risk — the rewritten URL never starts with /api/v1/.

function _v1Fwd(getLegacyPath) {
  return function (req, res) {
    const legacy = typeof getLegacyPath === "function" ? getLegacyPath(req) : getLegacyPath;
    const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    req.url = legacy + qs;
    req.params = {};
    app.handle(req, res, () => res.status(404).json({ ok: false, error: "Not found" }));
  };
}

// candles MUST be before coins/:id so Express checks the more-specific pattern first
app.get("/api/v1/market/coins/:id/candles",  _v1Fwd((r) => `/coin/${r.params.id}/candles`));
app.get("/api/v1/market/coins/:id",          _v1Fwd((r) => `/coin/${r.params.id}`));
app.get("/api/v1/market/coins",              _v1Fwd("/coin/list"));
app.get("/api/v1/market/sol-price",          _v1Fwd("/sol-price"));
app.get("/api/v1/profile/:wallet",           _v1Fwd((r) => `/profile/${r.params.wallet}`));
app.get("/api/v1/wallet/:wallet/balance",    _v1Fwd((r) => `/balance/${r.params.wallet}`));
app.post("/api/v1/trade/buy",                _v1Fwd("/coin/buy"));
app.post("/api/v1/trade/sell",               _v1Fwd("/coin/sell"));
app.post("/api/v1/wallet/withdraw",          _v1Fwd("/withdraw"));
app.post("/api/v1/wallet/reveal-mnemonic",   _v1Fwd("/wallet/reveal-mnemonic"));
app.post("/api/v1/rewards/claim",            _v1Fwd("/claim"));
app.post("/api/v1/referral/bind",            _v1Fwd("/referral/set"));
app.post("/api/v1/coins",                    _v1Fwd("/coin/create"));

// -------------------- SECRETS VALIDATION --------------------
function validateSecrets() {
  const errors = [];

  // ENCRYPTION_KEY: custodial mnemonics isi se encrypt/decrypt hote hain.
  // 32 chars strict hain — AES-256-CBC ka key size.
  const encKey = String(process.env.ENCRYPTION_KEY || "");
  if (!encKey) {
    errors.push("ENCRYPTION_KEY is not set (must be exactly 32 characters)");
  } else if (encKey.length !== 32) {
    errors.push(`ENCRYPTION_KEY must be exactly 32 characters (got ${encKey.length})`);
  }

  // TREASURY_PRIVATE_KEY: treasury.js already decode karta hai module load pe,
  // lekin agar kisi wajah se woh silent fail kare toh yahan explicit check.
  const treasuryRaw = String(process.env.TREASURY_PRIVATE_KEY || "").trim();
  if (!treasuryRaw) {
    errors.push("TREASURY_PRIVATE_KEY is not set");
  } else {
    // treasury module ne load karte waqt keypair banaya tha — verify karo accessible hai
    try {
      const pubKey = treasury.publicKey.toBase58();
      if (!pubKey) throw new Error("empty pubkey");
    } catch (e) {
      errors.push(`TREASURY_PRIVATE_KEY loaded but unusable: ${e.message}`);
    }
  }

  if (errors.length > 0) {
    console.error("FATAL — server cannot start safely. Fix these env vars:");
    for (const e of errors) console.error("  [x] " + e);
    process.exit(1);
  }

  console.log(`Secrets OK — treasury: ${treasury.publicKey.toBase58().slice(0, 8)}...`);
  console.log(`Solana network: ${SOLANA_NETWORK} | RPC: ${SOLANA_RPC}`);
}

// -------------------- STARTUP RECONCILIATION --------------------
// Server restart ke baad status='pending' withdrawals check karo.
// app.listen abhi nahi hua — koi naya request process nahi ho raha.
async function reconcilePendingWithdrawals() {
  if (!sql) return;
  // Solana blockhash ~150 slots × ~400ms ≈ 60s valid rehta hai.
  // 2 min conservative threshold — is se purana record "definitely expired" consider hoga.
  const BLOCKHASH_EXPIRY_MS = 2 * 60 * 1000;

  try {
    const rows = await sql`
      select id, wallet, amount, tx_hash, created_at
      from withdrawals
      where status = 'pending'
    `;
    if (!rows?.length) {
      console.log("reconcile: no pending withdrawals");
      return;
    }

    console.log(`reconcile: ${rows.length} pending withdrawal(s) found`);

    for (const wd of rows) {
      const id     = String(wd.id     || "");
      const wallet = String(wd.wallet || "");
      const amt    = Math.max(0, safeNum(wd.amount, 0));
      const txHash = String(wd.tx_hash || "").trim();
      const ageMs  = Date.now() - new Date(wd.created_at).getTime();

      try {
        // CASE 1: tx_hash nahi — TX kabhi bheja hi nahi gaya (crash before Solana send)
        if (!txHash) {
          await sql`update withdrawals set status = 'failed' where id = ${id}`;
          if (amt > 0) await increaseRun(wallet, amt);
          await writeAudit("WITHDRAW_RECONCILED_FAILED", wallet, amt, {
            meta: { withdrawalId: id, reason: "no_tx_hash" },
          });
          console.log(`reconcile: ${id} — no tx_hash, failed, ${amt} SOL restored`);
          continue;
        }

        // CASE 2–4: Solana pe signature check karo
        let sigStatus;
        try {
          sigStatus = await connection.getSignatureStatus(txHash, {
            searchTransactionHistory: true,
          });
        } catch (rpcErr) {
          // CASE 2: RPC error — network/timeout issue, result uncertain.
          // Balance mat chhuao — agli startup pe phir check hoga.
          await writeAudit("WITHDRAW_RECONCILE_INCONCLUSIVE", wallet, amt, {
            meta: { withdrawalId: id, txHash, reason: "rpc_error", error: rpcErr?.message },
          });
          console.log(`reconcile: ${id} — RPC error (${rpcErr?.message}), leaving pending`);
          continue;
        }

        if (sigStatus?.value === null) {
          // Signature history mein nahi mili
          if (ageMs < BLOCKHASH_EXPIRY_MS) {
            // CASE 3a: bahut naya record — blockhash abhi bhi valid ho sakta hai.
            // Certain nahi — pending rehne do, agli startup pe dobara check.
            await writeAudit("WITHDRAW_RECONCILE_INCONCLUSIVE", wallet, amt, {
              meta: { withdrawalId: id, txHash, reason: "not_found_too_recent", ageMs },
            });
            console.log(`reconcile: ${id} — not found but only ${Math.round(ageMs / 1000)}s old, leaving pending`);
          } else {
            // CASE 3b: purana record + history mein nahi = blockhash expire, TX gaya nahi.
            // Pakka fail — balance restore karo.
            await sql`update withdrawals set status = 'failed' where id = ${id}`;
            if (amt > 0) await increaseRun(wallet, amt);
            await writeAudit("WITHDRAW_RECONCILED_FAILED", wallet, amt, {
              meta: { withdrawalId: id, txHash, reason: "blockhash_expired_not_found" },
            });
            console.log(`reconcile: ${id} — ${Math.round(ageMs / 1000)}s old + not found, failed, ${amt} SOL restored`);
          }
        } else if (sigStatus?.value?.err !== null) {
          // CASE 4a: TX chain pe mila lekin on-chain error (e.g. InstructionError).
          // Pakka fail — balance restore karo.
          await sql`update withdrawals set status = 'failed' where id = ${id}`;
          if (amt > 0) await increaseRun(wallet, amt);
          await writeAudit("WITHDRAW_RECONCILED_FAILED", wallet, amt, {
            meta: { withdrawalId: id, txHash, reason: "on_chain_error", err: sigStatus.value.err },
          });
          console.log(`reconcile: ${id} — on-chain error, failed, ${amt} SOL restored`);
        } else {
          // CASE 4b: value !== null, err === null — TX confirmed.
          // Balance already kat chuka tha — sirf record update karo.
          await sql`update withdrawals set status = 'confirmed' where id = ${id}`;
          await writeAudit("WITHDRAW_RECONCILED_CONFIRMED", wallet, amt, {
            meta: { withdrawalId: id, txHash },
          });
          console.log(`reconcile: ${id} — on-chain confirmed`);
        }
      } catch (wdErr) {
        // Ek withdrawal ka error baaki records ko block na kare
        console.error(`reconcile: error on withdrawal ${id}:`, wdErr?.message || wdErr);
      }
    }
  } catch (e) {
    console.error("reconcilePendingWithdrawals error:", e?.message || e);
  }
}

// -------------------- START --------------------
validateSecrets();

process.on("SIGINT", async () => {
  process.exit(0);
});

process.on("SIGTERM", async () => {
  process.exit(0);
});

// ---- F-03: Startup CBC detection — warn if legacy AES-256-CBC mnemonics exist ----
// Run: node backend/scripts/migrate-cbc-to-gcm.mjs --live  to migrate.
async function detectLegacyCBC() {
  try {
    if (!sql) return;
    const [profileRows, coinRows] = await Promise.all([
      sql`SELECT COUNT(*)::int AS cnt FROM profiles
          WHERE encrypted_mnemonic IS NOT NULL
            AND encrypted_mnemonic != ''
            AND encrypted_mnemonic NOT LIKE 'gcm:%'`,
      sql`SELECT COUNT(*)::int AS cnt FROM coins
          WHERE reserve_wallet_encrypted IS NOT NULL
            AND reserve_wallet_encrypted != ''
            AND reserve_wallet_encrypted NOT LIKE 'gcm:%'`,
    ]);
    const p = profileRows?.[0]?.cnt ?? 0;
    const c = coinRows?.[0]?.cnt ?? 0;
    if (p > 0 || c > 0) {
      console.warn(
        `[SECURITY WARNING] Legacy AES-256-CBC mnemonics detected: ${p} profiles, ${c} coins. ` +
        `Run: node backend/scripts/migrate-cbc-to-gcm.mjs --live`
      );
    }
  } catch (e) {
    console.error("[detectLegacyCBC] check failed:", e?.message || e);
  }
}

// -------------------- HTTP + WEBSOCKET SERVER --------------------
const server = app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
  ensureSchema()
    .then(async () => {
      console.log("Schema ready");
      await detectLegacyCBC();
    })
    .catch(err => console.error("Schema error:", err));
  reconcilePendingWithdrawals().catch(err =>
    console.error("Reconcile error:", err)
  );
  reconcileInternalDeposits().catch(err =>
    console.error("Internal deposit reconcile error:", err)
  );
  setInterval(async () => {
    try {
      // Paginate through ALL custodial wallets so none are skipped.
      // Each scanWalletDeposits call is cursor-based (lastSignature), so scanning
      // a wallet that received no new deposits is an RPC no-op.
      let offset = 0;
      const batchSize = 200;
      for (;;) {
        const rows = await sql`
          select wallet_address from profiles
          where wallet_address is not null
            and wallet_address != ''
          order by wallet_address
          limit ${batchSize} offset ${offset}
        `;
        if (!rows?.length) break;
        for (const row of rows) {
          const wallet = String(row?.wallet_address || "").trim();
          if (!wallet) continue;
          try {
            await scanWalletDeposits(wallet);
          } catch (walletErr) {
            console.log(`deposit scanner wallet error ${wallet}:`, walletErr?.message || walletErr);
          }
        }
        if (rows.length < batchSize) break; // last page
        offset += batchSize;
      }
    } catch (e) {
      console.log("deposit scanner error:", e?.message || e);
    }
  }, 180000);
});

const wss = new WebSocketServer({ server });
const wsClients = new Set();

wss.on("connection", (ws) => {
  wsClients.add(ws);

  ws.on("close", () => {
    wsClients.delete(ws);
  });
});
