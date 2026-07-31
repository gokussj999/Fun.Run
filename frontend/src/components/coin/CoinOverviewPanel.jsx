import React from "react";
import { fmtSol, fmtUsd, getCoinAgeLabel, getCoinPageLiquiditySol, getCoinPageMarketCapUsd, getCoinPageVolumeSol } from "../../lib/coin-display.js";
import { getExplorerLinks, shortCa } from "../../lib/explorer-links.js";

function shortAddr(addr, emptyLabel = "—") {
  const s = String(addr || "");
  if (!s) return emptyLabel;
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}...${s.slice(-4)}`;
}

function authLabel(revoked) {
  return revoked ? "Disabled" : "Active";
}

function authClass(revoked) {
  return revoked ? "coinSecurityAuth--off" : "coinSecurityAuth--on";
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

function SecuritySection({ coin, onCopyMint }) {
  const mint = coin?.mintAddress;
  if (!mint) {
    return (
      <section className="coinSecurityPanel" aria-label="Security">
        <div className="coinSecurityRow">
          <span className="coinSecurityLabel">Contract Address</span>
          <span className="coinSecurityValue">Pending…</span>
        </div>
      </section>
    );
  }

  const mintOff = Boolean(coin?.mintAuthorityRevoked);
  const freezeOff = Boolean(coin?.freezeAuthorityRevoked);
  const onchainCurve = Boolean(coin?.onchainCurve);
  const links = getExplorerLinks(mint);

  return (
    <section className="coinSecurityPanel" aria-label="Security">
      <div className="coinSecurityRow">
        <span className="coinSecurityLabel">Contract Address</span>
        <span className="coinSecurityValue coinSecurityValue--ca">
          <span className="coinSecurityCa" title={mint}>
            {shortCa(mint)}
          </span>
          {onCopyMint ? (
            <button type="button" className="coinSecurityCopyBtn" onClick={onCopyMint}>
              Copy
            </button>
          ) : null}
        </span>
      </div>

      {onchainCurve ? (
        <div className="coinSecurityRow">
          <span className="coinSecurityLabel">Bonding curve</span>
          <span className="coinSecurityValue coinSecurityAuth coinSecurityAuth--off">
            On-chain
          </span>
        </div>
      ) : null}

      <div className="coinSecurityRow">
        <span className="coinSecurityLabel">Mint Authority</span>
        <span className={`coinSecurityValue coinSecurityAuth ${authClass(onchainCurve || mintOff)}`}>
          {onchainCurve ? "Program PDA" : authLabel(mintOff)}
        </span>
      </div>

      <div className="coinSecurityRow">
        <span className="coinSecurityLabel">Freeze Authority</span>
        <span className={`coinSecurityValue coinSecurityAuth ${authClass(onchainCurve || freezeOff)}`}>
          {onchainCurve ? "Program PDA" : authLabel(freezeOff)}
        </span>
      </div>

      {links.length ? (
        <div className="coinSecurityLinks" aria-label="Explorer links">
          {links.map((link) => (
            <a
              key={link.id}
              className="coinVerifyLink"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
}

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
    { label: "Creator", value: shortAddr(coin.creatorWallet), action: onOpenCreator, actionLabel: "View" },
  ];

  const overviewCards = stats.slice(0, 4);

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

        <SecuritySection coin={coin} onCopyMint={onCopyMint} />
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

      <SecuritySection coin={coin} onCopyMint={onCopyMint} />
    </div>
  );
}
