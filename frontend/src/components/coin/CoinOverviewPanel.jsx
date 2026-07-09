import React from "react";
import { fmtSol, fmtUsd, getCoinAgeLabel } from "../../lib/coin-display.js";

function shortAddr(addr) {
  const s = String(addr || "");
  if (!s) return "—";
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}...${s.slice(-4)}`;
}

const STAT_ICONS = {
  marketCap: "📊",
  liquidity: "💧",
  volume: "⚡",
  holders: "👥",
  age: "⏱",
  rewards: "🎁",
  mint: "⛓",
  creator: "👤",
};

export function CoinOverviewPanel({ coin, showFullStory, onToggleStory, onCopyMint, onOpenCreator }) {
  if (!coin) return null;

  const holderCount = Object.keys(coin?.holders || {}).length;
  const liquiditySol = Math.max(0, Number(coin.solReserve || 0) + Number(coin.vSol || 0));

  const stats = [
    { key: "marketCap", label: "Market Cap", value: fmtUsd(coin.mc || 0) },
    { key: "liquidity", label: "Liquidity", value: `${fmtSol(liquiditySol)} SOL` },
    { key: "volume", label: "Volume", value: `${fmtSol(coin.volumeSol || 0)} SOL` },
    { key: "holders", label: "Holders", value: holderCount.toLocaleString() },
    { key: "age", label: "Age", value: getCoinAgeLabel(coin) },
    { key: "rewards", label: "Creator Rewards", value: `${fmtSol(coin.creatorRewardsSol || 0)} SOL` },
  ];

  return (
    <div className="coinOverviewPanel">
      {coin.story ? (
        <section className="coinOverviewAbout">
          <h3 className="coinOverviewAboutTitle">About {coin.name}</h3>
          <div className="coinOverviewAboutText">
            {showFullStory || coin.story.length <= 180
              ? coin.story
              : `${coin.story.slice(0, 180)}...`}
            {coin.story.length > 180 ? (
              <button type="button" className="coinStoryToggle" onClick={onToggleStory}>
                {showFullStory ? " Less" : " Read more"}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="coinOverviewGrid">
        {stats.map((item) => (
          <div key={item.key} className="coinOverviewStatCard">
            <div className="coinOverviewStatIcon" aria-hidden="true">
              {STAT_ICONS[item.key]}
            </div>
            <div className="coinOverviewStatLabel">{item.label}</div>
            <div className="coinOverviewStatValue">{item.value}</div>
          </div>
        ))}

        <div className="coinOverviewStatCard">
          <div className="coinOverviewStatIcon" aria-hidden="true">
            {STAT_ICONS.mint}
          </div>
          <div className="coinOverviewStatLabel">Mint Address</div>
          <div className="coinOverviewStatValue">{shortAddr(coin.mintAddress)}</div>
          {coin?.mintAddress ? (
            <button type="button" className="coinSecurityCopy" onClick={onCopyMint}>
              Copy
            </button>
          ) : null}
        </div>

        <button
          type="button"
          className="coinOverviewStatCard coinOverviewStatCard--action"
          onClick={onOpenCreator}
        >
          <div className="coinOverviewStatIcon" aria-hidden="true">
            {STAT_ICONS.creator}
          </div>
          <div className="coinOverviewStatLabel">Creator</div>
          <div className="coinOverviewStatValue">{shortAddr(coin.creatorWallet)}</div>
        </button>
      </div>
    </div>
  );
}
