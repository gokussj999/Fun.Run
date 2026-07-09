/**
 * Database seed — development only.
 * Run: pnpm db:seed
 */
import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

  // Initialize indexer state singleton
  await prisma.indexerState.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      lastSlot: 0n,
      lastSignature: null,
      isHealthy: true,
    },
  });

  console.log('Indexer state initialized.');
  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
