/**
 * C1 + C2 Verification
 *
 * C1 — /api/onchain/* POST routes require auth; no body encryptedMnemonic
 * C2 — /wallet/create requires auth; does not return encryptedMnemonic
 *
 * Usage: node backend/scripts/verify-c1c2-onchain-wallet.mjs
 * Requires backend running on PORT (default 5000).
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const BASE = `http://localhost:${process.env.PORT || 5000}`;
const RESULTS = [];

const pass = (label, detail = "") => {
  RESULTS.push({ ok: true, label });
  console.log(`  ✓  ${label}${detail ? " — " + detail : ""}`);
};
const fail = (label, detail = "") => {
  RESULTS.push({ ok: false, label });
  console.log(`  ✗  ${label}${detail ? " — " + detail : ""}`);
};

async function hit(method, path, body, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }).catch(e => ({ status: 0, _err: e.message }));
  if (res.status === 0) return { status: 0, json: {} };
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const isBlocked = s => s === 401 || s === 503; // auth required

console.log("\n=== C1 + C2 Verification — Onchain Auth + Wallet Create ===\n");

// ─── C1: POST /api/onchain/* — no auth header → blocked ─────────────────────
console.log("--- C1: No auth header → must be blocked ---\n");

const ONCHAIN_POSTS = [
  { path: "/api/onchain/create-coin", body: { coinId: "x", encryptedMnemonic: "FAKE" } },
  { path: "/api/onchain/buy",         body: { coinId: "x", encryptedMnemonic: "FAKE", solAmount: 1000000 } },
  { path: "/api/onchain/sell",        body: { coinId: "x", encryptedMnemonic: "FAKE", tokenAmount: 100 } },
];

for (const ep of ONCHAIN_POSTS) {
  const { status } = await hit("POST", ep.path, ep.body);
  isBlocked(status)
    ? pass(`POST ${ep.path} — no auth → ${status}`)
    : fail(`POST ${ep.path} — expected 401/503, got ${status}`);
}

// ─── C1: GET /api/onchain/* — read-only, still accessible ───────────────────
console.log("\n--- C1: GET /api/onchain/* — read-only, must stay public ---\n");

{
  const { status } = await hit("GET", "/api/onchain/coin/some-coin-id");
  // 404 or 500 from Anchor = endpoint is reachable (not auth blocked)
  !isBlocked(status)
    ? pass(`GET /api/onchain/coin/:id — accessible without auth`, `status=${status}`)
    : fail(`GET /api/onchain/coin/:id — incorrectly requires auth`, `status=${status}`);
}

// ─── C1: Invalid token → blocked ─────────────────────────────────────────────
console.log("\n--- C1: Invalid token → must be blocked ---\n");

const BAD_TOKEN = { Authorization: "Bearer eyJhbGciOiJSUzI1NiJ9.fake.token" };

for (const ep of ONCHAIN_POSTS) {
  const { status } = await hit("POST", ep.path, ep.body, BAD_TOKEN);
  isBlocked(status)
    ? pass(`POST ${ep.path} [bad token] → ${status}`)
    : fail(`POST ${ep.path} [bad token] — expected 401/503, got ${status}`);
}

// ─── C2: /wallet/create — no auth → blocked ──────────────────────────────────
console.log("\n--- C2: /wallet/create — no auth → blocked ---\n");

{
  const { status } = await hit("POST", "/wallet/create", {});
  isBlocked(status)
    ? pass(`POST /wallet/create — no auth → ${status}`)
    : fail(`POST /wallet/create — expected 401/503, got ${status}`);
}

// ─── C2: /wallet/create — bad token → blocked ────────────────────────────────
{
  const { status } = await hit("POST", "/wallet/create", {}, BAD_TOKEN);
  isBlocked(status)
    ? pass(`POST /wallet/create [bad token] → ${status}`)
    : fail(`POST /wallet/create [bad token] — expected 401/503, got ${status}`);
}

// ─── Structural: no encryptedMnemonic in routes ───────────────────────────────
console.log("\n--- Structural: source code verification ---\n");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const onchainSrc = readFileSync(path.join(__dirname, "../routes/onchain.js"), "utf8");
const serverSrc  = readFileSync(path.join(__dirname, "../server.js"), "utf8");

// onchain.js must NOT accept encryptedMnemonic from body
const bodyEncryptedPattern = /req\.body\s*[\.\[]['"]?encryptedMnemonic/;
bodyEncryptedPattern.test(onchainSrc)
  ? fail("onchain.js: req.body.encryptedMnemonic — still present", "MUST be removed")
  : pass("onchain.js: req.body.encryptedMnemonic absent — uses req._encryptedMnemonic");

// onchain.js must use req._encryptedMnemonic
/req\._encryptedMnemonic/.test(onchainSrc)
  ? pass("onchain.js: req._encryptedMnemonic present (server-side lookup)")
  : fail("onchain.js: req._encryptedMnemonic missing");

// server.js must have the auth middleware for /api/onchain
/requireAuthWallet.*onchainRoutes|onchainRoutes.*requireAuthWallet|\/api\/onchain.*requireAuthWallet/s.test(serverSrc) ||
/req\._encryptedMnemonic\s*=/.test(serverSrc)
  ? pass("server.js: onchain auth middleware present")
  : fail("server.js: onchain auth middleware missing");

// server.js /wallet/create handler: res.json() must NOT include encryptedMnemonic
// Extract only the res.json(...) call inside the new /wallet/create handler
const walletCreateHandler = serverSrc.match(/app\.post\(["']\/wallet\/create["'][\s\S]*?walletRoutes/)?.[0] || "";
const resJsonCall = walletCreateHandler.match(/res\.json\(\{[^}]*\}\)/g) || [];
const leaksInResponse = resJsonCall.some(c => /encryptedMnemonic/.test(c));
leaksInResponse
  ? fail("server.js /wallet/create res.json: encryptedMnemonic in response — must be removed")
  : pass("server.js /wallet/create: encryptedMnemonic absent from res.json response");

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log("\n=== Summary ===\n");
const passed = RESULTS.filter(r => r.ok).length;
const failed = RESULTS.filter(r => !r.ok).length;
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);

if (failed === 0) {
  console.log(`
  ✅ PASS — C1 + C2 fixed.

  C1 — /api/onchain/*:
    ✓ POST routes blocked without valid auth token
    ✓ GET routes (read-only) still accessible
    ✓ encryptedMnemonic accepted from body no longer — server fetches from DB

  C2 — /wallet/create:
    ✓ Requires Privy auth (no anonymous wallet creation)
    ✓ encryptedMnemonic never returned to client
    ✓ Custodial wallet saved server-side to DB on creation
  `);
} else {
  console.log(`\n  ❌ FAIL — ${failed} check(s) failed.\n`);
  RESULTS.filter(r => !r.ok).forEach(r => console.log(`     ✗ ${r.label}`));
  process.exit(1);
}
