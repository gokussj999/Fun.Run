import { fmtNum, fmtUsd, getCoin24hMovePct, safeNum } from "./coin-display.js";

export function getCoinPriceUsd(c) {
  const direct = safeNum(c?.priceUsd, 0);
  if (direct > 0) return direct;

  const mc = safeNum(c?.mc, 0);
  const total = Math.max(1, safeNum(c?.totalSupply, 1_000_000_000));
  if (mc > 0 && total > 0) return mc / total;

  const chart = Array.isArray(c?.chart) ? c.chart : [];
  const last = chart[chart.length - 1];
  if (last && typeof last === "object") return Math.max(0, safeNum(last.p ?? last.price, 0));
  return Math.max(0, safeNum(last, 0));
}

function resolveCoin(coins, holding) {
  return (
    (coins || []).find((x) => String(x.id) === String(holding?.coinId || holding?.id || holding?.coin?.id)) ||
    holding?.coin ||
    {}
  );
}

function holdingAmount(holding) {
  return Math.max(0, safeNum(holding?.amount, holding?.tokens || holding?.balance || 0));
}

function txSide(tx) {
  return String(tx?.side || tx?.type || "").toUpperCase();
}

export function computeHoldingPnl({ coin, amount, txs = [], solPriceUsd = 0 }) {
  const coinTxs = (txs || []).filter((tx) => String(tx.coinId || "") === String(coin?.id || ""));
  const buySol = coinTxs.filter((tx) => txSide(tx) === "BUY").reduce((sum, tx) => sum + safeNum(tx.sol, 0), 0);
  const sellSol = coinTxs.filter((tx) => txSide(tx) === "SELL").reduce((sum, tx) => sum + safeNum(tx.sol, 0), 0);

  if (buySol <= 0 && sellSol <= 0) {
    return { pnlUsd: null, costUsd: null, hasBasis: false };
  }

  const holdingUsd = amount * getCoinPriceUsd(coin);
  const netCostSol = Math.max(0, buySol - sellSol);
  const costUsd = netCostSol * solPriceUsd;
  const pnlUsd = holdingUsd - costUsd;

  return { pnlUsd, costUsd, hasBasis: true };
}

export function buildPortfolioSnapshot({
  profile,
  coins = [],
  holdings = [],
  txs = [],
  walletHistory = [],
  walletSolBalance = 0,
  solPriceUsd = 0,
}) {
  const walletSol = safeNum(profile?.runBalance, walletSolBalance);
  const walletUsd = walletSol * solPriceUsd;

  const holdingsRows = (holdings || []).map((holding, idx) => {
    const coin = resolveCoin(coins, holding);
    const amount = holdingAmount(holding);
    const valueUsd = amount * getCoinPriceUsd(coin);
    const allocationPct = 0;
    const move24h = getCoin24hMovePct(coin);
    const pnl = computeHoldingPnl({ coin, amount, txs, solPriceUsd });

    return {
      key: String(holding?.coinId || holding?.id || coin?.id || `holding-${idx}`),
      coin,
      amount,
      valueUsd,
      move24h,
      allocationPct,
      pnlUsd: pnl.pnlUsd,
      hasPnlBasis: pnl.hasBasis,
    };
  });

  const holdingsUsd = holdingsRows.reduce((sum, row) => sum + row.valueUsd, 0);
  const creatorUsd = safeNum(profile?.creatorRewardsSol, 0) * solPriceUsd;
  const referralUsd = safeNum(profile?.referralRewardsSol, 0) * solPriceUsd;
  const ownerUsd = safeNum(profile?.ownerRewardsSol, 0) * solPriceUsd;
  const rewardsUsd = creatorUsd + referralUsd + ownerUsd;
  const totalUsd = walletUsd + holdingsUsd + rewardsUsd;

  const allocation = [
    { id: "wallet", label: "SOL Wallet", valueUsd: walletUsd, tone: "wallet" },
    { id: "holdings", label: "Token Holdings", valueUsd: holdingsUsd, tone: "holdings" },
    { id: "creator", label: "Creator Rewards", valueUsd: creatorUsd, tone: "creator" },
    { id: "referral", label: "Affiliate Rewards", valueUsd: referralUsd, tone: "referral" },
    { id: "owner", label: "Owner Rewards", valueUsd: ownerUsd, tone: "owner" },
  ].filter((item) => item.valueUsd > 0);

  const allocationTotal = allocation.reduce((sum, item) => sum + item.valueUsd, 0) || totalUsd || 1;

  const allocationWithPct = allocation.map((item) => ({
    ...item,
    pct: (item.valueUsd / allocationTotal) * 100,
  }));

  holdingsRows.forEach((row) => {
    row.allocationPct = holdingsUsd > 0 ? (row.valueUsd / holdingsUsd) * 100 : 0;
  });

  const pnlRows = holdingsRows.filter((row) => row.hasPnlBasis && row.pnlUsd != null);
  const unrealizedPnlUsd = pnlRows.reduce((sum, row) => sum + row.pnlUsd, 0);
  const hasUnrealizedPnl = pnlRows.length > 0;

  const weighted24hUsd = holdingsRows.reduce((sum, row) => sum + row.valueUsd * (row.move24h / 100), 0);
  const change24hPct = holdingsUsd > 0 ? (weighted24hUsd / holdingsUsd) * 100 : null;

  const tradeActivity = (txs || []).map((tx, idx) => ({
    id: tx.id || `trade-${idx}`,
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

  const walletActivity = (walletHistory || []).map((item, idx) => ({
    id: `wallet-${idx}-${item.txHash || item.createdAt}`,
    kind: "WALLET",
    side: item.type,
    sol: safeNum(item.amount, 0),
    txHash: item.txHash,
    ts: new Date(item.createdAt || 0).getTime(),
  }));

  const recentActivity = [...tradeActivity, ...walletActivity]
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))
    .slice(0, 25);

  return {
    walletSol,
    walletUsd,
    holdingsUsd,
    creatorUsd,
    referralUsd,
    ownerUsd,
    rewardsUsd,
    totalUsd,
    allocation: allocationWithPct,
    holdingsRows: holdingsRows.sort((a, b) => b.valueUsd - a.valueUsd),
    unrealizedPnlUsd,
    hasUnrealizedPnl,
    change24hPct,
    recentActivity,
    holdingsCount: holdingsRows.length,
  };
}

export function formatSignedUsd(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value === 0) return fmtUsd(0);
  const sign = value > 0 ? "+" : "-";
  return `${sign}${fmtUsd(Math.abs(value))}`;
}

export function formatSignedPct(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
