import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';
import type Redis from 'ioredis';

import { ConnectionRegistry } from './connection/registry.js';
import { ConnectionManager } from './connection/manager.js';
import { SubscriptionManager } from './subscription/manager.js';
import { PresenceTracker } from './presence/tracker.js';
import { HeartbeatManager } from './heartbeat/manager.js';
import { ConnectionRateLimiter } from './rate-limit/limiter.js';
import { ReplayBuffer } from './replay/buffer.js';
import { RedisSubscriber } from './redis/subscriber.js';
import { EventDispatcher } from './redis/dispatcher.js';
import { BackpressureHandler } from './backpressure/handler.js';
import { WsMetrics } from './metrics/index.js';

export interface WsContainer {
  registry:         ConnectionRegistry;
  connManager:      ConnectionManager;
  subscriptions:    SubscriptionManager;
  presence:         PresenceTracker;
  heartbeat:        HeartbeatManager;
  rateLimiter:      ConnectionRateLimiter;
  replayBuffer:     ReplayBuffer;
  redisSubscriber:  RedisSubscriber;
  dispatcher:       EventDispatcher;
  backpressure:     BackpressureHandler;
  metrics:          WsMetrics;
  db:               PrismaClient;
  logger:           Logger;
}

/**
 * Build the fully-wired WsContainer.
 *
 * Dependency order:
 *   registry, replayBuffer, backpressure, rateLimiter (no deps)
 *   → redisSubscriber (redis)
 *   → subscriptions (registry + redisSubscriber + replayBuffer)
 *   → dispatcher (cache + registry + subscriptions + replayBuffer + backpressure)
 *   → presence (redis)
 *   → heartbeat (registry)
 *   → metrics (registry + subscriptions)
 *   → connManager (all of the above)
 */
export function buildContainer(deps: {
  db:       PrismaClient;
  cache:    Redis;
  pubsub:   Redis;
  logger:   Logger;
  tokenVerifier: (token: string) => Promise<{ userId: string; walletAddress?: string } | null>;
}): WsContainer {
  const { db, cache, pubsub, logger, tokenVerifier } = deps;

  const registry      = new ConnectionRegistry();
  const replayBuffer  = new ReplayBuffer(cache, logger);
  const backpressure  = new BackpressureHandler(logger);
  const rateLimiter   = new ConnectionRateLimiter();
  const presence      = new PresenceTracker(cache, logger);  // cache: not subscriber mode

  const redisSubscriber = new RedisSubscriber(pubsub, logger); // pubsub: subscriber mode only

  const subscriptions = new SubscriptionManager(registry, redisSubscriber, replayBuffer, logger);

  const dispatcher = new EventDispatcher(
    cache, registry, subscriptions, replayBuffer, backpressure, logger,
  );

  const heartbeat = new HeartbeatManager(registry, logger);
  const metrics   = new WsMetrics(registry, subscriptions, logger);

  const connManager = new ConnectionManager({
    registry, subscriptions, presence, heartbeat,
    rateLimiter, replayBuffer, metrics,
    db, logger, tokenVerifier,
  });

  // Wire Redis messages → dispatcher
  redisSubscriber.setMessageHandler((channel, rawData) => {
    void dispatcher.handleRedisMessage(channel, rawData);
  });

  return {
    registry, connManager, subscriptions, presence, heartbeat,
    rateLimiter, replayBuffer, redisSubscriber, dispatcher,
    backpressure, metrics, db, logger,
  };
}
