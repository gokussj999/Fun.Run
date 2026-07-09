import React from "react";
import { CoinListSkeleton } from "../ui/Skeleton.jsx";
import { EmptyState } from "../ui/EmptyState.jsx";
import { Pill } from "../ui/Pill.jsx";

function CoinLogo({ coin }) {
  const src = String(coin?.logo || "")
    .replace("https://gateway.pinata.cloud/ipfs/", "https://ipfs.io/ipfs/")
    .trim();

  return (
    <div className="landingCoinLogo">
      {src ? (
        <img
          src={src}
          alt={coin?.symbol || "coin"}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <span>{String(coin?.symbol || "?").slice(0, 2)}</span>
      )}
    </div>
  );
}

export function TrendingSection({
  coins = [],
  loading = false,
  fmtUsd,
  getMovePct,
  onOpenCoin,
  onEnterApp,
}) {
  const list = (coins || []).slice(0, 8);

  return (
    <section className="landingSection" id="trending">
      <div className="landingContainer">
        <div className="landingSectionHead">
          <div>
            <h2 className="landingSectionTitle">Live trending coins</h2>
            <p className="landingSectionSub">
              Real-time movers from the Fun.Run bonding curve — updated as the community trades.
            </p>
          </div>
          <Pill>{list.length} live</Pill>
        </div>

        {loading && !list.length ? (
          <CoinListSkeleton count={4} />
        ) : list.length ? (
          <div className="landingTrendGrid">
            {list.map((coin) => {
              const move = getMovePct?.(coin) ?? 0;
              const up = move >= 0;

              return (
                <button
                  key={coin.id}
                  type="button"
                  className="landingTrendCard"
                  onClick={() => onOpenCoin?.(coin)}
                >
                  <CoinLogo coin={coin} />
                  <div className="landingTrendMeta">
                    <div className="landingTrendName">{coin.name || coin.symbol}</div>
                    <div className="landingTrendSub">
                      {coin.symbol} • MC {fmtUsd?.(coin.mc || 0)}
                    </div>
                  </div>
                  <div className="landingTrendRight">
                    <div className="landingTrendMc">{fmtUsd?.(coin.mc || 0)}</div>
                    <div className={`landingTrendMove ${up ? "up" : "down"}`}>
                      {up ? "+" : ""}
                      {move.toFixed(2)}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="📈"
            title="Trending feed warming up"
            description="Be the first creator on Fun.Run or check back as volume builds."
            actionLabel="Launch a Coin"
            onAction={() => onEnterApp?.("CREATE")}
            compact
          />
        )}
      </div>
    </section>
  );
}
