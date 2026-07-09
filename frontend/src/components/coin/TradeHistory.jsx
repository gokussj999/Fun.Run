import React from "react";
import { fmtNum, fmtSol, timeAgo } from "../../lib/coin-display.js";

function shortWallet(w) {
  const s = String(w || "");
  if (!s) return "—";
  if (s.length <= 10) return s;
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
}

function sideClass(type) {
  const side = String(type || "").toUpperCase();
  if (side === "BUY") return "buy";
  if (side === "SELL") return "sell";
  return "neutral";
}

export function TradeHistory({ activity = [], fallbackWallet = "" }) {
  if (!activity.length) return null;

  return (
    <>
      {activity.map((tx, idx) => {
        const side = String(tx.type || tx.side || "TX").toUpperCase();
        const cls = sideClass(tx.type || tx.side);

        return (
          <div key={tx.id || `tx-${idx}`} className="coinActivityRow">
            <div className="coinActivityMain">
              <span className={`coinActivitySide ${cls}`}>{side === "BUY" ? "↑" : side === "SELL" ? "↓" : "•"}</span>
              <div style={{ minWidth: 0 }}>
                <div className="coinRowPrimary">
                  {shortWallet(tx.wallet || fallbackWallet)} • {side}
                </div>
                <div className="miniMuted">{timeAgo(tx.ts || tx.t)}</div>
              </div>
            </div>

            <div className="coinRowSecondary">
              <div className="coinRowPrimary">{fmtSol(tx.sol || 0)} SOL</div>
              <div className="miniMuted">{fmtNum(tx.tokens || 0, 0)} tokens</div>
            </div>
          </div>
        );
      })}
    </>
  );
}
