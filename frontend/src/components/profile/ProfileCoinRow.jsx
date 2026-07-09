import React from "react";
import { CoinLogo } from "../coins/CoinLogo.jsx";

export function ProfileCoinRow({ coin, secondary, rightMain, rightSub, onClick }) {
  return (
    <button type="button" className="profileCoinRow" onClick={onClick} disabled={!onClick}>
      <div className="coinRow">
        <CoinLogo c={coin} size={46} radius={16} />
        <div className="coinText">
          <div className="coinName">{coin?.name || coin?.symbol || "Unknown coin"}</div>
          <div className="coinMeta">{secondary}</div>
        </div>
        <div className="rightNum">
          <div className="rightNumMain">{rightMain}</div>
          {rightSub ? <div className="rightNumSub">{rightSub}</div> : null}
        </div>
      </div>
    </button>
  );
}
