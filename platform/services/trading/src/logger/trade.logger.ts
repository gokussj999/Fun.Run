import type { Logger } from '@funrun/logger';
import { LATENCY_WARN_MS } from '../constants.js';
import type { FeeBreakdown } from '../types.js';

export class TradeLogger {
  constructor(private readonly logger: Logger) {}

  buy(params: {
    requestId: string;
    coinId: string;
    walletAddress: string;
    solIn: bigint;
    tokensOut: bigint;
    fees: FeeBreakdown;
    graduated: boolean;
    latencyMs: number;
  }): void {
    const { requestId, coinId, walletAddress, solIn, tokensOut, fees, graduated, latencyMs } = params;
    this.logger.info({
      event: 'TRADE_BUY',
      requestId,
      coinId,
      walletAddress,
      solIn: solIn.toString(),
      tokensOut: tokensOut.toString(),
      totalFee: fees.totalFee.toString(),
      graduated,
      latencyMs,
    }, 'Trade buy executed');
    this.warnLatency('TRADE_BUY', requestId, latencyMs);
  }

  sell(params: {
    requestId: string;
    coinId: string;
    walletAddress: string;
    tokensIn: bigint;
    solOut: bigint;
    fees: FeeBreakdown;
    latencyMs: number;
  }): void {
    const { requestId, coinId, walletAddress, tokensIn, solOut, fees, latencyMs } = params;
    this.logger.info({
      event: 'TRADE_SELL',
      requestId,
      coinId,
      walletAddress,
      tokensIn: tokensIn.toString(),
      solOut: solOut.toString(),
      totalFee: fees.totalFee.toString(),
      latencyMs,
    }, 'Trade sell executed');
    this.warnLatency('TRADE_SELL', requestId, latencyMs);
  }

  quote(params: {
    requestId: string;
    coinId: string;
    direction: 'buy' | 'sell';
    amountIn: bigint;
    latencyMs: number;
  }): void {
    const { requestId, coinId, direction, amountIn, latencyMs } = params;
    this.logger.info({
      event: 'TRADE_QUOTE',
      requestId,
      coinId,
      direction,
      amountIn: amountIn.toString(),
      latencyMs,
    }, 'Trade quote computed');
  }

  error(params: {
    requestId: string;
    coinId?: string;
    walletAddress?: string;
    operation: string;
    err: unknown;
    latencyMs: number;
  }): void {
    const { requestId, coinId, walletAddress, operation, err, latencyMs } = params;
    this.logger.error({
      event: 'TRADE_ERROR',
      requestId,
      coinId,
      walletAddress,
      operation,
      err,
      latencyMs,
    }, 'Trade operation failed');
  }

  feeDistributed(params: {
    requestId: string;
    coinId: string;
    fees: FeeBreakdown;
    referrerWallet: string | null;
  }): void {
    const { requestId, coinId, fees, referrerWallet } = params;
    this.logger.debug({
      event: 'FEE_DISTRIBUTED',
      requestId,
      coinId,
      totalFee: fees.totalFee.toString(),
      creatorFee: fees.creatorFee.toString(),
      referrerFee: fees.referrerFee.toString(),
      treasuryFee: fees.treasuryFee.toString(),
      hasReferrer: referrerWallet !== null,
    }, 'Fees distributed');
  }

  graduation(params: {
    requestId: string;
    coinId: string;
    mint: string;
    realSolReserves: bigint;
  }): void {
    const { requestId, coinId, mint, realSolReserves } = params;
    this.logger.warn({
      event: 'GRADUATION_TRIGGERED',
      requestId,
      coinId,
      mint,
      realSolReserves: realSolReserves.toString(),
    }, 'Coin graduation triggered');
  }

  private warnLatency(operation: string, requestId: string, latencyMs: number): void {
    if (latencyMs > LATENCY_WARN_MS) {
      this.logger.warn({
        event: 'LATENCY_WARN',
        requestId,
        operation,
        latencyMs,
        threshold: LATENCY_WARN_MS,
      }, 'Trade operation exceeded latency threshold');
    }
  }
}
