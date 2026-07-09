import React, { useState } from "react";
import { CoinOverviewPanel } from "./CoinOverviewPanel.jsx";
import { HoldersList } from "./HoldersList.jsx";
import { TradeHistory } from "./TradeHistory.jsx";

const TABS = [
  { id: "OVERVIEW", label: "Overview" },
  { id: "HISTORY", label: "Trade History" },
  { id: "HOLDERS", label: "Holders" },
  { id: "ACTIVITY", label: "Activity" },
  { id: "SECURITY", label: "Security" },
];

function shortWallet(w) {
  const s = String(w || "");
  if (!s) return "—";
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}...${s.slice(-4)}`;
}

function CoinSecurityPanel({ coin, onCopyMint }) {
  const rows = [
    { label: "Mint Address", value: coin?.mintAddress || "Not minted yet" },
    { label: "Creator Wallet", value: shortWallet(coin?.creatorWallet) },
    { label: "Bonding Curve", value: "Active" },
    { label: "Trading Fee", value: "1%" },
  ];

  return (
    <div className="coinSecurityPanel">
      {rows.map((row) => (
        <div key={row.label} className="coinSecurityRow">
          <span className="coinSecurityLabel">{row.label}</span>
          <span className="coinSecurityValue">{row.value}</span>
        </div>
      ))}
      {coin?.mintAddress ? (
        <button type="button" className="coinSecurityCopy" onClick={onCopyMint}>
          Copy mint address
        </button>
      ) : null}
    </div>
  );
}

export function CoinDetailTabs({
  coin,
  activity = [],
  fallbackWallet = "",
  showFullStory,
  onToggleStory,
  onCopyMint,
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
            activity={activity}
            showFullStory={showFullStory}
            onToggleStory={onToggleStory}
          />
        ) : null}
        {tab === "HISTORY" ? <TradeHistory activity={activity} fallbackWallet={fallbackWallet} /> : null}
        {tab === "HOLDERS" ? <HoldersList coin={coin} /> : null}
        {tab === "ACTIVITY" ? (
          activity.length ? (
            <TradeHistory activity={activity} fallbackWallet={fallbackWallet} />
          ) : (
            <div className="miniMuted">No recent activity yet.</div>
          )
        ) : null}
        {tab === "SECURITY" ? <CoinSecurityPanel coin={coin} onCopyMint={onCopyMint} /> : null}
      </div>
    </div>
  );
}
