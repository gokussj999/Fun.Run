use crate::consts::{GLOBAL_CONFIG_SEED, TREASURY_SEED};
use crate::errors::FunrunError;
use crate::events::TreasurySweep;
use crate::state::{GlobalConfig, Treasury};
use anchor_lang::prelude::*;

// ─────────────────────────────────────────────────────────────────────────────
// Accounts
// ─────────────────────────────────────────────────────────────────────────────

/// Accounts required by the `sweep_treasury` instruction.
///
/// The instruction transfers accumulated protocol SOL from the `Treasury`
/// PDA to `fee_recipient`.  Both accounts are validated against
/// `GlobalConfig` to prevent redirection attacks.
#[derive(Accounts)]
pub struct SweepTreasury<'info> {
    /// Must equal `GlobalConfig.admin`; enforced by `has_one`.
    pub admin: Signer<'info>,

    /// Read from to validate admin key and fee_recipient address.
    /// Also updated: `total_sol_disbursed` is incremented.
    #[account(
        mut,
        seeds = [GLOBAL_CONFIG_SEED],
        bump = global_config.bump,
        has_one = admin @ FunrunError::UnauthorizedAdmin,
        has_one = fee_recipient @ FunrunError::UnauthorizedAdmin,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    /// Source of swept lamports.  Owns only rent-exempt lamports after the
    /// sweep; any surplus collected since the last sweep is transferred out.
    #[account(
        mut,
        seeds = [TREASURY_SEED],
        bump = treasury.bump,
    )]
    pub treasury: Account<'info, Treasury>,

    /// Receives the swept lamports.
    ///
    /// # Safety
    /// The key is validated against `global_config.fee_recipient` via the
    /// `has_one` constraint on `global_config` above.  Any account type
    /// (wallet, multisig PDA, program-owned account) may receive lamports.
    /// CHECK: validated by global_config.has_one = fee_recipient
    #[account(mut)]
    pub fee_recipient: UncheckedAccount<'info>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers (also called from unit tests)
// ─────────────────────────────────────────────────────────────────────────────

