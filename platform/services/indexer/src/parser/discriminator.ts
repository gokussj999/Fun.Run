import { DISCRIMINATOR_TO_EVENT, PROGRAM_DATA_PREFIX } from '../constants.js';
import type { EventName } from '../types.js';

/**
 * Parse a single Solana log line.
 * Returns { name, payload } if the line contains a recognised Anchor event discriminator.
 * Returns null for all other log lines.
 *
 * Anchor emits events via:
 *   Program data: <base64(8_byte_discriminator + borsh_payload)>
 */
export function parseLogLine(log: string): { name: EventName; payload: Buffer } | null {
  if (!log.startsWith(PROGRAM_DATA_PREFIX)) return null;

  const b64 = log.slice(PROGRAM_DATA_PREFIX.length).trim();

  let raw: Buffer;
  try {
    raw = Buffer.from(b64, 'base64');
  } catch {
    return null;
  }

  // Minimum: 8-byte discriminator + at least 1 byte of data
  if (raw.length < 9) return null;

  const discriminatorHex = raw.subarray(0, 8).toString('hex');
  const name = DISCRIMINATOR_TO_EVENT.get(discriminatorHex);

  if (!name) return null;

  // Payload starts after the 8-byte discriminator
  const payload = raw.subarray(8);

  return { name, payload };
}

/**
 * Extract all Anchor events from a transaction's log array.
 * A transaction can emit multiple events (e.g. a buy + fee distribution).
 */
export function extractEventsFromLogs(
  logs: string[],
): Array<{ name: EventName; payload: Buffer }> {
  const events: Array<{ name: EventName; payload: Buffer }> = [];

  for (const log of logs) {
    const parsed = parseLogLine(log);
    if (parsed) events.push(parsed);
  }

  return events;
}
