import { describe, it, expect } from 'vitest';

import { resolveMnemonicEncryptionKey } from '../../src/index.js';

describe('resolveMnemonicEncryptionKey (H-21)', () => {
  it('prefers MNEMONIC_ENCRYPTION_KEY', () => {
    const key = resolveMnemonicEncryptionKey({
      MNEMONIC_ENCRYPTION_KEY: 'primary-key-at-least-32-characters-long',
    });
    expect(key).toBe('primary-key-at-least-32-characters-long');
  });

  it('falls back to MNEMONIC_SECRET', () => {
    const key = resolveMnemonicEncryptionKey({
      MNEMONIC_SECRET: 'legacy-secret-at-least-32-characters-long',
    });
    expect(key).toBe('legacy-secret-at-least-32-characters-long');
  });

  it('throws when neither key is valid', () => {
    expect(() => resolveMnemonicEncryptionKey({})).toThrow(/MNEMONIC_ENCRYPTION_KEY/);
  });
});
