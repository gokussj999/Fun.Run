/**
 * Minimal Borsh decoder for Anchor event data.
 * Covers only the types used in Fun.Run V2 event structs.
 * We avoid pulling in full borsh/anchor runtime to keep the indexer lean.
 *
 * Borsh encoding reference:
 *   bool     → 1 byte (0 or 1)
 *   u8       → 1 byte, little-endian
 *   u16      → 2 bytes, little-endian
 *   u32      → 4 bytes, little-endian
 *   u64      → 8 bytes, little-endian (returned as BigInt)
 *   i64      → 8 bytes, little-endian (signed, returned as BigInt)
 *   Pubkey   → 32 bytes
 *   String   → u32 length prefix + UTF-8 bytes
 *   Option<T> → 1 byte tag (0=None, 1=Some) + T if Some
 */

export class BorshReader {
  private offset = 0;

  constructor(private readonly buf: Buffer) {}

  remaining(): number {
    return this.buf.length - this.offset;
  }

  pos(): number {
    return this.offset;
  }

  readU8(): number {
    const val = this.buf.readUInt8(this.offset);
    this.offset += 1;
    return val;
  }

  readU16(): number {
    const val = this.buf.readUInt16LE(this.offset);
    this.offset += 2;
    return val;
  }

  readU32(): number {
    const val = this.buf.readUInt32LE(this.offset);
    this.offset += 4;
    return val;
  }

  readU64(): bigint {
    const lo = this.buf.readUInt32LE(this.offset);
    const hi = this.buf.readUInt32LE(this.offset + 4);
    this.offset += 8;
    return (BigInt(hi) << 32n) | BigInt(lo);
  }

  readI64(): bigint {
    const lo = this.buf.readUInt32LE(this.offset);
    const hi = this.buf.readInt32LE(this.offset + 4);
    this.offset += 8;
    return (BigInt(hi) << 32n) | BigInt(lo);
  }

  readBool(): boolean {
    return this.readU8() !== 0;
  }

  /**
   * Read a 32-byte Solana public key, return base58-encoded string.
   * We use a lightweight base58 encoder to avoid importing @solana/web3.js here.
   */
  readPubkey(): string {
    const bytes = this.buf.subarray(this.offset, this.offset + 32);
    this.offset += 32;
    return encodeBase58(bytes);
  }

  readString(): string {
    const len = this.readU32();
    const str = this.buf.subarray(this.offset, this.offset + len).toString('utf8');
    this.offset += len;
    return str;
  }

  readOptionPubkey(): string | null {
    const tag = this.readU8();
    if (tag === 0) return null;
    return this.readPubkey();
  }

  readOptionU64(): bigint | null {
    const tag = this.readU8();
    if (tag === 0) return null;
    return this.readU64();
  }

  readOptionBool(): boolean | null {
    const tag = this.readU8();
    if (tag === 0) return null;
    return this.readBool();
  }

  skip(bytes: number): void {
    this.offset += bytes;
  }
}

// ─── Base58 encoder (minimal — only for Pubkey display) ──────────────────────
// We avoid importing bs58 here to keep the parser dependency-free.

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeBase58(input: Uint8Array): string {
  let leading = 0;
  for (const byte of input) {
    if (byte === 0) leading++;
    else break;
  }

  let num = BigInt('0x' + Buffer.from(input).toString('hex').padStart(2, '0'));

  const digits: number[] = [];
  while (num > 0n) {
    const rem = num % 58n;
    digits.unshift(Number(rem));
    num = num / 58n;
  }

  return '1'.repeat(leading) + digits.map((d) => BASE58_ALPHABET[d]).join('');
}
