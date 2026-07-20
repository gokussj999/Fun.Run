import { safeNum } from "./coin-display.js";
import { getTimeframeCfg } from "./chart-utils.js";

export const CHART_TF_API_MAP = {
  "5M": "5m",
  "15M": "15m",
  "1H": "1h",
  "4H": "4h",
  "1D": "1d",
  "1W": "1w",
  "1M": "1m",
};

export function chartRangeToApiTf(range) {
  return CHART_TF_API_MAP[String(range || "1D").toUpperCase()] || "1d";
}

export function normalizeCandleData(rawList, chartRange, coin) {
  const list = Array.isArray(rawList) ? rawList : [];
  if (!list.length) return [];

  const cfg = getTimeframeCfg(chartRange);
  const bucketMs = cfg.ms;
  const maxBars = 120;

  const refPrice = Math.max(
    0.00000001,
    safeNum(coin?.priceUsd || coin?.lastPriceUsd || coin?.price || 0, 0.00000001)
  );

  const cleanPx = (v) => {
    const x = Math.max(0.00000001, safeNum(v, refPrice));
    if (refPrice > 0 && x > refPrice * 250) return refPrice;
    if (refPrice > 0 && x < refPrice / 250) return refPrice;
    return x;
  };

  const cleanVol = (row, high, low) => {
    const direct = safeNum(row?.volume ?? row?.vol ?? row?.v, 0);
    if (direct > 0) return direct;
    return Math.max(0, Math.abs(high - low) * 1_000_000);
  };

  const sorted = [...list]
    .map((c) => {
      const close = cleanPx(c.close);
      const rawHigh = cleanPx(c.high);
      const rawLow = cleanPx(c.low);
      return {
        time: Math.floor(safeNum(c.time, 0) / bucketMs) * bucketMs,
        rawOpen: cleanPx(c.open),
        rawHigh,
        rawLow,
        close,
        volume: cleanVol(c, rawHigh, rawLow),
      };
    })
    .filter((c) => c.time > 0 && c.rawOpen > 0 && c.rawHigh > 0 && c.rawLow > 0 && c.close > 0)
    .sort((a, b) => a.time - b.time);

  if (!sorted.length) return [];

  const merged = [];
  let chainPrevClose = null;

  for (const row of sorted) {
    const last = merged[merged.length - 1];
    const open = chainPrevClose !== null ? chainPrevClose : row.rawOpen;
    const high = Math.max(open, row.close, row.rawHigh);
    const low = Math.min(open, row.close, row.rawLow);

    if (last && last.time === row.time) {
      last.high = Math.max(last.high, high);
      last.low = Math.min(last.low, low);
      last.close = row.close;
      last.volume = Math.max(last.volume || 0, row.volume || 0);
    } else {
      merged.push({
        time: row.time,
        open,
        high,
        low,
        close: row.close,
        volume: row.volume || 0,
      });
    }

    chainPrevClose = row.close;
  }

  const nowBucket = Math.floor(Date.now() / bucketMs) * bucketMs;
  const start = Math.max(merged[0].time, nowBucket - (maxBars - 1) * bucketMs);

  const normalized = [];
  let cursor = start;
  let i = 0;
  let prevClose = merged[0].close;

  while (i < merged.length && merged[i].time < start) {
    prevClose = merged[i].close;
    i += 1;
  }

  while (cursor <= nowBucket) {
    const row = merged[i];

    if (row && row.time === cursor) {
      normalized.push(row);
      prevClose = row.close;
      i += 1;
    } else {
      normalized.push({
        time: cursor,
        open: prevClose,
        high: prevClose,
        low: prevClose,
        close: prevClose,
        volume: 0,
      });
    }

    cursor += bucketMs;
  }

  // Live stitch: when coin price moves (WS / trade) before candle API refetches,
  // paint the current bucket so buy→sell shows a real candle on every device.
  const out = normalized.slice(-maxBars);
  if (out.length && refPrice > 0) {
    const last = out[out.length - 1];
    const live = cleanPx(refPrice);
    if (Math.abs(live - last.close) / Math.max(last.close, 1e-12) > 0.00001) {
      last.close = live;
      last.high = Math.max(last.high, last.open, live);
      last.low = Math.min(last.low, last.open, live);
    }
  }

  return out;
}

export function toCandleSeriesPoints(candleData) {
  const unique = [];
  const seen = new Set();

  for (const c of candleData || []) {
    const t = Math.floor(Number(c.time) / 1000);
    if (
      !seen.has(t) &&
      Number.isFinite(c.open) &&
      Number.isFinite(c.high) &&
      Number.isFinite(c.low) &&
      Number.isFinite(c.close)
    ) {
      seen.add(t);
      unique.push({
        time: t,
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
      });
    }
  }

  return unique;
}

export function toVolumeSeriesPoints(candleData, upColor, downColor) {
  const points = [];

  for (const c of candleData || []) {
    const t = Math.floor(Number(c.time) / 1000);
    const vol = Math.max(0, Number(c.volume || 0));
    if (!Number.isFinite(t) || vol <= 0) continue;

    const up = Number(c.close) >= Number(c.open);
    points.push({
      time: t,
      value: vol,
      color: up ? upColor : downColor,
    });
  }

  return points;
}
