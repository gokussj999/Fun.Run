import React from "react";
import { MiniBtn } from "../ui/Button.jsx";
import { getCoin24hMovePct } from "../../lib/coin-display.js";

export function FavoritesBar({ coins = [], favoriteIds = [], onOpenCoin }) {
  const favorites = (coins || []).filter((c) => favoriteIds.includes(c.id)).slice(0, 12);

  if (!favorites.length) return null;

  return (
    <div>
      <div className="discoverySectionHead" style={{ marginBottom: 10 }}>
        <div>
          <div className="discoverySectionTitle">⭐ Favorites</div>
          <div className="discoverySectionSub">{favorites.length} saved coins</div>
        </div>
      </div>

      <div className="favoritesBar">
        {favorites.map((coin) => {
          const move = getCoin24hMovePct(coin);
          const up = move >= 0;

          return (
            <MiniBtn key={coin.id} onClick={() => onOpenCoin?.(coin)}>
              <span className="favoritePill">
                <span className="favoritePillSymbol">{coin.symbol || coin.name}</span>
                <span className="favoritePillMove" style={{ color: up ? "var(--good)" : "var(--danger)" }}>
                  {up ? "+" : ""}
                  {move.toFixed(2)}%
                </span>
              </span>
            </MiniBtn>
          );
        })}
      </div>
    </div>
  );
}
