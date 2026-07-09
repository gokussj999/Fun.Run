import { BorshReader } from '../borsh.js';
import type { GraduationInitiatedData, GraduationCompletedData } from '../../types.js';

/**
 * Decode GraduationInitiated event.
 * Rust struct:
 *   pub mint: Pubkey, pub initiator: Pubkey,
 *   pub sol_at_initiation: u64,
 *   pub creator_fee_snapshot: u64, pub referrer_fee_snapshot: u64,
 *   pub referrer: Option<Pubkey>
 */
export function decodeGraduationInitiated(payload: Buffer): GraduationInitiatedData {
  const r = new BorshReader(payload);
  return {
    mint:                 r.readPubkey(),
    initiator:            r.readPubkey(),
    solAtInitiation:      r.readU64(),
    creatorFeeSnapshot:   r.readU64(),
    referrerFeeSnapshot:  r.readU64(),
    referrer:             r.readOptionPubkey(),
  };
}

/**
 * Decode GraduationCompleted event.
 * Rust struct:
 *   pub mint: Pubkey, pub completer: Pubkey,
 *   pub pool_state: Pubkey, pub lp_mint: Pubkey,
 *   pub sol_added_to_pool: u64, pub tokens_added_to_pool: u64,
 *   pub lp_amount: u64, pub dex_fee: u64
 */
export function decodeGraduationCompleted(payload: Buffer): GraduationCompletedData {
  const r = new BorshReader(payload);
  return {
    mint:               r.readPubkey(),
    completer:          r.readPubkey(),
    poolState:          r.readPubkey(),
    lpMint:             r.readPubkey(),
    solAddedToPool:     r.readU64(),
    tokensAddedToPool:  r.readU64(),
    lpAmount:           r.readU64(),
    dexFee:             r.readU64(),
  };
}
