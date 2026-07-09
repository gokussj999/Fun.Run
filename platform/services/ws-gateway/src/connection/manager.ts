import { WebSocket } from 'ws';
import type { IncomingMessage } from 'node:http';
import { v4 as uuidv4 } from 'uuid';
import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';

import type { ClientConnection, ClientMessage, ServerMessage, UserRole } from '../types.js';
import { ConnectionRegistry } from './registry.js';
import { SubscriptionManager } from '../subscription/manager.js';
import { PresenceTracker } from '../presence/tracker.js';
import { HeartbeatManager } from '../heartbeat/manager.js';
import { ConnectionRateLimiter } from '../rate-limit/limiter.js';
import { ReplayBuffer } from '../replay/buffer.js';
import { WsMetrics } from '../metrics/index.js';
import { extractTokenFromRequest, verifyWsToken } from '../middleware/auth.js';
import { MAX_CONNECTIONS_PER_IP, MAX_MESSAGE_SIZE_BYTES, GATEWAY_VERSION } from '../constants.js';

export interface ConnectionManagerDeps {
  registry:     ConnectionRegistry;
  subscriptions: SubscriptionManager;
  presence:     PresenceTracker;
  heartbeat:    HeartbeatManager;
  rateLimiter:  ConnectionRateLimiter;
  replayBuffer: ReplayBuffer;
  metrics:      WsMetrics;
  db:           PrismaClient;
  logger:       Logger;
  tokenVerifier: (token: string) => Promise<{ userId: string; walletAddress?: string } | null>;
}

/**
 * ConnectionManager handles the full lifecycle of a WebSocket connection:
 *
 *   connect → welcome → [auth] → subscribe/unsubscribe → ping/pong → disconnect
 *
 * Each connection starts unauthenticated. Clients may authenticate at any time
 * by sending an auth message or passing a token in the query string on connect.
 */
export class ConnectionManager {
  constructor(private readonly deps: ConnectionManagerDeps) {}

  async handleConnection(socket: WebSocket, req: IncomingMessage): Promise<void> {
    const {
      registry, subscriptions, presence, heartbeat,
      rateLimiter, metrics, db, logger, tokenVerifier,
    } = this.deps;

    // IP rate limiting / connection count check
    const ipAddress = this.extractIp(req);
    if (registry.countByIp(ipAddress) >= MAX_CONNECTIONS_PER_IP) {
      this.send(socket, {
        type: 'error', code: 'RATE_LIMITED',
        message: `Too many connections from ${ipAddress}`,
      });
      socket.close(1008, 'Too many connections');
      return;
    }

    const connId = uuidv4();
    const conn: ClientConnection = {
      id:             connId,
      connectedAt:    Date.now(),
      ipAddress,
      userAgent:      (req.headers['user-agent'] ?? '') as string,
      walletAddress:  null,
      role:           null,
      subscriptions:  new Set(),
      lastPingSentAt: Date.now(),
      lastPongAt:     Date.now(),
      isAlive:        true,
      isSlowConsumer: false,
      slowConsumerAt: null,
      messagesSent:   0,
      messagesReceived: 0,
      sentSeqs:       new Map(),
    };

    registry.add(conn, socket);
    metrics.onConnect();
    await presence.register(connId, null);

    logger.info({ connId: connId.slice(0, 8), ip: ipAddress }, 'Connection opened');

    // Try token auth from query string immediately
    const rawToken = await extractTokenFromRequest(req);
    if (rawToken) {
      await this.authenticateConnection(conn, socket, rawToken);
    }

    // Send welcome
    this.send(socket, {
      type:         'welcome',
      connectionId: connId,
      serverTime:   Date.now(),
      version:      GATEWAY_VERSION,
    });

    // Wire up events
    socket.on('message', (data) => {
      if (data instanceof Buffer && data.length > MAX_MESSAGE_SIZE_BYTES) {
        this.sendError(socket, undefined, 'INVALID_MESSAGE', 'Message too large');
        return;
      }
      void this.handleMessage(conn, socket, data.toString());
    });

    socket.on('pong', () => {
      heartbeat.markAlive(conn);
    });

    socket.on('close', (code, reason) => {
      void this.handleClose(conn, code, reason.toString());
    });

    socket.on('error', (err) => {
      logger.warn({ connId: connId.slice(0, 8), err: err.message }, 'Socket error');
      metrics.onError();
    });
  }

