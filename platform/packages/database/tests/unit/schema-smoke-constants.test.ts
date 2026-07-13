import {
  EXPECTED_TABLES,
  EXPECTED_ENUMS,
  EXPECTED_FOREIGN_KEYS,
  EXPECTED_INDEXES,
  EXPECTED_MIGRATION,
  MIN_INDEX_COUNT,
} from '../../scripts/schema-smoke-constants.mjs';
import { describe, it, expect } from 'vitest';

describe('Sprint 1 Task 4 — schema smoke constants', () => {
  it('expects 11 application tables', () => {
    expect(EXPECTED_TABLES).toHaveLength(11);
    expect(EXPECTED_TABLES).toContain('pending_txs');
  });

  it('expects 6 enums including TxStatus', () => {
    expect(EXPECTED_ENUMS).toHaveLength(6);
    expect(EXPECTED_ENUMS).toContain('TxStatus');
  });

  it('expects 6 foreign keys', () => {
    expect(EXPECTED_FOREIGN_KEYS).toHaveLength(6);
  });

  it('expects critical unique indexes', () => {
    expect(EXPECTED_INDEXES.length).toBeGreaterThanOrEqual(9);
    expect(EXPECTED_INDEXES).toContain('pending_txs_idempotency_key_key');
  });

  it('expects baseline as sole migration name', () => {
    expect(EXPECTED_MIGRATION).toBe('20260709000000_baseline');
  });

  it('expects minimum index count from baseline SQL', () => {
    expect(MIN_INDEX_COUNT).toBe(33);
  });
});
