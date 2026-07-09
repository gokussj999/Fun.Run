import React from "react";
import { fmtSol, fmtUsd, getCoin24hMovePct, getCoinAgeLabel } from "../../lib/coin-display.js";

export function CoinStatsStrip({ coin }) {
  if (!coin) return null;

  const move24h = getCoin24hMovePct(coin);
  const up = move24h >= 0;
  const holderCount = Object.keys(coin?.holders || {}).length;
  const price = coin?.priceUsd || coin?.lastPriceUsd || coin?.price || 0;

  const stats = [
    {
      label: "Price",
      value: fmtUsd(price),
      tone: "default",
      primary: true,
    },
    {
      label: "Market Cap",
      value: fmtUsd(coin.mc || 0),
      tone: "default",
    },
    {
      label: "24h Change",
      value: `${up ? "+" : ""}${move24h.toFixed(2)}%`,
      tone: up ? "up" : "down",
    },
    {
      label: "Volume",
      value: `${fmtSol(coin.volumeSol || 0)} SOL`,
      tone: "default",
    },
    {
      label: "ATH",
      value: fmtUsd(coin.ath || 0),
      tone: "default",
    },
    {
      label: "Holders",
      value: holderCount.toLocaleString(),
      tone: "default",
    },
    {
      label: "Age",
      value: getCoinAgeLabel(coin),
      tone: "muted",
    },
    {
      label: "Creator Rewards",
      value: `${fmtSol(coin.creatorRewardsSol || 0)} SOL`,
      tone: "accent",
    },
  ];

  return (
    <div className="coinStatsStrip" role="region" aria-label="Coin statistics">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`coinStatsStripItem ${stat.primary ? "coinStatsStripItem--primary" : ""}`}
        >
          <div className="coinStatsStripLabel">{stat.label}</div>
          <div className={`coinStatsStripValue coinStatsStripValue--${stat.tone}`}>{stat.value}</div>
        </div>
      ))}
    </div>
  );
}