  private async handleMessage(
    conn:   ClientConnection,
    socket: WebSocket,
    raw:    string,
  ): Promise<void> {
    const { rateLimiter, subscriptions, replayBuffer, logger, metrics } = this.deps;

    metrics.onMessageReceived();
    conn.messagesReceived++;

    // Rate limit inbound messages
    if (!rateLimiter.check(conn.id)) {
      this.sendError(socket, undefined, 'RATE_LIMITED', 'Too many messages — slow down');
      return;
    }

    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw) as ClientMessage;
      if (!msg.type) throw new Error('missing type');
    } catch {
      this.sendError(socket, undefined, 'INVALID_MESSAGE', 'Invalid JSON or missing type field');
      return;
    }

    switch (msg.type) {
      case 'auth': {
        const result = await this.authenticateConnection(conn, socket, msg.token);
        if (result && conn.walletAddress) {
          this.send(socket, { type: 'authed', id: msg.id, wallet: conn.walletAddress, role: conn.role ?? 'USER' });
        } else {
          this.sendError(socket, msg.id, 'UNAUTHORIZED', 'Invalid or expired token');
        }
        break;
      }

      case 'subscribe': {
        const result = await subscriptions.subscribe(conn, msg.channel);
        if (result.ok) {
          this.send(socket, { type: 'subscribed', id: msg.id, channel: msg.channel, seq: result.headSeq });
          // Replay missed events if fromSeq provided
          if (msg.fromSeq !== undefined && msg.fromSeq < result.headSeq) {
            const missed = await replayBuffer.getFrom(msg.channel, msg.fromSeq + 1);
            for (const entry of missed) {
              this.send(socket, {
                type: 'event', channel: msg.channel,
                seq: entry.seq, ts: entry.ts, event: entry.event, data: entry.data,
              });
            }
          }
        } else {
          this.sendError(socket, msg.id, result.code as never, result.message);
        }
        break;
      }

      case 'unsubscribe': {
        await subscriptions.unsubscribe(conn, msg.channel);
        this.send(socket, { type: 'unsubscribed', id: msg.id, channel: msg.channel });
        break;
      }

      case 'ping': {
        this.send(socket, { type: 'pong', id: msg.id, time: Date.now() });
        break;
      }

      default: {
        this.sendError(socket, undefined, 'INVALID_MESSAGE', 'Unknown message type');
      }
    }
  }

  private async handleClose(conn: ClientConnection, code: number, reason: string): Promise<void> {
    const { registry, subscriptions, presence, heartbeat, rateLimiter, logger } = this.deps;

    logger.info(
      { connId: conn.id.slice(0, 8), code, reason: reason || '(none)', subs: conn.subscriptions.size },
      'Connection closed',
    );

    await subscriptions.unsubscribeAll(conn);
    registry.remove(conn.id);
    await presence.deregister(conn.id);
    rateLimiter.remove(conn.id);
  }

  private async authenticateConnection(
    conn:   ClientConnection,
    socket: WebSocket,
    token:  string,
  ): Promise<boolean> {
    const { db, registry, presence, logger, tokenVerifier } = this.deps;

    const result = await verifyWsToken(token, tokenVerifier);
    if (!result) return false;

    // Fetch role from DB
    let role: UserRole = 'USER';
    try {
      const profile = await db.profile.findUnique({
        where:  { walletAddress: result.walletAddress },
        select: { role: true },
      });
      if (profile?.role) role = profile.role as UserRole;
    } catch (err) {
      logger.warn({ err }, 'ConnectionManager: DB role fetch failed — defaulting to USER');
    }

    conn.walletAddress = result.walletAddress;
    conn.role          = role;

    registry.associateWallet(conn.id, result.walletAddress);
    await presence.updateWallet(conn.id, result.walletAddress);

    logger.info(
      { connId: conn.id.slice(0, 8), wallet: result.walletAddress.slice(0, 8), role },
      'Connection authenticated',
    );
    return true;
  }

  private send(socket: WebSocket, msg: ServerMessage): void {
    if (socket.readyState !== WebSocket.OPEN) return;
    try {
      const json = JSON.stringify(msg);
      socket.send(json, { compress: true });
      this.deps.metrics.onMessageSent(json.length);
    } catch { /* noop */ }
  }

  private sendError(
    socket:  WebSocket,
    id:      string | undefined,
    code:    ServerMessage extends { code: infer C } ? C : string,
    message: string,
  ): void {
    this.send(socket, { type: 'error', id, code: code as never, message });
  }

  private extractIp(req: IncomingMessage): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim() ?? '0.0.0.0';
    return req.socket.remoteAddress ?? '0.0.0.0';
  }
}
