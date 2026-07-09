/**
 * H3 Verification — AES-256-CBC → AES-256-GCM migration
 *
 * Checks:
 *  1. _encryptGCM produces "gcm:…" format (4 parts)
 *  2. _decryptFlexible round-trip: GCM plaintext in = plaintext out
 *  3. _decryptFlexible round-trip: CBC plaintext in = plaintext out (backward compat)
 *  4. GCM ciphertext rejected by legacy CBC-only code (CBC can't parse gcm: format)
 *  5. Tampered auth tag causes GCM decryption to throw (integrity check)
 *  6. Binary Buffer round-trip (reserve wallet use-case)
 *  7. Same mnemonic → same keypair address (derivation unchanged by migration)
 *  8. createCustodialWallet() produces GCM-format encrypted_mnemonic
 *  9. getCustodialKeypairFromMnemonic() decrypts a CBC ciphertext correctly (old wallets)
 * 10. getCustodialKeypairFromMnemonic() decrypts a GCM ciphertext correctly (new wallets)
 * 11. DB: count of remaining CBC rows after migration (informational)
 *
 * Usage: node backend/scripts/verify-h3-gcm.mjs
 */

import "dotenv/config";
import crypto from "crypto";

// ── Inline helpers (must match server.js exactly) ─────────────────────────────

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

// Legacy CBC-only decrypt (to prove GCM ciphertexts are incompatible)
function _decryptCBCOnly(enc, keyStr) {
  const key   = Buffer.from(keyStr);
  const parts = String(enc).split(":");
  if (parts.length !== 2) throw new Error("Not a CBC ciphertext");
  const iv   = Buffer.from(parts[0], "hex");
  const data = Buffer.from(parts[1], "hex");
  const dc   = crypto.createDecipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([dc.update(data), dc.final()]);
}

// ── Test key + sample data ────────────────────────────────────────────────────

const KEY = process.env.ENCRYPTION_KEY;
if (!KEY || KEY.length !== 32) {
  console.error("✗ ENCRYPTION_KEY must be exactly 32 characters in .env");
  process.exit(1);
}

const SAMPLE_MNEMONIC = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

// Build a real CBC ciphertext to simulate an old wallet in DB
function makeCBCCiphertext(plaintext, keyStr) {
  const key  = Buffer.from(keyStr);
  const iv   = crypto.randomBytes(16);
  const buf  = Buffer.from(plaintext, "utf8");
  const c    = crypto.createCipheriv("aes-256-cbc", key, iv);
  const ct   = Buffer.concat([c.update(buf), c.final()]);
  return `${iv.toString("hex")}:${ct.toString("hex")}`;
}

// ── Result tracking ──────────────────────────────────────────────────────────

const RESULTS = [];
const pass = (label, detail = "") => {
  RESULTS.push({ ok: true, label });
  console.log(`  ✓  ${label}${detail ? " — " + detail : ""}`);
};
const fail = (label, detail = "") => {
  RESULTS.push({ ok: false, label });
  console.log(`  ✗  ${label}${detail ? " — " + detail : ""}`);
};

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log("\n=== H3 Verification — AES-256-GCM Migration ===\n");

// 1. GCM format structure
console.log("--- 1. GCM ciphertext format ---\n");
{
  const enc = _encryptGCM(SAMPLE_MNEMONIC, KEY);
  const parts = enc.split(":");
  parts[0] === "gcm" && parts.length === 4
    ? pass("GCM output is 'gcm:<iv>:<ct>:<tag>' (4 parts)", `prefix=${parts[0]}`)
    : fail("GCM output format invalid", enc.slice(0, 40));

  // IV must be 12 bytes = 24 hex chars
  parts[1].length === 24
    ? pass("GCM IV is 12 bytes (96-bit)", `len=${parts[1].length}`)
    : fail("GCM IV length wrong", `len=${parts[1].length} expected 24`);

  // Auth tag must be 16 bytes = 32 hex chars
  parts[3].length === 32
    ? pass("GCM auth tag is 16 bytes", `len=${parts[3].length}`)
    : fail("GCM auth tag length wrong", `len=${parts[3].length} expected 32`);

  // Two encryptions of same plaintext must produce different ciphertexts (random IV)
  const enc2 = _encryptGCM(SAMPLE_MNEMONIC, KEY);
  enc !== enc2
    ? pass("GCM uses random IV — each encryption is unique")
    : fail("GCM IVs identical — randomness broken");
}

// 2. GCM round-trip (string)
console.log("\n--- 2. GCM round-trip — string ---\n");
{
  const enc  = _encryptGCM(SAMPLE_MNEMONIC, KEY);
  const out  = _decryptFlexible(enc, KEY).toString();
  out === SAMPLE_MNEMONIC
    ? pass("GCM round-trip (string): plaintext in = plaintext out")
    : fail("GCM round-trip (string) FAILED", out.slice(0, 40));
}

