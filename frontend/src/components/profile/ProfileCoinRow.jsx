import React from "react";
import { CoinLogo } from "../coins/CoinLogo.jsx";

export function ProfileCoinRow({ coin, secondary, rightMain, rightSub, rightSubTone, onClick }) {
  return (
    <button type="button" className="profileCoinRow" onClick={onClick} disabled={!onClick}>
      <div className="coinRow">
        <CoinLogo c={coin} size={42} radius={14} />
        <div className="coinText">
          <div className="coinName">
            <span className="coinNameText">{coin?.name || coin?.symbol || "Unknown coin"}</span>
          </div>
          <div className="coinMeta">{secondary}</div>
        </div>
        <div className="rightNum">
          <div className="rightNumMain">{rightMain}</div>
          {rightSub ? (
            <div className={`rightNumSub${rightSubTone ? ` ${rightSubTone}` : ""}`}>{rightSub}</div>
          ) : null}
        </div>
      </div>
    </button>
  );
}
