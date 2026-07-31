/** Short contract address: `7cok…pump` */
export function shortCa(mint, head = 4, tail = 4) {
  const s = String(mint || "").trim();
  if (!s) return "";
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export function solscanToken(mint) {
  const m = String(mint || "").trim();
  if (!m) return "";
  return `https://solscan.io/token/${encodeURIComponent(m)}`;
}

export function dexscreener(mint) {
  const m = String(mint || "").trim();
  if (!m) return "";
  return `https://dexscreener.com/solana/${encodeURIComponent(m)}`;
}

export function birdeye(mint) {
  const m = String(mint || "").trim();
  if (!m) return "";
  return `https://birdeye.so/token/${encodeURIComponent(m)}?chain=solana`;
}

export function jupiter(mint) {
  const m = String(mint || "").trim();
  if (!m) return "";
  return `https://jup.ag/swap/SOL-${encodeURIComponent(m)}`;
}

/** Explorer / aggregator links for a mint (empty strings omitted). */
export function getExplorerLinks(mint) {
  const m = String(mint || "").trim();
  if (!m) return [];
  return [
    { id: "solscan", label: "Solscan", href: solscanToken(m) },
    { id: "dexscreener", label: "DexScreener", href: dexscreener(m) },
    { id: "birdeye", label: "Birdeye", href: birdeye(m) },
    { id: "jupiter", label: "Jupiter", href: jupiter(m) },
  ].filter((x) => x.href);
}
