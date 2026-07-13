import { Keypair, PublicKey, type Connection } from '@solana/web3.js';
import type { PrismaClient } from '@funrun/database';
import type { Logger } from '@funrun/logger';

import type { CreateCoinExecutor } from '../executors/create-coin-executor.js';
import { DuplicateIdempotencyKeyError } from '../executors/executor-utils.js';
import { loadWalletForSigning } from '../wallet/profile-loader.js';
import { ensureCustodialFunded } from '../wallet/custodial-funding.js';
import type { TradeContext } from '../types.js';

export interface CreateCoinRequest {
  name: string;
  symbol: string;
  story?: string;
  logo?: string;
  metadataUri?: string;
}

export interface CreateCoinResult {
  txId: string;
  signature: string;
  mintAddress: string;
  bondingCurvePda: string;
  status: 'SUBMITTED';
  mode: 'onchain';
  idempotent: boolean;
  requestId: string;
}

function resolveUri(req: CreateCoinRequest): string {
  const uri = String(req.metadataUri || req.logo || '').trim();
  if (uri) return uri.slice(0, 200);
  const story = String(req.story || '').trim();
  if (story) return story.slice(0, 200);
  return `https://fun.run/coin/${encodeURIComponent(req.symbol)}`;
}

export class CreateCoinOrchestrator {
  constructor(
    private readonly db: PrismaClient,
    private readonly executor: CreateCoinExecutor,
    private readonly encryptionKey: string,
    private readonly logger: Logger,
    private readonly connection: Connection,
    private readonly treasury: Keypair,
  ) {}

  async create(
    req: CreateCoinRequest,
    ctx: TradeContext,
    idempotencyKey?: string,
  ): Promise<CreateCoinResult> {
    const wallet = await loadWalletForSigning(this.db, ctx.walletAddress, this.encryptionKey);
    const key =
      idempotencyKey?.trim() ||
      `${ctx.walletAddress}:${ctx.requestId}:create`;

    await ensureCustodialFunded(
      this.connection,
      this.treasury,
      wallet.walletAddress,
      this.logger,
    );

    const profile = await this.db.profile.findUnique({
      where: { walletAddress: ctx.walletAddress },
      select: { referrerWallet: true },
    });
    const referrer = profile?.referrerWallet
      ? new PublicKey(profile.referrerWallet)
      : undefined;

    try {
      const result = await this.executor.execute({
        idempotencyKey: key,
        walletAddress: wallet.walletAddress,
        encryptedMnemonic: wallet.encryptedMnemonic,
        encryptionKey: this.encryptionKey,
        name: req.name.slice(0, 32),
        symbol: req.symbol.slice(0, 10).toUpperCase(),
        uri: resolveUri(req),
        ...(referrer !== undefined ? { referrer } : {}),
      });

      this.logger.info(
        { mint: result.mintAddress, signature: result.signature },
        'CreateCoinOrchestrator: submitted',
      );

      return {
        txId: result.txId,
        signature: result.signature,
        mintAddress: result.mintAddress,
        bondingCurvePda: result.bondingCurvePda,
        status: 'SUBMITTED',
        mode: 'onchain',
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
}
