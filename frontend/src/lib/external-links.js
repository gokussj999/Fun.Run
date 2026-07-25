/**
 * External Solana market / swap deep-links (no deps).
 */

export function dexscreenerUrl(mint) {
  const m = String(mint || "").trim();
  if (!m) return "";
  return `https://dexscreener.com/solana/${m}`;
}

export function jupiterSwapUrl(mint) {
  const m = String(mint || "").trim();
  if (!m) return "";
  return `https://jup.ag/swap/SOL-${m}`;
}

export function birdeyeUrl(mint) {
  const m = String(mint || "").trim();
  if (!m) return "";
  return `https://birdeye.so/token/${m}?chain=solana`;
}

export function openExternal(url) {
  const u = String(url || "").trim();
  if (!u) return false;
  window.open(u, "_blank", "noopener,noreferrer");
  return true;
}
