/**
 * Stealth bootstrap activity — synthetic coins + DB-only trades.
 * Public APIs must never expose bootstrap flags. Kill via BOOTSTRAP_ACTIVITY≠1.
 */

import { Keypair } from "@solana/web3.js";
import { generateCoinLogoDataUrl } from "./logo.js";
import { generateCoinIdentity } from "./names.js";

function envFlag(name, def = false) {
  const v = String(process.env[name] ?? "").trim().toLowerCase();
  if (!v) return def;
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function envNum(name, def, min, max) {
  const n = Number(process.env[name]);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function jitterMs(base, spread = 0.35) {
  return Math.max(250, Math.floor(base * (1 - spread + Math.random() * spread * 2)));
}

/**
 * @param {object} deps — injected from server.js (keeps AMM/DB single-sourced)
 */
export function createBootstrapController(deps) {
  const {
    sql,
    uid,
    safeNum,
    nowMS,
    Keypair: Kp = Keypair,
    VIRTUAL_SOL,
    CREATOR_PCT_OF_FEE = 40,
    getSupplyFromInitialSol,
    saleSupplyFromTotal,
    calcVirtualTokens,
    recalcCoin,
    saveCoin,
    mapDbCoinToApi,
    getCoinRowById,
    runCoinLocked,
    loadHoldersMap,
    ammBuy,
    ammSellByTokensIn,
    decreaseRun,
    increaseRun,
    upsertHolding,
    insertTransaction,
    upsertCandlesForTrade,
    candlePriceUsdFromCoin,
    distributeFeeDirect,
    writeAudit,
    tradeSideQueue,
    uploadLogoToIPFS,
    _encryptGCM,
    invalidateCoinCache,
    RUN_COIN_ID,
  } = deps;

  let stopped = false;
  let tickTimer = null;
  let running = false;
  const usedSymbols = new Set();
  /** @type {Map<string, number>} coinId -> nextTradeAt */
  const tradeSchedule = new Map();
  let hourBucket = Math.floor(Date.now() / 3_600_000);
  let coinsThisHour = 0;

  const cfg = () => ({
    enabled: envFlag("BOOTSTRAP_ACTIVITY", false),
    maxCoinsPerHour: envNum("BOOTSTRAP_MAX_COINS_PER_HOUR", 5, 0, 30),
    shadowPool: envNum("BOOTSTRAP_SHADOW_POOL", 64, 8, 400),
    walletSol: envNum("BOOTSTRAP_WALLET_SOL", 1.5, 0.05, 50),
    pauseRealTrades24h: envNum("BOOTSTRAP_PAUSE_REAL_TRADES_24H", 40, 1, 100000),
    onlyNewCoins: envFlag("BOOTSTRAP_ONLY_NEW_COINS", true),
    minTradeSol: envNum("BOOTSTRAP_MIN_TRADE_SOL", 0.0015, 0.0005, 1),
    maxTradeSol: envNum("BOOTSTRAP_MAX_TRADE_SOL", 0.028, 0.002, 2),
    // Creator initial buy = liquidity seed (synthetic SOL balance)
    seedBuyMinSol: envNum("BOOTSTRAP_SEED_BUY_MIN_SOL", 5, 1, 100),
    seedBuyMaxSol: envNum("BOOTSTRAP_SEED_BUY_MAX_SOL", 25, 2, 200),
  });

  async function ensureSchemaExtras() {
    await sql`alter table profiles add column if not exists is_bootstrap boolean not null default false`;
    await sql`alter table coins add column if not exists is_bootstrap boolean not null default false`;
    await sql`alter table coins add column if not exists bootstrap_paused boolean not null default false`;
    await sql`
      create table if not exists bootstrap_events (
        id text primary key,
        kind text not null,
        coin_id text,
        wallet text,
        meta jsonb default '{}'::jsonb,
        created_at timestamptz not null default now()
      )
    `;
    await sql`create index if not exists bootstrap_events_created_idx on bootstrap_events (created_at desc)`;
    await sql`create index if not exists profiles_is_bootstrap_idx on profiles (is_bootstrap) where is_bootstrap = true`;
    await sql`create index if not exists coins_is_bootstrap_idx on coins (is_bootstrap) where is_bootstrap = true`;
  }

  async function logEvent(kind, coinId, wallet, meta = {}) {
    try {
      await sql`
        insert into bootstrap_events (id, kind, coin_id, wallet, meta, created_at)
        values (
          ${uid()},
          ${String(kind)},
          ${coinId || null},
          ${wallet || null},
          ${JSON.stringify(meta || {})},
          now()
        )
      `;
    } catch (e) {
      console.log("[bootstrap] event log error:", e?.message || e);
    }
  }

  async function ensureShadowPool(n) {
    const rows = await sql`
      select wallet from profiles where is_bootstrap = true limit ${n}
    `;
    const have = Array.isArray(rows) ? rows.length : 0;
    const need = Math.max(0, n - have);
    if (need <= 0) return;

    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
    for (let i = 0; i < need; i++) {
      const kp = Kp.generate();
      const wallet = kp.publicKey.toBase58();
      // No custodial mnemonic — these never withdraw on-chain.
      // Synthetic spendable balance only (run_balance).
      const bal = Number((cfg().walletSol * (0.55 + Math.random() * 0.9)).toFixed(6));
      try {
        await sql`
          insert into profiles (
            wallet, wallet_address, encrypted_mnemonic,
            run_balance, run_tokens, referrer, referral_code, referral_count,
            is_bootstrap, created_at, updated_at
          )
          values (
            ${wallet}, ${wallet}, ${""},
            ${bal}, ${0}, ${""}, ${wallet.slice(0, 6)}, ${0},
            ${true}, now(), now()
          )
          on conflict (wallet) do nothing
        `;
      } catch (e) {
        console.log("[bootstrap] shadow wallet insert failed:", e?.message || e);
      }
      void ENCRYPTION_KEY; // reserved for future if custodial needed
    }
    await logEvent("shadow_pool_grow", null, null, { added: need, target: n });
  }

  async function pickShadowWallets(count) {
    const rows = await sql`
      select wallet, run_balance
      from profiles
      where is_bootstrap = true
      order by random()
      limit ${Math.max(1, count)}
    `;
    return Array.isArray(rows) ? rows : [];
  }

  async function topUpShadow(wallet, minBal) {
    const w = String(wallet || "").trim();
    if (!w) return;
    await sql`
      update profiles
      set run_balance = greatest(coalesce(run_balance, 0), ${minBal}),
          updated_at = now()
      where wallet = ${w} and is_bootstrap = true
    `;
  }

  async function countRealTrades24h() {
    const rows = await sql`
      select count(*)::int as cnt
      from transactions t
      left join profiles p on p.wallet = t.wallet
      where t.created_at > now() - interval '24 hours'
        and coalesce(p.is_bootstrap, false) = false
    `;
    return safeNum(rows?.[0]?.cnt, 0);
  }

  async function coinsCreatedThisHourDb() {
    // Calendar hour (UTC), not rolling 60m — rolling window blocked creates after a busy hour
    const rows = await sql`
      select count(*)::int as cnt
      from coins
      where is_bootstrap = true
        and created_at >= date_trunc('hour', now())
    `;
    return safeNum(rows?.[0]?.cnt, 0);
  }

  async function resolveLogo(name, symbol) {
    const dataUrl = generateCoinLogoDataUrl({ name, symbol, salt: uid() });
    if (!dataUrl) throw new Error("logo generation failed");

    let finalLogo = dataUrl;
    if (process.env.PINATA_JWT && typeof uploadLogoToIPFS === "function") {
      try {
        const uploaded = await Promise.race([
          uploadLogoToIPFS(dataUrl, `${symbol}-${Date.now()}.svg`),
          new Promise((_, rej) => setTimeout(() => rej(new Error("ipfs timeout")), 12000)),
        ]);
        if (uploaded?.url) finalLogo = uploaded.url;
      } catch (e) {
        console.log("[bootstrap] logo IPFS skipped:", e?.message || e);
      }
    }
    return finalLogo;
  }

  async function createBootstrapCoin() {
    const creators = await pickShadowWallets(1);
    if (!creators.length) {
      await ensureShadowPool(cfg().shadowPool);
      return null;
    }
    const creatorWallet = String(creators[0].wallet);

    const existing = await sql`select upper(symbol) as symbol from coins where symbol is not null`;
    for (const r of existing || []) {
      if (r.symbol) usedSymbols.add(String(r.symbol).toUpperCase());
    }

    const identity = generateCoinIdentity(usedSymbols, Date.now() ^ randInt(1, 1e9));
    const logo = await resolveLogo(identity.name, identity.symbol);
    if (!logo) throw new Error("logo required");

    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
      throw new Error("ENCRYPTION_KEY invalid");
    }
    const reserveKeypair = Kp.generate();
    const reserveWalletAddress = reserveKeypair.publicKey.toBase58();
    const reserveWalletEncrypted = _encryptGCM(Buffer.from(reserveKeypair.secretKey), ENCRYPTION_KEY);

    const totalSupply = getSupplyFromInitialSol(0);
    const curveSupply = saleSupplyFromTotal(totalSupply);

    let coin = {
      id: uid(),
      name: identity.name,
      symbol: identity.symbol,
      story: identity.story,
      logo,
      metadataUri: "",
      creatorWallet,
      owner: creatorWallet,
      mintAddress: "",
      mintSignature: "",
      reserveWalletAddress,
      reserveWalletEncrypted,
      createdAt: nowMS(),
      status: "LIVE",
      totalSupply,
      curveSupply,
      curveSold: 0,
      vTokens: calcVirtualTokens(totalSupply, curveSupply),
      vSol: VIRTUAL_SOL,
      solReserve: 0,
      tokenReserve: curveSupply,
      holders: {},
      volumeSol: 0,
      lastTradeAt: 0,
      priceSol: 0,
      priceUsd: 0,
      price: 0,
      lastPriceUsd: 0,
      mc: 0,
      ath: 0,
      creatorRewardsSol: 0,
      chart: [],
    };

    coin = recalcCoin(coin, { appendChart: false });
    coin = await saveCoin(coin);

    await sql`
      update coins
      set is_bootstrap = true, bootstrap_paused = false
      where id = ${coin.id}
    `;
    if (invalidateCoinCache) invalidateCoinCache(coin.id);

    await logEvent("coin_create", coin.id, creatorWallet, {
      name: coin.name,
      symbol: coin.symbol,
    });

    const c = cfg();
    const seedMin = Math.min(c.seedBuyMinSol, c.seedBuyMaxSol);
    const seedMax = Math.max(c.seedBuyMinSol, c.seedBuyMaxSol);
    // Uneven 5–25 SOL creator buy so it reads like a real liquidity seed
    let seedSol = Number(rand(seedMin, seedMax).toFixed(4));
    if (Math.random() < 0.35) seedSol = Number((seedSol * rand(0.85, 1.05)).toFixed(4));
    seedSol = Math.min(seedMax, Math.max(seedMin, seedSol));

    await topUpShadow(creatorWallet, seedSol + 2);

    const seed = await executeSyntheticTrade(coin.id, {
      wallet: creatorWallet,
      side: "buy",
      solAmount: seedSol,
      allowPaused: false,
    });
    if (!seed?.ok) {
      console.log("[bootstrap] seed buy failed:", seed?.error || "unknown", coin.symbol, seedSol);
    } else {
      await logEvent("seed_buy", coin.id, creatorWallet, { sol: seedSol });
    }

    // Buy/sell starts almost immediately after create (seconds, not minutes)
    const tradeCount = randInt(6, 14);
    let t = Date.now() + jitterMs(rand(2_500, 12_000));
    for (let i = 0; i < tradeCount; i++) {
      // Early burst skewed to buys so the chart moves up after seed
      const prefer = i < 3 ? "buy" : i === 3 && Math.random() < 0.55 ? "sell" : "";
      tradeSchedule.set(`${coin.id}:${prefer || "x"}:${i}:${uid().slice(0, 8)}`, t);
      t += jitterMs(rand(8_000, 75_000));
    }

    return coin;
  }

  /**
   * @param {string} coinId
   * @param {{ wallet?: string, side?: string, solAmount?: number, allowPaused?: boolean }} [opts]
   */
  async function executeSyntheticTrade(coinId, opts = {}) {
    const preferSide = typeof opts === "string" ? opts : String(opts?.side || "");
    const forcedWallet = typeof opts === "object" && opts ? String(opts.wallet || "").trim() : "";
    const forcedSol =
      typeof opts === "object" && opts && opts.solAmount != null
        ? Math.max(0, safeNum(opts.solAmount, 0))
        : 0;
    const allowPaused = typeof opts === "object" && opts ? Boolean(opts.allowPaused) : false;

    const id = String(coinId || "").trim();
    if (!id || id === RUN_COIN_ID) return { ok: false, error: "skip" };

    const metaRows = await sql`
      select is_bootstrap, bootstrap_paused from coins where id = ${id} limit 1
    `;
    const meta = metaRows?.[0];
    if (!meta?.is_bootstrap) return { ok: false, error: "not bootstrap coin" };
    if (meta.bootstrap_paused && !allowPaused) return { ok: false, error: "paused" };

    const c = cfg();
    let wallet = forcedWallet;
    if (!wallet) {
      const wallets = await pickShadowWallets(1);
      if (!wallets.length) return { ok: false, error: "no wallets" };
      wallet = String(wallets[0].wallet);
    }
    const topNeed = forcedSol > 0 ? forcedSol + 0.5 : Math.max(c.walletSol * 0.4, c.maxTradeSol * 3);
    await topUpShadow(wallet, topNeed);

    const sideRoll = Math.random();
    let side = preferSide || (sideRoll < 0.68 ? "buy" : "sell");

    const result = await runCoinLocked(id, async (_tx) => {
      const row = await getCoinRowById(id);
      if (!row) return { ok: false, error: "missing" };
      let coin = mapDbCoinToApi(row);
      coin.holders = await loadHoldersMap(id, _tx);
      coin.holderCount = Object.keys(coin.holders).length;

      let tradeResult = null;
      let sol = 0;
      let tokens = 0;

      if (side === "sell") {
        const bal = safeNum(coin.holders[wallet], 0);
        if (bal <= 1) {
          side = "buy";
        } else {
          const frac = rand(0.08, 0.42);
          tokens = Math.max(1, bal * frac);
          tradeResult = ammSellByTokensIn(coin, wallet, tokens);
          if (!tradeResult?.ok) side = "buy";
          else {
            await increaseRun(wallet, Math.max(0, safeNum(tradeResult.solOutNet, 0)), _tx);
          }
        }
      }

      if (side === "buy") {
        if (forcedSol > 0) {
          sol = Number(forcedSol.toFixed(6));
        } else {
          sol = Number(rand(c.minTradeSol, c.maxTradeSol).toFixed(6));
          // Uneven sizes look more human
          if (Math.random() < 0.25) sol = Number((sol * rand(0.4, 0.75)).toFixed(6));
        }
        try {
          await decreaseRun(wallet, sol, _tx);
        } catch {
          return { ok: false, error: "Insufficient balance" };
        }
        tradeResult = ammBuy(coin, wallet, sol);
        if (!tradeResult?.ok) {
          await increaseRun(wallet, sol, _tx);
          return { ok: false, error: tradeResult?.error || "buy failed" };
        }
      }

      if (!tradeResult?.ok) return { ok: false, error: "trade failed" };

      const tradeFeeSol = Math.max(0, safeNum(tradeResult.feeSol, 0));
      const creatorWallet = String(coin?.creatorWallet || coin?.owner || "").trim();
      if (creatorWallet && tradeFeeSol > 0) {
        coin.creatorRewardsSol = Math.max(
          0,
          safeNum(coin.creatorRewardsSol, 0) + tradeFeeSol * (CREATOR_PCT_OF_FEE / 100)
        );
      }

      const rawVolSol =
        side === "buy"
          ? Math.max(0, sol)
          : Math.max(0, safeNum(tradeResult.solOutGross || tradeResult.solOutNet, 0));
      coin.volumeSol = Math.max(0, safeNum(coin.volumeSol, 0)) + rawVolSol;
      coin = recalcCoin(coin, { appendChart: true, sideHint: side });
      coin = await saveCoin(coin, _tx);

      await upsertHolding(wallet, coin.id, "set", Math.max(0, safeNum(coin?.holders?.[wallet], 0)), _tx);

      const txPayload = {
        id: uid(),
        type: side.toUpperCase(),
        side: side.toUpperCase(),
        coinId: coin.id,
        wallet,
        sol: side === "buy" ? sol : Math.max(0, safeNum(tradeResult.solOutNet, 0)),
        tokens:
          side === "buy"
            ? Math.max(0, safeNum(tradeResult.tokensOut, 0))
            : Math.max(0, safeNum(tradeResult.tokensIn, 0)),
        fee: tradeFeeSol,
        priceUsd: coin.priceUsd,
      };

      return {
        ok: true,
        coin,
        side,
        wallet,
        tradeFeeSol,
        candleVolumeSol: rawVolSol,
        txPayload,
        tradeResult,
      };
    });

    if (result?.ok) {
      const coinCandlePrice = candlePriceUsdFromCoin(result.coin);
      const coinIdOut = result.coin.id;
      tradeSideQueue.enqueue(`trade:${coinIdOut}`, async () => {
        await Promise.allSettled([
          upsertCandlesForTrade(coinIdOut, coinCandlePrice, result.candleVolumeSol, result.side),
          distributeFeeDirect(result.coin, result.wallet, result.tradeFeeSol),
          insertTransaction(result.txPayload),
          writeAudit(result.side === "buy" ? "BUY" : "SELL", result.wallet, result.txPayload.sol, {
            coinId: coinIdOut,
            meta: { fee: result.tradeFeeSol, tokens: result.txPayload.tokens, src: "pulse" },
          }),
        ]);
      });
      await logEvent("trade", coinIdOut, result.wallet, { side: result.side, sol: result.txPayload.sol });
    }

    return result;
  }

  async function maybeCreateCoin() {
    const c = cfg();
    if (c.maxCoinsPerHour <= 0) return;

    const bucket = Math.floor(Date.now() / 3_600_000);
    if (bucket !== hourBucket) {
      hourBucket = bucket;
      coinsThisHour = 0;
    }

    const dbCount = await coinsCreatedThisHourDb();
    coinsThisHour = Math.max(coinsThisHour, dbCount);
    if (coinsThisHour >= c.maxCoinsPerHour) return;

    // Pace across the hour, but catch up if behind so creates don't stall ~1h
    const remaining = c.maxCoinsPerHour - coinsThisHour;
    const hourFrac = (Date.now() % 3_600_000) / 3_600_000;
    const expectedByNow = c.maxCoinsPerHour * Math.min(1, hourFrac + 0.12);
    const behind = coinsThisHour < expectedByNow - 0.35;

    if (!behind && Math.random() > 0.35 + remaining * 0.08) return;

    try {
      const coin = await createBootstrapCoin();
      if (coin) {
        coinsThisHour += 1;
        console.log(
          `[bootstrap] coin created ${coin.symbol} (${coinsThisHour}/${c.maxCoinsPerHour} this hour)`
        );
      }
    } catch (e) {
      console.log("[bootstrap] coin create failed:", e?.message || e);
    }
  }

  async function processDueTrades() {
    const now = Date.now();
    const due = [];
    for (const [key, at] of tradeSchedule.entries()) {
      if (at <= now) due.push(key);
    }
    // Cap per tick
    due.sort(() => Math.random() - 0.5);
    for (const key of due.slice(0, 4)) {
      tradeSchedule.delete(key);
      const parts = key.split(":");
      const coinId = parts[0];
      const prefer = parts[1] === "buy" || parts[1] === "sell" ? parts[1] : "";
      try {
        await executeSyntheticTrade(coinId, prefer ? { side: prefer } : {});
      } catch (e) {
        console.log("[bootstrap] trade error:", e?.message || e);
      }
      await sleep(randInt(300, 1400));
    }

    // Occasional follow-up trades on older live bootstrap coins
    if (Math.random() < 0.18) {
      const rows = await sql`
        select id from coins
        where is_bootstrap = true
          and bootstrap_paused = false
          and created_at > now() - interval '36 hours'
        order by random()
        limit 1
      `;
      const id = rows?.[0]?.id;
      if (id) {
        try {
          await executeSyntheticTrade(id);
        } catch (e) {
          console.log("[bootstrap] follow trade error:", e?.message || e);
        }
      }
    }
  }

  async function tick() {
    if (stopped || running) return;
    const c = cfg();
    if (!c.enabled) return;

    running = true;
    try {
      await ensureShadowPool(c.shadowPool);

      const real24 = await countRealTrades24h();
      // Gradual fade when organic activity rises
      let throttle = 1;
      if (real24 >= c.pauseRealTrades24h) throttle = 0.15;
      else if (real24 >= c.pauseRealTrades24h * 0.5) throttle = 0.45;

      if (Math.random() < throttle) {
        await maybeCreateCoin();
      }
      if (Math.random() < Math.max(0.2, throttle)) {
        await processDueTrades();
      }
    } catch (e) {
      console.log("[bootstrap] tick error:", e?.message || e);
    } finally {
      running = false;
    }
  }

  /** Call from doTrade when a non-bootstrap wallet trades a coin. */
  async function onRealUserTrade(coinId, wallet) {
    try {
      const w = String(wallet || "").trim();
      const id = String(coinId || "").trim();
      if (!w || !id) return;
      const rows = await sql`
        select is_bootstrap from profiles where wallet = ${w} limit 1
      `;
      if (rows?.[0]?.is_bootstrap) return;
      await sql`
        update coins
        set bootstrap_paused = true
        where id = ${id} and is_bootstrap = true and bootstrap_paused = false
      `;
      // Drop pending schedule keys for this coin
      for (const key of [...tradeSchedule.keys()]) {
        if (key.startsWith(`${id}:`)) tradeSchedule.delete(key);
      }
      await logEvent("pause_real_user", id, w, {});
    } catch (e) {
      console.log("[bootstrap] onRealUserTrade error:", e?.message || e);
    }
  }

  function scheduleNext() {
    if (stopped) return;
    const delay = jitterMs(rand(22_000, 55_000));
    tickTimer = setTimeout(async () => {
      await tick();
      scheduleNext();
    }, delay);
    if (typeof tickTimer.unref === "function") tickTimer.unref();
  }

  async function start() {
    if (!cfg().enabled) {
      console.log("[bootstrap] inactive (BOOTSTRAP_ACTIVITY!=1)");
      return;
    }
    await ensureSchemaExtras();
    await ensureShadowPool(cfg().shadowPool);
    console.log(
      `[bootstrap] active — max ${cfg().maxCoinsPerHour}/hr, pool ${cfg().shadowPool}`
    );
    // First tick after short delay so schema settles
    setTimeout(() => {
      tick().finally(scheduleNext);
    }, jitterMs(8000, 0.2));
  }

  function stop() {
    stopped = true;
    if (tickTimer) clearTimeout(tickTimer);
  }

  return { start, stop, onRealUserTrade, ensureSchemaExtras, cfg };
}
