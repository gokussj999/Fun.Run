import type { FastifyInstance, FastifyReply } from 'fastify';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';
import type { ConnectionPool } from '../solana/connection-pool.js';
import type {
  CreateCoinOrchestrator,
  CreateCoinRequest,
} from '../trading/create-coin-orchestrator.js';
import { CreateCoinBodySchema } from '../validation/create-coin.schema.js';
import { getIdempotencyKey } from '../middleware/idempotency.js';
import {
  mapCoinToApi,
  mapCandleToApi,
  mapHoldingRow,
  mapProfileToApi,
  mapTxRow,
} from '../lib/coin-mapper.js';
import { profileWalletScope } from '@funrun/shared';
import { ensureProfileBootstrap } from '../wallet/profile-bootstrap.js';
import {
  ensureCustodialWalletProvisioned,
  resolveCustodialDepositAddress,
} from '../wallet/custodial-wallet.js';

const TF_MAP: Record<string, 'm1' | 'm5' | 'm15' | 'h1' | 'h4' | 'd1'> = {
  '1m': 'm1', '5m': 'm5', '15m': 'm15', '1h': 'h1', '4h': 'h4', '1d': 'd1',
};

let cachedSolPrice = 80;
let cachedSolPriceAt = 0;

async function fetchSolPriceUsd(): Promise<number> {
  if (Date.now() - cachedSolPriceAt < 45_000) return cachedSolPrice;
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      { signal: AbortSignal.timeout(5000) },
    );
    const json = (await res.json()) as { solana?: { usd?: number } };
    const p = json?.solana?.usd;
    if (p && p > 0) {
      cachedSolPrice = p;
      cachedSolPriceAt = Date.now();
    }
  } catch {
    /* keep cache */
  }
  return cachedSolPrice;
}

function handleRouteError(err: unknown, reply: FastifyReply, requestId: string) {
  const code = (err as { code?: string }).code;
  const status =
    code === 'NOT_FOUND' ? 404 :
    code === 'ACCOUNT_BANNED' ? 403 :
    code === 'IDEMPOTENCY_CONFLICT' ? 409 :
    code === 'VALIDATION_ERROR' ? 400 : 500;
  const message = err instanceof Error ? err.message : 'Internal error';
  return reply.code(status).send({ error: code ?? 'INTERNAL_ERROR', message, requestId });
}

