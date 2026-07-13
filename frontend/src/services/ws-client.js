import { env } from "../lib/env.js";

let _msgId = 0;
function nextId() {
  _msgId += 1;
  return String(_msgId);
}

/**
 * ws-gateway protocol v1.0.0 client.
 * Handles auth, subscribe/unsubscribe, reconnect, and event dispatch.
 */
export class WsGatewayClient {
  constructor(url = env.wsUrl) {
    this.url = url;
    this.ws = null;
    this.connected = false;
    this.authed = false;
    this.wallet = null;
    this.reconnectDelay = 3000;
    this.reconnectTimer = null;
    this.pending = new Map();
    this.handlers = new Set();
    this.subscriptions = new Map();
    this.fromSeqs = new Map();
    this.getToken = null;
    this.shouldConnect = () => true;
  }

  onEvent(handler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  connect({ getToken, shouldConnect } = {}) {
    if (getToken) this.getToken = getToken;
    if (shouldConnect) this.shouldConnect = shouldConnect;
    this._open();
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.authed = false;
  }

  subscribe(channel, fromSeq) {
    const seq = fromSeq ?? this.fromSeqs.get(channel) ?? 0;
    this.subscriptions.set(channel, seq);
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      this._send({ type: "subscribe", id: nextId(), channel, fromSeq: seq });
    }
  }

  unsubscribe(channel) {
    this.subscriptions.delete(channel);
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      this._send({ type: "unsubscribe", id: nextId(), channel });
    }
  }

  _open() {
    if (!this.shouldConnect()) return;
    clearTimeout(this.reconnectTimer);

    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.connected = true;
      this._emit({ type: "connection", status: "open" });
      void this._authenticate();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this._handleMessage(msg);
      } catch {
        /* ignore malformed */
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.authed = false;
      this._emit({ type: "connection", status: "closed" });
      this._scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  _scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this._open(), this.reconnectDelay);
  }

  async _authenticate() {
    if (!this.getToken) {
      this._resubscribeAll();
      return;
    }
    try {
      const token = await this.getToken();
      if (!token) {
        this._resubscribeAll();
        return;
      }
      const id = nextId();
      this._send({ type: "auth", id, token });
    } catch {
      this._resubscribeAll();
    }
  }

  _resubscribeAll() {
    for (const [channel, fromSeq] of this.subscriptions) {
      this._send({ type: "subscribe", id: nextId(), channel, fromSeq });
    }
  }

  _send(msg) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  _handleMessage(msg) {
    if (msg.type === "welcome") {
      return;
    }

    if (msg.type === "authed") {
      this.authed = true;
      this.wallet = msg.wallet || null;
      this._resubscribeAll();
      this._emit({ type: "authed", wallet: this.wallet });
      return;
    }

    if (msg.type === "subscribed") {
      if (msg.channel && typeof msg.seq === "number") {
        this.fromSeqs.set(msg.channel, msg.seq);
      }
      return;
    }

    if (msg.type === "event") {
      if (msg.channel && typeof msg.seq === "number") {
        this.fromSeqs.set(msg.channel, msg.seq);
      }
      this._emit(msg);
      return;
    }

    if (msg.type === "error") {
      this._emit({ type: "error", code: msg.code, message: msg.message });
    }
  }

  _emit(msg) {
    for (const h of this.handlers) {
      try {
        h(msg);
      } catch {
        /* handler error */
      }
    }
  }
}

/** Singleton for app-wide WS connection. */
export const wsClient = new WsGatewayClient();

/** Map ws-gateway coin/trade events to legacy UI event shapes. */
export function mapWsEventToLegacy(msg) {
  if (msg.type !== "event") return null;
  const { event, data, channel } = msg;

  // Coin-specific channel: price/stats update takes priority
  if ((event === "price_update" || event === "trade_buy" || event === "trade_sell") && channel?.startsWith("coin:")) {
    return { event: "coin:update", payload: data };
  }

  // Market / trades channel: show in recent-trades feed
  if (event === "market_trade" || event === "trade_buy" || event === "trade_sell") {
    return {
      event: "trade:new",
      payload: {
        ...data,
        side: event === "trade_sell" ? "SELL" : "BUY",
        channel,
      },
    };
  }

  if (event === "coin_created") {
    return { event: "coin:created", payload: data };
  }

  if (event === "portfolio_updated") {
    return { event: "portfolio:update", payload: data };
  }

  // Channel-based detection for wallet-scoped events (event name may vary)
  if (event === "creator_update" || event?.startsWith?.("creator_") || channel?.startsWith("creator:")) {
    return { event: "creator:update", payload: data };
  }

  if (event === "referral_update" || event?.startsWith?.("referral_") || channel?.startsWith("referral:")) {
    return { event: "referral:update", payload: data };
  }

  if (event === "notification" || channel?.startsWith("notifications:")) {
    return { event: "notification:new", payload: data };
  }

  return { event, payload: data, channel };
}
