import React, { useMemo } from "react";
import { ScreenShell, BackButton } from "../components/layout";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { Card } from "../components/ui/Card.jsx";
import { MiniBtn } from "../components/ui/Button.jsx";
import { Pill } from "../components/ui/Pill.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { CoinListSkeleton } from "../components/ui/Skeleton.jsx";
import { CoinLogo } from "../components/coins";
import { ProfileCoinRow } from "../components/profile/ProfileCoinRow.jsx";
import { CreatorEarningsSkeleton, CreatorSummarySkeleton } from "../components/creator";
import { buildCreatorSnapshot, formatSignedPct } from "../lib/creator-metrics.js";
import { fmtNum, fmtSol, fmtUsd, safeNum, timeAgo } from "../lib/coin-display.js";

function SectionHeader({ title, sub, right }) {
  return (
    <div className="sectionHeader homeSectionHeader">
      <div>
        <div className="sectionTitle">{title}</div>
        {sub ? <div className="sectionSub">{sub}</div> : null}
      </div>
      {right}
    </div>
  );
}

function MetricCard({ label, value, sub, tone = "neutral" }) {
  return (
    <div className={`creatorMetricCard ${tone !== "neutral" ? `creatorMetricCard--${tone}` : ""}`}>
      <div className="creatorMetricCardLabel">{label}</div>
      <div className="creatorMetricCardValue">{value}</div>
      {sub ? <div className="creatorMetricCardSub">{sub}</div> : null}
    </div>
  );
}

function EarningsPanel({ earnings = [], totalSol = 0 }) {
  if (!earnings.length) {
    return (
      <EmptyState
        icon="💰"
        title="No earnings yet"
        description="Creator fees accumulate as traders buy and sell your launched coins."
        compact
      />
    );
  }

  return (
    <div className="creatorEarningsPanel">
      <div className="creatorEarningsBar" aria-hidden="true">
        {earnings.map((item, idx) => (
          <div
            key={item.id}
            className={`creatorEarningsSegment ${idx % 2 ? "creatorEarningsSegment--alt" : ""}`}
            style={{ width: `${Math.max(item.pct, item.valueSol > 0 ? 4 : 0)}%` }}
            title={`${item.label} ${item.pct.toFixed(1)}%`}
          />
        ))}
      </div>

      <div className="creatorEarningsLegend">
        {earnings.map((item, idx) => (
          <div key={item.id} className="creatorEarningsRow">
            <div className="creatorEarningsRowMain">
              <span className={`creatorEarningsDot ${idx % 2 ? "creatorEarningsDot--alt" : ""}`} />
              <span className="creatorEarningsLabel">{item.label}</span>
            </div>
            <div className="creatorEarningsRowRight">
              <span className="creatorEarningsPct">{item.pct.toFixed(1)}%</span>
              <span className="creatorEarningsSol">{fmtSol(item.valueSol)} SOL</span>
            </div>
          </div>
        ))}
      </div>

      <div className="portfolioAllocationFoot miniMuted">
        Total unclaimed {fmtSol(totalSol)} SOL
      </div>
    </div>
  );
}

function PerformanceList({ rows = [], onOpenCoin }) {
  if (!rows.length) {
    return (
      <EmptyState
        icon="📈"
        title="No performance data"
        description="Launch a coin to start tracking market cap, volume, and holder growth."
        compact
      />
    );
  }

  return (
    <div className="creatorPerformanceList">
      {rows.map((row) => {
        const move = row.move24h ?? 0;
        const moveSign = move > 0 ? "+" : "";

        return (
          <ProfileCoinRow
            key={row.coin?.id}
            coin={row.coin}
            secondary={`MC ${fmtUsd(row.mcUsd)} • Vol ${fmtSol(row.volumeSol)} SOL • ${row.holderCount} holders`}
            rightMain={`${moveSign}${move.toFixed(2)}%`}
            rightSub={`Reward ${fmtSol(row.rewardsSol)} SOL`}
            onClick={() => onOpenCoin?.(row.coin)}
          />
        );
      })}
    </div>
  );
}

