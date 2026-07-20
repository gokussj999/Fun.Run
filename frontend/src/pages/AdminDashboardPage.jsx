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
import { AdminPanelSkeleton, AdminSummarySkeleton } from "../components/admin";
import { buildAdminSnapshot, formatSignedPct } from "../lib/admin-metrics.js";
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

function MetricCard({ label, value, sub, tone = "neutral" }) {
  return (
    <div className={`adminMetricCard ${tone !== "neutral" ? `adminMetricCard--${tone}` : ""}`}>
      <div className="adminMetricCardLabel">{label}</div>
      <div className="adminMetricCardValue">{value}</div>
      {sub ? <div className="adminMetricCardSub">{sub}</div> : null}
    </div>
  );
}

function StatRow({ label, value, sub }) {
  return (
    <div className="adminStatRow">
      <div className="adminStatLabel">{label}</div>
      <div className="adminStatValue">
        {value}
        {sub ? <span className="adminStatSub">{sub}</span> : null}
      </div>
    </div>
  );
}

function StatusRow({ label, value, tone = "off" }) {
  return (
    <div className="adminStatusRow">
      <div className="adminStatusMain">
        <span className={`adminStatusDot adminStatusDot--${tone}`} />
        <span className="adminStatusLabel">{label}</span>
      </div>
      <span className="adminStatusValue">{value}</span>
    </div>
  );
}

