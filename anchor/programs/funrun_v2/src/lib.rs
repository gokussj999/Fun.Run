// Anchor 0.31.1 macro expansion emits these; suppressing here is the only option.
#![allow(unexpected_cfgs, deprecated)]

use anchor_lang::prelude::*;

pub mod consts;
pub mod deploy_config;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod math;
pub mod state;

#[cfg(test)]
mod property_tests;

use instructions::*;

declare_id!("HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP");

#[program]
pub mod funrun_v2 {
    use super::*;

    // ── P1: Administration ────────────────────────────────────────────────────

    /// Initialises the protocol by creating the `GlobalConfig` and `Treasury`
    /// singleton PDAs.  Must be called exactly once after deployment.
    /// The transaction signer becomes the initial `admin` and `fee_recipient`.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    /// Updates one or more protocol-wide configuration parameters.
    /// All parameters are optional; `None` values are left unchanged.
    /// Only the current `admin` may call this instruction.
    pub fn update_global_config(
        ctx: Context<UpdateGlobalConfig>,
        new_creation_fee: Option<u64>,
        new_trading_fee_bps: Option<u16>,
        new_graduation_threshold: Option<u64>,
        new_graduation_dex_fee: Option<u64>,
        new_fee_recipient: Option<Pubkey>,
    ) -> Result<()> {
        instructions::update_global_config::handler(
            ctx,
            new_creation_fee,
            new_trading_fee_bps,
            new_graduation_threshold,
            new_graduation_dex_fee,
            new_fee_recipient,
        )
    }

    /// Pauses the protocol globally.  All user-facing instructions will fail
    /// with [`errors::FunrunError::ProgramPaused`] until unpaused.
    /// Admin instructions are not affected.  Idempotent.
    pub fn pause_protocol(ctx: Context<SetPaused>) -> Result<()> {
        instructions::pause::pause_handler(ctx)
    }

    /// Unpauses the protocol, resuming all user-facing instructions.
    /// Idempotent.
    pub fn unpause_protocol(ctx: Context<SetPaused>) -> Result<()> {
        instructions::pause::unpause_handler(ctx)
    }

    /// Sweeps all accumulated SOL from the Treasury PDA to `fee_recipient`,
    /// leaving the rent-exempt minimum.  Only the current `admin` may call
    /// this instruction.
    pub fn sweep_treasury(ctx: Context<SweepTreasury>) -> Result<()> {
        instructions::sweep_treasury::handler(ctx)
    }

    // ── P2: Creator identity & referral ──────────────────────────────────────

    /// Sets the caller's permanent creator referrer.
    ///
    /// The relationship is write-once and immutable: once set it cannot be
    /// changed or removed.  The referrer is snapshotted into every
    /// `BondingCurve` the creator mints, giving the referrer a permanent 20%
    /// share of trading fees on those coins.
    ///
    /// Requires the referrer to already hold a `CreatorProfile` (proving they
    /// have interacted with the protocol).  Rejects self-referrals, default
    /// keys, and direct circular relationships.
    pub fn set_creator_referrer(ctx: Context<SetCreatorReferrer>) -> Result<()> {
        instructions::set_creator_referrer::handler(ctx)
    }

    // ── P3: Coin creation ─────────────────────────────────────────────────────

    /// Launches a new meme coin on the Fun.Run bonding curve.
    ///
    /// Creates an SPL mint (6 decimals), initialises the `BondingCurve` PDA
    /// with virtual AMM reserves and a permanent creator-referrer snapshot,
    /// mints `BONDING_SUPPLY_TOKENS` (800 M) to the curve vault, and collects
    /// the creation fee (100% → Treasury).
    ///
    /// Requires the protocol to be unpaused.  Duplicate mint addresses are
    /// rejected at the account-validation layer.
    pub fn create_coin(
        ctx: Context<CreateCoin>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        instructions::create_coin::handler(ctx, name, symbol, uri)
    }

    // ── P4: Trading (buy / sell) ─────────────────────────────────────────────

    /// Buys tokens from the bonding curve with SOL.
    ///
    /// The buyer sends `sol_amount` lamports and receives tokens in return.
    /// `min_tokens_out` is the slippage guard — the instruction fails if the
    /// AMM would deliver fewer tokens than this value.
    ///
    /// Requires the protocol to be unpaused and the curve to not be complete.
    pub fn buy(ctx: Context<Buy>, sol_amount: u64, min_tokens_out: u64) -> Result<()> {
        instructions::buy::handler(ctx, sol_amount, min_tokens_out)
    }

    /// Sells tokens back to the bonding curve for SOL.
    ///
    /// The seller transfers `token_amount` raw token units and receives SOL
    /// in return.  `min_sol_out` is the slippage guard — the instruction fails
    /// if the AMM would return fewer lamports than this value.
    ///
    /// Requires the protocol to be unpaused and the curve to not be complete.
    pub fn sell(ctx: Context<Sell>, token_amount: u64, min_sol_out: u64) -> Result<()> {
        instructions::sell::handler(ctx, token_amount, min_sol_out)
    }

    // ── P5: Fee claims ────────────────────────────────────────────────────────

