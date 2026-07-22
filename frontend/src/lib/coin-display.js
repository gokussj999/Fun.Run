export function safeNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export function fmtNum(n, digits = 2) {
  const x = Number(n || 0);
  if (!Number.isFinite(x)) return "0";
  return x.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function fmtUsd(n) {
  const x = Number(n || 0);
  if (!Number.isFinite(x) || x <= 0) return "$0";
  if (x >= 1_000_000_000) return `$${(x / 1_000_000_000).toFixed(2)}B`;
  if (x >= 1_000_000) return `$${(x / 1_000_000).toFixed(2)}M`;
  if (x >= 1_000) return `$${(x / 1_000).toFixed(2)}K`;
  if (x >= 1) return `$${x.toFixed(2)}`;
  if (x >= 0.01) return `$${x.toFixed(4)}`;
  if (x >= 0.0001) return `$${x.toFixed(6)}`;
  if (x >= 0.000001) return `$${x.toFixed(8)}`;
  return `$${x.toFixed(10)}`;
}

export function fmtSol(n) {
  const x = Number(n || 0);
  if (!Number.isFinite(x) || x <= 0) return "0";
  if (x >= 1000) return fmtNum(x, 0);
  if (x >= 1) return fmtNum(x, 3);
  if (x >= 0.01) return fmtNum(x, 4);
  return fmtNum(x, 6);
}

/** Fun.Run coin id — display boosts are coin-page Overview only */
export const RUN_COIN_ID = "7cc0f755e5a5475ca8345a062d5c2475";

/** Cosmetic targets — never write these into DB / portfolio math */
export const RUN_PAGE_MC_USD = 137_000;
export const RUN_PAGE_LIQUIDITY_SOL = 367;

function isRunCoin(coin) {
  const id = String(coin?.id || "").trim();
  if (id && id === RUN_COIN_ID) return true;
  return String(coin?.symbol || "").trim().toUpperCase() === "RUN";
}

/**
 * RUN display boosts — ONLY Coin Overview cards (MC / Liquidity / Volume).
 * Portfolio, profile, home, header, admin, charts = raw DB values.
 */
export function getCoinPageVolumeSol(coin) {
  const raw = Math.max(0, safeNum(coin?.volumeSol ?? coin?.volume_sol, 0));
  return isRunCoin(coin) ? raw * 10 : raw;
}

export function getCoinPageMarketCapUsd(coin) {
  const raw = Math.max(0, safeNum(coin?.mc ?? coin?.market_cap, 0));
  return isRunCoin(coin) ? RUN_PAGE_MC_USD : raw;
}

export function getCoinPageLiquiditySol(coin) {
  const raw = Math.max(
    0,
    safeNum(coin?.solReserve ?? coin?.reserve_sol, 0) + safeNum(coin?.vSol ?? coin?.v_sol, 0)
  );
  return isRunCoin(coin) ? RUN_PAGE_LIQUIDITY_SOL : raw;
}

export function timeAgo(ts) {
  const n = Number(ts || 0);
  if (!Number.isFinite(n) || n <= 0) return "just now";

  const diff = Math.max(0, Date.now() - n);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  const days = Math.floor(hrs / 24);
  const remH = hrs % 24;
  // Show "2d 11h" so age doesn't look stuck / under-counted
  if (days < 30) return remH > 0 ? `${days}d ${remH}h ago` : `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

function normalizeChartPoints(chart) {
  if (!Array.isArray(chart) || !chart.length) return [];
  const now = Date.now();
  const out = [];
  for (let i = 0; i < chart.length; i++) {
    const x = chart[i];
    if (x && typeof x === "object") {
      const p = Math.max(0, safeNum(x.p ?? x.price ?? x.priceUsd, 0));
      const t = Math.max(0, safeNum(x.t ?? x.ts ?? x.time, 0));
      if (p > 0) out.push({ t: t || now - (chart.length - i) * 60_000, p });
      continue;
    }
    const p = Math.max(0, safeNum(x, 0));
    if (p > 0) out.push({ t: now - (chart.length - 1 - i) * 60_000, p });
  }
  return out;
}

/**
 * True 24h move: prefer server `change24hPct`, else compute from timestamped chart.
 * Legacy number-only charts fall back to launch→now if coin age < 24h, else last points.
 */
export function getCoin24hMovePct(c) {
  if (c?.change24hPct != null && Number.isFinite(Number(c.change24hPct))) {
    const direct = Number(c.change24hPct);
    return Math.max(-99.99, Math.min(9999, direct));
  }

  const end = Math.max(
    0.00000001,
    safeNum(c?.priceUsd || c?.lastPriceUsd || c?.price, 0)
  );
  const points = normalizeChartPoints(c?.chart);
  if (!(end > 0)) return 0;

  const now = Date.now();
  const windowStart = now - 24 * 60 * 60 * 1000;
  const created = Math.max(0, safeNum(c?.createdAt || c?.created_at, 0));

  if (created > 0 && created > windowStart) {
    const start = Math.max(0.00000001, safeNum(points[0]?.p, end));
    const pct = ((end - start) / start) * 100;
    return Number.isFinite(pct) ? Math.max(-99.99, Math.min(9999, pct)) : 0;
  }

  if (points.length < 2) return 0;

  let start = null;
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].t <= windowStart) {
      start = points[i].p;
      break;
    }
  }
  if (start == null) start = points[0].p;

  start = Math.max(0.00000001, safeNum(start, end));
  const pct = ((end - start) / start) * 100;
  return Number.isFinite(pct) ? Math.max(-99.99, Math.min(9999, pct)) : 0;
}

export function getCoinAgeLabel(c) {
  return timeAgo(c?.createdAt || c?.created_at);
}

export function coinSubtitle(c) {
  const move24h = getCoin24hMovePct(c);
  const sign = move24h > 0 ? "+" : "";
  const age = getCoinAgeLabel(c);
  return `Age ${age} • 24h ${sign}${move24h.toFixed(2)}%`;
}
