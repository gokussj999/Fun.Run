import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const PKG_ROOT = join(__dirname, '..', '..');
const PRISMA_DIR = join(PKG_ROOT, 'prisma');
const SCHEMA_PATH = join(PRISMA_DIR, 'schema.prisma');
const MIGRATIONS_DIR = join(PRISMA_DIR, 'migrations');
const MIGRATIONS_DOC = join(PKG_ROOT, 'MIGRATIONS.md');

const EXPECTED_MODELS = [
  'Profile',
  'Coin',
  'Holding',
  'Transaction',
  'Candle',
  'ReferralAccount',
  'TreasuryEvent',
  'AuditLog',
  'IndexerState',
  'PendingTx',
  'PushSubscription',
  'Deposit',
  'DepositScan',
  'Withdrawal',
] as const;

const EXPECTED_ENUMS = [
  'UserRole',
  'CoinStatus',
  'TradeType',
  'Timeframe',
  'AuditAction',
  'TxStatus',
] as const;

function readSchema(): string {
  return readFileSync(SCHEMA_PATH, 'utf8');
}

function listMigrationFolders(): string[] {
  if (!existsSync(MIGRATIONS_DIR)) return [];
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

describe('Sprint 1 Task 1 — migration strategy preconditions', () => {
  const schema = readSchema();

  it('schema.prisma defines all 14 expected models', () => {
    for (const model of EXPECTED_MODELS) {
      expect(schema).toMatch(new RegExp(`model\\s+${model}\\s*\\{`));
    }
    const modelCount = (schema.match(/^model\s+\w+/gm) ?? []).length;
    expect(modelCount).toBe(EXPECTED_MODELS.length);
  });

  it('schema.prisma defines all 6 expected enums', () => {
    for (const en of EXPECTED_ENUMS) {
      expect(schema).toMatch(new RegExp(`enum\\s+${en}\\s*\\{`));
    }
    const enumCount = (schema.match(/^enum\s+\w+/gm) ?? []).length;
    expect(enumCount).toBe(EXPECTED_ENUMS.length);
  });

  it('PendingTx and TxStatus are in schema (squash into baseline, not separate migration)', () => {
    expect(schema).toContain('model PendingTx');
    expect(schema).toContain('enum TxStatus');
    expect(schema).toContain('@@map("pending_txs")');
  });

  it('only baseline migration folder exists after Task 3', () => {
    const folders = listMigrationFolders();
    expect(folders).toEqual(['20260709000000_baseline']);
  });

  it('baseline migration creates all base tables including pending_txs', () => {
    const sql = readFileSync(
      join(MIGRATIONS_DIR, '20260709000000_baseline', 'migration.sql'),
      'utf8',
    );
    expect(sql).toContain('CREATE TABLE "profiles"');
    expect(sql).toContain('CREATE TABLE "coins"');
    expect(sql).toContain('CREATE TABLE "pending_txs"');
    expect(sql).toContain('CREATE TABLE "deposits"');
    expect(sql).toContain('run_balance_sol');
    expect(sql).toContain('CREATE TYPE "TxStatus"');
  });

  it('orphan add_pending_tx migration removed (Task 3)', () => {
    const orphanPath = join(MIGRATIONS_DIR, '20260710000000_add_pending_tx', 'migration.sql');
    expect(existsSync(orphanPath)).toBe(false);
  });

  it('migration_lock.toml exists', () => {
    const lockPath = join(MIGRATIONS_DIR, 'migration_lock.toml');
    expect(existsSync(lockPath)).toBe(true);
    expect(readFileSync(lockPath, 'utf8')).toContain('postgresql');
  });

  it('MIGRATIONS.md locks diff-from-empty baseline squash strategy', () => {
    const doc = readFileSync(MIGRATIONS_DOC, 'utf8');
    expect(doc).toContain('--from-empty');
    expect(doc).toContain('baseline squash');
    expect(doc).toContain('20260709000000_baseline');
    expect(doc).toContain('Rejected');
    expect(doc).toMatch(/Selected strategy/i);
  });

  it('decision rejects keeping add_pending_tx as migration #2', () => {
    const doc = readFileSync(MIGRATIONS_DOC, 'utf8');
    expect(doc).toContain('Keep `add_pending_tx` as migration #2');
    expect(doc).toContain('Rejected');
  });

  it('decision documents legacy backend as separate schema', () => {
    const doc = readFileSync(MIGRATIONS_DOC, 'utf8');
    expect(doc).toContain('backend/server.js');
    expect(doc).toMatch(/not compatible|Separate schema/i);
  });
});
