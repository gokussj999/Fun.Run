#!/usr/bin/env node
/**
 * Post-migrate schema smoke test (Sprint 1 Task 4).
 * Verifies tables, enums, indexes, foreign keys, and migration status.
 *
 * Prerequisites: empty DB + `pnpm db:migrate` already applied.
 *
 * Usage:
 *   DATABASE_URL=postgresql://funrun:secret@localhost:5432/funrun_test \
 *   DATABASE_URL_REPLICA=postgresql://funrun:secret@localhost:5432/funrun_test \
 *   node scripts/verify-schema-smoke.mjs
 */

import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '../src/generated/client/index.js';
import {
  EXPECTED_TABLES,
  EXPECTED_ENUMS,
  EXPECTED_FOREIGN_KEYS,
  EXPECTED_INDEXES,
  EXPECTED_MIGRATION,
  MIN_INDEX_COUNT,
} from './schema-smoke-constants.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, '..');

function ensureEnv() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }
  if (!process.env.DATABASE_URL_REPLICA) {
    process.env.DATABASE_URL_REPLICA = url;
  }
}

function checkMigrateStatus() {
  const out = execSync('npx prisma migrate status --schema=./prisma/schema.prisma', {
    cwd: PKG_ROOT,
    encoding: 'utf8',
    env: process.env,
    timeout: 60_000,
  });
  const ok =
    /Database schema is up to date/i.test(out) ||
    /No pending migrations/i.test(out);
  return { ok, output: out.trim() };
}

async function querySchema(prisma) {
    const tables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name != '_prisma_migrations'
    ORDER BY table_name
  `;

  const enums = await prisma.$queryRaw`
    SELECT t.typname AS enum_name
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'e'
    ORDER BY t.typname
  `;

  const indexes = await prisma.$queryRaw`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY indexname
  `;

  const foreignKeys = await prisma.$queryRaw`
    SELECT con.conname AS constraint_name
    FROM pg_constraint con
    JOIN pg_namespace n ON n.oid = con.connamespace
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE n.nspname = 'public'
      AND con.contype = 'f'
    ORDER BY con.conname
  `;

  const migrations = await prisma.$queryRaw`
    SELECT migration_name, finished_at IS NOT NULL AS applied
    FROM "_prisma_migrations"
    ORDER BY finished_at
  `;

  const extensions = await prisma.$queryRaw`
    SELECT extname
    FROM pg_extension
    WHERE extname IN ('uuid-ossp', 'pg_trgm')
    ORDER BY extname
  `;

  return { tables, enums, indexes, foreignKeys, migrations, extensions };
}

function asNames(rows, key) {
  return rows.map((r) => r[key]).sort();
}

async function main() {
  ensureEnv();
  const issues = [];

  let migrateStatus;
  try {
    migrateStatus = checkMigrateStatus();
    if (!migrateStatus.ok) {
      issues.push('prisma migrate status: not up to date');
    }
  } catch (err) {
    issues.push(`prisma migrate status failed: ${err.message}`);
    migrateStatus = { ok: false, output: '' };
  }

  const prisma = new PrismaClient();
  try {
    const schema = await querySchema(prisma);
    const tableNames = asNames(schema.tables, 'table_name');
    const enumNames = asNames(schema.enums, 'enum_name');
    const indexNames = asNames(schema.indexes, 'indexname');
    const fkNames = asNames(schema.foreignKeys, 'constraint_name');
    const migrationNames = schema.migrations.map((m) => m.migration_name);
    const extensionNames = asNames(schema.extensions, 'extname');

    for (const table of EXPECTED_TABLES) {
      if (!tableNames.includes(table)) issues.push(`Missing table: ${table}`);
    }
    if (tableNames.length !== EXPECTED_TABLES.length) {
      issues.push(`Table count ${tableNames.length} !== ${EXPECTED_TABLES.length}`);
    }

    for (const en of EXPECTED_ENUMS) {
      if (!enumNames.includes(en)) issues.push(`Missing enum: ${en}`);
    }
    if (enumNames.length !== EXPECTED_ENUMS.length) {
      issues.push(`Enum count ${enumNames.length} !== ${EXPECTED_ENUMS.length}`);
    }

    if (indexNames.length < MIN_INDEX_COUNT) {
      issues.push(`Index count ${indexNames.length} < ${MIN_INDEX_COUNT}`);
    }
    for (const idx of EXPECTED_INDEXES) {
      if (!indexNames.includes(idx)) issues.push(`Missing index: ${idx}`);
    }

    if (fkNames.length !== EXPECTED_FOREIGN_KEYS.length) {
      issues.push(`FK count ${fkNames.length} !== ${EXPECTED_FOREIGN_KEYS.length}`);
    }
    for (const fk of EXPECTED_FOREIGN_KEYS) {
      if (!fkNames.includes(fk)) issues.push(`Missing foreign key: ${fk}`);
    }

    if (!migrationNames.includes(EXPECTED_MIGRATION)) {
      issues.push(`Missing applied migration: ${EXPECTED_MIGRATION}`);
    }

    for (const ext of ['pg_trgm', 'uuid-ossp']) {
      if (!extensionNames.includes(ext)) issues.push(`Missing extension: ${ext}`);
    }

    const report = {
      migrateStatus: migrateStatus.output,
      tables: { count: tableNames.length, names: tableNames },
      enums: { count: enumNames.length, names: enumNames },
      indexes: { count: indexNames.length, names: indexNames },
      foreignKeys: { count: fkNames.length, names: fkNames },
      migrations: migrationNames,
      extensions: extensionNames,
      issues,
      ok: issues.length === 0,
    };

    const jsonOut = process.argv.includes('--json');
    if (jsonOut) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log('Schema Smoke Test (Task 4)');
      console.log('==========================');
      console.log(`Tables:      ${report.tables.count}/${EXPECTED_TABLES.length}`);
      console.log(`Enums:       ${report.enums.count}/${EXPECTED_ENUMS.length}`);
      console.log(`Indexes:     ${report.indexes.count} (min ${MIN_INDEX_COUNT})`);
      console.log(`Foreign keys:${report.foreignKeys.count}/${EXPECTED_FOREIGN_KEYS.length}`);
      console.log(`Migrations:  ${report.migrations.join(', ')}`);
      console.log(`Extensions:  ${report.extensions.join(', ')}`);
      console.log(`Status:      ${migrateStatus.ok ? 'up to date' : 'FAILED'}`);
      if (issues.length) {
        console.log('\nIssues:');
        for (const i of issues) console.log(`  ! ${i}`);
      } else {
        console.log('\nAll checks passed.');
      }
    }

    process.exit(report.ok ? 0 : 1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});