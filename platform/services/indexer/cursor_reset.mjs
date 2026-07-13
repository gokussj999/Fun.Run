import { config } from 'dotenv';
import { resolve } from 'path';

// Load platform .env
config({ path: resolve('/d/pump-mini/platform/.env') });

import { PrismaClient } from '@funrun/database';
import Ioredis from 'ioredis';

const db = new PrismaClient();

const current = await db.indexerState.findUnique({ where: { id: 'singleton' } });
console.log('Current IndexerState:', JSON.stringify(current, (k,v) => typeof v === 'bigint' ? v.toString() : v));

// Reset to slot 475752580 (before our buy TX at 475752589)
await db.indexerState.upsert({
  where: { id: 'singleton' },
  update: {
    lastSlot: BigInt(475752580),
    lastSignature: null,
    isHealthy: true,
    errorMessage: null,
  },
  create: {
    id: 'singleton',
    lastSlot: BigInt(475752580),
    lastSignature: null,
  },
});

const after = await db.indexerState.findUnique({ where: { id: 'singleton' } });
console.log('After reset:', JSON.stringify(after, (k,v) => typeof v === 'bigint' ? v.toString() : v));
await db.$disconnect();

// Delete Redis cursor key
const redis = new Ioredis('redis://localhost:6379');
const del1 = await redis.del('indexer:cursor');
console.log('Redis DEL indexer:cursor:', del1);

const dedupKey = 'indexer:sig:fo9q6Lqcy97XkYFkB5H61fVHM65D6QWGs3vD3a8QwujX4DhTNXbq3NCYbN1nNhqbX8UVmoactkdWHJKgRNzzSiT:TokensPurchased';
const del2 = await redis.del(dedupKey);
console.log('Redis DEL dedup:', del2);

redis.disconnect();
console.log('All done');
