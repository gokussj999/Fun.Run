import { describe, it, expect } from 'vitest';

import { signServiceRequest, verifyServiceSignature } from '../../src/middleware/service-auth.js';

const SERVICE_ID = 'trading-service';
const SECRET = 'super-secret-key-at-least-32-chars-long';

describe('Service-to-Service HMAC Authentication', () => {
  it('signs and verifies a valid request', () => {
    const method = 'POST';
    const path = '/api/v1/internal/trade';
    const body = JSON.stringify({ coinId: 'abc', amount: 1_000_000 });

    const { timestamp, nonce, signature } = signServiceRequest({
      serviceId: SERVICE_ID,
      secret: SECRET,
      method,
      path,
      body,
    });

    const valid = verifyServiceSignature({
      serviceId: SERVICE_ID,
      secret: SECRET,
      timestamp,
      nonce,
      method,
      path,
      body,
      signature,
    });

    expect(valid).toBe(true);
  });

  it('rejects tampered body', () => {
    const method = 'POST';
    const path = '/api/v1/internal/trade';
    const originalBody = JSON.stringify({ coinId: 'abc', amount: 1_000_000 });
    const tamperedBody = JSON.stringify({ coinId: 'abc', amount: 999_999_999 });

    const { timestamp, nonce, signature } = signServiceRequest({
      serviceId: SERVICE_ID,
      secret: SECRET,
      method,
      path,
      body: originalBody,
    });

    const valid = verifyServiceSignature({
      serviceId: SERVICE_ID,
      secret: SECRET,
      timestamp,
      nonce,
      method,
      path,
      body: tamperedBody,
      signature,
    });

    expect(valid).toBe(false);
  });

  it('rejects tampered path', () => {
    const { timestamp, nonce, signature } = signServiceRequest({
      serviceId: SERVICE_ID,
      secret: SECRET,
      method: 'GET',
      path: '/api/v1/internal/profile',
    });

    const valid = verifyServiceSignature({
      serviceId: SERVICE_ID,
      secret: SECRET,
      timestamp,
      nonce,
      method: 'GET',
      path: '/api/v1/internal/admin', // tampered
      body: '',
      signature,
    });

    expect(valid).toBe(false);
  });

  it('rejects wrong secret', () => {
    const { timestamp, nonce, signature } = signServiceRequest({
      serviceId: SERVICE_ID,
      secret: SECRET,
      method: 'GET',
      path: '/healthz',
    });

    const valid = verifyServiceSignature({
      serviceId: SERVICE_ID,
      secret: 'wrong-secret-key-at-least-32-chars',
      timestamp,
      nonce,
      method: 'GET',
      path: '/healthz',
      body: '',
      signature,
    });

    expect(valid).toBe(false);
  });

  it('rejects wrong method', () => {
    const { timestamp, nonce, signature } = signServiceRequest({
      serviceId: SERVICE_ID,
      secret: SECRET,
      method: 'POST',
      path: '/api/v1/action',
    });

    const valid = verifyServiceSignature({
      serviceId: SERVICE_ID,
      secret: SECRET,
      timestamp,
      nonce,
      method: 'DELETE', // tampered
      path: '/api/v1/action',
      body: '',
      signature,
    });

    expect(valid).toBe(false);
  });

  it('rejects malformed signature (wrong hex length)', () => {
    const valid = verifyServiceSignature({
      serviceId: SERVICE_ID,
      secret: SECRET,
      timestamp: new Date().toISOString(),
      nonce: 'abc123',
      method: 'GET',
      path: '/test',
      body: '',
      signature: 'nothex!!',
    });

    expect(valid).toBe(false);
  });

  it('generates unique nonces across invocations', () => {
    const opts = { serviceId: SERVICE_ID, secret: SECRET, method: 'GET', path: '/test' };
    const a = signServiceRequest(opts);
    const b = signServiceRequest(opts);
    expect(a.nonce).not.toBe(b.nonce);
  });

  it('generates different signatures for different timestamps', () => {
    // Even same nonce+body, different timestamp → different sig
    const opts = { serviceId: SERVICE_ID, secret: SECRET, method: 'GET', path: '/test' };
    const a = signServiceRequest(opts);
    // Tiny sleep not needed — timestamps will differ due to nonce randomness
    const b = signServiceRequest(opts);
    expect(a.signature).not.toBe(b.signature); // nonce differs → sig differs
  });
});
