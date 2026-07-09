import type { FastifyInstance } from 'fastify';
import type { TradeExecutor } from '../trading/executor.js';
import type { TradeLogger } from '../logger/trade.logger.js';
import type { IdempotencyStore } from '../idempotency/store.js';
import type { QuoteCache } from '../quote/cache.js';
import { quoteBuy, quoteSell } from '../amm/calculator.js';
import { getIdempotencyKey } from '../middleware/idempotency.js';
import {
  BuyBodySchema,
  SellBodySchema,
  QuoteQuerySchema,
} from '../validation/trade.schema.js';
import type { QuoteResult } from '../types.js';
import type { PrismaClient } from '@funrun/database';
import { QUOTE_CACHE_TTL_MS } from '../constants.js';

export function registerTradeRoutes(
  app: FastifyInstance,
  deps: {
    db: PrismaClient;
    executor: TradeExecutor;
    idempotency: IdempotencyStore;
    tradeLogger: TradeLogger;
    quoteCache: QuoteCache;
  },
): void {
  const { db, executor, idempotency, tradeLogger, quoteCache } = deps;

  // ── POST /trade/buy ──────────────────────────────────────────────────────────
  app.post('/trade/buy', async (request, reply) => {
    const start = Date.now();
    const { requestId } = request;
    const { walletAddress } = request.auth;

    const parsed = BuyBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: parsed.error.errors[0]?.message ?? 'Invalid request body',
        details: parsed.error.errors,
      });
    }

    const req = {
      coinId: parsed.data.coinId,
      solAmountLamports: parsed.data.solAmountLamports,
      minTokensOut: parsed.data.minTokensOut,
      slippageBps: parsed.data.slippageBps,
    };
    const ctx = { requestId, walletAddress, startedAt: start };

    try {
      const result = await executor.buy(req, ctx);

      const body = {
        txId: result.txId,
        coinId: result.coinId,
        tradeType: result.tradeType,
        solAmount: result.solAmount.toString(),
        tokenAmount: result.tokenAmount.toString(),
        pricePerToken: result.pricePerToken,
        priceImpactBps: result.priceImpactBps,
        fees: {
          totalFee: result.fees.totalFee.toString(),
          creatorFee: result.fees.creatorFee.toString(),
          referrerFee: result.fees.referrerFee.toString(),
          treasuryFee: result.fees.treasuryFee.toString(),
        },
        virtualSolAfter: result.virtualSolAfter.toString(),
        virtualTokensAfter: result.virtualTokensAfter.toString(),
        graduated: result.graduated,
        requestId,
      };

      const idempotencyKey = getIdempotencyKey(request);
      if (idempotencyKey) {
        await idempotency.set(idempotencyKey, { status: 200, body, cachedAt: new Date().toISOString() });
      }

      return reply.code(200).send(body);
    } catch (err: unknown) {
      return handleTradeError(err, reply, requestId);
    }
  });

  // ── POST /trade/sell ─────────────────────────────────────────────────────────
  app.post('/trade/sell', async (request, reply) => {
    const start = Date.now();
    const { requestId } = request;
    const { walletAddress } = request.auth;

    const parsed = SellBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: parsed.error.errors[0]?.message ?? 'Invalid request body',
        details: parsed.error.errors,
      });
    }

    const req = {
      coinId: parsed.data.coinId,
      tokenAmountRaw: parsed.data.tokenAmountRaw,
      minSolOut: parsed.data.minSolOut,
      slippageBps: parsed.data.slippageBps,
      maxPriceImpactBps: parsed.data.maxPriceImpactBps,
    };
    const ctx = { requestId, walletAddress, startedAt: start };

    try {
      const result = await executor.sell(req, ctx);

      const body = {
        txId: result.txId,
        coinId: result.coinId,
        tradeType: result.tradeType,
        solAmount: result.solAmount.toString(),
        tokenAmount: result.tokenAmount.toString(),
        pricePerToken: result.pricePerToken,
        priceImpactBps: result.priceImpactBps,
        fees: {
          totalFee: result.fees.totalFee.toString(),
          creatorFee: result.fees.creatorFee.toString(),
          referrerFee: result.fees.referrerFee.toString(),
          treasuryFee: result.fees.treasuryFee.toString(),
        },
        virtualSolAfter: result.virtualSolAfter.toString(),
        virtualTokensAfter: result.virtualTokensAfter.toString(),
        remainingTokenBalance: result.remainingTokenBalance.toString(),
        graduated: false,
        requestId,
      };

      const idempotencyKey = getIdempotencyKey(request);
      if (idempotencyKey) {
        await idempotency.set(idempotencyKey, { status: 200, body, cachedAt: new Date().toISOString() });
      }

      return reply.code(200).send(body);
    } catch (err: unknown) {
      return handleTradeError(err, reply, requestId);
    }
  });

  // ── GET /trade/quote ─────────────────────────────────────────────────────────
  // Public endpoint — no auth required. Results are cached in Redis for
  // QUOTE_CACHE_TTL_MS (3 s) keyed on (coinId, direction, amountIn).
  // slippageBps is NOT part of the cache key — minReceived is derived at
  // response time from the cached amountOut so the cache remains shared.
  app.get('/trade/quote', async (request, reply) => {
    const start = Date.now();
    const { requestId } = request;

    const parsed = QuoteQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: parsed.error.errors[0]?.message ?? 'Invalid query parameters',
        details: parsed.error.errors,
      });
    }

    const { coinId, direction, amountIn, slippageBps } = parsed.data;

    try {
      // ── 1. Cache read ───────────────────────────────────────────────────────
      let cached = await quoteCache.get(coinId, direction, amountIn);

      if (!cached) {
        // ── 2. DB fetch (cache miss) ──────────────────────────────────────────
        const coin = await db.coin.findUniqueOrThrow({
          where: { id: coinId },
          select: {
            virtualSolReserves: true,
            virtualTokenReserves: true,
            status: true,
          },
        });

        if (coin.status === 'GRADUATED') {
          return reply.code(422).send({
            error: 'COIN_GRADUATED',
            message: 'Coin has graduated — trade on Raydium',
            requestId,
          });
        }

        const vSol = BigInt(coin.virtualSolReserves.toString());
        const vTokens = BigInt(coin.virtualTokenReserves.toString());

        let amountOut: bigint;
        let pricePerToken: number;
        let priceImpactBps: number;
        let feeAmount: bigint;
        let effectivePrice: number;
        let newVirtualSol: bigint;
        let newVirtualTokens: bigint;

        if (direction === 'buy') {
          const q = quoteBuy(amountIn, vSol, vTokens);
          amountOut = q.tokensOut;
          pricePerToken = q.pricePerToken;
          priceImpactBps = q.priceImpactBps;
          feeAmount = q.feeTotal;
          // Effective price: lamports of SOL spent per token received (includes fee)
          effectivePrice = amountOut > 0n ? Number(amountIn) / Number(amountOut) : 0;
          newVirtualSol = q.newVirtualSol;
          newVirtualTokens = q.newVirtualTokens;
        } else {
          const q = quoteSell(amountIn, vSol, vTokens);
          amountOut = q.solOut;
          pricePerToken = q.pricePerToken;
          priceImpactBps = q.priceImpactBps;
          feeAmount = q.feeTotal;
          // Effective price: lamports of SOL received per token sold (net of fee)
          effectivePrice = amountIn > 0n ? Number(amountOut) / Number(amountIn) : 0;
          newVirtualSol = q.newVirtualSol;
          newVirtualTokens = q.newVirtualTokens;
        }

        cached = {
          coinId,
          direction,
          amountIn: amountIn.toString(),
          amountOut: amountOut.toString(),
          pricePerToken,
          priceImpactBps,
          feeAmount: feeAmount.toString(),
          effectivePrice,
          virtualSolAfter: newVirtualSol.toString(),
          virtualTokensAfter: newVirtualTokens.toString(),
          cachedAt: start,
        };

        // ── 3. Cache write (best-effort) ──────────────────────────────────────
        await quoteCache.set(cached);
      }

      // ── 4. Derive slippage-dependent fields from (possibly cached) result ───
      const amountOut = BigInt(cached.amountOut);
      const minReceived = amountOut - (amountOut * BigInt(slippageBps)) / 10_000n;
      const expiresAt = new Date(cached.cachedAt + QUOTE_CACHE_TTL_MS).toISOString();

      const latencyMs = Date.now() - start;
      tradeLogger.quote({ requestId, coinId, direction, amountIn, latencyMs });

      return reply.code(200).send({
        coinId: cached.coinId,
        direction: cached.direction,
        amountIn: cached.amountIn,
        amountOut: cached.amountOut,
        pricePerToken: cached.pricePerToken,
        priceImpactBps: cached.priceImpactBps,
        feeAmount: cached.feeAmount,
        effectivePrice: cached.effectivePrice,
        minReceived: minReceived.toString(),
        expiresAt,
        virtualSolAfter: cached.virtualSolAfter,
        virtualTokensAfter: cached.virtualTokensAfter,
        requestId,
      });
    } catch (err: unknown) {
      return handleTradeError(err, reply, requestId);
    }
  });
}

