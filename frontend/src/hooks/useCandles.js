import { useEffect, useMemo, useRef, useState } from "react";
import { chartRangeToApiTf, normalizeCandleData } from "../lib/chart-candles.js";
import { env } from "../lib/env.js";
import { api } from "../services/api.js";
import * as platformApi from "../services/platform-api.js";

const CACHE_TTL_MS = 800;
const LIVE_POLL_MS = 2_500;

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
  const hasDataRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let timer = null;
    let delayed = null;

    async function load(force = false) {
      if (!coin?.id) return;

      const key = cacheKey(coin.id, chartRange);

      try {
        if (force) clearCandleCache(coin.id, chartRange);
        // Only show skeleton on first load — background refresh stays smooth
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
            // ignore cache parse errors
          }
        }

        const tf = chartRangeToApiTf(chartRange);
        const json = env.usePlatform
          ? await platformApi.fetchCandles(coin.id, tf, 120)
          : await api(`/coin/${coin.id}/candles?tf=${tf}&limit=120`, { timeout: 8000 });

        if (!mounted) return;

        const rows = Array.isArray(json?.candles) ? json.candles : [];
        if (rows.length > 0) {
          setRawCandles(rows);
          hasDataRef.current = true;
          try {
            localStorage.setItem(key, JSON.stringify({ ts: Date.now(), rows }));
          } catch {
            // ignore quota errors
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
    () => normalizeCandleData(rawCandles, chartRange, coin),
    [rawCandles, chartRange, coin?.priceUsd, coin?.lastPriceUsd, coin?.price]
  );

  return { candleData, loading };
}
