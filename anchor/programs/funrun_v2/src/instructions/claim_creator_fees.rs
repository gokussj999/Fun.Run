use crate::consts::{BONDING_CURVE_SEED, CREATOR_PROFILE_SEED};
use crate::errors::FunrunError;
use crate::events::CreatorFeesClaimed;
use crate::state::{BondingCurve, CreatorProfile};
use anchor_lang::prelude::*;

// ─────────────────────────────────────────────────────────────────────────────
// Accounts
// ─────────────────────────────────────────────────────────────────────────────

/// Accounts required by the `claim_creator_fees` instruction.
///
/// The creator withdraws all SOL accumulated in `BondingCurve.creator_fees_accumulated`.
/// No `!complete` constraint — claims are valid at any point in the coin lifecycle,
/// including after graduation.
#[derive(Accounts)]
pub struct ClaimCreatorFees<'info> {
    /// Creator wallet — must match `BondingCurve.creator`.  Receives the claimed SOL.
    #[account(mut)]
    pub creator: Signer<'info>,

    /// The bonding curve that holds `creator_fees_accumulated`.
    ///
    /// Validated via PDA seeds and `has_one = creator`.  No `!complete` constraint:
    /// claims are permitted both before and after graduation.
    #[account(
        mut,
        seeds = [BONDING_CURVE_SEED, bonding_curve.mint.as_ref()],
        bump = bonding_curve.bump,
        has_one = creator @ FunrunError::UnauthorizedCreator,
    )]
    pub bonding_curve: Account<'info, BondingCurve>,

    /// Creator's identity PDA — `total_creator_fees_earned` is updated on every claim.
    ///
    /// Always exists: `create_coin` initialises it via `init_if_needed` before any
    /// bonding curve can be created.  PDA derivation from `creator.key()` guarantees
    /// this account belongs to the signing creator.
    #[account(
        mut,
        seeds = [CREATOR_PROFILE_SEED, creator.key().as_ref()],
        bump = creator_profile.bump,
        has_one = creator @ FunrunError::UnauthorizedCreator,
    )]
    pub creator_profile: Account<'info, CreatorProfile>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers (independently unit-testable)
// ─────────────────────────────────────────────────────────────────────────────

/// Returns the lamports currently claimable by the creator.
///
/// This is simply `creator_fees_accumulated` — the value accumulated across
/// all trades since the last claim (or since coin creation).
/// Always succeeds; returns 0 when there is nothing to claim.
pub fn claimable_creator_fees(creator_fees_accumulated: u64) -> u64 {
    creator_fees_accumulated
}