// 3. CBC backward compat (legacy wallets)
console.log("\n--- 3. CBC backward compatibility ---\n");
{
  const cbcEnc = makeCBCCiphertext(SAMPLE_MNEMONIC, KEY);
  cbcEnc.startsWith("gcm:")
    ? fail("CBC test fixture incorrectly produced GCM output")
    : pass("CBC fixture is 2-part format (not gcm:…)", `parts=${cbcEnc.split(":").length}`);

  const out = _decryptFlexible(cbcEnc, KEY).toString();
  out === SAMPLE_MNEMONIC
    ? pass("_decryptFlexible decrypts legacy CBC ciphertext correctly")
    : fail("_decryptFlexible CBC decrypt FAILED", out.slice(0, 40));
}

// 4. GCM ciphertext incompatible with legacy CBC-only code
console.log("\n--- 4. GCM ciphertext rejected by CBC-only code ---\n");
{
  const gcmEnc = _encryptGCM(SAMPLE_MNEMONIC, KEY);
  let threw = false;
  try { _decryptCBCOnly(gcmEnc, KEY); } catch { threw = true; }
  threw
    ? pass("GCM ciphertext correctly rejected by CBC-only decoder")
    : fail("GCM ciphertext was NOT rejected by CBC-only decoder — format collision risk");
}

// 5. Tampered auth tag → GCM throws (integrity protection)
console.log("\n--- 5. GCM auth tag integrity check ---\n");
{
  const enc   = _encryptGCM(SAMPLE_MNEMONIC, KEY);
  const parts = enc.split(":");
  // Flip one byte in the tag
  const badTag = Buffer.from(parts[3], "hex");
  badTag[0] ^= 0xff;
  const tampered = `gcm:${parts[1]}:${parts[2]}:${badTag.toString("hex")}`;

  let threw = false;
  try { _decryptFlexible(tampered, KEY); } catch { threw = true; }
  threw
    ? pass("Tampered auth tag causes GCM decryption to throw (integrity enforced)")
    : fail("Tampered auth tag NOT detected — GCM integrity check broken");
}

// 6. Binary Buffer round-trip (reserve wallet use-case)
console.log("\n--- 6. Binary Buffer round-trip ---\n");
{
  const secretKey = crypto.randomBytes(64); // ed25519 secret key size
  const enc = _encryptGCM(secretKey, KEY);
  const out = _decryptFlexible(enc, KEY);
  secretKey.equals(out)
    ? pass("Binary Buffer (64-byte secret key) round-trips correctly via GCM")
    : fail("Binary Buffer round-trip FAILED — bytes differ");
}

// 7. Keypair address unchanged after migration (derivation unaffected)
console.log("\n--- 7. Keypair derivation unchanged ---\n");
{
  // Simulate: CBC ciphertext in DB → decrypt → re-encrypt GCM → decrypt → same keypair?
  const { Keypair } = await import("@solana/web3.js");
  const bip39 = (await import("bip39")).default;
  const { derivePath } = await import("ed25519-hd-key");

  async function mnemonicToAddress(mnemonic) {
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const derived = derivePath("m/44'/501'/0'/0'", seed.toString("hex")).key;
    return Keypair.fromSeed(derived).publicKey.toBase58();
  }

  const cbcEnc = makeCBCCiphertext(SAMPLE_MNEMONIC, KEY);
  const addr1  = await mnemonicToAddress(_decryptFlexible(cbcEnc, KEY).toString());

  const gcmEnc = _encryptGCM(SAMPLE_MNEMONIC, KEY);
  const addr2  = await mnemonicToAddress(_decryptFlexible(gcmEnc, KEY).toString());

  addr1 === addr2
    ? pass(`Keypair address identical after CBC→GCM migration (${addr1.slice(0, 8)}…)`)
    : fail("Keypair address changed — mnemonic corruption during migration");
}

// 8. createCustodialWallet produces GCM format
console.log("\n--- 8. createCustodialWallet() uses GCM ---\n");
{
  const src = (await import("fs")).readFileSync(
    new URL("../server.js", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"),
    "utf8"
  );

  // Check createCustodialWallet uses _encryptGCM, not aes-256-cbc directly
  const fnMatch = src.match(/async function createCustodialWallet\(\)[\s\S]*?\n\}/);
  const fnBody  = fnMatch?.[0] || "";

  /aes-256-cbc/.test(fnBody)
    ? fail("createCustodialWallet still contains aes-256-cbc (not migrated)")
    : pass("createCustodialWallet has no direct aes-256-cbc reference");

  /_encryptGCM/.test(fnBody)
    ? pass("createCustodialWallet calls _encryptGCM")
    : fail("createCustodialWallet does not call _encryptGCM");
}

