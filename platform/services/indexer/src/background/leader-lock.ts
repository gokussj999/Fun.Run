import type { Redis } from 'ioredis';
import type { Logger } from '@funrun/logger';

export interface WorkerLeaderLockOptions {
  ttlSec?: number;
  instanceId?: string;
}

export class WorkerLeaderLock {
  private readonly ttlSec: number;
  private readonly instanceId: string;
  private readonly renewTimers = new Map<string, ReturnType<typeof setInterval>>();
  private readonly runningWorkers = new Set<string>();

  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger,
    opts: WorkerLeaderLockOptions = {},
  ) {
    this.ttlSec = opts.ttlSec ?? 30;
    this.instanceId =
      opts.instanceId ??
      process.env['HOSTNAME'] ??
      process.env['POD_NAME'] ??
      `indexer-${process.pid}`;
  }

  supervise(workerName: string, start: () => void, stop: () => void): void {
    const key = `indexer:worker_lock:${workerName}`;

    const tick = async (): Promise<void> => {
      try {
        const currentHolder = await this.redis.get(key);

        if (currentHolder === this.instanceId) {
          await this.redis.expire(key, this.ttlSec);
          if (!this.runningWorkers.has(workerName)) {
            this.runningWorkers.add(workerName);
            start();
            this.logger.info({ worker: workerName, instanceId: this.instanceId }, 'WorkerLeaderLock: leader — worker started');
          }
          return;
        }

        if (currentHolder !== null) {
          if (this.runningWorkers.has(workerName)) {
            this.runningWorkers.delete(workerName);
            stop();
            this.logger.info({ worker: workerName, leader: currentHolder }, 'WorkerLeaderLock: follower — worker stopped');
          }
          return;
        }

        const acquired = await this.redis.set(key, this.instanceId, 'EX', this.ttlSec, 'NX');
        if (acquired === 'OK' && !this.runningWorkers.has(workerName)) {
          this.runningWorkers.add(workerName);
          start();
          this.logger.info({ worker: workerName, instanceId: this.instanceId }, 'WorkerLeaderLock: acquired lock — worker started');
        }
      } catch (err) {
        this.logger.warn({ err, worker: workerName }, 'WorkerLeaderLock: election tick failed');
      }
    };

    void tick();
    const intervalMs = Math.max(5_000, Math.floor((this.ttlSec / 2) * 1_000));
    const timer = setInterval(() => { void tick(); }, intervalMs);
    this.renewTimers.set(workerName, timer);
  }

  async shutdown(workerStops: Map<string, () => void>): Promise<void> {
    for (const [name, timer] of this.renewTimers) {
      clearInterval(timer);
      if (this.runningWorkers.has(name)) {
        workerStops.get(name)?.();
        this.runningWorkers.delete(name);
      }
      try {
        const key = `indexer:worker_lock:${name}`;
        const holder = await this.redis.get(key);
        if (holder === this.instanceId) {
          await this.redis.del(key);
        }
      } catch { /* best-effort */ }
    }
    this.renewTimers.clear();
  }
}
