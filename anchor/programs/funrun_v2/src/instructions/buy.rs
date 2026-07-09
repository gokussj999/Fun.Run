use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer as TokenTransfer};

use crate::consts::*;
use crate::errors::FunrunError;
use crate::events::TokensPurchased;
use crate::math::{compute_tokens_out, compute_total_fee, split_fee, FeeSplit};
use crate::state::{BondingCurve, GlobalConfig, Treasury};

// ─────────────────────────────────────────────────────────────────────────────
// Accounts (unchanged from P4.1)
// ─────────────────────────────────────────────────────────────────────────────

/// Accounts required by the `buy` instruction.
///
/// The buyer sends SOL into the bonding curve and receives tokens in return.
/// Fee distribution is 40% Treasury / 40% Creator / 20% Referrer (or 60/40
/// when no creator_referrer is set on the curve).
///
/// `referral_account` is validated in the handler against
/// `bonding_curve.creator_referrer`.  Pass `SystemProgram::id()` if
/// `bonding_curve.creator_referrer` is `None`.
#[derive(Accounts)]
pub struct Buy<'info> {
    /// Buyer wallet — signs, pays SOL, and funds any new ATA rent.
    #[account(mut)]
    pub buyer: Signer<'info>,

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

    /// Bonding curve token vault (source of tokens delivered to the buyer).
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = bonding_curve,
    )]
    pub bonding_curve_vault: Account<'info, TokenAccount>,

    /// Buyer's token account (receives purchased tokens; created here if absent).
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = mint,
        associated_token::authority = buyer,
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    /// Creator referrer account for fee distribution.
    ///
    /// CHECK: validated in handler against `bonding_curve.creator_referrer`
    /// PDA derivation. Pass `SystemProgram::id()` when no referrer exists.
    #[account(mut)]
    pub referral_account: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure computation result
// ─────────────────────────────────────────────────────────────────────────────

/// Complete post-trade state produced by `validate_buy`.
///
/// Encapsulates every value needed to atomically apply a buy:
/// - amounts for SOL/token transfers
/// - amounts for fee distribution
/// - new reserve values to write to `BondingCurve`
///
/// No on-chain mutation occurs before `validate_buy` returns `Ok(BuyResult)`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BuyResult {
    /// Net SOL entering the virtual AMM after fees (sol_amount - total_fee).
    /// Used to update both virtual and real SOL reserves.
    pub sol_net: u64,

    /// Total trading fee deducted from sol_amount.
    /// Equals `fee_split.treasury + fee_split.creator + fee_split.referrer`.
    pub total_fee: u64,

    /// Token units delivered to the buyer (raw, 6-decimal SPL).
    /// Validated against slippage tolerance and real token vault balance.
    pub tokens_out: u64,

    /// Fee split into treasury / creator / referrer shares.
    /// Invariant: `fee_split.treasury + fee_split.creator + fee_split.referrer == total_fee`.
    pub fee_split: FeeSplit,

    /// `BondingCurve.virtual_sol_reserves` after this trade (`old + sol_net`).
    pub new_virtual_sol_reserves: u64,

    /// `BondingCurve.virtual_token_reserves` after this trade (`old - tokens_out`).
    pub new_virtual_token_reserves: u64,

    /// `BondingCurve.real_sol_reserves` after this trade (`old + sol_net`).
    pub new_real_sol_reserves: u64,

    /// `BondingCurve.real_token_reserves` after this trade (`old - tokens_out`).
    pub new_real_token_reserves: u64,
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure validation + AMM computation
// ─────────────────────────────────────────────────────────────────────────────

