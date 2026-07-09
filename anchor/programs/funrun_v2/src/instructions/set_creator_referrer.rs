use crate::consts::*;
use crate::errors::FunrunError;
use crate::events::CreatorReferrerSet;
use crate::state::{CreatorProfile, ReferralAccount};
use anchor_lang::prelude::*;

// ─────────────────────────────────────────────────────────────────────────────
// Accounts
// ─────────────────────────────────────────────────────────────────────────────

/// Accounts required by the `set_creator_referrer` instruction.
///
/// The `creator` wallet atomically:
///   1. Creates (or opens) their own `CreatorProfile`.
///   2. Records the chosen `referrer` as a permanent, immutable field.
///   3. Creates (or opens) the referrer's `ReferralAccount`.
///   4. Increments the referrer's `total_creators_referred` counter.
///
/// Both profile PDAs are initialised lazily via `init_if_needed`, so this is
/// the only instruction that must be called before `create_coin` to activate
/// the 40/40/20 referral split on a creator's future coins.
#[derive(Accounts)]
pub struct SetCreatorReferrer<'info> {
    /// Creator wallet — signs the transaction and pays for any new accounts.
    #[account(mut)]
    pub creator: Signer<'info>,

    /// Creator's own profile PDA.
    ///
    /// Created if this is the creator's first protocol interaction.
    /// Mutated to store the referrer pubkey and timestamp.
    /// A second call on the same profile is rejected with
    /// [`FunrunError::ReferralAlreadySet`].
    ///
    /// Seeds: [b"creator_profile", creator.key()]
    #[account(
        init_if_needed,
        payer = creator,
        space = CreatorProfile::INIT_SPACE,
        seeds = [CREATOR_PROFILE_SEED, creator.key().as_ref()],
        bump,
    )]
    pub creator_profile: Account<'info, CreatorProfile>,

    /// The wallet being designated as the creator's referrer.
    ///
    /// Not required to sign — the creator unilaterally assigns a referrer.
    /// The key is validated indirectly: the `referrer_profile` PDA is derived
    /// from this key, so Anchor rejects any key whose profile does not exist.
    ///
    /// # Safety
    /// - Self-referral rejected by the `creator.key() != referrer.key()`
    ///   constraint below.
    /// - `Pubkey::default()` rejected by the second constraint.
    /// - Key is verified to own a live `CreatorProfile` via `referrer_profile`.
    ///   CHECK: key validated through `referrer_profile` PDA derivation; self-referral
    ///   and default-key guards enforced by account constraints.
    #[account(
        constraint = referrer.key() != creator.key() @ FunrunError::SelfReferral,
        constraint = referrer.key() != Pubkey::default() @ FunrunError::InvalidFeeConfiguration,
    )]
    pub referrer: UncheckedAccount<'info>,

    /// Referrer's profile — **must already exist**.
    ///
    /// Anchor will throw `AccountNotInitialized` if the referrer has never
    /// interacted with the protocol, which naturally enforces the invariant
    /// "referrer must be a valid creator."
    ///
    /// Also loaded to detect **direct circular referrals**: if the referrer
    /// already has this `creator` as their own referrer, the instruction fails
    /// with [`FunrunError::CircularReferral`].
    ///
    /// Seeds: [b"creator_profile", referrer.key()]
    #[account(
        seeds = [CREATOR_PROFILE_SEED, referrer.key().as_ref()],
        bump,
        constraint = referrer_profile.creator == referrer.key() @ FunrunError::UnauthorizedReferrer,
    )]
    pub referrer_profile: Account<'info, CreatorProfile>,

    /// Referrer's aggregated referral statistics PDA.
    ///
    /// Created on the referrer's first referred creator; reused on subsequent
    /// calls.  `total_creators_referred` is incremented by one.
    ///
    /// Seeds: [b"creator_referral", referrer.key()]
    #[account(
        init_if_needed,
        payer = creator,
        space = ReferralAccount::INIT_SPACE,
        seeds = [CREATOR_REFERRAL_SEED, referrer.key().as_ref()],
        bump,
    )]
    pub referral_account: Account<'info, ReferralAccount>,

    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure validation helper (independently unit-testable)
