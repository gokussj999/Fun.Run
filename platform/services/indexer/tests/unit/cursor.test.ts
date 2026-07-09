import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CursorManager } from '../../src/cursor/manager.js';
import type { CursorStore } from '../../src/cursor/store.js';

function makeMockStore(initial: { slot: bigint; sig: string } | null): CursorStore {
  return {
    read: vi.fn().mockResolvedValue(
      initial
        ? { lastProcessedSlot: initial.slot, lastProcessedSignature: initial.sig, lastProcessedAt: new Date() }
        : null,
    ),
    write: vi.fn().mockResolvedValue(undefined),
  } as unknown as CursorStore;
}

const makeLogger = () => ({
  info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
});

describe('CursorManager', () => {
  describe('initialize', () => {
    it('restores cursor from store', async () => {
      const store   = makeMockStore({ slot: 100n, sig: 'abc123' });
      const manager = new CursorManager(store, makeLogger() as never);
      await manager.initialize();
      expect(manager.getLastSlot()).toBe(100n);
      await manager.shutdown();
    });

    it('starts at 0 when no stored cursor exists', async () => {
      const store   = makeMockStore(null);
      const manager = new CursorManager(store, makeLogger() as never);
      await manager.initialize();
      expect(manager.getLastSlot()).toBe(0n);
      await manager.shutdown();
    });
  });

  describe('advance', () => {
    it('advances to a higher slot', async () => {
      const store   = makeMockStore({ slot: 50n, sig: 'old' });
      const manager = new CursorManager(store, makeLogger() as never);
      await manager.initialize();
      manager.advance(75n, 'new');
      expect(manager.getLastSlot()).toBe(75n);
      await manager.shutdown();
    });

    it('does not regress to a lower slot', async () => {
      const store   = makeMockStore({ slot: 100n, sig: 'latest' });
      const manager = new CursorManager(store, makeLogger() as never);
      await manager.initialize();
      manager.advance(50n, 'old');
      expect(manager.getLastSlot()).toBe(100n);
      await manager.shutdown();
    });
  });

  describe('flush', () => {
    it('calls store.write when dirty', async () => {
      const store   = makeMockStore({ slot: 10n, sig: 'sig' });
      const manager = new CursorManager(store, makeLogger() as never);
      await manager.initialize();
      manager.advance(20n, 'newsig');
      await manager.flush();
      expect(store.write).toHaveBeenCalledWith(
        expect.objectContaining({ lastProcessedSlot: 20n }),
      );
      await manager.shutdown();
    });

    it('does not call store.write when clean', async () => {
      const store   = makeMockStore({ slot: 10n, sig: 'sig' });
      const manager = new CursorManager(store, makeLogger() as never);
      await manager.initialize();
      vi.mocked(store.write).mockClear();
      await manager.flush();
      expect(store.write).not.toHaveBeenCalled();
      await manager.shutdown();
    });
  });

  describe('shutdown', () => {
    it('flushes on shutdown', async () => {
      const store   = makeMockStore(null);
      const manager = new CursorManager(store, makeLogger() as never);
      await manager.initialize();
      manager.advance(999n, 'finalsig');
      await manager.shutdown();
      expect(store.write).toHaveBeenCalledWith(
        expect.objectContaining({ lastProcessedSlot: 999n }),
      );
    });
  });
});
