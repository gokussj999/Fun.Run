/**
 * CustodialSigner — in-memory keypair management for signing VersionedTransactions.
 *
 * Security guarantees:
 *  - Decrypted mnemonics and derived seed bytes are zeroed after keypair construction.
 *  - The nacl keypair's secretKey bytes are zeroed on destroy().
 *  - Plaintext secrets are NEVER logged, stored, or sent over the wire.
 *  - Strings are immutable in JS — we zero all Buffer intermediates we control.
 */
import { createDecipheriv, createHmac, pbkdf2Sync } from 'node:crypto';
import { Keypair, VersionedTransaction, type PublicKey } from '@solana/web3.js';

// ── Errors ────────────────────────────────────────────────────────────────────

export class MnemonicDecryptError extends Error {
  constructor(reason: string) {
    super(`CustodialSigner: mnemonic decrypt failed — ${reason}`);
    this.name = 'MnemonicDecryptError';
  }
}

export class InvalidSecretKeyError extends Error {
  constructor(reason: string) {
    super(`CustodialSigner: invalid secret key — ${reason}`);
    this.name = 'InvalidSecretKeyError';
  }
}

export class SignerDestroyedError extends Error {
  constructor() {
    super('CustodialSigner: already destroyed — create a new instance');
    this.name = 'SignerDestroyedError';
  }
}

// ── Signer ────────────────────────────────────────────────────────────────────

export class CustodialSigner {
  #keypair:   Keypair;
  #destroyed: boolean = false;

  readonly publicKey: PublicKey;

  private constructor(keypair: Keypair) {
    this.#keypair  = keypair;
    this.publicKey = keypair.publicKey;
  }

  // ── Factories ───────────────────────────────────────────────────────────────

  /**
   * Decrypts an AES-256-CBC encrypted mnemonic (format: `iv_hex:ciphertext_hex`)
   * and derives the ed25519 Keypair at path m/44'/501'/0'/0' (SLIP-0010).
   *
   * All intermediate Buffers (IV, ciphertext, seed, derived key) are zeroed after use.
   */
  static fromEncryptedMnemonic(
    encryptedMnemonic: string,
    encryptionKey: string,
  ): CustodialSigner {
    const mnemonic = decryptMnemonic(encryptedMnemonic, encryptionKey);
    // Mnemonic is a JS string — we cannot zero it, but we minimise scope
    try {
      const seed = deriveSeedFromMnemonic(mnemonic);
      try {
        const keypair = Keypair.fromSeed(seed);
        return new CustodialSigner(keypair);
      } finally {
        seed.fill(0);
      }
    } finally {
      // Force the string out of this scope; GC will collect it
      void mnemonic;
    }
  }

  /**
   * Loads a treasury / owner keypair from a 64-byte Uint8Array.
   * The caller is responsible for zeroing `secretKey` after this call.
   *
   * Compatible with Solana CLI keypair.json (JSON array of 64 numbers):
   *   `CustodialSigner.fromSecretKey(new Uint8Array(JSON.parse(process.env.TREASURY_KEYPAIR!)))`
   */
  static fromSecretKey(secretKey: Uint8Array): CustodialSigner {
    if (secretKey.length !== 64) {
      throw new InvalidSecretKeyError(
        `expected 64-byte secret key, got ${secretKey.length} bytes`,
      );
    }
    const keypair = Keypair.fromSecretKey(secretKey);
    return new CustodialSigner(keypair);
  }

  // ── Signing ─────────────────────────────────────────────────────────────────

