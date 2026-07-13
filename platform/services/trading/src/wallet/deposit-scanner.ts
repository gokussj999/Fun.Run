import { Connection, PublicKey } from '@solana/web3.js';
import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';

import { resolveCustodialDepositAddress } from './custodial-wallet.js';

const LAMPORTS_PER_SOL = 1_000_000_000;

export class DepositScanner {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly db: PrismaClient,
    private readonly connection: Connection,
    private readonly logger: Logger,
    private readonly encryptionKey: string,
    private readonly intervalMs = 30_000,
  ) {}

  start(): void {
    if (this.timer) return;
    void this.scanAll();
    this.timer = setInterval(() => void this.scanAll(), this.intervalMs);
    this.logger.info({ intervalMs: this.intervalMs }, 'DepositScanner started');
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async scanAll(): Promise<void> {
    if (!this.encryptionKey.trim()) return;

    let profiles: Array<{ walletAddress: string; mnemonicTag: string | null; encryptedMnemonic: string | null; mnemonicIv: string | null }>;
    try {
      profiles = await this.db.profile.findMany({
        where: { encryptedMnemonic: { not: null } },
        select: {
          walletAddress: true,
          mnemonicTag: true,
          encryptedMnemonic: true,
          mnemonicIv: true,
        },
      });
    } catch (err) {
      this.logger.warn({ err }, 'DepositScanner: DB unreachable — skipping scan pass');
      return;
    }

    for (const profile of profiles) {
      const custodialAddress =
        profile.mnemonicTag?.trim()
        || resolveCustodialDepositAddress(profile, this.encryptionKey);
      if (!custodialAddress) continue;
      try {
        await this.scanWallet(custodialAddress, profile.walletAddress);
      } catch (err) {
        this.logger.warn(
          { identityWallet: profile.walletAddress, custodialAddress, err },
          'DepositScanner: wallet scan failed',
        );
      }
    }
  }

  async scanWallet(custodialAddress: string, identityWallet: string): Promise<void> {
    const w = custodialAddress.trim();
    const creditWallet = identityWallet.trim();
    if (!w || !creditWallet) return;

    const pub = new PublicKey(w);
    const cursor = await this.db.depositScan.findUnique({ where: { walletAddress: w } });
    const lastSignature = cursor?.lastSignature ?? undefined;

    const allSignatures: Array<{ signature: string }> = [];
    let before: string | undefined;
    for (;;) {
      const batch = await this.connection.getSignaturesForAddress(pub, {
        limit: 100,
        ...(before ? { before } : {}),
        ...(lastSignature ? { until: lastSignature } : {}),
      });
      if (!batch.length) break;
      allSignatures.push(...batch.map((s) => ({ signature: s.signature })));
      if (batch.length < 100) break;
      before = batch[batch.length - 1]!.signature;
    }

    if (!allSignatures.length) return;

    for (const sig of allSignatures) {
      const signature = String(sig.signature || '').trim();
      if (!signature) continue;

      const tx = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });
      if (!tx?.meta) continue;

      const accountKeys = tx.transaction.message.accountKeys;
      const walletIndex = accountKeys.findIndex(
        (k) => String(k.pubkey.toBase58()) === w,
      );
      if (walletIndex === -1) continue;

      const pre = Number(tx.meta.preBalances[walletIndex] ?? 0) / LAMPORTS_PER_SOL;
      const post = Number(tx.meta.postBalances[walletIndex] ?? 0) / LAMPORTS_PER_SOL;
      const diff = post - pre;
      if (diff <= 0) continue;

      await this.creditDeposit(creditWallet, signature, diff);
    }

    if (allSignatures[0]?.signature) {
      await this.db.depositScan.upsert({
        where: { walletAddress: w },
        create: { walletAddress: w, lastSignature: allSignatures[0]!.signature },
        update: { lastSignature: allSignatures[0]!.signature },
      });
    }
  }

  private async creditDeposit(
    identityWallet: string,
    txSignature: string,
    amountSol: number,
  ): Promise<boolean> {
    try {
      await this.db.$transaction(async (tx) => {
        const existing = await tx.deposit.findUnique({ where: { txSignature } });
        if (existing) return;

        await tx.deposit.create({
          data: {
            walletAddress: identityWallet,
            txSignature,
            amountSol: amountSol.toFixed(9),
            status: 'confirmed',
          },
        });

        await tx.profile.update({
          where: { walletAddress: identityWallet },
          data: {
            runBalanceSol: { increment: amountSol },
          },
        });
      });
      this.logger.info({ wallet: identityWallet, txSignature, amountSol }, 'Deposit credited');
      return true;
    } catch (err) {
      this.logger.warn({ wallet: identityWallet, txSignature, err }, 'Deposit credit skipped');
      return false;
    }
  }
}
