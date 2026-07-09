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
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export function getCoin24hMovePct(c) {
  const chart = Array.isArray(c?.chart) ? c.chart.map((x) => safeNum(x, 0)).filter((x) => x > 0) : [];
  if (chart.length < 2) return 0;
  const lookback = Math.min(24, chart.length - 1);
  const start = Math.max(0.00000001, safeNum(chart[chart.length - 1 - lookback], chart[0]));
  const end = Math.max(0.00000001, safeNum(chart[chart.length - 1], start));
  const pct = ((end - start) / start) * 100;
  return Number.isFinite(pct) ? Math.max(-99.99, Math.min(199.99, pct)) : 0;
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
