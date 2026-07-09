import { BorshReader } from '../borsh.js';
import type { TokensPurchasedData, TokensSoldData } from '../../types.js';

/**
 * Decode TokensPurchased event.
 * Rust struct:
 *   pub mint: Pubkey, pub buyer: Pubkey,
 *   pub sol_amount: u64, pub token_amount: u64,
 *   pub fee_total: u64, pub creator_fee: u64, pub referrer_fee: u64, pub treasury_fee: u64,
 *   pub virtual_sol_after: u64, pub virtual_tokens_after: u64, pub real_sol_after: u64
 */
export function decodeTokensPurchased(payload: Buffer): TokensPurchasedData {
  const r = new BorshReader(payload);
  return {
    mint:                 r.readPubkey(),
    buyer:                r.readPubkey(),
    solAmount:            r.readU64(),
    tokenAmount:          r.readU64(),
    feeTotal:             r.readU64(),
    creatorFee:           r.readU64(),
    referrerFee:          r.readU64(),
    treasuryFee:          r.readU64(),
    virtualSolAfter:      r.readU64(),
    virtualTokensAfter:   r.readU64(),
    realSolAfter:         r.readU64(),
  };
}

/**
 * Decode TokensSold event.
 * Same layout as TokensPurchased but with seller instead of buyer.
 */
export function decodeTokensSold(payload: Buffer): TokensSoldData {
  const r = new BorshReader(payload);
  return {
    mint:                 r.readPubkey(),
    seller:               r.readPubkey(),
    solAmount:            r.readU64(),
    tokenAmount:          r.readU64(),
    feeTotal:             r.readU64(),
    creatorFee:           r.readU64(),
    referrerFee:          r.readU64(),
    treasuryFee:          r.readU64(),
    virtualSolAfter:      r.readU64(),
    virtualTokensAfter:   r.readU64(),
    realSolAfter:         r.readU64(),
  };
}
