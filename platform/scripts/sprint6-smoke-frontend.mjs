#!/usr/bin/env node
/**
 * Sprint 6 — Frontend migration smoke (structural, no live services required).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const FE = resolve(ROOT, 'frontend/src');

const checks = [
  ['platform-api.js', resolve(FE, 'services/platform-api.js'), ['/trade/buy', '/wallet/withdraw']],
  ['ws-client.js', resolve(FE, 'services/ws-client.js'), ['type: "auth"', 'type: "subscribe"']],
  ['usePlatformWs.js', resolve(FE, 'hooks/usePlatformWs.js'), ['portfolio:', 'notifications:']],
  ['App.jsx migration', resolve(FE, 'App.jsx'), ['usePlatformWs', 'platformApi.buyCoin']],
  ['proxy-trading.ts (Sprint 7)', resolve(ROOT, 'platform/apps/api-gateway/src/plugins/proxy-trading.ts'), ['/api/v1/market/coins', '/api/v1/coins']],
  ['vite proxy → gateway', resolve(ROOT, 'frontend/vite.config.js'), ['127.0.0.1:3000']],
];

let failed = 0;

for (const [label, file, needles] of checks) {
  if (!existsSync(file)) {
    console.error(`✗ ${label} — missing ${file}`);
    failed += 1;
    continue;
  }
  const src = readFileSync(file, 'utf8');
  const missing = needles.filter((n) => !src.includes(n));
  if (missing.length) {
    console.error(`✗ ${label} — missing: ${missing.join(', ')}`);
    failed += 1;
  } else {
    console.log(`✓ ${label}`);
  }
}

if (failed) {
  process.exit(1);
}
console.log('\nSprint 6 frontend migration smoke: PASS');
