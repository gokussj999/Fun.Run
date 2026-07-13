import { createCipheriv, randomBytes } from 'node:crypto';
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import type { PrismaClient } from '@funrun/database';

import { derivePublicKeyBase58FromEncryptedMnemonic, derivePublicKeyBase58FromMnemonic } from '../tx/signer.js';
import { formatEncryptedMnemonic } from './profile-loader.js';

export interface CustodialWalletMaterial {
  encryptedMnemonic: string;
  mnemonicIv: string;
  custodialAddress: string;
}

type ProfileMnemonicRow = {
  walletAddress: string;
  encryptedMnemonic: string | null;
  mnemonicIv: string | null;
};

function hasProvisionedMnemonic(profile: ProfileMnemonicRow): boolean {
  return Boolean(profile.encryptedMnemonic?.trim());
}

function encryptMnemonicAes256Cbc(
  mnemonic: string,
  encryptionKey: string,
): { encryptedMnemonic: string; mnemonicIv: string } {
  const keyBuf = Buffer.from(encryptionKey, 'utf8');
  if (keyBuf.length !== 32) {
    throw new Error('MNEMONIC_ENCRYPTION_KEY must be exactly 32 bytes (UTF-8)');
  }
  const iv = randomBytes(16);
  const plain = Buffer.from(mnemonic, 'utf8');
  try {
    const cipher = createCipheriv('aes-256-cbc', keyBuf, iv);
    const part1 = cipher.update(plain);
    const part2 = cipher.final();
    const ciphertext = Buffer.concat([part1, part2]);
    part1.fill(0);
    part2.fill(0);
    return {
      mnemonicIv: iv.toString('hex'),
      encryptedMnemonic: ciphertext.toString('hex'),
    };
  } finally {
    iv.fill(0);
    keyBuf.fill(0);
    plain.fill(0);
  }
}

/** Generate encrypted custodial wallet material (legacy createCustodialWallet parity). */
export function createCustodialWalletMaterial(encryptionKey: string): CustodialWalletMaterial {
  const mnemonic = generateMnemonic(wordlist, 128);
  const encrypted = encryptMnemonicAes256Cbc(mnemonic, encryptionKey);
  try {
    return {
      ...encrypted,
      custodialAddress: derivePublicKeyBase58FromMnemonic(mnemonic),
    };
  } finally {
    void mnemonic;
  }
}

export function resolveCustodialDepositAddress(
  profile: ProfileMnemonicRow & { mnemonicTag?: string | null },
  encryptionKey: string,
): string | null {
  const cached = profile.mnemonicTag?.trim();
  if (cached && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(cached)) {
    return cached;
  }
  if (!hasProvisionedMnemonic(profile)) return null;
  try {
    const combined = formatEncryptedMnemonic(profile);
    return derivePublicKeyBase58FromEncryptedMnemonic(combined, encryptionKey);
  } catch {
    return null;
  }
}

/**
 * Ensure encrypted mnemonic exists for an identity (Privy) wallet.
 * Legacy backend did this inside getProfile(); platform must mirror on first read/trade.
 */
export async function ensureCustodialWalletProvisioned(
  db: PrismaClient,
  identityWallet: string,
  encryptionKey: string,
) {
  const wallet = identityWallet.trim();
  if (!wallet || !encryptionKey.trim()) return null;

  let profile = await db.profile.findUnique({ where: { walletAddress: wallet } });
  if (!profile) return null;

  if (hasProvisionedMnemonic(profile)) {
    if (!profile.mnemonicTag?.trim()) {
      const custodial = resolveCustodialDepositAddress(profile, encryptionKey);
      if (custodial) {
        await db.profile.update({
          where: { walletAddress: wallet },
          data: { mnemonicTag: custodial },
        });
      }
    }
    return db.profile.findUnique({ where: { walletAddress: wallet } });
  }

  const material = createCustodialWalletMaterial(encryptionKey);

  const updated = await db.profile.updateMany({
    where: {
      walletAddress: wallet,
      OR: [{ encryptedMnemonic: null }, { encryptedMnemonic: '' }],
    },
    data: {
      encryptedMnemonic: material.encryptedMnemonic,
      mnemonicIv: material.mnemonicIv,
      // Cache custodial pubkey for identity routing (indexer / profile queries).
      mnemonicTag: material.custodialAddress,
    },
  });

  if (updated.count === 0) {
    profile = await db.profile.findUnique({ where: { walletAddress: wallet } });
    return profile;
  }

  return db.profile.findUnique({ where: { walletAddress: wallet } });
}
