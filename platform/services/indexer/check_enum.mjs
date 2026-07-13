import { PrismaClient } from '@funrun/database';
const db = new PrismaClient();

const vals = await db.$queryRaw`
  SELECT e.enumlabel, n.nspname as schema
  FROM pg_enum e
  JOIN pg_type t ON e.enumtypid = t.oid
  JOIN pg_namespace n ON t.typnamespace = n.oid
  WHERE t.typname = 'Timeframe'
  ORDER BY n.nspname, e.enumsortorder
`;
console.log('Timeframe enum values:', JSON.stringify(vals, null, 2));
await db.$disconnect();
