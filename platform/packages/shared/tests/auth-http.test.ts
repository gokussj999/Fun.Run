import { describe, it, expect } from 'vitest';

import {
  extractBearerToken,
  extractIp,
  extractSolanaWallet,
} from '@funrun/shared';

describe('shared auth/http helpers (Sprint 3 auth consolidation)', () => {
  it('extractBearerToken parses valid Authorization header', () => {
    expect(extractBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
    expect(extractBearerToken('bearer token123')).toBe('token123');
  });

  it('extractBearerToken rejects malformed headers', () => {
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken('')).toBeNull();
    expect(extractBearerToken('Token abc')).toBeNull();
    expect(extractBearerToken('Bearer')).toBeNull();
    expect(extractBearerToken('Bearer a b')).toBeNull();
  });

  it('extractIp prefers X-Forwarded-For first hop', () => {
    const ip = extractIp({
      ip: '10.0.0.1',
      headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
    });
    expect(ip).toBe('203.0.113.1');
  });

  it('extractIp falls back to request.ip', () => {
    expect(extractIp({ ip: '10.0.0.5', headers: {} })).toBe('10.0.0.5');
  });

  it('extractSolanaWallet prefers embedded Privy wallet', () => {
    const wallet = extractSolanaWallet([
      { type: 'wallet', chainType: 'solana', walletClientType: 'phantom', address: 'Ext111' },
      { type: 'wallet', chainType: 'solana', walletClientType: 'privy', address: 'Emb222' },
    ]);
    expect(wallet).toBe('Emb222');
  });

  it('extractSolanaWallet falls back to external Solana wallet', () => {
    const wallet = extractSolanaWallet([
      { type: 'wallet', chainType: 'ethereum', address: '0xabc' },
      { type: 'wallet', chainType: 'solana', address: 'Sol333' },
    ]);
    expect(wallet).toBe('Sol333');
  });

  it('extractSolanaWallet returns null when no Solana wallet', () => {
    expect(extractSolanaWallet([])).toBeNull();
  });
});
