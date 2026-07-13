import { z } from 'zod';

/** Supported trading execution modes (Sprint 1 Task 5). */
export const TRADING_MODES = ['offchain', 'onchain'] as const;

export type TradingMode = (typeof TRADING_MODES)[number];

/** Default matches current production behavior: DB AMM / TradeExecutor path. */
export const DEFAULT_TRADING_MODE: TradingMode = 'offchain';

const tradingModeSchema = z.enum(TRADING_MODES);

/**
 * Resolve and validate TRADING_MODE from environment.
 * Unset or empty → `offchain` (backward compatible).
 * Invalid value → throws (caller should fail fast at startup).
 */
export function resolveTradingMode(
  env: NodeJS.ProcessEnv = process.env,
): TradingMode {
  const raw = env['TRADING_MODE'];
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_TRADING_MODE;
  }

  const result = tradingModeSchema.safeParse(raw.trim());
  if (!result.success) {
    throw new Error(
      `Invalid TRADING_MODE="${raw}". Supported values: ${TRADING_MODES.join(', ')}`,
    );
  }

  return result.data;
}
