-- Migration: baseline
-- Sprint 1 Task 2 — full schema from prisma migrate diff --from-empty
-- Source: prisma/schema.prisma (Fun.Run V2)
-- Includes: 11 tables, 6 enums, indexes, PK/FK constraints, PostgreSQL extensions

-- Extensions (also in platform/scripts/init-db.sql; idempotent for CI / fresh deploy)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'CREATOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "CoinStatus" AS ENUM ('ACTIVE', 'GRADUATING', 'GRADUATED', 'PAUSED');

-- CreateEnum
CREATE TYPE "TradeType" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "Timeframe" AS ENUM ('1m', '5m', '15m', '1h', '4h', '1d');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('INITIALIZE', 'UPDATE_GLOBAL_CONFIG', 'PAUSE_PROTOCOL', 'UNPAUSE_PROTOCOL', 'SWEEP_TREASURY', 'GRADUATION_INITIATED', 'GRADUATION_COMPLETED', 'USER_BANNED', 'ADMIN_GRANTED');

-- CreateEnum
CREATE TYPE "TxStatus" AS ENUM ('BUILDING', 'SIGNING', 'PENDING', 'SUBMITTED', 'CONFIRMED', 'FINALIZED', 'FAILED', 'EXPIRED', 'ABANDONED');

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "wallet_address" VARCHAR(44) NOT NULL,
    "privy_user_id" VARCHAR(100) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "referrer_wallet" VARCHAR(44),
    "encrypted_mnemonic" TEXT,
    "mnemonic_iv" VARCHAR(64),
    "mnemonic_tag" VARCHAR(64),
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "run_balance_sol" DECIMAL(20,9) NOT NULL DEFAULT 0,
    "creator_rewards_sol" DECIMAL(20,9) NOT NULL DEFAULT 0,
    "referral_rewards_sol" DECIMAL(20,9) NOT NULL DEFAULT 0,
    "owner_rewards_sol" DECIMAL(20,9) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_seen_at" TIMESTAMP(3),

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coins" (
    "id" TEXT NOT NULL,
    "mint_address" VARCHAR(44) NOT NULL,
    "creator_wallet" VARCHAR(44) NOT NULL,
    "name" VARCHAR(32) NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "description" TEXT NOT NULL,
    "image_uri" TEXT NOT NULL,
    "metadata_uri" TEXT,
    "status" "CoinStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "virtual_sol_reserves" DECIMAL(30,0) NOT NULL,
    "virtual_token_reserves" DECIMAL(30,0) NOT NULL,
    "real_sol_reserves" DECIMAL(30,0) NOT NULL DEFAULT 0,
    "real_token_reserves" DECIMAL(30,0) NOT NULL,
    "total_fees_collected" DECIMAL(30,0) NOT NULL DEFAULT 0,
    "creator_fee_snapshot" DECIMAL(30,0),
    "referrer_fee_snapshot" DECIMAL(30,0),
    "referrer_wallet" VARCHAR(44),
    "graduation_initiated_at" TIMESTAMP(3),
    "graduation_completed_at" TIMESTAMP(3),
    "raydium_pool_address" VARCHAR(44),
    "lp_mint_address" VARCHAR(44),
    "lp_tokens_burned" BOOLEAN NOT NULL DEFAULT false,
    "mint_authority_revoked" BOOLEAN NOT NULL DEFAULT false,
    "freeze_authority_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holdings" (
    "id" TEXT NOT NULL,
    "wallet_address" VARCHAR(44) NOT NULL,
    "coin_id" TEXT NOT NULL,
    "token_balance" DECIMAL(30,0) NOT NULL,
    "cost_basis_sol" DECIMAL(20,9) NOT NULL DEFAULT 0,
    "total_bought" DECIMAL(30,0) NOT NULL DEFAULT 0,
    "total_sold" DECIMAL(30,0) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "coin_id" TEXT NOT NULL,
    "wallet_address" VARCHAR(44) NOT NULL,
    "trade_type" "TradeType" NOT NULL,
    "tx_signature" VARCHAR(88) NOT NULL,
    "slot" BIGINT NOT NULL,
    "sol_amount" DECIMAL(30,0) NOT NULL,
    "token_amount" DECIMAL(30,0) NOT NULL,
    "price_per_token" DECIMAL(30,15) NOT NULL,
    "total_fee" DECIMAL(30,0) NOT NULL,
    "creator_fee" DECIMAL(30,0) NOT NULL,
    "referrer_fee" DECIMAL(30,0) NOT NULL DEFAULT 0,
    "treasury_fee" DECIMAL(30,0) NOT NULL,
    "virtual_sol_after" DECIMAL(30,0) NOT NULL,
    "virtual_tokens_after" DECIMAL(30,0) NOT NULL,
    "confirmed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candles" (
    "id" TEXT NOT NULL,
    "coin_id" TEXT NOT NULL,
    "timeframe" "Timeframe" NOT NULL,
    "open_time" BIGINT NOT NULL,
    "open" DECIMAL(30,15) NOT NULL,
    "high" DECIMAL(30,15) NOT NULL,
    "low" DECIMAL(30,15) NOT NULL,
    "close" DECIMAL(30,15) NOT NULL,
    "volume" DECIMAL(30,0) NOT NULL,
    "trades" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_accounts" (
    "id" TEXT NOT NULL,
    "wallet_address" VARCHAR(44) NOT NULL,
    "total_fees_earned" DECIMAL(30,0) NOT NULL DEFAULT 0,
    "total_fees_claimed" DECIMAL(30,0) NOT NULL DEFAULT 0,
    "pending_fees" DECIMAL(30,0) NOT NULL DEFAULT 0,
    "referral_count" INTEGER NOT NULL DEFAULT 0,
    "last_claimed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treasury_events" (
    "id" TEXT NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "coin_id" TEXT,
    "tx_signature" VARCHAR(88),
    "amount_lamports" DECIMAL(30,0) NOT NULL,
    "cumulative_total" DECIMAL(30,0) NOT NULL,
    "memo" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treasury_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "action" "AuditAction" NOT NULL,
    "actor_wallet" VARCHAR(44) NOT NULL,
    "target_id" TEXT,
    "old_value" JSONB,
    "new_value" JSONB,
    "tx_signature" VARCHAR(88),
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indexer_state" (
    "id" VARCHAR(20) NOT NULL,
    "last_slot" BIGINT NOT NULL,
    "last_signature" VARCHAR(88),
    "is_healthy" BOOLEAN NOT NULL DEFAULT true,
    "error_message" VARCHAR(500),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indexer_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_txs" (
    "id" TEXT NOT NULL,
    "idempotency_key" VARCHAR(128) NOT NULL,
    "wallet_address" VARCHAR(44) NOT NULL,
    "operation_type" VARCHAR(32) NOT NULL,
    "coin_id" TEXT,
    "status" "TxStatus" NOT NULL DEFAULT 'BUILDING',
    "serialized_tx" BYTEA,
    "signature" VARCHAR(88),
    "blockhash" VARCHAR(88),
    "last_valid_block_height" BIGINT,
    "confirmed_slot" BIGINT,
    "finalized_at" TIMESTAMP(3),
    "error_message" TEXT,
    "error_code" VARCHAR(64),
    "can_resubmit" BOOLEAN NOT NULL DEFAULT false,
    "submit_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_submitted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_txs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "wallet_address" VARCHAR(44) NOT NULL,
    "platform" VARCHAR(10) NOT NULL,
    "token" VARCHAR(512) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_wallet_address_key" ON "profiles"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_privy_user_id_key" ON "profiles"("privy_user_id");

-- CreateIndex
CREATE INDEX "profiles_wallet_address_idx" ON "profiles"("wallet_address");

-- CreateIndex
CREATE INDEX "profiles_privy_user_id_idx" ON "profiles"("privy_user_id");

-- CreateIndex
CREATE INDEX "profiles_referrer_wallet_idx" ON "profiles"("referrer_wallet");

-- CreateIndex
CREATE UNIQUE INDEX "coins_mint_address_key" ON "coins"("mint_address");

-- CreateIndex
CREATE INDEX "coins_creator_wallet_idx" ON "coins"("creator_wallet");

-- CreateIndex
CREATE INDEX "coins_status_idx" ON "coins"("status");

-- CreateIndex
CREATE INDEX "coins_status_real_sol_reserves_idx" ON "coins"("status", "real_sol_reserves");

-- CreateIndex
CREATE INDEX "coins_created_at_idx" ON "coins"("created_at" DESC);

-- CreateIndex
CREATE INDEX "holdings_wallet_address_idx" ON "holdings"("wallet_address");

-- CreateIndex
CREATE INDEX "holdings_coin_id_idx" ON "holdings"("coin_id");

-- CreateIndex
CREATE UNIQUE INDEX "holdings_wallet_address_coin_id_key" ON "holdings"("wallet_address", "coin_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_tx_signature_key" ON "transactions"("tx_signature");

-- CreateIndex
CREATE INDEX "transactions_coin_id_confirmed_at_idx" ON "transactions"("coin_id", "confirmed_at" DESC);

-- CreateIndex
CREATE INDEX "transactions_wallet_address_confirmed_at_idx" ON "transactions"("wallet_address", "confirmed_at" DESC);

-- CreateIndex
CREATE INDEX "transactions_slot_idx" ON "transactions"("slot");

-- CreateIndex
CREATE INDEX "candles_coin_id_timeframe_open_time_idx" ON "candles"("coin_id", "timeframe", "open_time" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "candles_coin_id_timeframe_open_time_key" ON "candles"("coin_id", "timeframe", "open_time");

-- CreateIndex
CREATE UNIQUE INDEX "referral_accounts_wallet_address_key" ON "referral_accounts"("wallet_address");

-- CreateIndex
CREATE INDEX "referral_accounts_total_fees_earned_idx" ON "referral_accounts"("total_fees_earned" DESC);

-- CreateIndex
CREATE INDEX "treasury_events_event_type_idx" ON "treasury_events"("event_type");

-- CreateIndex
CREATE INDEX "treasury_events_created_at_idx" ON "treasury_events"("created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_actor_wallet_idx" ON "audit_logs"("actor_wallet");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "pending_txs_idempotency_key_key" ON "pending_txs"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "pending_txs_signature_key" ON "pending_txs"("signature");

-- CreateIndex
CREATE INDEX "pending_txs_wallet_address_status_idx" ON "pending_txs"("wallet_address", "status");

-- CreateIndex
CREATE INDEX "pending_txs_status_created_at_idx" ON "pending_txs"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "pending_txs_status_last_valid_block_height_idx" ON "pending_txs"("status", "last_valid_block_height");

-- CreateIndex
CREATE INDEX "push_subscriptions_wallet_address_idx" ON "push_subscriptions"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_wallet_address_token_key" ON "push_subscriptions"("wallet_address", "token");

-- CreateTable (Sprint 7 — wallet deposits & withdrawals)
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL,
    "wallet_address" VARCHAR(44) NOT NULL,
    "tx_signature" VARCHAR(88) NOT NULL,
    "amount_sol" DECIMAL(20,9) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_scans" (
    "wallet_address" VARCHAR(44) NOT NULL,
    "last_signature" VARCHAR(88),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposit_scans_pkey" PRIMARY KEY ("wallet_address")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" TEXT NOT NULL,
    "wallet_address" VARCHAR(44) NOT NULL,
    "destination" VARCHAR(44) NOT NULL,
    "amount_sol" DECIMAL(20,9) NOT NULL,
    "tx_signature" VARCHAR(88),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "idempotency_key" VARCHAR(128),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deposits_tx_signature_key" ON "deposits"("tx_signature");

-- CreateIndex
CREATE INDEX "deposits_wallet_address_created_at_idx" ON "deposits"("wallet_address", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "withdrawals_idempotency_key_key" ON "withdrawals"("idempotency_key");

-- CreateIndex
CREATE INDEX "withdrawals_wallet_address_created_at_idx" ON "withdrawals"("wallet_address", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "coins" ADD CONSTRAINT "coins_creator_wallet_fkey" FOREIGN KEY ("creator_wallet") REFERENCES "profiles"("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_wallet_address_fkey" FOREIGN KEY ("wallet_address") REFERENCES "profiles"("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_coin_id_fkey" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_coin_id_fkey" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_address_fkey" FOREIGN KEY ("wallet_address") REFERENCES "profiles"("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candles" ADD CONSTRAINT "candles_coin_id_fkey" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
