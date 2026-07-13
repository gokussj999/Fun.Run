/**
 * Sprint 1 Task 20 — Shared trade response assertions (offchain + onchain).
 */

/**
 * @param {unknown} data
 * @param {string} [label]
 */
export function assertValidTradeResponse(data, label = 'trade') {
  if (!data || typeof data !== 'object') {
    throw new Error(`${label}: response must be an object`);
  }

  const body = /** @type {Record<string, unknown>} */ (data);

  if (typeof body.txId !== 'string' || body.txId.length === 0) {
    throw new Error(`${label}: txId must be a non-empty string`);
  }

  if (body.mode === 'onchain') {
    if (typeof body.signature !== 'string' || body.signature.length < 32) {
      throw new Error(`${label}: onchain response requires signature`);
    }
    if (body.status !== 'SUBMITTED') {
      throw new Error(`${label}: onchain status must be SUBMITTED`);
    }
    if (body.mode !== 'onchain') {
      throw new Error(`${label}: mode must be onchain`);
    }
    return 'onchain';
  }

  // Offchain legacy shape (TRADING_MODE=offchain default)
  if (body.solAmount !== undefined) {
    if (typeof body.solAmount !== 'string') {
      throw new Error(`${label}: offchain solAmount must be stringified bigint`);
    }
    if (body.virtualSolAfter === undefined) {
      throw new Error(`${label}: offchain response missing virtualSolAfter`);
    }
  }

  return 'offchain';
}
