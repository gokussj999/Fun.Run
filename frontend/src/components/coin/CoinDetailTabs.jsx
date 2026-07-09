import React, { useState } from "react";
import { CoinOverviewPanel } from "./CoinOverviewPanel.jsx";
import { HoldersList } from "./HoldersList.jsx";
import { TradeHistory } from "./TradeHistory.jsx";

const TABS = [
  { id: "OVERVIEW", label: "Overview" },
  { id: "ACTIVITY", label: "Activity" },
  { id: "HOLDERS", label: "Holders" },
];

export function CoinDetailTabs({
  coin,
  activity = [],
  fallbackWallet = "",
  showFullStory,
  onToggleStory,
  onCopyMint,
  onOpenCreator,
}) {
  const [tab, setTab] = useState("OVERVIEW");

  return (
    <div className="coinDetailTabs">
      <div className="coinDetailTabList" role="tablist" aria-label="Coin details">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`coin-detail-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`coin-detail-panel-${item.id}`}
            className={`coinDetailTab ${tab === item.id ? "active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        className="coinDetailTabPanel"
        role="tabpanel"
        id={`coin-detail-panel-${tab}`}
        aria-labelledby={`coin-detail-tab-${tab}`}
      >
        {tab === "OVERVIEW" ? (
          <CoinOverviewPanel
            coin={coin}
            showFullStory={showFullStory}
            onToggleStory={onToggleStory}
            onCopyMint={onCopyMint}
            onOpenCreator={onOpenCreator}
          />
        ) : null}
        {tab === "ACTIVITY" ? (
          activity.length ? (
            <TradeHistory activity={activity} fallbackWallet={fallbackWallet} />
          ) : (
            <div className="miniMuted">No recent activity yet.</div>
          )
        ) : null}
        {tab === "HOLDERS" ? <HoldersList coin={coin} /> : null}
      </div>
    </div>
  );
}
