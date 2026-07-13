import type { PrismaClient } from '@funrun/database';

import { derivePublicKeyBase58FromEncryptedMnemonic } from '../tx/signer.js';
import { ensureCustodialWalletProvisioned } from './custodial-wallet.js';

export class ProfileLoadError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'ProfileLoadError';
  }
}

export interface CoinTradeContext {
  coinId: string;
  mintAddress: string;
  referrerWallet: string | null;
  status: string;
}

export interface WalletSigningContext {
  walletAddress: string;
  /** AES-256-CBC format: `iv_hex:ciphertext_hex` for CustodialSigner. */
  encryptedMnemonic: string;
}

/** Build iv:ciphertext string from profile columns. */
export function formatEncryptedMnemonic(profile: {
  encryptedMnemonic: string | null;
  mnemonicIv: string | null;
}): string {
  const enc = profile.encryptedMnemonic?.trim() ?? '';
  if (!enc) {
    throw new ProfileLoadError(
      'Custodial wallet not provisioned for this account',
      'WALLET_NOT_READY',
    );
  }
  if (enc.includes(':')) {
    return enc;
  }
  const iv = profile.mnemonicIv?.trim();
  if (iv) {
    return `${iv}:${enc}`;
  }
  throw new ProfileLoadError(
    'Encrypted mnemonic missing IV — cannot decrypt',
    'MNEMONIC_FORMAT_INVALID',
  );
}

export async function loadCoinForTrade(
  db: PrismaClient,
  coinId: string,
): Promise<CoinTradeContext> {
  let coin;
  try {
    coin = await db.coin.findUniqueOrThrow({
      where: { id: coinId },
      select: {
        id: true,
        mintAddress: true,
        referrerWallet: true,
        status: true,
      },
    });
  } catch {
    throw new ProfileLoadError('Coin not found', 'NOT_FOUND');
  }

  if (coin.status === 'GRADUATED') {
    throw new ProfileLoadError('Coin has graduated — trade on Raydium', 'COIN_GRADUATED');
  }
  if (coin.status === 'PAUSED') {
    throw new ProfileLoadError('Trading is paused for this coin', 'COIN_PAUSED');
  }
  if (!coin.mintAddress?.trim()) {
    throw new ProfileLoadError('Coin has no on-chain mint address', 'MINT_NOT_FOUND');
  }

  return {
    coinId: coin.id,
    mintAddress: coin.mintAddress,
    referrerWallet: coin.referrerWallet,
    status: coin.status,
  };
}

export async function loadWalletForSigning(
  db: PrismaClient,
  walletAddress: string,
  encryptionKey?: string,
): Promise<WalletSigningContext> {
  if (encryptionKey?.trim()) {
    await ensureCustodialWalletProvisioned(db, walletAddress, encryptionKey);
  }

  const profile = await db.profile.findUnique({
    where: { walletAddress },
    select: {
      walletAddress: true,
      encryptedMnemonic: true,
      mnemonicIv: true,
      isBanned: true,
    },
  });

  if (!profile) {
    throw new ProfileLoadError('Profile not found', 'NOT_FOUND');
  }
  if (profile.isBanned) {
    throw new ProfileLoadError('Account is banned', 'ACCOUNT_BANNED');
  }

  const encryptedMnemonic = formatEncryptedMnemonic(profile);
  const signingAddress = encryptionKey?.trim()
    ? derivePublicKeyBase58FromEncryptedMnemonic(encryptedMnemonic, encryptionKey)
    : profile.walletAddress;

  return {
    walletAddress: signingAddress,
    encryptedMnemonic,
  };
}
