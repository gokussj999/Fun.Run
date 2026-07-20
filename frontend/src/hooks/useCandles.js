import { useEffect, useMemo, useRef, useState } from "react";
import { chartRangeToApiTf, normalizeCandleData } from "../lib/chart-candles.js";
import { getTimeframeCfg } from "../lib/chart-utils.js";
import { env } from "../lib/env.js";
import { api } from "../services/api.js";
import * as platformApi from "../services/platform-api.js";

const CACHE_TTL_MS = 800;
const LIVE_POLL_MS = 2_500;
const NOW_TICK_MS = 1_000;

function cacheKey(coinId, chartRange) {
  return `coin_activity_${coinId}_${String(chartRange || "5M").toUpperCase()}`;
}

function clearCandleCache(coinId, chartRange) {
  try {
    localStorage.removeItem(cacheKey(coinId, chartRange));
  } catch {
    // ignore
  }
}

export function useCandles(coin, chartRange, reloadKey = 0) {
  const [rawCandles, setRawCandles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const hasDataRef = useRef(false);

  // Advance "now" so empty timeframe buckets close and a new candle opens without trades
  useEffect(() => {
    const cfg = getTimeframeCfg(chartRange);
    // Fast TFs tick every 1s; slow TFs still tick so the current bucket stays live
    const ms = cfg.ms <= 5 * 60 * 1000 ? NOW_TICK_MS : Math.min(15_000, Math.max(NOW_TICK_MS, cfg.ms / 60));
    const id = setInterval(() => setNowTick(Date.now()), ms);
    return () => clearInterval(id);
  }, [chartRange]);

  useEffect(() => {
    let mounted = true;
    let timer = null;
    let delayed = null;

    async function load(force = false) {
      if (!coin?.id) return;

      const key = cacheKey(coin.id, chartRange);

      try {
        if (force) clearCandleCache(coin.id, chartRange);
        if (!hasDataRef.current) setLoading(true);

        if (!force) {
          try {
            const cachedRaw = localStorage.getItem(key);
            if (cachedRaw) {
              const cached = JSON.parse(cachedRaw);
              if (
                cached &&
                Array.isArray(cached.rows) &&
                Date.now() - Number(cached.ts || 0) < CACHE_TTL_MS
              ) {
                if (mounted) {
                  setRawCandles(cached.rows);
                  hasDataRef.current = cached.rows.length > 0;
                }
                setLoading(false);
                return;
              }
            }
          } catch {
            // ignore
          }
        }

        const tf = chartRangeToApiTf(chartRange);
        const json = env.usePlatform
          ? await platformApi.fetchCandles(coin.id, tf, 120)
          : await api(`/coin/${coin.id}/candles?tf=${tf}&limit=120`, { timeout: 8000 });

        if (!mounted) return;

        const rows = Array.isArray(json?.candles) ? json.candles : [];
        // Allow empty array to clear stale cache after force
        setRawCandles(rows);
        if (rows.length > 0) {
          hasDataRef.current = true;
          try {
            localStorage.setItem(key, JSON.stringify({ ts: Date.now(), rows }));
          } catch {
            // ignore
          }
        }
      } catch {
        // keep previous candles on error
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (reloadKey) {
      load(true);
      delayed = setTimeout(() => load(true), 280);
    } else {
      load(false);
    }

    timer = setInterval(() => load(true), LIVE_POLL_MS);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
      if (delayed) clearTimeout(delayed);
    };
  }, [coin?.id, chartRange, reloadKey]);

  const candleData = useMemo(
    () => normalizeCandleData(rawCandles, chartRange, coin, nowTick),
    [rawCandles, chartRange, coin?.priceUsd, coin?.lastPriceUsd, coin?.price, nowTick]
  );

  return { candleData, loading };
}
