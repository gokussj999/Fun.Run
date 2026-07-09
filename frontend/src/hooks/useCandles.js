import { useEffect, useMemo, useState } from "react";
import { chartRangeToApiTf, normalizeCandleData } from "../lib/chart-candles.js";
import { api } from "../services/api.js";

const CACHE_TTL_MS = 2500;
const LIVE_POLL_MS = 30_000;

function cacheKey(coinId, chartRange) {
  return `coin_activity_${coinId}_${String(chartRange || "1D").toUpperCase()}`;
}

export function useCandles(coin, chartRange, reloadKey = 0) {
  const [rawCandles, setRawCandles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timer = null;

    async function load(force = false) {
      if (!coin?.id) return;

      const key = cacheKey(coin.id, chartRange);

      try {
        setLoading(true);

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
                if (mounted) setRawCandles(cached.rows);
                setLoading(false);
                return;
              }
            }
          } catch {
            // ignore cache parse errors
          }
        }

        const tf = chartRangeToApiTf(chartRange);
        const json = await api(`/coin/${coin.id}/candles?tf=${tf}&limit=120`);

        if (!mounted) return;

        const rows = Array.isArray(json?.candles) ? json.candles : [];
        if (rows.length > 0) {
          setRawCandles(rows);
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

    load(Boolean(reloadKey));
    timer = setInterval(() => load(true), LIVE_POLL_MS);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [coin?.id, chartRange, reloadKey]);

  const candleData = useMemo(
    () => normalizeCandleData(rawCandles, chartRange, coin),
    [rawCandles, chartRange, coin?.priceUsd, coin?.lastPriceUsd, coin?.price]
  );

  return { candleData, loading };
}
