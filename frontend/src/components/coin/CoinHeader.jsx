import React, { useEffect, useRef, useState } from "react";
import { CoinLogo } from "../coins/CoinLogo.jsx";
import { MiniBtn } from "../ui/Button.jsx";
import {
  fmtSol,
  fmtUsd,
  getCoin24hMovePct,
  getCoinPageMarketCapUsd,
  safeNum,
} from "../../lib/coin-display.js";
import { getExplorerLinks, shortCa } from "../../lib/explorer-links.js";
import { CoinPumpStatsPanel } from "./CoinPumpStatsPanel.jsx";

function SocialLink({ href, label }) {
  if (!href) return null;
  const url = String(href).trim();
  if (!url) return null;

  return (
    <a className="coinHeaderSocial" href={url} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}

function VerifyLink({ href, label, comingSoon = false }) {
  if (comingSoon || !href) {
    return (
      <span className="coinVerifyLink coinVerifyLink--soon" aria-disabled="true" title="Coming soon">
        <span className="coinVerifyLinkLabel">{label}</span>
        <span className="coinVerifyLinkSoonText">Coming soon</span>
      </span>
    );
  }
  return (
    <a className="coinVerifyLink" href={href} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}

export function CoinHeader({
  coin,
  isFavorite = false,
  isCreator = false,
  isMobile = false,
  hideStats = false,
  onOpenCreator,
  onToggleFavorite,
  onCopyMint,
  onOpenDex,
}) {
  const move24h = getCoin24hMovePct(coin);
  const up = move24h >= 0;
  const price = safeNum(coin?.priceUsd || coin?.lastPriceUsd || coin?.price, 0);
  const marketCap = getCoinPageMarketCapUsd(coin);
  const pumpUsd = price * (move24h / 100);
  const hasMint = Boolean(coin?.mintAddress);
  const authoritiesRevoked =
    Boolean(coin?.mintAuthorityRevoked) && Boolean(coin?.freezeAuthorityRevoked);
  const onchainCurve = Boolean(coin?.onchainCurve);
  const fullyVerified = hasMint && (onchainCurve || authoritiesRevoked);
  const hasSocials = Boolean(coin?.website || coin?.twitter || coin?.telegram);
  const caShort = hasMint ? shortCa(coin.mintAddress) : "";
  const explorerLinks = hasMint ? getExplorerLinks(coin.mintAddress) : [];

  const [statsOpen, setStatsOpen] = useState(false);
  const tickerRef = useRef(null);

  useEffect(() => {
    if (!statsOpen) return undefined;
    const onDoc = (e) => {
      if (tickerRef.current?.contains(e.target)) return;
      if (e.target?.closest?.(".coinHeaderTickerPanel--portal")) return;
      setStatsOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setStatsOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [statsOpen]);

  return (
    <div className={`coinHeader ${isMobile ? "coinHeader--mobile" : "coinHeader--desktop"}`}>
      <div className="coinHeaderMain">
        <CoinLogo c={coin} size={isMobile ? 48 : 64} radius={isMobile ? 14 : 18} />

        <div className="coinHeaderIdentity">
          <div className="coinHeaderTitleRow">
            <h1 className="coinHeaderName">{coin.name}</h1>
            {fullyVerified ? (
              <span
                className="coinHeaderVerified"
                title={
                  onchainCurve
                    ? "On-chain bonding curve — Solscan pe real supply & trades"
                    : "Verified — mint & freeze authority disabled"
                }
              >
                ✓
              </span>
            ) : hasMint ? (
              <span
                className="coinHeaderVerified coinHeaderVerified--partial"
                title="Minted on-chain"
              >
                ✓
              </span>
            ) : null}
          </div>
          <div className="coinHeaderSymbolRow">
            <span className="coinHeaderSymbol">{coin.symbol}</span>
            <span className="coinHeaderChain">/ SOL</span>
            {onchainCurve ? (
              <span className="coinHeaderOnchain" title="funrun_v2 on-chain bonding curve">
                On-chain
              </span>
            ) : null}
          </div>

          {caShort ? (
            <button
              type="button"
              className="coinHeaderCa"
              onClick={onCopyMint}
              title={coin.mintAddress}
              aria-label="Copy contract address"
            >
              {caShort}
            </button>
          ) : null}

          {hasSocials ? (
            <div className="coinHeaderSocials">
              <SocialLink href={coin.website} label="Website" />
              <SocialLink href={coin.twitter} label="X" />
              <SocialLink href={coin.telegram} label="Telegram" />
            </div>
          ) : null}

          {explorerLinks.length ? (
            <div className="coinVerifyLinks" aria-label="Verify on explorers">
              {explorerLinks.map((link) => (
                <VerifyLink
                  key={link.id}
                  href={link.href}
                  label={link.label}
                  comingSoon={Boolean(link.comingSoon)}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="coinHeaderPriceBlock" ref={tickerRef}>
          <div className="coinHeaderTickerRow">
            <div className="coinHeaderPrice">{fmtUsd(price)}</div>
            <button
              type="button"
              className={`coinHeaderTickerArrow ${statsOpen ? "is-open" : ""} ${up ? "up" : "down"}`}
              aria-expanded={statsOpen}
              aria-label={statsOpen ? "Hide 24h stats" : "Show 24h pump and share card"}
              onClick={() => setStatsOpen((v) => !v)}
            >
              <span className="coinHeaderTickerArrowIcon" aria-hidden="true">
                {statsOpen ? "▲" : "▼"}
              </span>
              <span className="coinHeaderTickerArrowText">24h</span>
            </button>
          </div>

          <button
            type="button"
            className={`coinHeaderPriceChange ${up ? "up" : "down"}`}
            onClick={() => setStatsOpen((v) => !v)}
          >
            {up ? "+" : ""}
            {move24h.toFixed(2)}%
          </button>

          {statsOpen ? (
            <CoinPumpStatsPanel
              coin={coin}
              move24h={move24h}
              pumpUsd={pumpUsd}
              marketCap={marketCap}
              price={price}
              align="right"
              anchorRef={tickerRef}
              onClose={() => setStatsOpen(false)}
            />
          ) : null}
        </div>
      </div>

      <div className="coinHeaderToolbar coinHeaderToolbar--scroll">
        <MiniBtn className="coinHeaderActionBtn coinHeaderActionBtn--icon" onClick={onToggleFavorite} aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}>
          <span style={{ color: isFavorite ? "#fbbf24" : undefined }}>
            {isMobile ? (isFavorite ? "★" : "☆") : isFavorite ? "★ Favorited" : "☆ Favorite"}
          </span>
        </MiniBtn>
        <MiniBtn className="coinHeaderActionBtn coinHeaderActionBtn--icon" onClick={onOpenCreator} aria-label="View creator">
          {isMobile ? "👤" : "Creator"}
        </MiniBtn>
        <MiniBtn
          className="coinHeaderActionBtn coinHeaderActionBtn--icon"
          disabled={!coin?.mintAddress}
          onClick={onCopyMint}
          aria-label="Copy mint address"
        >
          {isMobile ? "📋" : coin?.mintAddress ? "Copy Mint" : "Not minted"}
        </MiniBtn>
        <MiniBtn
          className="coinHeaderActionBtn coinHeaderActionBtn--icon"
          tone="good"
          onClick={() => setStatsOpen(true)}
          aria-label="Share 24h pump card"
        >
          {isMobile ? "📤" : "Share card"}
        </MiniBtn>
        {isCreator ? (
          <MiniBtn className="coinHeaderActionBtn coinHeaderActionBtn--icon" tone="good" onClick={onOpenDex} aria-label="Launch on DEX">
            {isMobile ? "🚀 DEX" : "Launch DEX"}
          </MiniBtn>
        ) : null}
      </div>

      {!hideStats ? (
        <div className="coinHeaderStats">
          <div className="coinHeaderStat">
            <div className="coinHeaderStatLabel">Market Cap</div>
            <div className="coinHeaderStatValue">{fmtUsd(marketCap)}</div>
          </div>
          <div className="coinHeaderStat">
            <div className="coinHeaderStatLabel">24h Change</div>
            <div className="coinHeaderStatValue" style={{ color: up ? "var(--good)" : "var(--danger)" }}>
              {up ? "+" : ""}
              {move24h.toFixed(2)}%
            </div>
          </div>
          <div className="coinHeaderStat">
            <div className="coinHeaderStatLabel">Creator Rewards</div>
            <div className="coinHeaderStatValue">{fmtSol(coin.creatorRewardsSol || 0)} SOL</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
