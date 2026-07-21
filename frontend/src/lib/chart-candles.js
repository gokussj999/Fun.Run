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
 * Continuous OHLCV for the selected timeframe.
 * Quiet (0-volume) buckets still exist so the TF clock advances, but they are
 * marked quiet so the chart can paint them gray — not fake green pumps.
 */
export function normalizeCandleData(rawList, chartRange, coin, nowMs = Date.now()) {
  const list = Array.isArray(rawList) ? rawList : [];
  const cfg = getTimeframeCfg(chartRange);
  const bucketMs = cfg.ms;
  const maxBars = 96;

  const livePrice = Math.max(
    0.00000001,
    safeNum(coin?.priceUsd || coin?.lastPriceUsd || coin?.price || 0, 0.00000001)
  );

  const nowBucket = Math.floor(nowMs / bucketMs) * bucketMs;
  const windowStart = nowBucket - (maxBars - 1) * bucketMs;

  const byBucket = new Map();
  for (const c of list) {
    const time = Math.floor(safeNum(c.time, 0) / bucketMs) * bucketMs;
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

  let carry = livePrice;
  const earlier = [...byBucket.keys()].filter((t) => t < windowStart).sort((a, b) => a - b);
  if (earlier.length) {
    carry = byBucket.get(earlier[earlier.length - 1]).close;
  } else {
    const firstIn = [...byBucket.keys()].filter((t) => t >= windowStart).sort((a, b) => a - b);
    if (firstIn.length) carry = byBucket.get(firstIn[0]).open || byBucket.get(firstIn[0]).close;
  }

  const out = [];
  for (let t = windowStart; t <= nowBucket; t += bucketMs) {
    const row = byBucket.get(t);
    const hasActivity = row && (row.volume > 0 || row.trades > 0 || row.close !== row.open || row.high !== row.low);

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

  if (out.length && livePrice > 0) {
    const last = out[out.length - 1];
    if (last.time === nowBucket) {
      const moved = Math.abs(livePrice - last.open) / Math.max(last.open, 1e-12) > 1e-8;
      last.close = livePrice;
      last.high = Math.max(last.open, last.high, livePrice);
      last.low = Math.min(last.open, last.low, livePrice);
      if (moved || last.volume > 0) last.quiet = false;
      else {
        // Keep truly flat live bar as quiet gray doji
        last.close = last.open;
        last.high = last.open;
        last.low = last.open;
        last.quiet = true;
      }
    }
  }

  return out;
}

const QUIET_CANDLE = "#6b7280";

/**
 * Trade candles = green/red. Quiet TF fillers = gray flat ticks (not fake pumps).
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
      const high = Math.max(open, close, Number(c.high));
      const low = Math.min(open, close, Number(c.low));
      const flat = !(high > low);
      const quiet = Boolean(c.quiet) || (flat && !(Number(c.volume) > 0));

      const point = {
        time: t,
        open,
        high: flat ? open : high,
        low: flat ? open : low,
        close: flat ? open : close,
      };

      if (quiet) {
        point.color = QUIET_CANDLE;
        point.borderColor = QUIET_CANDLE;
        point.wickColor = QUIET_CANDLE;
      }

      unique.push(point);
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
