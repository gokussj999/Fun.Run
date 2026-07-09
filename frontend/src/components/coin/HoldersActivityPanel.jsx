import React, { useState } from "react";
import { Pill } from "../ui/Pill.jsx";
import { HoldersList } from "./HoldersList.jsx";
import { TradeHistory } from "./TradeHistory.jsx";

const TABS = [
  { id: "ACTIVITY", label: "Activity" },
  { id: "HOLDERS", label: "Top Holders" },
];

export function HoldersActivityPanel({ coin, activity = [], fallbackWallet = "" }) {
  const [tab, setTab] = useState(activity.length ? "ACTIVITY" : "HOLDERS");
  const holderCount = Object.keys(coin?.holders || {}).length;

  return (
    <div className="coinHoldersPanel">
      <div className="coinSectionHeader coinHoldersPanelHead">
        <div>
          <div className="coinSectionTitle">Holders Activity</div>
          <div className="coinSectionSub">Live trades and wallet flow</div>
        </div>
        <Pill>{tab === "ACTIVITY" ? activity.length || holderCount : holderCount}</Pill>
      </div>

      <div className="coinSectionTabs" role="tablist" aria-label="Holders and activity">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`coin-market-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`coin-market-panel-${item.id}`}
            className={`coinSectionTab ${tab === item.id ? "active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        className="scrollY coinHoldersFeed"
        role="tabpanel"
        id={`coin-market-panel-${tab}`}
        aria-labelledby={`coin-market-tab-${tab}`}
      >
        {tab === "ACTIVITY" ? (
          activity.length ? (
            <TradeHistory activity={activity} fallbackWallet={fallbackWallet} />
          ) : (
            <div className="miniMuted">No trades yet.</div>
          )
        ) : (
          <HoldersList coin={coin} />
        )}
      </div>
    </div>
  );
}
