import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, it, expect, beforeAll } from 'vitest';

const PKG_ROOT = join(__dirname, '..', '..');
const SCHEMA_PATH = join(PKG_ROOT, 'prisma', 'schema.prisma');

const REQUIRED_TABLES = [
  'profiles',
  'coins',
  'holdings',
  'transactions',
  'candles',
  'referral_accounts',
  'treasury_events',
  'audit_logs',
  'indexer_state',
  'pending_txs',
  'push_subscriptions',
] as const;

const REQUIRED_ENUMS = [
  'UserRole',
  'CoinStatus',
  'TradeType',
  'Timeframe',
  'AuditAction',
  'TxStatus',
] as const;

describe('Sprint 1 Task 1 — prisma migrate diff integration', () => {
  let baselineSql: string;

  beforeAll(() => {
    baselineSql = execSync(
      `npx prisma migrate diff --from-empty --to-schema-datamodel "${SCHEMA_PATH}" --script`,
      { cwd: PKG_ROOT, encoding: 'utf8', timeout: 120_000 },
    );
  });

  it('generates baseline SQL from empty → schema.prisma', () => {
    expect(baselineSql.length).toBeGreaterThan(1000);
  });

  it('baseline SQL creates all 11 platform tables', () => {
    for (const table of REQUIRED_TABLES) {
      expect(baselineSql).toContain(`CREATE TABLE "${table}"`);
    }
  });

  it('baseline SQL creates all 6 enums', () => {
    for (const en of REQUIRED_ENUMS) {
      expect(baselineSql).toContain(`CREATE TYPE "${en}"`);
    }
  });

  it('baseline SQL includes foreign keys in correct dependency order', () => {
    const profilesIdx = baselineSql.indexOf('CREATE TABLE "profiles"');
    const coinsIdx = baselineSql.indexOf('CREATE TABLE "coins"');
    const fkIdx = baselineSql.indexOf('coins_creator_wallet_fkey');
    expect(profilesIdx).toBeGreaterThanOrEqual(0);
    expect(coinsIdx).toBeGreaterThan(profilesIdx);
    expect(fkIdx).toBeGreaterThan(coinsIdx);
  });

  it('baseline SQL includes pending_txs and TxStatus once (reconciled in baseline)', () => {
    expect(baselineSql).toContain('CREATE TABLE "pending_txs"');
    expect(baselineSql).toContain('CREATE TYPE "TxStatus"');
    expect(baselineSql).toContain('pending_txs_idempotency_key_key');
    expect((baselineSql.match(/CREATE TYPE "TxStatus"/g) ?? []).length).toBe(1);
    expect((baselineSql.match(/CREATE TABLE "pending_txs"/g) ?? []).length).toBe(1);
  });
});
