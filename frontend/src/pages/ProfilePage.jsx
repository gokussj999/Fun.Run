import React, { useState } from "react";
import { ScreenShell, BackButton } from "../components/layout";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { MiniBtn } from "../components/ui/Button.jsx";
import { Pill } from "../components/ui/Pill.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { CoinListSkeleton, ProfileHeaderSkeleton } from "../components/ui/Skeleton.jsx";
import { CoinLogo, CoinMiniCard } from "../components/coins";
import { ProfileCoinRow } from "../components/profile/ProfileCoinRow.jsx";
import { fmtNum, fmtSol, fmtUsd, safeNum } from "../lib/coin-display.js";

function SectionHeader({ title, right }) {
  return (
    <div className="sectionHeader homeSectionHeader">
      <div>
        <div className="sectionTitle">{title}</div>
      </div>
      {right}
    </div>
  );
}

const EXPANSION_ITEMS = [
  {
    icon: "✅",
    label: "Solana",
    badge: "LIVE",
    live: true,
    dk: "#00FFA3",
    lk: "#047857",
    bgDk: "rgba(0,255,163,.10)",
    bgLk: "rgba(4,120,87,.10)",
    bdDk: "rgba(0,255,163,.28)",
    bdLk: "rgba(4,120,87,.28)",
  },
  {
    icon: "🔜",
    label: "Robinhood Chain",
    badge: "COMING SOON",
    dk: "#FF6B35",
    lk: "#C2410C",
    bgDk: "rgba(255,107,53,.10)",
    bgLk: "rgba(194,65,12,.10)",
    bdDk: "rgba(255,107,53,.24)",
    bdLk: "rgba(194,65,12,.28)",
  },
  {
    icon: "🔜",
    label: "Base",
    badge: "COMING SOON",
    dk: "#5B8DEF",
    lk: "#1D4ED8",
    bgDk: "rgba(91,141,239,.10)",
    bgLk: "rgba(29,78,216,.10)",
    bdDk: "rgba(91,141,239,.24)",
    bdLk: "rgba(29,78,216,.28)",
  },
  {
    icon: "🔜",
    label: "Arbitrum",
    badge: "COMING SOON",
    dk: "#9DBCF9",
    lk: "#1E3A8A",
    bgDk: "rgba(157,188,249,.10)",
    bgLk: "rgba(30,58,138,.10)",
    bdDk: "rgba(157,188,249,.24)",
    bdLk: "rgba(30,58,138,.28)",
  },
  {
    icon: "🔜",
    label: "BNB Chain",
    badge: "COMING SOON",
    dk: "#FFD86B",
    lk: "#92400E",
    bgDk: "rgba(243,186,47,.12)",
    bgLk: "rgba(180,130,0,.13)",
    bdDk: "rgba(243,186,47,.22)",
    bdLk: "rgba(180,130,0,.28)",
  },
  {
    icon: "🔜",
    label: "Sui",
    badge: "COMING SOON",
    dk: "#6FBCF0",
    lk: "#0E7490",
    bgDk: "rgba(111,188,240,.10)",
    bgLk: "rgba(14,116,144,.10)",
    bdDk: "rgba(111,188,240,.24)",
    bdLk: "rgba(14,116,144,.28)",
  },
];

function SolanaLogoIcon() {
  return (
    <svg className="profileSolanaLiveLogo" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="profileSolGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FFA3" />
          <stop offset="100%" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="#14151a" stroke="#2b3139" strokeWidth="1" />
      <g fill="url(#profileSolGrad)" transform="translate(4.5 6.5)">
        <path d="M0 2.2L15 0 15 2.2 0 4.4z" />
        <path d="M0 6.2L15 4 15 6.2 0 8.4z" />
        <path d="M0 10.2L15 8 15 10.2 0 12.4z" />
      </g>
    </svg>
  );
}

