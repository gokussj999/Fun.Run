#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabaseClient } from '../packages/database/src/client.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
for (const line of readFileSync(resolve(root, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([^#=][^=]*)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const slotArg = process.argv[2];
let slot = slotArg ? BigInt(slotArg) : null;

if (!slot) {
  const rpc = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot' }),
  });
  const json = await res.json();
  slot = BigInt(json.result);
}

const db = createDatabaseClient({ url: process.env.DATABASE_URL });
await db.indexerState.upsert({
  where: { id: 'singleton' },
  create: { id: 'singleton', lastSlot: slot, isHealthy: true },
  update: { lastSlot: slot, isHealthy: true, errorMessage: null },
});
console.log(`indexer_state seeded at slot ${slot.toString()}`);
await db.$disconnect();
