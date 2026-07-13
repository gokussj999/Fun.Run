import { describe, it, expect } from 'vitest';

import {
  formatEncryptedMnemonic,
  ProfileLoadError,
} from '../../src/wallet/profile-loader.js';
import {
  createCustodialWalletMaterial,
  resolveCustodialDepositAddress,
} from '../../src/wallet/custodial-wallet.js';
import {
  buildOffchainTradeBody,
  buildOnchainTradeBody,
  buildTradeBuyBody,
} from '../../src/trading/trade-response.js';
import type { OnChainTradeResult, TradeResult } from '../../src/types.js';

describe('profile-loader (Task 9)', () => {
  it('formatEncryptedMnemonic returns combined iv:ciphertext', () => {
    expect(
      formatEncryptedMnemonic({
        encryptedMnemonic: 'abc123',
        mnemonicIv: 'deadbeefdeadbeefdeadbeefdeadbeef',
      }),
    ).toBe('deadbeefdeadbeefdeadbeefdeadbeef:abc123');
  });

  it('formatEncryptedMnemonic passes through legacy combined format', () => {
    const combined = 'aabbccddeeff00112233445566778899:cipher';
    expect(
      formatEncryptedMnemonic({
        encryptedMnemonic: combined,
        mnemonicIv: null,
      }),
    ).toBe(combined);
  });

  it('throws WALLET_NOT_READY when mnemonic missing', () => {
    expect(() =>
      formatEncryptedMnemonic({ encryptedMnemonic: null, mnemonicIv: null }),
    ).toThrow(ProfileLoadError);
    try {
      formatEncryptedMnemonic({ encryptedMnemonic: '', mnemonicIv: null });
    } catch (err) {
      expect((err as ProfileLoadError).code).toBe('WALLET_NOT_READY');
    }
  });
});

describe('custodial-wallet provisioning', () => {
  const TEST_KEY = '01234567890123456789012345678901';

  it('createCustodialWalletMaterial returns encrypted fields and distinct custodial address', () => {
    const material = createCustodialWalletMaterial(TEST_KEY);
    expect(material.encryptedMnemonic.length).toBeGreaterThan(16);
    expect(material.mnemonicIv).toMatch(/^[0-9a-f]{32}$/);
    expect(material.custodialAddress).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
  });

  it('resolveCustodialDepositAddress derives deposit address from stored columns', () => {
    const material = createCustodialWalletMaterial(TEST_KEY);
    const resolved = resolveCustodialDepositAddress(
      {
        walletAddress: '11111111111111111111111111111112',
        encryptedMnemonic: material.encryptedMnemonic,
        mnemonicIv: material.mnemonicIv,
      },
      TEST_KEY,
    );
    expect(resolved).toBe(material.custodialAddress);
  });
});

describe('trade-response (Task 10)', () => {
  const offchainResult: TradeResult = {
    txId: 'oc_abc123',
    coinId: 'coin-1',
    mintAddress: 'Mint111',
    walletAddress: 'Wallet111',
    tradeType: 'BUY',
    solAmount: 1_000_000n,
    tokenAmount: 500n,
    pricePerToken: 2000,
    priceImpactBps: 10,
    fees: {
      totalFee: 15_000n,
      creatorFee: 6_000n,
      referrerFee: 3_000n,
      treasuryFee: 6_000n,
    },
    virtualSolAfter: 31_000_000_000n,
    virtualTokensAfter: 1_000_000_000n,
    graduated: false,
    remainingTokenBalance: 0n,
    requestId: 'req-1',
  };

  const onchainResult: OnChainTradeResult = {
    txId: 'cltx123',
    signature: '5SigBase58ExampleSignatureValueHere1234567890abcdefghijklmnop',
    coinId: 'coin-1',
    mintAddress: 'Mint111',
    walletAddress: 'Wallet111',
    tradeType: 'BUY',
    status: 'SUBMITTED',
    idempotent: false,
    requestId: 'req-2',
  };

  it('offchain body preserves legacy shape with oc_ txId', () => {
    const body = buildOffchainTradeBody(offchainResult, 'req-1');
    expect(body.txId).toBe('oc_abc123');
    expect(body).toHaveProperty('virtualSolAfter');
    expect(body).not.toHaveProperty('signature');
    expect(body).not.toHaveProperty('mode');
  });

  it('onchain body includes signature and status', () => {
    const body = buildOnchainTradeBody(onchainResult);
    expect(body.txId).toBe('cltx123');
    expect(body.signature).toBe(onchainResult.signature);
    expect(body.status).toBe('SUBMITTED');
    expect(body.mode).toBe('onchain');
    expect(body).not.toHaveProperty('virtualSolAfter');
  });

  it('buildTradeBuyBody selects shape by result type', () => {
    expect(buildTradeBuyBody(offchainResult, 'req-1')).toHaveProperty('fees');
    expect(buildTradeBuyBody(onchainResult, 'req-2')).toHaveProperty('signature');
  });
});
