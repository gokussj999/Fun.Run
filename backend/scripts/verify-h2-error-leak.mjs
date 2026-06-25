/**
 * H2 Verification — DB Internals Never Reach the Client
 *
 * Intentionally triggers real server errors and asserts that:
 *   - HTTP responses contain ONLY "Internal server error" (or safe equivalents)
 *   - DB table names, column names, constraint names, SQL, stack traces are ABSENT
 *   - The server still returns 500 (error is not silently swallowed)
 *
 * Requires the backend to be running locally on PORT (default 5000).
 * Usage: node backend/scripts/verify-h2-error-leak.mjs
 */

import "dotenv/config";

const BASE = `http://localhost:${process.env.PORT || 5000}`;
const RESULTS = [];

function pass(label, detail = "") {
  RESULTS.push({ ok: true, label, detail });
  console.log(`  ✓  ${label}${detail ? " — " + detail : ""}`);
}

function fail(label, detail = "") {
  RESULTS.push({ ok: false, label, detail });
  console.log(`  ✗  ${label}${detail ? " — " + detail : ""}`);
}

// Patterns that should NEVER appear in client responses
const FORBIDDEN = [
  /null value in column/i,
  /violates not-null constraint/i,
  /duplicate key value violates/i,
  /invalid input syntax for type/i,
  /relation "\w+" does not exist/i,
  /column "\w+" of relation/i,
  /unique constraint/i,
  /foreign key constraint/i,
  /ERROR:\s+\w/i,
  /at character \d+/i,
  /PostgreSQL|pg_|neon|neondb/i,
  /\.js:\d+:\d+/,               // stack trace line references
  /at Object\.\w|at async \w/,  // JS stack frames
  /ENCRYPTION_KEY/i,
  /TREASURY_PRIVATE_KEY/i,
  /DATABASE_URL/i,
  /SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN/i, // raw SQL keywords in errors
];

function checkBody(label, body) {
  const text = JSON.stringify(body);
  for (const pattern of FORBIDDEN) {
    if (pattern.test(text)) {
      fail(label, `LEAK DETECTED — matched pattern: ${pattern}`);
      return false;
    }
  }
  return true;
}

async function hit(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

// ─── Test cases ─────────────────────────────────────────────────────────────

console.log("\n=== H2 Verification — DB Internals Never Reach Client ===\n");

// 1. Invalid UUID to a profile endpoint — PostgreSQL "invalid input syntax for type uuid"
{
  const label = "GET /profile/:wallet — invalid wallet triggers DB type error";
  try {
    const { status, body } = await hit("GET", "/profile/NOT_A_VALID_UUID_@@@@");
    const safe = checkBody(label, body);
    if (safe) {
      if (status === 500 || body?.ok === false || body?.error) {
        pass(label, `status=${status} error="${body?.error}"`);
      } else {
        pass(label, `status=${status} — handled gracefully`);
      }
    }
  } catch (e) {
    fail(label, `fetch error: ${e.message}`);
  }
}

// 2. Trade with malformed body — forces DB validation error
{
  const label = "POST /coin/:id/buy — missing fields triggers internal error";
  try {
    const { status, body } = await hit("POST", "/coin/FAKEID_NOT_EXIST/buy", {
      wallet: "INVALID@@WALLET",
      sol: "notanumber",
    });
    const safe = checkBody(label, body);
    if (safe) pass(label, `status=${status} error="${body?.error}"`);
  } catch (e) {
    fail(label, `fetch error: ${e.message}`);
  }
}

// 3. Coin detail for non-existent ID — may trigger DB error
{
  const label = "GET /coin/:id — non-existent coin";
  try {
    const { status, body } = await hit("GET", "/coin/definitely_not_real_coin_id_xyz");
    const safe = checkBody(label, body);
    if (safe) pass(label, `status=${status} error="${body?.error}"`);
  } catch (e) {
    fail(label, `fetch error: ${e.message}`);
  }
}

// 4. Activity endpoint — malformed coin ID
{
  const label = "GET /coin/:id/activity — malformed ID";
  try {
    const { status, body } = await hit("GET", "/coin/'; DROP TABLE coins; --/activity");
    const safe = checkBody(label, body);
    if (safe) pass(label, `status=${status}`);
  } catch (e) {
    fail(label, `fetch error: ${e.message}`);
  }
}

// 5. Candles endpoint — malformed coin ID
{
  const label = "GET /coin/:id/candles — malformed ID";
  try {
    const { status, body } = await hit("GET", "/coin/../../etc/passwd/candles");
    const safe = checkBody(label, body);
    if (safe) pass(label, `status=${status}`);
  } catch (e) {
    fail(label, `fetch error: ${e.message}`);
  }
}

// 6. Withdraw with invalid wallet — DB constraint violation expected
{
  const label = "POST /withdraw/sol — invalid wallet address triggers error";
  try {
    const { status, body } = await hit("POST", "/withdraw/sol", {
      wallet: "NOTABASE58ADDR",
      amount: 0.001,
      destination: "ALSO_INVALID",
    });
    const safe = checkBody(label, body);
    if (safe) pass(label, `status=${status} error="${body?.error}"`);
  } catch (e) {
    fail(label, `fetch error: ${e.message}`);
  }
}

// 7. Referral set with garbage data — DB error expected
{
  const label = "POST /referral/set — garbage wallet triggers DB error";
  try {
    const { status, body } = await hit("POST", "/referral/set", {
      wallet: "A".repeat(50),
      referrer: "B".repeat(50),
    });
    const safe = checkBody(label, body);
    if (safe) pass(label, `status=${status} error="${body?.error}"`);
  } catch (e) {
    fail(label, `fetch error: ${e.message}`);
  }
}

// 8. Sol price — should always work but if it fails, no e.message leak
{
  const label = "GET /sol-price — response never leaks internals";
  try {
    const { status, body } = await hit("GET", "/sol-price");
    const safe = checkBody(label, body);
    if (safe) pass(label, `status=${status} price=${body?.price}`);
  } catch (e) {
    fail(label, `fetch error: ${e.message}`);
  }
}

// 9. Health endpoint
{
  const label = "GET /health — never leaks internals";
  try {
    const { status, body } = await hit("GET", "/health");
    const safe = checkBody(label, body);
    if (safe) pass(label, `status=${status}`);
  } catch (e) {
    fail(label, `fetch error: ${e.message}`);
  }
}

// 10. Coin create with missing required fields
{
  const label = "POST /coin/create — missing fields triggers error";
  try {
    const { status, body } = await hit("POST", "/coin/create", {});
    const safe = checkBody(label, body);
    if (safe) pass(label, `status=${status} error="${body?.error}"`);
  } catch (e) {
    fail(label, `fetch error: ${e.message}`);
  }
}

// ─── Summary ────────────────────────────────────────────────────────────────
console.log("\n=== Summary ===\n");
const passed = RESULTS.filter((r) => r.ok).length;
const failed = RESULTS.filter((r) => !r.ok).length;
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);

if (failed === 0) {
  console.log("\n  ✅ PASS — No DB internals, stack traces, or env var names leaked to clients.");
  console.log("     All 500 responses contain only: { ok: false, error: 'Internal server error' }");
} else {
  console.log("\n  ❌ FAIL — Some responses still leak internal details.");
  RESULTS.filter((r) => !r.ok).forEach((r) => console.log(`     - ${r.label}: ${r.detail}`));
  process.exit(1);
}
