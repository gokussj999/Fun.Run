import type { Lamports, TokenUnits } from '../types/index.js';

import { LAMPORTS_PER_SOL, TOKEN_DECIMALS } from '../constants/index.js';

// ─── Numeric conversions ──────────────────────────────────────────────────────

export function lamportsToSol(lamports: Lamports): number {
  return Number(lamports) / Number(LAMPORTS_PER_SOL);
}

export function solToLamports(sol: number): Lamports {
  return BigInt(Math.round(sol * Number(LAMPORTS_PER_SOL)));
}

export function rawToTokens(raw: TokenUnits): number {
  return Number(raw) / 10 ** TOKEN_DECIMALS;
}

export function tokensToRaw(tokens: number): TokenUnits {
  return BigInt(Math.round(tokens * 10 ** TOKEN_DECIMALS));
}

// ─── AMM math (mirrors math.rs — JS bigint edition) ──────────────────────────

export function computeTokensOut(
  solIn: Lamports,
  virtualSolReserves: Lamports,
  virtualTokenReserves: TokenUnits,
  feeBps: number,
): { tokensOut: TokenUnits; feeTotal: Lamports; solNet: Lamports } {
  const feeDenom = BigInt(10_000);
  const feeTotal = (solIn * BigInt(feeBps)) / feeDenom;
  const solNet = solIn - feeTotal;

  const k = virtualSolReserves * virtualTokenReserves;
  const newVSol = virtualSolReserves + solNet;
  const newVTokens = k / newVSol;
  const tokensOut = virtualTokenReserves - newVTokens;

  return { tokensOut, feeTotal, solNet };
}

export function computeSolOut(
  tokensIn: TokenUnits,
  virtualSolReserves: Lamports,
  virtualTokenReserves: TokenUnits,
  feeBps: number,
): { solOut: Lamports; feeTotal: Lamports; solGross: Lamports } {
  const k = virtualSolReserves * virtualTokenReserves;
  const newVTokens = virtualTokenReserves + tokensIn;
  const newVSol = k / newVTokens;
  const solGross = virtualSolReserves - newVSol;

  const feeDenom = BigInt(10_000);
  const feeTotal = (solGross * BigInt(feeBps)) / feeDenom;
  const solOut = solGross - feeTotal;

  return { solOut, feeTotal, solGross };
}

// ─── Price ────────────────────────────────────────────────────────────────────

export function computePrice(
  virtualSolReserves: Lamports,
  virtualTokenReserves: TokenUnits,
): number {
  // price in SOL per token
  return lamportsToSol(virtualSolReserves) / rawToTokens(virtualTokenReserves);
}

export function computeMarketCapSol(
  virtualSolReserves: Lamports,
  virtualTokenReserves: TokenUnits,
  totalSupply: TokenUnits,
): number {
  const price = computePrice(virtualSolReserves, virtualTokenReserves);
  return price * rawToTokens(totalSupply);
}

// ─── String / format helpers ──────────────────────────────────────────────────

export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatSol(lamports: Lamports, decimals = 4): string {
  return lamportsToSol(lamports).toFixed(decimals);
}

// ─── Retry utility ────────────────────────────────────────────────────────────

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxAttempts?: number; delayMs?: number; backoff?: boolean } = {},
): Promise<T> {
  const { maxAttempts = 3, delayMs = 200, backoff = true } = opts;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        const wait = backoff ? delayMs * 2 ** (attempt - 1) : delayMs;
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastErr;
}

// ─── Sleep ────────────────────────────────────────────────────────────────────

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Epoch utilities ──────────────────────────────────────────────────────────

export function nowIso(): string {
  return new Date().toISOString();
}

export function epochToIso(epochMs: number): string {
  return new Date(epochMs).toISOString();
}

// ─── Type narrowing ───────────────────────────────────────────────────────────

export function assertDefined<T>(val: T | null | undefined, name: string): T {
  if (val === null || val === undefined) {
    throw new Error(`Expected ${name} to be defined, got ${String(val)}`);
  }
  return val;
}
