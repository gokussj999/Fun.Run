import './load-env.js';

import { Keypair, PublicKey, Connection } from '@solana/web3.js';
import { createDatabaseClient } from '@funrun/database';
import { createLogger } from '@funrun/logger';
import { createRedisClient } from '@funrun/redis';
import { resolveMnemonicEncryptionKey } from '@funrun/config';

import { IpGuard } from './auth/ip-guard.js';
import { TradingAuthVerifier } from './auth/verifier.js';
import { TradeEventPublisher } from './events/publisher.js';
import { TradeLogger } from './logger/trade.logger.js';
import { IdempotencyStore } from './idempotency/store.js';
import { TradeExecutor } from './trading/executor.js';
import { OnChainTradeOrchestrator } from './trading/onchain-orchestrator.js';
import { TradeRouter } from './trading/trade-router.js';
import { BuyExecutor } from './executors/buy-executor.js';
import { SellExecutor } from './executors/sell-executor.js';
import { CreateCoinExecutor } from './executors/create-coin-executor.js';
import { CreateCoinOrchestrator } from './trading/create-coin-orchestrator.js';
import { DepositScanner } from './wallet/deposit-scanner.js';
import { buildTradingServer } from './server.js';
import { resolveRedisDependencyMode } from './config/redis-dependency.js';
import {
  resolveRequireTradeIdempotencyKey,
  resolveWorkerLeaderElection,
} from './config/trading-hardening.js';
import { WorkerLeaderLock } from './background/leader-lock.js';

// ── On-chain infrastructure (Phases 8.5.9A–I) ────────────────────────────────
import { RpcHealthManager } from './rpc/health-manager.js';
import { ConnectionPool } from './solana/connection-pool.js';
import { BlockhashCache } from './solana/blockhash-cache.js';
import { PriorityFeeEstimator } from './solana/priority-fee.js';
import { probeEndpoint } from './solana/client.js';
import { TxStore } from './lifecycle/tx-store.js';
import { TxStateMachine } from './lifecycle/tx-state-machine.js';
import { TxConfirmer } from './lifecycle/tx-confirmer.js';
import { TxSender } from './tx/sender.js';
import { TransactionBuilder } from './tx/builder.js';
import { GraduationExecutor } from './executors/graduation-executor.js';
import { TxReconciler } from './background/tx-reconciler.js';
import { GraduationCrank } from './background/graduation-crank.js';
import { MetricsRegistry, DURATION_BUCKETS, CONFIRMATION_BUCKETS } from './monitoring/registry.js';
import { TradingMetrics } from './monitoring/metrics.js';
import { HealthChecker } from './monitoring/health-checker.js';
import { DbCollector } from './monitoring/db-collector.js';
import { MonitoringServer } from './monitoring/server.js';
import { createFunrunProgram } from './anchor/program.js';
import { resolveTradingMode } from './config/trading-mode.js';
import type { TradingMode } from './config/trading-mode.js';

const logger = createLogger({ service: 'trading' });

