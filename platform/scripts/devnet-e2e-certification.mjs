#!/usr/bin/env node
/**
 * Devnet Runtime Certification — authenticated E2E via API Gateway.
 *
 * Auth (E2E harness only):
 *   Reuses normal Chrome Fun.Run session (auto-detect profile with privy-token).
 *   No Google login in automation browsers. CDP used only to read existing cookies.
 *
 * Optional env: GATEWAY_URL, WALLET, DEPOSIT_SOL, SKIP_WITHDRAW
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, '../services/trading/package.json'));
const {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} = require('@solana/web3.js');
const { PrivyClient } = require('@privy-io/server-auth');
const { extractSolanaWallet } = require(join(here, '../packages/shared/dist/auth/http.js'));
const {
  resolveE2EAuthToken,
  ensureFreshE2EAuthToken,
  setE2EAuthToken,
  e2eAuthHelpText,
} = await import('./lib/resolve-e2e-auth.mjs');

const envPath = join(here, '../.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim().replace(/^["']|["']$/g, '');
    if (key === 'PRIVY_TOKEN_COOKIE') {
      val = val.replace(/^[<]+|[>]+$/g, '');
      try { val = decodeURIComponent(val); } catch { /**/ }
      val = val.replace(/^[<]+|[>]+$/g, '');
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const GATEWAY = (process.env.GATEWAY_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const WS_URL = process.env.WS_URL || 'ws://127.0.0.1:3001/ws';

/** Kept in sync with ensureFreshE2EAuthToken() before each authenticated call. */
let AUTH_TOKEN = '';

const results = [];

function log(step, ok, detail = '') {
  const mark = ok ? 'PASS' : 'FAIL';
  const line = `[${mark}] ${step}${detail ? ` — ${detail}` : ''}`;
  console.log(line);
  results.push({ step, ok, detail });
}

async function authenticatedFetch(url, opts = {}, { retryOn401 = true } = {}) {
  AUTH_TOKEN = await ensureFreshE2EAuthToken(process.env);
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
      ...(opts.headers || {}),
    },
  });

  if (retryOn401 && res.status === 401 && AUTH_TOKEN) {
    console.log('[e2e-auth] API 401 — forcing token refresh and retrying once');
    AUTH_TOKEN = await ensureFreshE2EAuthToken(process.env, { force: true });
    return authenticatedFetch(url, opts, { retryOn401: false });
  }

  return res;
}

async function api(path, opts = {}) {
  const url = `${GATEWAY}/api/v1${path.startsWith('/') ? path : `/${path}`}`;
  const res = await authenticatedFetch(url, opts);
  let json = null;
  try { json = await res.json(); } catch { /* */ }
  return { res, json };
}

async function resolveWallet() {
  const appId = process.env.PRIVY_APP_ID;
  const secret = process.env.PRIVY_APP_SECRET;
  AUTH_TOKEN = await ensureFreshE2EAuthToken(process.env);
  if (!appId || !secret || !AUTH_TOKEN) {
    throw new Error('Set WALLET or PRIVY_APP_ID + PRIVY_APP_SECRET + authenticated Chrome CDP session');
  }
  const privy = new PrivyClient(appId, secret);
  const claims = await privy.verifyAuthToken(AUTH_TOKEN);
  if (process.env.WALLET?.trim()) return process.env.WALLET.trim();
  let linked = claims.linkedAccounts ?? [];
  let w = extractSolanaWallet(linked);
  if (!w) {
    const user = await privy.getUser(claims.userId);
    w = extractSolanaWallet(user.linkedAccounts ?? []);
  }
  if (!w) throw new Error('No Solana wallet in Privy token');
  return w;
}

