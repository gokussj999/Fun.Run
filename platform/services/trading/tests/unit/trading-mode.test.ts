import { describe, it, expect } from 'vitest';

import {
  DEFAULT_TRADING_MODE,
  TRADING_MODES,
  resolveTradingMode,
} from '../../src/config/trading-mode.js';

describe('TRADING_MODE configuration (Task 5)', () => {
  it('defaults to offchain when TRADING_MODE is unset', () => {
    expect(resolveTradingMode({})).toBe('offchain');
  });

  it('defaults to offchain when TRADING_MODE is empty or whitespace', () => {
    expect(resolveTradingMode({ TRADING_MODE: '' })).toBe('offchain');
    expect(resolveTradingMode({ TRADING_MODE: '   ' })).toBe('offchain');
  });

  it('accepts offchain explicitly', () => {
    expect(resolveTradingMode({ TRADING_MODE: 'offchain' })).toBe('offchain');
  });

  it('accepts onchain explicitly', () => {
    expect(resolveTradingMode({ TRADING_MODE: 'onchain' })).toBe('onchain');
  });

  it('rejects invalid TRADING_MODE values', () => {
    const invalid = ['hybrid', 'ONCHAIN', 'on-chain', 'both', 'true', '1', 'mainnet'];
    for (const value of invalid) {
      expect(() => resolveTradingMode({ TRADING_MODE: value })).toThrow(
        /Invalid TRADING_MODE/,
      );
    }
  });

  it('error message lists supported values', () => {
    expect(() => resolveTradingMode({ TRADING_MODE: 'invalid' })).toThrow(
      /offchain, onchain/,
    );
  });

  it('DEFAULT_TRADING_MODE is offchain (current behavior)', () => {
    expect(DEFAULT_TRADING_MODE).toBe('offchain');
  });

  it('TRADING_MODES contains exactly offchain and onchain', () => {
    expect(TRADING_MODES).toEqual(['offchain', 'onchain']);
  });
});
