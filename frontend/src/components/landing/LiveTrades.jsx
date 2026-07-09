import React from "react";
import { EmptyState } from "../ui/EmptyState.jsx";
import { Pill } from "../ui/Pill.jsx";

function shortWallet(addr = "") {
  const s = String(addr || "").trim();
  if (s.length <= 10) return s || "—";
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

function tradeType(trade) {
  const raw = String(trade?.type || trade?.side || trade?.action || "trade").toUpperCase();
  if (raw.includes("BUY")) return "BUY";
  if (raw.includes("SELL")) return "SELL";
  return raw;
}

function tradeTime(trade) {
  const ts = Number(trade?.ts || trade?.t || trade?.createdAt || trade?.created_at || 0);
  if (!ts) return "just now";
  const diff = Math.max(0, Date.now() - ts);
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

export function LiveTrades({ trades = [], fmtSol, onEnterApp }) {
  const list = (trades || []).slice(0, 12);

  return (
    <section className="landingSection">
      <div className="landingContainer">
        <h2 className="landingSectionTitle">Live trades</h2>
        <p className="landingSectionSub">
          Stream of recent buys and sells across the platform — powered by the Fun.Run WebSocket feed.
        </p>

        <div className="landingTradesWrap">
          <div className="landingTradesHeader">
            <div className="landingTradesHeaderTitle">
              <span className="landingLiveDot" aria-hidden="true" />
              Live activity
            </div>
            <Pill>{list.length} recent</Pill>
          </div>

          {list.length ? (
            <div className="landingTradesList">
              {list.map((trade, idx) => {
                const type = tradeType(trade);
                const isBuy = type === "BUY";

                return (
                  <div key={trade.id || `${trade.coinId || "coin"}-${idx}`} className="landingTradeRow">
                    <div className="landingTradeMain">
                      <div className="landingTradePrimary">
                        {trade.symbol || trade.coinSymbol || "COIN"} •{" "}
                        <span className={isBuy ? "landingTradeBuy" : "landingTradeSell"}>{type}</span>
                      </div>
                      <div className="landingTradeSecondary">
                        {shortWallet(trade.wallet || trade.user || trade.trader)} • {tradeTime(trade)}
                      </div>
                    </div>
                    <div className="landingTradeAmount">
                      <div className="landingTradePrimary">{fmtSol?.(trade.sol || trade.amountSol || 0)} SOL</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="landingTradesEmpty">
              <EmptyState
                icon="⚡"
                title="Waiting for live trades"
                description="Trades appear here in real time once the market gets moving."
                actionLabel="Open Trading App"
                onAction={() => onEnterApp?.("HOME")}
                compact
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
