import { extractEventsFromLogs } from './discriminator.js';
import { decodeCoinCreated } from './events/coin-created.js';
import {
  decodeCreatorFeesClaimed,
  decodeCreatorReferrerFeesClaimed,
  decodeCreatorReferrerSet,
  decodeTreasurySweep,
  decodeGlobalConfigUpdated,
} from './events/fees.js';
import { decodeGraduationCompleted, decodeGraduationInitiated } from './events/graduation.js';
import { decodeTokensPurchased, decodeTokensSold } from './events/trade.js';

import type { EventData, EventName, ParsedEvent, RawLogEntry } from '../types.js';

type Decoder = (payload: Buffer) => EventData;

const DECODERS: Record<EventName, Decoder | null> = {
  CoinCreated:                decodeCoinCreated,
  TokensPurchased:            decodeTokensPurchased,
  TokensSold:                 decodeTokensSold,
  GraduationInitiated:        decodeGraduationInitiated,
  GraduationCompleted:        decodeGraduationCompleted,
  CreatorFeesClaimed:         decodeCreatorFeesClaimed,
  CreatorReferrerFeesClaimed: decodeCreatorReferrerFeesClaimed,
  CreatorReferrerSet:         decodeCreatorReferrerSet,
  GlobalConfigUpdated:        decodeGlobalConfigUpdated,
  TreasurySweep:              decodeTreasurySweep,
  // Informational events — emitted but no actionable data in the indexer
  LiquidityLocked:            null,
  MintAuthorityRevoked:       null,
  FreezeAuthorityRevoked:     null,
  CoinGraduated:              null,
};

/**
 * Parse all recognisable Anchor events from a raw log entry.
 * Returns an array because a single transaction can emit multiple events.
 * Failures in decoding one event do not prevent decoding of others.
 */
export function parseEvents(entry: RawLogEntry): ParsedEvent[] {
  if (entry.err !== null) return []; // failed transactions have no program events

  const extracted = extractEventsFromLogs(entry.logs);
  const parsed: ParsedEvent[] = [];

  for (const { name, payload } of extracted) {
    const decoder = DECODERS[name];
    if (!decoder) continue; // skip informational events

    let data: EventData;
    try {
      data = decoder(payload);
    } catch {
      // Log decode failures but don't crash the indexer
      continue;
    }

    parsed.push({
      name,
      signature: entry.signature,
      slot: entry.slot,
      blockTime: entry.blockTime ?? Math.floor(Date.now() / 1000),
      data,
    });
  }

  return parsed;
}
