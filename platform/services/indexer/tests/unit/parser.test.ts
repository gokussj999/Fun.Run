import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';

import { parseEvents } from '../../src/parser/index.js';
import { extractEventsFromLogs } from '../../src/parser/discriminator.js';
import type { RawLogEntry } from '../../src/types.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDiscriminator(eventName: string): Buffer {
  return Buffer.from(createHash('sha256').update(`event:${eventName}`).digest()).subarray(0, 8);
}

function encodeLog(eventName: string, payload: Buffer): string {
  const disc = makeDiscriminator(eventName);
  return `Program data: ${Buffer.concat([disc, payload]).toString('base64')}`;
}

function makeCoinCreatedPayload(): Buffer {
  // BorshReader fields: mint(32), creator(32), name(str), symbol(str), uri(str),
  //                     virtualSolReserves(u64), virtualTokenReserves(u64),
  //                     realTokenReserves(u64), creationFee(u64), feeBps(u16)
  const mint    = Buffer.alloc(32, 0xaa);
  const creator = Buffer.alloc(32, 0xbb);
  const name    = encodeString('TestCoin');
  const symbol  = encodeString('TST');
  const uri     = encodeString('https://example.com/meta.json');
  const vSol    = writeU64(30_000_000_000n);
  const vTok    = writeU64(1_000_000_000_000_000n);
  const rTok    = writeU64(1_000_000_000_000_000n);
  const fee     = writeU64(10_000_000n);
  const feeBps  = writeU16(200);
  return Buffer.concat([mint, creator, name, symbol, uri, vSol, vTok, rTok, fee, feeBps]);
}

function encodeString(s: string): Buffer {
  const bytes = Buffer.from(s, 'utf8');
  const len = Buffer.alloc(4);
  len.writeUInt32LE(bytes.length);
  return Buffer.concat([len, bytes]);
}

function writeU64(n: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(n);
  return buf;
}

function writeU16(n: number): Buffer {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(n);
  return buf;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('extractEventsFromLogs', () => {
  it('extracts a known event from program data logs', () => {
    const log = encodeLog('CoinCreated', Buffer.alloc(1));
    const results = extractEventsFromLogs([log]);
    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe('CoinCreated');
  });

  it('ignores logs without "Program data:" prefix', () => {
    const results = extractEventsFromLogs([
      'Program log: Instruction: Buy',
      'Program consumed 50000 of 200000 compute units',
    ]);
    expect(results).toHaveLength(0);
  });

  it('ignores unknown discriminators', () => {
    const unknown = Buffer.concat([Buffer.alloc(8, 0xff), Buffer.alloc(4)]);
    const log = `Program data: ${unknown.toString('base64')}`;
    const results = extractEventsFromLogs([log]);
    expect(results).toHaveLength(0);
  });

  it('handles multiple events in one log array', () => {
    const logs = [
      encodeLog('TokensPurchased', Buffer.alloc(1)),
      'Program log: some message',
      encodeLog('CoinCreated', Buffer.alloc(1)),
    ];
    const results = extractEventsFromLogs(logs);
    expect(results).toHaveLength(2);
    const names = results.map((r) => r.name);
    expect(names).toContain('TokensPurchased');
    expect(names).toContain('CoinCreated');
  });
});

describe('parseEvents (full pipeline)', () => {
  it('returns empty array for failed transactions', () => {
    const entry: RawLogEntry = {
      signature: 'sig1',
      slot:      100n,
      blockTime: 1700000000,
      err:       { InstructionError: [0, 'Custom'] },
      logs:      [encodeLog('CoinCreated', makeCoinCreatedPayload())],
    };
    expect(parseEvents(entry)).toHaveLength(0);
  });

  it('successfully parses a CoinCreated event', () => {
    const payload = makeCoinCreatedPayload();
    const entry: RawLogEntry = {
      signature: 'sig2',
      slot:      200n,
      blockTime: 1700000001,
      err:       null,
      logs:      [encodeLog('CoinCreated', payload)],
    };
    const events = parseEvents(entry);
    expect(events).toHaveLength(1);
    const ev = events[0]!;
    expect(ev.name).toBe('CoinCreated');
    expect(ev.signature).toBe('sig2');
    expect(ev.slot).toBe(200n);
  });

  it('skips informational events (LiquidityLocked)', () => {
    const entry: RawLogEntry = {
      signature: 'sig3',
      slot:      300n,
      blockTime: 1700000002,
      err:       null,
      logs:      [encodeLog('LiquidityLocked', Buffer.alloc(4))],
    };
    expect(parseEvents(entry)).toHaveLength(0);
  });

  it('does not throw if one event fails to decode — skips it', () => {
    // Truncated payload should cause BorshReader to throw
    const truncated = Buffer.alloc(4);
    const entry: RawLogEntry = {
      signature: 'sig4',
      slot:      400n,
      blockTime: 1700000003,
      err:       null,
      logs:      [encodeLog('CoinCreated', truncated)],
    };
    expect(() => parseEvents(entry)).not.toThrow();
    // Truncated → decode error → 0 events returned
    expect(parseEvents(entry)).toHaveLength(0);
  });
});
