import { BorshReader } from '../borsh.js';
import type { CreatorFeesClaimedData, CreatorReferrerFeesClaimedData, CreatorReferrerSetData, TreasurySweepData, GlobalConfigUpdatedData } from '../../types.js';

export function decodeCreatorFeesClaimed(payload: Buffer): CreatorFeesClaimedData {
  const r = new BorshReader(payload);
  return {
    mint:    r.readPubkey(),
    creator: r.readPubkey(),
    amount:  r.readU64(),
  };
}

export function decodeCreatorReferrerFeesClaimed(payload: Buffer): CreatorReferrerFeesClaimedData {
  const r = new BorshReader(payload);
  return {
    mint:           r.readPubkey(),
    referrer:       r.readPubkey(),
    referrerAmount: r.readU64(),
  };
}

export function decodeCreatorReferrerSet(payload: Buffer): CreatorReferrerSetData {
  const r = new BorshReader(payload);
  return {
    mint:     r.readPubkey(),
    creator:  r.readPubkey(),
    referrer: r.readPubkey(),
  };
}

export function decodeTreasurySweep(payload: Buffer): TreasurySweepData {
  const r = new BorshReader(payload);
  return {
    destination: r.readPubkey(),
    amount:      r.readU64(),
  };
}

export function decodeGlobalConfigUpdated(payload: Buffer): GlobalConfigUpdatedData {
  const r = new BorshReader(payload);
  return {
    admin:       r.readPubkey(),
    feeBps:      r.readU16(),
    creationFee: r.readOptionU64(),
    paused:      r.readOptionBool(),
  };
}
