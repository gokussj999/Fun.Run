#!/usr/bin/env node
/**
 * Verifies reconciled migration history (Sprint 1 Task 3).
 * - Single baseline migration only
 * - No orphan add_pending_tx folder
 *
 * Usage:
 *   node scripts/verify-migration-tree.mjs
 *   node scripts/verify-migration-tree.mjs --json
 */

import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'prisma', 'migrations');
const LOCK_PATH = join(MIGRATIONS_DIR, 'migration_lock.toml');
const BASELINE = '20260709000000_baseline';
const ORPHAN = '20260710000000_add_pending_tx';

function listMigrationFolders() {
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

const folders = listMigrationFolders();
const issues = [];

if (!existsSync(LOCK_PATH)) issues.push('migration_lock.toml missing');
if (!folders.includes(BASELINE)) issues.push(`Missing ${BASELINE}`);
if (folders.includes(ORPHAN)) issues.push(`Orphan ${ORPHAN} still present`);
if (folders.length !== 1) issues.push(`Expected 1 migration folder, found ${folders.length}: ${folders.join(', ')}`);

const baselineSql = existsSync(join(MIGRATIONS_DIR, BASELINE, 'migration.sql'))
  ? readFileSync(join(MIGRATIONS_DIR, BASELINE, 'migration.sql'), 'utf8')
  : '';

if (baselineSql) {
  const txStatusCount = (baselineSql.match(/CREATE TYPE "TxStatus"/g) ?? []).length;
  const pendingTxCount = (baselineSql.match(/CREATE TABLE "pending_txs"/g) ?? []).length;
  if (txStatusCount !== 1) issues.push(`TxStatus enum defined ${txStatusCount} times in baseline (expected 1)`);
  if (pendingTxCount !== 1) issues.push(`pending_txs table defined ${pendingTxCount} times in baseline (expected 1)`);
}

const report = {
  migrationTree: {
    lockFile: 'migration_lock.toml',
    folders,
    order: folders,
    count: folders.length,
  },
  reconciled: issues.length === 0,
  issues,
};

const jsonOut = process.argv.includes('--json');

if (jsonOut) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('Migration Tree Verification (Task 3)');
  console.log('====================================');
  console.log(`Folders (${report.migrationTree.count}):`);
  for (const f of folders) console.log(`  - ${f}/migration.sql`);
  console.log(`Lock: migration_lock.toml (${existsSync(LOCK_PATH) ? 'ok' : 'MISSING'})`);
  console.log(`Reconciled: ${report.reconciled ? 'YES' : 'NO'}`);
  if (issues.length) {
    console.log('\nIssues:');
    for (const i of issues) console.log(`  ! ${i}`);
  }
}

process.exit(report.reconciled ? 0 : 1);