// ── Treasury keypair loader ────────────────────────────────────────────────────
// Supports JSON array [1,2,...,64], base58 (Phantom export), or base64.
const B58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function decodeBase58(str: string): Uint8Array {
  const bytes: number[] = [0];
  for (const ch of str) {
    const val = B58_ALPHABET.indexOf(ch);
    if (val === -1) throw new Error(`Invalid base58 character: "${ch}"`);
    let carry = val;
    for (let i = 0; i < bytes.length; i++) {
      carry += (bytes[i] ?? 0) * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let k = 0; k < str.length && str[k] === '1'; k++) bytes.push(0);
  return Uint8Array.from(bytes.reverse());
}

function loadTreasuryKeypair(raw: string): Keypair {
  const trimmed = raw.trim().replace(/^["']|["']$/g, '');
  let secret: Uint8Array;
  if (trimmed.startsWith('[')) {
    secret = Uint8Array.from(JSON.parse(trimmed) as number[]);
  } else if (/^[1-9A-HJ-NP-Za-km-z]+$/.test(trimmed)) {
    secret = decodeBase58(trimmed);
  } else {
    secret = Uint8Array.from(Buffer.from(trimmed, 'base64'));
  }
  if (secret.length !== 64) {
    throw new Error(`Treasury keypair must be 64 bytes; got ${secret.length}`);
  }
  return Keypair.fromSecretKey(secret);
}

async function main(): Promise<void> {
  // ── Env validation ───────────────────────────────────────────────────────────
  const required = [
    'DATABASE_URL',
    'REDIS_URL',
    'PRIVY_APP_ID',
    'PRIVY_APP_SECRET',
    'SOLANA_RPC_URL',
    'TREASURY_PRIVATE_KEY',
    'NETWORK',
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.error({ missing }, 'Missing required environment variables');
    process.exit(1);
  }

  // ── Trading mode ─────────────────────────────────────────────────────────────
  let tradingMode: TradingMode;
  try {
    tradingMode = resolveTradingMode(process.env);
  } catch (err) {
    logger.error({ err }, 'Invalid TRADING_MODE configuration');
    process.exit(1);
  }
  logger.info({ tradingMode }, 'Trading mode configured');

  const redisDependencyMode = resolveRedisDependencyMode(process.env);
  const requireTradeIdempotencyKey = resolveRequireTradeIdempotencyKey(process.env);
  const workerLeaderElection = resolveWorkerLeaderElection(process.env);
  logger.info(
    { redisDependencyMode, requireTradeIdempotencyKey, workerLeaderElection },
    'Trading hardening configuration',
  );

  if (tradingMode === 'onchain') {
    try {
      resolveMnemonicEncryptionKey(process.env);
    } catch (err) {
      logger.error({ err }, 'On-chain mode requires MNEMONIC_ENCRYPTION_KEY');
      process.exit(1);
    }
  }

  const redisUrl         = process.env['REDIS_URL']!;
  const privyAppId       = process.env['PRIVY_APP_ID']!;
  const privySecret      = process.env['PRIVY_APP_SECRET']!;
  const solanaRpcUrls    = process.env['SOLANA_RPC_URL']!.split(',').map((u) => u.trim()).filter(Boolean);
  const network          = (process.env['NETWORK'] ?? 'devnet') as 'devnet' | 'mainnet';
  const monitoringPort   = Number(process.env['MONITORING_PORT'] ?? 9090);
  const startedAt        = Date.now();

  // Graduation-specific on-chain accounts (optional — graduation won't start if absent).
  const ammConfigRaw     = process.env['RAYDIUM_AMM_CONFIG'];
  const createPoolFeeRaw = process.env['RAYDIUM_CREATE_POOL_FEE'];

  // ── Treasury keypair ─────────────────────────────────────────────────────────
  let treasuryKeypair: Keypair;
  try {
    treasuryKeypair = loadTreasuryKeypair(process.env['TREASURY_PRIVATE_KEY']!);
  } catch (err) {
    logger.error({ err }, 'Failed to load treasury keypair — check TREASURY_PRIVATE_KEY');
    process.exit(1);
  }
  const treasurySecretKey = treasuryKeypair.secretKey;

  // ── Redis ────────────────────────────────────────────────────────────────────
  const redis = createRedisClient({ url: redisUrl, logger, name: 'trading' });
  await redis.connect();

  // ── Database ─────────────────────────────────────────────────────────────────
  const db = createDatabaseClient({ url: process.env['DATABASE_URL']! });
  await db.$connect();
  logger.info('Database connected');

  // ── Privy ────────────────────────────────────────────────────────────────────
  const { PrivyClient } = await import('@privy-io/server-auth');
  const privy = new PrivyClient(privyAppId, privySecret);

  // ── RPC pool ─────────────────────────────────────────────────────────────────
  const healthManager = new RpcHealthManager(
    solanaRpcUrls.map((url, idx) => ({
      url,
      label:    `rpc-${idx}`,
      priority: idx,
    })),
    probeEndpoint,
    logger,
  );
  healthManager.start();

  const pool = new ConnectionPool(healthManager, logger);

  // ── Solana infrastructure ─────────────────────────────────────────────────────
  const blockhashCache  = new BlockhashCache(pool, logger);
  const feeEstimator    = new PriorityFeeEstimator(pool, logger);
  const txSender        = new TxSender(pool, logger);
  const txBuilder       = new TransactionBuilder(pool, logger);
  blockhashCache.start();

  // ── Anchor program ────────────────────────────────────────────────────────────
  const program = createFunrunProgram(network);

  // ── Tx lifecycle ──────────────────────────────────────────────────────────────
  const txStore   = new TxStore(db);
  const machine   = new TxStateMachine(txStore);
  const confirmer = new TxConfirmer(pool, txStore, machine, logger);

  // ── Metrics ───────────────────────────────────────────────────────────────────
  const metricsRegistry = new MetricsRegistry();
  const metrics         = new TradingMetrics(metricsRegistry);

  // ── Background workers (H-22 leader election) ─────────────────────────────────
  const reconciler = new TxReconciler(db, pool, machine, logger);
  let graduationCrank: GraduationCrank | null = null;
  const workerStops = new Map<string, () => void>([
    ['tx-confirmer', () => confirmer.stop()],
    ['tx-reconciler', () => reconciler.stop()],
  ]);

  let leaderLock: WorkerLeaderLock | null = null;
  if (workerLeaderElection) {
    leaderLock = new WorkerLeaderLock(redis, logger);
    leaderLock.supervise('tx-confirmer', () => confirmer.start(), () => confirmer.stop());
    leaderLock.supervise('tx-reconciler', () => reconciler.start(), () => reconciler.stop());
    logger.info('Background workers supervised via Redis leader election');
  } else {
    confirmer.start();
    reconciler.start();
    logger.warn('WORKER_LEADER_ELECTION=false — all workers run on this pod');
  }

  // Graduation crank — only starts if Raydium AMM accounts are configured.
  if (ammConfigRaw && createPoolFeeRaw) {
    const graduationExecutor = new GraduationExecutor(
      {
        treasurySecretKey,
        ammConfig:     new PublicKey(ammConfigRaw),
        createPoolFee: new PublicKey(createPoolFeeRaw),
      },
      blockhashCache,
      feeEstimator,
      txBuilder,
      txSender,
      txStore,
      machine,
      confirmer,
      program,
      logger,
    );

    graduationCrank = new GraduationCrank(db, machine, graduationExecutor, logger);
    workerStops.set('graduation-crank', () => graduationCrank?.stop());

    if (leaderLock) {
      leaderLock.supervise(
        'graduation-crank',
        () => graduationCrank!.start(),
        () => graduationCrank!.stop(),
      );
    } else {
      graduationCrank.start();
    }
    logger.info({ ammConfig: ammConfigRaw }, 'GraduationCrank configured');
  } else {
    logger.warn(
      'RAYDIUM_AMM_CONFIG or RAYDIUM_CREATE_POOL_FEE not set — GraduationCrank will NOT run',
    );
  }

  // ── Monitoring ────────────────────────────────────────────────────────────────
  // Use the first configured RPC URL to build the Connection for HealthChecker.
  const healthConn   = new Connection(solanaRpcUrls[0]!, { commitment: 'confirmed' });
  const healthChecker = new HealthChecker(db, healthConn, logger, startedAt);
  const dbCollector  = new DbCollector(db, metrics, logger, {}, startedAt);
  const monitoringServer = new MonitoringServer(metricsRegistry, healthChecker, logger, {
    port: monitoringPort,
  });

  dbCollector.start();
  monitoringServer.start();
  logger.info({ port: monitoringPort }, 'Monitoring server started');

  // ── HTTP server (trade routes, auth, idempotency) ─────────────────────────────
  const ipGuard      = new IpGuard(redis, logger, redisDependencyMode);
  const authVerifier = new TradingAuthVerifier(privy, db, ipGuard, logger);
  const publisher    = new TradeEventPublisher(redis, logger);
  const tradeLogger  = new TradeLogger(logger);
  const idempotency  = new IdempotencyStore(redis, logger, redisDependencyMode);
  const offchain     = new TradeExecutor(db, publisher, tradeLogger, logger);

  const buyExecutor  = new BuyExecutor(
    blockhashCache,
    feeEstimator,
    txBuilder,
    txSender,
    txStore,
    machine,
    confirmer,
    program,
    logger,
  );
  const sellExecutor = new SellExecutor(
    blockhashCache,
    feeEstimator,
    txBuilder,
    txSender,
    txStore,
    machine,
    confirmer,
    program,
    logger,
  );

  const createCoinExecutor = new CreateCoinExecutor(
    blockhashCache,
    feeEstimator,
    txBuilder,
    txSender,
    txStore,
    machine,
    confirmer,
    program,
    logger,
  );

  const mnemonicKey = tradingMode === 'onchain' ? resolveMnemonicEncryptionKey(process.env) : '';
  const createCoinOrchestrator =
    tradingMode === 'onchain'
      ? new CreateCoinOrchestrator(
          db,
          createCoinExecutor,
          mnemonicKey,
          logger,
          pool.getConnection(),
          treasuryKeypair,
        )
      : null;

  const depositScanner = new DepositScanner(
    db,
    pool.getConnection(),
    logger,
    mnemonicKey,
  );
  depositScanner.start();
  workerStops.set('deposit-scanner', () => depositScanner.stop());

  const onchain = new OnChainTradeOrchestrator(
    db,
    buyExecutor,
    sellExecutor,
    mnemonicKey,
    logger,
    pool.getConnection(),
    treasuryKeypair,
  );
  const tradeRouter = new TradeRouter(tradingMode, offchain, onchain, logger);

  const server = buildTradingServer({
    db,
    redis,
    tradeRouter,
    idempotency,
    tradeLogger,
    logger,
    verifyToken: (token, ip) => authVerifier.verify(token, ip),
    healthChecker,
    redisDependencyMode,
    requireTradeIdempotencyKey,
    pool,
    createCoinOrchestrator,
    treasuryKeypair,
    mnemonicEncryptionKey: mnemonicKey,
    withdrawalsEnabled: process.env['WITHDRAWALS_ENABLED'] !== '0',
  });

  await server.start();
  logger.info('Trading service ready');

  // ── Graceful shutdown ─────────────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutdown signal received');

    await server.stop();

    if (leaderLock) {
      await leaderLock.shutdown(workerStops);
    } else {
      confirmer.stop();
      reconciler.stop();
      graduationCrank?.stop();
    }
    depositScanner.stop();
    healthManager.stop();
    blockhashCache.stop();
    dbCollector.stop();

    await db.$disconnect();
    await redis.quit();

    logger.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('SIGINT',  () => { void shutdown('SIGINT');  });

  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
    process.exit(1);
  });
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
