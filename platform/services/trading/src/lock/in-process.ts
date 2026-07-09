// Per-coin serializing lock using a promise chain.
// Ensures that concurrent trade requests for the same coin are queued
// and processed one-at-a-time within a single process.
// The DB advisory lock (db-advisory.ts) handles cross-instance concurrency.

const queue = new Map<string, Promise<void>>();

export async function withCoinLock<T>(coinId: string, fn: () => Promise<T>): Promise<T> {
  const prev = queue.get(coinId) ?? Promise.resolve();

  let release!: () => void;
  const slot = new Promise<void>((r) => {
    release = r;
  });
  queue.set(coinId, slot);

  await prev;

  try {
    return await fn();
  } finally {
    release();
    if (queue.get(coinId) === slot) {
      queue.delete(coinId);
    }
  }
}
