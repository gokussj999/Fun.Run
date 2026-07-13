import type { Prisma } from '@funrun/database';

type Coin = Prisma.CoinGetPayload<Record<string, never>>;
type Candle = Prisma.CandleGetPayload<Record<string, never>>;
type Holding = Prisma.HoldingGetPayload<Record<string, never>>;
type Transaction = Prisma.TransactionGetPayload<Record<string, never>>;
type Profile = Prisma.ProfileGetPayload<Record<string, never>>;

const TOKEN_DECIMALS = 1_000_000;
const TOTAL_SUPPLY = 1_000_000_000;

function dec(n: { toString(): string } | number | null | undefined): number {
  if (n === null || n === undefined) return 0;
  return Number(n.toString());
}

/** Map Prisma coin row to legacy frontend coin shape. */
export function mapCoinToApi(
  coin: Coin,
  opts: { holders?: Record<string, number>; chart?: number[] } = {},
): Record<string, unknown> {
  const vSol = dec(coin.virtualSolReserves) / 1_000_000_000;
  const vTokens = dec(coin.virtualTokenReserves) / TOKEN_DECIMALS;
  const priceSol = vTokens > 0 ? vSol / vTokens : 0;
  const mc = priceSol * TOTAL_SUPPLY;

  return {
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol,
    story: coin.description,
    logo: coin.imageUri,
    metadataUri: coin.metadataUri,
    mintAddress: coin.mintAddress,
    creatorWallet: coin.creatorWallet,
    totalSupply: TOTAL_SUPPLY,
    curveSupply: dec(coin.realTokenReserves) / TOKEN_DECIMALS || TOTAL_SUPPLY * 0.8,
    tokenReserve: dec(coin.realTokenReserves) / TOKEN_DECIMALS,
    vSol,
    vTokens,
    priceSol,
    priceUsd: mc,
    lastPriceUsd: mc,
    mc,
    volumeSol: dec(coin.totalFeesCollected) / 1_000_000_000,
    holders: opts.holders ?? {},
    chart: opts.chart ?? [mc, mc, mc, mc, mc],
    createdAt: coin.createdAt.getTime(),
    lastTradeAt: coin.updatedAt.getTime(),
    creatorRewardsSol: dec(coin.creatorFeeSnapshot) / 1_000_000_000,
    status: coin.status,
  };
}

export function mapCandleToApi(c: Candle): Record<string, unknown> {
  return {
    time: Number(c.openTime),
    open: dec(c.open),
    high: dec(c.high),
    low: dec(c.low),
    close: dec(c.close),
    volumeSol: dec(c.volume) / 1_000_000_000,
    tradesCount: c.trades,
  };
}

export function mapProfileToApi(
  wallet: string,
  profile: Profile,
  extras: {
    holdings: Array<Record<string, unknown>>;
    creations: Array<Record<string, unknown>>;
    txs: Array<Record<string, unknown>>;
    referralCount: number;
    deposits: Array<Record<string, unknown>>;
    withdrawals: Array<Record<string, unknown>>;
    custodialWallet?: string;
  },
): Record<string, unknown> {
  const runBalance = dec(profile.runBalanceSol);
  const custodial = extras.custodialWallet?.trim() || profile.walletAddress;
  return {
    wallet,
    custodialWallet: custodial,
    depositAddress: custodial,
    primaryWallet: wallet,
    connectedWallet: wallet,
    runBalance,
    runTokens: 0,
    solBalance: runBalance,
    referrer: profile.referrerWallet ?? '',
    referralCode: wallet.slice(0, 6),
    referralCount: extras.referralCount,
    referralRewardsSol: dec(profile.referralRewardsSol),
    creatorRewardsSol: dec(profile.creatorRewardsSol),
    ownerRewardsSol: dec(profile.ownerRewardsSol),
    referralRewards: { totalSol: dec(profile.referralRewardsSol) },
    ownerRewards: { totalSol: dec(profile.ownerRewardsSol) },
    rewards: { totalSol: dec(profile.creatorRewardsSol), byCoin: {} },
    holdings: extras.holdings,
    txs: extras.txs,
    creations: extras.creations,
    depositHistory: extras.deposits,
    withdrawHistory: extras.withdrawals,
  };
}

export function mapHoldingRow(
  h: Holding & { coin: Coin },
): Record<string, unknown> | null {
  const amount = dec(h.tokenBalance) / TOKEN_DECIMALS;
  if (amount <= 0) return null;
  const total = TOTAL_SUPPLY;
  return {
    coinId: h.coinId,
    symbol: h.coin.symbol,
    name: h.coin.name,
    logo: h.coin.imageUri,
    amount,
    totalSupply: total,
    pct: (amount / total) * 100,
    lastAt: h.updatedAt.getTime(),
  };
}

export function mapTxRow(t: Transaction): Record<string, unknown> {
  return {
    id: t.id,
    coinId: t.coinId,
    side: t.tradeType,
    type: t.tradeType,
    sol: dec(t.solAmount) / 1_000_000_000,
    tokens: dec(t.tokenAmount) / TOKEN_DECIMALS,
    fee: dec(t.totalFee) / 1_000_000_000,
    ts: t.confirmedAt.getTime(),
    t: t.confirmedAt.getTime(),
    wallet: t.walletAddress,
  };
}
