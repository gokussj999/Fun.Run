import { describe, it, expect, vi } from 'vitest';

import { TradeRouter, isOnChainTradeResult } from '../../src/trading/trade-router.js';
import type { OnChainTradeResult, TradeResult } from '../../src/types.js';

const offchainResult: TradeResult = {
  txId: 'oc_abc',
  coinId: 'c1',
  mintAddress: 'M1',
  walletAddress: 'W1',
  tradeType: 'BUY',
  solAmount: 1n,
  tokenAmount: 2n,
  pricePerToken: 1,
  priceImpactBps: 0,
  fees: { totalFee: 0n, creatorFee: 0n, referrerFee: 0n, treasuryFee: 0n },
  virtualSolAfter: 1n,
  virtualTokensAfter: 1n,
  graduated: false,
  remainingTokenBalance: 0n,
  requestId: 'r1',
};

const onchainResult: OnChainTradeResult = {
  txId: 'cltx1',
  signature: 'sig1',
  coinId: 'c1',
  mintAddress: 'M1',
  walletAddress: 'W1',
  tradeType: 'BUY',
  status: 'SUBMITTED',
  idempotent: false,
  requestId: 'r2',
};

describe('TradeRouter (Tasks 6, 8, 11)', () => {
  const ctx = { requestId: 'req', walletAddress: 'W1', startedAt: Date.now() };
  const buyReq = {
    coinId: 'c1',
    solAmountLamports: 1_000_000n,
    minTokensOut: 0n,
    slippageBps: 100,
  };

  it('offchain mode delegates to TradeExecutor and logs deprecation warning', async () => {
    const offchain = { buy: vi.fn().mockResolvedValue(offchainResult), sell: vi.fn() };
    const onchain = { buy: vi.fn(), sell: vi.fn() };
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() };

    const router = new TradeRouter('offchain', offchain as never, onchain as never, logger as never);
    const result = await router.buy(buyReq, ctx);

    expect(offchain.buy).toHaveBeenCalledWith(buyReq, ctx);
    expect(onchain.buy).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
    expect(result).toEqual(offchainResult);
    expect(isOnChainTradeResult(result)).toBe(false);
  });

  it('onchain mode delegates to OnChainTradeOrchestrator with idempotency key', async () => {
    const offchain = { buy: vi.fn(), sell: vi.fn() };
    const onchain = { buy: vi.fn().mockResolvedValue(onchainResult), sell: vi.fn() };
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() };

    const router = new TradeRouter('onchain', offchain as never, onchain as never, logger as never);
    const result = await router.buy(buyReq, ctx, 'idem-key');

    expect(onchain.buy).toHaveBeenCalledWith(buyReq, ctx, 'idem-key');
    expect(offchain.buy).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(isOnChainTradeResult(result)).toBe(true);
  });
});
