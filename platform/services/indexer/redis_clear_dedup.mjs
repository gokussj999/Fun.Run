import net from 'net';

function redisCmd(socket, ...args) {
  return new Promise((resolve, reject) => {
    const cmd = `*${args.length}\r\n` + args.map(a => `$${Buffer.byteLength(String(a))}\r\n${String(a)}\r\n`).join('');
    socket.once('data', (d) => resolve(d.toString().trim()));
    socket.once('error', reject);
    socket.write(cmd);
  });
}

const client = net.createConnection(6379, '127.0.0.1');
await new Promise((res, rej) => { client.once('connect', res); client.once('error', rej); });

// Clear dedup key for our buy TX (set when processEvent was called before handler failed)
const dedupKey = 'indexer:sig:fo9q6Lqcy97XkYFkB5H61fVHM65D6QWGs3vD3a8QwujX4DhTNXbq3NCYbN1nNhqbX8UVmoactkdWHJKgRNzzSiT:TokensPurchased';
const r1 = await redisCmd(client, 'DEL', dedupKey);
console.log('DEL dedup:', r1);

// Also clear cursor key
const r2 = await redisCmd(client, 'DEL', 'indexer:cursor');
console.log('DEL cursor:', r2);

client.destroy();
console.log('Done');
