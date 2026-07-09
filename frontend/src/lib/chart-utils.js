import { safeNum } from "./coin-display.js";

export const CHART_TIMEFRAMES = {
  "5M": { ms: 5 * 60 * 1000, label: "5m", bars: 100 },
  "15M": { ms: 15 * 60 * 1000, label: "15m", bars: 100 },
  "1H": { ms: 60 * 60 * 1000, label: "1h", bars: 100 },
  "4H": { ms: 4 * 60 * 60 * 1000, label: "4h", bars: 100 },
  "1D": { ms: 24 * 60 * 60 * 1000, label: "1D", bars: 100 },
  "1W": { ms: 7 * 24 * 60 * 60 * 1000, label: "1W", bars: 100 },
  "1M": { ms: 30 * 24 * 60 * 60 * 1000, label: "1M", bars: 100 },
};

export function getTimeframeCfg(range) {
  return CHART_TIMEFRAMES[String(range || "1D").toUpperCase()] || CHART_TIMEFRAMES["1D"];
}

export function bucketStartMs(ts, bucketMs) {
  const n = safeNum(ts, Date.now());
  return Math.floor(n / bucketMs) * bucketMs;
}

export function rangePointsFor(chartRange) {
  switch (String(chartRange || "1D").toUpperCase()) {
    case "5M":
      return 20;
    case "15M":
      return 32;
    case "1H":
      return 48;
    case "4H":
      return 72;
    case "1D":
      return 96;
    case "1W":
      return 132;
    case "1M":
      return 180;
    default:
      return 96;
  }
}