export function ProfilePage({
  adSlot,
  onBack,
  loadingProfile = false,
  profile,
  solAddr = "",
  referralCount = 0,
  onCopyAffiliateLink,
  totalPortfolioUsd = 0,
  portfolioHoldingsUsd = 0,
  portfolioWalletUsd = 0,
  claimableRewardsUsd = 0,
  toUsdFromSol,
  depositAddress = "",
  onCopyWallet,
  onOpenWithdraw,
  runTokens = 0,
  runValueUsd = 0,
  unlockDays = 0,
  unlockHours = 0,
  unlockMinutes = 0,
  unlockSeconds = 0,
  referralRewardsSol = 0,
  creatorRewardsSol = 0,
  onClaimReferral,
  onClaimCreator,
  onShareAffiliate,
  theme = "calm",
  myCreations = [],
  profileHoldings = [],
  profileTxs = [],
  walletHistory = [],
  coins = [],
  onOpenCoin,
  onCreateCoin,
  onGoHome,
  onGoSearch,
  onOpenPortfolio,
  onOpenCreatorDashboard,
  onOpenReferralDashboard,
  onCopyTxHash,
  normalizeCoin,
  getCoinPriceUsd,
  shortWallet,
}) {
  const isLight = theme === "light" || theme === "paper";
  const [depositOpen, setDepositOpen] = useState(false);

  const AIRDROP_RUN = 200000;
  const airdropRun = Math.min(Math.max(0, Number(runTokens) || 0), AIRDROP_RUN);
  const referralRunBonus = Math.max(0, (Number(runTokens) || 0) - AIRDROP_RUN);

  const totalEarnedSol = (referralRewardsSol || 0) + (creatorRewardsSol || 0);
  const totalEarnedUsd = toUsdFromSol?.(totalEarnedSol) || fmtUsd(0);
  const creatorEarnUsd = toUsdFromSol?.(creatorRewardsSol || 0) || fmtUsd(0);
  const affiliateEarnUsd = toUsdFromSol?.(referralRewardsSol || 0) || fmtUsd(0);

  return (
    <ScreenShell className="profilePageRoot">
      <div className="profileTopBar">
        <BackButton onClick={onBack} />

        <div className="profileTopActions">
          <div className="profileAffiliatePill">Affiliates: {referralCount}</div>
          {onOpenPortfolio ? (
            <MiniBtn onClick={onOpenPortfolio} style={{ padding: "9px 12px", borderRadius: 999 }}>
              Portfolio
            </MiniBtn>
          ) : null}
          {onOpenCreatorDashboard ? (
            <MiniBtn onClick={onOpenCreatorDashboard} style={{ padding: "9px 12px", borderRadius: 999 }}>
              Creator Studio
            </MiniBtn>
          ) : null}
          {onOpenReferralDashboard ? (
            <MiniBtn onClick={onOpenReferralDashboard} style={{ padding: "9px 12px", borderRadius: 999 }}>
              Affiliates
            </MiniBtn>
          ) : null}
          <MiniBtn tone="good" onClick={onCopyAffiliateLink} style={{ padding: "9px 12px", borderRadius: 999 }}>
            Copy Affiliate Link
          </MiniBtn>
        </div>
      </div>

      {adSlot}

      {loadingProfile && !profile ? (
        <>
          <Card>
            <ProfileHeaderSkeleton />
          </Card>
          <Card>
            <CoinListSkeleton count={3} />
          </Card>
        </>
      ) : (
        <>
          <Card className="profileDashboardCard">
            <PageHeader title="Profile" />

            <div className="profileDashboardStack">
              <div className="profileWalletCard">
                <div className="profileWalletMain">
                  <div className="profilePortfolioBlock">
                    <div className="statLabel">Portfolio Value</div>
                    <div className="profilePortfolioValue">{fmtUsd(totalPortfolioUsd)}</div>
                    <div className="profilePortfolioSol">
                      Holdings {fmtUsd(portfolioHoldingsUsd)} · Wallet {fmtSol(profile?.runBalance ?? 0)} SOL
                    </div>
                    {safeNum(claimableRewardsUsd, 0) > 0.005 ? (
                      <div className="profilePortfolioSol" style={{ marginTop: 2 }}>
                        Claimable rewards {fmtUsd(claimableRewardsUsd)} (not in wallet yet)
                      </div>
                    ) : null}
                  </div>

                  <div className="profileWalletBalanceBlock">
                    <div className="statLabel">Main Wallet</div>
                    <div className="profileWalletBalance">{fmtSol(profile?.runBalance ?? 0)} SOL</div>
                  </div>

                  <div className="profileWalletAddrField">
                    <span className="profileWalletAddrText">
                      {loadingProfile && !depositAddress
                        ? "Loading..."
                        : depositAddress
                          ? shortWallet?.(depositAddress) || depositAddress
                          : profile
                            ? "Generating wallet..."
                            : shortWallet?.(solAddr) || solAddr || "Wallet unavailable"}
                    </span>
                  </div>

                  <div className="profileWalletBtnRow">
                    <MiniBtn
                      className={`profileWalletBtn profileWalletBtn--deposit ${depositOpen ? "profileWalletBtn--depositActive" : ""}`}
                      tone="success"
                      onClick={() => setDepositOpen((open) => !open)}
                    >
                      ↓ Deposit
                    </MiniBtn>
                    <MiniBtn className="profileWalletBtn profileWalletBtn--ghost" onClick={onOpenWithdraw}>
                      ↑ Withdraw
                    </MiniBtn>
                    <div className="profileSolanaLive" aria-label="Solana network live">
                      <SolanaLogoIcon />
                      <span className="profileSolanaLivePulse" aria-hidden="true" />
                      <span className="profileSolanaLiveText">Solana Live</span>
                    </div>
                  </div>

                  {depositOpen ? (
                    <div className="profileDepositPanel">
                      <div className="profileDepositPanelHint">Send SOL to your deposit address</div>
                      <div className="profileDepositPanelAddr">
                        {depositAddress || "Generating wallet..."}
                      </div>
                      <MiniBtn
                        className="profileDepositCopyBtn"
                        onClick={() => {
                          onCopyWallet?.();
                        }}
                        disabled={!depositAddress}
                      >
                        ⧉ Copy Address
                      </MiniBtn>
                    </div>
                  ) : null}
                </div>

                <div className="profileWalletArt" aria-hidden="true">
                  <div className="profileWalletIllustration">
                    <div className="profileWalletIllustrationCoin profileWalletIllustrationCoin--back" />
                    <div className="profileWalletIllustrationCoin profileWalletIllustrationCoin--front">
                      <span>◎</span>
                    </div>
                    <div className="profileWalletIllustrationBody">
                      <div className="profileWalletIllustrationFlap" />
                      <div className="profileWalletIllustrationSlot" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="profileRunCard">
                <div className="profileRunGrid">
                  <div className="profileRunContent">
                    <div className="profileRunHeader">
                      <div className="statLabel">RUN REWARDS</div>
                      <div className="profileRunBadge">First 25,000 Users Only</div>
                    </div>

                    <div className="profileRunValue">{fmtUsd(runValueUsd)}</div>
                    <div className="profileRunTokens">{runTokens.toLocaleString()} RUN</div>

                    <div className="profileRunBreakdown">
                      <div className="profileRunRow profileRunRow--airdrop">
                        <span className="profileRunRowLabel">Airdrop</span>
                        <span className="profileRunRowValue profileRunRowValue--good">
                          {airdropRun.toLocaleString()} RUN
                        </span>
                      </div>
                      <div className="profileRunRow profileRunRow--referral">
                        <span className="profileRunRowLabel">Referral Bonus</span>
                        <span className="profileRunRowValue profileRunRowValue--good">
                          {referralRunBonus.toLocaleString()} RUN
                        </span>
                      </div>
                      <div className="profileRunRow profileRunRow--total">
                        <span className="profileRunRowLabel">Total Referrals</span>
                        <span className="profileRunRowValue profileRunRowValue--accent">{referralCount} users</span>
                      </div>
                    </div>

                    <div className="profileRunUnlock">Unlocks on 01 Jan 2027</div>
                  </div>

                  <div className="profileRunAside">
                    <div className="profileRunCoin" aria-hidden="true">
                      <span className="profileRunCoinShine" />
                      <span className="profileRunCoinLabel">RUN</span>
                    </div>
                    <div className="profileCountdown">
                      <div className="profileCountdownLabel">Unlock Countdown</div>
                      <div className="profileCountdownValue">
                        <span>{unlockDays}d {unlockHours}h</span>
                        <span>{unlockMinutes}m {unlockSeconds}s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="profileEarningsBlock">
                <div className="profileMetricGrid">
                  <div className="profileMetricCard">
                    <div className="profileMetricCardTop">
                      <div className="profileMetricIcon profileMetricIcon--good">📈</div>
                      <div className="profileMetricBody">
                        <div className="profileMetricLabel">Total Earned</div>
                        <div className="profileMetricValue">{totalEarnedUsd}</div>
                      </div>
                    </div>
                  </div>

                  <div className="profileMetricCard">
                    <div className="profileMetricCardTop">
                      <div className="profileMetricIcon profileMetricIcon--accent">👤</div>
                      <div className="profileMetricBody">
                        <div className="profileMetricLabel">Creator Earnings</div>
                        <div className="profileMetricValue">{creatorEarnUsd}</div>
                        <div className="profileMetricSub profileMetricSub--good">{fmtSol(creatorRewardsSol)} SOL</div>
                      </div>
                    </div>
                  </div>

                  <div className="profileMetricCard">
                    <div className="profileMetricCardTop">
                      <div className="profileMetricIcon profileMetricIcon--good">👥</div>
                      <div className="profileMetricBody">
                        <div className="profileMetricLabel">Affiliate Earnings</div>
                        <div className="profileMetricValue">{affiliateEarnUsd}</div>
                        <div className="profileMetricSub profileMetricSub--good">{fmtSol(referralRewardsSol)} SOL</div>
                      </div>
                    </div>
                  </div>

                  <div className="profileMetricCard">
                    <div className="profileMetricCardTop">
                      <div className="profileMetricIcon profileMetricIcon--accent">🔗</div>
                      <div className="profileMetricBody">
                        <div className="profileMetricLabel">Total Referrals</div>
                        <div className="profileMetricValue">{referralCount}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="profileClaimStack">
                  <MiniBtn className="profileMetricClaim" tone="success" onClick={onClaimCreator}>
                    Claim Creator Rewards
                  </MiniBtn>
                  <MiniBtn className="profileMetricClaim" tone="success" onClick={onClaimReferral}>
                    Claim Affiliate Rewards
                  </MiniBtn>
                </div>
              </div>

            </div>
          </Card>

          <Card className={`profileExpansionCard ${isLight ? "profileExpansionCard--light" : "profileExpansionCard--dark"}`}>
            <div className="profileExpansionGlow profileExpansionGlow--tl" />
            <div className="profileExpansionGlow profileExpansionGlow--br" />
            <div className="profileExpansionBody">
              <div className="profileExpansionIcon">🌐</div>
              <div className={`profileExpansionTitle ${isLight ? "profileExpansionTitle--light" : "profileExpansionTitle--dark"}`}>
                Supported Chains
              </div>
              <div className="profileExpansionList">
                {EXPANSION_ITEMS.map((item) => (
                  <div
                    key={item.label}
                    className={`profileExpansionItem${item.live ? " profileExpansionItem--live" : ""}`}
                    style={{
                      background: isLight ? item.bgLk : item.bgDk,
                      border: `1px solid ${isLight ? item.bdLk : item.bdDk}`,
                    }}
                  >
                    <span style={{ fontWeight: 900, color: isLight ? item.lk : item.dk }}>
                      {item.icon} {item.label}
                    </span>
                    <Badge
                      style={{
                        color: isLight ? item.lk : item.dk,
                        background: isLight ? item.bgLk : item.bgDk,
                        border: `1px solid ${isLight ? item.bdLk : item.bdDk}`,
                      }}
                    >
                      {item.badge}
                    </Badge>
                  </div>
                ))}
              </div>
              <div
                className="profileExpansionFoot"
                style={{
                  background: isLight ? "rgba(4,120,87,.10)" : "rgba(10,155,104,.1)",
                  border: isLight ? "1px solid rgba(4,120,87,.28)" : "1px solid rgba(10,155,104,.22)",
                  color: isLight ? "#047857" : "#0A9B68",
                  boxShadow: "none",
                }}
              >
                Solana live · more chains soon
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeader
              title="My Creations"
              right={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {onOpenCreatorDashboard ? (
                    <MiniBtn onClick={onOpenCreatorDashboard}>Creator Studio</MiniBtn>
                  ) : null}
                  <Pill>{myCreations.length}</Pill>
                </div>
              }
            />
            <div className="scrollY">
              {myCreations.length === 0 ? (
                <EmptyState
                  icon="🚀"
                  title="No created coins"
                  description="Launch your first meme coin and start earning creator fees."
                  actionLabel="Create Coin"
                  onAction={onCreateCoin}
                  compact
                />
              ) : (
                myCreations.map((coin) => (
                  <div key={coin.id} className="profileListGap">
                    <CoinMiniCard c={coin} onOpen={() => onOpenCoin?.(coin)} />
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <SectionHeader
              title="Open Positions"
              right={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {onOpenPortfolio ? (
                    <MiniBtn onClick={onOpenPortfolio}>Full Portfolio</MiniBtn>
                  ) : null}
                  <Pill>{profileHoldings.length}</Pill>
                </div>
              }
            />
            <div className="profileHoldingsSummary">
              <div className="miniMuted">Total Holdings Value</div>
              <div className="profileHoldingsValue">{fmtUsd(portfolioHoldingsUsd)}</div>
            </div>
            <div className="scrollY">
              {profileHoldings.length === 0 ? (
                <EmptyState
                  icon="💰"
                  title="No holdings yet"
                  description="Buy a coin from Home or Search to build your portfolio."
                  actionLabel="Explore Coins"
                  onAction={onGoSearch}
                  compact
                />
              ) : (
                profileHoldings.map((h, idx) => {
                  const coin =
                    (coins || []).find((x) => String(x.id) === String(h.coinId || h.id || h.coin?.id)) ||
                    normalizeCoin?.({
                      id: h.coinId || h.id || h.coin?.id || `holding-${idx}`,
                      name: h.name || h.coin?.name || h.symbol || "Unknown coin",
                      symbol: h.symbol || h.coin?.symbol || "??",
                      logo: h.logo || h.coin?.logo || "",
                    });
                  const amt = Math.max(0, safeNum(h.amount, h.tokens || h.balance || 0));
                  const holdingUsd = amt * (getCoinPriceUsd?.(coin) || 0);

                  return (
                    <ProfileCoinRow
                      key={`${h.coinId || coin?.id || idx}`}
                      coin={coin}
                      secondary={`${fmtNum(amt, 0)} tokens`}
                      rightMain={fmtUsd(holdingUsd)}
                      onClick={coin ? () => onOpenCoin?.(coin) : undefined}
                    />
                  );
                })
              )}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Last Transactions" right={<Pill>{profileTxs.length}</Pill>} />
            <div className="scrollY">
              {profileTxs.length === 0 ? (
                <EmptyState
                  icon="🧾"
                  title="No recent activity"
                  description="Your buys and sells will show up here after your first trade."
                  actionLabel="Go Home"
                  onAction={onGoHome}
                  compact
                />
              ) : (
                profileTxs.map((tx, idx) => {
                  const txCoin =
                    (coins || []).find((x) => String(x.id) === String(tx.coinId || tx.id || tx.coin?.id)) ||
                    normalizeCoin?.({
                      id: tx.coinId || tx.id || `tx-${idx}`,
                      name: tx.coinName || tx.name || tx.symbol || "Unknown coin",
                      symbol: tx.symbol || tx.coin?.symbol || "??",
                      logo: tx.logo || tx.coin?.logo || "",
                    });

                  return (
                    <div key={tx.id || idx} className="profileTxRow">
                      <div className="coinRow" style={{ minWidth: 0, flex: 1 }}>
                        <CoinLogo c={txCoin} size={42} radius={14} />
                        <div className="coinText">
                          <div className="coinName">{String(tx.type || tx.side || "TRADE").toUpperCase()}</div>
                          <div className="coinMeta">{txCoin?.name || shortWallet?.(tx.wallet || solAddr)}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 900, fontSize: 13 }}>{fmtSol(tx.sol || 0)} SOL</div>
                        <div className="miniMuted">{fmtNum(tx.tokens || 0, 0)} tokens</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Wallet History" right={<Pill>{walletHistory.length}</Pill>} />
            <div className="scrollY">
              {walletHistory.length === 0 ? (
                <EmptyState
                  icon="🏦"
                  title="No wallet history"
                  description="Deposits and withdrawals will appear here once activity starts."
                  compact
                />
              ) : (
                walletHistory.slice(0, 50).map((item, idx) => (
                  <div key={idx} className="profileWalletHistoryRow">
                    <div>
                      <div
                        className={`profileWalletHistoryType--${item.type === "DEPOSIT" ? "deposit" : "withdraw"}`}
                        style={{ fontWeight: 1000 }}
                      >
                        {item.type}
                      </div>
                      <div className="miniMuted">{new Date(item.createdAt).toLocaleString()}</div>
                      {item.destination ? (
                        <div className="miniMuted">To {shortWallet?.(item.destination) || item.destination}</div>
                      ) : null}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 1000 }}>{fmtSol(item.amount)} SOL</div>
                      <div className="miniMuted">{item.status || "confirmed"}</div>
                      {item.txHash ? (
                        <>
                          <div className="miniMuted">{String(item.txHash || "").slice(0, 8)}...</div>
                          <MiniBtn className="profileWalletHistoryCopy" onClick={() => onCopyTxHash?.(item.txHash)}>
                            Copy
                          </MiniBtn>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </ScreenShell>
  );
}
