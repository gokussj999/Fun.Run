import { execSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const PKG_ROOT = join(__dirname, '..', '..');
const MIGRATIONS_DIR = join(PKG_ROOT, 'prisma', 'migrations');

const ORPHAN = '20260710000000_add_pending_tx';
const BASELINE = '20260709000000_baseline';

function listFolders(): string[] {
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

describe('Sprint 1 Task 3 — migration reconciliation', () => {
  it('migration tree has exactly one folder: baseline', () => {
    expect(listFolders()).toEqual([BASELINE]);
  });

  it('orphan add_pending_tx directory is removed', () => {
    expect(existsSync(join(MIGRATIONS_DIR, ORPHAN))).toBe(false);
    expect(existsSync(join(MIGRATIONS_DIR, ORPHAN, 'migration.sql'))).toBe(false);
  });

  it('migration_lock.toml exists at migrations root', () => {
    expect(existsSync(join(MIGRATIONS_DIR, 'migration_lock.toml'))).toBe(true);
  });

  it('verify-migration-tree.mjs reports reconciled', () => {
    const out = execSync('node scripts/verify-migration-tree.mjs', {
      cwd: PKG_ROOT,
      encoding: 'utf8',
    });
    expect(out).toContain('Reconciled: YES');
    expect(out).toContain('Folders (1)');
  });

  it('final migration order is baseline only', () => {
    const order = listFolders();
    expect(order).toHaveLength(1);
    expect(order[0]).toBe(BASELINE);
  });
});
