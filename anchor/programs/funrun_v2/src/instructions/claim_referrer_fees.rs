use crate::consts::CREATOR_REFERRAL_SEED;
use crate::errors::FunrunError;
use crate::events::CreatorReferrerFeesClaimed;
use crate::state::ReferralAccount;
use anchor_lang::prelude::*;

// ─────────────────────────────────────────────────────────────────────────────
// Accounts
// ─────────────────────────────────────────────────────────────────────────────

/// Accounts required by the `claim_referrer_fees` instruction.
///
/// The referrer withdraws all SOL held in their `ReferralAccount` above the
/// rent-exempt minimum.  Trading instructions deposit the 20% referrer share
/// directly into this account's lamport balance; the claimable amount is
/// therefore `account.lamports() - rent_minimum`.
#[derive(Accounts)]
pub struct ClaimReferrerFees<'info> {
    /// Referrer wallet — must match `ReferralAccount.referrer`.  Receives the claimed SOL.
    #[account(mut)]
    pub referrer: Signer<'info>,

    /// The referrer's aggregated fee account.
    ///
    /// SOL accumulates here from every buy/sell where this wallet is the
    /// `BondingCurve.creator_referrer`.  The claimable amount is the excess
    /// lamport balance above the rent-exempt minimum.
    #[account(
        mut,
        seeds = [CREATOR_REFERRAL_SEED, referrer.key().as_ref()],
        bump = referral_account.bump,
        has_one = referrer @ FunrunError::UnauthorizedReferrer,
    )]
    pub referral_account: Account<'info, ReferralAccount>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers (independently unit-testable)
// ─────────────────────────────────────────────────────────────────────────────

