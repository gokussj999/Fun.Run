/**
 * Deposit Double-Credit Race Condition Verification
 *
 * Proves that creditDeposit() is idempotent even under concurrent execution.
 *
 * What it does:
 *   1. Creates an isolated test profile with known balance.
 *   2. Fires N concurrent creditDeposit() calls with the SAME txHash.
 *   3. Verifies balance increased by exactly depositAmount × 1 (not × N).
 *   4. Verifies deposits table has exactly 1 row for that txHash.
 *   5. Cleans up all test data.
 *
 * Usage: node backend/scripts/verify-deposit-atomicity.mjs
 */

import "dotenv/config";
import crypto from "crypto";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 20 });

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ---- Atomic creditDeposit (exact copy of server.js implementation) ----
async function creditDeposit({ wallet, txHash, amount }) {
  const w = String(wallet || "").trim();
  const hash = String(txHash || "").trim();
  if (!w || !hash) return false;
  const amt = Math.max(0, safeNum(amount, 0));
  if (amt <= 0) return false;

  const primaryWallet = await sql.begin(async (tx) => {
    const inserted = await tx`
      insert into deposits (id, wallet, tx_hash, amount, token, status, created_at)
      values (
        ${crypto.randomUUID()},
        ${w},
        ${hash},
        ${amt},
        'SOL',
        'confirmed',
        now()
      )
      on conflict (tx_hash) do nothing
    `;

    if (inserted.count === 0) return null;

    const ownerRows = await tx`
      select wallet from profiles
      where wallet = ${w} or wallet_address = ${w}
      limit 1
    `;
    const primary = String(ownerRows?.[0]?.wallet || w).trim();
    if (!primary) return null;

    await tx`
      update profiles
      set run_balance = run_balance + ${amt},
          updated_at  = now()
      where wallet = ${primary}
    `;

    return primary;
  });

  return !!primaryWallet;
}

// ---- Test runner ----
async function runTest({ concurrency, label }) {
  const testWallet  = `test_race_${crypto.randomUUID().slice(0, 8)}`;
  const testTxHash  = `test_tx_${crypto.randomUUID()}`;
  const depositAmt  = 1.5;
  const initialBal  = 10.0;

  // Setup: insert isolated test profile
  await sql`
    insert into profiles (wallet, run_balance, created_at, updated_at)
    values (${testWallet}, ${initialBal}, now(), now())
    on conflict (wallet) do nothing
  `;

  console.log(`\n[${label}] test_wallet  : ${testWallet}`);
  console.log(`[${label}] tx_hash      : ${testTxHash}`);
  console.log(`[${label}] concurrency  : ${concurrency} simultaneous calls`);
  console.log(`[${label}] deposit_amt  : ${depositAmt} SOL`);
  console.log(`[${label}] initial_bal  : ${initialBal} SOL`);
  console.log(`[${label}] expected_bal : ${initialBal + depositAmt} SOL (exactly one credit)`);

  // Fire N concurrent creditDeposit calls with the SAME txHash
  const start = Date.now();
  const results = await Promise.allSettled(
    Array.from({ length: concurrency }, () =>
      creditDeposit({ wallet: testWallet, txHash: testTxHash, amount: depositAmt })
    )
  );
  const elapsed = Date.now() - start;

  const credited = results.filter(r => r.status === "fulfilled" && r.value === true).length;
  const skipped  = results.filter(r => r.status === "fulfilled" && r.value === false).length;
  const errors   = results.filter(r => r.status === "rejected").length;

  console.log(`[${label}] elapsed      : ${elapsed}ms`);
  console.log(`[${label}] credited     : ${credited} (expected: 1)`);
  console.log(`[${label}] skipped      : ${skipped} (expected: ${concurrency - 1})`);
  console.log(`[${label}] errors       : ${errors}   (expected: 0)`);

  // Verify final balance
  const balRows = await sql`select run_balance from profiles where wallet = ${testWallet}`;
  const finalBal = safeNum(balRows[0]?.run_balance, 0);

  // Verify deposit row count
  const depRows = await sql`select count(*)::int as cnt from deposits where tx_hash = ${testTxHash}`;
  const depCount = safeNum(depRows[0]?.cnt, 0);

  const balCorrect  = Math.abs(finalBal - (initialBal + depositAmt)) < 0.000001;
  const depCorrect  = depCount === 1;
  const cntCorrect  = credited === 1;

  console.log(`[${label}] final_bal    : ${finalBal} SOL  → ${balCorrect  ? "✓ CORRECT" : "✗ WRONG — double credit detected!"}`);
  console.log(`[${label}] deposit_rows : ${depCount}      → ${depCorrect  ? "✓ CORRECT" : "✗ WRONG — duplicate rows in deposits table!"}`);
  console.log(`[${label}] credit_count : ${credited}      → ${cntCorrect  ? "✓ CORRECT" : "✗ WRONG — creditDeposit returned true multiple times!"}`);

  const passed = balCorrect && depCorrect && cntCorrect;
  console.log(`[${label}] RESULT       : ${passed ? "✅ PASS" : "❌ FAIL"}`);

  // Cleanup
  await sql`delete from deposits where tx_hash = ${testTxHash}`;
  await sql`delete from profiles  where wallet  = ${testWallet}`;

  return passed;
}

async function main() {
  console.log("=== Deposit Double-Credit Race Condition Verification ===");
  console.log("Database:", process.env.DATABASE_URL?.replace(/:[^@]+@/, ":***@"));

  const tests = [
    { concurrency: 5,   label: "TEST-1 ( 5 concurrent)" },
    { concurrency: 20,  label: "TEST-2 (20 concurrent)" },
    { concurrency: 50,  label: "TEST-3 (50 concurrent)" },
  ];

  const results = [];
  for (const t of tests) {
    results.push(await runTest(t));
  }

  console.log("\n=== Summary ===");
  const allPassed = results.every(Boolean);
  results.forEach((r, i) => console.log(`  ${tests[i].label} : ${r ? "✅ PASS" : "❌ FAIL"}`));

  if (allPassed) {
    console.log("\n✓ ALL TESTS PASSED");
    console.log("  Proof: same txHash processed concurrently N times → exactly 1 credit applied every time.");
    console.log("  Guarantee source: PostgreSQL UNIQUE constraint on deposits.tx_hash +");
    console.log("  ON CONFLICT DO NOTHING + sql.begin atomic transaction.");
  } else {
    console.error("\n✗ SOME TESTS FAILED — double credit vulnerability still present.");
    process.exit(1);
  }

  await sql.end();
}

main().catch(e => { console.error("Fatal:", e.message || e); process.exit(1); });