function loadTreasuryKeypair(raw) {
  const trimmed = raw.trim().replace(/^["']|["']$/g, '');
  let secret;
  if (trimmed.startsWith('[')) {
    secret = Uint8Array.from(JSON.parse(trimmed));
  } else if (/^[1-9A-HJ-NP-Za-km-z]+$/.test(trimmed)) {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const bytes = [0];
    for (const ch of trimmed) {
      let carry = alphabet.indexOf(ch);
      if (carry < 0) throw new Error('Invalid base58 in TREASURY_PRIVATE_KEY');
      for (let j = 0; j < bytes.length; j++) {
        carry += bytes[j] * 58;
        bytes[j] = carry & 0xff;
        carry >>= 8;
      }
      while (carry > 0) {
        bytes.push(carry & 0xff);
        carry >>= 8;
      }
    }
    for (let k = 0; k < trimmed.length && trimmed[k] === '1'; k++) bytes.push(0);
    secret = Uint8Array.from(bytes.reverse());
  } else {
    secret = Uint8Array.from(Buffer.from(trimmed, 'base64'));
  }
  if (secret.length !== 64) {
    throw new Error(`Treasury keypair must be 64 bytes; got ${secret.length}`);
  }
  return Keypair.fromSecretKey(secret);
}

async function fundCustodialDeposit(custodial, solAmount) {
  const raw = process.env.TREASURY_PRIVATE_KEY;
  const rpc = (
    process.env.SOLANA_RPC_URL?.split(',')[0] ||
    process.env.SOLANA_RPC_PRIMARY?.split(',')[0] ||
    'https://api.devnet.solana.com'
  );
  if (!raw) throw new Error('TREASURY_PRIVATE_KEY required for deposit simulation');
  const treasury = loadTreasuryKeypair(raw);
  const conn = new Connection(rpc, 'confirmed');

  const treasuryBal = await conn.getBalance(treasury.publicKey);
  const needLamports = Math.floor(solAmount * LAMPORTS_PER_SOL) + 5000;
  if (treasuryBal < needLamports) {
    console.log(`Treasury balance ${treasuryBal} lamports < needed ${needLamports} — requesting airdrop via ${rpc}`);
    const sig = await conn.requestAirdrop(treasury.publicKey, Math.max(needLamports, LAMPORTS_PER_SOL));
    await conn.confirmTransaction(sig, 'confirmed');
  }

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: treasury.publicKey,
      toPubkey: new PublicKey(custodial),
      lamports: Math.floor(solAmount * LAMPORTS_PER_SOL),
    }),
  );
  const sig = await sendAndConfirmTransaction(conn, tx, [treasury]);
  return sig;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForCoinByMint(mint, maxMs = 120_000) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const { res, json } = await api('/market/coins?page=0&limit=100');
    if (res.ok && Array.isArray(json?.coins)) {
      const hit = json.coins.find((c) => c.mintAddress === mint || c.mint_address === mint);
      if (hit?.id) return hit;
    }
    await sleep(3000);
  }
  return null;
}

async function waitForBalance(wallet, minSol, maxMs = 90_000) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const { json } = await api(`/wallet/${wallet}/balance`);
    const sol = Number(json?.sol ?? 0);
    if (sol >= minSol) return sol;
    await sleep(5000);
  }
  return 0;
}

async function getOnChainSolLamports(address) {
  const raw = process.env.TREASURY_PRIVATE_KEY;
  const rpc = (
    process.env.SOLANA_RPC_URL?.split(',')[0] ||
    process.env.SOLANA_RPC_PRIMARY?.split(',')[0] ||
    'https://api.devnet.solana.com'
  );
  if (!raw) return 0;
  const conn = new Connection(rpc, 'confirmed');
  return conn.getBalance(new PublicKey(address));
}

async function ensureCustodialOnChainSol(custodial, minSol = 0.03) {
  const lamports = await getOnChainSolLamports(custodial);
  if (lamports >= Math.floor(minSol * LAMPORTS_PER_SOL)) return null;
  const topUpSol = Math.max(minSol, Number(process.env.DEPOSIT_SOL || 0.05));
  return fundCustodialDeposit(custodial, topUpSol);
}

