import { beforeAll, afterAll } from 'vitest';

beforeAll(async () => {
  process.env['NODE_ENV'] = 'test';
  process.env['LOG_LEVEL'] = 'silent';
  process.env['DATABASE_URL'] = 'postgresql://funrun:secret@localhost:5432/funrun_test';
  process.env['REDIS_URL'] = 'redis://localhost:6379';
  process.env['JWT_SECRET'] = 'test-secret-key-min-32-chars-long-123';
  process.env['MNEMONIC_ENCRYPTION_KEY'] = 'test-32-byte-aes-256-gcm-key-xxx';
  process.env['SOLANA_RPC_PRIMARY'] = 'https://api.devnet.solana.com';
  process.env['SOLANA_NETWORK'] = 'devnet';
  process.env['PROGRAM_ID'] = 'HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP';
});

afterAll(async () => {
  // teardown hooks — populated per-service
});
