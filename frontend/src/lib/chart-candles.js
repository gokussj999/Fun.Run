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
 * Continuous OHLCV for every selected timeframe bucket.
 * Quiet buckets (no trades) are filled so 15m/1h/etc advance on the clock.
 */
export function normalizeCandleData(rawList, chartRange, coin, nowMs = Date.now()) {
  const list = Array.isArray(rawList) ? rawList : [];
  const cfg = getTimeframeCfg(chartRange);
  const bucketMs = cfg.ms;
  // Enough bars to fill the visible day for 5m/15m/1h without drowning the chart
  const maxBars = cfg.ms >= 60 * 60 * 1000 ? 72 : cfg.ms >= 15 * 60 * 1000 ? 96 : 96;

  const livePrice = Math.max(
    0.00000001,
    safeNum(coin?.priceUsd || coin?.lastPriceUsd || coin?.price || 0, 0.00000001)
  );

  const nowBucket = Math.floor(nowMs / bucketMs) * bucketMs;
  const windowStart = nowBucket - (maxBars - 1) * bucketMs;

  const byBucket = new Map();
  for (const c of list) {
    let rawT = safeNum(c.time, 0);
    // Guard: some feeds send seconds
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

  if (out.length && livePrice > 0) {
    const last = out[out.length - 1];
    if (last.time === nowBucket) {
      const moved = Math.abs(livePrice - last.open) / Math.max(last.open, 1e-12) > 1e-8;
      if (moved || last.volume > 0) {
        last.close = livePrice;
        last.high = Math.max(last.open, last.high, livePrice);
        last.low = Math.min(last.open, last.low, livePrice);
        last.quiet = false;
      } else {
        last.close = last.open;
        last.high = last.open;
        last.low = last.open;
        last.quiet = true;
      }
    }
  }

  return out;
}

const QUIET_CANDLE = "#64748b";

/**
 * Trade candles = green/red bodies.
 * Quiet TF fillers = gray wick ticks (MUST have high≠low or LWC paints nothing).
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
      let open = Number(c.open);
      let close = Number(c.close);
      let high = Math.max(open, close, Number(c.high));
      let low = Math.min(open, close, Number(c.low));
      const quiet = Boolean(c.quiet) || (!(high > low) && !(Number(c.volume) > 0));

      if (quiet) {
        // Equal OHLC is invisible in lightweight-charts → tiny gray wick so
        // every 15m/1h slot is actually visible on the timeline.
        const mid = Math.max(open, 1e-12);
        const tick = Math.max(mid * 0.0012, 1e-12);
        open = mid;
        close = mid;
        high = mid + tick;
        low = Math.max(1e-12, mid - tick);
      } else if (!(high > low)) {
        const mid = Math.max(open, close, 1e-12);
        const tick = Math.max(mid * 0.0004, 1e-12);
        high = mid + tick;
        low = Math.max(1e-12, mid - tick);
      }

      const point = { time: t, open, high, low, close };

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
