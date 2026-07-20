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

function isActiveBar(c) {
  return (
    safeNum(c.volume, 0) > 0.0000001 ||
    Math.abs(Number(c.close) - Number(c.open)) > 0 ||
    Number(c.high) > Number(c.low)
  );
}

/**
 * Build OHLCV for the selected timeframe.
 * - Keeps real trade / moved candles
 * - Drops quiet gap-fill stubs from the API (those looked like thin green sticks)
 * - Forward-fills only after the last real bar through "now" so TF can advance without a trade
 * - Open chains from previous close; live price stitches the active bucket only
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

  const sorted = [...list]
    .map((c) => {
      const close = cleanPxLoose(c.close, livePrice);
      const open = cleanPxLoose(c.open, close);
      const high = Math.max(open, close, cleanPxLoose(c.high, close));
      const low = Math.min(open, close, cleanPxLoose(c.low, close));
      const volDirect = safeNum(c.volume ?? c.vol ?? c.v ?? c.volumeSol, 0);
      return {
        time: Math.floor(safeNum(c.time, 0) / bucketMs) * bucketMs,
        open,
        high,
        low,
        close,
        volume: Math.max(0, volDirect),
      };
    })
    .filter((c) => c.time > 0 && c.open > 0 && c.high > 0 && c.low > 0 && c.close > 0)
    .sort((a, b) => a.time - b.time);

  const nowBucket = Math.floor(nowMs / bucketMs) * bucketMs;

  if (!sorted.length) {
    return [
      {
        time: nowBucket,
        open: livePrice,
        high: livePrice,
        low: livePrice,
        close: livePrice,
        volume: 0,
      },
    ];
  }

  // Merge same-bucket rows; chain open from previous close
  const merged = [];
  let prevClose = null;
  for (const row of sorted) {
    const open = prevClose != null ? prevClose : row.open;
    const close = row.close;
    const high = Math.max(open, close, row.high);
    const low = Math.min(open, close, row.low);
    const last = merged[merged.length - 1];

    if (last && last.time === row.time) {
      last.high = Math.max(last.high, high);
      last.low = Math.min(last.low, low);
      last.close = close;
      last.volume = Math.max(last.volume || 0, row.volume || 0);
      prevClose = last.close;
    } else {
      merged.push({
        time: row.time,
        open,
        high,
        low,
        close,
        volume: row.volume || 0,
      });
      prevClose = close;
    }
  }

  // Drop quiet API gap-fills; keep real activity only
  const windowStart = nowBucket - (maxBars - 1) * bucketMs;
  let trades = merged.filter((c) => c.time >= windowStart && isActiveBar(c));
  if (!trades.length) {
    const last = merged[merged.length - 1];
    trades = [
      {
        time: Math.min(Math.max(last.time, windowStart), nowBucket),
        open: last.close,
        high: last.close,
        low: last.close,
        close: last.close,
        volume: 0,
      },
    ];
  }

  let carry = trades[0].open;
  const chained = trades.map((row, idx) => {
    if (idx === 0) {
      carry = row.close;
      return { ...row, open: row.open, high: Math.max(row.open, row.close, row.high), low: Math.min(row.open, row.close, row.low) };
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
    };
    carry = close;
    return next;
  });

  // Forward-fill last trade → current bucket (new candle on the clock, no buy needed)
  const out = [...chained];
  let cursor = out[out.length - 1].time + bucketMs;
  let flatCarry = out[out.length - 1].close;
  while (cursor <= nowBucket) {
    out.push({
      time: cursor,
      open: flatCarry,
      high: flatCarry,
      low: flatCarry,
      close: flatCarry,
      volume: 0,
    });
    cursor += bucketMs;
  }

  const trimmed = out.slice(-maxBars);
  if (trimmed.length && livePrice > 0) {
    const last = trimmed[trimmed.length - 1];
    if (last.time === nowBucket) {
      last.close = livePrice;
      last.high = Math.max(last.open, last.high, livePrice);
      last.low = Math.min(last.open, last.low, livePrice);
    }
  }

  return trimmed;
}

/** Flat/doji bars stay equal OHLC (tick) — no artificial pad / fake green sticks. */
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
      if (!(high > low)) {
        high = open;
        low = open;
      }
      unique.push({ time: t, open, high, low, close });
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
