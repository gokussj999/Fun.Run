import { createHash } from "node:crypto";

/** Anchor instruction discriminator: sha256("global:<name>")[0..8] */
export function anchorDiscriminator(name) {
  return createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
}

export function encodeU64(value) {
  const buf = Buffer.allocUnsafe(8);
  buf.writeBigUInt64LE(BigInt(value), 0);
  return buf;
}

export function encodeString(value) {
  const bytes = Buffer.from(String(value ?? ""), "utf8");
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32LE(bytes.length, 0);
  return Buffer.concat([len, bytes]);
}

export function readU64LE(buf, offset) {
  return buf.readBigUInt64LE(offset);
}

export function readI64LE(buf, offset) {
  return buf.readBigInt64LE(offset);
}
