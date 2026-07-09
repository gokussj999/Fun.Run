import React, { useMemo } from "react";
import { ScreenShell, BackButton } from "../components/layout";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { Card } from "../components/ui/Card.jsx";
import { MiniBtn } from "../components/ui/Button.jsx";
import { Pill } from "../components/ui/Pill.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { CoinListSkeleton } from "../components/ui/Skeleton.jsx";
import { ReferralLinkSkeleton, ReferralSummarySkeleton } from "../components/referral";
import { buildReferralSnapshot } from "../lib/referral-metrics.js";
import { fmtSol, fmtUsd } from "../lib/coin-display.js";

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

function MetricCard({ label, value, sub }) {
  return (
    <div className="referralMetricCard">
      <div className="referralMetricCardLabel">{label}</div>
      <div className="referralMetricCardValue">{value}</div>
      {sub ? <div className="referralMetricCardSub">{sub}</div> : null}
    </div>
  );
}

function StatRow({ label, value, sub }) {
  return (
    <div className="referralStatRow">
      <div className="referralStatLabel">{label}</div>
      <div className="referralStatValue">
        {value}
        {sub ? <span className="referralStatSub">{sub}</span> : null}
      </div>
    </div>
  );
}

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Share your link",
    sub: "Copy your personal affiliate link and send it to friends or communities.",
  },
  {
    step: "2",
    title: "They join Fun.Run",
    sub: "When someone opens your link and connects, they are tagged to your wallet.",
  },
  {
    step: "3",
    title: "Earn from volume",
    sub: "You receive affiliate rewards from qualifying trading activity — claim anytime.",
  },
];

