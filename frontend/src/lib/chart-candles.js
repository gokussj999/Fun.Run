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
  return Math.max(0.00000001, safeNum(fallback, 0.00000001));
}

/** How many TF bars to keep on screen (covers multi-day 15m/5m history). */
export function maxBarsForTf(chartRange) {
  const key = String(chartRange || "5M").toUpperCase();
  switch (key) {
    case "5M":
      return 288; // 24h
    case "15M":
      return 384; // 4 days
    case "1H":
      return 168; // 7 days
    case "4H":
      return 180; // 30 days
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
 * Continuous timeframe chart:
 * - Every bucket from start → now has a candle (15m = every 15 min, etc.)
 * - Trade buckets = real green/red OHLC
 * - Empty buckets = clean flat khali candle (no fake wicks / doji sticks)
 */
export function normalizeCandleData(rawList, chartRange, coin, nowMs = Date.now()) {
  const list = Array.isArray(rawList) ? rawList : [];
  const cfg = getTimeframeCfg(chartRange);
  const bucketMs = cfg.ms;
  const maxBars = maxBarsForTf(chartRange);

  const livePrice = Math.max(
    0.00000001,
    safeNum(coin?.priceUsd || coin?.lastPriceUsd || coin?.price || 0, 0.00000001)
  );

  const nowBucket = Math.floor(nowMs / bucketMs) * bucketMs;
  const createdMs = Math.max(
    0,
    safeNum(coin?.createdAt || coin?.created_at, 0)
  );
  const createdBucket = createdMs > 0 ? Math.floor(createdMs / bucketMs) * bucketMs : 0;

  const byBucket = new Map();
  for (const c of list) {
    let rawT = safeNum(c.time, 0);
    if (rawT > 0 && rawT < 1e12) rawT *= 1000;
    const time = Math.floor(rawT / bucketMs) * bucketMs;
    if (time <= 0) continue;

    const close = cleanPxLoose(c.close, livePrice);
    const open = cleanPxLoose(c.open, close);
    const high = Math.max(open, close, cleanPxLoose(c.high, close));
    const low = Math.min(open, close, cleanPxLoose(c.low, close));
    const volume = Math.max(0, safeNum(c.volume ?? c.vol ?? c.v ?? c.volumeSol, 0));
    const trades = Math.max(0, safeNum(c.tradesCount ?? c.trades_count, 0));
    if (!(open > 0 && high > 0 && low > 0 && close > 0)) continue;

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

  // Start from coin create / first trade / maxBars window — whichever is latest
  let start = nowBucket - (maxBars - 1) * bucketMs;
  if (createdBucket > 0) start = Math.max(start, createdBucket);
  if (firstTrade > 0) start = Math.max(start, Math.min(firstTrade, nowBucket));
  // If first trade is inside window, still fill from firstTrade so we don't invent
  // pre-launch empty candles — but DO fill every slot after first trade.
  if (firstTrade > 0) start = Math.max(start, firstTrade);
  start = Math.floor(start / bucketMs) * bucketMs;

  // Seed carry price from nearest bar at/before start
  let carry = livePrice;
  if (times.length) {
    let seed = byBucket.get(times[0]);
    for (const t of times) {
      if (t <= start) seed = byBucket.get(t);
      else break;
    }
    if (seed) carry = seed.close || seed.open || carry;
  }

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
      // Khali candle — flat, clean
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

  if (!out.length) {
    out.push({
      time: nowBucket,
      open: livePrice,
      high: livePrice,
      low: livePrice,
      close: livePrice,
      volume: 0,
      quiet: true,
    });
  }

  const trimmed = out.slice(-maxBars);

  if (trimmed.length && livePrice > 0) {
    const last = trimmed[trimmed.length - 1];
    if (last.time === nowBucket) {
      const moved = Math.abs(livePrice - last.open) / Math.max(last.open, 1e-12) > 1e-8;
      if (moved || last.volume > 0) {
        last.close = livePrice;
        last.high = Math.max(last.open, last.high, livePrice);
        last.low = Math.min(last.open, last.low, livePrice);
        last.quiet = false;
      }
    }
  }

  return trimmed;
}

/** Quiet = flat khali body. No artificial wicks. */
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
