import React from "react";
import { fmtNum, fmtSol } from "../../lib/coin-display.js";

function shortMint(addr) {
  const s = String(addr || "");
  if (!s) return "—";
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}...${s.slice(-4)}`;
}

function countActivitySides(activity = []) {
  let buyers = 0;
  let sellers = 0;
  for (const tx of activity) {
    const side = String(tx.type || tx.side || "").toUpperCase();
    if (side === "BUY") buyers += 1;
    else if (side === "SELL") sellers += 1;
  }
  return { buyers, sellers };
}

const STAT_ICONS = {
  supply: "◎",
  circulating: "↻",
  mint: "⛓",
  decimals: "#",
  liquidity: "💧",
  trades: "⚡",
  buyers: "↑",
  sellers: "↓",
};

export function CoinOverviewPanel({ coin, activity = [], showFullStory, onToggleStory }) {
  if (!coin) return null;

  const { buyers, sellers } = countActivitySides(activity);
  const liquiditySol = Math.max(0, Number(coin.solReserve || 0) + Number(coin.vSol || 0));

  const stats = [
    { key: "supply", label: "Total Supply", value: fmtNum(coin.totalSupply || 0, 0) },
    { key: "circulating", label: "Circulating Supply", value: fmtNum(coin.circulating || 0, 0) },
    { key: "mint", label: "Mint Address", value: shortMint(coin.mintAddress) },
    { key: "decimals", label: "Decimals", value: String(coin.decimals ?? 9) },
    { key: "liquidity", label: "Liquidity", value: `${fmtSol(liquiditySol)} SOL` },
    { key: "trades", label: "24H Trades", value: String(activity.length || 0) },
    { key: "buyers", label: "Buyers", value: String(buyers) },
    { key: "sellers", label: "Sellers", value: String(sellers) },
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
      </div>
    </div>
  );
}
