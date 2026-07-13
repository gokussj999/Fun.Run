import { createHash } from 'node:crypto';

/** Anchor instruction discriminator: sha256("global:<name>")[0..8] */
export function anchorDiscriminator(name: string): Buffer {
  return createHash('sha256').update(`global:${name}`).digest().subarray(0, 8);
}

export function encodeU64(value: bigint): Buffer {
  const buf = Buffer.allocUnsafe(8);
  buf.writeBigUInt64LE(value, 0);
  return buf;
}

export function encodeString(value: string): Buffer {
  const bytes = Buffer.from(value, 'utf8');
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32LE(bytes.length, 0);
  return Buffer.concat([len, bytes]);
}
