import React, { useState } from "react";
import { PriceChart } from "./PriceChart.jsx";
import { fmtSol, fmtNum } from "../../lib/coin-display.js";

function MarketDepthPanel({ coin }) {
  const solDepth = Math.max(0, Number(coin?.solReserve || 0) + Number(coin?.vSol || 0));
  const tokenDepth = Math.max(0, Number(coin?.tokenReserve || 0) + Number(coin?.vTokens || 0));
  const total = solDepth + tokenDepth / 1_000_000;
  const solPct = total > 0 ? Math.min(92, Math.max(8, (solDepth / total) * 100)) : 50;

  return (
    <div className="coinDepthPanel">
      <div className="coinDepthRow">
        <span className="coinDepthLabel">SOL Pool</span>
        <span className="coinDepthValue">{fmtSol(solDepth)} SOL</span>
      </div>
      <div className="coinDepthBar">
        <div className="coinDepthBarSol" style={{ width: `${solPct}%` }} />
        <div className="coinDepthBarToken" style={{ width: `${100 - solPct}%` }} />
      </div>
      <div className="coinDepthRow">
        <span className="coinDepthLabel">{coin?.symbol || "TOKEN"} Reserve</span>
        <span className="coinDepthValue">{fmtNum(tokenDepth, 0)}</span>
      </div>
      <p className="coinDepthNote">Virtual reserves from the bonding curve — not a live order book.</p>
    </div>
  );
}

export function CoinChartSection({
  coin,
  height = 500,
  variant = "default",
  chartRange,
  onChartRangeChange,
  chartReloadKey = 0,
}) {
  const [view, setView] = useState("CHART");

  return (
    <div className="coinChartSection">
      <div className="coinChartSectionTabs" role="tablist" aria-label="Chart views">
        <button
          type="button"
          role="tab"
          id="coin-chart-tab-chart"
          aria-selected={view === "CHART"}
          aria-controls="coin-chart-panel"
          className={`coinChartSectionTab ${view === "CHART" ? "active" : ""}`}
          onClick={() => setView("CHART")}
        >
          Price Chart
        </button>
        <button
          type="button"
          role="tab"
          id="coin-chart-tab-depth"
          aria-selected={view === "DEPTH"}
          aria-controls="coin-chart-panel"
          className={`coinChartSectionTab ${view === "DEPTH" ? "active" : ""}`}
          onClick={() => setView("DEPTH")}
        >
          Market Depth
        </button>
      </div>

      <div className="coinChartSectionBody" id="coin-chart-panel" role="tabpanel" aria-labelledby={`coin-chart-tab-${view === "CHART" ? "chart" : "depth"}`}>
        {view === "CHART" ? (
          <PriceChart
            coin={coin}
            height={height}
            variant={variant}
            chartRange={chartRange}
            setChartRange={onChartRangeChange}
            reloadKey={chartReloadKey}
          />
        ) : (
          <MarketDepthPanel coin={coin} />
        )}
      </div>
    </div>
  );
}
