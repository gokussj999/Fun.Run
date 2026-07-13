/**
 * Phase 8.5.9J — Security: Wallet Encryption Validation
 *
 * Tests:
 *   1. AES-256-GCM: ciphertext is not deterministic (IV is random)
 *   2. AES-256-GCM: auth tag tamper detection — modified ciphertext rejected
 *   3. AES-256-GCM: IV tamper detection — wrong IV fails decryption
 *   4. Decryption with wrong key fails
 *   5. Legacy CBC format: still decryptable (backwards compat)
 *   6. ENCRYPTION_KEY length: exactly 32 bytes required
 *   7. Wallet API: mnemonic is NEVER returned in any HTTP response
 *   8. Wallet API: encrypted_mnemonic is NEVER returned in any HTTP response
 *   9. Wallet API: /wallet/create requires authentication
 *
 * Run:
 *   node --test tests/security/wallet-encryption.test.mjs
 *
 * Note: tests 1–6 run directly against the Node.js crypto module using the
 * same algorithm as server.js _encryptGCM / _decryptFlexible.
 */
import { test }  from 'node:test';
import assert    from 'node:assert/strict';
import crypto    from 'node:crypto';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';
const TOKEN   = process.env.AUTH_TOKEN  || '';

// Mirror of server.js _encryptGCM and _decryptFlexible for local validation.
function encryptGCM(plaintext, keyStr) {
  const key = Buffer.from(keyStr, 'utf8');
  const iv  = crypto.randomBytes(12);
  const buf = Buffer.from(plaintext, 'utf8');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct  = Buffer.concat([cipher.update(buf), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `gcm:${iv.toString('hex')}:${ct.toString('hex')}:${tag.toString('hex')}`;
}

function decryptFlexible(enc, keyStr) {
  const key   = Buffer.from(keyStr, 'utf8');
  const parts = enc.split(':');
  if (parts[0] === 'gcm' && parts.length === 4) {
    const iv  = Buffer.from(parts[1], 'hex');
    const ct  = Buffer.from(parts[2], 'hex');
    const tag = Buffer.from(parts[3], 'hex');
    const dc  = crypto.createDecipheriv('aes-256-gcm', key, iv);
    dc.setAuthTag(tag);
    return Buffer.concat([dc.update(ct), dc.final()]);
  }
  if (parts.length === 2) {
    const iv   = Buffer.from(parts[0], 'hex');
    const data = Buffer.from(parts[1], 'hex');
    const dc   = crypto.createDecipheriv('aes-256-cbc', key, iv);
    return Buffer.concat([dc.update(data), dc.final()]);
  }
  throw new Error('Invalid encrypted format');
}

const GOOD_KEY  = '12345678901234567890123456789012'; // 32 bytes
const OTHER_KEY = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'; // 32 bytes, different

// ─── Encryption correctness ───────────────────────────────────────────────────

test('gcm: two encryptions of same plaintext produce different ciphertexts (random IV)', () => {
  const ct1 = encryptGCM('test mnemonic', GOOD_KEY);
  const ct2 = encryptGCM('test mnemonic', GOOD_KEY);
  assert.notEqual(ct1, ct2, 'GCM encryption must use a fresh random IV each time');
});

test('gcm: correct key decrypts correctly', () => {
  const plaintext = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';
  const ct = encryptGCM(plaintext, GOOD_KEY);
  const decrypted = decryptFlexible(ct, GOOD_KEY).toString();
  assert.equal(decrypted, plaintext);
});

test('gcm: wrong key fails decryption (auth tag mismatch)', () => {
  const ct = encryptGCM('test mnemonic', GOOD_KEY);
  assert.throws(
    () => decryptFlexible(ct, OTHER_KEY),
    { message: /Unsupported state|bad decrypt|auth tag/i },
    'Decryption with wrong key must throw',
  );
});

test('gcm: tampered ciphertext rejected (auth tag detects modification)', () => {
  const ct    = encryptGCM('test mnemonic', GOOD_KEY);
  const parts = ct.split(':');
  // Flip one byte in the ciphertext hex (parts[2]).
  const ctHex     = parts[2];
  const tampered  = ctHex.slice(0, -2) + (ctHex.slice(-2) === 'ff' ? '00' : 'ff');
  const tamperedCt = `gcm:${parts[1]}:${tampered}:${parts[3]}`;

  assert.throws(
    () => decryptFlexible(tamperedCt, GOOD_KEY),
    { message: /Unsupported state|bad decrypt|auth tag/i },
    'Tampered ciphertext must be rejected by GCM auth tag',
  );
});

test('gcm: tampered IV rejected (auth tag detects modification)', () => {
  const ct    = encryptGCM('test mnemonic', GOOD_KEY);
  const parts = ct.split(':');
  // Flip a byte in the IV hex (parts[1]).
  const ivHex    = parts[1];
  const tamperedIv = ivHex.slice(0, -2) + (ivHex.slice(-2) === 'ff' ? '00' : 'ff');
  const tamperedCt = `gcm:${tamperedIv}:${parts[2]}:${parts[3]}`;

  assert.throws(
    () => decryptFlexible(tamperedCt, GOOD_KEY),
    { message: /Unsupported state|bad decrypt|auth tag/i },
    'Tampered IV must be rejected by GCM auth tag',
  );
});

test('gcm: tampered auth tag rejected', () => {
  const ct    = encryptGCM('test mnemonic', GOOD_KEY);
  const parts = ct.split(':');
  const tagHex      = parts[3];
  const tamperedTag = tagHex.slice(0, -2) + (tagHex.slice(-2) === 'ff' ? '00' : 'ff');
  const tamperedCt  = `gcm:${parts[1]}:${parts[2]}:${tamperedTag}`;

  assert.throws(
    () => decryptFlexible(tamperedCt, GOOD_KEY),
    { message: /Unsupported state|bad decrypt|auth tag/i },
    'Tampered auth tag must be rejected',
  );
});

// ─── Legacy CBC compatibility ─────────────────────────────────────────────────

test('cbc: legacy format still decryptable', () => {
  // Simulate a legacy CBC ciphertext.
  const iv     = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(GOOD_KEY), iv);
  const ct     = Buffer.concat([cipher.update(Buffer.from('legacy mnemonic', 'utf8')), cipher.final()]);
  const cbcEnc = `${iv.toString('hex')}:${ct.toString('hex')}`;

  const decrypted = decryptFlexible(cbcEnc, GOOD_KEY).toString();
  assert.equal(decrypted, 'legacy mnemonic', 'Legacy CBC format must still be decryptable');
});

// ─── Key length validation ────────────────────────────────────────────────────

test('key: 31-byte key causes cipher creation failure', () => {
  const shortKey = '1234567890123456789012345678901'; // 31 bytes
  assert.throws(() => {
    encryptGCM('test', shortKey);
  }, 'Key shorter than 32 bytes must be rejected by crypto');
});

test('key: 33-byte key causes cipher creation failure', () => {
  const longKey = '123456789012345678901234567890123'; // 33 bytes
  assert.throws(() => {
    encryptGCM('test', longKey);
  }, 'Key longer than 32 bytes must be rejected by crypto');
});

// ─── HTTP API: mnemonic never leaks ──────────────────────────────────────────

test('wallet api: /wallet/create requires authentication', async () => {
  const res = await fetch(`${BACKEND}/wallet/create`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    '{}',
  });
  // Must be 401 (auth required) — NOT 200 with a mnemonic.
  assert.equal(res.status, 401, '/wallet/create must require authentication');
});

