import { BorshReader } from '../borsh.js';
import type { CoinCreatedData } from '../../types.js';

/**
 * Decode CoinCreated event.
 * Rust struct (events.rs):
 *   pub struct CoinCreated {
 *     pub mint: Pubkey,
 *     pub creator: Pubkey,
 *     pub name: String,
 *     pub symbol: String,
 *     pub uri: String,
 *     pub virtual_sol_reserves: u64,
 *     pub virtual_token_reserves: u64,
 *     pub real_token_reserves: u64,
 *     pub creation_fee: u64,
 *     pub fee_bps: u16,
 *   }
 */
export function decodeCoinCreated(payload: Buffer): CoinCreatedData {
  const r = new BorshReader(payload);
  return {
    mint:                 r.readPubkey(),
    creator:              r.readPubkey(),
    name:                 r.readString(),
    symbol:               r.readString(),
    uri:                  r.readString(),
    virtualSolReserves:   r.readU64(),
    virtualTokenReserves: r.readU64(),
    realTokenReserves:    r.readU64(),
    creationFee:          r.readU64(),
    feeBps:               r.readU16(),
  };
}
