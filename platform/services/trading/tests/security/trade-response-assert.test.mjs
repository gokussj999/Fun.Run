import { test } from 'node:test';
import assert from 'node:assert/strict';

import { assertValidTradeResponse } from './trade-response-assert.mjs';

test('trade-response-assert: accepts onchain shape', () => {
  const mode = assertValidTradeResponse({
    txId: 'cltx1',
    signature: '5MockSigBase581234567890abcdefghijklmnopqrs',
    status: 'SUBMITTED',
    mode: 'onchain',
  });
  assert.equal(mode, 'onchain');
});

test('trade-response-assert: accepts offchain shape', () => {
  const mode = assertValidTradeResponse({
    txId: 'oc_abc123',
    solAmount: '10000000',
    virtualSolAfter: '31000000000',
  });
  assert.equal(mode, 'offchain');
});

test('trade-response-assert: rejects onchain without signature', () => {
  assert.throws(
    () => assertValidTradeResponse({ txId: 'x', mode: 'onchain', status: 'SUBMITTED' }),
    /signature/,
  );
});