export function ReferralDashboardPage({
  adSlot,
  onBack,
  authenticated = false,
  onLogin,
  loading = false,
  profile,
  solAddr = "",
  referralLink = "",
  referralCount = 0,
  referralRewardsSol = 0,
  solPriceUsd = 0,
  onCopyLink,
  onShareLink,
  onClaimReferral,
  onGoHome,
  shortWallet,
}) {
  const snapshot = useMemo(
    () =>
      buildReferralSnapshot({
        profile: {
          ...(profile || {}),
          referralCount:
            referralCount != null ? referralCount : profile?.referralCount,
          referralRewardsSol:
            referralRewardsSol != null
              ? referralRewardsSol
              : profile?.referralRewardsSol,
        },
        referralLink,
        solPriceUsd,
      }),
    [profile, referralCount, referralRewardsSol, referralLink, solPriceUsd]
  );

  if (!authenticated || !solAddr) {
    return (
      <ScreenShell>
        <BackButton onClick={onBack} />
        <Card>
          <PageHeader title="Affiliate Center" />
          <EmptyState
            icon="🔐"
            title="Sign in to open Affiliate Center"
            description="Connect with Google to view your referral link, affiliate count, and claimable rewards."
            actionLabel="Google Login"
            onAction={onLogin}
          />
        </Card>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell className="referralScreenShell">
      <BackButton onClick={onBack} />

      {adSlot}

      <Card className="referralHeroCard">
        <PageHeader
          title="Affiliate Center"
          right={<Pill>{snapshot.referralCount} affiliates</Pill>}
        />

        {loading && !profile ? (
          <ReferralSummarySkeleton />
        ) : (
          <>
            <div className="referralHeroBalance">
              <div className="referralHeroLabel">Claimable Affiliate Rewards</div>
              <div className="referralHeroValue">{fmtSol(snapshot.claimableSol)} SOL</div>
              <div className="referralHeroMeta">
                {fmtUsd(snapshot.claimableUsd)} USD • {shortWallet?.(solAddr) || solAddr}
              </div>
            </div>

            <div className="referralBalanceGrid">
              <div className="referralBalanceTile">
                <div className="referralBalanceTileLabel">Total Affiliates</div>
                <div className="referralBalanceTileValue">{snapshot.referralCount}</div>
                <div className="referralBalanceTileSub">Users tagged to your link</div>
              </div>
              <div className="referralBalanceTile">
                <div className="referralBalanceTileLabel">Reward Rate</div>
                <div className="referralBalanceTileValue">50%</div>
                <div className="referralBalanceTileSub">Platform affiliate share</div>
              </div>
              <div className="referralBalanceTile">
                <div className="referralBalanceTileLabel">Avg / Affiliate</div>
                <div className="referralBalanceTileValue">
                  {snapshot.avgRewardSol != null ? `${fmtSol(snapshot.avgRewardSol)} SOL` : "—"}
                </div>
                <div className="referralBalanceTileSub">
                  {snapshot.hasAffiliates ? "Based on claimable balance" : "Invite your first user"}
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      <div className="referralMetricGrid">
        <MetricCard
          label="Claimable"
          value={`${fmtSol(snapshot.claimableSol)} SOL`}
          sub={fmtUsd(snapshot.claimableUsd)}
        />
        <MetricCard label="Affiliates" value={String(snapshot.referralCount)} />
        <MetricCard label="Share" value="50%" />
        <MetricCard label="Link Status" value={snapshot.referralLink ? "Ready" : "—"} />
      </div>

      {!loading && snapshot.hasEarnings ? (
        <Card>
          <div className="referralClaimCard">
            <div>
              <div className="referralHeroLabel">Ready to claim</div>
              <div className="referralClaimValue">{fmtSol(snapshot.claimableSol)} SOL</div>
            </div>
            <MiniBtn tone="good" onClick={onClaimReferral}>
              Claim Affiliate Fees
            </MiniBtn>
          </div>
        </Card>
      ) : null}

      <div className="referralDesktopGrid">
        <Card>
          <SectionHeader title="Your Referral Link" />
          {loading && !profile ? (
            <ReferralLinkSkeleton />
          ) : snapshot.referralLink ? (
            <>
              <div className="referralLinkBox">
                <div className="referralLinkText" title={snapshot.referralLink}>
                  {snapshot.referralLink}
                </div>
              </div>
              <div className="referralLinkActions">
                <MiniBtn tone="good" onClick={onCopyLink}>
                  Copy Link
                </MiniBtn>
                <MiniBtn onClick={onShareLink}>Share</MiniBtn>
              </div>
            </>
          ) : (
            <EmptyState
              icon="🔗"
              title="Link unavailable"
              description="Connect your wallet to generate a personal affiliate link."
              compact
            />
          )}
        </Card>

        <Card>
          <SectionHeader title="Referral Statistics" />
          {loading && !profile ? (
            <CoinListSkeleton count={3} />
          ) : (
            <div className="referralStatList">
              <StatRow label="Total affiliates" value={String(snapshot.referralCount)} />
              <StatRow
                label="Claimable rewards"
                value={`${fmtSol(snapshot.claimableSol)} SOL`}
                sub={fmtUsd(snapshot.claimableUsd)}
              />
              <StatRow
                label="Average per affiliate"
                value={snapshot.avgRewardSol != null ? `${fmtSol(snapshot.avgRewardSol)} SOL` : "—"}
              />
              <StatRow label="Affiliate rate" value="50%" />
            </div>
          )}
        </Card>
      </div>

      <Card>
        <SectionHeader title="Earnings Summary" />
        {loading && !profile ? (
          <CoinListSkeleton count={2} />
        ) : snapshot.hasEarnings ? (
          <div className="referralStatList">
            <StatRow
              label="Pending affiliate rewards"
              value={`${fmtSol(snapshot.claimableSol)} SOL`}
              sub={fmtUsd(snapshot.claimableUsd)}
            />
            <StatRow label="Reward source" value="Affiliate volume" />
          </div>
        ) : (
          <EmptyState
            icon="💰"
            title="No affiliate earnings yet"
            description="Share your link — rewards appear here once referred users start trading."
            actionLabel="Copy Link"
            onAction={onCopyLink}
            compact
          />
        )}
      </Card>

      <Card>
        <SectionHeader title="Recent Referral Activity" right={<Pill>0</Pill>} />
        <EmptyState
          icon="🧾"
          title="Detailed activity coming soon"
          description="Individual referral joins and fee events will appear here once the referral ledger is available. Your totals above are live."
          compact
        />
      </Card>

      <Card>
        <SectionHeader title="How it works" />
        <div className="referralHowList">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="referralHowItem">
              <div className="referralHowStep">{item.step}</div>
              <div>
                <div className="referralHowTitle">{item.title}</div>
                <div className="referralHowSub">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {!snapshot.hasAffiliates && !loading ? (
        <Card>
          <EmptyState
            icon="🤝"
            title="No affiliates yet"
            description="Invite friends with your link. Affiliate count updates when someone joins through you."
            actionLabel="Copy Affiliate Link"
            onAction={onCopyLink}
            compact
          />
        </Card>
      ) : null}

      <Card>
        <div className="referralActionsRow">
          <MiniBtn tone="good" onClick={onCopyLink}>
            Copy Affiliate Link
          </MiniBtn>
          <MiniBtn onClick={onGoHome}>Back to Home</MiniBtn>
        </div>
      </Card>
    </ScreenShell>
  );
}
