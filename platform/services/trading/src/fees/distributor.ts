import type { PrismaClient } from '@funrun/database';
import {
  CREATOR_FEE_PCT,
  REFERRER_FEE_PCT,
  FEE_PERCENT_DENOMINATOR,
} from '../constants.js';
import type { FeeBreakdown } from '../types.js';
import { acquireTreasuryLock } from '../lock/db-advisory.js';

type TxClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export function computeFeeBreakdown(totalFee: bigint, hasReferrer: boolean): FeeBreakdown {
  const denom = BigInt(FEE_PERCENT_DENOMINATOR);

  const creatorFee = (totalFee * BigInt(CREATOR_FEE_PCT)) / denom;
  const referrerFee = hasReferrer
    ? (totalFee * BigInt(REFERRER_FEE_PCT)) / denom
    : 0n;
  // Treasury gets the remainder — no rounding loss regardless of BigInt truncation.
  const treasuryFee = totalFee - creatorFee - referrerFee;

  return { totalFee, creatorFee, referrerFee, treasuryFee };
}

export async function distributeFees(
  tx: TxClient,
  params: {
    coinId: string;
    txSignature: string;
    fees: FeeBreakdown;
    referrerWallet: string | null;
  },
): Promise<void> {
  const { coinId, txSignature, fees, referrerWallet } = params;

  // ── Referrer: increment pending balance ──────────────────────────────────────
  if (referrerWallet && fees.referrerFee > 0n) {
    await tx.referralAccount.upsert({
      where: { walletAddress: referrerWallet },
      create: {
        walletAddress: referrerWallet,
        pendingFees: fees.referrerFee.toString(),
        totalFeesEarned: fees.referrerFee.toString(),
        referralCount: 0,
      },
      update: {
        pendingFees:      { increment: fees.referrerFee.toString() },
        totalFeesEarned:  { increment: fees.referrerFee.toString() },
      },
    });
  }

  // ── Treasury: append-only audit record ──────────────────────────────────────
  // Acquire global treasury lock before the cumulative_total read-modify-write.
  // Per-coin advisory locks only serialize trades on the same coin; without this
  // lock, concurrent trades on different coins can both read the same MAX value
  // and produce duplicate cumulative totals. Lock is always acquired after the
  // per-coin lock (consistent order) so no deadlock cycle is possible.
  await acquireTreasuryLock(tx);
  const memo = `creator=${fees.creatorFee.toString()} referrer=${fees.referrerFee.toString()}`;
  await tx.$executeRaw`
    INSERT INTO treasury_events (
      id, event_type, coin_id, tx_signature, amount_lamports,
      cumulative_total, memo, created_at
    )
    SELECT
      gen_random_uuid()::text,
      'TRADE_FEE',
      ${coinId},
      ${txSignature},
      ${fees.treasuryFee.toString()}::numeric,
      COALESCE((SELECT MAX(cumulative_total) FROM treasury_events), 0) + ${fees.treasuryFee.toString()}::numeric,
      ${memo},
      NOW()
  `;
}