function RecentTradesList({ trades = [], coins = [], onOpenCoin }) {
  if (!trades.length) {
    return (
      <EmptyState
        icon="🧾"
        title="No live trades yet"
        description="WebSocket trade events will appear here as the market moves."
        compact
      />
    );
  }

  return (
    <div className="adminActivityList scrollY">
      {trades.map((item) => {
        const coin =
          (coins || []).find((c) => String(c.id) === String(item.coinId)) || {
            id: item.coinId,
            name: item.name,
            symbol: item.symbol,
            logo: item.logo,
          };
        const isBuy = item.side === "BUY";

        return (
          <button
            key={item.id}
            type="button"
            className="adminActivityRow adminActivityRow--clickable"
            onClick={() => onOpenCoin?.(coin)}
          >
            <div className="adminActivityMain">
              <CoinLogo c={coin} size={38} radius={12} />
              <div style={{ minWidth: 0 }}>
                <div className="coinRowPrimary">
                  {coin.symbol || coin.name} •{" "}
                  <span className={isBuy ? "adminTextUp" : "adminTextDown"}>{item.side || "TRADE"}</span>
                </div>
                <div className="miniMuted">{item.ts ? timeAgo(item.ts) : "just now"}</div>
              </div>
            </div>
            <div className="coinRowSecondary">
              <div className="coinRowPrimary">{fmtSol(item.sol)} SOL</div>
              <div className="miniMuted">
                {item.tokens > 0 ? `${fmtNum(item.tokens, 0)} tokens` : "Live feed"}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function AdminDashboardPage({
  adSlot,
  onBack,
  authenticated = false,
  isAdmin = false,
  onLogin,
  loading = false,
  profile,
  solAddr = "",
  coins = [],
  recentTrades = [],
  hotCoins = [],
  coinsHasMore = false,
  wsConnected = false,
  solPriceUsd = 0,
  onClaimOwner,
  onOpenCoin,
  onGoHome,
  onGoSearch,
  shortWallet,
  runControl = null,
  runControlLoading = false,
  runControlError = "",
  onRefreshRunControl,
  onReleaseOwnerRun,
  onReleaseAirdropRun,
  runActionBusy = false,
}) {
  const snapshot = useMemo(
    () =>
      buildAdminSnapshot({
        coins,
        recentTrades,
        hotCoins,
        solPriceUsd,
        profile,
        coinsHasMore,
        wsConnected,
      }),
    [coins, recentTrades, hotCoins, solPriceUsd, profile, coinsHasMore, wsConnected]
  );

  const moveTone =
    snapshot.marketMove24hPct == null
      ? "neutral"
      : snapshot.marketMove24hPct >= 0
        ? "up"
        : "down";

  if (!authenticated || !solAddr) {
    return (
      <ScreenShell>
        <BackButton onClick={onBack} />
        <Card>
          <PageHeader title="Admin Console" />
          <EmptyState
            icon="🔐"
            title="Sign in required"
            description="Connect with Google using the platform owner wallet to open Admin Console."
            actionLabel="Google Login"
            onAction={onLogin}
          />
        </Card>
      </ScreenShell>
    );
  }

  if (!isAdmin) {
    return (
      <ScreenShell>
        <BackButton onClick={onBack} />
        <Card>
          <PageHeader title="Admin Console" />
          <EmptyState
            icon="🛡️"
            title="Access restricted"
            description="This console is only available to the Fun.Run platform owner. Your wallet does not have admin access."
            actionLabel="Back to Home"
            onAction={onGoHome}
            compact
          />
        </Card>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell className="adminScreenShell">
      <BackButton onClick={onBack} />

      {adSlot}

      {/* RUN supply locks — always first so admin never misses release controls */}
      <Card className="adminHeroCard" style={{ borderColor: "rgba(255, 229, 102, 0.45)" }}>
        <PageHeader
          title="RUN Locks"
          right={<Pill>10B total</Pill>}
        />
        <div className="miniMuted" style={{ marginBottom: 12 }}>
          Market <b>3B</b> public · Airdrop <b>5B</b> locked · Owner <b>2B</b> locked
        </div>
        {runControlLoading && !runControl ? (
          <AdminPanelSkeleton />
        ) : runControl ? (
          <div className="adminStatList">
            <div className="adminMetricGrid" style={{ marginBottom: 12 }}>
              <MetricCard
                label="Airdrop lock (5B)"
                value={`${fmtNum(runControl.airdropRemaining || 0, 0)}`}
                sub={`Released ${fmtNum(runControl.airdropReleased || 0, 0)} / ${fmtNum(runControl.airdropPool || 5_000_000_000, 0)}`}
              />
              <MetricCard
                label="Owner lock (2B)"
                value={
                  runControl.ownerReady
                    ? fmtNum(Math.max(0, (runControl.ownerAlloc || 0) - (runControl.ownerReleased || 0)), 0)
                    : "Credited"
                }
                sub={
                  runControl.ownerReady
                    ? "Ready to credit holdings"
                    : `${fmtNum(runControl.ownerReleased || 0, 0)} in your wallet`
                }
                tone={runControl.ownerReady ? "up" : "neutral"}
              />
              <MetricCard
                label="Market (public)"
                value="3B"
                sub="Bonding curve tradeable"
              />
              <MetricCard
                label="Pending users"
                value={String(runControl.pendingUsers || 0)}
                sub={`${fmtNum(runControl.pendingTokens || 0, 0)} RUN waiting`}
              />
            </div>
            <StatRow
              label="Unlock date"
              value={
                runControl.unlockAt
                  ? new Date(runControl.unlockAt).toISOString().slice(0, 10)
                  : "2027-01-01"
              }
              sub={runControl.unlockReady ? "Ready to release" : "Still locked"}
            />
            <div className="adminActionsRow" style={{ marginTop: 14, flexWrap: "wrap", gap: 10 }}>
              <MiniBtn
                tone="good"
                onClick={onReleaseOwnerRun}
                disabled={runActionBusy || !runControl.ownerReady || !onReleaseOwnerRun}
              >
                Release 2B → Owner Wallet
              </MiniBtn>
              <MiniBtn
                tone="good"
                onClick={onReleaseAirdropRun}
                disabled={
                  runActionBusy ||
                  !runControl.unlockReady ||
                  !(runControl.pendingUsers > 0) ||
                  !(runControl.airdropRemaining > 0) ||
                  !onReleaseAirdropRun
                }
              >
                Release 5B Airdrop → Users
              </MiniBtn>
              {onRefreshRunControl ? (
                <MiniBtn onClick={onRefreshRunControl} disabled={runControlLoading || runActionBusy}>
                  Refresh
                </MiniBtn>
              ) : null}
            </div>
            {!runControl.unlockReady ? (
              <div className="miniMuted" style={{ marginTop: 10 }}>
                Airdrop unlock = profile date (01 Jan 2027). Owner 2B abhi release ho sakta hai.
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState
            icon="🪙"
            title="RUN locks loading failed"
            description={runControlError || "Backend /admin/run-control deploy + login as owner, then Retry."}
            actionLabel="Retry"
            onAction={onRefreshRunControl}
            compact
          />
        )}
      </Card>

      <Card className="adminHeroCard">
        <PageHeader
          title="Admin Console"
          right={<Pill>{snapshot.coinsCount} coins</Pill>}
        />

        {loading && !coins.length ? (
          <AdminSummarySkeleton />
        ) : (
          <>
            <div className="adminHeroBalance">
              <div className="adminHeroLabel">Combined Market Cap</div>
              <div className="adminHeroValue">{fmtUsd(snapshot.totalMcUsd)}</div>
              <div className="adminHeroMeta">
                {fmtSol(snapshot.totalVolumeSol)} SOL lifetime volume • {shortWallet?.(solAddr) || solAddr}
              </div>
            </div>

            <div className="adminBalanceGrid">
              <div className="adminBalanceTile">
                <div className="adminBalanceTileLabel">Loaded Coins</div>
                <div className="adminBalanceTileValue">{snapshot.coinsCount}</div>
                <div className="adminBalanceTileSub">
                  {snapshot.coinsHasMore ? "More pages available" : "Current feed loaded"}
                </div>
              </div>
              <div className="adminBalanceTile">
                <div className="adminBalanceTileLabel">Total Users</div>
                <div className="adminBalanceTileValue">
                  {runControl ? String(runControl.totalUsers ?? 0) : "—"}
                </div>
                <div className="adminBalanceTileSub">
                  {runControl
                    ? `${runControl.usersWithBalance ?? 0} with SOL balance`
                    : "Open RUN Locks / Refresh"}
                </div>
              </div>
              <div className="adminBalanceTile">
                <div className="adminBalanceTileLabel">Creators</div>
                <div className="adminBalanceTileValue">{snapshot.creatorsCount}</div>
                <div className="adminBalanceTileSub">Unique launch wallets</div>
              </div>
              <div className="adminBalanceTile">
                <div className="adminBalanceTileLabel">Holders (seen)</div>
                <div className="adminBalanceTileValue">{snapshot.holdersCount}</div>
                <div className="adminBalanceTileSub">From loaded coin holder maps</div>
              </div>
            </div>
          </>
        )}
      </Card>

      <div className="adminMetricGrid">
        <MetricCard
          label="Lifetime Volume"
          value={`${fmtSol(snapshot.totalVolumeSol)} SOL`}
          sub={fmtUsd(snapshot.totalVolumeUsd)}
        />
        <MetricCard
          label="Market Move"
          value={formatSignedPct(snapshot.marketMove24hPct)}
          tone={moveTone}
        />
        <MetricCard label="Active 24h" value={String(snapshot.activeCoins24h)} />
        <MetricCard
          label="Owner Rewards"
          value={`${fmtSol(snapshot.ownerRewardsSol)} SOL`}
          sub={fmtUsd(snapshot.ownerRewardsUsd)}
        />
      </div>

      {!loading && onClaimOwner ? (
        <Card>
          <div className="adminClaimCard">
            <div>
              <div className="adminHeroLabel">Platform owner fees</div>
              <div className="adminClaimValue">{fmtSol(snapshot.ownerRewardsSol)} SOL</div>
              <div className="miniMuted" style={{ marginTop: 6 }}>
                {snapshot.ownerRewardsSol > 0
                  ? "Claim → Main Wallet (run balance), then Withdraw if needed"
                  : "No claimable owner fees yet — new trades will credit here"}
              </div>
            </div>
            <MiniBtn
              tone="good"
              onClick={onClaimOwner}
              disabled={!(snapshot.ownerRewardsSol > 0)}
            >
              Claim Owner Fees
            </MiniBtn>
          </div>
        </Card>
      ) : null}

      <div className="adminDesktopGrid">
        <Card>
          <SectionHeader title="Treasury Overview" />
          {loading && !profile ? (
            <AdminPanelSkeleton />
          ) : (
            <div className="adminStatList">
              <StatRow
                label="Owner rewards (claimable)"
                value={`${fmtSol(snapshot.ownerRewardsSol)} SOL`}
                sub={fmtUsd(snapshot.ownerRewardsUsd)}
              />
              <StatRow
                label="Creator fees (on loaded coins)"
                value={`${fmtSol(snapshot.totalCreatorRewardsSol)} SOL`}
              />
              <StatRow label="On-chain vault balance" value="—" />
              <StatRow label="Protocol fee history" value="—" />
            </div>
          )}
        </Card>

        <Card>
          <SectionHeader title="Users Overview" />
          {loading && !coins.length ? (
            <AdminPanelSkeleton />
          ) : (
            <div className="adminStatList">
              <StatRow
                label="Total registered users"
                value={runControl ? String(runControl.totalUsers ?? 0) : "—"}
              />
              <StatRow
                label="Users with RUN rewards"
                value={runControl ? String(runControl.usersWithRun ?? 0) : "—"}
              />
              <StatRow
                label="Users with SOL balance"
                value={runControl ? String(runControl.usersWithBalance ?? 0) : "—"}
              />
              <StatRow label="Unique creators" value={String(snapshot.creatorsCount)} />
              <StatRow label="Holders observed" value={String(snapshot.holdersCount)} />
            </div>
          )}
        </Card>
      </div>

      <div className="adminDesktopGrid">
        <Card>
          <SectionHeader
            title="Coins Overview"
            right={<Pill>{snapshot.topByMc.length}</Pill>}
          />
          {loading && !coins.length ? (
            <CoinListSkeleton count={4} />
          ) : snapshot.topByMc.length ? (
            <div className="adminCoinsList">
              {snapshot.topByMc.map((coin) => (
                <ProfileCoinRow
                  key={coin.id}
                  coin={coin}
                  secondary={`Vol ${fmtSol(coin.volumeSol || 0)} SOL • ${timeAgo(coin.createdAt)}`}
                  rightMain={fmtUsd(coin.mc || 0)}
                  rightSub={coin.symbol}
                  onClick={() => onOpenCoin?.(coin)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🪙"
              title="No coins loaded"
              description="Coin feed is empty. Check Search or wait for launches."
              actionLabel="Open Search"
              onAction={onGoSearch}
              compact
            />
          )}
        </Card>

        <Card>
          <SectionHeader
            title="Trading Statistics"
            right={<Pill>{snapshot.liveTradeCount}</Pill>}
          />
          {loading && !coins.length ? (
            <AdminPanelSkeleton />
          ) : (
            <div className="adminStatList">
              <StatRow
                label="Lifetime volume (loaded coins)"
                value={`${fmtSol(snapshot.totalVolumeSol)} SOL`}
                sub={fmtUsd(snapshot.totalVolumeUsd)}
              />
              <StatRow label="Live trade events" value={String(snapshot.liveTradeCount)} />
              <StatRow label="Live buffer volume" value={`${fmtSol(snapshot.liveTradeVolumeSol)} SOL`} />
              <StatRow label="Hot list size" value={String(snapshot.hotCount)} />
              <StatRow label="Global trade ledger" value="—" />
            </div>
          )}
        </Card>
      </div>

      <Card>
        <SectionHeader
          title="Latest Launches"
          right={<Pill>{snapshot.latestLaunches.length}</Pill>}
        />
        {loading && !coins.length ? (
          <CoinListSkeleton count={3} />
        ) : snapshot.latestLaunches.length ? (
          <div className="adminCoinsList">
            {snapshot.latestLaunches.map((coin) => (
              <ProfileCoinRow
                key={coin.id}
                coin={coin}
                secondary={`${shortWallet?.(coin.creatorWallet) || coin.creatorWallet || "—"} • ${timeAgo(coin.createdAt)}`}
                rightMain={fmtUsd(coin.mc || 0)}
                rightSub={`Vol ${fmtSol(coin.volumeSol || 0)}`}
                onClick={() => onOpenCoin?.(coin)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🚀"
            title="No launches yet"
            description="New coin creations will show here as they enter the feed."
            compact
          />
        )}
      </Card>

      <Card>
        <SectionHeader
          title="Recent Activity"
          right={<Pill>{snapshot.tradeRows.length}</Pill>}
        />
        {loading && !snapshot.hasTrades && !coins.length ? (
          <CoinListSkeleton count={3} />
        ) : (
          <RecentTradesList trades={snapshot.tradeRows} coins={coins} onOpenCoin={onOpenCoin} />
        )}
      </Card>

      <Card>
        <SectionHeader title="System Status" />
        <div className="adminStatusList">
          <StatusRow
            label="WebSocket gateway"
            value={snapshot.wsConnected ? "Connected" : "Reconnecting"}
            tone={snapshot.wsConnected ? "ok" : "warn"}
          />
          <StatusRow
            label="Coin feed"
            value={
              snapshot.hasCoins
                ? snapshot.coinsHasMore
                  ? `${snapshot.coinsCount}+ loaded`
                  : `${snapshot.coinsCount} loaded`
                : "Empty"
            }
            tone={snapshot.hasCoins ? "ok" : "warn"}
          />
          <StatusRow
            label="SOL price feed"
            value={solPriceUsd > 0 ? `$${solPriceUsd.toFixed(2)}` : "Unavailable"}
            tone={solPriceUsd > 0 ? "ok" : "warn"}
          />
          <StatusRow label="Indexer depth" value="Unavailable" tone="off" />
          <StatusRow label="Background workers" value="Unavailable" tone="off" />
        </div>
      </Card>

      <Card>
        <div className="adminActionsRow">
          <MiniBtn tone="good" onClick={onGoSearch}>
            Inspect Markets
          </MiniBtn>
          <MiniBtn onClick={onGoHome}>Back to Home</MiniBtn>
        </div>
      </Card>
    </ScreenShell>
  );
}
