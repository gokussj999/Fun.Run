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
  return CHART_TF_API_MAP[String(range || "5M").toUpperCase()] || "5m";
}

function cleanPxLoose(v, fallback) {
  const x = safeNum(v, 0);
  if (x > 0 && Number.isFinite(x)) return x;
  return Math.max(1e-12, safeNum(fallback, 1e-12));
}

/** Visible history length per TF */
export function maxBarsForTf(chartRange) {
  const key = String(chartRange || "5M").toUpperCase();
  switch (key) {
    case "5M":
      return 576;
    case "15M":
      return 384;
    case "1H":
      return 168;
    case "4H":
      return 180;
    case "1D":
      return 90;
    case "1W":
      return 52;
    case "1M":
      return 36;
    default:
      return 200;
  }
}

/**
 * Continuous TF candles from first activity → now.
 * NEVER mix coin.priceUsd / live FX into open/close — that painted buys red.
 * Opens chain only from API candle closes.
 */
export function normalizeCandleData(rawList, chartRange, coin, nowMs = Date.now()) {
  const list = Array.isArray(rawList) ? rawList : [];
  const cfg = getTimeframeCfg(chartRange);
  const bucketMs = cfg.ms;
  const maxBars = maxBarsForTf(chartRange);

  const nowBucket = Math.floor(nowMs / bucketMs) * bucketMs;
  const createdMs = Math.max(0, safeNum(coin?.createdAt || coin?.created_at, 0));
  const createdBucket = createdMs > 0 ? Math.floor(createdMs / bucketMs) * bucketMs : 0;

  const byBucket = new Map();
  for (const c of list) {
    let rawT = safeNum(c.time, 0);
    if (rawT > 0 && rawT < 1e12) rawT *= 1000;
    const time = Math.floor(rawT / bucketMs) * bucketMs;
    if (time <= 0) continue;

    const close = cleanPxLoose(c.close, 0);
    if (!(close > 0)) continue;
    const open = cleanPxLoose(c.open, close);
    const high = Math.max(open, close, cleanPxLoose(c.high, close));
    const low = Math.min(open, close, cleanPxLoose(c.low, close));
    const volume = Math.max(0, safeNum(c.volume ?? c.vol ?? c.v ?? c.volumeSol, 0));
    const trades = Math.max(0, safeNum(c.tradesCount ?? c.trades_count, 0));

    const prev = byBucket.get(time);
    if (!prev) {
      byBucket.set(time, { time, open, high, low, close, volume, trades });
    } else {
      prev.high = Math.max(prev.high, high);
      prev.low = Math.min(prev.low, low);
      prev.close = close;
      prev.volume += volume;
      prev.trades += trades;
    }
  }

  const times = [...byBucket.keys()].sort((a, b) => a - b);
  const firstTrade = times[0] || 0;
  if (!firstTrade) return [];

  let start = nowBucket - (maxBars - 1) * bucketMs;
  if (createdBucket > 0) start = Math.max(start, createdBucket);
  start = Math.max(start, firstTrade);
  start = Math.floor(start / bucketMs) * bucketMs;

  // Seed carry from candle history only — never live USD.
  let carry = byBucket.get(firstTrade)?.open || byBucket.get(firstTrade)?.close;
  for (const t of times) {
    if (t < start) carry = byBucket.get(t)?.close || carry;
    else break;
  }
  if (!(carry > 0)) carry = byBucket.get(firstTrade)?.close;

  const out = [];
  for (let t = start; t <= nowBucket; t += bucketMs) {
    const row = byBucket.get(t);
    const hasActivity =
      row && (row.volume > 0 || row.trades > 0 || row.close !== row.open || row.high !== row.low);

    if (hasActivity) {
      const open = carry;
      const close = row.close;
      out.push({
        time: t,
        open,
        high: Math.max(open, close, row.high),
        low: Math.min(open, close, row.low),
        close,
        volume: row.volume || 0,
        quiet: false,
      });
      carry = close;
    } else {
      out.push({
        time: t,
        open: carry,
        high: carry,
        low: carry,
        close: carry,
        volume: 0,
        quiet: true,
      });
    }
  }

  return out.slice(-maxBars);
}

/** Quiet = flat khali body. Trade = real OHLC. */
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
      const open = Number(c.open);
      const close = Number(c.close);
      let high = Math.max(open, close, Number(c.high));
      let low = Math.min(open, close, Number(c.low));

      if (c.quiet) {
        unique.push({ time: t, open, high: open, low: open, close: open });
      } else {
        if (!(high > low)) {
          high = Math.max(open, close);
          low = Math.min(open, close);
        }
        unique.push({ time: t, open, high, low, close });
      }
    }
  }

  return unique;
}

export function toVolumeSeriesPoints(candleData, upColor, downColor) {
  const points = [];

  for (const c of candleData || []) {
    if (c?.quiet) continue;
    const t = Math.floor(Number(c.time) / 1000);
    const vol = Math.max(0, Number(c.volume || 0));
    if (!(t > 0) || !(vol > 0)) continue;
    const up = Number(c.close) >= Number(c.open);
    points.push({ time: t, value: vol, color: up ? upColor : downColor });
  }

  return points;
}
