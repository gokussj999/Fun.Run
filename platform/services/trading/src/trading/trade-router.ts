import type { Logger } from '@funrun/logger';

import type { TradingMode } from '../config/trading-mode.js';
import type { BuyRequest, SellRequest, TradeContext, TradeResult } from '../types.js';
import type { OnChainTradeResult } from '../types.js';
import type { OnChainTradeOrchestrator } from './onchain-orchestrator.js';
import type { TradeExecutor } from './executor.js';

export type TradeBuyResult = TradeResult | OnChainTradeResult;
export type TradeSellResult = TradeResult | OnChainTradeResult;

export function isOnChainTradeResult(
  result: TradeBuyResult | TradeSellResult,
): result is OnChainTradeResult {
  return 'signature' in result && 'status' in result;
}

export class TradeRouter {
  constructor(
    private readonly mode: TradingMode,
    private readonly offchain: TradeExecutor,
    private readonly onchain: OnChainTradeOrchestrator,
    private readonly logger: Logger,
  ) {}

  async buy(
    req: BuyRequest,
    ctx: TradeContext,
    idempotencyKey?: string,
  ): Promise<TradeBuyResult> {
    if (this.mode === 'onchain') {
      return this.onchain.buy(req, ctx, idempotencyKey);
    }

    this.logger.warn(
      { requestId: ctx.requestId, coinId: req.coinId, mode: this.mode },
      'Off-chain trade path (legacy DB AMM) — set TRADING_MODE=onchain for Solana settlement',
    );
    return this.offchain.buy(req, ctx);
  }

  async sell(
    req: SellRequest,
    ctx: TradeContext,
    idempotencyKey?: string,
  ): Promise<TradeSellResult> {
    if (this.mode === 'onchain') {
      return this.onchain.sell(req, ctx, idempotencyKey);
    }

    this.logger.warn(
      { requestId: ctx.requestId, coinId: req.coinId, mode: this.mode },
      'Off-chain trade path (legacy DB AMM) — set TRADING_MODE=onchain for Solana settlement',
    );
    return this.offchain.sell(req, ctx);
  }
}
