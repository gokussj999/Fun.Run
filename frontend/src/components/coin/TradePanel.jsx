import React, { useMemo } from "react";
import { CoinLogo } from "../coins/CoinLogo.jsx";
import { fmtNum, fmtSol } from "../../lib/coin-display.js";
import { computeTradePreview } from "../../lib/trade-preview.js";

const QUICK_PCTS = [25, 50, 75, 100];

export function TradePanel({
  coin,
  tradeMode,
  onTradeModeChange,
  tradeAmount,
  onTradeAmountChange,
  currentWalletTokens = 0,
  walletSolBalance = 0,
  trading = false,
  onTrade,
}) {
  const tradePreview = useMemo(
    () => computeTradePreview(coin, tradeMode, tradeAmount),
    [coin, tradeMode, tradeAmount]
  );

  const isBuy = tradeMode === "BUY";
  const symbol = coin?.symbol || "TOKEN";

  function applyQuickPct(pct) {
    if (isBuy) {
      const bal = Math.max(0, Number(walletSolBalance || 0));
      const amt = (bal * pct) / 100;
      onTradeAmountChange?.(amt > 0 ? String(Number(amt.toFixed(6))) : "");
      return;
    }
    const tokens = Math.max(0, Number(currentWalletTokens || 0));
    const amt = (tokens * pct) / 100;
    onTradeAmountChange?.(amt > 0 ? String(Math.floor(amt)) : "");
  }

  const receiveValue = isBuy
    ? tradePreview.ok
      ? `${fmtNum(tradePreview.estTokens, 0)} ${symbol}`
      : `— ${symbol}`
    : tradePreview.ok
    ? `${fmtSol(tradePreview.youReceiveSol)} SOL`
    : "— SOL";

  const balanceLabel = isBuy
    ? `${fmtSol(walletSolBalance)} SOL`
    : `${fmtNum(currentWalletTokens, 0)} ${symbol}`;

  return (
    <div className="tp">

      {/* Buy / Sell toggle */}
      <div className="tp-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={isBuy}
          className={`tp-tab tp-tab--buy${isBuy ? " active" : ""}`}
          onClick={() => onTradeModeChange?.("BUY")}
        >
          <span className="tp-tab-icon">↑</span>
          Buy
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isBuy}
          className={`tp-tab tp-tab--sell${!isBuy ? " active" : ""}`}
          onClick={() => onTradeModeChange?.("SELL")}
        >
          <span className="tp-tab-icon">↓</span>
          Sell
        </button>
      </div>

      {/* You Pay */}
      <div className={`tp-box tp-box--pay${isBuy ? " tp-box--buy" : " tp-box--sell"}`}>
        <div className="tp-box-header">
          <span className="tp-box-label">You Pay</span>
          <span className="tp-box-balance">Balance: {balanceLabel}</span>
        </div>
        <div className="tp-box-row">
          <input
            className="tp-input"
            value={tradeAmount}
            onChange={(e) => onTradeAmountChange?.(e.target.value)}
            placeholder="0.00"
            type="number"
            min="0"
            inputMode="decimal"
          />
          <div className="tp-token">
            {isBuy ? (
              <>
                <span className="tp-token-icon tp-token-icon--sol">◎</span>
                <span className="tp-token-name">SOL</span>
              </>
            ) : (
              <>
                <CoinLogo c={coin} size={20} radius={6} />
                <span className="tp-token-name">{symbol}</span>
              </>
            )}
          </div>
        </div>

        {/* Quick % pills */}
        <div className="tp-pcts">
          {QUICK_PCTS.map((pct) => (
            <button
              key={pct}
              type="button"
              className={`tp-pct${pct === 100 ? " tp-pct--max" : ""}`}
              onClick={() => applyQuickPct(pct)}
            >
              {pct === 100 ? "MAX" : `${pct}%`}
            </button>
          ))}
        </div>
      </div>

      {/* Swap arrow */}
      <div className="tp-arrow" aria-hidden="true">
        <div className="tp-arrow-line" />
        <div className={`tp-arrow-icon${isBuy ? " tp-arrow-icon--buy" : " tp-arrow-icon--sell"}`}>
          ↓
        </div>
        <div className="tp-arrow-line" />
      </div>

      {/* You Receive */}
      <div className="tp-box tp-box--receive">
        <div className="tp-box-header">
          <span className="tp-box-label">You Receive</span>
        </div>
        <div className="tp-box-row">
          <div className="tp-receive-value">{receiveValue}</div>
          <div className="tp-token">
            {!isBuy ? (
              <>
                <span className="tp-token-icon tp-token-icon--sol">◎</span>
                <span className="tp-token-name">SOL</span>
              </>
            ) : (
              <>
                <CoinLogo c={coin} size={20} radius={6} />
                <span className="tp-token-name">{symbol}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Trade button */}
      <button
        type="button"
        className={`tp-btn tp-btn--${isBuy ? "buy" : "sell"}`}
        disabled={trading}
        onClick={onTrade}
      >
        {trading ? (
          <span className="tp-btn-spinner" />
        ) : null}
        {trading
          ? isBuy ? "Buying…" : "Selling…"
          : `${isBuy ? "Buy" : "Sell"} ${symbol}`}
      </button>

      {/* Trade info */}
      <div className="tp-meta">
        <div className="tp-meta-row">
          <span>Rate</span>
          <span>1 {symbol} ≈ {fmtSol(tradePreview.priceSol || coin?.priceSol || 0)} SOL</span>
        </div>
        <div className="tp-meta-row tp-meta-row--total">
          <span>Total</span>
          <span>
            {isBuy
              ? `${fmtSol(tradeAmount || 0)} SOL`
              : `${fmtNum(tradeAmount || 0, 0)} ${symbol}`}
          </span>
        </div>
      </div>
    </div>
  );
}
