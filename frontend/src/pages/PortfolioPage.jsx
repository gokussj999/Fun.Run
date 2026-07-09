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
import { AllocationSkeleton, PortfolioSummarySkeleton } from "../components/portfolio";
import {
  buildPortfolioSnapshot,
  formatSignedPct,
  formatSignedUsd,
} from "../lib/portfolio-metrics.js";
import { fmtNum, fmtSol, fmtUsd, timeAgo } from "../lib/coin-display.js";

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

function PnlCard({ label, value, sub, tone = "neutral" }) {
  return (
    <div className={`portfolioPnlCard portfolioPnlCard--${tone}`}>
      <div className="portfolioPnlCardLabel">{label}</div>
      <div className="portfolioPnlCardValue">{value}</div>
      {sub ? <div className="portfolioPnlCardSub">{sub}</div> : null}
    </div>
  );
}

function AllocationPanel({ allocation = [], totalUsd = 0 }) {
  if (!allocation.length) {
    return (
      <EmptyState
        icon="📊"
        title="No allocation yet"
        description="Fund your wallet or buy tokens to see how your portfolio is distributed."
        compact
      />
    );
  }

  return (
    <div className="portfolioAllocation">
      <div className="portfolioAllocationBar" aria-hidden="true">
        {allocation.map((item) => (
          <div
            key={item.id}
            className={`portfolioAllocationSegment portfolioAllocationSegment--${item.tone}`}
            style={{ width: `${Math.max(item.pct, item.valueUsd > 0 ? 4 : 0)}%` }}
            title={`${item.label} ${item.pct.toFixed(1)}%`}
          />
        ))}
      </div>

      <div className="portfolioAllocationLegend">
        {allocation.map((item) => (
          <div key={item.id} className="portfolioAllocationRow">
            <div className="portfolioAllocationRowMain">
              <span className={`portfolioAllocationDot portfolioAllocationDot--${item.tone}`} />
              <span className="portfolioAllocationLabel">{item.label}</span>
            </div>
            <div className="portfolioAllocationRowRight">
              <span className="portfolioAllocationPct">{item.pct.toFixed(1)}%</span>
              <span className="portfolioAllocationUsd">{fmtUsd(item.valueUsd)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="portfolioAllocationFoot miniMuted">
        Total tracked value {fmtUsd(totalUsd)}
      </div>
    </div>
  );
}

function RecentActivityList({ activity = [], coins = [], onOpenCoin }) {
  if (!activity.length) {
    return (
      <EmptyState
        icon="🧾"
        title="No recent activity"
        description="Trades, deposits, and withdrawals will appear here once you start using Fun.Run."
        compact
      />
    );
  }

  return (
    <div className="portfolioActivityList scrollY">
      {activity.map((item) => {
        if (item.kind === "WALLET") {
          const isDeposit = item.side === "DEPOSIT";
          return (
            <div key={item.id} className="portfolioActivityRow">
              <div className="portfolioActivityMain">
                <span className={`portfolioActivityIcon ${isDeposit ? "up" : "down"}`}>{isDeposit ? "↓" : "↑"}</span>
                <div>
                  <div className="coinRowPrimary">{item.side}</div>
                  <div className="miniMuted">{timeAgo(item.ts)}</div>
                </div>
              </div>
              <div className="coinRowSecondary">
                <div className="coinRowPrimary">{fmtSol(item.sol)} SOL</div>
                <div className="miniMuted">{String(item.txHash || "").slice(0, 8)}...</div>
              </div>
            </div>
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
            className="portfolioActivityRow portfolioActivityRow--clickable"
            onClick={() => onOpenCoin?.(coin)}
          >
            <div className="portfolioActivityMain">
              <CoinLogo c={coin} size={38} radius={12} />
              <div style={{ minWidth: 0 }}>
                <div className="coinRowPrimary">
                  {coin.symbol || coin.name} • <span className={isBuy ? "portfolioTextUp" : "portfolioTextDown"}>{item.side}</span>
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

export function PortfolioPage({
  adSlot,
  onBack,
  authenticated = false,
  onLogin,
  loading = false,
  profile,
  solAddr = "",
  coins = [],
  holdings = [],
  txs = [],
  walletHistory = [],
  walletSolBalance = 0,
  solPriceUsd = 0,
  onOpenCoin,
  onGoSearch,
  onGoHome,
  shortWallet,
}) {
  const snapshot = useMemo(
    () =>
      buildPortfolioSnapshot({
        profile,
        coins,
        holdings,
        txs,
        walletHistory,
        walletSolBalance,
        solPriceUsd,
      }),
    [profile, coins, holdings, txs, walletHistory, walletSolBalance, solPriceUsd]
  );

  if (!authenticated || !solAddr) {
    return (
      <ScreenShell>
        <BackButton onClick={onBack} />
        <Card>
          <PageHeader title="Portfolio" />
          <EmptyState
            icon="🔐"
            title="Sign in to view portfolio"
            description="Connect with Google to load your wallet, token holdings, and trade history."
            actionLabel="Google Login"
            onAction={onLogin}
          />
        </Card>
      </ScreenShell>
    );
  }

  const changeTone = (snapshot.change24hPct ?? 0) >= 0 ? "up" : "down";
  const pnlTone = snapshot.hasUnrealizedPnl ? (snapshot.unrealizedPnlUsd >= 0 ? "up" : "down") : "neutral";

  return (
    <ScreenShell className="portfolioScreenShell">
      <BackButton onClick={onBack} />

      {adSlot}

      <Card className="portfolioHeroCard">
        <PageHeader
          title="Portfolio"
          right={<Pill>{snapshot.holdingsCount} assets</Pill>}
        />

        {loading && !profile ? (
          <PortfolioSummarySkeleton />
        ) : (
          <>
            <div className="portfolioHeroBalance">
              <div className="portfolioHeroLabel">Total Balance</div>
              <div className="portfolioHeroValue">{fmtUsd(snapshot.totalUsd)}</div>
              <div className="portfolioHeroMeta">
                {fmtSol(snapshot.walletSol)} SOL wallet • {shortWallet?.(solAddr) || solAddr}
              </div>
            </div>

            <div className="portfolioBalanceGrid">
              <div className="portfolioBalanceTile">
                <div className="portfolioBalanceTileLabel">Wallet</div>
                <div className="portfolioBalanceTileValue">{fmtUsd(snapshot.walletUsd)}</div>
                <div className="portfolioBalanceTileSub">{fmtSol(snapshot.walletSol)} SOL</div>
              </div>
              <div className="portfolioBalanceTile">
                <div className="portfolioBalanceTileLabel">Holdings</div>
                <div className="portfolioBalanceTileValue">{fmtUsd(snapshot.holdingsUsd)}</div>
                <div className="portfolioBalanceTileSub">{snapshot.holdingsCount} positions</div>
              </div>
              <div className="portfolioBalanceTile">
                <div className="portfolioBalanceTileLabel">Rewards</div>
                <div className="portfolioBalanceTileValue">{fmtUsd(snapshot.rewardsUsd)}</div>
              </div>
            </div>
          </>
        )}
      </Card>

      <div className="portfolioPnlGrid">
        <PnlCard label="Total Balance" value={fmtUsd(snapshot.totalUsd)} tone="neutral" />
        <PnlCard
          label="Unrealized P&L"
          value={snapshot.hasUnrealizedPnl ? formatSignedUsd(snapshot.unrealizedPnlUsd) : "—"}
          tone={pnlTone}
        />
        <PnlCard
          label="24h Holdings Move"
          value={snapshot.change24hPct != null ? formatSignedPct(snapshot.change24hPct) : "—"}
          tone={changeTone}
        />
        <PnlCard label="Realized P&L" value="—" tone="neutral" />
      </div>

      <div className="portfolioDesktopGrid">
        <Card>
          <SectionHeader title="Asset Allocation" />
          {loading && !profile ? <AllocationSkeleton /> : <AllocationPanel allocation={snapshot.allocation} totalUsd={snapshot.totalUsd} />}
        </Card>

        <Card>
          <SectionHeader
            title="Holdings"
            right={<Pill>{snapshot.holdingsRows.length}</Pill>}
          />
          {loading && !profile ? (
            <CoinListSkeleton count={4} />
          ) : snapshot.holdingsRows.length ? (
            <div className="portfolioHoldingsList">
              {snapshot.holdingsRows.map((row) => (
                  <ProfileCoinRow
                    key={row.key}
                    coin={row.coin}
                    secondary={`${fmtNum(row.amount, 0)} tokens • ${row.allocationPct.toFixed(1)}% of holdings`}
                    rightMain={fmtUsd(row.valueUsd)}
                    rightSub={row.hasPnlBasis ? `P&L ${formatSignedUsd(row.pnlUsd)}` : "P&L —"}
                    onClick={() => onOpenCoin?.(row.coin)}
                  />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="💼"
              title="No holdings yet"
              description="Buy coins from Home or Search to build your portfolio."
              actionLabel="Explore Coins"
              onAction={onGoSearch}
              compact
            />
          )}
        </Card>
      </div>

      <Card>
        <SectionHeader
          title="Recent Transactions"
          right={<Pill>{snapshot.recentActivity.length}</Pill>}
        />
        {loading && !profile ? (
          <CoinListSkeleton count={3} />
        ) : (
          <RecentActivityList activity={snapshot.recentActivity} coins={coins} onOpenCoin={onOpenCoin} />
        )}
      </Card>

      <Card className="portfolioActionsCard">
        <div className="portfolioActionsRow">
          <MiniBtn tone="good" onClick={onGoSearch}>
            Explore Markets
          </MiniBtn>
          <MiniBtn onClick={onGoHome}>Back to Home</MiniBtn>
        </div>
      </Card>
    </ScreenShell>
  );
}