    /// Claims all SOL accumulated in `BondingCurve.creator_fees_accumulated`.
    ///
    /// The coin creator withdraws their 40% share of trading fees.  Valid at
    /// any point in the coin lifecycle — before and after graduation.
    /// Zero-balance claims succeed and emit an event.
    ///
    /// **Pause exemption**: this instruction is intentionally not gated on
    /// `GlobalConfig.paused`.  It only withdraws previously earned funds from
    /// a program-owned PDA and does not modify trading state.
    pub fn claim_creator_fees(ctx: Context<ClaimCreatorFees>) -> Result<()> {
        instructions::claim_creator_fees::handler(ctx)
    }

    /// Claims all SOL accumulated in the `ReferralAccount` lamport balance.
    ///
    /// The referrer withdraws their 20% share of trading fees from all coins
    /// whose creators set them as `creator_referrer`.  The claimable amount
    /// is the excess above the rent-exempt minimum.
    /// Zero-balance claims succeed and emit an event.
    ///
    /// **Pause exemption**: this instruction is intentionally not gated on
    /// `GlobalConfig.paused`.  It only withdraws previously earned funds from
    /// a program-owned PDA and does not modify trading state.
    pub fn claim_referrer_fees(ctx: Context<ClaimReferrerFees>) -> Result<()> {
        instructions::claim_referrer_fees::handler(ctx)
    }

    // ── P6: DEX graduation ────────────────────────────────────────────────────

    /// Completes graduation: creates a Raydium CPMM pool, migrates liquidity,
    /// and permanently burns all LP tokens so the position is irrecoverable.
    ///
    /// # Execution sequence
    ///
    /// 1–14. Validate all accounts (Raydium PDAs, vault addresses, authorities).
    /// 15.   Transfer `graduation_dex_fee_snapshot` lamports to the Treasury.
    /// 16.   Mint `LP_RESERVE_TOKENS` (200 M tokens) to the bonding-curve vault.
    /// 17.   Create the bonding-curve WSOL ATA (idempotent).
    /// 18.   Transfer `sol_to_dex` lamports from the bonding-curve PDA to the WSOL ATA.
    /// 19.   `sync_native` — update WSOL token balance to reflect deposited lamports.
    /// 20.   CPI `raydium_cpmm::initialize` with bonding-curve PDA as signer.
    /// 21.   Post-CPI verification: pool ownership, LP mint, observation, vault balances, LP amount.
    /// 22.   Pre-burn LP balance check (`actual_lp > 0`).
    /// 23.   Burn all LP tokens via SPL Token `burn` CPI — protocol holds zero recoverable LP.
    /// 24.   Post-burn verification: `creator_lp_token.amount == 0`.
    /// 25.   Emit `LiquidityLocked`.
    /// 26.   Mint authority: if `Some(bonding_curve)` revoke → `None`; if already `None`, skip.
    /// 27.   (conditional) Revoke coin mint authority via SPL Token `set_authority` CPI.
    /// 28.   Verify `mint_authority == None`.
    /// 29.   Emit `MintAuthorityRevoked`.
    /// 30.   Freeze authority: if `Some(bonding_curve)` revoke → `None`; if already `None`, skip.
    /// 31.   (conditional) Revoke freeze authority via SPL Token `set_authority` CPI.
    /// 32.   Reload `coin_mint`; verify `freeze_authority == None`.
    /// 33.   Post-revocation verification: both authorities `None`.
    /// 34.   Set `bonding_curve.graduated = true`; emit `GraduationCompleted`.
    /// 35.   Emit `FreezeAuthorityRevoked`.
    ///
    /// Atomicity: any failure in steps 15–35 rolls back the entire transaction.
    ///
    /// # Preconditions
    ///
    /// - `bonding_curve.complete == true` (set by `initiate_graduation`).
    /// - `bonding_curve.graduated == false` (idempotency guard).
    /// - All Raydium account PDAs correctly derived.
    /// - Coin mint/freeze authority is either already `None` (create-time revoke)
    ///   or still held by the bonding-curve PDA (legacy coins).
    pub fn complete_graduation(ctx: Context<CompleteGraduation>) -> Result<()> {
        instructions::complete_graduation::handler(ctx)
    }

    /// Initiates the graduation of a bonding curve to a Raydium CPMM DEX pool.
    ///
    /// This is the **first** of two graduation instructions (P6.1 / P6.2).
    /// It implements the ELIGIBLE → GRADUATING state transition:
    ///
    /// - Freezes the bonding curve by setting `complete = true`; subsequent
    ///   `buy` and `sell` calls will fail with [`errors::FunrunError::CurveComplete`].
    /// - Locks in `graduation_dex_fee_snapshot` from the current `GlobalConfig`,
    ///   so a later admin update cannot affect the amount sent to the DEX pool.
    ///
    /// No SOL or token transfers occur here.  Raydium CPI, LP creation, and
    /// authority revocations are handled in the P6.2 `complete_graduation`
    /// instruction (not yet implemented).
    ///
    /// **Permissionless**: any wallet may call this instruction once the curve
    /// has reached the graduation threshold.
    ///
    /// # Eligibility requirements (all enforced atomically)
    ///
    /// 1. Protocol is not paused.
    /// 2. `BondingCurve.complete == false` (not already graduating / graduated).
    /// 3. `BondingCurve.real_sol_reserves ≥ GlobalConfig.graduation_threshold`.
    /// 4. `BondingCurve.protocol_version == PROTOCOL_VERSION`.
    /// 5. `real_sol_reserves − graduation_dex_fee > 0` (DEX pool would be non-empty).
    pub fn initiate_graduation(ctx: Context<InitiateGraduation>) -> Result<()> {
        instructions::initiate_graduation::handler(ctx)
    }
}
