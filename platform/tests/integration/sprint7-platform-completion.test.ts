import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Sprint 7 — Platform completion structural validation.
 */

const ROOT = resolve(import.meta.dirname, '../../..');

describe('Sprint 7 platform completion', () => {
  it('trading service exposes native platform routes', () => {
    const path = resolve(ROOT, 'platform/services/trading/src/routes/platform.ts');
    expect(existsSync(path)).toBe(true);
    const src = readFileSync(path, 'utf8');
    expect(src).toContain("app.get('/market/coins'");
    expect(src).toContain("app.post('/coins'");
    expect(src).toContain("app.post('/wallet/withdraw'");
    expect(src).toContain("app.post('/rewards/claim'");
  });

  it('create coin executor and orchestrator exist', () => {
    expect(existsSync(resolve(ROOT, 'platform/services/trading/src/executors/create-coin-executor.ts'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'platform/services/trading/src/trading/create-coin-orchestrator.ts'))).toBe(true);
  });

  it('deposit scanner worker exists', () => {
    const path = resolve(ROOT, 'platform/services/trading/src/wallet/deposit-scanner.ts');
    expect(existsSync(path)).toBe(true);
    const src = readFileSync(path, 'utf8');
    expect(src).toContain('runBalanceSol');
  });

  it('gateway routes platform APIs to trading service (no legacy proxy)', () => {
    const proxyPath = resolve(ROOT, 'platform/apps/api-gateway/src/plugins/proxy-trading.ts');
    const legacyPath = resolve(ROOT, 'platform/apps/api-gateway/src/plugins/proxy-legacy.ts');
    expect(existsSync(proxyPath)).toBe(true);
    expect(existsSync(legacyPath)).toBe(false);
    const src = readFileSync(proxyPath, 'utf8');
    expect(src).toContain('/api/v1/coins');
    expect(src).toContain('/api/v1/profile/');
    expect(src).not.toContain('LEGACY_BACKEND_URL');
  });

  it('Prisma schema includes Sprint 7 wallet models in baseline migration', () => {
    const schema = readFileSync(
      resolve(ROOT, 'platform/packages/database/prisma/schema.prisma'),
      'utf8',
    );
    const baseline = readFileSync(
      resolve(ROOT, 'platform/packages/database/prisma/migrations/20260709000000_baseline/migration.sql'),
      'utf8',
    );
    expect(schema).toContain('model Deposit');
    expect(schema).toContain('model Withdrawal');
    expect(schema).toContain('runBalanceSol');
    expect(baseline).toContain('CREATE TABLE "deposits"');
  });

  it('frontend handles on-chain create response', () => {
    const api = readFileSync(resolve(ROOT, 'frontend/src/services/platform-api.js'), 'utf8');
    const app = readFileSync(resolve(ROOT, 'frontend/src/App.jsx'), 'utf8');
    expect(api).toContain('normalizeCreateResponse');
    expect(app).toContain('normalizeCreateResponse');
    expect(app).toContain('json?.onchain');
  });

  it('trading index wires deposit scanner and create orchestrator', () => {
    const indexSrc = readFileSync(resolve(ROOT, 'platform/services/trading/src/index.ts'), 'utf8');
    const serverSrc = readFileSync(resolve(ROOT, 'platform/services/trading/src/server.ts'), 'utf8');
    expect(indexSrc).toContain('DepositScanner');
    expect(indexSrc).toContain('CreateCoinOrchestrator');
    expect(serverSrc).toContain('registerPlatformRoutes');
  });
});
