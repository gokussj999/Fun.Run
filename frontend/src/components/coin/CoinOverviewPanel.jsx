import React from "react";
import { fmtSol, fmtUsd, getCoinAgeLabel, getCoinPageLiquiditySol, getCoinPageMarketCapUsd, getCoinPageVolumeSol } from "../../lib/coin-display.js";
import { birdeyeUrl, dexscreenerUrl, jupiterSwapUrl, openExternal } from "../../lib/external-links.js";

function shortAddr(addr, emptyLabel = "—") {
  const s = String(addr || "");
  if (!s) return emptyLabel;
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
  chart: "📈",
};

export function CoinOverviewPanel({
  coin,
  mobile = false,
  showFullStory,
  onToggleStory,
  onCopyMint,
  onOpenCreator,
}) {
  if (!coin) return null;

  const holderCount = Math.max(
    0,
    Number(coin?.holderCount) ||
      Object.values(coin?.holders || {}).filter((v) => Number(v) > 0.0000001).length
  );

  const stats = [
    { key: "marketCap", label: "Market Cap", value: fmtUsd(getCoinPageMarketCapUsd(coin)) },
    { key: "liquidity", label: "Liquidity", value: `${fmtSol(getCoinPageLiquiditySol(coin))} SOL` },
    { key: "volume", label: "Volume", value: `${fmtSol(getCoinPageVolumeSol(coin))} SOL` },
    { key: "holders", label: "Holders", value: holderCount.toLocaleString() },
    { key: "age", label: "Age", value: getCoinAgeLabel(coin) },
    { key: "rewards", label: "Creator Rewards", value: `${fmtSol(coin.creatorRewardsSol || 0)} SOL` },
  ];

  const mobileRows = [
    { label: "Creator Rewards", value: `${fmtSol(coin.creatorRewardsSol || 0)} SOL` },
    { label: "Mint Address", value: shortAddr(coin.mintAddress, "Pending…"), action: coin?.mintAddress ? onCopyMint : null, actionLabel: "Copy" },
    {
      label: "DexScreener",
      value: coin?.mintAddress ? "Open chart" : "Mint pending",
      action: coin?.mintAddress ? () => openExternal(dexscreenerUrl(coin.mintAddress)) : null,
      actionLabel: "Open",
    },
    {
      label: "Jupiter",
      value: coin?.mintAddress ? "Swap token" : "Mint pending",
      action: coin?.mintAddress ? () => openExternal(jupiterSwapUrl(coin.mintAddress)) : null,
      actionLabel: "Swap",
    },
    { label: "Creator", value: shortAddr(coin.creatorWallet), action: onOpenCreator, actionLabel: "View" },
  ];

  const overviewCards = stats.slice(0, 4); // Market Cap / Liquidity / Volume / Holders

  if (mobile) {
    return (
      <div className="coinMobileInfo">
        {coin.story ? (
          <section className="coinMobileInfoStory">
            <h3 className="coinMobileInfoStoryTitle">About</h3>
            <p className="coinMobileInfoStoryText">
              {showFullStory || coin.story.length <= 140 ? coin.story : `${coin.story.slice(0, 140)}...`}
              {coin.story.length > 140 ? (
                <button type="button" className="coinStoryToggle" onClick={onToggleStory}>
                  {showFullStory ? " Less" : " More"}
                </button>
              ) : null}
            </p>
          </section>
        ) : null}

        <div className="coinOverviewGrid coinOverviewGrid--mobile">
          {overviewCards.map((item) => (
            <div key={item.key} className="coinOverviewStatCard">
              <div className="coinOverviewStatIcon" aria-hidden="true">
                {STAT_ICONS[item.key]}
              </div>
              <div className="coinOverviewStatLabel">{item.label}</div>
              <div className="coinOverviewStatValue">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="coinMobileInfoList">
          {mobileRows.map((row) => (
            <div key={row.label} className="coinMobileInfoRow">
              <span className="coinMobileInfoLabel">{row.label}</span>
              <span className="coinMobileInfoValue">
                {row.value}
                {row.action ? (
                  <button type="button" className="coinMobileInfoAction" onClick={row.action}>
                    {row.actionLabel}
                  </button>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="coinOverviewPanel">
      {coin.story ? (
        <section className="coinOverviewAbout">
          <h3 className="coinOverviewAboutTitle">About {coin.name}</h3>
          <div className="coinOverviewAboutText">
            {showFullStory || coin.story.length <= 180 ? coin.story : `${coin.story.slice(0, 180)}...`}
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
          <div className="coinOverviewStatValue">{shortAddr(coin.mintAddress, "Pending…")}</div>
          {coin?.mintAddress ? (
            <button type="button" className="coinSecurityCopy" onClick={onCopyMint}>
              Copy
            </button>
          ) : null}
        </div>

        {coin?.mintAddress ? (
          <>
            <button
              type="button"
              className="coinOverviewStatCard coinOverviewStatCard--action"
              onClick={() => openExternal(dexscreenerUrl(coin.mintAddress))}
            >
              <div className="coinOverviewStatIcon" aria-hidden="true">
                {STAT_ICONS.chart}
              </div>
              <div className="coinOverviewStatLabel">DexScreener</div>
              <div className="coinOverviewStatValue">Open chart ↗</div>
            </button>
            <button
              type="button"
              className="coinOverviewStatCard coinOverviewStatCard--action"
              onClick={() => openExternal(jupiterSwapUrl(coin.mintAddress))}
            >
              <div className="coinOverviewStatIcon" aria-hidden="true">
                🪐
              </div>
              <div className="coinOverviewStatLabel">Jupiter</div>
              <div className="coinOverviewStatValue">Swap ↗</div>
            </button>
            <button
              type="button"
              className="coinOverviewStatCard coinOverviewStatCard--action"
              onClick={() => openExternal(birdeyeUrl(coin.mintAddress))}
            >
              <div className="coinOverviewStatIcon" aria-hidden="true">
                👁
              </div>
              <div className="coinOverviewStatLabel">Birdeye</div>
              <div className="coinOverviewStatValue">Analytics ↗</div>
            </button>
          </>
        ) : null}

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
