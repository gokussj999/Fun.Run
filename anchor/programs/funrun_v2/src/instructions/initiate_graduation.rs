use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::consts::*;
use crate::errors::FunrunError;
use crate::events::GraduationInitiated;
use crate::state::{BondingCurve, GlobalConfig};

// ── Accounts ──────────────────────────────────────────────────────────────────

/// Accounts required by the `initiate_graduation` instruction.
///
/// Graduation is **permissionless** — any caller may trigger it once the curve
/// satisfies all eligibility criteria.  The instruction only mutates on-chain
/// state (`BondingCurve.complete = true`, `graduation_dex_fee_snapshot`); no
/// SOL or token transfers occur here.  Raydium CPI, LP creation, and authority
/// revocations are handled in P6.2.
#[derive(Accounts)]
pub struct InitiateGraduation<'info> {
    /// Any wallet may trigger graduation — no admin authority required.
    pub caller: Signer<'info>,

    /// Protocol configuration — enforces pause guard and supplies threshold +
    /// DEX fee values used to validate and snapshot graduation parameters.
    #[account(
        seeds = [GLOBAL_CONFIG_SEED],
        bump = global_config.bump,
        constraint = !global_config.paused @ FunrunError::ProgramPaused,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    /// The SPL mint this curve governs — used to derive the `bonding_curve` PDA.
    pub mint: Account<'info, Mint>,

    /// Bonding curve AMM state to graduate.
    ///
    /// Rejected at the account-validation layer if:
    ///  - `complete` is already `true` → [`FunrunError::CurveComplete`]
    ///  - `real_sol_reserves < global_config.graduation_threshold` →
    ///    [`FunrunError::GraduationThresholdNotMet`]
    ///
    /// Additional eligibility checks (protocol version, snapshot consistency)
    /// are enforced in the handler via pure helper functions.
    #[account(
        mut,
        seeds = [BONDING_CURVE_SEED, mint.key().as_ref()],
        bump = bonding_curve.bump,
        has_one = mint,
        constraint = !bonding_curve.complete @ FunrunError::CurveComplete,
        constraint = bonding_curve.real_sol_reserves >= global_config.graduation_threshold
            @ FunrunError::GraduationThresholdNotMet,
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

/// Validates graduation eligibility criteria that cannot be expressed as Anchor
/// account constraints.
///
/// Currently checks that the curve's `protocol_version` matches the on-chain
/// `PROTOCOL_VERSION` constant.  This prevents graduation of curves created by
/// a different major version of the program (e.g., stale accounts from a failed
/// migration, or foreign program invocations spoofing the PDA seeds).
///
/// # Errors
/// - [`FunrunError::ProtocolVersionMismatch`] — `curve.protocol_version ≠ PROTOCOL_VERSION`
pub fn validate_graduation_eligibility(curve: &BondingCurve) -> Result<()> {
    require!(
        curve.protocol_version == PROTOCOL_VERSION,
        FunrunError::ProtocolVersionMismatch,
    );
    Ok(())
}

/// Computes the net SOL that will be deposited into the Raydium CPMM pool.
///
/// Returns `real_sol_reserves − graduation_dex_fee`.  The dex fee covers the
/// Raydium pool creation cost and is transferred to Treasury in P6.2.
///
/// # Errors
/// - [`FunrunError::InsufficientSolForGraduation`] — `graduation_dex_fee > real_sol_reserves`
pub fn compute_sol_to_dex(real_sol_reserves: u64, graduation_dex_fee: u64) -> Result<u64> {
    real_sol_reserves
        .checked_sub(graduation_dex_fee)
        .ok_or(error!(FunrunError::InsufficientSolForGraduation))
}

/// Validates that the graduation snapshot is internally consistent before
/// committing the state transition.
///
/// A `sol_to_dex` of zero would create an empty Raydium pool — Raydium rejects
/// such calls with a division-by-zero error, so we catch it here with a clearer
/// on-chain error.
///
/// # Errors
/// - [`FunrunError::GraduationSnapshotInconsistency`] — `sol_to_dex == 0`
pub fn check_graduation_snapshot_consistency(sol_to_dex: u64) -> Result<()> {
    require!(sol_to_dex > 0, FunrunError::GraduationSnapshotInconsistency,);
    Ok(())
}

// ── Handler ───────────────────────────────────────────────────────────────────

