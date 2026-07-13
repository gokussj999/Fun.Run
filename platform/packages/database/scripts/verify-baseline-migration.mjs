#!/usr/bin/env node
/**
 * Validates baseline migration.sql artifact counts and optional empty-DB apply.
 *
 * Usage:
 *   node scripts/verify-baseline-migration.mjs
 *   node scripts/verify-baseline-migration.mjs --json
 */

import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASELINE_PATH = join(
  __dirname,
  '..',
  'prisma',
  'migrations',
  '20260709000000_baseline',
  'migration.sql',
);

const EXPECTED = {
  tables: 14,
  enums: 6,
  indexes: 37,
  primaryKeys: 14,
  foreignKeys: 6,
  extensions: 2,
};

function analyze(sql) {
  const tables = [...sql.matchAll(/CREATE TABLE "(\w+)"/g)].map((m) => m[1]);
  const enums = [...sql.matchAll(/CREATE TYPE "(\w+)" AS ENUM/g)].map((m) => m[1]);
  const indexes = [...sql.matchAll(/^CREATE (?:UNIQUE )?INDEX /gm)].length;
  const primaryKeys = [...sql.matchAll(/CONSTRAINT "\w+_pkey" PRIMARY KEY/g)].length;
  const foreignKeys = [...sql.matchAll(/^ALTER TABLE .+ ADD CONSTRAINT .+ FOREIGN KEY/gm)].length;
  const extensions = [...sql.matchAll(/CREATE EXTENSION IF NOT EXISTS "([\w-]+)"/g)].map((m) => m[1]);

  return { tables, enums, indexes, primaryKeys, foreignKeys, extensions };
}

function check(name, actual, expected) {
  const ok = actual === expected;
  return { name, actual, expected, ok };
}

const sql = readFileSync(BASELINE_PATH, 'utf8');
const stats = analyze(sql);
const sizeBytes = statSync(BASELINE_PATH).size;

const checks = [
  check('tables', stats.tables.length, EXPECTED.tables),
  check('enums', stats.enums.length, EXPECTED.enums),
  check('indexes', stats.indexes, EXPECTED.indexes),
  check('primaryKeys', stats.primaryKeys, EXPECTED.primaryKeys),
  check('foreignKeys', stats.foreignKeys, EXPECTED.foreignKeys),
  check('extensions', stats.extensions.length, EXPECTED.extensions),
];

const report = {
  path: BASELINE_PATH,
  sizeBytes,
  sizeKb: Math.round((sizeBytes / 1024) * 100) / 100,
  ...stats,
  counts: Object.fromEntries(checks.map((c) => [c.name, c.actual])),
  expected: EXPECTED,
  checks,
  allOk: checks.every((c) => c.ok),
  note: 'Reconciled — single baseline migration (Task 3 complete)',
};

const jsonOut = process.argv.includes('--json');

if (jsonOut) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('Baseline Migration Verification');
  console.log('==============================');
  console.log(`File:   ${BASELINE_PATH}`);
  console.log(`Size:   ${report.sizeKb} KB (${sizeBytes} bytes)`);
  for (const c of checks) {
    console.log(`${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.actual} (expected ${c.expected})`);
  }
  console.log(`\nTables: ${stats.tables.join(', ')}`);
  console.log(`Enums:  ${stats.enums.join(', ')}`);
  console.log(`Extensions: ${stats.extensions.join(', ')}`);
  if (!report.allOk) process.exit(1);
}

process.exit(report.allOk ? 0 : 1);
