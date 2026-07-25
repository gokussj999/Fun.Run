import React, { useMemo } from "react";
import { ScreenShell } from "../components/layout";
import { Card } from "../components/ui/Card.jsx";
import { MiniBtn } from "../components/ui/Button.jsx";
import { Pill } from "../components/ui/Pill.jsx";
import { CoinFeed, HotCoinsBar, TrendingVolumeRow } from "../components/coins";
import { getCoin24hMovePct } from "../lib/coin-display.js";

function SectionHeader({ title, sub, right, className = "" }) {
  return (
    <div className={`sectionHeader ${className}`.trim()}>
      <div>
        <div className="sectionTitle">{title}</div>
        {sub ? <div className="sectionSub">{sub}</div> : null}
      </div>
      {right}
    </div>
  );
}

export function HomePage({
  adSlot,
  onNavigate,
  onOpenCoin,
  onCopyInvite,
  coins = [],
  hotCoins = [],
  latestCoins = [],
  topVolume = [],
  homeFeedMode,
  onFeedModeChange,
  favoriteCoinIds = [],
  onToggleFavorite,
  loadingCoins = false,
  coinsLoadMoreRef,
}) {
  const favoriteCoins = useMemo(
    () => (coins || []).filter((c) => favoriteCoinIds.includes(c.id)),
    [coins, favoriteCoinIds]
  );

  return (
    <ScreenShell>
      <Card className="homeHeroCard" style={{ position: "relative", overflow: "hidden" }}>
        <div className="heroGlow" />
        <div className="heroTitle">Create. Trade. Share. Earn.</div>
        <div className="heroText">
          Launch meme coins in seconds, trade on the bonding curve, share your pump card, and earn 50,000 RUN per invite.
        </div>

        <div className="heroActions">
          <MiniBtn className="homeHeroPrimaryBtn" tone="good" onClick={() => onNavigate?.("CREATE")}>
            Create Coin
          </MiniBtn>
          <MiniBtn className="homeHeroGhostBtn" onClick={() => onNavigate?.("SEARCH")}>
            Explore Coins
          </MiniBtn>
          <MiniBtn className="homeHeroGhostBtn" onClick={() => onCopyInvite?.()}>
            Copy invite
          </MiniBtn>
        </div>
      </Card>

      {adSlot}

      {hotCoins.length > 0 ? (
        <Card>
          <HotCoinsBar coins={hotCoins.slice(0, 12)} onOpenCoin={onOpenCoin} />
        </Card>
      ) : null}

      {favoriteCoins.length > 0 ? (
        <Card>
          <SectionHeader title="Your favorites" right={<Pill>{favoriteCoins.length}</Pill>} />
          <div className="favoriteQuickRow">
            {favoriteCoins.slice(0, 10).map((coin) => {
              const move = getCoin24hMovePct(coin);
              const up = move >= 0;
              return (
                <MiniBtn key={coin.id} onClick={() => onOpenCoin?.(coin)}>
                  <div className="favoriteQuickItem">
                    <span>{coin.symbol || coin.name}</span>
                    <span className="favoriteQuickMove" style={{ color: up ? "var(--good)" : "var(--danger)" }}>
                      {up ? "+" : ""}
                      {move.toFixed(2)}%
                    </span>
                  </div>
                </MiniBtn>
              );
            })}
          </div>
        </Card>
      ) : null}

      <Card>
        <SectionHeader
          className="homeSectionHeader"
          title="Discovery feed"
          right={<Pill>{coins.length}</Pill>}
        />

        <CoinFeed
          mode={homeFeedMode}
          onModeChange={onFeedModeChange}
          coins={coins}
          hotCoins={hotCoins}
          latestCoins={latestCoins}
          favoriteCoins={favoriteCoins}
          loading={loadingCoins}
          loadMoreRef={coinsLoadMoreRef}
          favoriteCoinIds={favoriteCoinIds}
          onToggleFavorite={onToggleFavorite}
          onOpenCoin={onOpenCoin}
          onCreateCoin={() => onNavigate?.("CREATE")}
          showFavoriteToggle
        />
      </Card>

      <Card>
        <SectionHeader title="Trending by volume" right={<Pill>{topVolume.length}</Pill>} />
        <TrendingVolumeRow coins={topVolume} onOpenCoin={onOpenCoin} />
      </Card>
    </ScreenShell>
  );
}
