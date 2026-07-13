import { createClient } from 'redis';

const client = createClient({ url: 'redis://localhost:6379' });
await client.connect();

const cursorDel = await client.del('indexer:cursor');
console.log('cursor DEL:', cursorDel);

const dedupKey = 'indexer:sig:fo9q6Lqcy97XkYFkB5H61fVHM65D6QWGs3vD3a8QwujX4DhTNXbq3NCYbN1nNhqbX8UVmoactkdWHJKgRNzzSiT:TokensPurchased';
const dedupDel = await client.del(dedupKey);
console.log('dedup DEL:', dedupDel);

const keys = await client.keys('indexer:*');
console.log('remaining indexer keys:', keys);

await client.disconnect();
