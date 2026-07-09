import { safeNum } from "./coin-display.js";

export function computeTradePreview(coin, tradeMode, tradeAmount) {
  const amount = Math.max(0, safeNum(tradeAmount, 0));
  const feePct = 0.01;

  if (!coin || amount <= 0) {
    return {
      ok: false,
      estTokens: 0,
      feeSol: 0,
      netSol: 0,
      grossSolNeeded: 0,
      youReceiveSol: 0,
      priceSol: Math.max(0, safeNum(coin?.priceSol, 0)),
    };
  }

  const priceSol = Math.max(0.0000000001, safeNum(coin?.priceSol, 0));
  const solReserve = Math.max(0, safeNum(coin?.solReserve, 0));
  const tokenReserve = Math.max(1, safeNum(coin?.tokenReserve, 1));
  const curveSupply = Math.max(1, safeNum(coin?.curveSupply, tokenReserve));
  const vSol = Math.max(0.000000001, safeNum(coin?.vSol, 30));
  const vTokens = Math.max(1, safeNum(coin?.vTokens, curveSupply * 0.02));

  if (tradeMode === "BUY") {
    const feeSol = amount * feePct;
    const netSol = Math.max(0, amount - feeSol);

    const x = solReserve + vSol;
    const y = tokenReserve + vTokens;
    const k = x * y;

    const newX = x + netSol;
    const newY = k / Math.max(0.000000001, newX);
    const estTokens = Math.max(0, y - newY);

    return {
      ok: estTokens > 0,
      estTokens,
      feeSol,
      netSol,
      grossSolNeeded: amount,
      youReceiveSol: 0,
      priceSol,
    };
  }

  const tokensIn = amount;
  const x = solReserve + vSol;
  const y = tokenReserve + vTokens;
  const k = x * y;

  const newY = y + tokensIn;
  const newX = k / newY;
  const solOut = Math.max(0, x - newX);

  const feeSol = solOut * feePct;
  const netSol = Math.max(0, solOut - feeSol);

  return {
    ok: netSol > 0,
    estTokens: tokensIn,
    feeSol,
    netSol,
    grossSolNeeded: 0,
    youReceiveSol: netSol,
    priceSol,
  };
}