function RecentActivityList({ activity = [], coins = [], onOpenCoin }) {
  if (!activity.length) {
    return (
      <EmptyState
        icon="🧾"
        title="No recent activity"
        description="Launches and trades on your coins will appear here."
        compact
      />
    );
  }

  return (
    <div className="creatorActivityList scrollY">
      {activity.map((item) => {
        if (item.kind === "LAUNCH") {
          const coin = item.coin || (coins || []).find((c) => String(c.id) === String(item.coinId)) || {};
          return (
            <button
              key={item.id}
              type="button"
              className="creatorActivityRow creatorActivityRow--clickable"
              onClick={() => onOpenCoin?.(coin)}
            >
              <div className="creatorActivityMain">
                <span className="creatorActivityIcon">🚀</span>
                <div style={{ minWidth: 0 }}>
                  <div className="coinRowPrimary">
                    Launched {coin.symbol || coin.name || "coin"}
                  </div>
                  <div className="miniMuted">{timeAgo(item.ts)}</div>
                </div>
              </div>
              <div className="coinRowSecondary">
                <div className="coinRowPrimary">{fmtUsd(coin.mc || 0)}</div>
                <div className="miniMuted">Starting MC</div>
              </div>
            </button>
          );
        }

        const coin =
          (coins || []).find((c) => String(c.id) === String(item.coinId)) || {
            id: item.coinId,
            name: item.coinName || item.symbol || "Unknown",
            symbol: item.symbol || "??",
            logo: item.logo || "",
          };
        const isBuy = item.side === "BUY";

        return (
          <button
            key={item.id}
            type="button"
            className="creatorActivityRow creatorActivityRow--clickable"
            onClick={() => onOpenCoin?.(coin)}
          >
            <div className="creatorActivityMain">
              <CoinLogo c={coin} size={38} radius={12} />
              <div style={{ minWidth: 0 }}>
                <div className="coinRowPrimary">
                  {coin.symbol || coin.name} •{" "}
                  <span className={isBuy ? "creatorTextUp" : "creatorTextDown"}>{item.side}</span>
                </div>
                <div className="miniMuted">{timeAgo(item.ts)}</div>
              </div>
            </div>
            <div className="coinRowSecondary">
              <div className="coinRowPrimary">{fmtSol(item.sol)} SOL</div>
              <div className="miniMuted">{fmtNum(item.tokens, 0)} tokens</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function CreatorDashboardPage({
  adSlot,
  onBack,
  authenticated = false,
  onLogin,
  loading = false,
  profile,
  solAddr = "",
  myCoins = [],
  txs = [],
  solPriceUsd = 0,
  creatorRewardsSol = 0,
  onClaimCreator,
  onOpenCoin,
  onCreateCoin,
  onGoHome,
  shortWallet,
}) {
  const snapshot = useMemo(
    () =>
      buildCreatorSnapshot({
        profile,
        myCoins,
        txs,
        solPriceUsd,
      }),
    [profile, myCoins, txs, solPriceUsd]
  );

  const changeTone = (snapshot.change24hPct ?? 0) >= 0 ? "up" : "down";
  const claimableSol = Math.max(safeNum(creatorRewardsSol), snapshot.totalRewardsSol);

  if (!authenticated || !solAddr) {
    return (
      <ScreenShell>
        <BackButton onClick={onBack} />
        <Card>
          <PageHeader title="Creator Studio" />
          <EmptyState
            icon="🔐"
            title="Sign in to open Creator Studio"
            description="Connect with Google to view your launched coins and creator fee earnings."
            actionLabel="Google Login"
            onAction={onLogin}
          />
        </Card>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell className="creatorScreenShell">
      <BackButton onClick={onBack} />

      {adSlot}

      <Card className="creatorHeroCard">
        <PageHeader
          title="Creator Studio"
          right={<Pill>{snapshot.coinsCount} coins</Pill>}
        />

        {loading && !profile ? (
          <CreatorSummarySkeleton />
        ) : (
          <>
            <div className="creatorHeroBalance">
              <div className="creatorHeroLabel">Total Creator Earnings</div>
              <div className="creatorHeroValue">{fmtSol(claimableSol)} SOL</div>
              <div className="creatorHeroMeta">
                {fmtUsd(snapshot.totalRewardsUsd)} USD • {shortWallet?.(solAddr) || solAddr}
              </div>
            </div>

            <div className="creatorBalanceGrid">
              <div className="creatorBalanceTile">
                <div className="creatorBalanceTileLabel">Launched Coins</div>
                <div className="creatorBalanceTileValue">{snapshot.coinsCount}</div>
                <div className="creatorBalanceTileSub">
                  {snapshot.activeCoins7d} active this week
                </div>
              </div>
              <div className="creatorBalanceTile">
                <div className="creatorBalanceTileLabel">Combined MC</div>
                <div className="creatorBalanceTileValue">{fmtUsd(snapshot.totalMcUsd)}</div>
                <div className="creatorBalanceTileSub">Across all launches</div>
              </div>
              <div className="creatorBalanceTile">
                <div className="creatorBalanceTileLabel">Total Volume</div>
                <div className="creatorBalanceTileValue">{fmtSol(snapshot.totalVolumeSol)} SOL</div>
                <div className="creatorBalanceTileSub">{fmtUsd(snapshot.totalVolumeUsd)} traded</div>
              </div>
            </div>
          </>
        )}
      </Card>

      <div className="creatorMetricGrid">
        <MetricCard
          label="Claimable Rewards"
          value={fmtSol(claimableSol)}
          sub={fmtUsd(claimableSol * solPriceUsd)}
          tone="neutral"
        />
        <MetricCard
          label="Portfolio MC Move"
          value={snapshot.change24hPct != null ? formatSignedPct(snapshot.change24hPct) : "—"}
          tone={changeTone}
        />
        <MetricCard
          label="Top Performer"
          value={snapshot.topPerformer?.coin?.symbol || "—"}
          sub={
            snapshot.topPerformer
              ? `MC ${fmtUsd(snapshot.topPerformer.mcUsd)}`
              : undefined
          }
          tone="neutral"
        />
        <MetricCard
          label="Lifetime Volume"
          value={fmtSol(snapshot.totalVolumeSol)}
          tone="neutral"
        />
      </div>

      {!loading && claimableSol > 0 ? (
        <Card>
          <div className="creatorClaimCard">
            <div>
              <div className="creatorHeroLabel">Ready to claim</div>
              <div className="creatorClaimValue">{fmtSol(claimableSol)} SOL</div>
            </div>
            <MiniBtn tone="good" onClick={onClaimCreator}>
              Claim Creator Fees
            </MiniBtn>
          </div>
        </Card>
      ) : null}

      <div className="creatorDesktopGrid">
        <Card>
          <SectionHeader title="Earnings Summary" />
          {loading && !profile ? (
            <CreatorEarningsSkeleton />
          ) : (
            <EarningsPanel earnings={snapshot.earningsByCoin} totalSol={claimableSol} />
          )}
        </Card>

        <Card>
          <SectionHeader
            title="Coin Performance"
            right={<Pill>{snapshot.performanceRows.length}</Pill>}
          />
          {loading && !profile ? (
            <CoinListSkeleton count={4} />
          ) : (
            <PerformanceList rows={snapshot.performanceRows} onOpenCoin={onOpenCoin} />
          )}
        </Card>
      </div>

      <Card>
        <SectionHeader
          title="My Coins"
          right={<Pill>{snapshot.coinRows.length}</Pill>}
        />
        {loading && !profile ? (
          <CoinListSkeleton count={4} />
        ) : snapshot.coinRows.length ? (
          <div className="creatorCoinsList">
            {snapshot.coinRows.map((row) => (
              <ProfileCoinRow
                key={row.coin?.id}
                coin={row.coin}
                secondary={`Reward ${fmtSol(row.rewardsSol)} SOL • Vol ${fmtSol(row.volumeSol)} SOL • ${timeAgo(row.createdAt)}`}
                rightMain={fmtUsd(row.mcUsd)}
                rightSub={`${row.holderCount} holders`}
                onClick={() => onOpenCoin?.(row.coin)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🎨"
            title="No launched coins yet"
            description="Create your first meme coin and start earning creator fees on every trade."
            actionLabel="Launch Coin"
            onAction={onCreateCoin}
            compact
          />
        )}
      </Card>

      <Card>
        <SectionHeader
          title="Recent Activity"
          right={<Pill>{snapshot.recentActivity.length}</Pill>}
        />
        {loading && !profile ? (
          <CoinListSkeleton count={3} />
        ) : (
          <RecentActivityList
            activity={snapshot.recentActivity}
            coins={myCoins}
            onOpenCoin={onOpenCoin}
          />
        )}
      </Card>

      <Card>
        <div className="creatorActionsRow">
          <MiniBtn tone="good" onClick={onCreateCoin}>
            Launch New Coin
          </MiniBtn>
          <MiniBtn onClick={onGoHome}>Back to Home</MiniBtn>
        </div>
      </Card>
    </ScreenShell>
  );
}
