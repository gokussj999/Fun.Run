/**
 * C3 Verification — Restrictive CORS
 *
 * Confirms:
 *  - Legitimate frontend origin(s) receive Access-Control-Allow-Origin
 *  - Arbitrary *.vercel.app origins are blocked
 *  - localhost:PORT is allowed only in development
 *  - Completely unknown origins are blocked
 *  - Preflight (OPTIONS) follows the same rules
 *
 * Usage: node backend/scripts/verify-c3-cors.mjs
 * Requires backend running on PORT (default 5000).
 */

import "dotenv/config";

const BASE  = `http://localhost:${process.env.PORT || 5000}`;
const RESULTS = [];

const pass = (label, detail = "") => {
  RESULTS.push({ ok: true, label });
  console.log(`  ✓  ${label}${detail ? " — " + detail : ""}`);
};
const fail = (label, detail = "") => {
  RESULTS.push({ ok: false, label });
  console.log(`  ✗  ${label}${detail ? " — " + detail : ""}`);
};

async function corsRequest(origin, method = "GET") {
  const opts = {
    method,
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      ...(method === "OPTIONS" ? {
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      } : {}),
    },
  };
  const res = await fetch(`${BASE}/health`, opts);
  const acao = res.headers.get("access-control-allow-origin") || "";
  return { status: res.status, acao };
}

console.log("\n=== C3 Verification — Restrictive CORS ===\n");
console.log(`Target: ${BASE}\n`);

// Read allowed list from env (same logic as server)
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",").map(s => s.trim()).filter(Boolean);
console.log(`  CORS_ORIGINS: ${allowedOrigins.join(", ")}\n`);

// ─── Allowed origins ─────────────────────────────────────────────────────────
console.log("--- Allowed origins (should receive ACAO header) ---\n");

for (const origin of allowedOrigins) {
  const { acao } = await corsRequest(origin);
  acao
    ? pass(`Allowed: ${origin}`, `ACAO: ${acao}`)
    : fail(`Allowed: ${origin}`, "ACAO header absent — should be allowed");
}

// ─── Blocked origins ─────────────────────────────────────────────────────────
console.log("\n--- Blocked origins (should NOT receive ACAO header) ---\n");

const BLOCKED = [
  "https://attacker.vercel.app",           // wildcard *.vercel.app — used to be allowed
  "https://evil-fun-run.vercel.app",       // another attacker on Vercel
  "https://totally-different-site.com",   // unrelated domain
  "https://fun-run-lovat.vercel.app.evil.com", // homograph attempt
  "http://evilocalhost.com",              // includes("localhost") bypass attempt
  "https://notlocalhost.com",             // includes("localhost") bypass
];

for (const origin of BLOCKED) {
  const { acao } = await corsRequest(origin);
  if (!acao || acao === "false") {
    pass(`Blocked: ${origin}`, "ACAO absent (correct)");
  } else {
    fail(`Blocked: ${origin}`, `ACAO: ${acao} — SHOULD BE BLOCKED`);
  }
}

// ─── Localhost in dev ─────────────────────────────────────────────────────────
console.log("\n--- Localhost origins ---\n");

const isProd = process.env.NODE_ENV === "production";
const localhostOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
];

for (const origin of localhostOrigins) {
  const { acao } = await corsRequest(origin);
  if (isProd) {
    // In production, only CORS_ORIGINS are allowed
    const explicit = allowedOrigins.includes(origin);
    if (explicit) {
      acao ? pass(`Prod explicit localhost: ${origin}`) : fail(`Prod explicit localhost: ${origin}`, "should be allowed via CORS_ORIGINS");
    } else {
      acao ? fail(`Prod implicit localhost: ${origin}`, "should be blocked in prod") : pass(`Prod implicit localhost: ${origin}`, "correctly blocked in prod");
    }
  } else {
    // In dev, all localhost:PORT should be allowed
    acao
      ? pass(`Dev localhost: ${origin}`, `ACAO: ${acao}`)
      : fail(`Dev localhost: ${origin}`, "should be allowed in dev");
  }
}

// ─── Preflight (OPTIONS) — same policy ───────────────────────────────────────
console.log("\n--- Preflight (OPTIONS) — must not use wildcard ---\n");

{
  const origin = allowedOrigins[0];
  const { status, acao } = await corsRequest(origin, "OPTIONS");
  acao
    ? pass(`OPTIONS preflight allowed for: ${origin}`, `status=${status} ACAO=${acao}`)
    : fail(`OPTIONS preflight allowed for: ${origin}`, "ACAO absent");
}

{
  const origin = "https://attacker.vercel.app";
  const { acao } = await corsRequest(origin, "OPTIONS");
  if (!acao || acao === "false") {
    pass(`OPTIONS preflight blocked for: ${origin}`, "ACAO absent (correct)");
  } else {
    fail(`OPTIONS preflight blocked for: ${origin}`, `ACAO: ${acao} — MUST BE BLOCKED on preflight`);
  }
}

// ─── No-origin requests still work (curl / server-to-server) ─────────────────
console.log("\n--- No-origin requests (curl, health checks) ---\n");

{
  const res = await fetch(`${BASE}/health`);
  const json = await res.json().catch(() => null);
  json?.ok === true
    ? pass("No-origin GET /health — still works", `status=${res.status}`)
    : fail("No-origin GET /health", "API broken");
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log("\n=== Summary ===\n");
const passed = RESULTS.filter(r => r.ok).length;
const failed = RESULTS.filter(r => !r.ok).length;
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);

if (failed === 0) {
  console.log(`
  ✅ PASS — CORS is restrictive and correctly configured.

  Verified:
    ✓ Official frontend origin(s) allowed
    ✓ Arbitrary *.vercel.app origins blocked
    ✓ Hostname-substring bypass attempts blocked
    ✓ Localhost allowed in dev via strict regex (not substring match)
    ✓ Preflight (OPTIONS) uses same policy — no wildcard
    ✓ No-origin requests (curl/health checks) still work
  `);
} else {
  console.log(`\n  ❌ FAIL — ${failed} check(s) failed.\n`);
  RESULTS.filter(r => !r.ok).forEach(r => console.log(`     ✗ ${r.label}`));
  process.exit(1);
}
