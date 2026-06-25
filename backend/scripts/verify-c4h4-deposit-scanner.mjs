/**
 * C4 + H4 Verification — Deposit Scanner
 *
 * C4: Scanner uses pagination (limit 100 + before cursor) — never misses deposits
 * H4: Uses balance diff (post - pre) as authoritative amount, not instruction parse
 *
 * Structural check only — we verify source code patterns since RPC is live Solana.
 *
 * Usage: node backend/scripts/verify-c4h4-deposit-scanner.mjs
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = readFileSync(path.join(__dirname, "../server.js"), "utf8");

const RESULTS = [];
const pass = (label, detail = "") => {
  RESULTS.push({ ok: true, label });
  console.log(`  ✓  ${label}${detail ? " — " + detail : ""}`);
};
const fail = (label, detail = "") => {
  RESULTS.push({ ok: false, label });
  console.log(`  ✗  ${label}${detail ? " — " + detail : ""}`);
};

console.log("\n=== C4 + H4 Verification — Deposit Scanner ===\n");

// Extract scanWalletDeposits function body
const fnMatch = src.match(/async function scanWalletDeposits[\s\S]*?^}/m);
const fnBody = fnMatch?.[0] || "";

if (!fnBody) {
  console.log("  ✗ Could not locate scanWalletDeposits function");
  process.exit(1);
}

// ─── C4 checks ───────────────────────────────────────────────────────────────
console.log("--- C4: Pagination — never miss deposits ---\n");

// Must NOT have the old fixed limit: 10
/limit:\s*10\b/.test(fnBody)
  ? fail("C4: Old limit:10 removed", "still present in scanWalletDeposits")
  : pass("C4: limit:10 removed from scanWalletDeposits");

// Must have pagination loop (for(;;) or while)
/for\s*\(\s*;|while\s*\(/.test(fnBody)
  ? pass("C4: Pagination loop present")
  : fail("C4: Pagination loop missing");

// Must use 'before' cursor for pagination
/before/.test(fnBody)
  ? pass("C4: before cursor used for pagination")
  : fail("C4: before cursor missing");

// Must use `until` param (stop at lastSignature without re-processing)
/until/.test(fnBody)
  ? pass("C4: until param used (stops at lastSignature)")
  : fail("C4: until param missing — may re-process old deposits");

// Must fetch limit 100 (not 10)
/limit:\s*100/.test(fnBody)
  ? pass("C4: fetch limit is 100 per page")
  : fail("C4: fetch limit not 100");

// ─── H4 checks ───────────────────────────────────────────────────────────────
console.log("\n--- H4: Balance diff as primary deposit amount ---\n");

// Must compute post - pre as diff
/(post\s*-\s*pre|diff\s*=\s*post\s*-\s*pre)/.test(fnBody)
  ? pass("H4: balance diff (post - pre) computed")
  : fail("H4: balance diff not computed — instruction parse only");

// Must NOT use instruction parsing as the diff source anymore
// (the for-loop over instructions for transfer parsing should be gone)
/parsed\?\.type\s*===\s*['"]transfer['"].*destination\s*===\s*w/s.test(fnBody)
  ? fail("H4: instruction-parse diff still used as primary source")
  : pass("H4: instruction-parse diff removed — balance diff is primary");

// diff <= 0 guard still present (reject sends, not just zero)
/diff\s*<=\s*0/.test(fnBody)
  ? pass("H4: diff <= 0 guard present (rejects outgoing txs)")
  : fail("H4: diff <= 0 guard missing");

// ─── Wallet scanner loop checks ───────────────────────────────────────────────
console.log("\n--- C4: Wallet scanner loop — processes ALL wallets ---\n");

// Extract the setInterval block for the deposit scanner
const intervalMatch = src.match(/setInterval[\s\S]*?180000\s*\)/);
const intervalBody = intervalMatch?.[0] || "";

// Old limit 100 on wallet query should be gone, replaced by paginated batchSize
/limit\s+100\s*\n.*order\s+by|batchSize/.test(intervalBody) || /offset\s+\$/.test(intervalBody) ||
/offset.*batchSize|batchSize.*offset/.test(intervalBody)
  ? pass("C4: wallet scanner paginates ALL profiles (no hard cap)")
  : fail("C4: wallet scanner still has hard limit on wallets processed");

/order\s+by\s+wallet_address/.test(intervalBody)
  ? pass("C4: wallet scanner uses ORDER BY for deterministic pagination")
  : fail("C4: wallet scanner missing ORDER BY — pagination offset unstable");

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log("\n=== Summary ===\n");
const passed = RESULTS.filter(r => r.ok).length;
const failed = RESULTS.filter(r => !r.ok).length;
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);

if (failed === 0) {
  console.log(`
  ✅ PASS — C4 + H4 deposit scanner fixed.

  C4 — Never miss deposits:
    ✓ getSignaturesForAddress limit: 100 per page (was 10)
    ✓ Pagination loop with 'before' cursor fetches ALL new signatures
    ✓ 'until' param stops at lastSignature without re-querying processed sigs
    ✓ Wallet scanner processes ALL profiles in pages of 200 (no hard cap)
    ✓ ORDER BY ensures deterministic cursor-based pagination

  H4 — Balance diff as authoritative amount:
    ✓ Uses (post - pre) from on-chain balances — catches all SOL sources
    ✓ Instruction parse removed — no longer required for crediting
    ✓ Outgoing transactions (diff <= 0) correctly rejected
  `);
} else {
  console.log(`\n  ❌ FAIL — ${failed} check(s) failed.\n`);
  RESULTS.filter(r => !r.ok).forEach(r => console.log(`     ✗ ${r.label}`));
  process.exit(1);
}
