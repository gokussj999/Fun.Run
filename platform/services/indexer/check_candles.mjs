import { PrismaClient } from '@funrun/database';

const db = new PrismaClient();

// Check actual candles table columns
const cols = await db.$queryRaw`
  SELECT column_name, data_type, column_default
  FROM information_schema.columns 
  WHERE table_schema = 'funrun_platform' AND table_name = 'candles'
  ORDER BY ordinal_position
`;
console.log('Candles columns:', JSON.stringify(cols, null, 2));

await db.$disconnect();
