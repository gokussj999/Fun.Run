import { BorshReader } from '../borsh.js';
import type { CoinCreatedData } from '../../types.js';

/** Matches on-chain `CoinCreated` in anchor/programs/funrun_v2/src/events.rs */
export function decodeCoinCreated(payload: Buffer): CoinCreatedData {
  const r = new BorshReader(payload);
  return {
    mint:                 r.readPubkey(),
    creator:              r.readPubkey(),
    creatorReferrer:      r.readOptionPubkey(),
    name:                 r.readString(),
    symbol:               r.readString(),
    uri:                  r.readString(),
    virtualSolReserves:   r.readU64(),
    virtualTokenReserves: r.readU64(),
    creationFeePaid:      r.readU64(),
    timestamp:            r.readI64(),
  };
}
