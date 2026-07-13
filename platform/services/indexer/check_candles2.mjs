import { PrismaClient } from '@funrun/database';
const db = new PrismaClient();

// Check ALL schemas for candles table
const all = await db.$queryRaw`
  SELECT table_schema, table_name, column_name, data_type
  FROM information_schema.columns 
  WHERE table_name = 'candles'
  ORDER BY table_schema, ordinal_position
`;
console.log('All candles columns (all schemas):', JSON.stringify(all, null, 2));

await db.$disconnect();
