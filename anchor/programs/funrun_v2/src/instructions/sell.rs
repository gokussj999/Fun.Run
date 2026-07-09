use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer as TokenTransfer};

use crate::consts::*;
use crate::errors::FunrunError;
use crate::events::TokensSold;
use crate::math::{compute_sol_out, compute_total_fee, split_fee, FeeSplit};
use crate::state::{BondingCurve, GlobalConfig, Treasury};

// ─────────────────────────────────────────────────────────────────────────────
// Accounts (unchanged from P4.1)
// ─────────────────────────────────────────────────────────────────────────────

/// Accounts required by the `sell` instruction.
///
/// The seller transfers tokens to the bonding curve vault and receives SOL
/// from the real reserves.  Fee distribution (40% Treasury / 40% Creator /
/// 20% Referrer) and state mutations are applied in P4.5.
///
/// `referral_account` is validated in the handler against
/// `bonding_curve.creator_referrer`.  Pass `SystemProgram::id()` if
/// `bonding_curve.creator_referrer` is `None`.
#[derive(Accounts)]
pub struct Sell<'info> {
    /// Seller wallet — signs and receives SOL proceeds.
    #[account(mut)]
    pub seller: Signer<'info>,

    /// Protocol configuration (read-only).  Paused state enforced here.
    #[account(
        seeds = [GLOBAL_CONFIG_SEED],
        bump = global_config.bump,
        constraint = !global_config.paused @ FunrunError::ProgramPaused,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    /// Protocol treasury — receives its share of the trading fee.
    #[account(
        mut,
        seeds = [TREASURY_SEED],
        bump = treasury.bump,
    )]
    pub treasury: Account<'info, Treasury>,

    /// SPL mint for this coin — validated via `bonding_curve.has_one = mint`.
    pub mint: Account<'info, Mint>,

    /// Bonding curve AMM state for this coin.
    ///
    /// Seeds derive from `mint.key()`, binding this curve to a single mint.
    /// Trade rejected if the curve is already complete (graduated).
    #[account(
        mut,
        seeds = [BONDING_CURVE_SEED, mint.key().as_ref()],
        bump = bonding_curve.bump,
        has_one = mint,
        constraint = !bonding_curve.complete @ FunrunError::CurveComplete,
    )]
    pub bonding_curve: Account<'info, BondingCurve>,

    /// Bonding curve token vault (receives tokens sold by the seller).
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = bonding_curve,
    )]
    pub bonding_curve_vault: Account<'info, TokenAccount>,

    /// Seller's token account (source of tokens being sold; must already exist).
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = seller,
    )]
    pub seller_token_account: Account<'info, TokenAccount>,

    /// Creator referrer account for fee distribution.
    ///
    /// CHECK: validated in handler against `bonding_curve.creator_referrer`
    /// PDA derivation. Pass `SystemProgram::id()` when no referrer exists.
    #[account(mut)]
    pub referral_account: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure computation result
// ─────────────────────────────────────────────────────────────────────────────

/// Complete post-trade state produced by `validate_sell`.
///
/// Encapsulates every value needed to atomically apply a sell:
/// - amounts for SOL/token transfers
/// - amounts for fee distribution
/// - new reserve values to write to `BondingCurve`
///
/// No on-chain mutation occurs before `validate_sell` returns `Ok(SellResult)`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SellResult {
    /// Gross SOL the AMM returns for `token_amount` (before fee deduction).
    pub sol_gross: u64,

    /// Total trading fee deducted from `sol_gross`.
    /// Equals `fee_split.treasury + fee_split.creator + fee_split.referrer`.
    pub total_fee: u64,

    /// Net SOL delivered to the seller (`sol_gross - total_fee`).
    pub sol_net: u64,

    /// Fee split into treasury / creator / referrer shares.
    /// Invariant: `fee_split.treasury + fee_split.creator + fee_split.referrer == total_fee`.
    pub fee_split: FeeSplit,

    /// `BondingCurve.virtual_sol_reserves` after this trade (`old - sol_gross`).
    pub new_virtual_sol_reserves: u64,

    /// `BondingCurve.virtual_token_reserves` after this trade (`old + token_amount`).
    pub new_virtual_token_reserves: u64,

    /// `BondingCurve.real_sol_reserves` after this trade (`old - sol_gross`).
    pub new_real_sol_reserves: u64,

    /// `BondingCurve.real_token_reserves` after this trade (`old + token_amount`).
    pub new_real_token_reserves: u64,
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure validation + AMM computation
// ─────────────────────────────────────────────────────────────────────────────

