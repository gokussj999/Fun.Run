import { useEffect, useRef, useState } from "react";
import { wsClient, mapWsEventToLegacy } from "../services/ws-client.js";
import { env } from "../lib/env.js";

/**
 * Platform WebSocket hook — ws-gateway protocol with channel subscriptions.
 */
export function usePlatformWs({
  enabled = env.usePlatform,
  getToken,
  wallet,
  activeMint,
  onLegacyEvent,
}) {
  const [connected, setConnected] = useState(false);
  const onLegacyRef = useRef(onLegacyEvent);
  onLegacyRef.current = onLegacyEvent;

  useEffect(() => {
    if (!enabled) return undefined;

    const off = wsClient.onEvent((msg) => {
      if (msg.type === "connection") {
        setConnected(msg.status === "open");
        return;
      }
      const legacy = mapWsEventToLegacy(msg);
      if (legacy && onLegacyRef.current) {
        onLegacyRef.current(legacy, msg);
      }
    });

    wsClient.connect({
      getToken,
      shouldConnect: () => true,
    });

    wsClient.subscribe("market", 0);

    return () => {
      off();
    };
  }, [enabled, getToken]);

  useEffect(() => {
    if (!enabled || !wallet) return undefined;

    const channels = [
      `portfolio:${wallet}`,
      `creator:${wallet}`,
      `referral:${wallet}`,
      `notifications:${wallet}`,
    ];

    for (const ch of channels) {
      wsClient.subscribe(ch, wsClient.fromSeqs.get(ch) ?? 0);
    }

    return () => {
      for (const ch of channels) {
        wsClient.unsubscribe(ch);
      }
    };
  }, [enabled, wallet]);

  useEffect(() => {
    if (!enabled || !activeMint) return undefined;

    const channels = [
      `coin:${activeMint}`,
      `trades:${activeMint}`,
      `holders:${activeMint}`,
    ];

    for (const ch of channels) {
      wsClient.subscribe(ch, wsClient.fromSeqs.get(ch) ?? 0);
    }

    return () => {
      for (const ch of channels) {
        wsClient.unsubscribe(ch);
      }
    };
  }, [enabled, activeMint]);

  return { connected, wsClient };
}
