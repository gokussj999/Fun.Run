import net from 'net';

function redisCmd(client, ...args) {
  return new Promise((resolve, reject) => {
    const cmd = `*${args.length}\r\n` + args.map(a => `$${Buffer.byteLength(String(a))}\r\n${String(a)}\r\n`).join('');
    let buf = '';
    const onData = (d) => { buf += d.toString(); resolve(buf.trim()); };
    client.once('data', onData);
    client.once('error', reject);
    client.write(cmd);
  });
}

const client = net.createConnection(6379, '127.0.0.1');
await new Promise((res, rej) => { client.once('connect', res); client.once('error', rej); });

const delResult = await redisCmd(client, 'DEL', 'indexer:cursor');
console.log('DEL indexer:cursor:', delResult);

const dedupKey = 'indexer:sig:fo9q6Lqcy97XkYFkB5H61fVHM65D6QWGs3vD3a8QwujX4DhTNXbq3NCYbN1nNhqbX8UVmoactkdWHJKgRNzzSiT:TokensPurchased';
const dedupResult = await redisCmd(client, 'DEL', dedupKey);
console.log('DEL dedup key:', dedupResult);

client.destroy();
console.log('Redis reset done');
