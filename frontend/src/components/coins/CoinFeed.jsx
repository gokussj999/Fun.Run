import React from "react";
import { CoinListSkeleton } from "../ui/Skeleton.jsx";
import { EmptyState } from "../ui/EmptyState.jsx";
import { CoinMiniCard } from "./CoinMiniCard.jsx";

const FEED_TABS = [
  { id: "ALL", label: "All" },
  { id: "HOT", label: "Hot 15m" },
  { id: "LATEST", label: "New" },
  { id: "FAVORITES", label: "Favorites" },
];

export function CoinFeed({
  mode = "ALL",
  onModeChange,
  coins = [],
  hotCoins = [],
  latestCoins = [],
  favoriteCoins = [],
  loading = false,
  loadMoreRef,
  favoriteCoinIds = [],
  onToggleFavorite,
  onOpenCoin,
  onCreateCoin,
  showFavoriteToggle = false,
}) {
  const feedCoins =
    mode === "HOT"
      ? hotCoins
      : mode === "LATEST"
        ? latestCoins
        : mode === "FAVORITES"
          ? favoriteCoins
          : coins;

  return (
    <>
      <div className="discoveryTabs" role="tablist" aria-label="Coin feed">
        {FEED_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`discovery-tab-${tab.id}`}
            aria-selected={mode === tab.id}
            aria-controls="discovery-feed-panel"
            className={`discoveryTab ${mode === tab.id ? "active" : ""}`}
            onClick={() => onModeChange?.(tab.id)}
          >
            {tab.label}
            {tab.id === "FAVORITES" && favoriteCoinIds.length > 0 ? (
              <span className="discoveryTabCount">{favoriteCoinIds.length}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="coinList" id="discovery-feed-panel" role="tabpanel" aria-labelledby={`discovery-tab-${mode}`}>
        {loading && !feedCoins.length ? (
          <CoinListSkeleton count={4} />
        ) : feedCoins.length ? (
          feedCoins.map((c) => (
            <CoinMiniCard
              key={c.id}
              c={c}
              onOpen={() => onOpenCoin?.(c)}
              isFavorite={favoriteCoinIds.includes(c.id)}
              showFavorite={showFavoriteToggle}
              onToggleFavorite={onToggleFavorite}
            />
          ))
        ) : (
          <EmptyState
            icon={mode === "FAVORITES" ? "⭐" : "🪙"}
            title={mode === "FAVORITES" ? "No favorites yet" : "No coins yet"}
            description={
              mode === "FAVORITES"
                ? "Star coins from search or coin pages to track them here."
                : "Be the first to launch, or check back soon for new listings."
            }
            actionLabel={mode === "FAVORITES" ? "Explore Coins" : "Create Coin"}
            onAction={onCreateCoin}
            compact
          />
        )}
      </div>

      <div ref={loadMoreRef} style={{ height: 10 }} />
      {loading && feedCoins.length ? (
        <div style={{ marginTop: 10 }}>
          <CoinListSkeleton count={1} />
        </div>
      ) : null}
    </>
  );
}
