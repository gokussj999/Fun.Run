import { Keypair, PublicKey, type Connection } from '@solana/web3.js';
import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';

import type { BuyExecutor } from '../executors/buy-executor.js';
import type { SellExecutor } from '../executors/sell-executor.js';
import { DuplicateIdempotencyKeyError } from '../executors/executor-utils.js';
import {
  loadCoinForTrade,
  loadWalletForSigning,
  ProfileLoadError,
} from '../wallet/profile-loader.js';
import { ensureCustodialFunded } from '../wallet/custodial-funding.js';
import type { BuyRequest, SellRequest, TradeContext } from '../types.js';
import type { OnChainTradeResult } from '../types.js';

function resolveIdempotencyKey(
  operation: 'buy' | 'sell',
  ctx: TradeContext,
  headerKey?: string,
): string {
  if (headerKey?.trim()) {
    return headerKey.trim();
  }
  return `${ctx.walletAddress}:${ctx.requestId}:${operation}`;
}

export class OnChainTradeOrchestrator {
  constructor(
    private readonly db: PrismaClient,
    private readonly buyExecutor: BuyExecutor,
    private readonly sellExecutor: SellExecutor,
    private readonly encryptionKey: string,
    private readonly logger: Logger,
    private readonly connection: Connection,
    private readonly treasury: Keypair,
  ) {}

  async buy(
    req: BuyRequest,
    ctx: TradeContext,
    idempotencyKey?: string,
  ): Promise<OnChainTradeResult> {
    const coin = await loadCoinForTrade(this.db, req.coinId);
    const wallet = await loadWalletForSigning(this.db, ctx.walletAddress, this.encryptionKey);
    const key = resolveIdempotencyKey('buy', ctx, idempotencyKey);

    const solNeeded = Number(req.solAmountLamports) / 1_000_000_000;
    await this.debitRunBalance(ctx.walletAddress, solNeeded);

    const tradeLamports =
      req.solAmountLamports + 5_000_000n; // trade + fee buffer

    const referrer = coin.referrerWallet
      ? new PublicKey(coin.referrerWallet)
      : undefined;

    try {
      // ensureCustodialFunded is inside the try so a funding failure triggers creditRunBalance
      await ensureCustodialFunded(
        this.connection,
        this.treasury,
        wallet.walletAddress,
        this.logger,
        tradeLamports,
      );

      const result = await this.buyExecutor.execute({
        idempotencyKey: key,
        walletAddress: wallet.walletAddress,
        encryptedMnemonic: wallet.encryptedMnemonic,
        encryptionKey: this.encryptionKey,
        mint: new PublicKey(coin.mintAddress),
        solAmount: req.solAmountLamports,
        minTokensOut: req.minTokensOut,
        coinId: coin.coinId,
        ...(referrer !== undefined ? { referrer } : {}),
      });

      this.logger.info(
        { txId: result.txId, signature: result.signature, coinId: req.coinId },
        'OnChainTradeOrchestrator: buy submitted',
      );

      return {
        txId: result.txId,
        signature: result.signature,
        coinId: req.coinId,
        mintAddress: coin.mintAddress,
        walletAddress: ctx.walletAddress,
        tradeType: 'BUY',
        status: 'SUBMITTED',
        idempotent: result.idempotent,
        requestId: ctx.requestId,
      };
    } catch (err) {
      await this.creditRunBalance(ctx.walletAddress, solNeeded);
      if (err instanceof DuplicateIdempotencyKeyError) {
        throw Object.assign(err, { code: 'IDEMPOTENCY_CONFLICT' });
      }
      throw err;
    }
  }

  async sell(
    req: SellRequest,
    ctx: TradeContext,
    idempotencyKey?: string,
  ): Promise<OnChainTradeResult> {
    const coin = await loadCoinForTrade(this.db, req.coinId);
    const wallet = await loadWalletForSigning(this.db, ctx.walletAddress, this.encryptionKey);
    const key = resolveIdempotencyKey('sell', ctx, idempotencyKey);

    await ensureCustodialFunded(
      this.connection,
      this.treasury,
      wallet.walletAddress,
      this.logger,
    );

    const referrer = coin.referrerWallet
      ? new PublicKey(coin.referrerWallet)
      : undefined;

    try {
      const result = await this.sellExecutor.execute({
        idempotencyKey: key,
        walletAddress: wallet.walletAddress,
        encryptedMnemonic: wallet.encryptedMnemonic,
        encryptionKey: this.encryptionKey,
        mint: new PublicKey(coin.mintAddress),
        tokenAmount: req.tokenAmountRaw,
        minSolOut: req.minSolOut,
        coinId: coin.coinId,
        ...(referrer !== undefined ? { referrer } : {}),
      });

      this.logger.info(
        { txId: result.txId, signature: result.signature, coinId: req.coinId },
        'OnChainTradeOrchestrator: sell submitted',
      );

      return {
        txId: result.txId,
        signature: result.signature,
        coinId: req.coinId,
        mintAddress: coin.mintAddress,
        walletAddress: ctx.walletAddress,
        tradeType: 'SELL',
        status: 'SUBMITTED',
        idempotent: result.idempotent,
        requestId: ctx.requestId,
      };
    } catch (err) {
      if (err instanceof DuplicateIdempotencyKeyError) {
        throw Object.assign(err, { code: 'IDEMPOTENCY_CONFLICT' });
      }
      throw err;
    }
  }

  private async debitRunBalance(walletAddress: string, solAmount: number): Promise<void> {
    const updated = await this.db.profile.updateMany({
      where: { walletAddress, runBalanceSol: { gte: solAmount } },
      data: { runBalanceSol: { decrement: solAmount } },
    });
    if (updated.count === 0) {
      throw new ProfileLoadError('Insufficient balance', 'INSUFFICIENT_BALANCE');
    }
  }

  private async creditRunBalance(walletAddress: string, solAmount: number): Promise<void> {
    if (solAmount <= 0) return;
    await this.db.profile.update({
      where: { walletAddress },
      data: { runBalanceSol: { increment: solAmount } },
    });
  }
}