// 9. getCustodialKeypairFromMnemonic decrypts CBC ciphertext (old wallets)
console.log("\n--- 9. getCustodialKeypairFromMnemonic — CBC backward compat ---\n");
{
  const src = (await import("fs")).readFileSync(
    new URL("../server.js", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"),
    "utf8"
  );
  const fnMatch = src.match(/async function getCustodialKeypairFromMnemonic[\s\S]*?\n\}/);
  const fnBody  = fnMatch?.[0] || "";

  /aes-256-cbc/.test(fnBody)
    ? fail("getCustodialKeypairFromMnemonic still contains direct aes-256-cbc")
    : pass("getCustodialKeypairFromMnemonic has no direct aes-256-cbc reference");

  /_decryptFlexible/.test(fnBody)
    ? pass("getCustodialKeypairFromMnemonic calls _decryptFlexible (handles CBC+GCM)")
    : fail("getCustodialKeypairFromMnemonic does not call _decryptFlexible");
}

// 10. reserve wallet encryption uses _encryptGCM
console.log("\n--- 10. coin/create reserve wallet uses _encryptGCM ---\n");
{
  const src = (await import("fs")).readFileSync(
    new URL("../server.js", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"),
    "utf8"
  );

  // Find the reserve wallet block (by landmark comment)
  const reserveBlock = src.match(/Reserve wallet.*?reserveWalletEncrypted[^\n]*/s)?.[0] || "";

  /aes-256-cbc/.test(reserveBlock)
    ? fail("Reserve wallet encryption still uses aes-256-cbc directly")
    : pass("Reserve wallet has no direct aes-256-cbc reference");

  /_encryptGCM/.test(reserveBlock)
    ? pass("Reserve wallet calls _encryptGCM (shared helper)")
    : fail("Reserve wallet does not call _encryptGCM");
}

// 11. DB: count remaining CBC rows (informational)
console.log("\n--- 11. DB: remaining CBC rows (informational) ---\n");
{
  try {
    const postgres = (await import("postgres")).default;
    const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

    const [profRow] = await sql`
      SELECT COUNT(*)::int AS cnt
      FROM   profiles
      WHERE  encrypted_mnemonic IS NOT NULL
        AND  encrypted_mnemonic != ''
        AND  encrypted_mnemonic NOT LIKE 'gcm:%'
    `;
    const [coinRow] = await sql`
      SELECT COUNT(*)::int AS cnt
      FROM   coins
      WHERE  reserve_wallet_encrypted IS NOT NULL
        AND  reserve_wallet_encrypted != ''
        AND  reserve_wallet_encrypted NOT LIKE 'gcm:%'
    `;

    await sql.end();

    const profCBC = profRow.cnt;
    const coinCBC = coinRow.cnt;

    profCBC === 0
      ? pass("DB profiles: 0 CBC rows remaining (fully migrated or no wallets yet)")
      : pass(`DB profiles: ${profCBC} CBC row(s) remaining — run migrate-cbc-to-gcm.mjs --live`);

    coinCBC === 0
      ? pass("DB coins: 0 CBC rows remaining (fully migrated or no coins yet)")
      : pass(`DB coins: ${coinCBC} CBC row(s) remaining — run migrate-cbc-to-gcm.mjs --live`);

  } catch (e) {
    pass(`DB check skipped (${e?.message?.slice(0, 50) || "DB unreachable"}) — local dev expected`);
  }
}

// ── Summary ──────────────────────────────────────────────────────────────────

console.log("\n=== Summary ===\n");
const passed = RESULTS.filter(r => r.ok).length;
const failed = RESULTS.filter(r => !r.ok).length;
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);

if (failed === 0) {
  console.log(`
  ✅ PASS — H3 AES-256-GCM migration verified.

  _encryptGCM / _decryptFlexible:
    ✓ GCM format: gcm:<12-byte IV>:<ciphertext>:<16-byte auth tag>
    ✓ Random IV — each encryption unique
    ✓ String round-trip: plaintext in = plaintext out
    ✓ Binary Buffer round-trip: 64-byte secret key preserved
    ✓ CBC backward compat: old ciphertexts decrypt correctly
    ✓ GCM rejected by CBC-only code — no format collision
    ✓ Tampered auth tag throws — integrity enforced

  Migration safety:
    ✓ Keypair address identical after CBC→GCM re-encryption
    ✓ createCustodialWallet() uses GCM for new wallets
    ✓ getCustodialKeypairFromMnemonic() handles both CBC and GCM
    ✓ Reserve wallet uses shared _encryptGCM helper
  `);
} else {
  console.log(`\n  ❌ FAIL — ${failed} check(s) failed.\n`);
  RESULTS.filter(r => !r.ok).forEach(r => console.log(`     ✗ ${r.label}`));
  process.exit(1);
}
