#!/usr/bin/env node
/**
 * Sprint 1 Task 12 — Verify indexer wrote a trade after on-chain submit.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/verify-trade-indexed.mjs --signature <base58>
 *   DATABASE_URL=... node scripts/verify-trade-indexed.mjs --signature <base58> --max-wait-ms 60000
 *
 * Polls `transactions` until a row with matching tx_signature appears or timeout.
 */

import { PrismaClient } from '../packages/database/src/generated/client/index.js';

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : undefined;
}

const signature = getArg('--signature');
const maxWaitMs = Number(getArg('--max-wait-ms') ?? 30_000);
const pollMs = Number(getArg('--poll-ms') ?? 2_000);

if (!signature) {
  console.error('Usage: node scripts/verify-trade-indexed.mjs --signature <base58> [--max-wait-ms 30000]');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

if (!process.env.DATABASE_URL_REPLICA) {
  process.env.DATABASE_URL_REPLICA = process.env.DATABASE_URL;
}

const prisma = new PrismaClient();

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const deadline = Date.now() + maxWaitMs;
  let attempt = 0;

  console.log(`Polling transactions for signature=${signature} (max ${maxWaitMs}ms)`);

  while (Date.now() < deadline) {
    attempt += 1;
    const row = await prisma.transaction.findUnique({
      where: { txSignature: signature },
      select: {
        id: true,
        coinId: true,
        walletAddress: true,
        tradeType: true,
        slot: true,
        confirmedAt: true,
      },
    });

    if (row) {
      console.log('Indexed trade found:');
      console.log(JSON.stringify(row, null, 2));
      await prisma.$disconnect();
      process.exit(0);
    }

    console.log(`Attempt ${attempt}: not indexed yet — waiting ${pollMs}ms`);
    await sleep(pollMs);
  }

  console.error(`Timeout: no transaction row for signature ${signature}`);
  await prisma.$disconnect();
  process.exit(1);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
