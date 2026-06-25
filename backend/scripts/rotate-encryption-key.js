/**
 * Encryption Key Rotation Script
 *
 * Usage:
 *   OLD_ENCRYPTION_KEY="<old 32-char key>" node backend/scripts/rotate-encryption-key.js
 *
 * Prerequisites:
 *   - ENCRYPTION_KEY in .env (or env) must already be set to the NEW key
 *   - OLD_ENCRYPTION_KEY env var must be set to the key currently in the database
 *   - Run BEFORE restarting the server with the new key
 *
 * What it does:
 *   1. Reads every encrypted_mnemonic from profiles table
 *   2. Reads every reserve_wallet_encrypted from coins table
 *   3. Decrypts each with OLD_ENCRYPTION_KEY
 *   4. Re-encrypts with ENCRYPTION_KEY (new)
 *   5. Updates the row in-place — no data is deleted
 *
 * Safe to re-run: rows already on the new key are skipped automatically.
 */

import "dotenv/config";
import crypto from "crypto";
import postgres from "postgres";

const OLD_KEY = process.env.OLD_ENCRYPTION_KEY;
const NEW_KEY = process.env.ENCRYPTION_KEY;

// ---- Pre-flight checks ----
if (!OLD_KEY) {
  console.error("ERROR: OLD_ENCRYPTION_KEY env var is not set.");
  console.error("  Example: OLD_ENCRYPTION_KEY=\"12345678901234567890123456789012\" node backend/scripts/rotate-encryption-key.js");
  process.exit(1);
}
if (OLD_KEY.length !== 32) {
  console.error(`ERROR: OLD_ENCRYPTION_KEY must be exactly 32 characters (got ${OLD_KEY.length}).`);
  process.exit(1);
}
if (!NEW_KEY) {
  console.error("ERROR: ENCRYPTION_KEY (new key) is not set in .env or environment.");
  process.exit(1);
}
if (NEW_KEY.length !== 32) {
  console.error(`ERROR: ENCRYPTION_KEY (new) must be exactly 32 characters (got ${NEW_KEY.length}).`);
  process.exit(1);
}
if (OLD_KEY === NEW_KEY) {
  console.error("ERROR: OLD_ENCRYPTION_KEY and ENCRYPTION_KEY are identical — nothing to rotate.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 3 });

// ---- Crypto helpers ----
function tryDecrypt(encryptedText, key) {
  const parts = String(encryptedText || "").trim().split(":");
  if (parts.length !== 2) throw new Error("Invalid format (expected iv:ciphertext)");
  const iv = Buffer.from(parts[0], "hex");
  if (iv.length !== 16) throw new Error("IV must be 16 bytes");
  const data = Buffer.from(parts[1], "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
  let decrypted = decipher.update(data);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString("utf8");
}

function encryptWithKey(plaintext, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
  let encrypted = cipher.update(Buffer.from(plaintext, "utf8"));
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

// ---- Migration logic ----
async function migrateField({ label, rows, oldKey, newKey, updateFn }) {
  let migrated = 0;
  let alreadyNew = 0;
  let failed = 0;

  for (const row of rows) {
    const enc = String(row.encrypted || "").trim();
    if (!enc) continue;

    // Try decrypting with new key first — if it works, this row is already migrated
    let isAlreadyMigrated = false;
    try {
      tryDecrypt(enc, newKey);
      isAlreadyMigrated = true;
    } catch {}

    if (isAlreadyMigrated) {
      alreadyNew++;
      continue;
    }

    // Decrypt with old key
    let plaintext;
    try {
      plaintext = tryDecrypt(enc, oldKey);
    } catch (e) {
      console.error(`  [FAIL] ${label} ${row.id} — cannot decrypt with old key: ${e.message}`);
      failed++;
      continue;
    }

    // Re-encrypt with new key
    let newEnc;
    try {
      newEnc = encryptWithKey(plaintext, newKey);
    } catch (e) {
      console.error(`  [FAIL] ${label} ${row.id} — re-encrypt failed: ${e.message}`);
      failed++;
      continue;
    }

    // Verify the new ciphertext round-trips correctly before writing
    try {
      const verified = tryDecrypt(newEnc, newKey);
      if (verified !== plaintext) throw new Error("Round-trip mismatch");
    } catch (e) {
      console.error(`  [FAIL] ${label} ${row.id} — verification failed: ${e.message}`);
      failed++;
      continue;
    }

    // Write to DB
    try {
      await updateFn(row.id, newEnc);
      migrated++;
      console.log(`  [OK]   ${label} ${row.id}`);
    } catch (e) {
      console.error(`  [FAIL] ${label} ${row.id} — DB update failed: ${e.message}`);
      failed++;
    }
  }

  return { migrated, alreadyNew, failed };
}

async function main() {
  console.log("=== Fun.Run Encryption Key Rotation ===");
  console.log(`Old key: ${"*".repeat(OLD_KEY.length)} (${OLD_KEY.length} chars)`);
  console.log(`New key: ${"*".repeat(NEW_KEY.length)} (${NEW_KEY.length} chars)\n`);

  // ---- Profiles: encrypted_mnemonic ----
  const profileRows = await sql`
    SELECT wallet AS id, encrypted_mnemonic AS encrypted
    FROM profiles
    WHERE encrypted_mnemonic IS NOT NULL AND encrypted_mnemonic != ''
  `;
  console.log(`Profiles with encrypted_mnemonic: ${profileRows.length}`);

  const profileResult = await migrateField({
    label: "profile",
    rows: profileRows,
    oldKey: OLD_KEY,
    newKey: NEW_KEY,
    updateFn: async (wallet, newEnc) => {
      await sql`
        UPDATE profiles
        SET encrypted_mnemonic = ${newEnc}, updated_at = now()
        WHERE wallet = ${wallet}
      `;
    },
  });

  // ---- Coins: reserve_wallet_encrypted ----
  const coinRows = await sql`
    SELECT id, reserve_wallet_encrypted AS encrypted
    FROM coins
    WHERE reserve_wallet_encrypted IS NOT NULL AND reserve_wallet_encrypted != ''
  `;
  console.log(`\nCoins with reserve_wallet_encrypted: ${coinRows.length}`);

  const coinResult = await migrateField({
    label: "coin",
    rows: coinRows,
    oldKey: OLD_KEY,
    newKey: NEW_KEY,
    updateFn: async (id, newEnc) => {
      await sql`
        UPDATE coins
        SET reserve_wallet_encrypted = ${newEnc}
        WHERE id = ${id}
      `;
    },
  });

  // ---- Summary ----
  const totalMigrated = profileResult.migrated + coinResult.migrated;
  const totalAlready  = profileResult.alreadyNew + coinResult.alreadyNew;
  const totalFailed   = profileResult.failed + coinResult.failed;

  console.log("\n=== Summary ===");
  console.log(`  Migrated:         ${totalMigrated}`);
  console.log(`  Already on new key: ${totalAlready}`);
  console.log(`  Failed:           ${totalFailed}`);

  if (totalFailed > 0) {
    console.error("\nERROR: Some records failed migration.");
    console.error("Do NOT restart the server with the new ENCRYPTION_KEY until all failures are resolved.");
    await sql.end();
    process.exit(1);
  }

  console.log("\nSUCCESS: All records migrated. You can now restart the server with the new ENCRYPTION_KEY.");
  await sql.end();
}

main().catch((e) => {
  console.error("Fatal error:", e.message || e);
  process.exit(1);
});
