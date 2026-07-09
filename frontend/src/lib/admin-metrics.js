import { getCoin24hMovePct, safeNum } from "./coin-display.js";

function uniqueCreators(coins = []) {
  const set = new Set();
  (coins || []).forEach((coin) => {
    const w = String(coin?.creatorWallet || "").trim();
    if (w) set.add(w);
  });
  return set.size;
}

function uniqueHolders(coins = []) {
  const set = new Set();
  (coins || []).forEach((coin) => {
    const holders = coin?.holders;
    if (!holders || typeof holders !== "object" || Array.isArray(holders)) return;
    Object.keys(holders).forEach((key) => {
      if (safeNum(holders[key], 0) > 0) set.add(key);
    });
  });
  return set.size;
}

function tradeSide(tx) {
  return String(tx?.side || tx?.type || "").toUpperCase();
}

export function buildAdminSnapshot({
  coins = [],
  recentTrades = [],
  hotCoins = [],
  solPriceUsd = 0,
  profile = null,
  coinsHasMore = false,
  wsConnected = false,
}) {
  const list = Array.isArray(coins) ? coins : [];
  const trades = Array.isArray(recentTrades) ? recentTrades : [];

  const coinsCount = list.length;
  const creatorsCount = uniqueCreators(list);
  const holdersCount = uniqueHolders(list);

  const totalMcUsd = list.reduce((sum, coin) => sum + safeNum(coin?.mc, 0), 0);
  const totalVolumeSol = list.reduce((sum, coin) => sum + safeNum(coin?.volumeSol, 0), 0);
  const totalVolumeUsd = totalVolumeSol * solPriceUsd;
  const totalCreatorRewardsSol = list.reduce(
    (sum, coin) => sum + safeNum(coin?.creatorRewardsSol, 0),
    0
  );

  const weighted24hUsd = list.reduce((sum, coin) => {
    const mc = safeNum(coin?.mc, 0);
    return sum + mc * (getCoin24hMovePct(coin) / 100);
  }, 0);
  const marketMove24hPct = totalMcUsd > 0 ? (weighted24hUsd / totalMcUsd) * 100 : null;

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const launches7d = list.filter(
    (coin) => safeNum(coin?.createdAt, coin?.created_at ? new Date(coin.created_at).getTime() : 0) >= weekAgo
  ).length;
  const activeCoins24h = list.filter((coin) => safeNum(coin?.lastTradeAt, 0) >= dayAgo).length;

  const topByVolume = [...list]
    .sort((a, b) => safeNum(b?.volumeSol, 0) - safeNum(a?.volumeSol, 0))
    .slice(0, 8);

  const topByMc = [...list]
    .sort((a, b) => safeNum(b?.mc, 0) - safeNum(a?.mc, 0))
    .slice(0, 8);

  const latestLaunches = [...list]
    .sort(
      (a, b) =>
        safeNum(b?.createdAt, b?.created_at ? new Date(b.created_at).getTime() : 0) -
        safeNum(a?.createdAt, a?.created_at ? new Date(a.created_at).getTime() : 0)
    )
    .slice(0, 8);

  const tradeRows = trades.slice(0, 20).map((tx, idx) => ({
    id: tx.id || tx.txHash || `admin-trade-${idx}`,
    side: tradeSide(tx),
    coinId: tx.coinId || tx.coin_id,
    symbol: tx.symbol || tx.coinSymbol || tx.name || "—",
    name: tx.coinName || tx.name || tx.symbol || "Unknown",
    logo: tx.logo || "",
    sol: safeNum(tx.sol || tx.amountSol || tx.amount, 0),
    tokens: safeNum(tx.tokens || tx.tokenAmount, 0),
    ts: safeNum(tx.ts || tx.t || tx.createdAt || (tx.created_at ? new Date(tx.created_at).getTime() : 0), 0),
  }));

  const liveTradeVolumeSol = tradeRows.reduce((sum, row) => sum + row.sol, 0);

  const ownerRewardsSol = Math.max(0, safeNum(profile?.ownerRewardsSol, 0));

  return {
    coinsCount,
    creatorsCount,
    holdersCount,
    totalMcUsd,
    totalVolumeSol,
    totalVolumeUsd,
    totalCreatorRewardsSol,
    marketMove24hPct,
    launches7d,
    activeCoins24h,
    topByVolume,
    topByMc,
    latestLaunches,
    tradeRows,
    liveTradeVolumeSol,
    liveTradeCount: tradeRows.length,
    hotCount: Array.isArray(hotCoins) ? hotCoins.length : 0,
    ownerRewardsSol,
    ownerRewardsUsd: ownerRewardsSol * solPriceUsd,
    coinsHasMore: Boolean(coinsHasMore),
    wsConnected: Boolean(wsConnected),
    hasCoins: coinsCount > 0,
    hasTrades: tradeRows.length > 0,
  };
}

export function formatSignedPct(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
