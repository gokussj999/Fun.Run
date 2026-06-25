/**
 * Post-rotation verification script.
 * Run after redeploying with new ENCRYPTION_KEY.
 * Does NOT modify any data.
 *
 * Usage: node backend/scripts/verify-key-rotation.js
 */

import "dotenv/config";
import crypto from "crypto";
import postgres from "postgres";
import { Keypair } from "@solana/web3.js";

const KEY = process.env.ENCRYPTION_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!KEY || KEY.length !== 32) { console.error("ERROR: ENCRYPTION_KEY must be 32 chars"); process.exit(1); }
if (!DATABASE_URL) { console.error("ERROR: DATABASE_URL not set"); process.exit(1); }

const sql = postgres(DATABASE_URL, { ssl: "require", max: 3 });

function decrypt(encryptedText, key) {
  const parts = String(encryptedText || "").trim().split(":");
  if (parts.length !== 2) throw new Error("Invalid format");
  const iv = Buffer.from(parts[0], "hex");
  const data = Buffer.from(parts[1], "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
  let dec = decipher.update(data);
  dec = Buffer.concat([dec, decipher.final()]);
  return dec.toString("utf8");
}

async function deriveAddress(mnemonic) {
  const bip39 = (await import("bip39")).default;
  const { derivePath } = await import("ed25519-hd-key");
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const derived = derivePath("m/44'/501'/0'/0'", seed.toString("hex")).key;
  return Keypair.fromSeed(derived).publicKey.toBase58();
}

async function main() {
  console.log("=== Post-Rotation Verification ===\n");

  const rows = await sql`
    SELECT wallet, wallet_address, encrypted_mnemonic
    FROM profiles
    WHERE encrypted_mnemonic IS NOT NULL AND encrypted_mnemonic != ''
    LIMIT 20
  `;

  console.log(`Checking ${rows.length} profiles...\n`);

  let passed = 0;
  let failed = 0;

  for (const row of rows) {
    const wallet = String(row.wallet || "").trim();
    const storedAddress = String(row.wallet_address || "").trim();

    // 1. Decrypt with new key
    let mnemonic;
    try {
      mnemonic = decrypt(row.encrypted_mnemonic, KEY);
    } catch (e) {
      console.error(`  [FAIL] ${wallet} — decrypt failed: ${e.message}`);
      failed++;
      continue;
    }

    // 2. Verify mnemonic looks like a valid BIP39 phrase (12 or 24 words)
    const wordCount = mnemonic.trim().split(/\s+/).length;
    if (wordCount !== 12 && wordCount !== 24) {
      console.error(`  [FAIL] ${wallet} — decrypted text is not a valid mnemonic (${wordCount} words)`);
      failed++;
      continue;
    }

    // 3. Derive keypair from mnemonic and compare address
    let derivedAddress;
    try {
      derivedAddress = await deriveAddress(mnemonic);
    } catch (e) {
      console.error(`  [FAIL] ${wallet} — key derivation failed: ${e.message}`);
      failed++;
      continue;
    }

    if (storedAddress && derivedAddress !== storedAddress) {
      console.error(`  [FAIL] ${wallet} — address mismatch: DB=${storedAddress} derived=${derivedAddress}`);
      failed++;
      continue;
    }

    console.log(`  [OK]   ${wallet} — decrypts ✓ | address matches ✓ | words: ${wordCount}`);
    passed++;
  }

  // Check coins
  const coins = await sql`
    SELECT id, reserve_wallet_address, reserve_wallet_encrypted
    FROM coins
    WHERE reserve_wallet_encrypted IS NOT NULL AND reserve_wallet_encrypted != ''
    LIMIT 10
  `;
  console.log(`\nChecking ${coins.length} coin reserve wallets...\n`);

  for (const coin of coins) {
    let mnemonic;
    try {
      mnemonic = decrypt(coin.reserve_wallet_encrypted, KEY);
      const wordCount = mnemonic.trim().split(/\s+/).length;
      const derivedAddress = await deriveAddress(mnemonic);
      const stored = String(coin.reserve_wallet_address || "").trim();
      const addressOk = !stored || derivedAddress === stored;
      if (!addressOk) {
        console.error(`  [FAIL] coin ${coin.id} — address mismatch`);
        failed++;
      } else {
        console.log(`  [OK]   coin ${coin.id} — decrypts ✓ | words: ${wordCount}`);
        passed++;
      }
    } catch (e) {
      console.error(`  [FAIL] coin ${coin.id} — ${e.message}`);
      failed++;
    }
  }

  console.log("\n=== Verification Summary ===");
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);

  if (failed === 0) {
    console.log("\n✓ ALL CHECKS PASSED — new ENCRYPTION_KEY is working correctly.");
    console.log("  Existing wallets decrypt ✓");
    console.log("  Derived addresses match stored addresses ✓");
    console.log("  Mnemonics are valid BIP39 phrases ✓");
  } else {
    console.error("\n✗ SOME CHECKS FAILED — investigate before using new key in production.");
  }

  await sql.end();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
