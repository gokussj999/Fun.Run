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

/**
 * Chart candles:
 * - Real trade bars stay as normal green/red OHLC
 * - After the last trade, empty TF buckets forward-fill as clean flat
 *   "khali" candles (open=high=low=close) so the clock advances
 * - Do NOT backfill the whole history with quiet dojis (that looked unprofessional)
 */
export function normalizeCandleData(rawList, chartRange, coin, nowMs = Date.now()) {
  const list = Array.isArray(rawList) ? rawList : [];
  const cfg = getTimeframeCfg(chartRange);
  const bucketMs = cfg.ms;
  const maxBars = 120;

  const livePrice = Math.max(
    0.00000001,
    safeNum(coin?.priceUsd || coin?.lastPriceUsd || coin?.price || 0, 0.00000001)
  );

  const nowBucket = Math.floor(nowMs / bucketMs) * bucketMs;

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

  // Only keep buckets that had real activity (trades / move)
  const activity = [...byBucket.values()]
    .filter((r) => r.volume > 0 || r.trades > 0 || r.close !== r.open || r.high !== r.low)
    .sort((a, b) => a.time - b.time);

  if (!activity.length) {
    return [
      {
        time: nowBucket,
        open: livePrice,
        high: livePrice,
        low: livePrice,
        close: livePrice,
        volume: 0,
        quiet: true,
      },
    ];
  }

  const windowStart = nowBucket - (maxBars - 1) * bucketMs;
  const trades = activity.filter((r) => r.time >= windowStart);
  const seed = trades.length ? trades : [activity[activity.length - 1]];

  let carry = seed[0].open;
  const chained = seed.map((row, idx) => {
    if (idx === 0) {
      carry = row.close;
      return {
        time: row.time,
        open: row.open,
        high: Math.max(row.open, row.close, row.high),
        low: Math.min(row.open, row.close, row.low),
        close: row.close,
        volume: row.volume || 0,
        quiet: false,
      };
    }
    const open = carry;
    const close = row.close;
    const next = {
      time: row.time,
      open,
      high: Math.max(open, close, row.high),
      low: Math.min(open, close, row.low),
      close,
      volume: row.volume || 0,
      quiet: false,
    };
    carry = close;
    return next;
  });

  // Forward-fill ONLY after last trade → now: clean empty candles on the clock
  const out = [...chained];
  let cursor = out[out.length - 1].time + bucketMs;
  let flat = out[out.length - 1].close;
  while (cursor <= nowBucket) {
    out.push({
      time: cursor,
      open: flat,
      high: flat,
      low: flat,
      close: flat,
      volume: 0,
      quiet: true,
    });
    cursor += bucketMs;
  }

  const trimmed = out.slice(-maxBars);

  // Live stitch active bucket — only if price actually moved
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

/**
 * Khali (quiet) candles: true flat OHLC → LWC draws a clean horizontal body.
 * No fake wicks (those looked like unprofessional doji sticks).
 */
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
      const quiet = Boolean(c.quiet);

      if (quiet) {
        // Clean empty candle — flat body only
        unique.push({
          time: t,
          open,
          high: open,
          low: open,
          close: open,
        });
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