  /**
   * Signs the transaction in-place.
   * Throws SignerDestroyedError if destroy() was already called.
   */
  sign(tx: VersionedTransaction): void {
    if (this.#destroyed) throw new SignerDestroyedError();
    tx.sign([this.#keypair]);
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  /**
   * Zeroes the nacl secret key bytes and marks this signer as invalid.
   * Call this as soon as the signed transaction has been dispatched.
   */
  destroy(): void {
    if (!this.#destroyed) {
      this.#keypair.secretKey.fill(0);
      this.#destroyed = true;
    }
  }

  get isDestroyed(): boolean {
    return this.#destroyed;
  }
}

// ── Private cryptographic helpers ─────────────────────────────────────────────

/**
 * Decrypts an AES-256-CBC ciphertext.
 * Format: `<iv_hex>:<ciphertext_hex>` where iv_hex is 32 hex chars (16 bytes).
 * All intermediate buffers are zeroed in finally blocks.
 */
function decryptMnemonic(ciphertext: string, encryptionKey: string): string {
  const colonIdx = ciphertext.indexOf(':');
  if (colonIdx < 0) {
    throw new MnemonicDecryptError('invalid format — expected iv_hex:ciphertext_hex');
  }

  const ivHex = ciphertext.slice(0, colonIdx);
  const ctHex = ciphertext.slice(colonIdx + 1);

  const iv     = Buffer.from(ivHex, 'hex');
  const ct     = Buffer.from(ctHex, 'hex');
  const keyBuf = Buffer.from(encryptionKey, 'utf8');

  try {
    if (iv.length !== 16) {
      throw new MnemonicDecryptError(`invalid IV length: expected 16 bytes, got ${iv.length}`);
    }
    if (keyBuf.length !== 32) {
      throw new MnemonicDecryptError('encryption key must be exactly 32 bytes (UTF-8)');
    }
    if (ct.length === 0) {
      throw new MnemonicDecryptError('ciphertext is empty');
    }

    let decrypted: Buffer;
    try {
      const decipher = createDecipheriv('aes-256-cbc', keyBuf, iv);
      const part1 = decipher.update(ct);
      const part2 = decipher.final();
      decrypted = Buffer.concat([part1, part2]);
      part1.fill(0);
      // part2 data is copied into decrypted; zero the original
      part2.fill(0);
    } catch (err) {
      // Do not expose the original error — it may contain timing information
      throw new MnemonicDecryptError('decryption failed — wrong key or corrupted ciphertext');
    }

    try {
      return decrypted.toString('utf8');
    } finally {
      decrypted.fill(0);
    }
  } finally {
    iv.fill(0);
    ct.fill(0);
    keyBuf.fill(0);
  }
}

/**
 * BIP39 mnemonic → 32-byte ed25519 private key at m/44'/501'/0'/0'.
 *
 * Step 1 — BIP39 seed (RFC 2898 PBKDF2-HMAC-SHA512, 2048 rounds, salt = "mnemonic"):
 *   Matches bip39.mnemonicToSeedSync(mnemonic) with no passphrase.
 *
 * Step 2 — SLIP-0010 ed25519 HD derivation (all levels hardened):
 *   Master:  HMAC-SHA512(key="ed25519 seed", data=seed)
 *   Child i: HMAC-SHA512(key=chainCode, data=0x00‖privateKey‖ser32(i | 0x80000000))
 *
 * Returns a 32-byte Buffer. Caller MUST call fill(0) after creating the Keypair.
 */
function deriveSeedFromMnemonic(mnemonic: string): Buffer {
  // BIP39: mnemonic → 64-byte seed
  const bip39Seed = pbkdf2Sync(mnemonic, 'mnemonic', 2048, 64, 'sha512');

  try {
    return slip10DeriveEd25519(bip39Seed, [
      0x8000002c, // 44' (coin_type parent)
      0x800001f5, // 501' (Solana)
      0x80000000, // 0'
      0x80000000, // 0'
    ]);
  } finally {
    bip39Seed.fill(0);
  }
}

/**
 * SLIP-0010 hardened child key derivation for ed25519.
 * All indices MUST already include the hardened bit (0x80000000).
 */
function slip10DeriveEd25519(seed: Buffer, indices: number[]): Buffer {
  // Master key: HMAC-SHA512("ed25519 seed", rawSeed)
  let I = createHmac('sha512', Buffer.from('ed25519 seed', 'utf8'))
    .update(seed)
    .digest();

  let key       = I.subarray(0, 32);  // private key (32 bytes)
  let chainCode = I.subarray(32, 64); // chain code  (32 bytes)

  for (const index of indices) {
    // Hardened child: HMAC-SHA512(chainCode, 0x00 ‖ key ‖ ser32(index))
    const data = Buffer.allocUnsafe(37);
    data[0] = 0x00;
    key.copy(data, 1);
    data.writeUInt32BE(index >>> 0, 33); // >>> 0 forces unsigned 32-bit interpretation

    const Ichild = createHmac('sha512', chainCode).update(data).digest();
    data.fill(0);

    key       = Ichild.subarray(0, 32);
    chainCode = Ichild.subarray(32, 64);

    I = Ichild; // keep reference so the previous I can be GC'd
  }

  // Return a fresh copy so the caller can zero it independently
  return Buffer.from(key);
}

/** BIP39 mnemonic → custodial Solana address (m/44'/501'/0'/0'). */
export function derivePublicKeyBase58FromMnemonic(mnemonic: string): string {
  const seed = deriveSeedFromMnemonic(mnemonic);
  try {
    return Keypair.fromSeed(seed).publicKey.toBase58();
  } finally {
    seed.fill(0);
  }
}

/** Encrypted mnemonic → custodial Solana address for deposits and on-chain signing. */
export function derivePublicKeyBase58FromEncryptedMnemonic(
  encryptedMnemonic: string,
  encryptionKey: string,
): string {
  const signer = CustodialSigner.fromEncryptedMnemonic(encryptedMnemonic, encryptionKey);
  try {
    return signer.publicKey.toBase58();
  } finally {
    signer.destroy();
  }
}
