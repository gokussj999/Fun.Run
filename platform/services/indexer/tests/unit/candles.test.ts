import { describe, it, expect } from 'vitest';

import { getCandleBucket, computePrice } from '../../src/processor/candles.js';
import type { Timeframe } from '../../src/types.js';

describe('getCandleBucket', () => {
  const cases: Array<{ tf: Timeframe; tsMs: number; expectedMs: number }> = [
    { tf: '1m',  tsMs: 63_500,        expectedMs: 60_000         }, // 63.5s → minute 1
    { tf: '5m',  tsMs: 7 * 60_000,    expectedMs: 5 * 60_000     }, // 7min → 5min bucket
    { tf: '15m', tsMs: 16 * 60_000,   expectedMs: 15 * 60_000    }, // 16min → 15min bucket
    { tf: '1h',  tsMs: 90 * 60_000,   expectedMs: 60 * 60_000    }, // 90min → 1h bucket
    { tf: '4h',  tsMs: 5 * 3_600_000, expectedMs: 4 * 3_600_000  }, // 5h → 4h bucket
    { tf: '1d',  tsMs: 25 * 3_600_000,expectedMs: 24 * 3_600_000 }, // 25h → day 1 bucket
  ];

  for (const { tf, tsMs, expectedMs } of cases) {
    it(`${tf}: ${tsMs}ms → bucket ${expectedMs}ms`, () => {
      expect(getCandleBucket(tsMs, tf)).toBe(BigInt(expectedMs));
    });
  }

  it('returns the same bucket for two timestamps in the same 1m window', () => {
    const a = getCandleBucket(61_000, '1m');
    const b = getCandleBucket(119_999, '1m');
    expect(a).toBe(b);
    expect(a).toBe(60_000n);
  });

  it('returns different buckets for timestamps spanning a boundary', () => {
    expect(getCandleBucket(59_999, '1m')).toBe(0n);
    expect(getCandleBucket(60_000, '1m')).toBe(60_000n);
  });
});

describe('computePrice', () => {
  it('returns 0 when token reserves are 0', () => {
    expect(computePrice(1_000_000_000n, 0n)).toBe('0');
  });

  it('computes price with 15 decimal places of precision', () => {
    // 1 SOL / 1 token = 1.000000000000000
    expect(computePrice(1_000_000_000n, 1_000_000_000n)).toBe('1.000000000000000');
  });

  it('computes correct initial bonding curve price', () => {
    // VIRTUAL_SOL_INITIAL = 30_000_000_000 lamports (30 SOL)
    // VIRTUAL_TOKEN_INITIAL = 1_000_000_000_000_000 (1B tokens with 6 decimals)
    const vSol    = 30_000_000_000n;
    const vTokens = 1_000_000_000_000_000n;
    const price = computePrice(vSol, vTokens);
    // Expected: 30e9 / 1e15 = 0.00003
    expect(price).toBe('0.000030000000000');
  });

  it('price increases as SOL reserve grows (buy pressure simulation)', () => {
    const initialPrice = computePrice(30_000_000_000n, 1_000_000_000_000_000n);
    const afterBuyPrice = computePrice(31_000_000_000n, 990_000_000_000_000n);
    const initial = parseFloat(initialPrice);
    const afterBuy = parseFloat(afterBuyPrice);
    expect(afterBuy).toBeGreaterThan(initial);
  });

  it('handles very large reserves without overflow', () => {
    // Near graduation: 85 SOL in reserves
    const vSol    = 85_000_000_000n;
    const vTokens = 200_000_000_000_000n;
    const price = computePrice(vSol, vTokens);
    expect(parseFloat(price)).toBeGreaterThan(0);
    expect(price).toMatch(/^\d+\.\d{15}$/);
  });
});
