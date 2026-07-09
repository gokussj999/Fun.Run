import React, { useMemo } from "react";
import { Input } from "../ui/Input.jsx";
import { PrimaryButton } from "../ui/Button.jsx";
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
  const modeClass = isBuy ? "buy" : "sell";
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
      : `0 ${symbol}`
    : tradePreview.ok
      ? `${fmtSol(tradePreview.youReceiveSol)} SOL`
      : "0 SOL";

  return (
    <div className="coinTradePanel">
      <div className="coinTradePanelHead">
        <div>
          <div className="coinSectionTitle">Trade</div>
          <div className="coinSectionSub">Instant bonding curve swap</div>
        </div>
      </div>

      <div className="coinTradeTabs" role="tablist" aria-label="Trade mode">
        <button
          type="button"
          role="tab"
          aria-selected={isBuy}
          className={`coinTradeTab ${isBuy ? `active ${modeClass}` : ""}`}
          onClick={() => onTradeModeChange?.("BUY")}
        >
          Buy
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isBuy}
          className={`coinTradeTab ${!isBuy ? `active ${modeClass}` : ""}`}
          onClick={() => onTradeModeChange?.("SELL")}
        >
          Sell
        </button>
      </div>

      <div className="coinSwapFields">
        <div className="coinSwapField">
          <div className="coinSwapFieldLabel">You Pay</div>
          <div className="coinSwapFieldRow">
            <div className="coinTradeInput coinSwapInput">
              <Input
                value={tradeAmount}
                onChange={(e) => onTradeAmountChange?.(e.target.value)}
                placeholder="0.00"
                type="number"
              />
            </div>
            <div className="coinSwapToken">
              {isBuy ? (
                <>
                  <span className="coinSwapTokenIcon sol">◎</span>
                  <span>SOL</span>
                </>
              ) : (
                <>
                  <CoinLogo c={coin} size={22} radius={8} />
                  <span>{symbol}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="coinSwapArrow" aria-hidden="true">
          ↓
        </div>

        <div className="coinSwapField">
          <div className="coinSwapFieldLabel">You Receive</div>
          <div className="coinSwapFieldRow">
            <div className="coinSwapReceive">{receiveValue}</div>
            <div className="coinSwapToken">
              {!isBuy ? (
                <>
                  <span className="coinSwapTokenIcon sol">◎</span>
                  <span>SOL</span>
                </>
              ) : (
                <>
                  <CoinLogo c={coin} size={22} radius={8} />
                  <span>{symbol}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="coinQuickAmounts">
        {QUICK_PCTS.map((pct) => (
          <button
            key={pct}
            type="button"
            className="coinQuickAmountBtn"
            onClick={() => applyQuickPct(pct)}
          >
            {pct}%
          </button>
        ))}
      </div>

      <PrimaryButton
        className={`coinTradeSubmit ${modeClass}`}
        disabled={trading}
        onClick={onTrade}
      >
        {trading
          ? isBuy
            ? "Buying..."
            : "Selling..."
          : `${isBuy ? "Buy" : "Sell"} ${symbol}`}
      </PrimaryButton>

      <div className="coinTradeMeta">
        <div className="coinTradeMetaRow">
          <span>Rate</span>
          <span>
            1 {symbol} ≈ {fmtSol(tradePreview.priceSol || coin?.priceSol || 0)} SOL
          </span>
        </div>
        <div className="coinTradeMetaRow">
          <span>Slippage</span>
          <span>1%</span>
        </div>
        <div className="coinTradeMetaRow">
          <span>Network Fee</span>
          <span>{fmtSol(tradePreview.feeSol || 0)} SOL</span>
        </div>
        <div className="coinTradeMetaRow coinTradeMetaRow--strong">
          <span>You Will Pay</span>
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
