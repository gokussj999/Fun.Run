/**
 * Stealth bootstrap activity
 * - 1 coin every ~3 hours (BOOTSTRAP_CREATE_INTERVAL_HOURS)
 * - Continuous synthetic buy/sell on live bootstrap coins
 * - Every Nth coin (default 8) pumps to ~400–500k MC, then bleeds
 *   gradually over ~48h down to ~5–6k MC
 * - First real buy adopts creator + real on-chain mint (same name/logo)
 * Public APIs must never expose bootstrap flags.
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

export function createBootstrapController(deps) {
  const {
    sql,
    uid,
    safeNum,
    nowMS,
    Keypair: Kp = Keypair,
    VIRTUAL_SOL,
    CREATOR_PCT_OF_FEE = 40,
    SOL_USD = 80,
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
    writeAudit,
    tradeSideQueue,
    uploadLogoToIPFS,
    uploadMetadataToIPFS,
    _encryptGCM,
    invalidateCoinCache,
    RUN_COIN_ID,
    treasury,
    broadcast,
  } = deps;

  let stopped = false;
  let tickTimer = null;
  let running = false;
  let runningSince = 0;
  const usedSymbols = new Set();
  /** @type {Map<string, number>} */
  const tradeSchedule = new Map();
  /** @type {Set<string>} coins currently being pumped/reset */
  const busyCoins = new Set();

  const cfg = () => ({
    enabled: envFlag("BOOTSTRAP_ACTIVITY", false),
    // Prefer interval cadence (1 / 3h). Legacy hourly cap still honored if set > 0
    // and interval is disabled via BOOTSTRAP_CREATE_INTERVAL_HOURS=0.
    createIntervalHours: envNum("BOOTSTRAP_CREATE_INTERVAL_HOURS", 3, 0, 168),
    maxCoinsPerHour: envNum("BOOTSTRAP_MAX_COINS_PER_HOUR", 0, 0, 30),
    shadowPool: envNum("BOOTSTRAP_SHADOW_POOL", 96, 8, 400),
    walletSol: envNum("BOOTSTRAP_WALLET_SOL", 3, 0.05, 50),
    minTradeSol: envNum("BOOTSTRAP_MIN_TRADE_SOL", 0.004, 0.0005, 5),
    maxTradeSol: envNum("BOOTSTRAP_MAX_TRADE_SOL", 0.085, 0.002, 10),
    seedBuyMinSol: envNum("BOOTSTRAP_SEED_BUY_MIN_SOL", 5, 1, 100),
    seedBuyMaxSol: envNum("BOOTSTRAP_SEED_BUY_MAX_SOL", 25, 2, 200),
    pumpEveryN: envNum("BOOTSTRAP_PUMP_EVERY_N", 8, 1, 200),
    pumpMcMin: envNum("BOOTSTRAP_PUMP_MC_MIN", 400_000, 50_000, 5_000_000),
    pumpMcMax: envNum("BOOTSTRAP_PUMP_MC_MAX", 500_000, 50_000, 5_000_000),
    resetMcMin: envNum("BOOTSTRAP_RESET_MC_MIN", 5_000, 500, 100_000),
    resetMcMax: envNum("BOOTSTRAP_RESET_MC_MAX", 6_000, 500, 100_000),
    // legacy single floor (used if min/max not differentiating)
    resetMc: envNum("BOOTSTRAP_RESET_MC", 5_500, 500, 100_000),
    pumpResetHours: envNum("BOOTSTRAP_PUMP_RESET_HOURS", 48, 1, 168),
    pumpChunkSol: envNum("BOOTSTRAP_PUMP_CHUNK_SOL", 80, 10, 2000),
  });

  function floorMcTarget(c = cfg()) {
    const lo = Math.min(c.resetMcMin, c.resetMcMax);
    const hi = Math.max(c.resetMcMin, c.resetMcMax);
    if (hi > lo) return Number(rand(lo, hi).toFixed(0));
    return Math.max(500, safeNum(c.resetMc, 5500));
  }

  function fx() {
    return Math.max(1, safeNum(SOL_USD, 80));
  }

  async function ensureSchemaExtras() {
    await sql`alter table profiles add column if not exists is_bootstrap boolean not null default false`;
    await sql`alter table coins add column if not exists is_bootstrap boolean not null default false`;
    await sql`alter table coins add column if not exists bootstrap_paused boolean not null default false`;
    await sql`alter table coins add column if not exists bootstrap_phase text not null default 'live'`;
    await sql`alter table coins add column if not exists bootstrap_pump_at timestamptz`;
    await sql`alter table coins add column if not exists bootstrap_reset_at timestamptz`;
    await sql`alter table coins add column if not exists bootstrap_peak_mc numeric default 0`;
    await sql`alter table coins add column if not exists bootstrap_floor_mc numeric default 0`;
    await sql`alter table coins add column if not exists bootstrap_adopted_by text`;
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
          ${uid()}, ${String(kind)}, ${coinId || null}, ${wallet || null},
          ${JSON.stringify(meta || {})}, now()
        )
      `;
    } catch (e) {
      console.log("[bootstrap] event log error:", e?.message || e);
    }
  }

  async function ensureShadowPool(n) {
    const rows = await sql`select count(*)::int as cnt from profiles where is_bootstrap = true`;
    const have = safeNum(rows?.[0]?.cnt, 0);
    const need = Math.max(0, n - have);
    if (need <= 0) return;
    for (let i = 0; i < need; i++) {
      const kp = Kp.generate();
      const wallet = kp.publicKey.toBase58();
      const bal = Number((cfg().walletSol * (0.6 + Math.random() * 1.2)).toFixed(6));
      try {
        await sql`
          insert into profiles (
            wallet, wallet_address, encrypted_mnemonic,
            run_balance, run_tokens, referrer, referral_code, referral_count,
            is_bootstrap, created_at, updated_at
          ) values (
            ${wallet}, ${wallet}, ${""},
            ${bal}, ${0}, ${""}, ${wallet.slice(0, 6)}, ${0},
            ${true}, now(), now()
          ) on conflict (wallet) do nothing
        `;
      } catch (e) {
        console.log("[bootstrap] shadow insert failed:", e?.message || e);
      }
    }
  }

  async function pickShadowWallets(count, exclude = "") {
    const rows = await sql`
      select wallet, run_balance
      from profiles
      where is_bootstrap = true
        and wallet != ${String(exclude || "")}
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

  async function coinsCreatedThisHourDb() {
    const rows = await sql`
      select count(*)::int as cnt from coins
      where is_bootstrap = true and created_at >= date_trunc('hour', now())
    `;
    return safeNum(rows?.[0]?.cnt, 0);
  }

  async function msSinceLastBootstrapCreate() {
    const rows = await sql`
      select extract(epoch from (now() - max(created_at))) * 1000 as ms
      from bootstrap_events
      where kind = 'coin_create'
    `;
    const raw = rows?.[0]?.ms;
    if (raw == null || raw === "") {
      const fallback = await sql`
        select extract(epoch from (now() - max(created_at))) * 1000 as ms
        from coins where is_bootstrap = true
      `;
      const fb = fallback?.[0]?.ms;
      if (fb == null || fb === "") return Number.POSITIVE_INFINITY;
      const n = Number(fb);
      return Number.isFinite(n) ? Math.max(0, n) : Number.POSITIVE_INFINITY;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, n) : Number.POSITIVE_INFINITY;
  }

  async function bootstrapCreateCount() {
    const rows = await sql`
      select count(*)::int as cnt from bootstrap_events where kind = 'coin_create'
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

  async function postTradeSideEffects(result) {
    if (!result?.ok) return;
    const coinCandlePrice = candlePriceUsdFromCoin(result.coin);
    const coinIdOut = result.coin.id;
    tradeSideQueue.enqueue(`trade:${coinIdOut}`, async () => {
      await Promise.allSettled([
        upsertCandlesForTrade(coinIdOut, coinCandlePrice, result.candleVolumeSol, result.side),
        insertTransaction(result.txPayload),
        writeAudit(result.side === "buy" ? "BUY" : "SELL", result.wallet, result.txPayload.sol, {
          coinId: coinIdOut,
          meta: { fee: result.tradeFeeSol, tokens: result.txPayload.tokens, src: "pulse" },
        }),
      ]);
    });
  }

  async function botsStillAllowed(coinId) {
    const id = String(coinId || "").trim();
    if (!id) return false;
    const rows = await sql`
      select is_bootstrap, bootstrap_paused, bootstrap_phase, bootstrap_adopted_by
      from coins where id = ${id} limit 1
    `;
    const m = rows?.[0];
    if (!m) return false;
    if (m.bootstrap_adopted_by) return false;
    if (m.bootstrap_paused) return false;
    if (m.bootstrap_phase === "adopted") return false;
    if (!m.is_bootstrap) return false;
    return true;
  }

  function killCoinBotsLocal(coinId) {
    const id = String(coinId || "").trim();
    for (const key of [...tradeSchedule.keys()]) {
      if (key.startsWith(`${id}:`)) tradeSchedule.delete(key);
    }
    busyCoins.delete(id);
  }

  /**
   * @param {string} coinId
   * @param {{ wallet?: string, side?: string, solAmount?: number, tokenFrac?: number }} [opts]
   */
  async function executeSyntheticTrade(coinId, opts = {}) {
    const preferSide = String(opts?.side || "");
    const forcedWallet = String(opts?.wallet || "").trim();
    const forcedSol = opts?.solAmount != null ? Math.max(0, safeNum(opts.solAmount, 0)) : 0;
    const tokenFrac = opts?.tokenFrac != null ? safeNum(opts.tokenFrac, 0) : 0;

    const id = String(coinId || "").trim();
    if (!id || id === RUN_COIN_ID) return { ok: false, error: "skip" };
    if (!(await botsStillAllowed(id))) return { ok: false, error: "bots off" };

    const c = cfg();
    let wallet = forcedWallet;
    if (!wallet) {
      const wallets = await pickShadowWallets(1);
      if (!wallets.length) return { ok: false, error: "no wallets" };
      wallet = String(wallets[0].wallet);
    }
    const topNeed = forcedSol > 0 ? forcedSol + 1 : Math.max(c.walletSol, c.maxTradeSol * 4);
    await topUpShadow(wallet, topNeed);

    let side = preferSide || (Math.random() < 0.62 ? "buy" : "sell");

    const result = await runCoinLocked(id, async (_tx) => {
      // Re-check inside lock — real buy may have adopted mid-flight
      const gate = await _tx`
        select is_bootstrap, bootstrap_paused, bootstrap_phase, bootstrap_adopted_by
        from coins where id = ${id} limit 1
      `;
      const g = gate?.[0];
      if (
        !g?.is_bootstrap ||
        g.bootstrap_paused ||
        g.bootstrap_phase === "adopted" ||
        g.bootstrap_adopted_by
      ) {
        return { ok: false, error: "bots off" };
      }

      const row = await getCoinRowById(id);
      if (!row) return { ok: false, error: "missing" };
      let coin = mapDbCoinToApi(row);
      coin.holders = await loadHoldersMap(id, _tx);

      let tradeResult = null;
      let sol = 0;

      if (side === "sell") {
        const bal = safeNum(coin.holders[wallet], 0);
        if (bal <= 1) side = "buy";
        else {
          const frac = tokenFrac > 0 ? tokenFrac : rand(0.1, 0.45);
          const tokens = Math.max(1, bal * frac);
          tradeResult = ammSellByTokensIn(coin, wallet, tokens);
          if (!tradeResult?.ok) side = "buy";
          else await increaseRun(wallet, Math.max(0, safeNum(tradeResult.solOutNet, 0)), _tx);
        }
      }

      if (side === "buy") {
        sol =
          forcedSol > 0
            ? Number(forcedSol.toFixed(6))
            : Number(rand(c.minTradeSol, c.maxTradeSol).toFixed(6));
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

      // Synthetic trades: NEVER credit creator rewards (profile or coin row)
      const tradeFeeSol = Math.max(0, safeNum(tradeResult.feeSol, 0));

      const rawVolSol =
        side === "buy"
          ? Math.max(0, sol)
          : Math.max(0, safeNum(tradeResult.solOutGross || tradeResult.solOutNet, 0));
      coin.volumeSol = Math.max(0, safeNum(coin.volumeSol, 0)) + rawVolSol;
      coin = recalcCoin(coin, { appendChart: true, sideHint: side });
      coin = await saveCoin(coin, _tx);
      await upsertHolding(wallet, coin.id, "set", Math.max(0, safeNum(coin?.holders?.[wallet], 0)), _tx);

      return {
        ok: true,
        coin,
        side,
        wallet,
        tradeFeeSol,
        candleVolumeSol: rawVolSol,
        txPayload: {
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
        },
        tradeResult,
      };
    });

    if (result?.ok) {
      await postTradeSideEffects(result);
      await logEvent("trade", result.coin.id, result.wallet, {
        side: result.side,
        sol: result.txPayload.sol,
        mc: result.coin.mc,
      });
    }
    return result;
  }

  /** Drive MC toward target via synthetic buys (pump) or sells (reset). */
  async function driveMcTo(coinId, targetMc, mode) {
    const id = String(coinId || "").trim();
    const target = Math.max(100, safeNum(targetMc, 5000));
    const c = cfg();
    const maxSteps = mode === "pump" ? 80 : 100;

    for (let step = 0; step < maxSteps; step++) {
      if (stopped) break;
      if (!(await botsStillAllowed(id))) {
        return { ok: false, mc: 0, aborted: true };
      }
      const row = await getCoinRowById(id);
      if (!row) break;
      let coin = mapDbCoinToApi(row);
      coin = recalcCoin(coin, { appendChart: false });
      const mc = safeNum(coin.mc, 0);

      if (mode === "pump" && mc >= target * 0.98) return { ok: true, mc };
      if (mode === "reset" && mc <= target * 1.08) return { ok: true, mc };

      if (mode === "pump") {
        const wallets = await pickShadowWallets(1);
        if (!wallets.length) break;
        const w = String(wallets[0].wallet);
        const gap = Math.max(0, target - mc);
        // Heuristic chunk: larger when far from target
        let chunk = Math.min(c.pumpChunkSol, Math.max(25, gap / fx() / 8));
        chunk = Number((chunk * rand(0.7, 1.15)).toFixed(4));
        await topUpShadow(w, chunk + 5);
        const r = await executeSyntheticTrade(id, { wallet: w, side: "buy", solAmount: chunk });
        if (!r?.ok) {
          if (r?.error === "bots off") return { ok: false, mc, aborted: true };
          await executeSyntheticTrade(id, {
            wallet: w,
            side: "buy",
            solAmount: Math.max(5, chunk * 0.25),
          });
        }
      } else {
        // Sell from richest shadow holders
        const holders = await sql`
          select wallet, tokens::float as tokens from holdings
          where coin_id = ${id} and tokens > 1
          order by tokens desc limit 8
        `;
        if (!holders?.length) {
          if (!(await botsStillAllowed(id))) return { ok: false, mc, aborted: true };
          // Force curve toward ~reset MC by trimming sol reserve if needed
          await runCoinLocked(id, async (_tx) => {
            const latest = await getCoinRowById(id);
            if (!latest) return;
            let coint = mapDbCoinToApi(latest);
            coint.holders = await loadHoldersMap(id, _tx);
            // Binary-ish: reduce solReserve until MC near target
            for (let i = 0; i < 12; i++) {
              coint = recalcCoin(coint, { appendChart: false });
              if (safeNum(coint.mc, 0) <= target * 1.1) break;
              coint.solReserve = Math.max(0.01, safeNum(coint.solReserve, 0) * 0.72);
            }
            coint = recalcCoin(coint, { appendChart: true, sideHint: "sell" });
            await saveCoin(coint, _tx);
          });
          break;
        }
        const h = holders[step % holders.length];
        const sold = await executeSyntheticTrade(id, {
          wallet: String(h.wallet),
          side: "sell",
          tokenFrac: rand(0.35, 0.85),
        });
        if (sold?.error === "bots off") return { ok: false, mc, aborted: true };
      }
      await sleep(randInt(80, 220));
    }

    const finalRow = await getCoinRowById(id);
    const finalMc = finalRow ? safeNum(mapDbCoinToApi(finalRow).mc, 0) : 0;
    return { ok: true, mc: finalMc };
  }

  async function startPump(coinId) {
    const id = String(coinId || "").trim();
    if (!id || busyCoins.has(id)) return;
    const c = cfg();
    const peak = Number(rand(c.pumpMcMin, c.pumpMcMax).toFixed(0));
    const floor = floorMcTarget(c);
    busyCoins.add(id);
    try {
      await sql`
        update coins set
          bootstrap_phase = 'pumping',
          bootstrap_pump_at = coalesce(bootstrap_pump_at, now()),
          bootstrap_peak_mc = ${peak},
          bootstrap_floor_mc = ${floor},
          bootstrap_reset_at = now() + (${c.pumpResetHours} || ' hours')::interval
        where id = ${id} and is_bootstrap = true
      `;
      console.log(`[bootstrap] pump start ${id} → MC $${peak} (floor $${floor} over ${c.pumpResetHours}h)`);
      const r = await driveMcTo(id, peak, "pump");
      // Restart 48h bleed clock from peak (not from queue time)
      await sql`
        update coins set
          bootstrap_phase = 'bleeding',
          bootstrap_pump_at = now(),
          bootstrap_reset_at = now() + (${c.pumpResetHours} || ' hours')::interval
        where id = ${id} and bootstrap_phase = 'pumping'
      `;
      await logEvent("pump_done", id, null, { peak, floor, mc: r.mc });
      console.log(`[bootstrap] pump done ${id} mc=${Math.round(r.mc)} — bleeding starts`);
    } catch (e) {
      console.log("[bootstrap] pump error:", e?.message || e);
    } finally {
      busyCoins.delete(id);
    }
  }

  /** Gradual MC bleed toward floor over pumpResetHours (not an instant dump). */
  async function bleedStep(coinRow) {
    const id = String(coinRow?.id || "").trim();
    if (!id || busyCoins.has(id)) return;
    if (!(await botsStillAllowed(id))) return;

    const c = cfg();
    const peak = Math.max(safeNum(coinRow.bootstrap_peak_mc, 0), c.pumpMcMin);
    const floor = Math.max(
      500,
      safeNum(coinRow.bootstrap_floor_mc, 0) || floorMcTarget(c)
    );
    const resetAt = coinRow.bootstrap_reset_at
      ? new Date(coinRow.bootstrap_reset_at).getTime()
      : 0;
    const pumpAt = coinRow.bootstrap_pump_at
      ? new Date(coinRow.bootstrap_pump_at).getTime()
      : Date.now();
    const endAt = resetAt || pumpAt + c.pumpResetHours * 3_600_000;
    const startAt = pumpAt;
    const span = Math.max(60_000, endAt - startAt);
    const progress = Math.min(1, Math.max(0, (Date.now() - startAt) / span));
    // Ease-in so early hours hold higher, later hours drop faster
    const eased = progress * progress;
    const target = peak + (floor - peak) * eased;
    // Small noise so chart isn't a perfect line
    const noisyTarget = target * (0.96 + Math.random() * 0.08);

    const row = await getCoinRowById(id);
    if (!row) return;
    let coin = mapDbCoinToApi(row);
    coin = recalcCoin(coin, { appendChart: false });
    const mc = safeNum(coin.mc, 0);

    if (progress >= 0.995 || mc <= floor * 1.12) {
      busyCoins.add(id);
      try {
        await driveMcTo(id, floor, "reset");
        await sql`
          update coins set bootstrap_phase = 'live', bootstrap_reset_at = null
          where id = ${id}
        `;
        await logEvent("bleed_done", id, null, { floor, mc: floor });
        console.log(`[bootstrap] bleed done ${id} → ~$${floor}`);
      } finally {
        busyCoins.delete(id);
      }
      return;
    }

    if (mc <= noisyTarget * 1.05) {
      // Already at/below schedule — light random trade only
      return;
    }

    // Nudge down with a few sells (non-blocking short burst)
    busyCoins.add(id);
    try {
      for (let i = 0; i < randInt(1, 3); i++) {
        if (!(await botsStillAllowed(id))) break;
        const latest = await getCoinRowById(id);
        if (!latest) break;
        let cur = recalcCoin(mapDbCoinToApi(latest), { appendChart: false });
        if (safeNum(cur.mc, 0) <= noisyTarget) break;

        const holders = await sql`
          select wallet, tokens::float as tokens from holdings
          where coin_id = ${id} and tokens > 1
          order by tokens desc limit 6
        `;
        if (!holders?.length) {
          await driveMcTo(id, Math.max(noisyTarget, floor), "reset");
          break;
        }
        const h = holders[i % holders.length];
        await executeSyntheticTrade(id, {
          wallet: String(h.wallet),
          side: "sell",
          tokenFrac: rand(0.12, 0.4),
        });
        await sleep(randInt(60, 180));
      }
    } finally {
      busyCoins.delete(id);
    }
  }

  async function processPumpLifecycle() {
    // Pending pumps (marked at create)
    const pending = await sql`
      select id from coins
      where is_bootstrap = true
        and bootstrap_phase = 'pump_pending'
        and coalesce(bootstrap_paused, false) = false
      order by created_at asc
      limit 1
    `;
    if (pending?.[0]?.id) {
      startPump(pending[0].id).catch(() => {});
    }

    // Gradual bleed for pumped coins (and legacy 'pumped' phase)
    const bleeding = await sql`
      select id, bootstrap_peak_mc, bootstrap_floor_mc, bootstrap_pump_at, bootstrap_reset_at
      from coins
      where is_bootstrap = true
        and bootstrap_phase in ('bleeding', 'pumped')
        and coalesce(bootstrap_paused, false) = false
      order by bootstrap_pump_at asc nulls last
      limit 3
    `;
    for (const row of bleeding || []) {
      bleedStep(row).catch((e) => console.log("[bootstrap] bleed error:", e?.message || e));
    }
  }

  async function maybeMarkPumpCandidate(coinId) {
    const c = cfg();
    const every = Math.max(1, Math.floor(c.pumpEveryN));
    // Count includes this coin (already logged as coin_create before this call)
    const n = await bootstrapCreateCount();
    if (n <= 0 || n % every !== 0) return false;

    await sql`
      update coins set
        bootstrap_phase = 'pump_pending',
        bootstrap_pump_at = now()
      where id = ${coinId}
    `;
    await logEvent("pump_queued", coinId, null, { createIndex: n, every });
    console.log(`[bootstrap] pump queued for coin #${n} (every ${every})`);
    return true;
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

    const c = cfg();
    const seedMin = Math.min(c.seedBuyMinSol, c.seedBuyMaxSol);
    const seedMax = Math.max(c.seedBuyMinSol, c.seedBuyMaxSol);
    let seedSol = Number(rand(seedMin, seedMax).toFixed(4));
    seedSol = Math.min(seedMax, Math.max(seedMin, seedSol));

    const totalSupply = getSupplyFromInitialSol(seedSol);
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
      set is_bootstrap = true, bootstrap_paused = false, bootstrap_phase = 'live'
      where id = ${coin.id}
    `;
    if (invalidateCoinCache) invalidateCoinCache(coin.id);
    await logEvent("coin_create", coin.id, creatorWallet, {
      name: coin.name,
      symbol: coin.symbol,
    });

    await topUpShadow(creatorWallet, seedSol + 2);
    const seed = await executeSyntheticTrade(coin.id, {
      wallet: creatorWallet,
      side: "buy",
      solAmount: seedSol,
    });
    if (seed?.ok) await logEvent("seed_buy", coin.id, creatorWallet, { sol: seedSol });
    else console.log("[bootstrap] seed buy failed:", seed?.error, coin.symbol);

    await maybeMarkPumpCandidate(coin.id);

    // Immediate + ongoing trade schedule
    let t = Date.now() + jitterMs(rand(2_000, 8_000));
    for (let i = 0; i < randInt(8, 16); i++) {
      const prefer = i < 4 ? "buy" : "";
      tradeSchedule.set(`${coin.id}:${prefer || "x"}:${i}:${uid().slice(0, 6)}`, t);
      t += jitterMs(rand(12_000, 90_000));
    }

    return coin;
  }

  async function maybeCreateCoin(force = false) {
    const c = cfg();
    const intervalMs = Math.max(0, c.createIntervalHours) * 3_600_000;

    // Interval mode (default): 1 coin every N hours — resilient across restarts
    if (intervalMs > 0) {
      if (!force) {
        const since = await msSinceLastBootstrapCreate();
        if (since < intervalMs) return null;
      }
    } else {
      // Legacy hourly cap mode when interval disabled
      if (c.maxCoinsPerHour <= 0) return null;
      const dbCount = await coinsCreatedThisHourDb();
      if (dbCount >= c.maxCoinsPerHour) return null;
      if (!force) {
        const hourFrac = (Date.now() % 3_600_000) / 3_600_000;
        const targetNow = Math.min(
          c.maxCoinsPerHour,
          Math.max(1, Math.floor(hourFrac * c.maxCoinsPerHour) + 1)
        );
        if (dbCount >= targetNow) return null;
      }
    }

    try {
      const coin = await createBootstrapCoin();
      if (coin) {
        const label =
          intervalMs > 0
            ? `next in ~${c.createIntervalHours}h`
            : `hourly cap ${c.maxCoinsPerHour}`;
        console.log(`[bootstrap] coin created ${coin.symbol} (${label})`);
        return coin;
      }
    } catch (e) {
      console.log("[bootstrap] coin create failed:", e?.message || e);
    }
    return null;
  }

  async function processDueTrades() {
    const now = Date.now();
    const due = [];
    for (const [key, at] of tradeSchedule.entries()) {
      if (at <= now) due.push(key);
    }
    due.sort(() => Math.random() - 0.5);

    for (const key of due.slice(0, 5)) {
      tradeSchedule.delete(key);
      const parts = key.split(":");
      const coinId = parts[0];
      const prefer = parts[1] === "buy" || parts[1] === "sell" ? parts[1] : "";
      try {
        await executeSyntheticTrade(coinId, prefer ? { side: prefer } : {});
      } catch (e) {
        console.log("[bootstrap] trade error:", e?.message || e);
      }
      await sleep(randInt(200, 900));
    }

    // Always keep alive: 2–4 random live bootstrap coins trade every tick
    const live = await sql`
      select id from coins
      where is_bootstrap = true
        and coalesce(bootstrap_paused, false) = false
        and bootstrap_phase in ('live', 'pumped', 'pump_pending')
        and created_at > now() - interval '72 hours'
        and id != ${RUN_COIN_ID || ""}
      order by random()
      limit ${randInt(2, 4)}
    `;
    for (const row of live || []) {
      if (busyCoins.has(row.id)) continue;
      try {
        await executeSyntheticTrade(row.id);
      } catch (e) {
        console.log("[bootstrap] keep-alive trade error:", e?.message || e);
      }
      await sleep(randInt(150, 600));
    }
  }

  async function mintForAdoptedCoin(coinId) {
    const id = String(coinId || "").trim();
    if (!id || !treasury) return;
    try {
      const row = await getCoinRowById(id);
      if (!row) return;
      let coin = mapDbCoinToApi(row);
      if (coin.mintAddress) return;

      let metadataUri = coin.metadataUri || "";
      if (process.env.PINATA_JWT && uploadMetadataToIPFS && coin.logo) {
        try {
          const meta = await uploadMetadataToIPFS({
            name: coin.name,
            symbol: coin.symbol,
            description: coin.story || `${coin.name} (${coin.symbol})`,
            image: coin.logo.startsWith("ipfs://") || coin.logo.includes("/ipfs/")
              ? coin.logo
              : coin.logo,
          });
          metadataUri = meta?.ipfs || metadataUri;
        } catch (e) {
          console.log("[bootstrap] adopt metadata skipped:", e?.message || e);
        }
      }

      const { createSPLToken } = await import("../solana/create-token.js");
      const { create_coin, Wallet } = await import("../solana/program.js");
      const { mintAddress: onchainMint } = await createSPLToken(treasury);
      if (!onchainMint) throw new Error("empty mint");

      const latest = await getCoinRowById(id);
      if (!latest) return;
      const c = mapDbCoinToApi(latest);
      c.mintAddress = onchainMint;
      c.metadataUri = metadataUri || c.metadataUri;
      await saveCoin(c);
      console.log(`[bootstrap] adopt mint saved ${id}: ${onchainMint}`);
      try {
        broadcast?.("coin:update", { id, mintAddress: onchainMint, creatorWallet: c.creatorWallet });
      } catch {}

      try {
        const sig = await create_coin(new Wallet(treasury), id);
        const row2 = await getCoinRowById(id);
        if (row2) {
          const c2 = mapDbCoinToApi(row2);
          c2.mintAddress = onchainMint;
          c2.mintSignature = sig || "";
          c2.metadataUri = metadataUri || c2.metadataUri;
          await saveCoin(c2);
        }
      } catch (e) {
        console.error("[bootstrap] adopt create_coin failed (mint kept):", e?.message || e);
      }
      await logEvent("adopt_mint", id, c.creatorWallet, { mint: onchainMint });
    } catch (e) {
      console.error("[bootstrap] adopt mint failed:", e?.message || e);
    }
  }

  /**
   * First real BUY on a fake coin — call inside doTrade lock BEFORE fee credits.
   * - kills bots immediately
   * - first buyer becomes creator (same name/logo)
   * - wipes fake creator_rewards on the coin so adopter starts clean
   * Returns { adopted, creatorWallet } or null.
   */
  async function adoptOnFirstRealTrade(coinId, wallet, _tx = null) {
    const w = String(wallet || "").trim();
    const id = String(coinId || "").trim();
    if (!w || !id) return null;

    const db = _tx || sql;

    const prof = await db`
      select is_bootstrap from profiles where wallet = ${w} limit 1
    `;
    if (prof?.[0]?.is_bootstrap) return null;

    const coinRows = await db`
      select is_bootstrap, bootstrap_phase, bootstrap_adopted_by, creator_wallet, name, symbol
      from coins where id = ${id} limit 1
    `;
    const crow = coinRows?.[0];
    if (!crow) return null;

    // Already adopted — keep bots dead
    if (crow.bootstrap_phase === "adopted" || crow.bootstrap_adopted_by) {
      killCoinBotsLocal(id);
      await db`
        update coins set bootstrap_paused = true, is_bootstrap = false
        where id = ${id}
      `;
      return { adopted: false, already: true, creatorWallet: String(crow.bootstrap_adopted_by || crow.creator_wallet || w) };
    }

    // Only bootstrap coins can be adopted
    if (!crow.is_bootstrap) return null;

    killCoinBotsLocal(id);

    const updated = await db`
      update coins set
        creator_wallet = ${w},
        creator_rewards = 0,
        is_bootstrap = false,
        bootstrap_paused = true,
        bootstrap_phase = 'adopted',
        bootstrap_adopted_by = ${w},
        bootstrap_reset_at = null
      where id = ${id}
        and coalesce(bootstrap_adopted_by, '') = ''
        and is_bootstrap = true
      returning id, name, symbol, creator_wallet
    `;

    if (!updated?.[0]) {
      // Lost race — someone else adopted
      killCoinBotsLocal(id);
      return null;
    }

    if (invalidateCoinCache) invalidateCoinCache(id);
    await logEvent("adopted", id, w, {
      name: crow.name,
      symbol: crow.symbol,
      prevCreator: crow.creator_wallet,
    });
    console.log(`[bootstrap] ADOPTED ${crow.symbol} by ${w.slice(0, 8)}… — bots OFF`);

    try {
      broadcast?.("coin:update", { id, creatorWallet: w, owner: w });
    } catch {}

    // Mint only when not inside an open DB tx (commit must finish first)
    if (!_tx) {
      setImmediate(() => {
        mintForAdoptedCoin(id).catch((e) =>
          console.error("[bootstrap] mint adopt async:", e?.message || e)
        );
      });
    }

    return { adopted: true, creatorWallet: w, needsMint: Boolean(_tx) };
  }

  /** Post-trade hook (idempotent). Prefer adoptOnFirstRealTrade inside lock on BUY. */
  async function onRealUserTrade(coinId, wallet, opts = {}) {
    try {
      const side = String(opts?.side || "").toLowerCase();
      const id = String(coinId || "").trim();
      const w = String(wallet || "").trim();
      if (!id || !w) return;

      // Non-buy: only ensure bots stay off
      if (side && side !== "buy") {
        if (!(await botsStillAllowed(id))) killCoinBotsLocal(id);
        return;
      }

      const r = await adoptOnFirstRealTrade(id, w, null);
      // Ensure mint after commit (covers in-lock adopt that deferred mint)
      if (r?.adopted || r?.already || r?.needsMint) {
        const row = await getCoinRowById(id);
        const mint = row ? String(mapDbCoinToApi(row).mintAddress || "") : "";
        if (!mint) {
          setTimeout(() => {
            mintForAdoptedCoin(id).catch((e) =>
              console.error("[bootstrap] mint adopt deferred:", e?.message || e)
            );
          }, 400);
        }
      }
    } catch (e) {
      console.log("[bootstrap] onRealUserTrade error:", e?.message || e);
    }
  }

  async function tick() {
    if (stopped) return;
    // Watchdog: if a previous tick hung, allow a new one after 3 minutes
    if (running) {
      if (runningSince && Date.now() - runningSince < 180_000) return;
      console.log("[bootstrap] tick watchdog — forcing unlock after stall");
      running = false;
    }
    const c = cfg();
    if (!c.enabled) return;

    running = true;
    runningSince = Date.now();
    try {
      await ensureShadowPool(c.shadowPool);
      // One create attempt per tick when due (interval-paced)
      await maybeCreateCoin(false);
      await processDueTrades();
      await processPumpLifecycle();
    } catch (e) {
      console.log("[bootstrap] tick error:", e?.message || e);
    } finally {
      running = false;
      runningSince = 0;
    }
  }

  function scheduleNext() {
    if (stopped) return;
    const delay = jitterMs(rand(12_000, 28_000));
    tickTimer = setTimeout(async () => {
      try {
        await tick();
      } catch (e) {
        console.log("[bootstrap] schedule tick error:", e?.message || e);
      }
      scheduleNext();
    }, delay);
    if (typeof tickTimer.unref === "function") tickTimer.unref();
  }

  async function start() {
    if (!cfg().enabled) {
      console.log("[bootstrap] inactive (BOOTSTRAP_ACTIVITY!=1)");
      return;
    }
    try {
      await ensureSchemaExtras();
      console.log("[bootstrap] schema extras ready");
      const c = cfg();
      const cadence =
        c.createIntervalHours > 0
          ? `1 coin / ${c.createIntervalHours}h`
          : `${c.maxCoinsPerHour}/hr`;
      console.log(
        `[bootstrap] active — ${cadence}, pump every ${c.pumpEveryN} coins, ` +
          `bleed ${c.pumpResetHours}h → $${c.resetMcMin}–$${c.resetMcMax}, pool=${c.shadowPool}`
      );
      // Don't block "active" on pool fill — fill async then kick creates
      ensureShadowPool(c.shadowPool)
        .then(() => console.log("[bootstrap] shadow pool ready"))
        .catch((e) => console.log("[bootstrap] shadow pool error:", e?.message || e));

      // Immediate kick so creates don't wait for first jittered tick
      setTimeout(async () => {
        try {
          await ensureShadowPool(cfg().shadowPool);
          const since = await msSinceLastBootstrapCreate();
          const intervalMs = Math.max(0, cfg().createIntervalHours) * 3_600_000;
          // Only force-create if none yet or interval already elapsed
          if (!Number.isFinite(since) || since === Number.POSITIVE_INFINITY || since >= intervalMs) {
            await maybeCreateCoin(true);
          } else {
            const hrsLeft = ((intervalMs - since) / 3_600_000).toFixed(2);
            console.log(`[bootstrap] create skip on boot — next in ~${hrsLeft}h`);
          }
        } catch (e) {
          console.log("[bootstrap] startup create failed:", e?.message || e);
        }
        tick().finally(scheduleNext);
      }, 2500);
    } catch (e) {
      console.log("[bootstrap] start failed:", e?.message || e);
    }
  }

  function stop() {
    stopped = true;
    if (tickTimer) clearTimeout(tickTimer);
  }

  return {
    start,
    stop,
    onRealUserTrade,
    adoptOnFirstRealTrade,
    ensureSchemaExtras,
    cfg,
  };
}
