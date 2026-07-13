import { describe, it, expect } from 'vitest';

import { parseChannel, buildChannel } from '../../src/subscription/channels.js';

describe('parseChannel', () => {
  // ─── No-param channels ────────────────────────────────────────────────────
  it('accepts "market"', () => {
    const result = parseChannel('market');
    expect(result).toMatchObject({ kind: 'market', raw: 'market' });
    expect(result?.param).toBeUndefined();
  });

  it('accepts "graduation"', () => expect(parseChannel('graduation')).not.toBeNull());
  it('accepts "treasury"',   () => expect(parseChannel('treasury')).not.toBeNull());
  it('accepts "admin"',      () => expect(parseChannel('admin')).not.toBeNull());

  // ─── Param channels ───────────────────────────────────────────────────────

  const VALID_PUBKEY = 'So11111111111111111111111111111111111111112'; // 44 chars

  it('accepts "coin:<valid_pubkey>"', () => {
    const result = parseChannel(`coin:${VALID_PUBKEY}`);
    expect(result).toMatchObject({ kind: 'coin', param: VALID_PUBKEY });
  });

  it('accepts "trades:<pubkey>"',    () => expect(parseChannel(`trades:${VALID_PUBKEY}`)).not.toBeNull());
  it('accepts "candles:<pubkey>"',   () => expect(parseChannel(`candles:${VALID_PUBKEY}`)).not.toBeNull());
  it('accepts "holders:<pubkey>"',   () => expect(parseChannel(`holders:${VALID_PUBKEY}`)).not.toBeNull());
  it('accepts "creator:<pubkey>"',   () => expect(parseChannel(`creator:${VALID_PUBKEY}`)).not.toBeNull());
  it('accepts "referral:<pubkey>"',  () => expect(parseChannel(`referral:${VALID_PUBKEY}`)).not.toBeNull());
  it('accepts "portfolio:<pubkey>"', () => expect(parseChannel(`portfolio:${VALID_PUBKEY}`)).not.toBeNull());
  it('accepts "notifications:<pubkey>"', () => expect(parseChannel(`notifications:${VALID_PUBKEY}`)).not.toBeNull());

  // ─── Invalid inputs ───────────────────────────────────────────────────────

  it('rejects empty string',          () => expect(parseChannel('')).toBeNull());
  it('rejects unknown channel name',  () => expect(parseChannel('unknown')).toBeNull());
  it('rejects "coin:" without param', () => expect(parseChannel('coin:')).toBeNull());
  it('rejects coin with short key',   () => expect(parseChannel('coin:abc')).toBeNull());
  it('rejects coin with invalid chars', () => expect(parseChannel('coin:0OIl'.padEnd(44, '0'))).toBeNull());
  it('rejects string > 128 chars',    () => expect(parseChannel('x'.repeat(129))).toBeNull());
  it('rejects market with param',     () => expect(parseChannel(`market:${VALID_PUBKEY}`)).toBeNull());
});

describe('buildChannel', () => {
  it('builds no-param channel', () => expect(buildChannel('market')).toBe('market'));
  it('builds param channel',    () => expect(buildChannel('coin', 'MINT123')).toBe('coin:MINT123'));
});
