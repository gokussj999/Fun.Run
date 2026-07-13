import { Connection, type Commitment } from '@solana/web3.js';

export interface RpcClientOptions {
  url:         string;
  commitment?: Commitment;
  wsUrl?:      string;
}

export function createRpcClient(opts: RpcClientOptions): Connection {
  return new Connection(opts.url, {
    commitment:              opts.commitment ?? 'confirmed',
    disableRetryOnRateLimit: true,
    ...(opts.wsUrl !== undefined ? { wsEndpoint: opts.wsUrl } : {}),
  });
}

/**
 * Lightweight probe used by RpcHealthManager to check endpoint liveness.
 * Creates a short-lived connection, calls getSlot(), returns latency in ms.
 */
export async function probeEndpoint(url: string, timeoutMs: number): Promise<number> {
  const conn = new Connection(url, { commitment: 'confirmed', disableRetryOnRateLimit: true });
  const start = Date.now();
  await Promise.race([
    conn.getSlot('confirmed'),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`probe timeout after ${timeoutMs}ms`)), timeoutMs),
    ),
  ]);
  return Date.now() - start;
}