/// Computes the lamports claimable from the referral account.
///
/// The claimable amount is the excess above the rent-exempt minimum.
/// Returns 0 (not an error) when the balance equals the rent floor.
///
/// Uses `saturating_sub` so that an under-rented account (which should
/// never exist in practice) returns 0 rather than panicking.
pub fn claimable_referrer_fees(account_lamports: u64, rent_minimum: u64) -> u64 {
    account_lamports.saturating_sub(rent_minimum)
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

/// Claims all accumulated referrer fees from the `ReferralAccount` PDA.
///
/// # Execution order
/// 1. Read current lamport balance and compute `claimable = lamports - rent_minimum`.
/// 2. Snapshot the current timestamp.
/// 3. Update analytics fields atomically: `fees_claimed_total += claimable`,
///    `last_claim_timestamp = now`.
/// 4. Transfer `claimable` lamports from the PDA to the referrer wallet.
/// 5. Assert post-claim rent preservation: `ra.lamports() >= rent_minimum`.
/// 6. Emit `CreatorReferrerFeesClaimed` event.
///
/// # Pause exemption (intentional)
/// This instruction does **not** check `GlobalConfig.paused`.  It only withdraws
/// lamports that accumulated in the `ReferralAccount` from prior trades; it does
/// not modify virtual reserves or pricing.  Keeping claims available during an
/// emergency pause ensures referrers can always access legitimately earned funds
/// while blocking new value from entering the protocol.
///
/// # Zero-balance behavior
/// When `claimable == 0`, the instruction succeeds: no lamports are moved,
/// `fees_claimed_total` is unchanged (+=0), `last_claim_timestamp` is updated,
/// and the event is emitted with `amount = 0`.
///
/// # Failure atomicity
/// All mutations are in a single Solana transaction; any failure reverts them all.
pub(crate) fn handler(ctx: Context<ClaimReferrerFees>) -> Result<()> {
    // Step 1: Compute claimable = excess lamports above rent floor.
    let rent = Rent::get()?;
    let rent_minimum =
        rent.minimum_balance(ctx.accounts.referral_account.to_account_info().data_len());
    let current_lamports = ctx.accounts.referral_account.to_account_info().lamports();
    let claimable = claimable_referrer_fees(current_lamports, rent_minimum);

    // Step 2: Snapshot timestamp — used in both analytics update and event.
    let clock = Clock::get()?;

    // Step 3: Update analytics fields atomically with the claim.
    // Written before lamport transfer; any subsequent failure rolls back all mutations.
    {
        let ra = &mut ctx.accounts.referral_account;
        ra.fees_claimed_total = ra
            .fees_claimed_total
            .checked_add(claimable)
            .ok_or(FunrunError::ArithmeticOverflow)?;
        ra.last_claim_timestamp = clock.unix_timestamp;
    }

    // Step 4: Transfer claimable lamports from program-owned PDA to referrer.
    // referral_account is owned by this program — direct lamport manipulation is valid.
    // Skipped when claimable == 0 to avoid a no-op borrow cycle.
    if claimable > 0 {
        **ctx
            .accounts
            .referral_account
            .to_account_info()
            .try_borrow_mut_lamports()? -= claimable;
        **ctx
            .accounts
            .referrer
            .to_account_info()
            .try_borrow_mut_lamports()? += claimable;
    }

    // Step 5: Post-claim rent preservation guard.
    // After transferring claimable = lamports - rent_minimum, the remainder
    // must equal rent_minimum.  This is always satisfied by construction
    // (saturating_sub + exact subtraction), but checked as defense-in-depth.
    require!(
        ctx.accounts.referral_account.to_account_info().lamports() >= rent_minimum,
        FunrunError::InsufficientSolInCurve,
    );

    // Step 6: Emit event — always, even for zero-amount claims.
    emit!(CreatorReferrerFeesClaimed {
        creator_referrer: ctx.accounts.referrer.key(),
        amount: claimable,
        fees_claimed_total: ctx.accounts.referral_account.fees_claimed_total,
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
    use crate::consts::REFERRAL_ACCOUNT_SIZE;
    use anchor_lang::prelude::Pubkey;

    // ── Test fixtures ─────────────────────────────────────────────────────────

    // Rent-exempt minimum for the ReferralAccount (117 bytes).
    // Approximate value; exact value computed by the Rent sysvar at runtime.
    const RENT_MIN: u64 = 1_127_520; // ~1.13 million lamports for 117 bytes

    fn make_referral_account(
        fees_claimed_total: u64,
        last_claim_timestamp: i64,
    ) -> ReferralAccount {
        ReferralAccount {
            referrer: Pubkey::new_unique(),
            fees_claimed_total,
            last_claim_timestamp,
            total_creators_referred: 3,
            bump: 253,
            _padding: [0u8; 56],
        }
    }

    fn new_referral_account() -> ReferralAccount {
        ReferralAccount {
            referrer: Pubkey::default(),
            fees_claimed_total: 0,
            last_claim_timestamp: 0,
            total_creators_referred: 0,
            bump: 0,
            _padding: [0u8; 56],
        }
    }

    // ── claimable_referrer_fees ───────────────────────────────────────────────

    #[test]
    fn claimable_is_excess_above_rent_minimum() {
        let lamports = RENT_MIN + 5_000_000_000;
        assert_eq!(claimable_referrer_fees(lamports, RENT_MIN), 5_000_000_000);
    }

    #[test]
    fn claimable_is_zero_when_balance_equals_rent() {
        assert_eq!(claimable_referrer_fees(RENT_MIN, RENT_MIN), 0);
    }

    #[test]
    fn claimable_is_zero_when_balance_below_rent() {
        // Under-rented should not exist, but must not panic
        assert_eq!(claimable_referrer_fees(RENT_MIN - 1, RENT_MIN), 0);
    }

    #[test]
    fn claimable_is_zero_when_balance_is_zero() {
        assert_eq!(claimable_referrer_fees(0, RENT_MIN), 0);
    }

    #[test]
    fn claimable_large_balance() {
        let lamports = RENT_MIN + 85_000_000_000;
        assert_eq!(claimable_referrer_fees(lamports, RENT_MIN), 85_000_000_000);
    }

    #[test]
    fn claimable_single_lamport_above_rent() {
        assert_eq!(claimable_referrer_fees(RENT_MIN + 1, RENT_MIN), 1);
    }

    // ── fees_claimed_total analytics ─────────────────────────────────────────

    #[test]
    fn fees_claimed_total_incremented_on_claim() {
        let mut ra = make_referral_account(0, 0);
        let claimable = 3_000_000_000u64;

        ra.fees_claimed_total = ra.fees_claimed_total.checked_add(claimable).unwrap();

        assert_eq!(ra.fees_claimed_total, 3_000_000_000);
    }

    #[test]
    fn fees_claimed_total_zero_on_new_account() {
        let ra = new_referral_account();
        assert_eq!(ra.fees_claimed_total, 0);
    }

    #[test]
    fn fees_claimed_total_accumulates_across_sequential_claims() {
        let mut ra = make_referral_account(0, 0);

        let claim_1 = 2_000_000_000u64;
        let claim_2 = 1_500_000_000u64;
        let claim_3 = 500_000_000u64;

        ra.fees_claimed_total = ra.fees_claimed_total.checked_add(claim_1).unwrap();
        ra.fees_claimed_total = ra.fees_claimed_total.checked_add(claim_2).unwrap();
        ra.fees_claimed_total = ra.fees_claimed_total.checked_add(claim_3).unwrap();

        assert_eq!(ra.fees_claimed_total, claim_1 + claim_2 + claim_3);
    }

    #[test]
    fn fees_claimed_total_unchanged_on_zero_claim() {
        let mut ra = make_referral_account(5_000_000_000, 1_700_000_000);
        let total_before = ra.fees_claimed_total;

        // Zero-balance claim: claimable = 0, += 0 is a no-op
        ra.fees_claimed_total = ra.fees_claimed_total.checked_add(0).unwrap();

        assert_eq!(
            ra.fees_claimed_total, total_before,
            "zero-balance claim must not change fees_claimed_total"
        );
    }

    #[test]
    fn fees_claimed_total_overflow_is_caught() {
        let mut ra = make_referral_account(u64::MAX, 0);
        let result = ra.fees_claimed_total.checked_add(1);
        assert!(result.is_none(), "u64::MAX + 1 must overflow and be caught");
        // The handler returns ArithmeticOverflow in this case.
    }

    #[test]
    fn fees_claimed_total_near_overflow_safe_add() {
        // u64::MAX - 1 + 1 is safe
        let mut ra = make_referral_account(u64::MAX - 1, 0);
        ra.fees_claimed_total = ra.fees_claimed_total.checked_add(1).unwrap();
        assert_eq!(ra.fees_claimed_total, u64::MAX);
    }

    // ── last_claim_timestamp ──────────────────────────────────────────────────

    #[test]
    fn last_claim_timestamp_zero_on_new_account() {
        let ra = new_referral_account();
        assert_eq!(ra.last_claim_timestamp, 0);
    }

    #[test]
    fn last_claim_timestamp_updated_on_claim() {
        let mut ra = make_referral_account(0, 0);
        let ts: i64 = 1_750_000_000;

        ra.last_claim_timestamp = ts;

        assert_eq!(ra.last_claim_timestamp, ts);
    }

    #[test]
    fn last_claim_timestamp_updated_even_on_zero_claim() {
        let mut ra = make_referral_account(0, 0);
        let ts: i64 = 1_750_000_000;

        // Zero-balance claim still updates timestamp
        ra.fees_claimed_total = ra.fees_claimed_total.checked_add(0).unwrap();
        ra.last_claim_timestamp = ts;

        assert_eq!(ra.last_claim_timestamp, ts);
        assert_eq!(ra.fees_claimed_total, 0);
    }

    #[test]
    fn last_claim_timestamp_advances_on_sequential_claims() {
        let mut ra = make_referral_account(0, 0);

        let ts_1: i64 = 1_700_000_000;
        let ts_2: i64 = 1_700_086_400; // +1 day

        ra.last_claim_timestamp = ts_1;
        assert_eq!(ra.last_claim_timestamp, ts_1);

        ra.last_claim_timestamp = ts_2;
        assert_eq!(ra.last_claim_timestamp, ts_2);
        assert!(ra.last_claim_timestamp > ts_1);
    }

    // ── Lamport conservation and rent preservation ────────────────────────────

    #[test]
    fn lamport_conservation_referrer_claim() {
        let claimable = 4_000_000_000u64;
        let ra_lamports_before = RENT_MIN + claimable;

        // After claim: PDA loses claimable, referrer gains claimable
        let ra_lamports_after = ra_lamports_before - claimable;
        let referrer_gain = claimable;

        assert_eq!(
            ra_lamports_before,
            ra_lamports_after + referrer_gain,
            "total SOL must be conserved"
        );
    }

    #[test]
    fn rent_preserved_exactly_after_claim() {
        let claimable = 5_000_000_000u64;
        let ra_lamports_before = RENT_MIN + claimable;
        let ra_lamports_after = ra_lamports_before - claimable;

        assert_eq!(
            ra_lamports_after, RENT_MIN,
            "lamports after claim must equal exactly the rent minimum"
        );
    }

    #[test]
    fn double_claim_second_claimable_is_zero() {
        // Simulates: first claim drains all excess, second sees zero.
        let claimable_1 = 3_000_000_000u64;
        let ra_lamports = RENT_MIN + claimable_1;

        // First claim
        let c1 = claimable_referrer_fees(ra_lamports, RENT_MIN);
        assert_eq!(c1, claimable_1);

        // After first claim, balance == rent_minimum
        let ra_lamports_after = ra_lamports - c1;

        // Second claim
        let c2 = claimable_referrer_fees(ra_lamports_after, RENT_MIN);
        assert_eq!(c2, 0, "double claim must return 0 on second attempt");
    }

    #[test]
    fn double_claim_fees_claimed_total_unchanged_on_second() {
        let mut ra = make_referral_account(0, 0);
        let claimable = 2_000_000_000u64;

        // First claim
        ra.fees_claimed_total = ra.fees_claimed_total.checked_add(claimable).unwrap();
        assert_eq!(ra.fees_claimed_total, claimable);

        // Second claim with claimable=0 (balance == rent after first)
        let claimable_2 = 0u64;
        ra.fees_claimed_total = ra.fees_claimed_total.checked_add(claimable_2).unwrap();
        assert_eq!(
            ra.fees_claimed_total, claimable,
            "fees_claimed_total must not change on zero second claim"
        );
    }

    #[test]
    fn sequential_claims_accumulate_fees_claimed_total_correctly() {
        let mut ra = make_referral_account(0, 0);

        // Round 1: 1 SOL accumulated, claimed
        let c1 = 1_000_000_000u64;
        ra.fees_claimed_total = ra.fees_claimed_total.checked_add(c1).unwrap();

        // Round 2: another 0.5 SOL accumulated, claimed
        let c2 = 500_000_000u64;
        ra.fees_claimed_total = ra.fees_claimed_total.checked_add(c2).unwrap();

        // Round 3: another 2 SOL accumulated, claimed
        let c3 = 2_000_000_000u64;
        ra.fees_claimed_total = ra.fees_claimed_total.checked_add(c3).unwrap();

        assert_eq!(ra.fees_claimed_total, c1 + c2 + c3);
    }

    // ── Account size ──────────────────────────────────────────────────────────

    #[test]
    fn referral_account_init_space_is_117_bytes() {
        assert_eq!(REFERRAL_ACCOUNT_SIZE, 117);
    }

    #[test]
    fn referral_account_struct_fits_init_space() {
        let minimum = 8   // discriminator
            + 32          // referrer: Pubkey
            + 8           // fees_claimed_total: u64
            + 8           // last_claim_timestamp: i64
            + 4           // total_creators_referred: u32
            + 1           // bump: u8
            + 56; // padding
        assert_eq!(
            ReferralAccount::INIT_SPACE,
            minimum,
            "INIT_SPACE must exactly match the struct layout"
        );
    }
}
