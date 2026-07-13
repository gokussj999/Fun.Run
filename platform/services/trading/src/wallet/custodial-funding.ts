import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  type Connection,
} from '@solana/web3.js';
import type { Logger } from '@funrun/logger';

const DEFAULT_MIN_LAMPORTS = 20_000_000n; // 0.02 SOL — legacy parity for create + fees

/**
 * Top up a fresh custodial wallet from treasury when empty (legacy server.js parity).
 */
export async function ensureCustodialFunded(
  connection: Connection,
  treasury: Keypair,
  custodialAddress: string,
  logger: Logger,
  minLamports: bigint = DEFAULT_MIN_LAMPORTS,
): Promise<void> {
  const target = new PublicKey(custodialAddress);
  const balance = BigInt(await connection.getBalance(target));
  if (balance >= minLamports) return;

  const topUp = Number(minLamports - balance);
  if (topUp <= 0) return;

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: treasury.publicKey,
      toPubkey: target,
      lamports: topUp,
    }),
  );

  try {
    await sendAndConfirmTransaction(connection, tx, [treasury], {
      commitment: 'confirmed',
    });
    logger.info(
      { custodialAddress, lamports: topUp },
      'Custodial wallet funded from treasury',
    );
  } catch (err) {
    logger.warn({ custodialAddress, err }, 'Custodial treasury fund failed');
    throw err;
  }
}
