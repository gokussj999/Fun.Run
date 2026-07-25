import React, { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fmtUsd } from "../../lib/coin-display.js";
import { downloadPumpShareCard, sharePumpShareCard } from "../../lib/share-pump-card.js";

/**
 * MEXC-style 24h stats dropdown + shareable PNG card actions.
 * Portaled to document.body so parent overflow cannot clip it.
 */
export function CoinPumpStatsPanel({
  coin,
  move24h,
  pumpUsd,
  marketCap,
  price,
  align = "right",
  anchorRef = null,
  className = "",
  onClose,
}) {
  const up = move24h >= 0;
  const [busy, setBusy] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 280 });
  const panelRef = useRef(null);

  const chartPoints = Array.isArray(coin?.chart) ? coin.chart : [];

  useLayoutEffect(() => {
    function place() {
      const el = anchorRef?.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const width = Math.min(300, Math.max(260, window.innerWidth - 24));
      let left = align === "left" ? r.left : r.right - width;
      left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
      let top = r.bottom + 8;
      const approxH = 280;
      if (top + approxH > window.innerHeight - 12) {
        top = Math.max(12, r.top - approxH - 8);
      }
      setPos({ top, left, width });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchorRef, align]);

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

  const panel = (
    <div
      ref={panelRef}
      className={`coinHeaderTickerPanel coinHeaderTickerPanel--portal ${className}`}
      role="dialog"
      aria-label="24 hour market stats"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: pos.width,
        right: "auto",
        zIndex: 10050,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
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
      {typeof onClose === "function" ? (
        <button type="button" className="coinShareCardClose" onClick={onClose} aria-label="Close">
          Close
        </button>
      ) : null}
    </div>
  );

  if (typeof document === "undefined") return panel;
  return createPortal(panel, document.body);
}
