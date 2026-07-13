import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { envSchema } from '../../src/index.js';

describe('Sprint 1 Task 13 — TRADING_SERVICE_URL', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://funrun:secret@localhost:5432/funrun_test',
      JWT_SECRET: 'test-secret-key-min-32-chars-long-123',
      MNEMONIC_ENCRYPTION_KEY: 'test-32-byte-aes-256-gcm-key-xxxxx',
      SOLANA_RPC_PRIMARY: 'https://api.devnet.solana.com',
      PROGRAM_ID: 'HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('defaults TRADING_SERVICE_URL to localhost:3003', () => {
    const parsed = envSchema.safeParse(process.env);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.TRADING_SERVICE_URL).toBe('http://localhost:3003');
    }
  });

  it('accepts custom TRADING_SERVICE_URL', () => {
    process.env.TRADING_SERVICE_URL = 'http://trading:3003';
    const parsed = envSchema.safeParse(process.env);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.TRADING_SERVICE_URL).toBe('http://trading:3003');
    }
  });

  it('rejects invalid TRADING_SERVICE_URL', () => {
    process.env.TRADING_SERVICE_URL = 'not-a-url';
    const parsed = envSchema.safeParse(process.env);
    expect(parsed.success).toBe(false);
  });

  it('TRADING_SERVICE_URL is part of AppConfig shape', () => {
    process.env.TRADING_SERVICE_URL = 'http://127.0.0.1:3003';
    const result = envSchema.parse(process.env);
    expect(result.TRADING_SERVICE_URL).toBe('http://127.0.0.1:3003');
  });
});
