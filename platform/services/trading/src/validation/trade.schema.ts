import { z } from 'zod';

const bigintFromString = z
  .string()
  .regex(/^\d+$/, 'Must be a non-negative integer string')
  .transform((v) => BigInt(v));

const bigintDirect = z.bigint().nonnegative();

const bigintField = z.union([bigintFromString, bigintDirect]);

// ─── Buy ──────────────────────────────────────────────────────────────────────

export const BuyBodySchema = z.object({
  coinId: z.string().min(1).max(50),
  solAmountLamports: bigintField.refine((v) => v > 0n, { message: 'solAmountLamports must be greater than 0' }),
  minTokensOut: bigintField,
  slippageBps: z.number().int().min(0).max(5_000).default(100),
});

export type BuyBody = z.infer<typeof BuyBodySchema>;

// ─── Sell ─────────────────────────────────────────────────────────────────────

export const SellBodySchema = z.object({
  coinId: z.string().min(1).max(50),
  tokenAmountRaw: bigintField.refine((v) => v > 0n, { message: 'tokenAmountRaw must be greater than 0' }),
  minSolOut: bigintField,
  slippageBps: z.number().int().min(0).max(5_000).default(100),
  // Optional: reject the sell if computed price impact exceeds this threshold (basis points).
  // Protects against accidentally selling a large position and moving the market.
  maxPriceImpactBps: z.number().int().min(0).max(10_000).optional(),
});

export type SellBody = z.infer<typeof SellBodySchema>;

// ─── Quote ────────────────────────────────────────────────────────────────────

export const QuoteQuerySchema = z.object({
  coinId: z.string().min(1).max(50),
  direction: z.enum(['buy', 'sell']),
  amountIn: bigintFromString.refine((v) => v > 0n, { message: 'amountIn must be greater than 0' }),
  // Optional slippage for minReceived calculation; does NOT affect the cache key.
  slippageBps: z.coerce.number().int().min(0).max(5_000).default(100),
});

export type QuoteQuery = z.infer<typeof QuoteQuerySchema>;

// ─── Idempotency key ──────────────────────────────────────────────────────────

export const IdempotencyKeySchema = z
  .string()
  .min(8, 'Idempotency-Key must be at least 8 characters')
  .max(128, 'Idempotency-Key must be at most 128 characters');