/// Computes the lamports that may be swept from the Treasury, leaving exactly
/// the rent-exempt minimum so the account stays alive.
///
/// # Parameters
/// - `treasury_lamports` — current on-chain lamport balance of the Treasury PDA.
/// - `rent_exempt_min` — minimum balance required to keep the account alive.
///
/// # Errors
/// - [`FunrunError::NothingToClaim`] — if `treasury_lamports <= rent_exempt_min`.
pub fn compute_sweep_amount(treasury_lamports: u64, rent_exempt_min: u64) -> Result<u64> {
    let sweepable = treasury_lamports
        .checked_sub(rent_exempt_min)
        .ok_or(error!(FunrunError::NothingToClaim))?;

    require!(sweepable > 0, FunrunError::NothingToClaim);

    Ok(sweepable)
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

/// Sweeps all accumulated SOL from the Treasury PDA to `fee_recipient`.
///
/// The Treasury PDA retains its rent-exempt minimum; every lamport above
/// that floor is transferred atomically.
///
/// # Failure conditions
/// - Caller is not `GlobalConfig.admin` → [`FunrunError::UnauthorizedAdmin`]
/// - `fee_recipient` account key != `GlobalConfig.fee_recipient` →
///   [`FunrunError::UnauthorizedAdmin`]
/// - Nothing to sweep (treasury == rent minimum) → [`FunrunError::NothingToClaim`]
pub(crate) fn handler(ctx: Context<SweepTreasury>) -> Result<()> {
    let clock = Clock::get()?;

    // ── Compute sweepable amount ──────────────────────────────────────────────
    // Read lamports before any mutable borrow to avoid RefCell double-borrow.
    let treasury_lamports = ctx.accounts.treasury.to_account_info().lamports();
    let rent_exempt_min = Rent::get()?.minimum_balance(Treasury::INIT_SPACE);

    let sweep_amount = compute_sweep_amount(treasury_lamports, rent_exempt_min)?;

    // ── Update bookkeeping ────────────────────────────────────────────────────
    ctx.accounts.treasury.total_sol_disbursed = ctx
        .accounts
        .treasury
        .total_sol_disbursed
        .checked_add(sweep_amount)
        .ok_or(error!(FunrunError::ArithmeticOverflow))?;

    ctx.accounts.global_config.total_sol_disbursed = ctx
        .accounts
        .global_config
        .total_sol_disbursed
        .checked_add(sweep_amount)
        .ok_or(error!(FunrunError::ArithmeticOverflow))?;

    let treasury_balance_after = treasury_lamports
        .checked_sub(sweep_amount)
        .ok_or(error!(FunrunError::ArithmeticOverflow))?;

    // ── Transfer lamports (program-owned PDA → external recipient) ───────────
    // Treasury is owned by this program so we manipulate lamports directly;
    // system_program::transfer requires system-program ownership.
    **ctx
        .accounts
        .treasury
        .to_account_info()
        .try_borrow_mut_lamports()? -= sweep_amount;
    **ctx
        .accounts
        .fee_recipient
        .to_account_info()
        .try_borrow_mut_lamports()? += sweep_amount;

    msg!(
        "sweep_treasury: swept {} lamports to fee_recipient={}",
        sweep_amount,
        ctx.accounts.fee_recipient.key(),
    );

    emit!(TreasurySweep {
        amount: sweep_amount,
        recipient: ctx.accounts.fee_recipient.key(),
        admin: ctx.accounts.admin.key(),
        treasury_balance_after,
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

    // ── compute_sweep_amount ──────────────────────────────────────────────────

    #[test]
    fn sweep_amount_is_surplus_above_rent_min() {
        let rent_min = 1_000_000u64;
        let balance = 10_000_000u64;
        let expected = balance - rent_min;

        let amount = compute_sweep_amount(balance, rent_min).unwrap();
        assert_eq!(
            amount, expected,
            "sweep amount must be surplus above rent minimum"
        );
    }

    #[test]
    fn sweep_amount_of_one_lamport_above_rent() {
        let rent_min = 1_000_000u64;
        let balance = rent_min + 1;

        let amount = compute_sweep_amount(balance, rent_min).unwrap();
        assert_eq!(
            amount, 1,
            "should be able to sweep exactly 1 lamport surplus"
        );
    }

    #[test]
    fn sweep_balance_equal_to_rent_min_returns_nothing_to_claim() {
        let rent_min = 1_000_000u64;
        let result = compute_sweep_amount(rent_min, rent_min);
        assert!(
            result.is_err(),
            "balance == rent_min must return NothingToClaim",
        );
    }

    #[test]
    fn sweep_balance_below_rent_min_returns_nothing_to_claim() {
        let rent_min = 1_000_000u64;
        let balance = rent_min - 1;
        let result = compute_sweep_amount(balance, rent_min);
        assert!(
            result.is_err(),
            "balance < rent_min must return NothingToClaim (would underflow)",
        );
    }

    #[test]
    fn sweep_zero_balance_returns_nothing_to_claim() {
        let result = compute_sweep_amount(0, 1_000_000);
        assert!(result.is_err(), "zero balance must return NothingToClaim");
    }

    #[test]
    fn sweep_large_balance_does_not_overflow() {
        let rent_min = 890_880u64; // ~typical rent for 89-byte account
        let balance = u64::MAX;
        let expected = u64::MAX - rent_min;

        let amount = compute_sweep_amount(balance, rent_min).unwrap();
        assert_eq!(
            amount, expected,
            "u64::MAX balance must sweep without overflow"
        );
    }

    #[test]
    fn sweep_preserves_rent_minimum() {
        let rent_min = 2_000_000u64;
        let balance = 50_000_000u64;

        let swept = compute_sweep_amount(balance, rent_min).unwrap();
        let remaining = balance - swept;

        assert_eq!(
            remaining, rent_min,
            "remaining balance after sweep must equal rent minimum exactly",
        );
    }

    // ── Bookkeeping arithmetic guards ─────────────────────────────────────────

    #[test]
    fn total_disbursed_addition_does_not_overflow_small_values() {
        let existing: u64 = 1_000_000_000_000; // 1 million SOL already swept
        let sweep: u64 = 5_000_000_000; // 5 SOL new sweep

        let result = existing.checked_add(sweep);
        assert!(result.is_some(), "valid disbursed total must not overflow",);
        assert_eq!(result.unwrap(), 1_005_000_000_000);
    }

    #[test]
    fn total_disbursed_near_overflow_saturates() {
        let existing: u64 = u64::MAX;
        let sweep: u64 = 1;

        let result = existing.checked_add(sweep);
        assert!(
            result.is_none(),
            "u64::MAX + 1 checked_add must return None",
        );
        // The handler uses .ok_or(ArithmeticOverflow) on this result,
        // so the instruction would return ArithmeticOverflow rather than panicking.
    }

    // ── Sweep amount consistency across round-trip ────────────────────────────

    #[test]
    fn multiple_sweeps_reduce_balance_correctly() {
        // Simulates: deposit some SOL, sweep half, deposit more, sweep again.
        let rent_min = 1_000_000u64;

        // Round 1: 10 SOL total, rent_min aside
        let balance_1 = 10_000_000_000u64;
        let swept_1 = compute_sweep_amount(balance_1, rent_min).unwrap();
        assert_eq!(swept_1, balance_1 - rent_min);

        // After sweep, treasury holds only rent_min.
        // Round 2: another 5 SOL deposited
        let balance_2 = rent_min + 5_000_000_000;
        let swept_2 = compute_sweep_amount(balance_2, rent_min).unwrap();
        assert_eq!(swept_2, 5_000_000_000);

        // Total swept
        let total_swept = swept_1 + swept_2;
        assert_eq!(total_swept, (balance_1 - rent_min) + 5_000_000_000);
    }
}
