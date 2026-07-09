import { fmtNum, getCoin24hMovePct, safeNum } from "./coin-display.js";

function txSide(tx) {
  return String(tx?.side || tx?.type || "").toUpperCase();
}

function holderCount(coin) {
  const holders = coin?.holders;
  if (!holders || typeof holders !== "object" || Array.isArray(holders)) return 0;
  return Object.keys(holders).filter((key) => safeNum(holders[key], 0) > 0).length;
}

export function buildCreatorSnapshot({
  profile,
  myCoins = [],
  txs = [],
  solPriceUsd = 0,
}) {
  const coins = Array.isArray(myCoins) ? myCoins : [];
  const rewardsFromCoins = coins.reduce((sum, coin) => sum + safeNum(coin?.creatorRewardsSol, 0), 0);
  const totalRewardsSol = Math.max(safeNum(profile?.creatorRewardsSol, 0), rewardsFromCoins);
  const totalRewardsUsd = totalRewardsSol * solPriceUsd;

  const totalMcUsd = coins.reduce((sum, coin) => sum + safeNum(coin?.mc, 0), 0);
  const totalVolumeSol = coins.reduce((sum, coin) => sum + safeNum(coin?.volumeSol, 0), 0);
  const totalVolumeUsd = totalVolumeSol * solPriceUsd;

  const coinRows = coins.map((coin) => {
    const rewardsSol = safeNum(coin?.creatorRewardsSol, 0);
    const mcUsd = safeNum(coin?.mc, 0);
    const volumeSol = safeNum(coin?.volumeSol, 0);
    const move24h = getCoin24hMovePct(coin);

    return {
      coin,
      mcUsd,
      volumeSol,
      volumeUsd: volumeSol * solPriceUsd,
      rewardsSol,
      rewardsUsd: rewardsSol * solPriceUsd,
      move24h,
      holderCount: holderCount(coin),
      lastTradeAt: safeNum(coin?.lastTradeAt, 0),
      createdAt: safeNum(coin?.createdAt, coin?.created_at ? new Date(coin.created_at).getTime() : 0),
    };
  });

  const earningsByCoin = coinRows
    .filter((row) => row.rewardsSol > 0)
    .map((row) => ({
      id: String(row.coin?.id || ""),
      label: row.coin?.symbol || row.coin?.name || "Coin",
      valueSol: row.rewardsSol,
      valueUsd: row.rewardsUsd,
      pct: totalRewardsSol > 0 ? (row.rewardsSol / totalRewardsSol) * 100 : 0,
    }))
    .sort((a, b) => b.valueSol - a.valueSol);

  const myCoinIds = new Set(coins.map((coin) => String(coin?.id || "")));

  const tradeActivity = (txs || [])
    .filter((tx) => myCoinIds.has(String(tx?.coinId || "")))
    .map((tx, idx) => ({
      id: tx.id || `creator-trade-${idx}`,
      kind: "TRADE",
      side: txSide(tx),
      coinId: tx.coinId,
      coinName: tx.coinName || tx.name || tx.symbol,
      symbol: tx.symbol,
      logo: tx.logo,
      sol: safeNum(tx.sol, 0),
      tokens: safeNum(tx.tokens, 0),
      ts: safeNum(tx.ts || tx.t, 0),
    }));

  const launchActivity = coins.map((coin, idx) => ({
    id: `launch-${coin?.id || idx}`,
    kind: "LAUNCH",
    coinId: coin?.id,
    coin,
    ts: safeNum(coin?.createdAt, coin?.created_at ? new Date(coin.created_at).getTime() : 0),
  }));

  const recentActivity = [...tradeActivity, ...launchActivity]
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))
    .slice(0, 25);

  const weighted24hUsd = coinRows.reduce((sum, row) => sum + row.mcUsd * (row.move24h / 100), 0);
  const change24hPct = totalMcUsd > 0 ? (weighted24hUsd / totalMcUsd) * 100 : null;

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activeCoins7d = coinRows.filter((row) => row.lastTradeAt >= weekAgo).length;

  const performanceRows = [...coinRows].sort((a, b) => b.mcUsd - a.mcUsd);
  const myCoinsRows = [...coinRows].sort((a, b) => b.createdAt - a.createdAt);

  return {
    coinsCount: coins.length,
    totalRewardsSol,
    totalRewardsUsd,
    totalMcUsd,
    totalVolumeSol,
    totalVolumeUsd,
    coinRows: myCoinsRows,
    performanceRows,
    earningsByCoin,
    recentActivity,
    change24hPct,
    activeCoins7d,
    topPerformer: performanceRows[0] || null,
    hasCoins: coins.length > 0,
  };
}

export function formatSignedPct(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
