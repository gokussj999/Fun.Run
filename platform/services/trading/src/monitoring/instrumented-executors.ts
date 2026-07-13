/**
 * Instrumented executor wrappers — add metric collection to Buy, Sell, and
 * Graduation executors without modifying any business logic.
 *
 * Each wrapper delegates to the real executor and records:
 *   - attempt count (Counter)
 *   - completion by status (Counter)
 *   - end-to-end latency (Histogram)
 */
import type { BuyExecutionOpts, BuyExecutionResult } from '../executors/buy-executor.js';
import type { SellExecutionOpts, SellExecutionResult } from '../executors/sell-executor.js';
import type { TradingMetrics } from './metrics.js';

// ── Inner executor interfaces (duck-typing — no coupling to concrete classes) ─

interface RawBuyExecutor {
  execute(opts: BuyExecutionOpts): Promise<BuyExecutionResult>;
}

interface RawSellExecutor {
  execute(opts: SellExecutionOpts): Promise<SellExecutionResult>;
}

interface RawGraduationDispatcher {
  dispatchInitiate(coinId: string, mintAddress: string): Promise<void>;
  dispatchComplete(coinId: string, mintAddress: string): Promise<void>;
}

// ── InstrumentedBuyExecutor ───────────────────────────────────────────────────

export class InstrumentedBuyExecutor implements RawBuyExecutor {
  constructor(
    private readonly inner:   RawBuyExecutor,
    private readonly metrics: TradingMetrics,
  ) {}

  async execute(opts: BuyExecutionOpts): Promise<BuyExecutionResult> {
    const start = Date.now();
    this.metrics.tradeAttempts.inc({ operation: 'buy' });
    try {
      const result = await this.inner.execute(opts);
      const durationMs = Date.now() - start;
      this.metrics.tradeCompleted.inc({
        operation: 'buy',
        status:    result.idempotent ? 'idempotent' : 'success',
      });
      this.metrics.tradeDuration.observe({ operation: 'buy' }, durationMs);
      this.metrics.txCreated.inc({ operation_type: 'BUY' });
      return result;
    } catch (err) {
      const durationMs = Date.now() - start;
      this.metrics.tradeCompleted.inc({ operation: 'buy', status: 'error' });
      this.metrics.tradeDuration.observe({ operation: 'buy' }, durationMs);
      throw err;
    }
  }
}

// ── InstrumentedSellExecutor ──────────────────────────────────────────────────

export class InstrumentedSellExecutor implements RawSellExecutor {
  constructor(
    private readonly inner:   RawSellExecutor,
    private readonly metrics: TradingMetrics,
  ) {}

  async execute(opts: SellExecutionOpts): Promise<SellExecutionResult> {
    const start = Date.now();
    this.metrics.tradeAttempts.inc({ operation: 'sell' });
    try {
      const result = await this.inner.execute(opts);
      const durationMs = Date.now() - start;
      this.metrics.tradeCompleted.inc({
        operation: 'sell',
        status:    result.idempotent ? 'idempotent' : 'success',
      });
      this.metrics.tradeDuration.observe({ operation: 'sell' }, durationMs);
      this.metrics.txCreated.inc({ operation_type: 'SELL' });
      return result;
    } catch (err) {
      const durationMs = Date.now() - start;
      this.metrics.tradeCompleted.inc({ operation: 'sell', status: 'error' });
      this.metrics.tradeDuration.observe({ operation: 'sell' }, durationMs);
      throw err;
    }
  }
}

// ── InstrumentedGraduationDispatcher ─────────────────────────────────────────

export class InstrumentedGraduationDispatcher implements RawGraduationDispatcher {
  constructor(
    private readonly inner:   RawGraduationDispatcher,
    private readonly metrics: TradingMetrics,
  ) {}

  async dispatchInitiate(coinId: string, mintAddress: string): Promise<void> {
    this.metrics.graduationDispatches.inc({ phase: 'initiate', status: 'attempt' });
    try {
      await this.inner.dispatchInitiate(coinId, mintAddress);
      this.metrics.graduationDispatches.inc({ phase: 'initiate', status: 'success' });
      this.metrics.txCreated.inc({ operation_type: 'INITIATE_GRADUATION' });
    } catch (err) {
      this.metrics.graduationDispatches.inc({ phase: 'initiate', status: 'error' });
      throw err;
    }
  }

  async dispatchComplete(coinId: string, mintAddress: string): Promise<void> {
    this.metrics.graduationDispatches.inc({ phase: 'complete', status: 'attempt' });
    try {
      await this.inner.dispatchComplete(coinId, mintAddress);
      this.metrics.graduationDispatches.inc({ phase: 'complete', status: 'success' });
      this.metrics.txCreated.inc({ operation_type: 'COMPLETE_GRADUATION' });
    } catch (err) {
      this.metrics.graduationDispatches.inc({ phase: 'complete', status: 'error' });
      throw err;
    }
  }
}
