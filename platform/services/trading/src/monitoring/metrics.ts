/**
 * TradingMetrics — all metric instances for the trading service.
 *
 * Covers: trades, graduation, RPC, WebSocket, tx lifecycle, confirmation,
 * retries, simulation, priority fees, blockhash, and reconciliation.
 */
import {
  MetricsRegistry,
  Counter,
  Gauge,
  Histogram,
  DURATION_BUCKETS,
  CONFIRMATION_BUCKETS,
} from './registry.js';

export class TradingMetrics {
  // ── Trade operations ────────────────────────────────────────────────────────
  /** Total trade attempts. Labels: operation=buy|sell */
  readonly tradeAttempts: Counter;
  /** Completed trade operations. Labels: operation=buy|sell, status=success|idempotent|error */
  readonly tradeCompleted: Counter;
  /** End-to-end trade executor latency (ms). Labels: operation=buy|sell */
  readonly tradeDuration: Histogram;

  // ── Simulation ──────────────────────────────────────────────────────────────
  /** Simulation attempts. Labels: operation=buy|sell */
  readonly simulationAttempts: Counter;
  /** Simulation results. Labels: operation=buy|sell, result=pass|fail */
  readonly simulationResults: Counter;

  // ── Graduation ──────────────────────────────────────────────────────────────
  /** Graduation dispatches. Labels: phase=initiate|complete, status=success|error */
  readonly graduationDispatches: Counter;
  /** Coins currently in GRADUATING status (updated by DbCollector). */
  readonly graduationCoinsQueued: Gauge;
  /** GraduationCrank pass executions. */
  readonly graduationCrankRuns: Counter;
  /** Graduation coins marked GRADUATED. */
  readonly graduationCompleted: Counter;

  // ── RPC ─────────────────────────────────────────────────────────────────────
  /** RPC requests. Labels: endpoint=label, result=success|failure */
  readonly rpcRequests: Counter;
  /** RPC request latency (ms). Labels: endpoint=label */
  readonly rpcLatency: Histogram;
  /**
   * Circuit breaker open flag per endpoint.
   * 1 = OPEN (unhealthy), 0 = CLOSED or HALF_OPEN.
   * Labels: endpoint=label
   */
  readonly rpcCircuitOpen: Gauge;
  /** RPC failover events. Labels: from_endpoint=label */
  readonly rpcFailovers: Counter;

  // ── WebSocket ───────────────────────────────────────────────────────────────
  /** Active WS signature subscriptions at any point in time. */
  readonly wsSubscriptionsActive: Gauge;
  /** WS signature callbacks fired. Labels: result=confirmed|error */
  readonly wsCallbacksFired: Counter;

  // ── Tx lifecycle ─────────────────────────────────────────────────────────────
  /** Current pending_tx count per status (updated by DbCollector). Labels: status=BUILDING|... */
  readonly txByStatus: Gauge;
  /** PendingTx records created. Labels: operation_type=BUY|SELL|... */
  readonly txCreated: Counter;

  // ── Confirmation ─────────────────────────────────────────────────────────────
  /** Tx confirmations. Labels: method=ws|poll */
  readonly txConfirmations: Counter;
  /** Time from SUBMITTED → CONFIRMED (ms). */
  readonly txConfirmationTime: Histogram;
  /** Txs advanced from CONFIRMED → FINALIZED. */
  readonly txFinalized: Counter;
  /** Txs marked FAILED. Labels: error_code=... */
  readonly txFailed: Counter;
  /** Txs marked EXPIRED. */
  readonly txExpired: Counter;

  // ── Retry ────────────────────────────────────────────────────────────────────
  /** Tx reset to BUILDING for re-submission. Labels: operation_type=... */
  readonly txRetries: Counter;

  // ── Reconciliation ───────────────────────────────────────────────────────────
  /** TxReconciler pass executions. */
  readonly reconcilerRuns: Counter;
  /** Orphaned pre-submit records found and marked FAILED. */
  readonly reconcilerOrphansFound: Counter;
  /** Stuck SUBMITTED records found and re-checked on-chain. */
  readonly reconcilerStuckFound: Counter;

  // ── Priority fees ─────────────────────────────────────────────────────────
  /** Last estimated priority fee in microlamports. Labels: operation=trade|graduation */
  readonly priorityFeeEstimated: Gauge;

  // ── Blockhash cache ──────────────────────────────────────────────────────────
  /** Current age of cached blockhash in ms (updated periodically). */
  readonly blockhashCacheAgeMs: Gauge;
  /** Blockhash cache refresh events (updated by DbCollector). */
  readonly blockhashRefreshes: Counter;
  /** Blockhash invalidations (BlockhashNotFound). */
  readonly blockhashInvalidations: Counter;

