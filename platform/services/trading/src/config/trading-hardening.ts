/**
 * Trading engine hardening flags (Sprint 3).
 */

/** When true, POST /trade/buy and /trade/sell require Idempotency-Key header (H-02). */
export function resolveRequireTradeIdempotencyKey(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env['REQUIRE_TRADE_IDEMPOTENCY_KEY'] === 'true';
}

/** When false, background workers start on every pod without leader election (H-22). */
export function resolveWorkerLeaderElection(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env['WORKER_LEADER_ELECTION'] !== 'false';
}
