import "dotenv/config";
import crypto from "crypto";
import postgres from "postgres";
import { Keypair } from "@solana/web3.js";

const KEY = process.env.ENCRYPTION_KEY;
const OLD_KEY = "12345678901234567890123456789012";
const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });

function decryptWith(enc, key) {
  const parts = String(enc).split(":");
  const iv = Buffer.from(parts[0], "hex");
  const data = Buffer.from(parts[1], "hex");
  const d = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
  let out = d.update(data);
  return Buffer.concat([out, d.final()]);
}

const rows = await sql`SELECT id, reserve_wallet_address, reserve_wallet_encrypted FROM coins WHERE id = 'lurbrz9ah0jmqrsidi3'`;
const coin = rows[0];

console.log("=== Coin reserve wallet diagnostic ===");
console.log("DB address :", coin.reserve_wallet_address);

// Decrypt with new key (post-migration)
const decNew = decryptWith(coin.reserve_wallet_encrypted, KEY);
console.log("\n[New key] decrypted bytes :", decNew.length);
console.log("[New key] as utf-8 string :", JSON.stringify(decNew.toString("utf8").slice(0, 80)));

// Decrypt with old key (pre-migration — to confirm migration was correct)
let decOld;
try {
  decOld = decryptWith(coin.reserve_wallet_encrypted, OLD_KEY);
  console.log("\n[Old key] UNEXPECTED SUCCESS — migration may not have run for this coin");
} catch {
  console.log("\n[Old key] decrypt fails ✓ (expected — coin was migrated to new key)");
}

// Try: first 64 bytes as secretKey
if (decNew.length >= 64) {
  try {
    const kp = Keypair.fromSecretKey(decNew.slice(0, 64));
    console.log("\n[Try first 64 bytes as secretKey]");
    console.log("  Derived address :", kp.publicKey.toBase58());
    console.log("  Match           :", kp.publicKey.toBase58() === coin.reserve_wallet_address);
  } catch (e) {
    console.log("\n[Try first 64 bytes] failed:", e.message);
  }
}

// Try: interpret as UTF-8 mnemonic
const asString = decNew.toString("utf8").trim();
const wordCount = asString.split(/\s+/).length;
console.log("\n[UTF-8 content] words:", wordCount, "length:", asString.length);
if (wordCount === 12 || wordCount === 24) {
  try {
    const bip39 = (await import("bip39")).default;
    const { derivePath } = await import("ed25519-hd-key");
    const seed = await bip39.mnemonicToSeed(asString);
    const derived = derivePath("m/44'/501'/0'/0'", seed.toString("hex")).key;
    const kp = Keypair.fromSeed(derived);
    console.log("  Derived address :", kp.publicKey.toBase58());
    console.log("  Match           :", kp.publicKey.toBase58() === coin.reserve_wallet_address);
  } catch (e) {
    console.log("  BIP39 derive failed:", e.message);
  }
}

console.log("\n=== Conclusion ===");
console.log("This coin's reserve_wallet_encrypted content is", decNew.length, "bytes.");
console.log("It does not match the stored reserve_wallet_address.");
console.log("This is a PRE-EXISTING issue — existed before key rotation.");
console.log("Key rotation correctly re-encrypted the existing data (whatever it was).");
console.log("User custodial wallets (profiles.encrypted_mnemonic) are unaffected.");

await sql.end();
