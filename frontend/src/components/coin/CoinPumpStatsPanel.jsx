import React, { useState } from "react";
import { fmtUsd } from "../../lib/coin-display.js";
import { downloadPumpShareCard, sharePumpShareCard } from "../../lib/share-pump-card.js";

/**
 * MEXC-style 24h stats dropdown + shareable PNG card actions.
 */
export function CoinPumpStatsPanel({
  coin,
  move24h,
  pumpUsd,
  marketCap,
  price,
  align = "right",
  className = "",
}) {
  const up = move24h >= 0;
  const [busy, setBusy] = useState(false);

  const chartPoints = Array.isArray(coin?.chart) ? coin.chart : [];

  async function onShare() {
    if (busy) return;
    setBusy(true);
    try {
      await sharePumpShareCard({
        coin,
        move24h,
        marketCap,
        price,
        chartPoints,
        shareUrl: typeof window !== "undefined" ? window.location.href : "",
      });
    } catch (e) {
      console.log("share card failed:", e?.message || e);
      try {
        await downloadPumpShareCard({
          coin,
          move24h,
          marketCap,
          price,
          chartPoints,
          shareUrl: typeof window !== "undefined" ? window.location.href : "",
        });
      } catch {}
    } finally {
      setBusy(false);
    }
  }

  async function onDownload() {
    if (busy) return;
    setBusy(true);
    try {
      await downloadPumpShareCard({
        coin,
        move24h,
        marketCap,
        price,
        chartPoints,
        shareUrl: typeof window !== "undefined" ? window.location.href : "",
      });
    } catch (e) {
      console.log("download card failed:", e?.message || e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`coinHeaderTickerPanel ${align === "left" ? "chartTickerPanel" : ""} ${className}`}
      role="dialog"
      aria-label="24 hour market stats"
    >
      <div className="coinHeaderTickerPanelTitle">Last 24h</div>
      <div className="coinHeaderTickerPanelGrid">
        <div className="coinHeaderTickerPanelRow">
          <span className="coinHeaderTickerPanelLabel">24h Change</span>
          <span className={`coinHeaderTickerPanelValue ${up ? "up" : "down"}`}>
            {up ? "+" : ""}
            {move24h.toFixed(2)}%
          </span>
        </div>
        <div className="coinHeaderTickerPanelRow">
          <span className="coinHeaderTickerPanelLabel">24h Pump</span>
          <span className={`coinHeaderTickerPanelValue ${pumpUsd >= 0 ? "up" : "down"}`}>
            {pumpUsd >= 0 ? "+" : "-"}
            {fmtUsd(Math.abs(pumpUsd))}
          </span>
        </div>
        <div className="coinHeaderTickerPanelRow">
          <span className="coinHeaderTickerPanelLabel">Market Cap</span>
          <span className="coinHeaderTickerPanelValue">{fmtUsd(marketCap)}</span>
        </div>
        <div className="coinHeaderTickerPanelRow">
          <span className="coinHeaderTickerPanelLabel">Last Price</span>
          <span className="coinHeaderTickerPanelValue">{fmtUsd(price)}</span>
        </div>
      </div>

      <div className="coinShareCardActions">
        <button type="button" className="coinShareCardBtn coinShareCardBtn--primary" disabled={busy} onClick={onShare}>
          {busy ? "…" : "Share card"}
        </button>
        <button type="button" className="coinShareCardBtn" disabled={busy} onClick={onDownload}>
          Save PNG
        </button>
      </div>
      <div className="coinShareCardHint">MEXC jaisa PNG — X / FB pe seedha post</div>
    </div>
  );
}
