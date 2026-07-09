/**
 * H3 Migration — AES-256-CBC → AES-256-GCM
 *
 * Converts encrypted_mnemonic (profiles) and reserve_wallet_encrypted (coins)
 * from the legacy CBC format to AES-256-GCM.
 *
 * Safety guarantees:
 *  - Dry-run by default: prints what would change, writes nothing.
 *  - Skips rows already in GCM format (idempotent).
 *  - Each row update is independent; partial failure leaves the rest intact.
 *  - Both CBC and GCM are readable by the server at any point (dual-format decrypt).
 *  - Rollback: re-run script is safe; Neon DB backup covers full rollback.
 *
 * Usage:
 *   node backend/scripts/migrate-cbc-to-gcm.mjs            # dry-run (default)
 *   node backend/scripts/migrate-cbc-to-gcm.mjs --live     # write to DB
 */

import "dotenv/config";
import crypto from "crypto";
import postgres from "postgres";

// ── Shared crypto helpers (must match server.js exactly) ─────────────────────

function _encryptGCM(plaintext, keyStr) {
  const key = Buffer.from(keyStr);
  const iv  = crypto.randomBytes(12);
  const buf = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext, "utf8");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct  = Buffer.concat([cipher.update(buf), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `gcm:${iv.toString("hex")}:${ct.toString("hex")}:${tag.toString("hex")}`;
}

function _decryptFlexible(enc, keyStr) {
  const key   = Buffer.from(keyStr);
  const parts = String(enc).split(":");
  if (parts[0] === "gcm" && parts.length === 4) {
    const iv  = Buffer.from(parts[1], "hex");
    const ct  = Buffer.from(parts[2], "hex");
    const tag = Buffer.from(parts[3], "hex");
    const dc  = crypto.createDecipheriv("aes-256-gcm", key, iv);
    dc.setAuthTag(tag);
    return Buffer.concat([dc.update(ct), dc.final()]);
  }
  if (parts.length === 2) {
    const iv   = Buffer.from(parts[0], "hex");
    const data = Buffer.from(parts[1], "hex");
    const dc   = crypto.createDecipheriv("aes-256-cbc", key, iv);
    return Buffer.concat([dc.update(data), dc.final()]);
  }
  throw new Error("Invalid encrypted format — expected gcm:… or <iv>:<ct>");
}

// ── Setup ─────────────────────────────────────────────────────────────────────

const LIVE = process.argv.includes("--live");
const KEY  = process.env.ENCRYPTION_KEY;

if (!KEY || KEY.length !== 32) {
  console.error("✗ ENCRYPTION_KEY must be exactly 32 characters in .env");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

function isGCM(enc) {
  return typeof enc === "string" && enc.startsWith("gcm:");
}

// ── Migrate profiles.encrypted_mnemonic ───────────────────────────────────────

async function migrateProfiles() {
  console.log("\n── profiles.encrypted_mnemonic ─────────────────────────────\n");

  const rows = await sql`
    SELECT wallet, encrypted_mnemonic
    FROM   profiles
    WHERE  encrypted_mnemonic IS NOT NULL
      AND  encrypted_mnemonic != ''
    ORDER  BY wallet
  `;

  console.log(`  Total rows with encrypted_mnemonic : ${rows.length}`);

  let skipped = 0, converted = 0, failed = 0;

  for (const row of rows) {
    const enc = String(row.encrypted_mnemonic).trim();

    if (isGCM(enc)) {
      skipped++;
      continue;
    }

    // Decrypt CBC, re-encrypt GCM, verify round-trip
    let newEnc;
    try {
      const plaintext = _decryptFlexible(enc, KEY);   // returns Buffer
      newEnc = _encryptGCM(plaintext, KEY);

      // Round-trip verification before any write
      const verify = _decryptFlexible(newEnc, KEY);
      if (!plaintext.equals(verify)) throw new Error("Round-trip mismatch");
    } catch (e) {
      console.error(`  ✗ wallet=${row.wallet} — decrypt/re-encrypt failed: ${e.message}`);
      failed++;
      continue;
    }

    if (LIVE) {
      try {
        await sql`
          UPDATE profiles
          SET    encrypted_mnemonic = ${newEnc}
          WHERE  wallet = ${row.wallet}
            AND  encrypted_mnemonic = ${enc}
        `;
        converted++;
        console.log(`  ✓ wallet=${row.wallet.slice(0, 8)}… — CBC→GCM`);
      } catch (e) {
        console.error(`  ✗ wallet=${row.wallet} — DB update failed: ${e.message}`);
        failed++;
      }
    } else {
      converted++;
      console.log(`  [dry] wallet=${row.wallet.slice(0, 8)}… — would convert CBC→GCM`);
    }
  }

  console.log(`\n  Skipped (already GCM): ${skipped}`);
  console.log(`  ${LIVE ? "Converted" : "Would convert"}: ${converted}`);
  if (failed) console.log(`  Failed: ${failed}`);
  return { skipped, converted, failed };
}

// ── Migrate coins.reserve_wallet_encrypted ────────────────────────────────────

async function migrateCoins() {
  console.log("\n── coins.reserve_wallet_encrypted ──────────────────────────\n");

  const rows = await sql`
    SELECT id, reserve_wallet_encrypted
    FROM   coins
    WHERE  reserve_wallet_encrypted IS NOT NULL
      AND  reserve_wallet_encrypted != ''
    ORDER  BY id
  `;

  console.log(`  Total rows with reserve_wallet_encrypted : ${rows.length}`);

  let skipped = 0, converted = 0, failed = 0;

  for (const row of rows) {
    const enc = String(row.reserve_wallet_encrypted).trim();

    if (isGCM(enc)) {
      skipped++;
      continue;
    }

    let newEnc;
    try {
      const plaintext = _decryptFlexible(enc, KEY);   // binary Buffer
      newEnc = _encryptGCM(plaintext, KEY);

      // Round-trip verification
      const verify = _decryptFlexible(newEnc, KEY);
      if (!plaintext.equals(verify)) throw new Error("Round-trip mismatch");
    } catch (e) {
      console.error(`  ✗ coin=${row.id} — decrypt/re-encrypt failed: ${e.message}`);
      failed++;
      continue;
    }

    if (LIVE) {
      try {
        await sql`
          UPDATE coins
          SET    reserve_wallet_encrypted = ${newEnc}
          WHERE  id = ${row.id}
            AND  reserve_wallet_encrypted = ${enc}
        `;
        converted++;
        console.log(`  ✓ coin=${row.id.slice(0, 8)}… — CBC→GCM`);
      } catch (e) {
        console.error(`  ✗ coin=${row.id} — DB update failed: ${e.message}`);
        failed++;
      }
    } else {
      converted++;
      console.log(`  [dry] coin=${row.id.slice(0, 8)}… — would convert CBC→GCM`);
    }
  }

  console.log(`\n  Skipped (already GCM): ${skipped}`);
  console.log(`  ${LIVE ? "Converted" : "Would convert"}: ${converted}`);
  if (failed) console.log(`  Failed: ${failed}`);
  return { skipped, converted, failed };
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log("=== CBC → GCM Migration ===");
console.log(`Mode: ${LIVE ? "LIVE (writing to DB)" : "DRY-RUN (no writes)"}`);
if (!LIVE) console.log("  Run with --live to apply changes.\n");

try {
  const p = await migrateProfiles();
  const c = await migrateCoins();

  const totalFailed = p.failed + c.failed;
  const totalConverted = p.converted + c.converted;

  console.log("\n=== Summary ===");
  console.log(`  profiles : ${p.converted} converted, ${p.skipped} skipped, ${p.failed} failed`);
  console.log(`  coins    : ${c.converted} converted, ${c.skipped} skipped, ${c.failed} failed`);

  if (totalFailed > 0) {
    console.log(`\n  ⚠ ${totalFailed} row(s) failed — inspect errors above.`);
    console.log("    Failed rows remain in CBC format and will continue to decrypt correctly.");
    process.exit(1);
  } else if (totalConverted === 0) {
    console.log("\n  ✅ Nothing to migrate — all rows already in GCM format.");
  } else {
    console.log(
      LIVE
        ? `\n  ✅ Migration complete — ${totalConverted} row(s) converted to GCM.`
        : `\n  ✅ Dry-run complete — ${totalConverted} row(s) would be converted.`
    );
  }
} finally {
  await sql.end();
}
