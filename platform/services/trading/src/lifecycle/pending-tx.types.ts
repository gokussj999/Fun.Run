// TypeScript types for the pending_txs table.
// TxStatus values mirror the Prisma enum exactly so they're structurally assignable.

export const TX_STATUS = {
  BUILDING:  'BUILDING',
  SIGNING:   'SIGNING',
  PENDING:   'PENDING',
  SUBMITTED: 'SUBMITTED',
  CONFIRMED: 'CONFIRMED',
  FINALIZED: 'FINALIZED',
  FAILED:    'FAILED',
  EXPIRED:   'EXPIRED',
  ABANDONED: 'ABANDONED',
} as const;

export type TxStatus = (typeof TX_STATUS)[keyof typeof TX_STATUS];

export const OPERATION_TYPE = {
  BUY:                  'BUY',
  SELL:                 'SELL',
  CREATE_COIN:          'CREATE_COIN',
  INITIATE_GRADUATION:  'INITIATE_GRADUATION',
  COMPLETE_GRADUATION:  'COMPLETE_GRADUATION',
} as const;

export type OperationType = (typeof OPERATION_TYPE)[keyof typeof OPERATION_TYPE];

/** Mirrors the pending_txs Prisma model — return type for all TxStore methods. */
export interface PendingTxRecord {
  id:                   string;
  idempotencyKey:       string;
  walletAddress:        string;
  operationType:        string;
  coinId:               string | null;
  status:               TxStatus;
  serializedTx:         Buffer | null;
  signature:            string | null;
  blockhash:            string | null;
  lastValidBlockHeight: bigint | null;
  confirmedSlot:        bigint | null;
  finalizedAt:          Date | null;
  errorMessage:         string | null;
  errorCode:            string | null;
  canResubmit:          boolean;
  submitAttempts:       number;
  lastSubmittedAt:      Date | null;
  expiresAt:            Date | null;
  createdAt:            Date;
  updatedAt:            Date;
}

export interface CreateTxOpts {
  idempotencyKey: string;
  walletAddress:  string;
  operationType:  OperationType;
  coinId?:        string;
  expiresAt?:     Date;
}
