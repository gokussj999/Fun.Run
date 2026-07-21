import React from "react";
import { CoinLogo } from "./CoinLogo.jsx";
import { fmtUsd, getCoin24hMovePct, getCoinAgeLabel } from "../../lib/coin-display.js";

export const CoinMiniCard = React.memo(function CoinMiniCard({
  c,
  onOpen,
  subtitle,
  isFavorite = false,
  onToggleFavorite,
  showFavorite = false,
}) {
  const move24h = getCoin24hMovePct(c);
  const isUp = move24h >= 0;
  const age = getCoinAgeLabel(c);

  function openCoin() {
    onOpen?.();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openCoin();
    }
  }

  return (
    <div
      className="coinBtn coinBtn--interactive"
      role="button"
      tabIndex={0}
      onClick={openCoin}
      onKeyDown={handleKeyDown}
    >
      <div className="coinRow">
        <CoinLogo c={c} size={46} radius={16} />

        <div className="coinText">
          <div className="coinName">
            <span className="coinNameText">{c?.name || c?.symbol || "—"}</span>
            {Math.abs(move24h) >= 12 ? (
              <span className={`coinMoveBadge ${isUp ? "up" : "down"}`}>{isUp ? "PUMP" : "DUMP"}</span>
            ) : null}
          </div>
          <div className="coinMeta">
            {subtitle ? (
              <span>{subtitle}</span>
            ) : (
              <>
                <span>{c?.symbol || "—"}</span>
                <span>•</span>
                <span>Age {age}</span>
                <span>•</span>
                <span className={`coinMetaMove ${isUp ? "up" : "down"}`}>
                  24h {move24h > 0 ? "+" : ""}
                  {move24h.toFixed(2)}%
                </span>
              </>
            )}
          </div>
        </div>

        <div className="coinRowActions">
          {showFavorite ? (
            <button
              type="button"
              className={`coinFavBtn ${isFavorite ? "active" : ""}`}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={isFavorite}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(c?.id);
              }}
            >
              {isFavorite ? "★" : "☆"}
            </button>
          ) : null}

          <div className="rightNum">
            <div className="rightNumMain">{fmtUsd(c?.mc || 0)}</div>
            <div className={`rightNumSub ${isUp ? "up" : "down"}`}>
              {move24h > 0 ? "+" : ""}
              {move24h.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
