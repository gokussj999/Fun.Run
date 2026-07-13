import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, it, expect, beforeAll } from 'vitest';

const PKG_ROOT = join(__dirname, '..', '..');
const BASELINE_DIR = join(PKG_ROOT, 'prisma', 'migrations', '20260709000000_baseline');
const BASELINE_SQL = join(BASELINE_DIR, 'migration.sql');
const LOCK_FILE = join(PKG_ROOT, 'prisma', 'migrations', 'migration_lock.toml');
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
  'deposits',
  'deposit_scans',
  'withdrawals',
] as const;

describe('Sprint 1 Task 2 — baseline migration artifact', () => {
  let baselineSql: string;
  let freshDiff: string;

  beforeAll(() => {
    baselineSql = readFileSync(BASELINE_SQL, 'utf8');
    freshDiff = execSync(
      `npx prisma migrate diff --from-empty --to-schema-datamodel "${SCHEMA_PATH}" --script`,
      { cwd: PKG_ROOT, encoding: 'utf8', timeout: 120_000 },
    );
  });

  it('baseline migration folder and lock file exist', () => {
    expect(existsSync(BASELINE_SQL)).toBe(true);
    expect(existsSync(LOCK_FILE)).toBe(true);
    expect(readFileSync(LOCK_FILE, 'utf8')).toContain('provider = "postgresql"');
  });

  it('baseline includes PostgreSQL extensions', () => {
    expect(baselineSql).toContain('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    expect(baselineSql).toContain('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
  });

  it('baseline contains all prisma diff core statements', () => {
    for (const table of REQUIRED_TABLES) {
      expect(baselineSql).toContain(`CREATE TABLE "${table}"`);
      expect(freshDiff).toContain(`CREATE TABLE "${table}"`);
    }
    expect(baselineSql).toContain('coins_creator_wallet_fkey');
    expect(freshDiff).toContain('coins_creator_wallet_fkey');
  });

  it('baseline has 14 tables, 6 enums, 37 indexes, 6 FKs', () => {
    expect([...baselineSql.matchAll(/CREATE TABLE "/g)]).toHaveLength(14);
    expect([...baselineSql.matchAll(/CREATE TYPE "/g)]).toHaveLength(6);
    expect([...baselineSql.matchAll(/^CREATE (?:UNIQUE )?INDEX /gm)]).toHaveLength(37);
    expect([...baselineSql.matchAll(/^ALTER TABLE .+ FOREIGN KEY/gm)]).toHaveLength(6);
  });

  it('only baseline migration exists after Task 3 reconciliation', () => {
    const out = execSync('node scripts/verify-migration-tree.mjs', {
      cwd: PKG_ROOT,
      encoding: 'utf8',
    });
    expect(out).toContain('Reconciled: YES');
    expect(out).toContain('20260709000000_baseline');
    expect(out).not.toContain('add_pending_tx');
  });

  it('verify-baseline-migration.mjs passes', () => {
    const out = execSync('node scripts/verify-baseline-migration.mjs', {
      cwd: PKG_ROOT,
      encoding: 'utf8',
    });
    expect(out).toContain('OK tables: 14');
    expect(out).toContain('OK foreignKeys: 6');
  });
});
