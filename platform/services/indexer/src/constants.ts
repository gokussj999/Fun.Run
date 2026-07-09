import { createHash } from 'node:crypto';

import type { EventName, Timeframe } from './types.js';

// ─── Anchor event discriminator computation ───────────────────────────────────
// Anchor uses SHA256("event:<EventName>")[0..8] as the 8-byte discriminator.
// Pre-computed at module load time — never recomputed at runtime.

function computeDiscriminator(eventName: string): Buffer {
  return Buffer.from(
    createHash('sha256').update(`event:${eventName}`).digest(),
  ).subarray(0, 8);
}

export const EVENT_DISCRIMINATORS: Record<EventName, Buffer> = {
  CoinCreated:                 computeDiscriminator('CoinCreated'),
  TokensPurchased:             computeDiscriminator('TokensPurchased'),
  TokensSold:                  computeDiscriminator('TokensSold'),
  GraduationInitiated:         computeDiscriminator('GraduationInitiated'),
  GraduationCompleted:         computeDiscriminator('GraduationCompleted'),
  LiquidityLocked:             computeDiscriminator('LiquidityLocked'),
  MintAuthorityRevoked:        computeDiscriminator('MintAuthorityRevoked'),
  FreezeAuthorityRevoked:      computeDiscriminator('FreezeAuthorityRevoked'),
  CoinGraduated:               computeDiscriminator('CoinGraduated'),
  CreatorFeesClaimed:          computeDiscriminator('CreatorFeesClaimed'),
  CreatorReferrerFeesClaimed:  computeDiscriminator('CreatorReferrerFeesClaimed'),
  CreatorReferrerSet:          computeDiscriminator('CreatorReferrerSet'),
  GlobalConfigUpdated:         computeDiscriminator('GlobalConfigUpdated'),
  TreasurySweep:               computeDiscriminator('TreasurySweep'),
} as const;

// Reverse map: discriminator hex → EventName (for fast lookup)
export const DISCRIMINATOR_TO_EVENT = new Map<string, EventName>(
  (Object.entries(EVENT_DISCRIMINATORS) as [EventName, Buffer][]).map(
    ([name, buf]) => [buf.toString('hex'), name],
  ),
);

// ─── Log parsing ──────────────────────────────────────────────────────────────

export const PROGRAM_DATA_PREFIX = 'Program data: ';
export const PROGRAM_LOG_PREFIX  = 'Program log: ';

// ─── Indexer tuning ───────────────────────────────────────────────────────────

export const MAX_RETRY_ATTEMPTS = 5;
export const RETRY_BASE_DELAY_MS = 500;
export const RETRY_MAX_DELAY_MS  = 30_000;

export const WS_PING_INTERVAL_MS     = 15_000;
export const WS_RECONNECT_BASE_MS    = 1_000;
export const WS_RECONNECT_MAX_MS     = 30_000;
export const WS_HEALTH_TIMEOUT_MS    = 60_000; // stale if no message for 60s

export const CURSOR_FLUSH_INTERVAL_MS = 2_000;  // write cursor to DB every 2s
export const CURSOR_REDIS_TTL_S       = 300;     // 5 min Redis cache for cursor

export const BACKFILL_BATCH_SIZE      = 100;     // transactions per RPC call
export const BACKFILL_RATE_LIMIT_MS   = 200;     // delay between backfill batches

export const SIGNATURE_DEDUP_TTL_S   = 7 * 24 * 3600; // 7 days in Redis
export const REORG_SAFE_DEPTH         = 32n;      // slots considered final

// ─── Redis keys ───────────────────────────────────────────────────────────────

export const REDIS_KEYS_INDEXER = {
  cursor:                  () => 'indexer:cursor',
  processedSig:  (sig: string) => `indexer:sig:${sig}`,
  workerLock:              () => 'indexer:worker_lock',
  metrics:                 () => 'indexer:metrics',
} as const;

// ─── Redis pub/sub channels ───────────────────────────────────────────────────

export const PUBSUB_CHANNELS = {
  coinCreated:                        'events:coin_created',
  allTrades:                          'events:all_trades',
  allGraduations:                     'events:all_graduations',
  feeClaimed:                         'events:fee_claimed',
  treasurySweep:                      'events:treasury_sweep',
  adminAction:                        'events:admin_action',
  indexerEvents:                      'events:indexer',
  indexerMetrics:                     'metrics:indexer',
  priceUpdate:  (mint: string) => `price:${mint}`,
  graduation:   (mint: string) => `graduation:${mint}`,
} as const;

