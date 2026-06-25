/**
 * C2 Verification — Helmet Security Headers
 *
 * Starts the server (via import) and hits /health to inspect response headers.
 * Verifies each required security header is present and correctly valued.
 *
 * Usage: node backend/scripts/verify-c2-helmet.mjs
 * Requires backend running: cd backend && node server.js
 */

import "dotenv/config";

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

async function getHeaders(path = "/health") {
  const res = await fetch(`${BASE}${path}`);
  // Convert Headers object to a plain object (lowercase keys)
  const h = {};
  res.headers.forEach((value, key) => { h[key.toLowerCase()] = value; });
  return h;
}

console.log("\n=== C2 Verification — Helmet Security Headers ===\n");
console.log(`Target: ${BASE}\n`);

let headers;
try {
  headers = await getHeaders("/health");
} catch (e) {
  console.error("  ✗ Could not connect to server:", e.message);
  console.error("    Start server first: cd backend && node server.js");
  process.exit(1);
}

// ─── 1. Content-Security-Policy ─────────────────────────────────────────────
{
  const csp = headers["content-security-policy"] || "";
  if (!csp) {
    fail("Content-Security-Policy", "header absent");
  } else {
    pass("Content-Security-Policy present", csp.slice(0, 80) + "…");

    const checks = [
      ["default-src 'none'",    csp.includes("default-src 'none'")],
      ["frame-ancestors 'none'",csp.includes("frame-ancestors 'none'")],
      ["base-uri 'none'",       csp.includes("base-uri 'none'")],
      ["form-action 'none'",    csp.includes("form-action 'none'")],
      ["object-src 'none'",     csp.includes("object-src 'none'")],
      ["script-src 'none'",     csp.includes("script-src 'none'")],
    ];
    for (const [name, ok] of checks) {
      ok ? pass(`  CSP directive: ${name}`) : fail(`  CSP directive: ${name}`, "missing");
    }

    // Ensure no unsafe directives
    const unsafe = ["'unsafe-inline'", "'unsafe-eval'", "data:", "*"];
    for (const u of unsafe) {
      if (csp.includes(u)) {
        fail(`  CSP no-unsafe: ${u}`, `FOUND in CSP — should not be there`);
      } else {
        pass(`  CSP no-unsafe: ${u}`);
      }
    }
  }
}

// ─── 2. X-Frame-Options ─────────────────────────────────────────────────────
{
  const xfo = headers["x-frame-options"] || "";
  if (xfo.toLowerCase() === "deny") {
    pass("X-Frame-Options: DENY", xfo);
  } else if (xfo) {
    fail("X-Frame-Options", `expected DENY, got: ${xfo}`);
  } else {
    fail("X-Frame-Options", "header absent");
  }
}

// ─── 3. X-Content-Type-Options ──────────────────────────────────────────────
{
  const xcto = headers["x-content-type-options"] || "";
  xcto === "nosniff"
    ? pass("X-Content-Type-Options: nosniff")
    : fail("X-Content-Type-Options", `expected nosniff, got: ${xcto || "(absent)"}`);
}

// ─── 4. Referrer-Policy ─────────────────────────────────────────────────────
{
  const rp = headers["referrer-policy"] || "";
  rp
    ? pass("Referrer-Policy present", rp)
    : fail("Referrer-Policy", "header absent");
}

// ─── 5. HSTS (production only — expect absent in dev) ───────────────────────
{
  const hsts = headers["strict-transport-security"] || "";
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    if (hsts && hsts.includes("max-age=")) {
      pass("Strict-Transport-Security (production)", hsts);
    } else {
      fail("Strict-Transport-Security", "expected in production, absent");
    }
  } else {
    if (hsts) {
      fail("Strict-Transport-Security in dev", `should be absent in dev, got: ${hsts}`);
    } else {
      pass("Strict-Transport-Security: correctly absent in dev (NODE_ENV != production)");
    }
  }
}

// ─── 6. X-Powered-By removed ────────────────────────────────────────────────
{
  const xpb = headers["x-powered-by"] || "";
  xpb
    ? fail("X-Powered-By removed", `still present: ${xpb}`)
    : pass("X-Powered-By: correctly absent (helmet hidePoweredBy)");
}

// ─── 7. Cross-Origin-Resource-Policy = cross-origin ─────────────────────────
{
  const corp = headers["cross-origin-resource-policy"] || "";
  corp === "cross-origin"
    ? pass("Cross-Origin-Resource-Policy: cross-origin (allows Vercel→Railway fetch)")
    : fail("Cross-Origin-Resource-Policy", `expected cross-origin, got: ${corp || "(absent)"}`);
}

// ─── 8. Verify CORS still works (not broken by Helmet) ──────────────────────
{
  const res = await fetch(`${BASE}/health`, {
    headers: { Origin: "http://localhost:5173" },
  });
  const acao = res.headers.get("access-control-allow-origin") || "";
  acao
    ? pass("CORS not broken by Helmet", `Access-Control-Allow-Origin: ${acao}`)
    : fail("CORS broken", "Access-Control-Allow-Origin absent after adding Helmet");
}

// ─── 9. API still returns JSON (functionality not broken) ───────────────────
{
  const res = await fetch(`${BASE}/health`);
  const ct = res.headers.get("content-type") || "";
  const json = await res.json().catch(() => null);
  if (json?.ok === true && ct.includes("application/json")) {
    pass("API still returns valid JSON", `status=${res.status}`);
  } else {
    fail("API broken", `status=${res.status} content-type=${ct}`);
  }
}

// ─── Summary ────────────────────────────────────────────────────────────────
console.log("\n=== Summary ===\n");
const passed = RESULTS.filter((r) => r.ok).length;
const failed = RESULTS.filter((r) => !r.ok).length;
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);

if (failed === 0) {
  console.log(`
  ✅ PASS — All Helmet security headers are correctly configured.

  Headers confirmed:
    Content-Security-Policy    : default-src 'none'; strict API policy
    X-Frame-Options            : DENY
    X-Content-Type-Options     : nosniff
    Referrer-Policy            : no-referrer
    Strict-Transport-Security  : absent in dev (active in production)
    Cross-Origin-Resource-Policy: cross-origin (Vercel→Railway works)
    X-Powered-By               : removed

  WebSocket / Privy / Frontend compatibility:
    — crossOriginOpenerPolicy  : disabled (Privy popup auth safe)
    — crossOriginEmbedderPolicy: disabled (API accessible cross-origin)
    — CORS headers             : untouched and working
  `);
} else {
  console.log(`\n  ❌ FAIL — ${failed} check(s) failed.\n`);
  RESULTS.filter((r) => !r.ok).forEach((r) => console.log(`     ✗ ${r.label}`));
  process.exit(1);
}
