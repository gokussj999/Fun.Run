import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';

import { EVENT_DISCRIMINATORS, DISCRIMINATOR_TO_EVENT } from '../../src/constants.js';
import type { EventName } from '../../src/types.js';

function referenceDiscriminator(name: string): string {
  return createHash('sha256')
    .update(`event:${name}`)
    .digest()
    .subarray(0, 8)
    .toString('hex');
}

const ALL_EVENTS: EventName[] = [
  'CoinCreated', 'TokensPurchased', 'TokensSold',
  'GraduationInitiated', 'GraduationCompleted',
  'LiquidityLocked', 'MintAuthorityRevoked', 'FreezeAuthorityRevoked', 'CoinGraduated',
  'CreatorFeesClaimed', 'CreatorReferrerFeesClaimed', 'CreatorReferrerSet',
  'GlobalConfigUpdated', 'TreasurySweep',
];

describe('EVENT_DISCRIMINATORS', () => {
  it('covers all 14 event names', () => {
    expect(Object.keys(EVENT_DISCRIMINATORS)).toHaveLength(14);
    for (const name of ALL_EVENTS) {
      expect(EVENT_DISCRIMINATORS).toHaveProperty(name);
    }
  });

  it('each discriminator is 8 bytes', () => {
    for (const [name, buf] of Object.entries(EVENT_DISCRIMINATORS)) {
      expect(buf).toHaveLength(8, `${name} discriminator should be 8 bytes`);
    }
  });

  it('matches reference SHA256("event:<name>")[0..8] computation', () => {
    for (const name of ALL_EVENTS) {
      const computed = EVENT_DISCRIMINATORS[name].toString('hex');
      const reference = referenceDiscriminator(name);
      expect(computed).toBe(reference, `Discriminator mismatch for ${name}`);
    }
  });

  it('all discriminators are unique (no collisions)', () => {
    const hexValues = Object.values(EVENT_DISCRIMINATORS).map((b) => b.toString('hex'));
    const unique = new Set(hexValues);
    expect(unique.size).toBe(hexValues.length);
  });
});

describe('DISCRIMINATOR_TO_EVENT reverse map', () => {
  it('has an entry for every discriminator', () => {
    expect(DISCRIMINATOR_TO_EVENT.size).toBe(14);
  });

  it('round-trips correctly', () => {
    for (const name of ALL_EVENTS) {
      const hex = EVENT_DISCRIMINATORS[name].toString('hex');
      expect(DISCRIMINATOR_TO_EVENT.get(hex)).toBe(name);
    }
  });
});
