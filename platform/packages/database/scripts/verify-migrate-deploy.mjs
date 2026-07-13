#!/usr/bin/env node
/**
 * Empty-database migrate deploy verification (Sprint 1 Task 3).
 * Requires running PostgreSQL and DATABASE_URL (+ DATABASE_URL_REPLICA).
 *
 * Usage:
 *   DATABASE_URL=postgresql://funrun:secret@localhost:5432/funrun_test \
 *   DATABASE_URL_REPLICA=postgresql://funrun:secret@localhost:5432/funrun_test \
 *   node scripts/verify-migrate-deploy.mjs
 */

import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, '..');

const url = process.env.DATABASE_URL;
const replica = process.env.DATABASE_URL_REPLICA ?? process.env.DATABASE_URL;

if (!url) {
  console.error('SKIP: DATABASE_URL not set — run against Postgres (see MIGRATIONS.md)');
  process.exit(0);
}

process.env.DATABASE_URL_REPLICA = replica;

console.log('Prisma migrate deploy (empty / idempotent)...');
console.log(`DATABASE_URL: ${url.replace(/:[^:@]+@/, ':***@')}`);

try {
  const out = execSync('npx prisma migrate deploy --schema=./prisma/schema.prisma', {
    cwd: PKG_ROOT,
    encoding: 'utf8',
    env: { ...process.env, DATABASE_URL: url, DATABASE_URL_REPLICA: replica },
    timeout: 120_000,
  });
  console.log(out);

  const status = execSync('npx prisma migrate status --schema=./prisma/schema.prisma', {
    cwd: PKG_ROOT,
    encoding: 'utf8',
    env: { ...process.env, DATABASE_URL: url, DATABASE_URL_REPLICA: replica },
  });
  console.log(status);
  console.log('migrate deploy: OK');
  process.exit(0);
} catch (err) {
  const msg = err.stderr?.toString() || err.stdout?.toString() || err.message;
  console.error(msg);
  process.exit(1);
}