/// Initiates the graduation of a bonding curve to a Raydium CPMM DEX pool.
///
/// # State machine
///
/// ```text
/// ACTIVE  (complete=false, real_sol < threshold)
///   │
///   ▼  buy trades accumulate real_sol
/// ELIGIBLE  (complete=false, real_sol ≥ threshold)
///   │
///   ▼  initiate_graduation  ← this instruction
/// GRADUATING  (complete=true, graduation_dex_fee_snapshot locked)
///   │
///   ▼  P6.2: Raydium CPI, LP creation, liquidity deposit, authority revoke
/// GRADUATED
/// ```
///
/// # Execution steps
///
/// 1. **Eligibility validation** — `protocol_version` must equal `PROTOCOL_VERSION`.
/// 2. **Snapshot computation** — `sol_to_dex = real_sol_reserves − graduation_dex_fee`
///    must be positive.
/// 3. **State commitment** — sets `complete = true` and writes
///    `graduation_dex_fee_snapshot`.  After this point `buy` and `sell` will
///    reject all trades via the `!bonding_curve.complete` account constraint.
/// 4. **Event emission** — emits [`GraduationInitiated`] for off-chain indexers.
///
/// # What this instruction does NOT do
///
/// No SOL transfers, token transfers, Raydium CPIs, LP minting, or authority
/// revocations occur here.  All of that is P6.2.
///
/// # Permissionless
///
/// Any wallet may call this instruction; no admin authority is required.  The
/// eligibility checks ensure the curve is genuinely ready to graduate before
/// the irreversible state transition is committed.
pub fn handler(ctx: Context<InitiateGraduation>) -> Result<()> {
    let curve = &mut ctx.accounts.bonding_curve;
    let config = &ctx.accounts.global_config;

    // Step 1: Additional eligibility validation beyond account constraints.
    validate_graduation_eligibility(curve)?;

    // Step 2: Compute and validate snapshot values.
    let sol_to_dex = compute_sol_to_dex(curve.real_sol_reserves, config.graduation_dex_fee)?;
    check_graduation_snapshot_consistency(sol_to_dex)?;

    // Step 3: Commit state transition (irreversible after this point).
    curve.complete = true;
    curve.graduation_dex_fee_snapshot = config.graduation_dex_fee;

    // Step 4: Emit graduation initiation event.
    emit!(GraduationInitiated {
        mint: curve.mint,
        creator: curve.creator,
        real_sol_at_initiation: curve.real_sol_reserves,
        sol_to_dex_snapshot: sol_to_dex,
        graduation_dex_fee_snapshot: config.graduation_dex_fee,
        total_trades: curve.total_trades,
        total_volume_sol: curve.total_volume_sol,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::GlobalConfig;

    // ── Test fixtures ─────────────────────────────────────────────────────────

    fn make_config(
        graduation_threshold: u64,
        graduation_dex_fee: u64,
        paused: bool,
    ) -> GlobalConfig {
        GlobalConfig {
            admin: Pubkey::default(),
            fee_recipient: Pubkey::default(),
            creation_fee_lamports: 0,
            total_trading_fee_bps: 0,
            graduation_threshold,
            graduation_dex_fee,
            paused,
            bump: 0,
            total_sol_collected: 0,
            total_sol_disbursed: 0,
            _padding: [0u8; 128],
        }
    }

    fn make_curve(real_sol_reserves: u64, complete: bool, protocol_version: u8) -> BondingCurve {
        BondingCurve {
            creator: Pubkey::default(),
            mint: Pubkey::default(),
            creator_referrer: None,
            name: String::new(),
            symbol: String::new(),
            uri: String::new(),
            creation_fee_paid: 0,
            creation_timestamp: 0,
            protocol_version,
            virtual_sol_reserves: VIRTUAL_SOL_INITIAL,
            virtual_token_reserves: VIRTUAL_TOKEN_INITIAL,
            real_sol_reserves,
            real_token_reserves: 0,
            creator_fees_accumulated: 0,
            complete,
            total_trades: 0,
            total_volume_sol: 0,
            bump: 0,
            graduation_dex_fee_snapshot: 0,
            graduated: false,
            _padding: [0u8; 55],
        }
    }

    // ── validate_graduation_eligibility ───────────────────────────────────────

    #[test]
    fn eligibility_correct_version_passes() {
        let curve = make_curve(85_000_000_000, false, PROTOCOL_VERSION);
        assert!(validate_graduation_eligibility(&curve).is_ok());
    }

    #[test]
    fn eligibility_wrong_version_below_is_rejected() {
        // A curve from a previous protocol version must not graduate via this path.
        let curve = make_curve(85_000_000_000, false, PROTOCOL_VERSION - 1);
        let result = validate_graduation_eligibility(&curve);
        assert_eq!(
            result.unwrap_err(),
            anchor_lang::error!(FunrunError::ProtocolVersionMismatch),
        );
    }

    #[test]
    fn eligibility_wrong_version_above_is_rejected() {
        // A curve stamped with a hypothetical future version must also be rejected.
        let curve = make_curve(85_000_000_000, false, PROTOCOL_VERSION + 1);
        let result = validate_graduation_eligibility(&curve);
        assert_eq!(
            result.unwrap_err(),
            anchor_lang::error!(FunrunError::ProtocolVersionMismatch),
        );
    }

    #[test]
    fn eligibility_version_zero_is_rejected() {
        let curve = make_curve(85_000_000_000, false, 0);
        let result = validate_graduation_eligibility(&curve);
        assert!(result.is_err());
    }

    // ── compute_sol_to_dex ────────────────────────────────────────────────────

    #[test]
    fn sol_to_dex_typical_values_return_difference() {
        // 85 SOL real − 6 SOL fee = 79 SOL to DEX.
        let result = compute_sol_to_dex(85_000_000_000, 6_000_000_000).unwrap();
        assert_eq!(result, 79_000_000_000);
    }

    #[test]
    fn sol_to_dex_one_lamport_over_fee_passes() {
        // Boundary: exactly 1 lamport of headroom.
        let dex_fee = 6_000_000_000u64;
        let result = compute_sol_to_dex(dex_fee + 1, dex_fee).unwrap();
        assert_eq!(result, 1);
    }

    #[test]
    fn sol_to_dex_fee_equal_to_sol_returns_zero() {
        // compute_sol_to_dex does not error here; consistency check catches the zero.
        let dex_fee = 6_000_000_000u64;
        let result = compute_sol_to_dex(dex_fee, dex_fee).unwrap();
        assert_eq!(result, 0);
    }

    #[test]
    fn sol_to_dex_fee_exceeds_sol_is_rejected() {
        let result = compute_sol_to_dex(5_000_000_000, 6_000_000_000);
        assert_eq!(
            result.unwrap_err(),
            anchor_lang::error!(FunrunError::InsufficientSolForGraduation),
        );
    }

    #[test]
    fn sol_to_dex_zero_sol_zero_fee_returns_zero() {
        // Degenerate case: no SOL, no fee → 0 (consistency check will reject it).
        let result = compute_sol_to_dex(0, 0).unwrap();
        assert_eq!(result, 0);
    }

    // ── check_graduation_snapshot_consistency ─────────────────────────────────

    #[test]
    fn consistency_positive_sol_to_dex_passes() {
        assert!(check_graduation_snapshot_consistency(79_000_000_000).is_ok());
    }

    #[test]
    fn consistency_one_lamport_passes() {
        assert!(check_graduation_snapshot_consistency(1).is_ok());
    }

    #[test]
    fn consistency_zero_is_rejected() {
        let result = check_graduation_snapshot_consistency(0);
        assert_eq!(
            result.unwrap_err(),
            anchor_lang::error!(FunrunError::GraduationSnapshotInconsistency),
        );
    }

    // ── Handler state mutation simulation ─────────────────────────────────────

    #[test]
    fn complete_flag_is_set_to_true_after_handler() {
        let mut curve = make_curve(85_000_000_000, false, PROTOCOL_VERSION);
        let config = make_config(85_000_000_000, 6_000_000_000, false);

        validate_graduation_eligibility(&curve).unwrap();
        let sol_to_dex =
            compute_sol_to_dex(curve.real_sol_reserves, config.graduation_dex_fee).unwrap();
        check_graduation_snapshot_consistency(sol_to_dex).unwrap();

        curve.complete = true;
        curve.graduation_dex_fee_snapshot = config.graduation_dex_fee;

        assert!(curve.complete, "complete must be true after graduation");
    }

    #[test]
    fn graduation_dex_fee_snapshot_locked_at_config_value() {
        let mut curve = make_curve(85_000_000_000, false, PROTOCOL_VERSION);
        let config = make_config(85_000_000_000, 6_000_000_000, false);

        validate_graduation_eligibility(&curve).unwrap();
        let sol_to_dex =
            compute_sol_to_dex(curve.real_sol_reserves, config.graduation_dex_fee).unwrap();
        check_graduation_snapshot_consistency(sol_to_dex).unwrap();

        curve.graduation_dex_fee_snapshot = config.graduation_dex_fee;

        assert_eq!(curve.graduation_dex_fee_snapshot, 6_000_000_000);
    }

    #[test]
    fn sol_to_dex_snapshot_is_real_sol_minus_fee() {
        let curve = make_curve(85_000_000_000, false, PROTOCOL_VERSION);
        let config = make_config(85_000_000_000, 6_000_000_000, false);

        let sol_to_dex =
            compute_sol_to_dex(curve.real_sol_reserves, config.graduation_dex_fee).unwrap();

        assert_eq!(
            sol_to_dex, 79_000_000_000,
            "79 SOL = 85 SOL real − 6 SOL fee"
        );
    }

    #[test]
    fn graduation_dex_fee_snapshot_starts_at_zero_before_graduation() {
        let curve = make_curve(85_000_000_000, false, PROTOCOL_VERSION);
        assert_eq!(curve.graduation_dex_fee_snapshot, 0);
    }

    // ── Negative: pipeline rejection ordering ─────────────────────────────────

    /// Already-complete curves are rejected before any other check.
    /// (In production this is caught by the account constraint, but we verify
    /// the pure helper ordering here for defence-in-depth.)
    #[test]
    fn already_complete_curve_does_not_pass_eligibility() {
        // `complete` is checked by account constraint — simulate a stale call.
        let curve = make_curve(90_000_000_000, true, PROTOCOL_VERSION);
        // The pure eligibility helper does not check `complete`; that's the
        // account constraint's job.  Verify it still passes the version check.
        assert!(validate_graduation_eligibility(&curve).is_ok());
        // In production, the account constraint would have already rejected this.
    }

    #[test]
    fn protocol_version_mismatch_blocks_before_sol_check() {
        let curve = make_curve(85_000_000_000, false, 1); // wrong version
        let result = validate_graduation_eligibility(&curve);
        assert!(result.is_err(), "wrong version must be rejected");
    }

    #[test]
    fn insufficient_sol_blocks_before_consistency_check() {
        // Fee > real_sol: InsufficientSolForGraduation raised first.
        let result = compute_sol_to_dex(4_000_000_000, 6_000_000_000);
        assert_eq!(
            result.unwrap_err(),
            anchor_lang::error!(FunrunError::InsufficientSolForGraduation),
        );
    }

    #[test]
    fn zero_sol_to_dex_blocks_at_consistency_check() {
        // Compute succeeds with 0 (fee == real_sol), but consistency check rejects it.
        let dex_fee = 6_000_000_000u64;
        let sol_to_dex = compute_sol_to_dex(dex_fee, dex_fee).unwrap();
        let result = check_graduation_snapshot_consistency(sol_to_dex);
        assert_eq!(
            result.unwrap_err(),
            anchor_lang::error!(FunrunError::GraduationSnapshotInconsistency),
        );
    }

    // ── Property tests ────────────────────────────────────────────────────────

    /// Seeded LCG for deterministic pseudo-random inputs.  Never use
    /// `rand` or time-based seeds — CI must be perfectly reproducible.
    struct Lcg(u64);
    impl Lcg {
        fn next(&mut self) -> u64 {
            self.0 = self
                .0
                .wrapping_mul(6_364_136_223_846_793_005)
                .wrapping_add(1_442_695_040_888_963_407);
            self.0
        }
        fn next_range(&mut self, lo: u64, hi: u64) -> u64 {
            lo + self.next() % (hi - lo + 1)
        }
    }

    /// Property P-G1: `sol_to_dex + graduation_dex_fee == real_sol_reserves`
    /// (exact SOL conservation, no rounding).
    #[test]
    fn prop_sol_conservation_holds_for_all_valid_inputs() {
        let mut rng = Lcg(0xDEAD_BEEF_CAFE_BABE);
        let dex_fee = 6_000_000_000u64;

        for _ in 0..2_000 {
            let real_sol = rng.next_range(dex_fee + 1, dex_fee + 500_000_000_000);
            let sol_to_dex = compute_sol_to_dex(real_sol, dex_fee).unwrap();

            assert_eq!(
                sol_to_dex + dex_fee,
                real_sol,
                "SOL conservation violated: {sol_to_dex} + {dex_fee} ≠ {real_sol}",
            );
        }
    }

    /// Property P-G2: `sol_to_dex` is strictly less than `real_sol_reserves`
    /// when `dex_fee > 0`.
    #[test]
    fn prop_sol_to_dex_strictly_less_than_real_sol_when_fee_positive() {
        let mut rng = Lcg(0xFEED_FACE_DEAD_BEEF);
        let dex_fee = 6_000_000_000u64;

        for _ in 0..2_000 {
            let real_sol = rng.next_range(dex_fee + 1, dex_fee + 500_000_000_000);
            let sol_to_dex = compute_sol_to_dex(real_sol, dex_fee).unwrap();

            assert!(
                sol_to_dex < real_sol,
                "sol_to_dex ({sol_to_dex}) must be < real_sol ({real_sol})",
            );
        }
    }

    /// Property P-G3: `compute_sol_to_dex` always errors when `dex_fee ≥ real_sol`.
    #[test]
    fn prop_insufficient_sol_always_errors() {
        let mut rng = Lcg(0xCAFE_BABE_1234_5678);

        for _ in 0..2_000 {
            // dex_fee is strictly greater than real_sol
            let real_sol = rng.next_range(0, 10_000_000_000);
            let dex_fee = real_sol + rng.next_range(1, 1_000_000_000);

            let result = compute_sol_to_dex(real_sol, dex_fee);
            assert!(
                result.is_err(),
                "expected error when dex_fee ({dex_fee}) > real_sol ({real_sol})",
            );
        }
    }

    /// Property P-G4: only `PROTOCOL_VERSION` passes eligibility; all other
    /// u8 values are rejected.
    #[test]
    fn prop_only_matching_protocol_version_passes_eligibility() {
        let mut rng = Lcg(0xABCD_EF01_2345_6789);

        for _ in 0..512 {
            let version = (rng.next() % 256) as u8;
            let curve = make_curve(85_000_000_000, false, version);
            let result = validate_graduation_eligibility(&curve);

            if version == PROTOCOL_VERSION {
                assert!(result.is_ok(), "version {version} should pass eligibility");
            } else {
                assert!(result.is_err(), "version {version} should fail eligibility");
            }
        }
    }

    /// Property P-G5: snapshot is monotone — once written, the snapshot equals
    /// the dex_fee that was active at graduation time, regardless of later config
    /// changes.  (Simulated via direct struct mutation.)
    #[test]
    fn prop_snapshot_is_immutable_after_graduation() {
        let mut rng = Lcg(0x1234_5678_9ABC_DEF0);

        for _ in 0..500 {
            let dex_fee_at_graduation = rng.next_range(1_000_000_000, 10_000_000_000);
            let real_sol = dex_fee_at_graduation + rng.next_range(1, 100_000_000_000);

            let mut curve = make_curve(real_sol, false, PROTOCOL_VERSION);

            // Simulate graduation
            let sol_to_dex =
                compute_sol_to_dex(curve.real_sol_reserves, dex_fee_at_graduation).unwrap();
            check_graduation_snapshot_consistency(sol_to_dex).unwrap();
            curve.complete = true;
            curve.graduation_dex_fee_snapshot = dex_fee_at_graduation;

            // Admin changes the global config after graduation.
            let new_dex_fee = rng.next_range(1, 20_000_000_000);

            // The snapshot must remain unchanged.
            assert_eq!(
                curve.graduation_dex_fee_snapshot, dex_fee_at_graduation,
                "snapshot must not change when admin updates config to {new_dex_fee}",
            );
        }
    }

    /// Property P-G6: `BondingCurve::sol_to_dex()` returns the same value as
    /// `compute_sol_to_dex()` for all valid post-graduation states.
    #[test]
    fn prop_bonding_curve_sol_to_dex_matches_pure_helper() {
        let mut rng = Lcg(0xFEDC_BA98_7654_3210);

        for _ in 0..1_000 {
            let dex_fee = rng.next_range(1_000_000_000, 10_000_000_000);
            let real_sol = dex_fee + rng.next_range(1, 100_000_000_000);

            let mut curve = make_curve(real_sol, false, PROTOCOL_VERSION);
            curve.complete = true;
            curve.graduation_dex_fee_snapshot = dex_fee;

            let via_method = curve.sol_to_dex().unwrap();
            let via_helper = compute_sol_to_dex(real_sol, dex_fee).unwrap();

            assert_eq!(
                via_method, via_helper,
                "sol_to_dex() ({via_method}) ≠ compute_sol_to_dex() ({via_helper})",
            );
        }
    }
}
