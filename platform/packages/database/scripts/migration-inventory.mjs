#!/usr/bin/env node
/**
 * Pre-migrate inventory for FUN.RUN V2 Prisma migrations.
 *
 * Usage:
 *   node scripts/migration-inventory.mjs
 *   node scripts/migration-inventory.mjs --json
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, '..');
const PRISMA_DIR = join(PKG_ROOT, 'prisma');
const SCHEMA_PATH = join(PRISMA_DIR, 'schema.prisma');
const MIGRATIONS_DIR = join(PRISMA_DIR, 'migrations');
const LOCK_PATH = join(MIGRATIONS_DIR, 'migration_lock.toml');

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
];

const EXPECTED_ENUMS = [
  'UserRole',
  'CoinStatus',
  'TradeType',
  'Timeframe',
  'AuditAction',
  'TxStatus',
];

const SELECTED_STRATEGY = 'diff-from-empty-baseline-squash';
const BASELINE = '20260709000000_baseline';
const ORPHAN = '20260710000000_add_pending_tx';

function readSchema() {
  return readFileSync(SCHEMA_PATH, 'utf8');
}

function countModels(schema) {
  const matches = schema.match(/^model\s+\w+/gm) ?? [];
  return matches.map((m) => m.replace('model ', '').trim());
}

function countEnums(schema) {
  const matches = schema.match(/^enum\s+\w+/gm) ?? [];
  return matches.map((m) => m.replace('enum ', '').trim());
}

function listMigrations() {
  if (!existsSync(MIGRATIONS_DIR)) return [];

  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const sqlPath = join(MIGRATIONS_DIR, e.name, 'migration.sql');
      const hasSql = existsSync(sqlPath);
      const size = hasSql ? statSync(sqlPath).size : 0;
      return { name: e.name, hasSql, sizeBytes: size };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function checkPendingTxSubset(schema) {
  const required = ['model PendingTx', 'enum TxStatus', '@@map("pending_txs")'];
  return required.every((needle) => schema.includes(needle));
}

function buildReport() {
  const schema = readSchema();
  const models = countModels(schema);
  const enums = countEnums(schema);
  const migrations = listMigrations();
  const hasBaseline = migrations.some((m) => m.name === BASELINE);
  const hasOrphan = migrations.some((m) => m.name === ORPHAN);
  const hasLock = existsSync(LOCK_PATH);

  const issues = [];

  if (models.length !== EXPECTED_MODELS.length) {
    issues.push(`Model count ${models.length} !== expected ${EXPECTED_MODELS.length}`);
  }
  for (const name of EXPECTED_MODELS) {
    if (!models.includes(name)) issues.push(`Missing model: ${name}`);
  }
  for (const name of EXPECTED_ENUMS) {
    if (!enums.includes(name)) issues.push(`Missing enum: ${name}`);
  }
  if (!hasLock) issues.push('migration_lock.toml missing');
  if (!hasBaseline) issues.push(`Baseline migration ${BASELINE} missing`);
  if (hasOrphan) issues.push(`Orphan ${ORPHAN} must be removed`);
  if (migrations.length !== 1) {
    issues.push(`Expected 1 migration folder, found ${migrations.length}`);
  }
  if (!checkPendingTxSubset(schema)) {
    issues.push('schema.prisma missing PendingTx / TxStatus definitions');
  }

  const reconciled = issues.length === 0;

  return {
    generatedAt: new Date().toISOString(),
    strategy: SELECTED_STRATEGY,
    schema: {
      path: SCHEMA_PATH,
      modelCount: models.length,
      models,
      enumCount: enums.length,
      enums,
      pendingTxInSchema: checkPendingTxSubset(schema),
    },
    migrations: {
      directory: MIGRATIONS_DIR,
      count: migrations.length,
      entries: migrations,
      order: migrations.map((m) => m.name),
      lockFileExists: hasLock,
      hasBaseline,
      hasOrphan,
    },
    task3Status: reconciled ? 'complete' : 'pending',
    issues,
    reconciled,
  };
}

const jsonOut = process.argv.includes('--json');
const report = buildReport();

if (jsonOut) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('FUN.RUN V2 — Migration Inventory');
  console.log('================================');
  console.log(`Strategy:     ${report.strategy}`);
  console.log(`Task 3:       ${report.task3Status}`);
  console.log(`Models:       ${report.schema.modelCount}`);
  console.log(`Enums:        ${report.schema.enumCount}`);
  console.log(`Migrations:   ${report.migrations.count}`);
  for (const m of report.migrations.entries) {
    console.log(`  - ${m.name} (${m.sizeBytes} bytes)`);
  }
  console.log(`Lock file:    ${report.migrations.lockFileExists ? 'yes' : 'NO'}`);
  console.log(`Reconciled:   ${report.reconciled ? 'YES' : 'NO'}`);
  if (report.issues.length > 0) {
    console.log('\nIssues:');
    for (const issue of report.issues) console.log(`  ! ${issue}`);
  }
}

process.exit(report.reconciled ? 0 : 1);