  // ── Process ─────────────────────────────────────────────────────────────────
  /** Service uptime in seconds. */
  readonly processUptimeSeconds: Gauge;

  constructor(registry: MetricsRegistry) {
    // Trade
    this.tradeAttempts  = registry.registerCounter('funrun_trade_attempts_total',  'Total trade execution attempts');
    this.tradeCompleted = registry.registerCounter('funrun_trade_completed_total',  'Completed trade operations by status');
    this.tradeDuration  = registry.registerHistogram('funrun_trade_duration_ms',    'Trade executor end-to-end latency in ms', DURATION_BUCKETS);

    // Simulation
    this.simulationAttempts = registry.registerCounter('funrun_simulation_attempts_total', 'Transaction simulation attempts');
    this.simulationResults  = registry.registerCounter('funrun_simulation_results_total',  'Transaction simulation results by outcome');

    // Graduation
    this.graduationDispatches  = registry.registerCounter('funrun_graduation_dispatches_total', 'Graduation dispatch attempts by phase and status');
    this.graduationCoinsQueued = registry.registerGauge('funrun_graduation_coins_queued',       'Coins currently in GRADUATING status');
    this.graduationCrankRuns   = registry.registerCounter('funrun_graduation_crank_runs_total', 'GraduationCrank pass executions');
    this.graduationCompleted   = registry.registerCounter('funrun_graduation_completed_total',  'Coins successfully graduated');

    // RPC
    this.rpcRequests    = registry.registerCounter('funrun_rpc_requests_total',   'RPC requests by endpoint and result');
    this.rpcLatency     = registry.registerHistogram('funrun_rpc_latency_ms',     'RPC request latency in ms', DURATION_BUCKETS);
    this.rpcCircuitOpen = registry.registerGauge('funrun_rpc_circuit_open',       '1 when RPC circuit is OPEN (degraded), 0 otherwise');
    this.rpcFailovers   = registry.registerCounter('funrun_rpc_failovers_total',  'RPC failover events');

    // WebSocket
    this.wsSubscriptionsActive = registry.registerGauge('funrun_ws_subscriptions_active', 'Active WS signature subscriptions');
    this.wsCallbacksFired      = registry.registerCounter('funrun_ws_callbacks_total',    'WS confirmation callbacks fired');

    // Lifecycle
    this.txByStatus = registry.registerGauge('funrun_tx_by_status',      'Current pending_tx count per lifecycle status');
    this.txCreated  = registry.registerCounter('funrun_tx_created_total', 'PendingTx records created by operation type');

    // Confirmation
    this.txConfirmations    = registry.registerCounter('funrun_tx_confirmations_total',    'On-chain confirmations by method');
    this.txConfirmationTime = registry.registerHistogram('funrun_tx_confirmation_ms',      'Time from SUBMITTED to CONFIRMED in ms', CONFIRMATION_BUCKETS);
    this.txFinalized        = registry.registerCounter('funrun_tx_finalized_total',        'Transactions finalized');
    this.txFailed           = registry.registerCounter('funrun_tx_failed_total',           'Transactions marked FAILED by error code');
    this.txExpired          = registry.registerCounter('funrun_tx_expired_total',          'Transactions expired due to blockhash expiry');

    // Retry
    this.txRetries = registry.registerCounter('funrun_tx_retries_total', 'Tx records reset to BUILDING for re-submission');

    // Reconciliation
    this.reconcilerRuns        = registry.registerCounter('funrun_reconciler_runs_total',         'TxReconciler pass executions');
    this.reconcilerOrphansFound = registry.registerCounter('funrun_reconciler_orphans_total',     'Orphaned pre-submit records marked FAILED');
    this.reconcilerStuckFound  = registry.registerCounter('funrun_reconciler_stuck_submitted_total', 'Stuck SUBMITTED records re-checked on-chain');

    // Priority fees
    this.priorityFeeEstimated = registry.registerGauge('funrun_priority_fee_microlamports', 'Last estimated priority fee in microlamports/CU');

    // Blockhash
    this.blockhashCacheAgeMs   = registry.registerGauge('funrun_blockhash_cache_age_ms',        'Age of the cached blockhash in ms');
    this.blockhashRefreshes    = registry.registerCounter('funrun_blockhash_refreshes_total',    'Blockhash cache refresh events');
    this.blockhashInvalidations = registry.registerCounter('funrun_blockhash_invalidations_total', 'Blockhash cache invalidations');

    // Process
    this.processUptimeSeconds = registry.registerGauge('funrun_process_uptime_seconds', 'Service uptime in seconds');
  }
}