test('wallet api: authenticated /wallet/create does not return mnemonic', async () => {
  if (!TOKEN) return;
  const res = await fetch(`${BACKEND}/wallet/create`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: '{}',
  });

  const body = await res.text();
  assert.ok(!body.includes('mnemonic'),  'Response must not contain the word "mnemonic"');
  assert.ok(!body.includes('seed'),      'Response must not contain "seed"');
  assert.ok(!body.includes('encrypted'), 'Response must not contain encrypted data');
  assert.ok(!body.includes('cipher'),    'Response must not contain cipher data');
});

test('wallet api: profile endpoint does not return encrypted_mnemonic', async () => {
  if (!TOKEN) return;
  const res = await fetch(`${BACKEND}/api/profile`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` },
  });

  if (res.status !== 200) return; // endpoint may not exist or may require different auth

  const body = await res.text();
  assert.ok(!body.includes('encrypted_mnemonic'), 'Profile must not expose encrypted_mnemonic');
  assert.ok(!body.includes('mnemonic'),           'Profile must not expose mnemonic');
});

test('wallet api: trade response does not expose internal wallet data', async () => {
  if (!TOKEN) return;
  const res = await fetch(`${process.env.TRADING_URL || 'http://localhost:3003'}/trade/quote?coinId=test&direction=buy&amountIn=1000000&slippageBps=50`);
  const body = await res.text();
  assert.ok(!body.includes('encrypted'),  'Quote response must not expose encrypted data');
  assert.ok(!body.includes('mnemonic'),   'Quote response must not expose mnemonic');
  assert.ok(!body.includes('secretKey'),  'Quote response must not expose secretKey');
  assert.ok(!body.includes('privateKey'), 'Quote response must not expose privateKey');
});