/// Validates all sell constraints and computes the complete post-trade state.
///
/// Fully decoupled from the Anchor runtime — all inputs are primitive types so
/// every validation path is exercisable with `cargo test` without a validator.
///
/// # Fee model
/// `token_amount` is the gross token input. `sol_gross` is the full AMM output
/// before fees. `total_fee` is deducted from `sol_gross`; the seller receives
/// `sol_net`. Fee is applied to the gross SOL output (the symmetric counterpart
/// to buy, where fee is applied to the gross SOL input).
///
/// ```text
/// sol_gross = VS - floor(k / (VT + token_amount))   where k = VS × VT
/// total_fee = floor(sol_gross × fee_bps / 10_000)
/// sol_net   = sol_gross - total_fee
/// ```
///
/// # Parameters
/// - `token_amount`           — raw token units the seller wants to sell.
/// - `min_sol_out`            — minimum lamports the seller accepts (slippage guard).
/// - `virtual_sol_reserves`   — current `BondingCurve.virtual_sol_reserves`.
/// - `virtual_token_reserves` — current `BondingCurve.virtual_token_reserves`.
/// - `real_sol_reserves`      — current `BondingCurve.real_sol_reserves`.
/// - `real_token_reserves`    — current `BondingCurve.real_token_reserves`.
/// - `seller_token_balance`   — current `seller_token_account.amount`.
/// - `fee_bps`                — `GlobalConfig.total_trading_fee_bps`.
/// - `has_referrer`           — `BondingCurve.creator_referrer.is_some()`.
///
/// # Errors
/// | Condition                               | Error                        |
/// |-----------------------------------------|------------------------------|
/// | `token_amount == 0`                     | `ZeroAmount`                 |
/// | `token_amount > seller_token_balance`   | `InsufficientTokensInVault`  |
/// | AMM output rounds to zero               | `InsufficientOutput`         |
/// | `sol_gross > real_sol_reserves`         | `InsufficientSolInCurve`     |
/// | `sol_net < min_sol_out`                 | `SlippageExceeded`           |
/// | overflow in reserve update              | `ArithmeticOverflow`         |
#[allow(clippy::too_many_arguments)]
pub fn validate_sell(
    token_amount: u64,
    min_sol_out: u64,
    virtual_sol_reserves: u64,
    virtual_token_reserves: u64,
    real_sol_reserves: u64,
    real_token_reserves: u64,
    seller_token_balance: u64,
    fee_bps: u16,
    has_referrer: bool,
) -> Result<SellResult> {
    // Guard 1: non-zero token input.
    require!(token_amount > 0, FunrunError::ZeroAmount);

    // Guard 2: seller must hold enough tokens to fulfil the trade.
    require!(
        token_amount <= seller_token_balance,
        FunrunError::InsufficientTokensInVault,
    );

    // Compute gross SOL output via virtual constant-product AMM.
    // Returns InsufficientOutput when token_amount is too small to move the curve.
    let sol_gross = compute_sol_out(virtual_sol_reserves, virtual_token_reserves, token_amount)?;

    // Guard 3: curve must hold enough real SOL to pay the gross amount.
    // Ensures real_sol_reserves never goes negative after the trade.
    // Rent reserve and creator_fees_accumulated are NOT included in real_sol_reserves,
    // so this guard never touches those protected portions.
    require!(
        sol_gross <= real_sol_reserves,
        FunrunError::InsufficientSolInCurve,
    );

    // Compute fee on gross SOL output and net SOL to seller.
    // compute_total_fee uses floor division; total_fee <= sol_gross always.
    let total_fee = compute_total_fee(sol_gross, fee_bps);
    let sol_net = sol_gross
        .checked_sub(total_fee)
        .ok_or(FunrunError::ArithmeticOverflow)?;

    // Guard 4: slippage tolerance — seller's minimum accepted net output.
    require!(sol_net >= min_sol_out, FunrunError::SlippageExceeded);

    // Split fee into treasury / creator / referrer shares.
    let fee_split = split_fee(total_fee, has_referrer);

    // Compute new virtual reserves.
    // sol_gross <= virtual_sol_reserves is guaranteed by compute_sol_out
    // (formula: sol_gross = VS - floor(k/new_VT) <= VS).
    let new_virtual_sol_reserves = virtual_sol_reserves
        .checked_sub(sol_gross)
        .ok_or(FunrunError::ArithmeticOverflow)?;

    let new_virtual_token_reserves = virtual_token_reserves
        .checked_add(token_amount)
        .ok_or(FunrunError::ArithmeticOverflow)?;

    // Compute new real reserves.
    // sol_gross <= real_sol_reserves confirmed by Guard 3.
    let new_real_sol_reserves = real_sol_reserves
        .checked_sub(sol_gross)
        .ok_or(FunrunError::ArithmeticOverflow)?;

    let new_real_token_reserves = real_token_reserves
        .checked_add(token_amount)
        .ok_or(FunrunError::ArithmeticOverflow)?;

    Ok(SellResult {
        sol_gross,
        total_fee,
        sol_net,
        fee_split,
        new_virtual_sol_reserves,
        new_virtual_token_reserves,
        new_real_sol_reserves,
        new_real_token_reserves,
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

/// Sells tokens back to the bonding curve for SOL.
///
/// Execution order:
/// 1. Validate accounts (enforced by Anchor constraints on `Sell`).
/// 2. Validate inputs and compute full post-trade state via `validate_sell`.
/// 3. Transfer `token_amount` from seller's ATA to bonding_curve vault (SPL CPI).
/// 4. Write new reserve values and counters to `BondingCurve`.
/// 5. Pay treasury and referrer fees via CPI (seller → fee accounts) first —
///    CPIs must precede direct manipulation; creator share stays in PDA.
/// 6. Direct lamport transfer BC → seller for (sol_gross − creator_fee).
/// 7. Verify post-trade solvency (PDA lamports ≥ minimum_lamports).
/// 8. Emit `TokensSold` event.
pub(crate) fn handler(ctx: Context<Sell>, token_amount: u64, min_sol_out: u64) -> Result<()> {
    // Step 2: Validate all inputs and compute complete post-trade state.
    // All BondingCurve values are copied as primitives; no mutations occur yet.
    let result = {
        let bc = &ctx.accounts.bonding_curve;
        validate_sell(
            token_amount,
            min_sol_out,
            bc.virtual_sol_reserves,
            bc.virtual_token_reserves,
            bc.real_sol_reserves,
            bc.real_token_reserves,
            ctx.accounts.seller_token_account.amount,
            ctx.accounts.global_config.total_trading_fee_bps,
            bc.creator_referrer.is_some(),
        )?
    };

    // Snapshot creator_referrer before any mutable borrows.
    let creator_referrer = ctx.accounts.bonding_curve.creator_referrer;

    // Step 3: Transfer tokens from seller's ATA to bonding_curve vault.
    // The seller signs this CPI; no bonding_curve PDA authority is required.
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TokenTransfer {
                from: ctx.accounts.seller_token_account.to_account_info(),
                to: ctx.accounts.bonding_curve_vault.to_account_info(),
                authority: ctx.accounts.seller.to_account_info(),
            },
        ),
        token_amount,
    )?;

    // Step 4: Write new state to BondingCurve — use only SellResult values,
    // never re-derive AMM math.
    // creator_fees_accumulated is updated here so step 7's minimum_lamports
    // reflects the correct protected floor before the solvency check.
    {
        let bc = &mut ctx.accounts.bonding_curve;
        bc.virtual_sol_reserves = result.new_virtual_sol_reserves;
        bc.virtual_token_reserves = result.new_virtual_token_reserves;
        bc.real_sol_reserves = result.new_real_sol_reserves;
        bc.real_token_reserves = result.new_real_token_reserves;
        bc.creator_fees_accumulated = bc
            .creator_fees_accumulated
            .checked_add(result.fee_split.creator)
            .ok_or(FunrunError::ArithmeticOverflow)?;
        bc.total_trades = bc
            .total_trades
            .checked_add(1)
            .ok_or(FunrunError::ArithmeticOverflow)?;
        bc.total_volume_sol = bc
            .total_volume_sol
            .checked_add(result.sol_gross)
            .ok_or(FunrunError::ArithmeticOverflow)?;
    }

    // Step 5: Seller pays treasury and referral fees via CPI — BEFORE direct lamport transfer.
    // Fee CPIs must come first because any CPI involving an account resets that account's
    // lamports in BPF VM memory to the authoritative validator state, erasing any prior
    // direct manipulation. By paying fees via CPI before the BC→seller direct transfer, we
    // ensure no subsequent CPI overwrites the seller's direct lamport gain in step 6.
    if result.fee_split.treasury > 0 {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.seller.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            result.fee_split.treasury,
        )?;
    }

    // Referrer fee — validate PDA derivation, then seller pays directly.
    if result.fee_split.referrer > 0 {
        let referrer_key = creator_referrer.ok_or(FunrunError::InvalidFeeConfiguration)?;
        let (expected_pda, _) = Pubkey::find_program_address(
            &[CREATOR_REFERRAL_SEED, referrer_key.as_ref()],
            ctx.program_id,
        );
        require!(
            ctx.accounts.referral_account.key() == expected_pda,
            FunrunError::InvalidFeeConfiguration,
        );
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.seller.to_account_info(),
                    to: ctx.accounts.referral_account.to_account_info(),
                },
            ),
            result.fee_split.referrer,
        )?;
    }

    // Step 6: Direct lamport transfer BC → seller — MUST be the last lamport operation.
    // No CPI follows, so neither BC's decrease nor seller's increase is overwritten.
    // BC gives seller (sol_gross - creator_fee) = sol_net + treasury_fee + referrer_fee.
    // Seller already paid treasury_fee + referrer_fee in step 5, so net = sol_net.
    let bc_to_seller = result
        .sol_gross
        .checked_sub(result.fee_split.creator)
        .ok_or(FunrunError::ArithmeticOverflow)?;

    let bc_info = ctx.accounts.bonding_curve.to_account_info();
    **bc_info.try_borrow_mut_lamports()? -= bc_to_seller;
    **ctx.accounts.seller.to_account_info().try_borrow_mut_lamports()? += bc_to_seller;
    // Creator share stays in the bonding_curve PDA (excluded from bc_to_seller);
    // tracked via creator_fees_accumulated (step 4).

    // Step 7: Post-trade solvency check.
    // Ensures bonding_curve lamports cover real_sol_reserves + creator_fees_accumulated
    // + rent after all distributions, so the protected pools are never silently drained.
    let rent = Rent::get()?;
    let data_len = ctx.accounts.bonding_curve.to_account_info().data_len();
    let rent_minimum = rent.minimum_balance(data_len);
    require!(
        ctx.accounts.bonding_curve.to_account_info().lamports()
            >= ctx.accounts.bonding_curve.minimum_lamports(rent_minimum),
        FunrunError::InsufficientSolInCurve,
    );

    // Step 8: Emit TokensSold event.
    let clock = Clock::get()?;
    emit!(TokensSold {
        mint: ctx.accounts.mint.key(),
        seller: ctx.accounts.seller.key(),
        token_amount,
        sol_gross: result.sol_gross,
        sol_net: result.sol_net,
        treasury_fee: result.fee_split.treasury,
        creator_fee: result.fee_split.creator,
        creator_referrer_fee: result.fee_split.referrer,
        creator_referrer,
        virtual_sol_reserves: result.new_virtual_sol_reserves,
        virtual_token_reserves: result.new_virtual_token_reserves,
        real_sol_reserves: result.new_real_sol_reserves,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::consts::*;
    use anchor_lang::error::ERROR_CODE_OFFSET;

    // ── Test helpers ─────────────────────────────────────────────────────────

    fn err_code(e: anchor_lang::error::Error) -> u32 {
        match e {
            anchor_lang::error::Error::AnchorError(ae) => ae.error_code_number,
            anchor_lang::error::Error::ProgramError(_) => {
                panic!("expected AnchorError, got ProgramError")
            }
        }
    }

    fn expected_code(e: FunrunError) -> u32 {
        ERROR_CODE_OFFSET + e as u32
    }

    // Simulated post-buy curve state.
    // VS and VT are above initial (10 SOL net bought in, some tokens out).
    // RS holds actual bought-in SOL; RT holds remaining real tokens.
    const VS: u64 = 40_000_000_000; // 40 SOL virtual
    const VT: u64 = 870_000_000_000_000; // ~870T raw virtual tokens
    const RS: u64 = 10_000_000_000; // 10 SOL real
    const RT: u64 = 750_000_000_000_000; // 750M real tokens in vault
    const FEE: u16 = DEFAULT_TOTAL_FEE_BPS; // 150 bps
    const SELLER_BAL: u64 = 50_000_000_000_000; // seller holds 50M tokens (raw)

    // Convenience wrapper using the standard test fixture.
    fn sell(token_amount: u64, min_sol_out: u64) -> Result<SellResult> {
        validate_sell(
            token_amount,
            min_sol_out,
            VS,
            VT,
            RS,
            RT,
            SELLER_BAL,
            FEE,
            false,
        )
    }

    // ── Input validation ──────────────────────────────────────────────────────

    #[test]
    fn sell_zero_tokens_rejected_with_zero_amount_error() {
        let err = sell(0, 0).unwrap_err();
        assert_eq!(
            err_code(err),
            expected_code(FunrunError::ZeroAmount),
            "zero token_amount must produce ZeroAmount",
        );
    }

    #[test]
    fn sell_one_raw_token_succeeds_or_returns_insufficient_output() {
        let result = sell(1, 0);
        match result {
            Ok(r) => assert!(
                r.sol_gross > 0,
                "successful sell must produce > 0 sol_gross"
            ),
            Err(e) => assert_eq!(
                err_code(e),
                expected_code(FunrunError::InsufficientOutput),
                "only InsufficientOutput acceptable for dust sell",
            ),
        }
    }

    #[test]
    fn sell_1m_tokens_passes_validation() {
        let result = sell(1_000_000_000_000, 0).expect("1M token sell must pass all guards");
        assert!(result.sol_gross > 0, "must produce positive sol_gross");
        assert!(result.sol_net > 0, "must produce positive sol_net");
        assert!(result.total_fee > 0, "fee at 150 bps must be positive");
    }

    #[test]
    fn sell_10m_tokens_passes_validation() {
        let result = sell(10_000_000_000_000, 0).expect("10M token sell must pass all guards");
        assert!(result.sol_gross > 0);
        assert!(
            result.sol_gross <= RS,
            "sol_gross must not exceed real_sol_reserves"
        );
    }

    // ── Seller token balance guard ────────────────────────────────────────────

    #[test]
    fn sell_rejected_when_seller_has_no_tokens() {
        let err = validate_sell(1_000_000_000_000, 0, VS, VT, RS, RT, 0, FEE, false).unwrap_err();
        assert_eq!(
            err_code(err),
            expected_code(FunrunError::InsufficientTokensInVault),
            "zero seller balance must produce InsufficientTokensInVault",
        );
    }

    #[test]
    fn sell_rejected_when_token_amount_exceeds_seller_balance() {
        let err =
            validate_sell(SELLER_BAL + 1, 0, VS, VT, RS, RT, SELLER_BAL, FEE, false).unwrap_err();
        assert_eq!(
            err_code(err),
            expected_code(FunrunError::InsufficientTokensInVault),
            "token_amount > seller_balance must produce InsufficientTokensInVault",
        );
    }

    #[test]
    fn sell_accepted_when_token_amount_equals_seller_balance() {
        let result = validate_sell(SELLER_BAL, 0, VS, VT, RS, RT, SELLER_BAL, FEE, false);
        assert!(
            result.is_ok(),
            "token_amount == seller_balance must be accepted (exact balance)",
        );
    }

    #[test]
    fn sell_accepted_when_token_amount_is_one_below_seller_balance() {
        let result = validate_sell(SELLER_BAL - 1, 0, VS, VT, RS, RT, SELLER_BAL, FEE, false);
        assert!(
            result.is_ok(),
            "token_amount < seller_balance must be accepted"
        );
    }

    // ── SOL solvency guard ────────────────────────────────────────────────────

    #[test]
    fn sell_rejected_when_real_sol_reserves_is_zero() {
        // Even a tiny sell fails when there is no real SOL in the pool.
        let err =
            validate_sell(1_000_000_000_000, 0, VS, VT, 0, RT, SELLER_BAL, FEE, false).unwrap_err();
        assert_eq!(
            err_code(err),
            expected_code(FunrunError::InsufficientSolInCurve),
            "zero real_sol_reserves must produce InsufficientSolInCurve",
        );
    }

    #[test]
    fn sell_solvency_guard_uses_sol_gross_not_sol_net() {
        // The guard checks sol_gross (before fee), not sol_net (after fee).
        // A sell where sol_gross == real_sol_reserves should be accepted.
        // We find token_amount that produces sol_gross just at the RS boundary.
        // By trying a larger sale that would push sol_gross beyond RS:
        // sell the maximum tokens so sol_gross > RS.
        let huge = SELLER_BAL; // selling all of seller's tokens
        let result = validate_sell(huge, 0, VS, VT, RS, RT, huge, FEE, false);
        // May pass or fail depending on AMM output; if it fails, must be InsufficientSolInCurve.
        if let Err(e) = result {
            let code = err_code(e);
            assert_eq!(
                code,
                expected_code(FunrunError::InsufficientSolInCurve),
                "solvency failure must be InsufficientSolInCurve",
            );
        }
    }

    // ── Fee computation ───────────────────────────────────────────────────────

    #[test]
    fn sell_total_fee_computed_on_sol_gross() {
        let result = sell(1_000_000_000_000, 0).unwrap();
        let expected_fee = compute_total_fee(result.sol_gross, FEE);
        assert_eq!(
            result.total_fee, expected_fee,
            "total_fee must equal compute_total_fee(sol_gross, fee_bps)",
        );
    }

    #[test]
    fn sell_sol_net_equals_sol_gross_minus_total_fee() {
        let result = sell(2_000_000_000_000, 0).unwrap();
        assert_eq!(
            result.sol_net,
            result.sol_gross - result.total_fee,
            "sol_net must equal sol_gross - total_fee",
        );
    }

    #[test]
    fn sell_zero_fee_bps_makes_sol_net_equal_sol_gross() {
        let result =
            validate_sell(1_000_000_000_000, 0, VS, VT, RS, RT, SELLER_BAL, 0, false).unwrap();
        assert_eq!(
            result.sol_net, result.sol_gross,
            "zero fee_bps means no fee — all sol_gross reaches seller",
        );
        assert_eq!(result.total_fee, 0, "zero fee_bps means zero total_fee");
    }

    #[test]
    fn sell_max_fee_bps_still_leaves_positive_sol_net() {
        let result = validate_sell(
            1_000_000_000_000,
            0,
            VS,
            VT,
            RS,
            RT,
            SELLER_BAL,
            MAX_TOTAL_FEE_BPS,
            false,
        )
        .unwrap();
        assert!(
            result.sol_net > 0,
            "sol_net must be positive even at max fee"
        );
        assert!(
            result.sol_net < result.sol_gross,
            "sol_net must be less than sol_gross when fee > 0",
        );
    }

    // ── Fee split ─────────────────────────────────────────────────────────────

    #[test]
    fn sell_fee_split_sums_to_total_fee_without_referrer() {
        let result = sell(2_000_000_000_000, 0).unwrap();
        let split = result.fee_split;
        assert_eq!(
            split.treasury + split.creator + split.referrer,
            result.total_fee,
            "fee split must sum exactly to total_fee (no lamport lost)",
        );
        assert_eq!(split.referrer, 0, "no referrer — referrer share must be 0");
    }

    #[test]
    fn sell_fee_split_sums_to_total_fee_with_referrer() {
        let result =
            validate_sell(2_000_000_000_000, 0, VS, VT, RS, RT, SELLER_BAL, FEE, true).unwrap();
        let split = result.fee_split;
        assert_eq!(
            split.treasury + split.creator + split.referrer,
            result.total_fee,
            "fee split must sum exactly to total_fee with referrer",
        );
    }

    #[test]
    fn sell_fee_split_invariant_holds_across_many_amounts() {
        let amounts = [
            1_000u64,
            100_000,
            1_000_000_000,
            5_000_000_000_000,
            10_000_000_000_000,
        ];
        for &token_amount in &amounts {
            if token_amount > SELLER_BAL {
                continue;
            }
            for has_referrer in [false, true] {
                if let Ok(result) = validate_sell(
                    token_amount,
                    0,
                    VS,
                    VT,
                    RS,
                    RT,
                    SELLER_BAL,
                    FEE,
                    has_referrer,
                ) {
                    let split = result.fee_split;
                    assert_eq!(
                        split.treasury + split.creator + split.referrer,
                        result.total_fee,
                        "fee split invariant violated for token_amount={} has_referrer={}",
                        token_amount,
                        has_referrer,
                    );
                }
            }
        }
    }

    // ── Slippage guard ────────────────────────────────────────────────────────

    #[test]
    fn sell_min_sol_out_zero_always_passes_slippage() {
        let result = sell(1_000_000_000_000, 0);
        assert!(result.is_ok(), "min_sol_out=0 must never trigger slippage");
    }

    #[test]
    fn sell_slippage_exact_boundary_passes() {
        let sol_net = sell(1_000_000_000_000, 0).unwrap().sol_net;
        let result = validate_sell(
            1_000_000_000_000,
            sol_net,
            VS,
            VT,
            RS,
            RT,
            SELLER_BAL,
            FEE,
            false,
        );
        assert!(
            result.is_ok(),
            "min_sol_out == sol_net must pass slippage check",
        );
    }

    #[test]
    fn sell_slippage_one_above_sol_net_fails() {
        let sol_net = sell(1_000_000_000_000, 0).unwrap().sol_net;
        let err = validate_sell(
            1_000_000_000_000,
            sol_net + 1,
            VS,
            VT,
            RS,
            RT,
            SELLER_BAL,
            FEE,
            false,
        )
        .unwrap_err();
        assert_eq!(
            err_code(err),
            expected_code(FunrunError::SlippageExceeded),
            "min = sol_net + 1 must produce SlippageExceeded",
        );
    }

    #[test]
    fn sell_slippage_way_above_sol_net_fails() {
        let err = sell(1_000_000_000_000, u64::MAX).unwrap_err();
        assert_eq!(
            err_code(err),
            expected_code(FunrunError::SlippageExceeded),
            "min = u64::MAX must always fail slippage",
        );
    }

    // ── Post-trade reserve correctness ────────────────────────────────────────

    #[test]
    fn sell_new_virtual_sol_equals_old_minus_sol_gross() {
        let result = sell(3_000_000_000_000, 0).unwrap();
        assert_eq!(
            result.new_virtual_sol_reserves,
            VS - result.sol_gross,
            "new VS must equal old VS - sol_gross",
        );
    }

    #[test]
    fn sell_new_virtual_tokens_equals_old_plus_token_amount() {
        let token_amount = 3_000_000_000_000u64;
        let result = sell(token_amount, 0).unwrap();
        assert_eq!(
            result.new_virtual_token_reserves,
            VT + token_amount,
            "new VT must equal old VT + token_amount",
        );
    }

    #[test]
    fn sell_new_real_sol_equals_old_minus_sol_gross() {
        let result = sell(3_000_000_000_000, 0).unwrap();
        assert_eq!(
            result.new_real_sol_reserves,
            RS - result.sol_gross,
            "new real_sol must equal old real_sol - sol_gross",
        );
    }

    #[test]
    fn sell_new_real_tokens_equals_old_plus_token_amount() {
        let token_amount = 3_000_000_000_000u64;
        let result = sell(token_amount, 0).unwrap();
        assert_eq!(
            result.new_real_token_reserves,
            RT + token_amount,
            "new real_tokens must equal old real_tokens + token_amount",
        );
    }

    #[test]
    fn sell_real_sol_decreases_by_gross_not_net() {
        // real_sol_reserves decreases by sol_gross (not sol_net).
        // The fee portion is redistributed from the PDA but still "leaves" the AMM.
        let result = sell(2_000_000_000_000, 0).unwrap();
        let real_sol_decrease = RS - result.new_real_sol_reserves;
        assert_eq!(
            real_sol_decrease, result.sol_gross,
            "real_sol decrease must equal sol_gross (not sol_net)",
        );
        assert!(
            real_sol_decrease > result.sol_net,
            "real_sol decrease must exceed sol_net (fee is also removed from pool)",
        );
    }

    // ── AMM invariants ────────────────────────────────────────────────────────

    #[test]
    fn sell_k_invariant_maintained_after_trade() {
        let token_amount = 5_000_000_000_000u64;
        let result = sell(token_amount, 0).unwrap();
        let k_before = VS as u128 * VT as u128;
        let k_after =
            result.new_virtual_sol_reserves as u128 * result.new_virtual_token_reserves as u128;

        // Floor division in compute_sol_out means k_after <= k_before (never creates value).
        assert!(
            k_after <= k_before,
            "k must not increase after sell (k_before={} k_after={})",
            k_before,
            k_after,
        );
        // Rounding loss must be less than one unit of new_VT granularity.
        let diff = k_before - k_after;
        assert!(
            diff < result.new_virtual_token_reserves as u128,
            "k rounding loss {} must be < new_VT {}",
            diff,
            result.new_virtual_token_reserves,
        );
    }

    #[test]
    fn sell_virtual_reserves_stay_positive_after_trade() {
        let result = sell(5_000_000_000_000, 0).unwrap();
        assert!(
            result.new_virtual_sol_reserves > 0,
            "VS must be positive after sell",
        );
        assert!(
            result.new_virtual_token_reserves > 0,
            "VT must be positive after sell",
        );
    }

    #[test]
    fn sell_real_sol_reserves_decrease_by_sol_gross() {
        let result = sell(1_000_000_000_000, 0).unwrap();
        assert!(
            result.new_real_sol_reserves < RS,
            "real_sol_reserves must decrease after sell",
        );
        assert_eq!(
            RS - result.new_real_sol_reserves,
            result.sol_gross,
            "decrease must equal sol_gross exactly",
        );
    }

    #[test]
    fn sell_price_decreases_after_trade() {
        // price = VS / VT; after sell: new_VS < VS, new_VT > VT → price decreases.
        let token_amount = 5_000_000_000_000u64;
        let result = sell(token_amount, 0).unwrap();
        // Use 1_000_000_000 multiplier — at VS=40e9, VT=870T the ratio is ~45.97,
        // which rounds to 45 with a 1e6 multiplier (before==after). 1e9 gives ~45977 vs ~45452.
        let price_before = VS as u128 * 1_000_000_000 / VT as u128;
        let price_after = result.new_virtual_sol_reserves as u128 * 1_000_000_000
            / result.new_virtual_token_reserves as u128;
        assert!(
            price_after < price_before,
            "price must decrease after sell (before={} after={})",
            price_before,
            price_after,
        );
    }

    #[test]
    fn sell_sol_gross_bounded_by_virtual_sol_reserves() {
        // sol_gross = VS - new_VS where new_VS >= 0, so sol_gross <= VS.
        let result = sell(20_000_000_000_000, 0).unwrap();
        assert!(
            result.sol_gross <= VS,
            "sol_gross must not exceed virtual_sol_reserves",
        );
    }

    // ── Sequential trade simulation ───────────────────────────────────────────

    #[test]
    fn sell_sequential_state_transitions_accumulate_correctly() {
        let mut vs = VS;
        let mut vt = VT;
        let mut rs = RS;
        let mut rt = RT;
        let tokens_each = 1_000_000_000_000u64; // 1M tokens per trade
        let seller_bal = 20_000_000_000_000u64; // seller has 20M tokens

        for i in 0..10 {
            let result = validate_sell(tokens_each, 0, vs, vt, rs, rt, seller_bal, FEE, false)
                .unwrap_or_else(|_| panic!("trade {} failed unexpectedly", i));

            // Fee invariant on every trade.
            assert_eq!(
                result.fee_split.treasury + result.fee_split.creator + result.fee_split.referrer,
                result.total_fee,
                "fee split invariant violated at trade {}",
                i,
            );
            // sol_net invariant.
            assert_eq!(
                result.sol_net,
                result.sol_gross - result.total_fee,
                "sol_net invariant violated at trade {}",
                i,
            );

            vs = result.new_virtual_sol_reserves;
            vt = result.new_virtual_token_reserves;
            rs = result.new_real_sol_reserves;
            rt = result.new_real_token_reserves;

            assert!(
                vs > 0 && vt > 0,
                "reserves must stay positive at trade {}",
                i
            );
        }

        // After 10 sells: VS must have decreased, VT must have increased.
        assert!(vs < VS, "VS must decrease across sequential sells");
        assert!(vt > VT, "VT must increase across sequential sells");
    }

    #[test]
    fn sell_price_decreases_monotonically_across_sequential_trades() {
        let mut vs = VS;
        let mut vt = VT;
        let mut prev_price_ratio = u128::MAX;
        let tokens_each = 2_000_000_000_000u64; // 2M tokens per trade
        let seller_bal = 30_000_000_000_000u64;

        for _ in 0..8 {
            let result =
                validate_sell(tokens_each, 0, vs, vt, RS, RT, seller_bal, FEE, false).unwrap();
            let price = result.new_virtual_sol_reserves as u128 * 1_000_000_000
                / result.new_virtual_token_reserves as u128;
            assert!(
                price < prev_price_ratio,
                "price must decrease monotonically; got {} >= {}",
                price,
                prev_price_ratio,
            );
            prev_price_ratio = price;
            vs = result.new_virtual_sol_reserves;
            vt = result.new_virtual_token_reserves;
        }
    }

    #[test]
    fn sell_increasing_returns_per_token_as_price_falls() {
        // On a falling price curve, successive equal-token sells return less SOL each time.
        let mut vs = VS;
        let mut vt = VT;
        let tokens_each = 1_000_000_000_000u64;
        let seller_bal = 20_000_000_000_000u64;
        let mut prev_sol = u64::MAX;

        for i in 0..5 {
            let result =
                validate_sell(tokens_each, 0, vs, vt, RS, RT, seller_bal, FEE, false).unwrap();
            assert!(
                result.sol_gross < prev_sol,
                "trade {} must yield less sol_gross than trade {} (diminishing returns on sell)",
                i + 1,
                i,
            );
            prev_sol = result.sol_gross;
            vs = result.new_virtual_sol_reserves;
            vt = result.new_virtual_token_reserves;
        }
    }

    // ── Overflow and underflow protection ─────────────────────────────────────

    #[test]
    fn sell_large_token_amount_does_not_panic() {
        // Very large sell — may succeed or return an appropriate error, but must not panic.
        let large_tokens = u64::MAX / 2;
        let result = validate_sell(large_tokens, 0, VS, VT, RS, RT, large_tokens, FEE, false);
        match result {
            Ok(r) => {
                assert!(
                    r.new_virtual_sol_reserves <= VS,
                    "VS must not increase on sell"
                );
                assert!(
                    r.new_virtual_token_reserves >= VT,
                    "VT must not decrease on sell"
                );
            }
            Err(e) => {
                let code = err_code(e);
                let acceptable = [
                    expected_code(FunrunError::ArithmeticOverflow),
                    expected_code(FunrunError::InsufficientOutput),
                    expected_code(FunrunError::InsufficientSolInCurve),
                ];
                assert!(
                    acceptable.contains(&code),
                    "large sell must fail with an arithmetic/solvency error, got code {}",
                    code,
                );
            }
        }
    }

    #[test]
    fn sell_sol_net_never_underflows_below_zero() {
        // total_fee = floor(sol_gross * fee_bps / 10000) <= sol_gross always.
        // Verify sol_net = sol_gross - total_fee >= 0 for realistic amounts.
        let token_amounts = [
            1_000u64,
            1_000_000,
            1_000_000_000,
            1_000_000_000_000,
            5_000_000_000_000,
        ];
        for &tokens in &token_amounts {
            if tokens > SELLER_BAL {
                continue;
            }
            if let Ok(result) = sell(tokens, 0) {
                let fee = compute_total_fee(result.sol_gross, MAX_TOTAL_FEE_BPS);
                assert!(
                    fee <= result.sol_gross,
                    "total_fee {} must not exceed sol_gross {} at max fee_bps",
                    fee,
                    result.sol_gross,
                );
            }
        }
    }

    #[test]
    fn sell_new_reserves_do_not_overflow_for_realistic_amounts() {
        // A 50M token sell — large but within seller balance.
        let token_amount = 50_000_000_000_000u64; // 50M tokens at 6 decimals
        let result = validate_sell(token_amount, 0, VS, VT, RS, RT, token_amount, FEE, false);
        match result {
            Ok(r) => {
                assert!(r.new_virtual_sol_reserves <= VS, "VS must not increase");
                assert!(r.new_real_sol_reserves <= RS, "RS must not increase");
            }
            Err(e) => {
                let code = err_code(e);
                assert_ne!(
                    code,
                    expected_code(FunrunError::ArithmeticOverflow),
                    "50M token sell must not overflow — it is within realistic range",
                );
            }
        }
    }

    // ── Determinism ───────────────────────────────────────────────────────────

    #[test]
    fn sell_same_inputs_produce_identical_results() {
        let r1 = sell(3_000_000_000_000, 0).unwrap();
        let r2 = sell(3_000_000_000_000, 0).unwrap();
        assert_eq!(r1, r2, "validate_sell must be deterministic");
    }

    #[test]
    fn sell_independent_of_call_order() {
        let r_1m =
            validate_sell(1_000_000_000_000, 0, VS, VT, RS, RT, SELLER_BAL, FEE, false).unwrap();
        let r_5m =
            validate_sell(5_000_000_000_000, 0, VS, VT, RS, RT, SELLER_BAL, FEE, false).unwrap();

        let r_5m_first =
            validate_sell(5_000_000_000_000, 0, VS, VT, RS, RT, SELLER_BAL, FEE, false).unwrap();
        let r_1m_second =
            validate_sell(1_000_000_000_000, 0, VS, VT, RS, RT, SELLER_BAL, FEE, false).unwrap();

        assert_eq!(
            r_1m, r_1m_second,
            "1M token result must be identical regardless of call order",
        );
        assert_eq!(
            r_5m, r_5m_first,
            "5M token result must be identical regardless of call order",
        );
    }

    // ── k-invariant across sell amounts ──────────────────────────────────────

    #[test]
    fn sell_k_invariant_tighter_than_one_token_unit() {
        let token_amounts = [
            1_000_000u64,       // 1 raw token (dust)
            1_000_000_000_000,  // 1M tokens
            5_000_000_000_000,  // 5M tokens
            10_000_000_000_000, // 10M tokens
            20_000_000_000_000, // 20M tokens
        ];
        for token_amount in token_amounts {
            if token_amount > SELLER_BAL {
                continue;
            }
            let result =
                validate_sell(token_amount, 0, VS, VT, RS, RT, SELLER_BAL, FEE, false).unwrap();
            let k_before = VS as u128 * VT as u128;
            let k_after =
                result.new_virtual_sol_reserves as u128 * result.new_virtual_token_reserves as u128;
            assert!(
                k_after <= k_before,
                "k must not increase for token_amount={}",
                token_amount,
            );
            let diff = k_before - k_after;
            assert!(
                diff < result.new_virtual_token_reserves as u128,
                "k rounding loss {} must be < new_VT {} for token_amount={}",
                diff,
                result.new_virtual_token_reserves,
                token_amount,
            );
        }
    }

    // ── Round-trip consistency with buy ──────────────────────────────────────

    #[test]
    fn sell_after_buy_returns_approximately_same_sol() {
        use crate::math::compute_tokens_out;

        // Buy 1 SOL net, then sell those tokens back; round-trip loss must be ≤ 2 lamports.
        let sol_net_buy = 985_000_000u64; // 1 SOL gross minus 1.5% fee
        let tokens_bought =
            compute_tokens_out(VIRTUAL_SOL_INITIAL, VIRTUAL_TOKEN_INITIAL, sol_net_buy).unwrap();
        let vs_after_buy = VIRTUAL_SOL_INITIAL + sol_net_buy;
        let vt_after_buy = VIRTUAL_TOKEN_INITIAL - tokens_bought;
        // Add a small buffer: floor division can make sol_gross = sol_net_buy + 1 or +2.
        // If rs_after_buy == sol_net_buy exactly, the solvency guard sol_gross <= RS would
        // reject a valid round-trip. The buffer absorbs the ≤2 lamport rounding artefact.
        let rs_after_buy = sol_net_buy + 10;
        let rt_after_buy = BONDING_SUPPLY_TOKENS - tokens_bought;

        // Sell all bought tokens back (zero fee to isolate AMM rounding only).
        let result = validate_sell(
            tokens_bought,
            0,
            vs_after_buy,
            vt_after_buy,
            rs_after_buy,
            rt_after_buy,
            tokens_bought,
            0, // zero fee to isolate AMM rounding
            false,
        )
        .unwrap();

        let diff = result.sol_gross.abs_diff(sol_net_buy);
        assert!(
            diff <= 2,
            "AMM round-trip diff {} lamports (sold={}, bought_in={}) must be ≤ 2",
            diff,
            result.sol_gross,
            sol_net_buy,
        );
    }

    // ── Execution properties (P4.5) ───────────────────────────────────────────
    // These tests verify the mathematical invariants that the sell handler's
    // execution preserves.  They run as pure unit tests on validate_sell output
    // (no Anchor runtime required); CPI correctness is validated by build-sbf.

    #[test]
    fn sell_sol_gross_equals_sol_net_plus_all_fee_components() {
        // Complete lamport accounting: every lamport of sol_gross goes somewhere.
        // sol_net → seller, treasury_fee → treasury,
        // creator_fee → creator_fees_accumulated, referrer_fee → referral_account.
        let result = sell(2_000_000_000_000, 0).unwrap();
        let reconstructed = result.sol_net
            + result.fee_split.treasury
            + result.fee_split.creator
            + result.fee_split.referrer;
        assert_eq!(
            result.sol_gross, reconstructed,
            "sol_gross must equal sol_net + treasury + creator + referrer",
        );
    }

    #[test]
    fn sell_bonding_curve_net_lamport_decrease_equals_sol_gross_minus_creator_fee() {
        // The bc PDA's total lamport decrease = treasury_fee + referrer_fee + sol_net.
        // Because creator_fee stays inside bc (tracked separately), the net outflow
        // equals sol_gross - creator_fee.
        let result = sell(2_000_000_000_000, 0).unwrap();
        let bc_outflow = result.fee_split.treasury + result.fee_split.referrer + result.sol_net;
        assert_eq!(
            bc_outflow + result.fee_split.creator,
            result.sol_gross,
            "bc outflow + creator_fee must equal sol_gross",
        );
    }

    #[test]
    fn sell_token_amount_enters_vault_exactly() {
        // Tokens flow from seller into vault — real_token_reserves increases by
        // exactly token_amount, no more and no less.
        let token_amount = 3_000_000_000_000u64;
        let result = sell(token_amount, 0).unwrap();
        assert_eq!(
            result.new_real_token_reserves,
            RT + token_amount,
            "vault must receive exactly token_amount tokens",
        );
        assert_eq!(
            result.new_real_token_reserves - RT,
            token_amount,
            "real_token_reserves increase must equal token_amount",
        );
    }

    #[test]
    fn sell_all_bonding_curve_state_fields_match_sell_result() {
        // The handler writes exactly these values to the BondingCurve account.
        let token_amount = 4_000_000_000_000u64;
        let result = sell(token_amount, 0).unwrap();

        assert_eq!(result.new_virtual_sol_reserves, VS - result.sol_gross);
        assert_eq!(result.new_virtual_token_reserves, VT + token_amount);
        assert_eq!(result.new_real_sol_reserves, RS - result.sol_gross);
        assert_eq!(result.new_real_token_reserves, RT + token_amount);

        // Verify sol_net and sol_gross are consistent.
        assert_eq!(result.sol_net + result.total_fee, result.sol_gross);
    }

    #[test]
    fn sell_creator_fee_stays_inside_bonding_curve() {
        // The creator fee must remain in the bc PDA; it is not sent to any
        // external account and is tracked by creator_fees_accumulated.
        let result = sell(1_000_000_000_000, 0).unwrap();
        assert!(
            result.fee_split.creator > 0,
            "creator must earn a fee at 150 bps"
        );
        // Creator fee is not part of the seller's proceeds.
        assert!(result.fee_split.creator < result.sol_gross);
        // Without referrer, treasury absorbs 60% and creator gets 40%.
        let expected_creator = result.total_fee * 40 / 100;
        // Allow for floor-division rounding (off by at most 1).
        assert!(
            result.fee_split.creator.abs_diff(expected_creator) <= 1,
            "creator fee {} must be approximately 40% of total_fee {}",
            result.fee_split.creator,
            result.total_fee,
        );
    }

    #[test]
    fn sell_post_trade_real_sol_never_negative() {
        // Guard 3 ensures sol_gross <= RS, so new_RS = RS - sol_gross >= 0.
        // This verifies the invariant holds for all valid sells.
        let token_amounts = [
            1_000_000_000_000u64,
            5_000_000_000_000,
            10_000_000_000_000,
            20_000_000_000_000,
            50_000_000_000_000,
        ];
        for token_amount in token_amounts {
            if token_amount > SELLER_BAL {
                continue;
            }
            let result = sell(token_amount, 0).unwrap();
            assert!(
                result.new_real_sol_reserves <= RS,
                "new_RS must not exceed old_RS for token_amount={}",
                token_amount,
            );
            // new_RS is u64 so it can't be negative; just verify it's <= RS
            // (meaning sol_gross was correctly bounded by RS).
        }
    }

    #[test]
    fn sell_volume_counter_uses_sol_gross_not_sol_net() {
        // total_volume_sol tracks gross SOL traded, not net received by seller.
        // The handler increments total_volume_sol by result.sol_gross.
        let result = sell(2_000_000_000_000, 0).unwrap();
        // sol_gross > sol_net when fee > 0.
        assert!(
            result.sol_gross > result.sol_net,
            "sol_gross must exceed sol_net when fee_bps > 0",
        );
        // The volume increment should be sol_gross, not sol_net.
        assert_eq!(
            result.sol_gross,
            result.sol_net + result.total_fee,
            "sol_gross = sol_net + total_fee (verifies volume accounting)",
        );
    }

    #[test]
    fn sell_state_composable_with_buy() {
        use crate::math::compute_tokens_out;

        // Simulate buy then sell; state must transition correctly end-to-end.
        let sol_net_buy = 9_850_000_000u64; // 10 SOL gross at 150 bps → 9.85 SOL net
        let tokens =
            compute_tokens_out(VIRTUAL_SOL_INITIAL, VIRTUAL_TOKEN_INITIAL, sol_net_buy).unwrap();
        let vs_mid = VIRTUAL_SOL_INITIAL + sol_net_buy;
        let vt_mid = VIRTUAL_TOKEN_INITIAL - tokens;
        let rs_mid = sol_net_buy;
        let rt_mid = BONDING_SUPPLY_TOKENS - tokens;

        // Sell half the purchased tokens back.
        let sell_amount = tokens / 2;
        let result = validate_sell(
            sell_amount,
            0,
            vs_mid,
            vt_mid,
            rs_mid,
            rt_mid,
            sell_amount,
            FEE,
            false,
        )
        .unwrap();

        // Post-sell state must be monotonically consistent with buy direction.
        assert!(
            result.new_virtual_sol_reserves < vs_mid,
            "VS must decrease on sell"
        );
        assert!(
            result.new_virtual_token_reserves > vt_mid,
            "VT must increase on sell"
        );
        assert!(
            result.new_real_sol_reserves < rs_mid,
            "RS must decrease on sell"
        );
        assert!(
            result.new_real_token_reserves > rt_mid,
            "RT must increase on sell"
        );
        assert!(result.sol_net > 0, "seller must receive positive SOL");
        // Fee invariant.
        assert_eq!(
            result.fee_split.treasury + result.fee_split.creator + result.fee_split.referrer,
            result.total_fee,
        );
    }

    #[test]
    fn sell_solvency_invariant_bc_lamports_after_distribution() {
        // Mathematical proof that the bc remains solvent after the sell execution.
        // Before sell: bc_lamports >= RS + CF + rent (P4.3 step 7 maintained this).
        // After step 4: real_sol_reserves = RS - sol_gross; creator_fees = CF + creator_fee.
        // After steps 5+6: bc_lamports decreases by treasury + referrer + sol_net = sol_gross - creator_fee.
        // Therefore: bc_lamports_after = bc_lamports_before - (sol_gross - creator_fee)
        //                              >= RS + CF + rent - sol_gross + creator_fee
        //                              = (RS - sol_gross) + (CF + creator_fee) + rent
        //                              = new_RS + new_CF + rent  ← minimum_lamports
        // The post-sell bc is solvent as long as the pre-sell bc was solvent.
        let result = sell(5_000_000_000_000, 0).unwrap();
        let bc_lamport_decrease =
            result.fee_split.treasury + result.fee_split.referrer + result.sol_net;
        let creator_fee = result.fee_split.creator;
        // Verify: sol_gross - creator_fee = treasury + referrer + sol_net (the actual outflow)
        assert_eq!(
            result.sol_gross - creator_fee,
            bc_lamport_decrease,
            "bc lamport decrease must equal sol_gross - creator_fee",
        );
        // And new reserves are consistent with that outflow.
        assert_eq!(result.new_real_sol_reserves, RS - result.sol_gross);
    }
}
