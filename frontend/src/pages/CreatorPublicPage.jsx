import React from "react";
import { ScreenShell, BackButton } from "../components/layout";
import { Card } from "../components/ui/Card.jsx";
import { Pill } from "../components/ui/Pill.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { CoinLogo } from "../components/coins";
import { fmtNum, fmtSol, fmtUsd, timeAgo } from "../lib/coin-display.js";

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

function Title({ children, sub }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 1000, letterSpacing: "-0.02em" }}>{children}</div>
      {sub ? <div className="miniMuted" style={{ marginTop: 4 }}>{sub}</div> : null}
    </div>
  );
}

export function CreatorPublicPage({
  adSlot,
  onBack,
  creatorCoin,
  creatorProfileId = "",
  creatorCoins = [],
  creatorRewards = 0,
  creatorHoldings = [],
  onOpenCoin,
}) {
  const showCoinReward =
    creatorCoin &&
    String(creatorCoin?.creatorWallet || "") ===
      String(creatorProfileId || creatorCoin?.creatorWallet || "");

  return (
    <ScreenShell>
      <BackButton onClick={onBack} />

      {adSlot}

      <Card>
        <Title>Creator Profile</Title>

        <div className="statsGrid" style={{ marginTop: 0 }}>
          <div className="stat">
            <div className="statLabel">This Coin Reward</div>
            <div className="statValue">
              {fmtSol(showCoinReward ? creatorCoin?.creatorRewardsSol || 0 : 0)} SOL
            </div>
          </div>

          <div className="stat">
            <div className="statLabel">Lifetime All Coins Reward</div>
            <div className="statValue">{fmtSol(creatorRewards || 0)} SOL</div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Created Coins" right={<Pill>{creatorCoins.length}</Pill>} />
        <div className="scrollY">
          {creatorCoins.length === 0 ? (
            <EmptyState
              icon="🎨"
              title="No created coins"
              description="This creator has not launched any coins yet."
              compact
            />
          ) : (
            creatorCoins.map((coin) => (
              <button
                key={coin.id}
                type="button"
                onClick={() => onOpenCoin?.(coin)}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,.08)",
                  background: "rgba(255,255,255,.03)",
                  color: "var(--text)",
                  textAlign: "left",
                  cursor: "pointer",
                  marginBottom: 10,
                }}
              >
                <div className="coinRow">
                  <CoinLogo c={coin} size={44} radius={15} />
                  <div className="coinText">
                    <div className="coinName">{coin.name}</div>
                    <div className="coinMeta">
                      Reward {fmtSol(coin.creatorRewardsSol || 0)} SOL • {timeAgo(coin.createdAt || coin.created_at)}
                    </div>
                  </div>
                  <div className="rightNum">
                    <div className="rightNumMain">{fmtUsd(coin.mc || 0)}</div>
                    <div className="rightNumSub">MC</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <Card>
        <SectionHeader title="Creator Holdings" right={<Pill>{creatorHoldings.length}</Pill>} />
        <div
          className="creatorScroll"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            maxHeight: 320,
            overflowY: "auto",
            paddingRight: 4,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {creatorHoldings.length === 0 ? (
            <EmptyState
              icon="💼"
              title="No holdings found"
              description="This creator is not holding any platform coins right now."
              compact
            />
          ) : (
            creatorHoldings.map(({ coin, amt, pct }) => (
              <button
                key={coin.id}
                type="button"
                onClick={() => onOpenCoin?.(coin)}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,.08)",
                  background: "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
                  color: "var(--text)",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 1000 }}>{coin.name}</div>
                    <div style={{ color: "var(--muted2)", fontSize: 12 }}>
                      {fmtNum(amt, 0)} tokens
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 1000 }}>{pct.toFixed(4)}%</div>
                    <div style={{ color: "var(--muted2)", fontSize: 12 }}>Supply</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>
    </ScreenShell>
  );
}