/// Validates all buy constraints and computes the complete post-trade state.
///
/// Fully decoupled from the Anchor runtime — all inputs are primitive types so
/// every validation path is exercisable with `cargo test` without a validator.
///
/// # Fee model
/// `sol_amount` is the gross SOL the buyer pays.  `total_fee` is deducted
/// first; the remaining `sol_net` enters the virtual constant-product AMM.
///
/// ```text
/// sol_net  = sol_amount - total_fee
/// fee_bps  = GlobalConfig.total_trading_fee_bps (e.g. 150 = 1.5%)
/// tokens_out = VT - k / (VS + sol_net)   where k = VS × VT
/// ```
///
/// # Parameters
/// - `sol_amount`              — gross lamports buyer is willing to spend.
/// - `min_tokens_out`          — minimum tokens buyer accepts (slippage guard).
/// - `virtual_sol_reserves`    — current `BondingCurve.virtual_sol_reserves`.
/// - `virtual_token_reserves`  — current `BondingCurve.virtual_token_reserves`.
/// - `real_sol_reserves`       — current `BondingCurve.real_sol_reserves`.
/// - `real_token_reserves`     — current `BondingCurve.real_token_reserves`.
/// - `fee_bps`                 — `GlobalConfig.total_trading_fee_bps`.
/// - `has_referrer`            — `BondingCurve.creator_referrer.is_some()`.
///
/// # Errors
/// | Condition                               | Error                        |
/// |-----------------------------------------|------------------------------|
/// | `sol_amount == 0`                       | `ZeroAmount`                 |
/// | AMM output rounds to zero               | `InsufficientOutput`         |
/// | `tokens_out > real_token_reserves`      | `InsufficientTokensInVault`  |
/// | `tokens_out < min_tokens_out`           | `SlippageExceeded`           |
/// | overflow in reserve update              | `ArithmeticOverflow`         |
#[allow(clippy::too_many_arguments)]
pub fn validate_buy(
    sol_amount: u64,
    min_tokens_out: u64,
    virtual_sol_reserves: u64,
    virtual_token_reserves: u64,
    real_sol_reserves: u64,
    real_token_reserves: u64,
    fee_bps: u16,
    has_referrer: bool,
) -> Result<BuyResult> {
    // Guard 1: non-zero input amount.
    require!(sol_amount > 0, FunrunError::ZeroAmount);

    // Compute trading fee and net SOL entering the AMM.
    // compute_total_fee uses floor division, so total_fee <= sol_amount always.
    // With fee_bps <= MAX_TOTAL_FEE_BPS (500), sol_net > 0 whenever sol_amount > 0.
    // checked_sub is a defence-in-depth guard.
    let total_fee = compute_total_fee(sol_amount, fee_bps);
    let sol_net = sol_amount
        .checked_sub(total_fee)
        .ok_or(FunrunError::ArithmeticOverflow)?;

    // Compute tokens_out via virtual constant-product AMM.
    // Returns InsufficientOutput when sol_net is too small to move the curve.
    let tokens_out = compute_tokens_out(virtual_sol_reserves, virtual_token_reserves, sol_net)?;

    // Guard 2: token vault must hold enough tokens to fulfil the trade.
    require!(
        tokens_out <= real_token_reserves,
        FunrunError::InsufficientTokensInVault,
    );

    // Guard 3: slippage tolerance — buyer's minimum accepted output.
    require!(tokens_out >= min_tokens_out, FunrunError::SlippageExceeded);

    // Split the fee into treasury / creator / referrer shares.
    // Invariant: treasury + creator + referrer == total_fee (enforced by split_fee).
    let fee_split = split_fee(total_fee, has_referrer);

    // Compute new virtual reserves.
    // Overflow: new_VS can approach u64::MAX only if VS is already near u64::MAX —
    // impossible in practice (VS starts at 30 SOL and grows with real trades).
    let new_virtual_sol_reserves = virtual_sol_reserves
        .checked_add(sol_net)
        .ok_or(FunrunError::ArithmeticOverflow)?;

    // tokens_out <= virtual_token_reserves is guaranteed by compute_tokens_out
    // (output = VT - new_VT where new_VT = floor(k/new_VS) <= VT).
    let new_virtual_token_reserves = virtual_token_reserves
        .checked_sub(tokens_out)
        .ok_or(FunrunError::ArithmeticOverflow)?;

    // Compute new real reserves.
    // real_sol_reserves tracks AMM backing SOL; increases by sol_net per trade.
    let new_real_sol_reserves = real_sol_reserves
        .checked_add(sol_net)
        .ok_or(FunrunError::ArithmeticOverflow)?;

    // tokens_out <= real_token_reserves confirmed by Guard 2.
    let new_real_token_reserves = real_token_reserves
        .checked_sub(tokens_out)
        .ok_or(FunrunError::ArithmeticOverflow)?;

    Ok(BuyResult {
        sol_net,
        total_fee,
        tokens_out,
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

/// Buys tokens from the bonding curve with SOL.
///
/// Execution order:
/// 1. Validate accounts (enforced by Anchor constraints on `Buy`).
/// 2. Validate inputs and compute full post-trade state via `validate_buy`.
/// 3. Transfer `sol_amount` (gross) from buyer to bonding_curve PDA.
/// 4. Distribute fees: buyer pays treasury and referrer directly via system CPI;
///    creator share stays in PDA and is tracked via `creator_fees_accumulated`.
/// 5. Transfer `tokens_out` from vault to buyer via SPL Token CPI.
/// 6. Write new reserve values and counters to `BondingCurve`.
/// 7. Verify post-trade solvency (PDA lamports ≥ minimum_lamports).
/// 8. Emit `TokensPurchased` event.
pub(crate) fn handler(ctx: Context<Buy>, sol_amount: u64, min_tokens_out: u64) -> Result<()> {
    // Step 2: Validate and compute complete post-trade state.
    // All BondingCurve values are copied as primitives; no mutations occur yet.
    let result = {
        let bc = &ctx.accounts.bonding_curve;
        validate_buy(
            sol_amount,
            min_tokens_out,
            bc.virtual_sol_reserves,
            bc.virtual_token_reserves,
            bc.real_sol_reserves,
            bc.real_token_reserves,
            ctx.accounts.global_config.total_trading_fee_bps,
            bc.creator_referrer.is_some(),
        )?
    };

    // Snapshot fields needed after mutable borrows.
    let creator_referrer = ctx.accounts.bonding_curve.creator_referrer;
    let bc_bump = ctx.accounts.bonding_curve.bump;

    // Step 3: Split SOL payment from buyer.
    // BC receives sol_net + creator_fee (= sol_amount - treasury_fee - referrer_fee).
    // Treasury and referral are paid DIRECTLY by the buyer via system_program::transfer
    // CPI. Direct lamport increases on program-owned PDAs (Treasury, Referral) are not
    // reflected in the SBF VM's post-instruction conservation check; using CPIs from
    // the signed buyer account avoids this runtime limitation entirely.
    let bc_receive = result
        .sol_net
        .checked_add(result.fee_split.creator)
        .ok_or(FunrunError::ArithmeticOverflow)?;

    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.bonding_curve.to_account_info(),
            },
        ),
        bc_receive,
    )?;

    if result.fee_split.treasury > 0 {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            result.fee_split.treasury,
        )?;
    }

    // Step 4: Referrer fee — validate PDA derivation, then buyer pays directly.
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
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.referral_account.to_account_info(),
                },
            ),
            result.fee_split.referrer,
        )?;
    }
    // Creator share (fee_split.creator) stays in the bonding_curve PDA via bc_receive;
    // it is tracked in creator_fees_accumulated and claimed via claim_creator_fees.

    // Step 5: Transfer tokens from bonding_curve vault to buyer's token account.
    let mint_key = ctx.accounts.mint.key();
    let signer_seeds: &[&[&[u8]]] = &[&[BONDING_CURVE_SEED, mint_key.as_ref(), &[bc_bump]]];
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TokenTransfer {
                from: ctx.accounts.bonding_curve_vault.to_account_info(),
                to: ctx.accounts.buyer_token_account.to_account_info(),
                authority: ctx.accounts.bonding_curve.to_account_info(),
            },
            signer_seeds,
        ),
        result.tokens_out,
    )?;

    // Step 6: Write new state to BondingCurve — use only BuyResult values,
    // never re-derive AMM math.
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
            .checked_add(sol_amount)
            .ok_or(FunrunError::ArithmeticOverflow)?;
    }

    // Step 7: Post-trade solvency check.
    // Ensures bonding_curve lamports cover real_sol_reserves + creator_fees_accumulated
    // + rent, so neither pool can be silently drained.
    let rent = Rent::get()?;
    let data_len = ctx.accounts.bonding_curve.to_account_info().data_len();
    let rent_minimum = rent.minimum_balance(data_len);
    require!(
        ctx.accounts.bonding_curve.to_account_info().lamports()
            >= ctx.accounts.bonding_curve.minimum_lamports(rent_minimum),
        FunrunError::InsufficientSolInCurve,
    );

    // Step 8: Emit TokensPurchased event.
    let clock = Clock::get()?;
    emit!(TokensPurchased {
        mint: ctx.accounts.mint.key(),
        buyer: ctx.accounts.buyer.key(),
        sol_amount,
        sol_net: result.sol_net,
        tokens_out: result.tokens_out,
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

    // Initial bonding curve state (post-create_coin, no prior trades).
    const VS: u64 = VIRTUAL_SOL_INITIAL; // 30 SOL
    const VT: u64 = VIRTUAL_TOKEN_INITIAL; // 1,073,000,191 tokens (raw)
    const RS: u64 = 0; // real SOL starts at 0
    const RT: u64 = BONDING_SUPPLY_TOKENS; // 800,000,000 tokens minted to vault
    const FEE: u16 = DEFAULT_TOTAL_FEE_BPS; // 150 bps (1.5%)

    // Convenience wrapper that always uses initial state and no referrer.
    fn buy(sol_amount: u64, min_tokens_out: u64) -> Result<BuyResult> {
        validate_buy(sol_amount, min_tokens_out, VS, VT, RS, RT, FEE, false)
    }

    // ── Input validation ──────────────────────────────────────────────────────

    #[test]
    fn buy_zero_sol_rejected_with_zero_amount_error() {
        let err = buy(0, 0).unwrap_err();
        assert_eq!(
            err_code(err),
            expected_code(FunrunError::ZeroAmount),
            "zero sol_amount must produce ZeroAmount",
        );
    }

    #[test]
    fn buy_one_lamport_succeeds_or_returns_insufficient_output() {
        // 1 lamport net enters AMM; either produces tokens or InsufficientOutput.
        // Both outcomes are correct — the critical property is no panic.
        let result = buy(1, 0);
        match result {
            Ok(r) => assert!(r.tokens_out > 0, "successful buy must produce > 0 tokens"),
            Err(e) => assert_eq!(
                err_code(e),
                expected_code(FunrunError::InsufficientOutput),
                "only InsufficientOutput is acceptable for dust buy",
            ),
        }
    }

    #[test]
    fn buy_1_sol_passes_validation() {
        let result = buy(1_000_000_000, 0).expect("1 SOL buy must pass all guards");
        assert!(result.tokens_out > 0, "must produce positive token output");
        assert!(result.sol_net > 0, "sol_net must be positive");
        assert!(result.total_fee > 0, "fee at 150 bps must be positive");
    }

    #[test]
    fn buy_10_sol_passes_validation() {
        let result = buy(10_000_000_000, 0).expect("10 SOL buy must pass all guards");
        assert!(result.tokens_out > 0);
        assert!(
            result.tokens_out < RT,
            "tokens_out must not exceed vault balance"
        );
    }

    // ── Fee computation ───────────────────────────────────────────────────────

    #[test]
    fn buy_total_fee_computed_correctly_at_150_bps() {
        // 1 SOL at 150 bps = floor(1e9 * 150 / 10000) = 15_000_000 lamports
        let result = buy(1_000_000_000, 0).unwrap();
        assert_eq!(
            result.total_fee, 15_000_000,
            "fee must be 15,000,000 lamports (1.5% of 1 SOL)",
        );
    }

    #[test]
    fn buy_sol_net_equals_sol_amount_minus_total_fee() {
        let sol_amount = 1_000_000_000u64;
        let result = buy(sol_amount, 0).unwrap();
        assert_eq!(
            result.sol_net,
            sol_amount - result.total_fee,
            "sol_net must equal sol_amount - total_fee",
        );
    }

    #[test]
    fn buy_zero_fee_bps_makes_sol_net_equal_sol_amount() {
        let sol_amount = 5_000_000_000u64;
        let result = validate_buy(sol_amount, 0, VS, VT, RS, RT, 0, false).unwrap();
        assert_eq!(
            result.sol_net, sol_amount,
            "zero fee_bps means no fee — all sol_amount enters the AMM",
        );
        assert_eq!(result.total_fee, 0, "zero fee_bps means zero total_fee");
    }

    #[test]
    fn buy_max_fee_bps_still_leaves_positive_sol_net() {
        // MAX_TOTAL_FEE_BPS = 500 (5%); sol_net must remain positive
        let sol_amount = 1_000_000_000u64;
        let result = validate_buy(sol_amount, 0, VS, VT, RS, RT, MAX_TOTAL_FEE_BPS, false).unwrap();
        assert!(
            result.sol_net > 0,
            "sol_net must be positive even at max fee"
        );
        assert!(
            result.sol_net < sol_amount,
            "sol_net must be less than sol_amount when fee > 0",
        );
    }

    // ── Fee split ─────────────────────────────────────────────────────────────

    #[test]
    fn buy_fee_split_sums_to_total_fee_without_referrer() {
        let result = buy(2_000_000_000, 0).unwrap();
        let split = result.fee_split;
        assert_eq!(
            split.treasury + split.creator + split.referrer,
            result.total_fee,
            "fee split must sum exactly to total_fee (no lamport lost)",
        );
        assert_eq!(split.referrer, 0, "no referrer — referrer share must be 0");
    }

    #[test]
    fn buy_fee_split_sums_to_total_fee_with_referrer() {
        let result = validate_buy(2_000_000_000, 0, VS, VT, RS, RT, FEE, true).unwrap();
        let split = result.fee_split;
        assert_eq!(
            split.treasury + split.creator + split.referrer,
            result.total_fee,
            "fee split must sum exactly to total_fee with referrer",
        );
    }

    #[test]
    fn buy_fee_split_without_referrer_treasury_gets_60_pct() {
        // total_fee = 30_000_000 (1.5% of 2 SOL) — divisible by 5 → exact percentages
        let result = validate_buy(2_000_000_000, 0, VS, VT, RS, RT, FEE, false).unwrap();
        let total = result.total_fee; // 30_000_000
        let split = result.fee_split;
        assert_eq!(split.creator, total * 40 / 100, "creator must get 40%");
        assert_eq!(split.referrer, 0, "referrer 0% without referrer");
        assert_eq!(
            split.treasury,
            total - split.creator,
            "treasury gets remainder (60%)",
        );
    }

    #[test]
    fn buy_fee_split_with_referrer_40_40_20() {
        // Use 2 SOL at 150 bps: total_fee = 30_000_000 (exact percentages)
        let result = validate_buy(2_000_000_000, 0, VS, VT, RS, RT, FEE, true).unwrap();
        let total = result.total_fee;
        let split = result.fee_split;
        assert_eq!(split.creator, total * 40 / 100, "creator = 40%");
        assert_eq!(split.referrer, total * 20 / 100, "referrer = 20%");
        assert_eq!(
            split.treasury,
            total - split.creator - split.referrer,
            "treasury = 40% (remainder)",
        );
    }

    #[test]
    fn buy_fee_split_invariant_holds_across_many_amounts() {
        let amounts = [1u64, 7, 100, 1_000, 1_000_000, 1_000_000_000, 5_000_000_000];
        for &sol_amount in &amounts {
            for has_referrer in [false, true] {
                let result =
                    validate_buy(sol_amount, 0, VS, VT, RS, RT, FEE, has_referrer).unwrap();
                let split = result.fee_split;
                assert_eq!(
                    split.treasury + split.creator + split.referrer,
                    result.total_fee,
                    "fee split invariant violated for sol_amount={} has_referrer={}",
                    sol_amount,
                    has_referrer,
                );
            }
        }
    }

    // ── Slippage guard ────────────────────────────────────────────────────────

    #[test]
    fn buy_min_tokens_zero_always_passes_slippage() {
        // min_tokens_out = 0 means accept any positive output
        let result = buy(1_000_000_000, 0);
        assert!(result.is_ok(), "min=0 must never trigger slippage");
    }

    #[test]
    fn buy_slippage_exact_boundary_passes() {
        // min_tokens_out == tokens_out is the tightest valid tolerance
        let tokens_out = buy(1_000_000_000, 0).unwrap().tokens_out;
        let result = validate_buy(1_000_000_000, tokens_out, VS, VT, RS, RT, FEE, false);
        assert!(
            result.is_ok(),
            "min_tokens_out == tokens_out must pass slippage check",
        );
    }

    #[test]
    fn buy_slippage_one_above_tokens_out_fails() {
        let tokens_out = buy(1_000_000_000, 0).unwrap().tokens_out;
        let err =
            validate_buy(1_000_000_000, tokens_out + 1, VS, VT, RS, RT, FEE, false).unwrap_err();
        assert_eq!(
            err_code(err),
            expected_code(FunrunError::SlippageExceeded),
            "min = tokens_out + 1 must produce SlippageExceeded",
        );
    }

    #[test]
    fn buy_slippage_way_above_tokens_out_fails() {
        let err = buy(1_000_000_000, u64::MAX).unwrap_err();
        assert_eq!(
            err_code(err),
            expected_code(FunrunError::SlippageExceeded),
            "min = u64::MAX must always fail slippage",
        );
    }

    // ── Token vault invariant ─────────────────────────────────────────────────

    #[test]
    fn buy_rejected_when_vault_is_empty() {
        let err = validate_buy(1_000_000_000, 0, VS, VT, RS, 0, FEE, false).unwrap_err();
        assert_eq!(
            err_code(err),
            expected_code(FunrunError::InsufficientTokensInVault),
            "empty vault must produce InsufficientTokensInVault",
        );
    }

    #[test]
    fn buy_rejected_when_vault_one_token_below_tokens_out() {
        let tokens_out = buy(1_000_000_000, 0).unwrap().tokens_out;
        if tokens_out > 0 {
            let err =
                validate_buy(1_000_000_000, 0, VS, VT, RS, tokens_out - 1, FEE, false).unwrap_err();
            assert_eq!(
                err_code(err),
                expected_code(FunrunError::InsufficientTokensInVault),
                "vault one token short must produce InsufficientTokensInVault",
            );
        }
    }

    #[test]
    fn buy_accepted_when_vault_exactly_equals_tokens_out() {
        let tokens_out = buy(1_000_000_000, 0).unwrap().tokens_out;
        let result = validate_buy(1_000_000_000, 0, VS, VT, RS, tokens_out, FEE, false);
        assert!(
            result.is_ok(),
            "vault == tokens_out is exactly sufficient — must be accepted",
        );
    }

    #[test]
    fn buy_accepted_with_ample_vault_balance() {
        let result = validate_buy(1_000_000_000, 0, VS, VT, RS, RT, FEE, false);
        assert!(result.is_ok(), "normal vault balance must be accepted");
    }

    // ── Post-trade reserve correctness ────────────────────────────────────────

    #[test]
    fn buy_new_virtual_sol_equals_old_plus_sol_net() {
        let result = buy(3_000_000_000, 0).unwrap();
        assert_eq!(
            result.new_virtual_sol_reserves,
            VS + result.sol_net,
            "new VS must equal old VS + sol_net",
        );
    }

    #[test]
    fn buy_new_virtual_tokens_equals_old_minus_tokens_out() {
        let result = buy(3_000_000_000, 0).unwrap();
        assert_eq!(
            result.new_virtual_token_reserves,
            VT - result.tokens_out,
            "new VT must equal old VT - tokens_out",
        );
    }

    #[test]
    fn buy_new_real_sol_equals_old_plus_sol_net() {
        let result = buy(3_000_000_000, 0).unwrap();
        assert_eq!(
            result.new_real_sol_reserves,
            RS + result.sol_net,
            "new real_sol must equal old real_sol + sol_net",
        );
    }

    #[test]
    fn buy_new_real_tokens_equals_old_minus_tokens_out() {
        let result = buy(3_000_000_000, 0).unwrap();
        assert_eq!(
            result.new_real_token_reserves,
            RT - result.tokens_out,
            "new real_tokens must equal old real_tokens - tokens_out",
        );
    }

    #[test]
    fn buy_real_sol_increases_by_sol_not_gross_amount() {
        // real_sol_reserves tracks AMM-backing SOL (sol_net), not the gross sol_amount.
        // The fee portion is separately distributed; real_sol < sol_amount increase.
        let sol_amount = 5_000_000_000u64;
        let result = validate_buy(sol_amount, 0, VS, VT, 0, RT, FEE, false).unwrap();
        let real_sol_increase = result.new_real_sol_reserves - 0u64;
        assert_eq!(
            real_sol_increase, result.sol_net,
            "real_sol increase must equal sol_net (not gross sol_amount)",
        );
        assert!(
            real_sol_increase < sol_amount,
            "real_sol increase must be less than gross sol_amount (fee deducted)",
        );
    }

    // ── AMM invariants ────────────────────────────────────────────────────────

    #[test]
    fn buy_k_invariant_maintained_after_trade() {
        let result = buy(5_000_000_000, 0).unwrap();
        let k_before = VS as u128 * VT as u128;
        let k_after =
            result.new_virtual_sol_reserves as u128 * result.new_virtual_token_reserves as u128;

        // Floor division in compute_tokens_out means k_after <= k_before (never creates value)
        assert!(
            k_after <= k_before,
            "k must not increase after buy (k_before={} k_after={})",
            k_before,
            k_after,
        );
        // Rounding loss must be less than one unit of new_VS granularity
        let diff = k_before - k_after;
        assert!(
            diff < result.new_virtual_sol_reserves as u128,
            "k rounding loss {} must be < new_VS {}",
            diff,
            result.new_virtual_sol_reserves,
        );
    }

    #[test]
    fn buy_virtual_reserves_stay_positive_after_trade() {
        let result = buy(10_000_000_000, 0).unwrap();
        assert!(
            result.new_virtual_sol_reserves > 0,
            "VS must be positive after buy",
        );
        assert!(
            result.new_virtual_token_reserves > 0,
            "VT must be positive after buy",
        );
    }

    #[test]
    fn buy_real_token_reserves_decrease_by_tokens_out() {
        let result = buy(1_000_000_000, 0).unwrap();
        assert!(
            result.new_real_token_reserves < RT,
            "real_token_reserves must decrease after buy",
        );
        assert_eq!(
            RT - result.new_real_token_reserves,
            result.tokens_out,
            "decrease must equal tokens_out exactly",
        );
    }

    #[test]
    fn buy_price_increases_after_trade() {
        // price = VS / VT (in lamports/raw); after buy: new_VS > VS, new_VT < VT
        // → new_VS / new_VT > VS / VT (price increases on each buy)
        let result = buy(5_000_000_000, 0).unwrap();
        let price_before = VS as u128 * 1_000_000 / VT as u128;
        let price_after = result.new_virtual_sol_reserves as u128 * 1_000_000
            / result.new_virtual_token_reserves as u128;
        assert!(
            price_after > price_before,
            "price must increase after buy (before={} after={})",
            price_before,
            price_after,
        );
    }

    #[test]
    fn buy_tokens_out_bounded_by_virtual_token_reserves() {
        // tokens_out = VT - new_VT, so tokens_out <= VT by definition
        let result = buy(50_000_000_000, 0).unwrap();
        assert!(result.tokens_out <= VT, "tokens_out must not exceed VT",);
    }

    // ── Sequential trade simulation ───────────────────────────────────────────

    #[test]
    fn buy_sequential_state_transitions_accumulate_correctly() {
        let mut vs = VS;
        let mut vt = VT;
        let mut rs = RS;
        let mut rt = RT;
        let sol_each = 1_000_000_000u64; // 1 SOL per trade

        for i in 0..10 {
            let result = validate_buy(sol_each, 0, vs, vt, rs, rt, FEE, false)
                .unwrap_or_else(|_| panic!("trade {} failed unexpectedly", i));

            // Fee invariant on every trade
            assert_eq!(
                result.fee_split.treasury + result.fee_split.creator + result.fee_split.referrer,
                result.total_fee,
                "fee split invariant violated at trade {}",
                i,
            );

            // Apply state transition
            vs = result.new_virtual_sol_reserves;
            vt = result.new_virtual_token_reserves;
            rs = result.new_real_sol_reserves;
            rt = result.new_real_token_reserves;

            // Reserves must remain positive throughout
            assert!(
                vs > 0 && vt > 0,
                "reserves must stay positive at trade {}",
                i
            );
        }

        // After 10 buys: VS must have grown, VT must have shrunk
        assert!(vs > VS, "VS must increase across sequential buys");
        assert!(vt < VT, "VT must decrease across sequential buys");
        assert!(rs > 0, "real_sol_reserves must be positive after buys");
    }

    #[test]
    fn buy_price_increases_monotonically_across_sequential_trades() {
        let mut vs = VS;
        let mut vt = VT;
        let mut prev_price_ratio = 0u128;
        let sol_each = 2_000_000_000u64; // 2 SOL per trade

        for _ in 0..8 {
            let result = validate_buy(sol_each, 0, vs, vt, RS, RT, FEE, false).unwrap();
            let price = result.new_virtual_sol_reserves as u128 * 1_000_000_000
                / result.new_virtual_token_reserves as u128;
            assert!(
                price > prev_price_ratio,
                "price must increase monotonically; got {} <= {}",
                price,
                prev_price_ratio,
            );
            prev_price_ratio = price;
            vs = result.new_virtual_sol_reserves;
            vt = result.new_virtual_token_reserves;
        }
    }

    #[test]
    fn buy_diminishing_returns_per_sol() {
        // Each successive equal-SOL buy delivers fewer tokens than the one before.
        let mut vs = VS;
        let mut vt = VT;
        let sol_each = 1_000_000_000u64;
        let mut prev_tokens = u64::MAX;

        for i in 0..5 {
            let result = validate_buy(sol_each, 0, vs, vt, RS, RT, FEE, false).unwrap();
            assert!(
                result.tokens_out < prev_tokens,
                "trade {} must yield fewer tokens than trade {} (diminishing returns)",
                i + 1,
                i,
            );
            prev_tokens = result.tokens_out;
            vs = result.new_virtual_sol_reserves;
            vt = result.new_virtual_token_reserves;
        }
    }

    // ── Overflow and underflow protection ─────────────────────────────────────

    #[test]
    fn buy_large_sol_amount_does_not_panic() {
        // Very large buy — may succeed or return an appropriate error, but must not panic
        let large_sol = u64::MAX / 2;
        let result = validate_buy(large_sol, 0, VS, VT, RS, RT, FEE, false);
        match result {
            Ok(r) => {
                // If it succeeds, reserves must remain valid u64 values
                assert!(r.new_virtual_sol_reserves >= VS, "VS must not decrease");
                assert!(r.new_virtual_token_reserves <= VT, "VT must not increase");
            }
            Err(e) => {
                let code = err_code(e);
                let acceptable = [
                    expected_code(FunrunError::ArithmeticOverflow),
                    expected_code(FunrunError::InsufficientOutput),
                    expected_code(FunrunError::InsufficientTokensInVault),
                ];
                assert!(
                    acceptable.contains(&code),
                    "large buy must fail with an arithmetic/vault error, got code {}",
                    code,
                );
            }
        }
    }

    #[test]
    fn buy_sol_net_never_underflows_below_zero() {
        // With fee_bps <= MAX_TOTAL_FEE_BPS (500) and sol_amount >= 1,
        // sol_net = sol_amount - total_fee is always non-negative.
        // Verify for a range of amounts.
        let amounts = [1u64, 100, 1_000, 1_000_000, 1_000_000_000, u64::MAX / 1_000];
        for &sol_amount in &amounts {
            let total_fee = compute_total_fee(sol_amount, MAX_TOTAL_FEE_BPS);
            assert!(
                total_fee <= sol_amount,
                "total_fee {} must not exceed sol_amount {} at max fee_bps",
                total_fee,
                sol_amount,
            );
        }
    }

    #[test]
    fn buy_new_reserves_do_not_overflow_for_realistic_amounts() {
        // A 500 SOL buy — the largest realistic single trade in production
        let sol_amount = 500_000_000_000u64; // 500 SOL
        let result = validate_buy(sol_amount, 0, VS, VT, RS, RT, FEE, false);
        // This is well within the vault's token balance, so it may succeed or fail
        // with InsufficientTokensInVault depending on AMM output — either is fine.
        // The critical property is no ArithmeticOverflow panic.
        match result {
            Ok(r) => {
                assert!(r.new_virtual_sol_reserves >= VS);
                assert!(r.new_real_sol_reserves >= RS);
            }
            Err(e) => {
                let code = err_code(e);
                assert_ne!(
                    code,
                    expected_code(FunrunError::ArithmeticOverflow),
                    "500 SOL buy must not overflow — it is within realistic range",
                );
            }
        }
    }

    // ── Determinism ───────────────────────────────────────────────────────────

    #[test]
    fn buy_same_inputs_produce_identical_results() {
        let r1 = buy(3_000_000_000, 0).unwrap();
        let r2 = buy(3_000_000_000, 0).unwrap();
        assert_eq!(r1, r2, "validate_buy must be deterministic");
    }

    #[test]
    fn buy_independent_of_call_order() {
        // Swapping the order of two independent buy computations must not affect results.
        let r_1sol = validate_buy(1_000_000_000, 0, VS, VT, RS, RT, FEE, false).unwrap();
        let r_5sol = validate_buy(5_000_000_000, 0, VS, VT, RS, RT, FEE, false).unwrap();

        let r_5sol_first = validate_buy(5_000_000_000, 0, VS, VT, RS, RT, FEE, false).unwrap();
        let r_1sol_second = validate_buy(1_000_000_000, 0, VS, VT, RS, RT, FEE, false).unwrap();

        assert_eq!(
            r_1sol, r_1sol_second,
            "1 SOL result must be identical regardless of call order"
        );
        assert_eq!(
            r_5sol, r_5sol_first,
            "5 SOL result must be identical regardless of call order"
        );
    }

    // ── k-invariant across full round-trip (buy then sell scenario) ───────────

    #[test]
    fn buy_k_invariant_tighter_than_one_sol_unit() {
        // The rounding loss after a buy must be less than one unit of new_VS.
        let sol_amounts = [
            1_000_000u64,   // 0.001 SOL
            100_000_000,    // 0.1 SOL
            1_000_000_000,  // 1 SOL
            10_000_000_000, // 10 SOL
            85_000_000_000, // 85 SOL (graduation threshold amount)
        ];
        for sol_amount in sol_amounts {
            let result = validate_buy(sol_amount, 0, VS, VT, RS, RT, FEE, false).unwrap();
            let k_before = VS as u128 * VT as u128;
            let k_after =
                result.new_virtual_sol_reserves as u128 * result.new_virtual_token_reserves as u128;
            assert!(
                k_after <= k_before,
                "k must not increase for sol_amount={}",
                sol_amount
            );
            let diff = k_before - k_after;
            assert!(
                diff < result.new_virtual_sol_reserves as u128,
                "k rounding loss {} must be < new_VS {} for sol_amount={}",
                diff,
                result.new_virtual_sol_reserves,
                sol_amount,
            );
        }
    }
}
