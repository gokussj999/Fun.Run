import { BorshReader } from '../borsh.js';
import type { TokensPurchasedData, TokensSoldData } from '../../types.js';

/**
 * Decode TokensPurchased event.
 * Rust struct (events.rs):
 *   pub mint: Pubkey, pub buyer: Pubkey,
 *   pub sol_amount: u64, pub sol_net: u64, pub tokens_out: u64,
 *   pub treasury_fee: u64, pub creator_fee: u64, pub creator_referrer_fee: u64,
 *   pub creator_referrer: Option<Pubkey>,
 *   pub virtual_sol_reserves: u64, pub virtual_token_reserves: u64, pub real_sol_reserves: u64,
 *   pub timestamp: i64
 */
export function decodeTokensPurchased(payload: Buffer): TokensPurchasedData {
  const r = new BorshReader(payload);
  return {
    mint:                 r.readPubkey(),
    buyer:                r.readPubkey(),
    solAmount:            r.readU64(),
    solNet:               r.readU64(),
    tokenAmount:          r.readU64(),
    treasuryFee:          r.readU64(),
    creatorFee:           r.readU64(),
    referrerFee:          r.readU64(),
    creatorReferrer:      r.readOptionPubkey(),
    virtualSolAfter:      r.readU64(),
    virtualTokensAfter:   r.readU64(),
    realSolAfter:         r.readU64(),
    timestamp:            r.readI64(),
  };
}

/**
 * Decode TokensSold event.
 * Rust struct (events.rs):
 *   pub mint: Pubkey, pub seller: Pubkey,
 *   pub token_amount: u64, pub sol_gross: u64, pub sol_net: u64,
 *   pub treasury_fee: u64, pub creator_fee: u64, pub creator_referrer_fee: u64,
 *   pub creator_referrer: Option<Pubkey>,
 *   pub virtual_sol_reserves: u64, pub virtual_token_reserves: u64, pub real_sol_reserves: u64,
 *   pub timestamp: i64
 */
export function decodeTokensSold(payload: Buffer): TokensSoldData {
  const r = new BorshReader(payload);
  return {
    mint:                 r.readPubkey(),
    seller:               r.readPubkey(),
    tokenAmount:          r.readU64(),
    solGross:             r.readU64(),
    solNet:               r.readU64(),
    treasuryFee:          r.readU64(),
    creatorFee:           r.readU64(),
    referrerFee:          r.readU64(),
    creatorReferrer:      r.readOptionPubkey(),
    virtualSolAfter:      r.readU64(),
    virtualTokensAfter:   r.readU64(),
    realSolAfter:         r.readU64(),
    timestamp:            r.readI64(),
  };
}
