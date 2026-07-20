import React from "react";
import { fmtNum } from "../../lib/coin-display.js";

function shortWallet(w) {
  const s = String(w || "");
  if (!s) return "—";
  if (s.length <= 10) return s;
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
}

export function HoldersList({ coin, limit = 50 }) {
  const holders = Object.entries(coin?.holders || {})
    .filter(([, amount]) => Number(amount) > 0.0000001)
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .slice(0, limit);

  if (!holders.length) {
    return <div className="miniMuted">No holder data yet.</div>;
  }

  return (
    <>
      {holders.map(([wallet, amount]) => {
        return (
          <div key={wallet} className="coinHolderRow">
            <div style={{ minWidth: 0 }}>
              <div className="coinRowPrimary">{shortWallet(wallet)}</div>
            </div>

            <div className="coinRowSecondary">
              <div className="coinRowPrimary">{fmtNum(amount, 0)}</div>
              <div className="miniMuted">tokens</div>
            </div>
          </div>
        );
      })}
    </>
  );
}