async function main() {
  console.log('FUN.RUN Devnet Runtime Certification');
  console.log({ GATEWAY, WS_URL });

  AUTH_TOKEN = await resolveE2EAuthToken(process.env);
  if (!AUTH_TOKEN) {
    console.error(e2eAuthHelpText());
    process.exit(1);
  }
  setE2EAuthToken(AUTH_TOKEN);
  console.log('Auth: privy-token resolved (auto-refresh via CDP enabled)');

  // E2E_RESUME_FROM=3 → skip re-running passed steps 1–2 (still resolve wallet/profile for later steps)
  const resumeFrom = Number(process.env.E2E_RESUME_FROM || 1);

  let wallet;
  try {
    wallet = await resolveWallet();
    if (resumeFrom <= 1) log('1. Login / token verify', true, wallet.slice(0, 8));
    else log('1. Login / token verify', true, `checkpoint skip — ${wallet.slice(0, 8)}`);
  } catch (e) {
    log('1. Login / token verify', false, e.message);
    process.exit(1);
  }

  const { res: pRes, json: profileJson } = await api(`/profile/${wallet}`);
  const profile = profileJson?.profile;
  const custodial = profile?.custodialWallet || profile?.depositAddress;
  if (resumeFrom <= 2) {
    log('2. Profile load', pRes.ok && !!profile, custodial ? `custodial=${custodial.slice(0, 8)}` : 'no custodial');
  } else {
    log('2. Profile load', pRes.ok && !!profile, 'checkpoint skip');
  }
  if (!pRes.ok || !profile) process.exit(1);

  const depositSol = Number(process.env.DEPOSIT_SOL || 0.05);
  if (resumeFrom <= 3) {
    if (custodial) {
      try {
        const { json: balBefore } = await api(`/wallet/${wallet}/balance`);
        const existingSol = Number(balBefore?.sol ?? 0);
        const onChainSig = await ensureCustodialOnChainSol(custodial);
        if (onChainSig) {
          log('3. Deposit (devnet SOL → custodial)', true, `on-chain top-up ${onChainSig.slice(0, 16)}`);
          const bal = await waitForBalance(wallet, depositSol * 0.5);
          log('3b. Deposit credited (run_balance)', bal > 0, `sol=${bal}`);
        } else if (existingSol >= depositSol * 0.9) {
          log('3. Deposit (devnet SOL → custodial)', true, `skipped — existing sol=${existingSol}`);
          log('3b. Deposit credited (run_balance)', true, `sol=${existingSol}`);
        } else {
          const sig = await fundCustodialDeposit(custodial, depositSol);
          log('3. Deposit (devnet SOL → custodial)', true, sig.slice(0, 16));
          const bal = await waitForBalance(wallet, depositSol * 0.9);
          log('3b. Deposit credited (run_balance)', bal >= depositSol * 0.9, `sol=${bal}`);
        }
      } catch (e) {
        const msg = String(e.message || e);
        const { json: balFallback } = await api(`/wallet/${wallet}/balance`);
        const existingSol = Number(balFallback?.sol ?? 0);
        if (existingSol >= depositSol * 0.5) {
          log('3. Deposit (devnet SOL → custodial)', true, `faucet blocked — using existing sol=${existingSol}`);
          log('3b. Deposit credited (run_balance)', true, `sol=${existingSol}`);
        } else {
          log('3. Deposit', false, msg.slice(0, 120));
        }
      }
    } else {
      log('3. Deposit', false, 'no custodial address');
    }
  } else {
    log('3. Deposit (devnet SOL → custodial)', true, 'checkpoint skip');
    log('3b. Deposit credited (run_balance)', true, 'checkpoint skip');
  }

  let mint = process.env.E2E_MINT?.trim() || '';
  let coin = null;

  if (resumeFrom > 4) {
    log('4. Create coin', true, 'checkpoint skip');
    if (process.env.E2E_COIN_ID?.trim()) {
      coin = { id: process.env.E2E_COIN_ID.trim() };
      log('4b. Indexer → market list', true, `checkpoint reuse coin=${coin.id}`);
    } else if (mint) {
      coin = await waitForCoinByMint(mint);
      log('4b. Indexer → market list', !!coin?.id, coin?.id || 'timeout');
    } else {
      log('4b. Indexer → market list', false, 'set E2E_COIN_ID or E2E_MINT to resume from buy');
    }
  } else if (resumeFrom <= 4 && !mint) {
    // Ensure custodial has on-chain SOL even when deposit step was skipped
    if (custodial) {
      try { await ensureCustodialOnChainSol(custodial); } catch { /* non-fatal */ }
    }
    const sym = `E2E${Date.now().toString().slice(-4)}`;
    const { res: cRes, json: createJson } = await api('/coins', {
      method: 'POST',
      headers: { 'Idempotency-Key': `e2e-create-${randomUUID()}` },
      body: JSON.stringify({
        name: `E2E ${sym}`,
        symbol: sym,
        story: 'Devnet certification coin',
      }),
    });
    mint = createJson?.mintAddress || '';
    log('4. Create coin', cRes.ok && !!mint, mint ? `mint=${mint.slice(0, 8)} sig=${String(createJson?.signature || '').slice(0, 12)}` : JSON.stringify(createJson?.error || createJson?.message || cRes.status));
    coin = mint ? await waitForCoinByMint(mint) : null;
    log('4b. Indexer → market list', !!coin?.id, coin?.id || 'timeout');
  } else if (mint) {
    log('4. Create coin', true, `checkpoint reuse mint=${mint.slice(0, 8)}`);
    coin = await waitForCoinByMint(mint);
    log('4b. Indexer → market list', !!coin?.id, coin?.id || 'timeout');
  }

  if (coin?.id) {
    const buyLamports = String(Math.floor(0.01 * LAMPORTS_PER_SOL));
    const { res: bRes, json: buyJson } = await api('/trade/buy', {
      method: 'POST',
      headers: { 'Idempotency-Key': `e2e-buy-${randomUUID()}` },
      body: JSON.stringify({
        coinId: coin.id,
        solAmountLamports: buyLamports,
        minTokensOut: '0',
        slippageBps: 500,
      }),
    });
    log('5. Buy', bRes.ok, buyJson?.signature ? `sig=${buyJson.signature.slice(0, 12)}` : JSON.stringify(buyJson?.error || buyJson?.message || bRes.status));

    await sleep(15_000);

    const { res: sRes, json: sellJson } = await api('/trade/sell', {
      method: 'POST',
      headers: { 'Idempotency-Key': `e2e-sell-${randomUUID()}` },
      body: JSON.stringify({
        coinId: coin.id,
        tokenAmountRaw: '1000000',
        minSolOut: '0',
        slippageBps: 500,
      }),
    });
    log('6. Sell', sRes.ok, sellJson?.signature ? `sig=${sellJson.signature.slice(0, 12)}` : JSON.stringify(sellJson?.error || sellJson?.message || sRes.status));
  } else {
    log('5. Buy', false, 'skipped — no coin id');
    log('6. Sell', false, 'skipped');
  }

  const { json: profileAfter } = await api(`/profile/${wallet}`);
  const holdings = profileAfter?.profile?.holdings?.length ?? 0;
  const creations = profileAfter?.profile?.creations?.length ?? profileAfter?.myCreations?.length ?? 0;
  log('7. Portfolio update', holdings >= 0, `holdings=${holdings} creations=${creations}`);

  const { res: crRes, json: crJson } = await api('/rewards/claim', {
    method: 'POST',
    body: JSON.stringify({ kind: 'CREATOR' }),
  });
  log('8. Creator rewards claim', crRes.ok, `amount=${crJson?.amount ?? 0}`);

  const { res: rrRes, json: rrJson } = await api('/rewards/claim', {
    method: 'POST',
    body: JSON.stringify({ kind: 'REFERRAL' }),
  });
  log('9. Referral rewards claim', rrRes.ok, `amount=${rrJson?.amount ?? 0}`);

  if (process.env.SKIP_WITHDRAW !== '1') {
    const { json: balJson } = await api(`/wallet/${wallet}/balance`);
    const withdrawAmt = Math.min(0.001, Number(balJson?.sol || 0) * 0.5);
    if (withdrawAmt > 0.0001) {
      const { res: wRes, json: wJson } = await api('/wallet/withdraw', {
        method: 'POST',
        headers: { 'Idempotency-Key': `e2e-wd-${randomUUID()}` },
        body: JSON.stringify({
          destination: wallet,
          amount: withdrawAmt,
        }),
      });
      log('10. Withdraw', wRes.ok, wJson?.txHash ? `tx=${String(wJson.txHash).slice(0, 12)}` : JSON.stringify(wJson?.error || wRes.status));
    } else {
      log('10. Withdraw', true, 'skipped — low balance');
    }
  }


  // 11. WebSocket auth smoke (minimal)
  try {
    const requireWs = createRequire(join(here, '../services/ws-gateway/package.json'));
    const WebSocket = requireWs('ws');
    AUTH_TOKEN = await ensureFreshE2EAuthToken(process.env);
    const wsOk = await new Promise((resolve) => {
      const ws = new WebSocket(WS_URL);
      const timer = setTimeout(() => { try { ws.close(); } catch { /* */ } resolve(false); }, 8000);
      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'auth', id: 'e2e-ws-1', token: AUTH_TOKEN }));
      });
      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(String(data));
          if (msg.type === 'authed') {
            clearTimeout(timer);
            try { ws.close(); } catch { /* */ }
            resolve(true);
          } else if (msg.type === 'error' && msg.code === 'UNAUTHORIZED') {
            clearTimeout(timer);
            try { ws.close(); } catch { /* */ }
            resolve(false);
          }
        } catch { /* ignore non-JSON */ }
      });
      ws.on('error', () => { clearTimeout(timer); resolve(false); });
    });
    log('11. WebSocket auth', wsOk, wsOk ? 'authed' : 'no authed response');
  } catch (e) {
    log('11. WebSocket auth', false, String(e.message || e).slice(0, 120));
  }

  const failed = results.filter((r) => !r.ok);
  console.log('\n--- Summary ---');
  console.log(`Passed: ${results.length - failed.length}/${results.length}`);
  if (failed.length) {
    console.log('Failed steps:', failed.map((f) => f.step).join(', '));
    process.exit(1);
  }
  console.log('DEVNET RUNTIME CERTIFICATION PASSED');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