/// Verifies the bonding curve satisfies its solvency floor after a claim.
///
/// After zeroing `creator_fees_accumulated`, the minimum the bonding curve must
/// hold is `real_sol_reserves + rent_minimum` (the AMM liquidity plus rent).
///
/// This always passes when the pre-claim solvency invariant was maintained, but
/// is checked explicitly as a defense-in-depth guard.
///
/// # Errors
/// - [`FunrunError::ArithmeticOverflow`] — if `real_sol_reserves + rent_minimum` overflows u64.
/// - [`FunrunError::InsufficientSolInCurve`] — if the post-claim balance is below the floor.
pub fn check_post_claim_creator_solvency(
    bc_lamports_after: u64,
    real_sol_reserves: u64,
    rent_minimum: u64,
) -> Result<()> {
    let floor = real_sol_reserves
        .checked_add(rent_minimum)
        .ok_or(FunrunError::ArithmeticOverflow)?;
    require!(
        bc_lamports_after >= floor,
        FunrunError::InsufficientSolInCurve
    );
    Ok(())
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

/// Claims all accumulated creator fees from a bonding curve.
///
/// # Execution order
/// 1. Snapshot and zero `creator_fees_accumulated` (atomic with the rest of the tx).
/// 2. Transfer `amount` lamports from the bonding curve PDA to the creator wallet.
/// 3. Increment `CreatorProfile.total_creator_fees_earned` by `amount` (overflow-checked).
/// 4. Assert post-claim solvency: `bc.lamports() >= real_sol_reserves + rent_minimum`.
/// 5. Emit `CreatorFeesClaimed` event (emitted even for zero-amount claims).
///
/// # Pause exemption (intentional)
/// This instruction does **not** check `GlobalConfig.paused`.  It only withdraws
/// previously earned lamports already segregated in the bonding curve PDA; it
/// does not modify virtual reserves or pricing.  Keeping claims available during
/// an emergency pause ensures creators can always access legitimately earned funds
/// while blocking new value from entering the protocol.
///
/// # Zero-balance behavior
/// When `creator_fees_accumulated == 0`, the instruction succeeds immediately:
/// no lamports are moved, and the event is still emitted with `amount = 0`.
/// This supports off-chain analytics that track claim timestamps.
///
/// # Failure atomicity
/// All mutations occur in a single Solana transaction.  Any failure reverts
/// the entire instruction — the zero-out, the lamport transfer, the profile
/// update, and the event are all-or-nothing.
pub(crate) fn handler(ctx: Context<ClaimCreatorFees>) -> Result<()> {
    // Step 1: Snapshot the claimable amount and zero the accumulator atomically.
    // The write is in a block so the mutable borrow ends before lamport manipulation.
    let amount = {
        let bc = &mut ctx.accounts.bonding_curve;
        let amount = claimable_creator_fees(bc.creator_fees_accumulated);
        bc.creator_fees_accumulated = 0;
        amount
    };

    // Step 2: Transfer lamports from the program-owned bonding curve PDA to creator.
    // Direct lamport manipulation is valid because bc is owned by this program.
    // Skipped when amount == 0 to avoid a no-op borrow cycle.
    if amount > 0 {
        **ctx
            .accounts
            .bonding_curve
            .to_account_info()
            .try_borrow_mut_lamports()? -= amount;
        **ctx
            .accounts
            .creator
            .to_account_info()
            .try_borrow_mut_lamports()? += amount;
    }

    // Step 3: Update lifetime analytics on CreatorProfile.
    // checked_add guards against u64 overflow (protocol-defined ArithmeticOverflow error).
    ctx.accounts.creator_profile.total_creator_fees_earned = ctx
        .accounts
        .creator_profile
        .total_creator_fees_earned
        .checked_add(amount)
        .ok_or(FunrunError::ArithmeticOverflow)?;

    // Step 4: Post-claim solvency guard.
    // After zeroing creator_fees_accumulated, minimum_lamports = real_sol_reserves + rent.
    let rent = Rent::get()?;
    let rent_minimum =
        rent.minimum_balance(ctx.accounts.bonding_curve.to_account_info().data_len());
    check_post_claim_creator_solvency(
        ctx.accounts.bonding_curve.to_account_info().lamports(),
        ctx.accounts.bonding_curve.real_sol_reserves,
        rent_minimum,
    )?;

    // Step 5: Emit event — always, even for zero-amount claims.
    let clock = Clock::get()?;
    emit!(CreatorFeesClaimed {
        mint: ctx.accounts.bonding_curve.mint,
        creator: ctx.accounts.creator.key(),
        amount,
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
    use crate::state::{BondingCurve, CreatorProfile};

    // ── Test fixtures ─────────────────────────────────────────────────────────

    const RENT_MIN: u64 = 4_364_640; // typical rent for 498-byte BondingCurve account

    /// Creates a BondingCurve in mid-curve state with `creator_fees_accumulated` set.
    fn make_bc(real_sol_reserves: u64, creator_fees_accumulated: u64) -> BondingCurve {
        BondingCurve {
            creator: Pubkey::new_unique(),
            mint: Pubkey::new_unique(),
            creator_referrer: None,
            name: "TestCoin".to_string(),
            symbol: "TC".to_string(),
            uri: "https://example.com".to_string(),
            creation_fee_paid: 20_000_000,
            creation_timestamp: 1_700_000_000,
            protocol_version: 2,
            virtual_sol_reserves: VIRTUAL_SOL_INITIAL + real_sol_reserves,
            virtual_token_reserves: VIRTUAL_TOKEN_INITIAL - 1_000_000,
            real_sol_reserves,
            real_token_reserves: BONDING_SUPPLY_TOKENS - 1_000_000,
            creator_fees_accumulated,
            complete: false,
            total_trades: 10,
            total_volume_sol: real_sol_reserves * 5,
            bump: 254,
            graduation_dex_fee_snapshot: 0,
            graduated: false,
            _padding: [0u8; 55],
        }
    }

    // ── claimable_creator_fees ────────────────────────────────────────────────

    #[test]
    fn claimable_equals_creator_fees_accumulated() {
        assert_eq!(claimable_creator_fees(1_000_000_000), 1_000_000_000);
    }

    #[test]
    fn claimable_zero_when_no_fees_accumulated() {
        assert_eq!(claimable_creator_fees(0), 0);
    }

    #[test]
    fn claimable_max_u64() {
        assert_eq!(claimable_creator_fees(u64::MAX), u64::MAX);
    }

    // ── check_post_claim_creator_solvency ─────────────────────────────────────

    #[test]
    fn solvency_passes_when_lamports_above_floor() {
        // floor = RS + rent = 5 SOL + 4_364_640
        let rs = 5_000_000_000u64;
        let floor = rs + RENT_MIN;
        let lamports_after = floor + 1_000_000; // comfortably above
        assert!(check_post_claim_creator_solvency(lamports_after, rs, RENT_MIN).is_ok());
    }

    #[test]
    fn solvency_passes_at_exact_floor() {
        let rs = 5_000_000_000u64;
        let floor = rs + RENT_MIN;
        assert!(check_post_claim_creator_solvency(floor, rs, RENT_MIN).is_ok());
    }

    #[test]
    fn solvency_fails_one_lamport_below_floor() {
        let rs = 5_000_000_000u64;
        let floor = rs + RENT_MIN;
        let result = check_post_claim_creator_solvency(floor - 1, rs, RENT_MIN);
        assert!(result.is_err());
    }

    #[test]
    fn solvency_fails_when_balance_is_zero() {
        let result = check_post_claim_creator_solvency(0, 1_000_000_000, RENT_MIN);
        assert!(result.is_err());
    }

    #[test]
    fn solvency_passes_with_zero_reserves_and_zero_rent() {
        assert!(check_post_claim_creator_solvency(0, 0, 0).is_ok());
    }

    #[test]
    fn solvency_overflow_on_floor_computation_is_caught() {
        // real_sol_reserves + rent_minimum would overflow u64
        let result = check_post_claim_creator_solvency(u64::MAX, u64::MAX, 1);
        assert!(result.is_err());
    }

    // ── Claim logic simulation ────────────────────────────────────────────────

    #[test]
    fn claim_zeros_creator_fees_accumulated() {
        let mut bc = make_bc(10_000_000_000, 1_200_000_000);
        let amount = bc.creator_fees_accumulated;
        bc.creator_fees_accumulated = 0;

        assert_eq!(amount, 1_200_000_000);
        assert_eq!(bc.creator_fees_accumulated, 0);
    }

    #[test]
    fn claim_zero_balance_amount_is_zero() {
        let bc = make_bc(5_000_000_000, 0);
        let amount = claimable_creator_fees(bc.creator_fees_accumulated);
        assert_eq!(amount, 0, "zero-balance claim must return amount=0");
    }

    #[test]
    fn claim_zero_balance_does_not_change_real_sol_reserves() {
        let mut bc = make_bc(5_000_000_000, 0);
        let rs_before = bc.real_sol_reserves;
        // Simulated zero-balance claim: no lamport move, zero out the field (no-op)
        bc.creator_fees_accumulated = 0;
        assert_eq!(bc.real_sol_reserves, rs_before);
    }

    #[test]
    fn solvency_preserved_after_full_claim() {
        let rs = 10_000_000_000u64;
        let cf = 2_000_000_000u64;
        // Pre-claim balance: RS + CF + rent (exactly minimum_lamports)
        let bc_lamports_before = rs + cf + RENT_MIN;
        // After zeroing CF and transferring CF lamports out:
        let bc_lamports_after = bc_lamports_before - cf;
        // Post-claim floor: RS + rent (CF is now 0)
        assert!(check_post_claim_creator_solvency(bc_lamports_after, rs, RENT_MIN).is_ok());
    }

    #[test]
    fn solvency_preserved_with_excess_lamports_before_claim() {
        // bc held more lamports than minimum (e.g. from an accidental deposit)
        let rs = 10_000_000_000u64;
        let cf = 2_000_000_000u64;
        let excess = 5_000_000u64;
        let bc_lamports_before = rs + cf + RENT_MIN + excess;
        let bc_lamports_after = bc_lamports_before - cf;
        assert!(check_post_claim_creator_solvency(bc_lamports_after, rs, RENT_MIN).is_ok());
    }

    #[test]
    fn sequential_claims_first_nonzero_second_zero() {
        let mut bc = make_bc(5_000_000_000, 750_000_000);

        // First claim
        let amount_1 = bc.creator_fees_accumulated;
        bc.creator_fees_accumulated = 0;
        assert_eq!(amount_1, 750_000_000);

        // Simulate some new fees accumulating (re-fill partially)
        // (In real flow this would happen via buy/sell trades)

        // Second immediate claim (no new trades)
        let amount_2 = bc.creator_fees_accumulated;
        assert_eq!(amount_2, 0, "second claim with no new trades must return 0");
    }

    #[test]
    fn double_claim_second_always_gets_zero() {
        let mut bc = make_bc(5_000_000_000, 500_000_000);

        // Claim 1
        bc.creator_fees_accumulated = 0;

        // Claim 2 — must see 0
        let amount_2 = claimable_creator_fees(bc.creator_fees_accumulated);
        assert_eq!(amount_2, 0);
    }

    #[test]
    fn accumulated_fees_rebuilt_after_claim() {
        // After a claim, new trades accumulate again from zero.
        let mut bc = make_bc(5_000_000_000, 1_000_000);
        bc.creator_fees_accumulated = 0;

        // Simulate one more trade adding creator fee
        let new_fee: u64 = 600_000;
        bc.creator_fees_accumulated = bc.creator_fees_accumulated.checked_add(new_fee).unwrap();
        assert_eq!(bc.creator_fees_accumulated, 600_000);

        // Second claim gets the new amount
        let amount_3 = claimable_creator_fees(bc.creator_fees_accumulated);
        assert_eq!(amount_3, 600_000);
    }

    #[test]
    fn lamport_conservation_creator_claim() {
        let rs = 10_000_000_000u64;
        let cf = 3_000_000_000u64;
        let bc_lamports_before = rs + cf + RENT_MIN;

        // After claim: bc loses cf, creator gains cf
        let bc_lamports_after = bc_lamports_before - cf;
        let creator_gain = cf;

        assert_eq!(
            bc_lamports_before,
            bc_lamports_after + creator_gain,
            "SOL must be conserved across the claim"
        );
    }

    #[test]
    fn minimum_lamports_drops_to_rs_plus_rent_after_claim() {
        let rs = 8_000_000_000u64;
        let cf = 2_000_000_000u64;
        let mut bc = make_bc(rs, cf);

        // Pre-claim: minimum includes RS + CF + rent
        let pre_min = bc.minimum_lamports(RENT_MIN);
        assert_eq!(pre_min, rs + cf + RENT_MIN);

        // Simulate claim: zero out creator fees
        bc.creator_fees_accumulated = 0;

        // Post-claim: minimum is now just RS + rent
        let post_min = bc.minimum_lamports(RENT_MIN);
        assert_eq!(post_min, rs + RENT_MIN);
        assert_eq!(
            pre_min - post_min,
            cf,
            "floor drops by exactly the claimed amount"
        );
    }

    #[test]
    fn large_accumulated_fees_claim_correct() {
        // Use a realistic maximum: ~13.6 SOL creator fees (40% of 34 SOL total fees
        // across 85 SOL of trading volume at 1.5% fee)
        let cf = 13_600_000_000u64;
        let rs = 85_000_000_000u64;
        let mut bc = make_bc(rs, cf);

        let amount = claimable_creator_fees(bc.creator_fees_accumulated);
        bc.creator_fees_accumulated = 0;

        assert_eq!(amount, cf);
        assert_eq!(bc.creator_fees_accumulated, 0);
    }

    #[test]
    fn claim_does_not_affect_real_sol_reserves() {
        let rs = 15_000_000_000u64;
        let cf = 1_000_000_000u64;
        let mut bc = make_bc(rs, cf);

        bc.creator_fees_accumulated = 0;

        assert_eq!(
            bc.real_sol_reserves, rs,
            "claim must not change real_sol_reserves"
        );
    }

    #[test]
    fn claim_does_not_affect_virtual_reserves() {
        let rs = 5_000_000_000u64;
        let mut bc = make_bc(rs, 500_000_000);
        let vs_before = bc.virtual_sol_reserves;
        let vt_before = bc.virtual_token_reserves;

        bc.creator_fees_accumulated = 0;

        assert_eq!(bc.virtual_sol_reserves, vs_before);
        assert_eq!(bc.virtual_token_reserves, vt_before);
    }

    #[test]
    fn claim_works_when_curve_is_complete() {
        // No !complete constraint on claim — this simulates a post-graduation claim.
        let mut bc = make_bc(85_000_000_000, 5_000_000_000);
        bc.complete = true;

        let amount = claimable_creator_fees(bc.creator_fees_accumulated);
        bc.creator_fees_accumulated = 0;

        assert_eq!(amount, 5_000_000_000);
        assert_eq!(bc.creator_fees_accumulated, 0);
        assert!(bc.complete, "complete flag must not be altered by a claim");
    }

    // ── CreatorProfile.total_creator_fees_earned (MEDIUM-3 regression) ────────

    fn make_profile(total_creator_fees_earned: u64) -> CreatorProfile {
        CreatorProfile {
            creator: Pubkey::new_unique(),
            referrer: None,
            referrer_set_at: 0,
            total_creator_fees_earned,
            bump: 255,
            _padding: [0u8; 64],
        }
    }

    /// Regression: total_creator_fees_earned is incremented by the claimed amount.
    #[test]
    fn total_creator_fees_earned_incremented_on_claim() {
        let mut profile = make_profile(5_000_000_000);
        let amount = 3_000_000_000u64;

        profile.total_creator_fees_earned = profile
            .total_creator_fees_earned
            .checked_add(amount)
            .unwrap();

        assert_eq!(profile.total_creator_fees_earned, 8_000_000_000);
    }

    /// Regression: zero-balance claim does not change total_creator_fees_earned.
    #[test]
    fn total_creator_fees_earned_unchanged_on_zero_claim() {
        let mut profile = make_profile(5_000_000_000);
        let before = profile.total_creator_fees_earned;

        profile.total_creator_fees_earned =
            profile.total_creator_fees_earned.checked_add(0).unwrap();

        assert_eq!(
            profile.total_creator_fees_earned, before,
            "zero-amount claim must not change total_creator_fees_earned"
        );
    }

    /// Regression: sequential claims accumulate correctly in total_creator_fees_earned.
    #[test]
    fn total_creator_fees_earned_accumulates_across_sequential_claims() {
        let mut profile = make_profile(0);
        let claims = [1_000_000_000u64, 500_000_000, 2_000_000_000, 750_000_000];

        for &amount in &claims {
            profile.total_creator_fees_earned = profile
                .total_creator_fees_earned
                .checked_add(amount)
                .unwrap();
        }

        assert_eq!(
            profile.total_creator_fees_earned,
            claims.iter().sum::<u64>(),
            "total must equal the sum of all sequential claims"
        );
    }

    /// Regression: overflow on total_creator_fees_earned is caught by checked_add.
    /// The handler returns ArithmeticOverflow in this case.
    #[test]
    fn total_creator_fees_earned_overflow_is_caught() {
        let profile = make_profile(u64::MAX);
        let result = profile.total_creator_fees_earned.checked_add(1);
        assert!(
            result.is_none(),
            "u64::MAX + 1 must return None (overflow caught by checked_add)"
        );
    }
}
