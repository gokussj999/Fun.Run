import crypto from 'node:crypto';
import type { PrismaClient } from '@funrun/database';

type TxClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

// Derives a stable (int, int) pair from a coin ID using SHA-256.
// PostgreSQL pg_advisory_xact_lock(int4, int4) takes two signed 32-bit integers.
function coinIdToLockKeys(coinId: string): [number, number] {
  const digest = crypto.createHash('sha256').update(coinId).digest();
  const key1 = digest.readInt32BE(0);
  const key2 = digest.readInt32BE(4);
  return [key1, key2];
}

export async function acquireAdvisoryLock(tx: TxClient, coinId: string): Promise<void> {
  const [key1, key2] = coinIdToLockKeys(coinId);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${key1}, ${key2})`;
}

// Global lock acquired before inserting into treasury_events.
// treasury_events.cumulative_total is computed as MAX(cumulative_total) + amount,
// which is a non-atomic read-modify-write. Without serialization, two concurrent
// trades on different coins (which have separate per-coin advisory locks) can both
// read the same MAX value and produce duplicate/wrong cumulative totals.
//
// Lock key pair: fixed constants that never collide with SHA-256-derived coin keys
// (collision probability ≈ 1/2^64). Always acquired AFTER the per-coin lock to
// prevent deadlock cycles.
const TREASURY_LOCK_KEY1 = 0x5472_6561 | 0; // 'Trea' as int32 (signed)
const TREASURY_LOCK_KEY2 = 0x7375_7279 | 0; // 'sury' as int32 (signed)

export async function acquireTreasuryLock(tx: TxClient): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${TREASURY_LOCK_KEY1}, ${TREASURY_LOCK_KEY2})`;
}
