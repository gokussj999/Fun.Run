import React from "react";
import { MiniBtn } from "../ui/Button.jsx";
import { Pill } from "../ui/Pill.jsx";
import { CoinLogo } from "./CoinLogo.jsx";
import { fmtSol, fmtUsd, getCoin24hMovePct, timeAgo } from "../../lib/coin-display.js";

export function HotCoinsBar({ coins = [], onOpenCoin, title = "Hot right now" }) {
  if (!coins.length) return null;

  return (
    <div className="hotCoinsBar">
      <div className="hotCoinsBarHead">
        <div>
          <div className="hotCoinsBarTitle">{title}</div>
        </div>
        <Pill>{coins.length}</Pill>
      </div>

      <div className="hotCoinsScroll">
        {coins.map((c) => {
          const move = getCoin24hMovePct(c);
          const up = move >= 0;

          return (
            <button key={c.id} type="button" className="hotCoinChip" onClick={() => onOpenCoin?.(c)}>
              <CoinLogo c={c} size={36} radius={12} />
              <div className="hotCoinChipText">
                <div className="hotCoinChipName">{c.symbol || c.name}</div>
                <div className="hotCoinChipMeta">
                  {fmtUsd(c.mc || 0)} • {timeAgo(c.createdAt || c.created_at)}
                </div>
              </div>
              <div className="hotCoinChipMove" style={{ color: up ? "var(--good)" : "var(--danger)" }}>
                {up ? "+" : ""}
                {move.toFixed(1)}%
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TrendingVolumeRow({ coins = [], onOpenCoin, fmtSolFn = fmtSol }) {
  if (!coins.length) return null;

  return (
    <div className="hScroll">
      {coins.map((c) => (
        <div key={c.id} className="tinyCard">
          <div className="row">
            <CoinLogo c={c} size={42} radius={14} />
            <div className="space">
              <div style={{ fontWeight: 1000, fontSize: 13 }}>{c.name}</div>
              <div className="miniMuted">
                {c.symbol} • {timeAgo(c.createdAt || c.created_at)}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12 }} className="pillRow">
            <Pill>MC {fmtUsd(c.mc || 0)}</Pill>
            <Pill>{fmtSolFn(c.volumeSol || 0)} SOL</Pill>
          </div>

          <div style={{ marginTop: 12 }}>
            <MiniBtn onClick={() => onOpenCoin?.(c)} style={{ width: "100%" }}>
              Open
            </MiniBtn>
          </div>
        </div>
      ))}
    </div>
  );
}
