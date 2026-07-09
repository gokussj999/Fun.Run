import type { WebSocket } from 'ws';

import type { ClientConnection } from '../types.js';

/**
 * Local in-process connection registry.
 * Stores every WebSocket connection on THIS gateway worker.
 * No cross-worker coordination — each worker is independent.
 */
export class ConnectionRegistry {
  private readonly byId     = new Map<string, ClientConnection>();
  private readonly byWallet = new Map<string, Set<string>>(); // walletAddress → Set<connId>
  private readonly byIp     = new Map<string, Set<string>>(); // ip → Set<connId>
  private readonly sockets  = new Map<string, WebSocket>();

  add(conn: ClientConnection, socket: WebSocket): void {
    this.byId.set(conn.id, conn);
    this.sockets.set(conn.id, socket);

    const ipSet = this.byIp.get(conn.ipAddress) ?? new Set();
    ipSet.add(conn.id);
    this.byIp.set(conn.ipAddress, ipSet);
  }

  remove(connId: string): ClientConnection | undefined {
    const conn = this.byId.get(connId);
    if (!conn) return undefined;

    this.byId.delete(connId);
    this.sockets.delete(connId);

    // Clean up IP index
    const ipSet = this.byIp.get(conn.ipAddress);
    if (ipSet) {
      ipSet.delete(connId);
      if (ipSet.size === 0) this.byIp.delete(conn.ipAddress);
    }

    // Clean up wallet index
    if (conn.walletAddress) {
      const walletSet = this.byWallet.get(conn.walletAddress);
      if (walletSet) {
        walletSet.delete(connId);
        if (walletSet.size === 0) this.byWallet.delete(conn.walletAddress);
      }
    }

    return conn;
  }

  get(connId: string): ClientConnection | undefined {
    return this.byId.get(connId);
  }

  getSocket(connId: string): WebSocket | undefined {
    return this.sockets.get(connId);
  }

  associateWallet(connId: string, walletAddress: string): void {
    const conn = this.byId.get(connId);
    if (!conn) return;

    // Remove old wallet association
    if (conn.walletAddress && conn.walletAddress !== walletAddress) {
      const old = this.byWallet.get(conn.walletAddress);
      old?.delete(connId);
    }

    conn.walletAddress = walletAddress;
    const walletSet = this.byWallet.get(walletAddress) ?? new Set();
    walletSet.add(connId);
    this.byWallet.set(walletAddress, walletSet);
  }

  getByWallet(walletAddress: string): ClientConnection[] {
    const ids = this.byWallet.get(walletAddress) ?? new Set();
    return [...ids].map((id) => this.byId.get(id)).filter(Boolean) as ClientConnection[];
  }

  countByIp(ip: string): number {
    return this.byIp.get(ip)?.size ?? 0;
  }

  getAll(): IterableIterator<ClientConnection> {
    return this.byId.values();
  }

  get size(): number {
    return this.byId.size;
  }
}
