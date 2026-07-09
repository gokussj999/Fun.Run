import React, { useMemo, useState } from "react";
import { ScreenShell, BackButton } from "../components/layout";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { Card } from "../components/ui/Card.jsx";
import { CoinListSkeleton } from "../components/ui/Skeleton.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { CoinMiniCard } from "../components/coins";
import { FilterChips, RecentSearchChips, SearchBar } from "../components/search";
import { fmtUsd, getCoin24hMovePct, safeNum } from "../lib/coin-display.js";

const LS_RECENT_SEARCHES = "recent_searches_v1";

const MODE_CHIPS = [
  { id: "SEARCH", label: "Search" },
  { id: "VOLUME", label: "Top Volume" },
  { id: "MOVES", label: "Top Moves" },
  { id: "FAVORITES", label: "Favorites" },
];

const SORT_CHIPS = [
  { id: "RELEVANCE", label: "Relevance" },
  { id: "MC", label: "Market Cap" },
  { id: "VOLUME", label: "Volume" },
  { id: "NEWEST", label: "Newest" },
  { id: "MOVES", label: "24h Move" },
];

function loadRecentSearches() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_RECENT_SEARCHES) || "[]");
    return Array.isArray(raw) ? raw.filter((x) => typeof x === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term) {
  const q = String(term || "").trim();
  if (!q) return;
  try {
    const prev = loadRecentSearches().filter((x) => x.toLowerCase() !== q.toLowerCase());
    localStorage.setItem(LS_RECENT_SEARCHES, JSON.stringify([q, ...prev].slice(0, 8)));
  } catch {}
}

function Title({ children, sub }) {
  return <PageHeader title={children} sub={sub} />;
}

export function SearchPage({
  adSlot,
  onBack,
  onOpenCoin,
  searchQ,
  onSearchChange,
  searchMode,
  onSearchModeChange,
  coins = [],
  filteredCoins = [],
  topVolume = [],
  topMoves20 = [],
  favoriteCoinIds = [],
  onToggleFavorite,
  loadingCoins = false,
}) {
  const [sortBy, setSortBy] = useState("RELEVANCE");
  const [recentSearches, setRecentSearches] = useState(loadRecentSearches);

  function refreshRecentSearches() {
    setRecentSearches(loadRecentSearches());
  }

  function commitSearch(term = searchQ) {
    const q = String(term || "").trim();
    if (!q) return;
    saveRecentSearch(q);
    refreshRecentSearches();
    onSearchModeChange?.("SEARCH");
    onSearchChange?.(q);
  }

  const favoriteCoins = useMemo(
    () => (coins || []).filter((c) => favoriteCoinIds.includes(c.id)),
    [coins, favoriteCoinIds]
  );

  const results = useMemo(() => {
    let list = [];

    if (searchMode === "VOLUME") {
      list = topVolume;
    } else if (searchMode === "MOVES") {
      list = topMoves20.map((x) => x.c);
    } else if (searchMode === "FAVORITES") {
      list = favoriteCoins;
    } else {
      list = filteredCoins;
    }

    const sorted = [...list];
    if (searchMode === "SEARCH" || searchMode === "FAVORITES") {
      switch (sortBy) {
        case "MC":
          sorted.sort((a, b) => safeNum(b.mc, 0) - safeNum(a.mc, 0));
          break;
        case "VOLUME":
          sorted.sort((a, b) => safeNum(b.volumeSol, 0) - safeNum(a.volumeSol, 0));
          break;
        case "NEWEST":
          sorted.sort((a, b) => safeNum(b.createdAt, 0) - safeNum(a.createdAt, 0));
          break;
        case "MOVES":
          sorted.sort((a, b) => getCoin24hMovePct(b) - getCoin24hMovePct(a));
          break;
        default:
          break;
      }
    }

    return sorted;
  }, [searchMode, filteredCoins, topVolume, topMoves20, favoriteCoins, sortBy]);

  const modeChips = MODE_CHIPS.map((chip) =>
    chip.id === "FAVORITES" ? { ...chip, count: favoriteCoinIds.length || null } : chip
  );

  return (
    <ScreenShell>
      <BackButton onClick={onBack} />

      {adSlot}

      <Card className="searchPageCard">
        <Title>Explore</Title>

        <SearchBar value={searchQ} onChange={onSearchChange} onSubmit={commitSearch} />

        <FilterChips items={modeChips} value={searchMode} onChange={onSearchModeChange} label="Browse" />

        {searchMode === "SEARCH" && !searchQ ? (
          <RecentSearchChips
            items={recentSearches}
            onSelect={(term) => {
              onSearchChange?.(term);
              commitSearch(term);
            }}
            onClear={() => {
              localStorage.removeItem(LS_RECENT_SEARCHES);
              refreshRecentSearches();
            }}
          />
        ) : null}

        {(searchMode === "SEARCH" || searchMode === "FAVORITES") && results.length > 0 ? (
          <FilterChips items={SORT_CHIPS} value={sortBy} onChange={setSortBy} label="Sort" />
        ) : null}

        <div className="coinList searchResultsList">
          {loadingCoins && searchMode === "SEARCH" && !results.length ? (
            <CoinListSkeleton count={4} />
          ) : results.length ? (
            results.map((c) => {
              const moveItem = topMoves20.find((x) => x.c?.id === c.id);
              const movePct = moveItem?.pct ?? getCoin24hMovePct(c);
              const subtitle =
                searchMode === "MOVES" || sortBy === "MOVES"
                  ? `MC ${fmtUsd(c?.mc || 0)} • ${movePct > 0 ? "+" : ""}${movePct.toFixed(2)}%`
                  : undefined;

              return (
                <CoinMiniCard
                  key={c.id}
                  c={c}
                  subtitle={subtitle}
                  onOpen={() => onOpenCoin?.(c)}
                  isFavorite={favoriteCoinIds.includes(c.id)}
                  showFavorite
                  onToggleFavorite={onToggleFavorite}
                />
              );
            })
          ) : (
            <EmptyState
              icon={searchMode === "FAVORITES" ? "⭐" : "🔍"}
              title={searchMode === "FAVORITES" ? "No favorite coins" : "No coins found"}
              description={
                searchMode === "FAVORITES"
                  ? "Star coins while browsing to build your watchlist."
                  : "Try a different name, symbol, or creator wallet."
              }
              actionLabel={searchMode === "FAVORITES" ? "Browse Volume" : "Top Volume"}
              onAction={() => onSearchModeChange?.("VOLUME")}
              compact
            />
          )}
        </div>
      </Card>
    </ScreenShell>
  );
}