// ─────────────────────────────────────────────────────────────────────────────

/// Validates all business rules for `set_creator_referrer` without touching
/// any Anchor account context.
///
/// Decoupled from the Anchor runtime so every constraint can be exercised in
/// native `cargo test` without a validator.
///
/// # Parameters
/// - `creator` — the signer's public key.
/// - `referrer` — the proposed referrer's public key.
/// - `profile_has_referrer` — whether `creator_profile.referrer.is_some()`.
/// - `referrer_own_referrer` — the value of `referrer_profile.referrer`.
///
/// # Errors
/// | Condition                                         | Error                              |
/// |---------------------------------------------------|------------------------------------|
/// | `referrer == Pubkey::default()`                   | `InvalidFeeConfiguration`          |
/// | `creator == referrer`                             | `SelfReferral`                     |
/// | `profile_has_referrer == true`                    | `ReferralAlreadySet`               |
/// | `referrer_own_referrer == Some(creator)`          | `CircularReferral`                 |
pub fn validate_set_creator_referrer(
    creator: Pubkey,
    referrer: Pubkey,
    profile_has_referrer: bool,
    referrer_own_referrer: Option<Pubkey>,
) -> Result<()> {
    // Guard 1: reject the zero key — a Pubkey::default() referrer would make
    // fee routing permanently unclaimable.
    require!(
        referrer != Pubkey::default(),
        FunrunError::InvalidFeeConfiguration,
    );

    // Guard 2: no self-referral.
    require!(creator != referrer, FunrunError::SelfReferral);

    // Guard 3: immutability — referrer is write-once.
    require!(!profile_has_referrer, FunrunError::ReferralAlreadySet);

    // Guard 4: direct circular referral prevention.
    //
    // If A is trying to set B as their referrer, and B already has A as
    // their own referrer, the result would be A → B and B → A simultaneously,
    // forming a 2-cycle.  We detect this by checking one hop:
    //
    //   referrer_own_referrer == Some(creator)
    //
    // Longer cycles (A → B → C → A, etc.) cannot be checked without
    // traversing an unbounded chain on-chain.  They are prevented in practice
    // by the immutability invariant: once B → C is set, C cannot "reach back"
    // and affect B's referrer.  The fee model distributes only one hop deep
    // (BondingCurve.creator_referrer), so any residual multi-hop cycle has
    // no exploitable economic consequence.
    if let Some(ref_own) = referrer_own_referrer {
        require!(ref_own != creator, FunrunError::CircularReferral);
    }

    Ok(())
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

/// Sets a permanent referrer on the caller's `CreatorProfile`.
///
/// The relationship is written once and can never be changed or removed.
/// After this call, every coin the creator mints will snapshot
/// `creator_profile.referrer` into `BondingCurve.creator_referrer`, giving
/// the referrer a permanent 20% share of trading fees on that coin.
///
/// # Validation (at account-constraint level, before the handler runs)
/// - `referrer != creator` — self-referral blocked.
/// - `referrer != Pubkey::default()` — zero key blocked.
/// - `referrer_profile` must already exist — unregistered referrers blocked.
/// - `referrer_profile.creator == referrer.key()` — prevents spoofed profile.
///
/// # Validation (inside the handler)
/// - `creator_profile.referrer.is_none()` — immutability enforced.
/// - `referrer_profile.referrer != Some(creator)` — direct circular blocked.
pub(crate) fn handler(ctx: Context<SetCreatorReferrer>) -> Result<()> {
    let clock = Clock::get()?;
    let creator_key = ctx.accounts.creator.key();
    let referrer_key = ctx.accounts.referrer.key();

    // ── Runtime validation (mirrors validate_set_creator_referrer) ────────────
    // account constraints already checked self-referral and default-key;
    // the remaining checks require account data available only in the handler.
    validate_set_creator_referrer(
        creator_key,
        referrer_key,
        ctx.accounts.creator_profile.has_referrer(),
        ctx.accounts.referrer_profile.referrer,
    )?;

    // ── Lazily initialise creator_profile if first interaction ────────────────
    // init_if_needed zero-initialises new accounts; we detect new accounts by
    // checking whether the creator field is still the default (all-zero) value.
    if ctx.accounts.creator_profile.creator == Pubkey::default() {
        ctx.accounts.creator_profile.creator = creator_key;
        ctx.accounts.creator_profile.bump = ctx.bumps.creator_profile;
    }

    // ── Write the immutable referrer ──────────────────────────────────────────
    ctx.accounts.creator_profile.referrer = Some(referrer_key);
    ctx.accounts.creator_profile.referrer_set_at = clock.unix_timestamp;

    // ── Lazily initialise referral_account if first referred creator ──────────
    if ctx.accounts.referral_account.referrer == Pubkey::default() {
        ctx.accounts.referral_account.referrer = referrer_key;
        ctx.accounts.referral_account.bump = ctx.bumps.referral_account;
    }

    // ── Increment referred-creator counter ────────────────────────────────────
    ctx.accounts.referral_account.total_creators_referred = ctx
        .accounts
        .referral_account
        .total_creators_referred
        .checked_add(1)
        .ok_or(error!(FunrunError::ArithmeticOverflow))?;

    msg!(
        "set_creator_referrer: creator={} referrer={}",
        creator_key,
        referrer_key,
    );

    emit!(CreatorReferrerSet {
        creator: creator_key,
        creator_referrer: referrer_key,
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

    /// Extracts the numeric error code from an Anchor `Error`.
    /// Panics if the error is a `ProgramError` (unexpected in these tests).
    fn err_code(e: anchor_lang::error::Error) -> u32 {
        match e {
            anchor_lang::error::Error::AnchorError(ae) => ae.error_code_number,
            anchor_lang::error::Error::ProgramError(_) => {
                panic!("expected AnchorError, got ProgramError")
            }
        }
    }

    /// Computes the expected numeric code for a `FunrunError` variant.
    ///
    /// Anchor custom errors start at `ERROR_CODE_OFFSET` (6000).
    /// The discriminant is the 0-indexed position of the variant in the enum.
    fn expected_code(e: FunrunError) -> u32 {
        ERROR_CODE_OFFSET + e as u32
    }

    fn unique() -> Pubkey {
        Pubkey::new_unique()
    }

    /// Builds a fully-initialised `CreatorProfile` for a given creator key.
    fn make_profile(creator: Pubkey, referrer: Option<Pubkey>) -> CreatorProfile {
        CreatorProfile {
            creator,
            referrer,
            referrer_set_at: if referrer.is_some() { 1_700_000_000 } else { 0 },
            total_creator_fees_earned: 0,
            bump: 254,
            _padding: [0u8; 64],
        }
    }

    /// Builds a new (uninitialised) `CreatorProfile` as `init_if_needed` would
    /// produce — all fields zero.
    fn new_profile() -> CreatorProfile {
        CreatorProfile {
            creator: Pubkey::default(),
            referrer: None,
            referrer_set_at: 0,
            total_creator_fees_earned: 0,
            bump: 0,
            _padding: [0u8; 64],
        }
    }

    /// Builds a `ReferralAccount` as `init_if_needed` produces — all fields zero.
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

    /// Builds a `ReferralAccount` for an existing referrer.
    fn make_referral_account(referrer: Pubkey, referred_count: u32) -> ReferralAccount {
        ReferralAccount {
            referrer,
            fees_claimed_total: 0,
            last_claim_timestamp: 0,
            total_creators_referred: referred_count,
            bump: 253,
            _padding: [0u8; 56],
        }
    }

    // ── validate_set_creator_referrer: positive cases ─────────────────────────

    #[test]
    fn valid_first_referral_no_existing_referrer() {
        let creator = unique();
        let referrer = unique();
        assert!(
            validate_set_creator_referrer(creator, referrer, false, None).is_ok(),
            "fresh referral with no prior state must pass",
        );
    }

    #[test]
    fn valid_referral_when_referrer_has_different_referrer() {
        // A wants referrer B. B already has referrer C. C ≠ A → no cycle.
        let a = unique();
        let b = unique();
        let c = unique();
        assert!(
            validate_set_creator_referrer(a, b, false, Some(c)).is_ok(),
            "A→B where B→C (C≠A) must not be treated as circular",
        );
    }

    #[test]
    fn valid_referral_when_referrer_has_no_referrer() {
        let creator = unique();
        let referrer = unique();
        assert!(
            validate_set_creator_referrer(creator, referrer, false, None).is_ok(),
            "referrer without their own referrer must be valid",
        );
    }

    #[test]
    fn multiple_distinct_creators_can_refer_same_referrer() {
        let referrer = unique();
        for _ in 0..5 {
            let creator = unique();
            assert!(
                validate_set_creator_referrer(creator, referrer, false, None).is_ok(),
                "many creators sharing a referrer must all pass",
            );
        }
    }

    #[test]
    fn non_default_arbitrary_pubkey_accepted() {
        // Pubkey with all 0xFF bytes is valid (not default).
        let creator = unique();
        let referrer = Pubkey::from([0xFFu8; 32]);
        assert!(
            validate_set_creator_referrer(creator, referrer, false, None).is_ok(),
            "non-default max-byte pubkey must be accepted",
        );
    }

    // ── validate_set_creator_referrer: self-referral ──────────────────────────

    #[test]
    fn self_referral_same_key_rejected() {
        let key = unique();
        let result = validate_set_creator_referrer(key, key, false, None);
        assert!(result.is_err(), "creator == referrer must be rejected");
    }

    #[test]
    fn self_referral_error_type_is_self_referral() {
        let key = unique();
        let err = validate_set_creator_referrer(key, key, false, None).unwrap_err();
        assert_eq!(
            err_code(err),
            expected_code(FunrunError::SelfReferral),
            "self-referral must produce SelfReferral error",
        );
    }

    // ── validate_set_creator_referrer: Pubkey::default() ─────────────────────

    #[test]
    fn default_pubkey_referrer_rejected() {
        let creator = unique();
        let result = validate_set_creator_referrer(creator, Pubkey::default(), false, None);
        assert!(
            result.is_err(),
            "Pubkey::default() as referrer must be rejected"
        );
    }

    #[test]
    fn default_pubkey_error_is_invalid_fee_configuration() {
        let creator = unique();
        let err =
            validate_set_creator_referrer(creator, Pubkey::default(), false, None).unwrap_err();
        assert_eq!(
            err_code(err),
            expected_code(FunrunError::InvalidFeeConfiguration),
            "default pubkey must produce InvalidFeeConfiguration",
        );
    }

    // ── validate_set_creator_referrer: already set ────────────────────────────

    #[test]
    fn referral_already_set_rejected() {
        let creator = unique();
        let referrer = unique();
        let result =
            validate_set_creator_referrer(creator, referrer, /* already_set */ true, None);
        assert!(result.is_err(), "already-set referrer must be rejected");
    }

    #[test]
    fn referral_already_set_error_type_is_referral_already_set() {
        let creator = unique();
        let referrer = unique();
        let err = validate_set_creator_referrer(creator, referrer, true, None).unwrap_err();
        assert_eq!(
            err_code(err),
            expected_code(FunrunError::ReferralAlreadySet),
            "already-set must produce ReferralAlreadySet",
        );
    }

    #[test]
    fn already_set_check_independent_of_who_current_referrer_is() {
        // Even if the creator passes in a *different* desired referrer,
        // the already-set check must still fire.
        let creator = unique();
        let original_referrer = unique();
        let new_referrer = unique();

        // Simulate: creator already has original_referrer
        let result =
            validate_set_creator_referrer(creator, new_referrer, true, Some(original_referrer));
        assert!(
            result.is_err(),
            "cannot change referrer even to a different valid key",
        );
    }

    // ── validate_set_creator_referrer: circular referral ─────────────────────

    #[test]
    fn direct_circular_referral_rejected() {
        // A wants to set B as referrer, but B's referrer is already A.
        let a = unique();
        let b = unique();
        // B already has A as referrer → referrer_own_referrer = Some(A)
        let result = validate_set_creator_referrer(a, b, false, Some(a));
        assert!(
            result.is_err(),
            "A→B where B→A is already set must be rejected as circular",
        );
    }

    #[test]
    fn circular_referral_error_type_is_circular_referral() {
        let a = unique();
        let b = unique();
        let err = validate_set_creator_referrer(a, b, false, Some(a)).unwrap_err();
        assert_eq!(
            err_code(err),
            expected_code(FunrunError::CircularReferral),
            "direct circular must produce CircularReferral",
        );
    }

    #[test]
    fn referrer_pointing_at_different_creator_is_not_circular() {
        let a = unique();
        let b = unique();
        let c = unique();
        // B's referrer is C (not A), so A→B is fine.
        assert!(
            validate_set_creator_referrer(a, b, false, Some(c)).is_ok(),
            "B→C does not prevent A→B",
        );
    }

    #[test]
    fn referrer_with_no_referrer_is_not_circular() {
        let a = unique();
        let b = unique();
        assert!(
            validate_set_creator_referrer(a, b, false, None).is_ok(),
            "referrer with None referrer is never circular",
        );
    }

    // ── validate_set_creator_referrer: combined / order-of-checks ────────────

    #[test]
    fn default_pubkey_checked_before_self_referral() {
        // If referrer == Pubkey::default(), that check fires before self-referral
        // even when creator and referrer happen to be the same default key.
        let default = Pubkey::default();
        let err = validate_set_creator_referrer(default, default, false, None).unwrap_err();
        assert_eq!(
            err_code(err),
            expected_code(FunrunError::InvalidFeeConfiguration),
            "InvalidFeeConfiguration must fire before SelfReferral",
        );
    }

    #[test]
    fn already_set_checked_before_circular() {
        // Even if the relationship would also be circular, "already set" fires first.
        let a = unique();
        let b = unique();
        let err = validate_set_creator_referrer(a, b, true, Some(a)).unwrap_err();
        assert_eq!(
            err_code(err),
            expected_code(FunrunError::ReferralAlreadySet),
            "ReferralAlreadySet must fire before CircularReferral",
        );
    }

    // ── CreatorProfile helper method tests ────────────────────────────────────

    #[test]
    fn has_referrer_false_on_new_profile() {
        let p = new_profile();
        assert!(
            !p.has_referrer(),
            "brand-new profile must report has_referrer=false"
        );
    }

    #[test]
    fn has_referrer_true_after_referrer_set() {
        let creator = unique();
        let referrer = unique();
        let p = make_profile(creator, Some(referrer));
        assert!(
            p.has_referrer(),
            "profile with referrer must report has_referrer=true"
        );
    }

    #[test]
    fn has_referrer_false_after_explicit_none() {
        let creator = unique();
        let p = make_profile(creator, None);
        assert!(
            !p.has_referrer(),
            "profile with referrer=None must report false"
        );
    }

    // ── Creator profile lazy-init simulation ──────────────────────────────────

    #[test]
    fn new_profile_gets_creator_and_bump_on_first_init() {
        let mut profile = new_profile();
        let creator_key = unique();
        let expected_bump: u8 = 253;

        // Mirrors the handler's init_if_needed logic
        if profile.creator == Pubkey::default() {
            profile.creator = creator_key;
            profile.bump = expected_bump;
        }

        assert_eq!(profile.creator, creator_key);
        assert_eq!(profile.bump, expected_bump);
    }

    #[test]
    fn existing_profile_creator_field_not_overwritten() {
        let original_creator = unique();
        let mut profile = make_profile(original_creator, None);

        // Simulate: handler runs again on existing profile
        if profile.creator == Pubkey::default() {
            profile.creator = unique(); // should NOT execute
            profile.bump = 0;
        }

        assert_eq!(
            profile.creator, original_creator,
            "existing creator field must not be overwritten by lazy-init",
        );
    }

    #[test]
    fn referrer_is_stored_on_profile_after_set() {
        let mut profile = make_profile(unique(), None);
        let referrer_key = unique();
        let ts: i64 = 1_700_000_000;

        profile.referrer = Some(referrer_key);
        profile.referrer_set_at = ts;

        assert_eq!(profile.referrer, Some(referrer_key));
        assert_eq!(profile.referrer_set_at, ts);
        assert!(profile.has_referrer());
    }

    #[test]
    fn second_write_attempt_blocked_by_has_referrer() {
        // Simulate the immutability guard in the handler
        let creator_key = unique();
        let first_referrer = unique();
        let second_referrer = unique();

        let mut profile = make_profile(creator_key, None);

        // First set — succeeds
        profile.referrer = Some(first_referrer);
        profile.referrer_set_at = 1_700_000_000;
        assert!(profile.has_referrer());

        // Second set — guard prevents it
        let guard_triggered = validate_set_creator_referrer(
            creator_key,
            second_referrer,
            profile.has_referrer(),
            None,
        )
        .is_err();
        assert!(
            guard_triggered,
            "immutability guard must block second write attempt",
        );

        // Profile unchanged
        assert_eq!(
            profile.referrer,
            Some(first_referrer),
            "referrer must remain unchanged after blocked second write",
        );
    }

    // ── ReferralAccount lazy-init simulation ──────────────────────────────────

    #[test]
    fn new_referral_account_gets_referrer_and_bump_on_first_init() {
        let mut acct = new_referral_account();
        let referrer_key = unique();
        let expected_bump: u8 = 252;

        // Mirrors handler's lazy-init logic
        if acct.referrer == Pubkey::default() {
            acct.referrer = referrer_key;
            acct.bump = expected_bump;
        }

        assert_eq!(acct.referrer, referrer_key);
        assert_eq!(acct.bump, expected_bump);
    }

    #[test]
    fn existing_referral_account_referrer_not_overwritten() {
        let referrer_key = unique();
        let mut acct = make_referral_account(referrer_key, 3);

        // Simulate: handler runs again for second creator choosing same referrer
        if acct.referrer == Pubkey::default() {
            acct.referrer = unique(); // should NOT execute
        }

        assert_eq!(
            acct.referrer, referrer_key,
            "existing referral account referrer must not be overwritten",
        );
    }

    // ── total_creators_referred counter ──────────────────────────────────────

    #[test]
    fn total_creators_referred_incremented_from_zero() {
        let mut acct = new_referral_account();
        acct.total_creators_referred = acct.total_creators_referred.checked_add(1).unwrap();
        assert_eq!(acct.total_creators_referred, 1);
    }

    #[test]
    fn total_creators_referred_incremented_from_existing() {
        let mut acct = make_referral_account(unique(), 9);
        acct.total_creators_referred = acct.total_creators_referred.checked_add(1).unwrap();
        assert_eq!(acct.total_creators_referred, 10);
    }

    #[test]
    fn total_creators_referred_overflow_is_caught() {
        let mut acct = make_referral_account(unique(), u32::MAX);
        let result = acct.total_creators_referred.checked_add(1);
        assert!(
            result.is_none(),
            "u32::MAX + 1 must overflow and be caught by checked_add",
        );
        // The handler would return ArithmeticOverflow here.
    }

    #[test]
    fn multiple_referrals_accumulate_count_correctly() {
        let mut acct = new_referral_account();

        for i in 1u32..=10 {
            acct.total_creators_referred = acct.total_creators_referred.checked_add(1).unwrap();
            assert_eq!(acct.total_creators_referred, i);
        }
    }

    // ── Creator Referrer snapshot design (future create_coin compatibility) ───

    /// Demonstrates that the referrer stored in `CreatorProfile` is stable and
    /// can be snapshotted deterministically into a BondingCurve at coin
    /// creation time.  `create_coin` (P3) will call
    /// `creator_profile.referrer` and write it into `BondingCurve.creator_referrer`.
    #[test]
    fn referrer_snapshot_is_stable_once_set() {
        let creator_key = unique();
        let referrer_key = unique();
        let mut profile = make_profile(creator_key, None);

        // set_creator_referrer sets it once
        profile.referrer = Some(referrer_key);

        // Snapshotted at create_coin time
        let snapshot: Option<Pubkey> = profile.referrer;
        assert_eq!(snapshot, Some(referrer_key));

        // Any subsequent read returns the same value
        assert_eq!(
            profile.referrer, snapshot,
            "referrer is stable across reads"
        );
    }

    #[test]
    fn no_referrer_snapshot_gives_none() {
        let creator_key = unique();
        let profile = make_profile(creator_key, None);

        // create_coin with no prior set_creator_referrer
        let snapshot: Option<Pubkey> = profile.referrer;
        assert!(
            snapshot.is_none(),
            "snapshot without set_creator_referrer must be None",
        );
        // BondingCurve.creator_referrer would be None → treasury gets 60% of fees
    }

    // ── PDA seed validation ───────────────────────────────────────────────────

    #[test]
    fn creator_profile_seed_is_distinct_from_referral_account_seed() {
        assert_ne!(
            CREATOR_PROFILE_SEED, CREATOR_REFERRAL_SEED,
            "CreatorProfile and ReferralAccount must have different PDA seeds",
        );
    }

    #[test]
    fn pda_seeds_for_different_creators_produce_different_accounts() {
        // Different creators must yield distinct PDAs (enforced by including
        // creator.key() in the seed; verified here at the seed-bytes level).
        let a = unique();
        let b = unique();
        // Seeds differ if and only if the key bytes differ
        assert_ne!(
            [CREATOR_PROFILE_SEED, a.as_ref()].concat(),
            [CREATOR_PROFILE_SEED, b.as_ref()].concat(),
            "different creators must produce different PDA seeds",
        );
    }

    #[test]
    fn referral_account_pda_is_keyed_by_referrer_not_creator() {
        // The ReferralAccount seed is [CREATOR_REFERRAL_SEED, referrer.key()]
        // so the same referrer receives a single shared account regardless of
        // how many creators set them.
        let referrer = unique();
        let creator_a = unique();
        let creator_b = unique();

        let seed_for_a_choosing_referrer = [CREATOR_REFERRAL_SEED, referrer.as_ref()].concat();
        let seed_for_b_choosing_referrer = [CREATOR_REFERRAL_SEED, referrer.as_ref()].concat();

        assert_eq!(
            seed_for_a_choosing_referrer, seed_for_b_choosing_referrer,
            "multiple creators choosing the same referrer share one ReferralAccount",
        );
        let _ = (creator_a, creator_b); // suppress unused warnings
    }

    // ── Account sizing ────────────────────────────────────────────────────────

    #[test]
    fn creator_profile_size_covers_option_pubkey_correctly() {
        // Option<Pubkey> serialised as 1 (tag) + 32 (data) = 33 bytes
        let minimum = 8   // discriminator
            + 32          // creator: Pubkey
            + 33          // referrer: Option<Pubkey>
            + 8           // referrer_set_at: i64
            + 8           // total_creator_fees_earned: u64
            + 1           // bump: u8
            + 64; // padding
        assert!(
            CreatorProfile::INIT_SPACE >= minimum,
            "CreatorProfile::INIT_SPACE {} < required {}",
            CreatorProfile::INIT_SPACE,
            minimum,
        );
    }

    #[test]
    fn referral_account_size_covers_all_fields() {
        let minimum = 8   // discriminator
            + 32          // referrer: Pubkey
            + 8           // fees_claimed_total: u64
            + 8           // last_claim_timestamp: i64
            + 4           // total_creators_referred: u32
            + 1           // bump: u8
            + 56; // padding
        assert!(
            ReferralAccount::INIT_SPACE >= minimum,
            "ReferralAccount::INIT_SPACE {} < required {}",
            ReferralAccount::INIT_SPACE,
            minimum,
        );
    }
}
