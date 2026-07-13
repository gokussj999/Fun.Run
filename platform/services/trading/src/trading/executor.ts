import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';
import type { TradeEventPublisher } from '../events/publisher.js';
import type { TradeLogger } from '../logger/trade.logger.js';
import { withCoinLock } from '../lock/in-process.js';
import { executeBuy } from './buy.js';
import { executeSell } from './sell.js';
import type { BuyRequest, SellRequest, TradeContext, TradeResult } from '../types.js';

/**
 * Legacy off-chain DB AMM executor (oc_* txIds).
 * Default path when TRADING_MODE=offchain. Prefer TRADING_MODE=onchain for Solana settlement.
 * Routed via TradeRouter — do not call directly from HTTP handlers.
 */
export class TradeExecutor {
  constructor(
    private readonly db: PrismaClient,
    private readonly publisher: TradeEventPublisher,
    private readonly tradeLogger: TradeLogger,
    private readonly logger: Logger,
  ) {}

  async buy(req: BuyRequest, ctx: TradeContext): Promise<TradeResult> {
    const nowMs = Date.now();

    return withCoinLock(req.coinId, async () => {
      let result: TradeResult;

      try {
        result = await this.db.$transaction(
          (tx) => executeBuy(tx, { req, ctx, nowMs }),
          { timeout: 10_000 },
        );
      } catch (err) {
        this.tradeLogger.error({
          requestId: ctx.requestId,
          coinId: req.coinId,
          walletAddress: ctx.walletAddress,
          operation: 'buy',
          err,
          latencyMs: Date.now() - nowMs,
        });
        throw err;
      }

      const latencyMs = Date.now() - nowMs;

      await this.publisher.publishTrade(result, ctx.requestId);

      if (result.graduated) {
        await this.publisher.publishGraduation(req.coinId, result.mintAddress, ctx.requestId);
        this.tradeLogger.graduation({
          requestId: ctx.requestId,
          coinId: req.coinId,
          mint: result.mintAddress,
          realSolReserves: result.virtualSolAfter,
        });
      }

      this.tradeLogger.buy({
        requestId: ctx.requestId,
        coinId: req.coinId,
        walletAddress: ctx.walletAddress,
        solIn: req.solAmountLamports,
        tokensOut: result.tokenAmount,
        fees: result.fees,
        graduated: result.graduated,
        latencyMs,
      });

      this.tradeLogger.feeDistributed({
        requestId: ctx.requestId,
        coinId: req.coinId,
        fees: result.fees,
        // referrerWallet is not in TradeResult; infer presence from referrerFee.
        referrerWallet: result.fees.referrerFee > 0n ? 'exists' : null,
      });

      return result;
    });
  }

  async sell(req: SellRequest, ctx: TradeContext): Promise<TradeResult> {
    const nowMs = Date.now();

    // Fast-path rejection before acquiring the in-process lock.
    // Avoids queuing behind other coin operations when the user clearly has no tokens.
    // The authoritative check runs again inside executeSell (within the DB transaction).
    const holding = await this.db.holding.findUnique({
      where: { walletAddress_coinId: { walletAddress: ctx.walletAddress, coinId: req.coinId } },
      select: { tokenBalance: true },
    });
    const balance = BigInt(holding?.tokenBalance.toString() ?? '0');
    if (balance < req.tokenAmountRaw) {
      throw Object.assign(
        new Error(`Insufficient balance: have ${balance}, want ${req.tokenAmountRaw}`),
        { code: 'INSUFFICIENT_BALANCE' },
      );
    }

    return withCoinLock(req.coinId, async () => {
      let result: TradeResult;

      try {
        result = await this.db.$transaction(
          (tx) => executeSell(tx, { req, ctx, nowMs }),
          { timeout: 10_000 },
        );
      } catch (err) {
        this.tradeLogger.error({
          requestId: ctx.requestId,
          coinId: req.coinId,
          walletAddress: ctx.walletAddress,
          operation: 'sell',
          err,
          latencyMs: Date.now() - nowMs,
        });
        throw err;
      }

      const latencyMs = Date.now() - nowMs;

      await this.publisher.publishTrade(result, ctx.requestId);

      this.tradeLogger.sell({
        requestId: ctx.requestId,
        coinId: req.coinId,
        walletAddress: ctx.walletAddress,
        tokensIn: req.tokenAmountRaw,
        solOut: result.solAmount,
        fees: result.fees,
        latencyMs,
      });

      this.tradeLogger.feeDistributed({
        requestId: ctx.requestId,
        coinId: req.coinId,
        fees: result.fees,
        referrerWallet: result.fees.referrerFee > 0n ? 'exists' : null,
      });

      return result;
    });
  }
}