export function registerPlatformRoutes(
  app: FastifyInstance,
  deps: {
    db: PrismaClient;
    pool: ConnectionPool;
    createCoinOrchestrator: CreateCoinOrchestrator | null;
    treasuryKeypair: Keypair;
    logger: Logger;
    mnemonicEncryptionKey?: string;
    withdrawalsEnabled?: boolean;
  },
): void {
  const { db, pool, createCoinOrchestrator, treasuryKeypair, logger } = deps;
  const mnemonicEncryptionKey = deps.mnemonicEncryptionKey?.trim() ?? '';
  const withdrawalsEnabled = deps.withdrawalsEnabled !== false;

  // ── Market (public) ────────────────────────────────────────────────────────
  app.get('/market/sol-price', { config: { skipAuth: true } }, async (_req, reply) => {
    const price = await fetchSolPriceUsd();
    return reply.send({ ok: true, price });
  });

  app.get('/market/coins', { config: { skipAuth: true } }, async (req, reply) => {
    const q = req.query as { page?: string; limit?: string };
    const page = Math.min(500, Math.max(0, Number(q.page ?? 0)));
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 50)));
    const coins = await db.coin.findMany({
      orderBy: { createdAt: 'desc' },
      skip: page * limit,
      take: limit,
    });
    return reply.send({
      ok: true,
      coins: coins.map((c) => mapCoinToApi(c)),
      page,
      limit,
      hasMore: coins.length >= limit,
      hot15m: [],
    });
  });

  app.get('/market/coins/:id', { config: { skipAuth: true } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const coin = await db.coin.findUnique({ where: { id } });
    if (!coin) return reply.code(404).send({ ok: false, error: 'Coin not found' });
    return reply.send({ ok: true, coin: mapCoinToApi(coin) });
  });

  app.get('/market/coins/:id/candles', { config: { skipAuth: true } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const q = req.query as { tf?: string; limit?: string };
    const tfRaw = String(q.tf ?? '5m').toLowerCase();
    const tf = TF_MAP[tfRaw] ?? 'm5';
    const limit = Math.min(300, Math.max(10, Number(q.limit ?? 120)));
    const candles = await db.candle.findMany({
      where: { coinId: id, timeframe: tf },
      orderBy: { openTime: 'desc' },
      take: limit,
    });
    return reply.send({
      ok: true,
      candles: candles.reverse().map(mapCandleToApi),
      tf: tfRaw,
    });
  });

  // ── Profile ────────────────────────────────────────────────────────────────
  app.get('/profile/:wallet', async (request, reply) => {
    const { wallet } = request.params as { wallet: string };
    let profile = await db.profile.findUnique({ where: { walletAddress: wallet } });
    if (!profile) {
      profile = await ensureProfileBootstrap(db, wallet);
    }
    if (!profile) return reply.code(404).send({ ok: false, error: 'Profile not found' });

    if (mnemonicEncryptionKey) {
      profile = (await ensureCustodialWalletProvisioned(db, wallet, mnemonicEncryptionKey))
        ?? profile;
    }

    const custodialWallet =
      (mnemonicEncryptionKey
        ? resolveCustodialDepositAddress(profile, mnemonicEncryptionKey)
        : null)
      ?? profile.walletAddress;

    const walletScope = profileWalletScope(wallet, custodialWallet);

    const [referralCount, creations, txs, holdingRows, deposits, withdrawals] =
      await Promise.all([
        db.profile.count({ where: { referrerWallet: wallet } }),
        db.coin.findMany({
          where: { creatorWallet: { in: walletScope } },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
        db.transaction.findMany({
          where: { walletAddress: { in: walletScope } },
          orderBy: { confirmedAt: 'desc' },
          take: 50,
        }),
        db.holding.findMany({
          where: { walletAddress: { in: walletScope } },
          include: { coin: true },
          orderBy: { updatedAt: 'desc' },
          take: 200,
        }),
        db.deposit.findMany({ where: { walletAddress: wallet }, orderBy: { createdAt: 'desc' }, take: 50 }),
        db.withdrawal.findMany({ where: { walletAddress: wallet }, orderBy: { createdAt: 'desc' }, take: 50 }),
      ]);

    const holdings = holdingRows.map(mapHoldingRow).filter(Boolean);
    const mappedCreations = creations.map((c) => mapCoinToApi(c));

    return reply.send({
      ok: true,
      profile: mapProfileToApi(wallet, profile, {
        holdings: holdings as Array<Record<string, unknown>>,
        creations: mappedCreations,
        txs: txs.map(mapTxRow),
        referralCount,
        custodialWallet,
        deposits: deposits.map((d) => ({
          id: d.id,
          wallet: d.walletAddress,
          tx_hash: d.txSignature,
          amount: Number(d.amountSol.toString()),
          status: d.status,
          created_at: d.createdAt.toISOString(),
        })),
        withdrawals: withdrawals.map((w) => ({
          id: w.id,
          wallet: w.walletAddress,
          destination: w.destination,
          amount: Number(w.amountSol.toString()),
          tx_hash: w.txSignature,
          status: w.status,
          created_at: w.createdAt.toISOString(),
        })),
      }),
      myCreations: mappedCreations,
      lastTx: txs.map(mapTxRow),
    });
  });

  app.get('/wallet/:wallet/balance', { config: { skipAuth: true } }, async (req, reply) => {
    const { wallet } = req.params as { wallet: string };
    const profile = await db.profile.findUnique({
      where: { walletAddress: wallet },
      select: { runBalanceSol: true },
    });
    const sol = profile ? Number(profile.runBalanceSol.toString()) : 0;
    return reply.send({ ok: true, sol });
  });

  // ── Create coin ────────────────────────────────────────────────────────────
  app.post('/coins', async (request, reply) => {
    if (!createCoinOrchestrator) {
      return reply.code(503).send({ error: 'CREATE_DISABLED', message: 'On-chain create not configured' });
    }
    const parsed = CreateCoinBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: parsed.error.errors[0]?.message ?? 'Invalid body',
      });
    }
    const start = Date.now();
    const ctx = {
      requestId: request.requestId,
      walletAddress: request.auth.walletAddress,
      startedAt: start,
    };
    try {
      const { name, symbol, story, logo, metadataUri } = parsed.data;
      const createReq: CreateCoinRequest = { name, symbol };
      if (story !== undefined) createReq.story = story;
      if (logo !== undefined) createReq.logo = logo;
      if (metadataUri !== undefined) createReq.metadataUri = metadataUri;
      const result = await createCoinOrchestrator.create(
        createReq,
        ctx,
        getIdempotencyKey(request),
      );
      return reply.code(200).send({
        ok: true,
        mode: 'onchain',
        signature: result.signature,
        mintAddress: result.mintAddress,
        status: result.status,
        txId: result.txId,
        requestId: request.requestId,
      });
    } catch (err) {
      return handleRouteError(err, reply, request.requestId);
    }
  });

  // ── Withdraw ───────────────────────────────────────────────────────────────
  app.post('/wallet/withdraw', async (request, reply) => {
    if (!withdrawalsEnabled) {
      return reply.code(503).send({ ok: false, error: 'Withdrawals temporarily disabled' });
    }
    const body = request.body as {
      wallet?: string;
      destination?: string;
      amount?: number;
      idempotencyKey?: string;
    };
    const wallet = request.auth.walletAddress;
    const destination = String(body.destination ?? '').trim();
    const rawAmount = Number(body.amount ?? 0);
    const amount = Number.isFinite(rawAmount) ? Math.max(0, rawAmount) : 0;
    const idempotencyKey = String(body.idempotencyKey ?? getIdempotencyKey(request) ?? '').trim() || null;

    if (!destination) return reply.code(400).send({ ok: false, error: 'destination required' });
    if (!Number.isFinite(amount) || amount <= 0) return reply.code(400).send({ ok: false, error: 'invalid amount' });

    if (idempotencyKey) {
      const existing = await db.withdrawal.findUnique({ where: { idempotencyKey } });
      if (existing?.status === 'confirmed') {
        return reply.send({ ok: true, txHash: existing.txSignature, idempotent: true });
      }
      if (existing?.status === 'pending') {
        return reply.code(409).send({ ok: false, error: 'Withdrawal already in progress' });
      }
    }

    let destPub: PublicKey;
    try {
      destPub = new PublicKey(destination);
    } catch {
      return reply.code(400).send({ ok: false, error: 'invalid destination address' });
    }

    let withdrawalId: string;
    try {
      withdrawalId = await db.$transaction(async (tx) => {
        const p = await tx.profile.findUniqueOrThrow({ where: { walletAddress: wallet } });
        const bal = Number(p.runBalanceSol.toString());
        if (bal < amount) throw new Error('Insufficient balance');
        // Optimistic concurrency: only decrement if balance hasn't dropped since read
        const updated = await tx.profile.updateMany({
          where: { walletAddress: wallet, runBalanceSol: { gte: amount } },
          data: { runBalanceSol: { decrement: amount } },
        });
        if (updated.count === 0) throw new Error('Insufficient balance');
        const wd = await tx.withdrawal.create({
          data: {
            walletAddress: wallet,
            destination,
            amountSol: amount.toFixed(9),
            status: 'pending',
            ...(idempotencyKey ? { idempotencyKey } : {}),
          },
        });
        return wd.id;
      });
    } catch (e) {
      return reply.code(400).send({ ok: false, error: (e as Error).message || 'Insufficient balance' });
    }

    try {
      const conn = pool.getConnection();
      const lamports = Math.floor(amount * 1_000_000_000);
      const solanaTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: treasuryKeypair.publicKey,
          toPubkey: destPub,
          lamports,
        }),
      );
      const signature = await sendAndConfirmTransaction(conn, solanaTx, [treasuryKeypair]);
      await db.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: 'confirmed', txSignature: signature },
      });
      return reply.send({ ok: true, txHash: signature });
    } catch (err) {
      await db.$transaction(async (tx) => {
        await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: 'failed' },
        });
        await tx.profile.update({
          where: { walletAddress: wallet },
          data: { runBalanceSol: { increment: amount } },
        });
      });
      logger.error({ err, withdrawalId }, 'Withdraw failed — balance restored');
      return reply.code(500).send({ ok: false, error: 'Withdraw failed' });
    }
  });

  // ── Rewards claim ──────────────────────────────────────────────────────────
  app.post('/rewards/claim', async (request, reply) => {
    const body = request.body as { kind?: string };
    const wallet = request.auth.walletAddress;
    const kind = String(body.kind ?? '').trim().toUpperCase();
    const field =
      kind === 'CREATOR' ? 'creatorRewardsSol' :
      kind === 'REF' || kind === 'REFERRAL' ? 'referralRewardsSol' :
      kind === 'OWNER' ? 'ownerRewardsSol' : null;
    if (!field) return reply.code(400).send({ error: 'Unsupported kind' });

    const amount = await db.$transaction(async (tx) => {
      const p = await tx.profile.findUniqueOrThrow({ where: { walletAddress: wallet } });
      const reward = Number(p[field].toString());
      if (reward <= 0) return 0;
      // Optimistic concurrency: only claim if field still matches what we read
      const updated = await tx.profile.updateMany({
        where: { walletAddress: wallet, [field]: p[field] },
        data: { [field]: 0, runBalanceSol: { increment: reward } },
      });
      return updated.count > 0 ? reward : 0;
    });

    return reply.send({ ok: true, amount });
  });

  // ── Referral bind ──────────────────────────────────────────────────────────
  app.post('/referral/bind', async (request, reply) => {
    const body = request.body as { referrer?: string };
    const wallet = request.auth.walletAddress;
    const referrer = String(body.referrer ?? '').trim();
    if (!referrer || referrer === wallet) {
      return reply.code(400).send({ ok: false, error: 'invalid referrer' });
    }
    try {
      new PublicKey(referrer);
    } catch {
      return reply.code(400).send({ ok: false, error: 'invalid referrer address' });
    }
    // Atomic: only write if referrerWallet is still null (prevents TOCTOU race)
    const updated = await db.profile.updateMany({
      where: { walletAddress: wallet, referrerWallet: null },
      data: { referrerWallet: referrer },
    });
    return reply.send({ ok: true, alreadySet: updated.count === 0 });
  });

  // ── Mnemonic reveal (disabled — security) ──────────────────────────────────
  app.post('/wallet/reveal-mnemonic', async (_request, reply) => {
    return reply.code(501).send({
      ok: false,
      error: 'Mnemonic export requires additional ownership verification',
    });
  });
}