const KNOWN_ERROR_CODES: Record<string, number> = {
  SLIPPAGE_EXCEEDED:      422,
  PRICE_IMPACT_EXCEEDED:  422,
  COIN_GRADUATED:         422,
  COIN_PAUSED:            422,
  INSUFFICIENT_BALANCE:   422,
  NOT_FOUND:              404,
  P2025:                  404, // Prisma: record not found (findUniqueOrThrow)
};

function handleTradeError(
  err: unknown,
  reply: Parameters<Parameters<FastifyInstance['post']>[1]>[1],
  requestId: string,
): ReturnType<typeof reply.send> {
  const code = (err as { code?: string }).code;
  const status = (code && KNOWN_ERROR_CODES[code]) ? KNOWN_ERROR_CODES[code]! : 500;

  // Only expose the actual error message for known business-logic errors.
  // For 500s and Prisma internals (P2025), return a clean message.
  const isPrismaCode = code?.startsWith('P') && /^P\d{4}$/.test(code ?? '');
  const message =
    status !== 500 && !isPrismaCode && err instanceof Error
      ? err.message
      : status === 404
        ? 'The requested resource was not found.'
        : 'An internal error occurred. Please try again.';

  return reply.code(status).send({
    error: code ?? 'INTERNAL_ERROR',
    message,
    requestId,
  });
}
