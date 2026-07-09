import type { PrismaClient } from '@funrun/database';
import { GRADUATION_THRESHOLD_LAMPORTS } from '../constants.js';

type TxClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export interface GraduationCheckResult {
  triggered: boolean;
  realSolReserves: bigint;
}

// Checks whether a coin has crossed the graduation threshold after a buy.
// If triggered, updates status to GRADUATING within the same transaction.
// Only applies to BUY trades — sells can never trigger graduation.
export async function checkGraduation(
  tx: TxClient,
  params: {
    coinId: string;
    realSolAfter: bigint;
    currentStatus: string;
  },
): Promise<GraduationCheckResult> {
  const { coinId, realSolAfter, currentStatus } = params;

  const triggered =
    currentStatus === 'ACTIVE' &&
    realSolAfter >= GRADUATION_THRESHOLD_LAMPORTS;

  if (triggered) {
    await tx.coin.update({
      where: { id: coinId },
      data: {
        status: 'GRADUATING',
        graduationInitiatedAt: new Date(),
      },
    });
  }

  return { triggered, realSolReserves: realSolAfter };
}
