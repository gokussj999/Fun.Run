use crate::consts::*;
use crate::errors::FunrunError;
use crate::events::GlobalConfigUpdated;
use crate::state::GlobalConfig;
use anchor_lang::prelude::*;

// ─────────────────────────────────────────────────────────────────────────────
// Accounts
// ─────────────────────────────────────────────────────────────────────────────

/// Accounts required by the `update_global_config` instruction.
#[derive(Accounts)]
pub struct UpdateGlobalConfig<'info> {
    /// Must match `GlobalConfig.admin`; validated by `has_one`.
    pub admin: Signer<'info>,

    /// Protocol configuration PDA being updated.
    #[account(
        mut,
        seeds = [GLOBAL_CONFIG_SEED],
        bump = global_config.bump,
        has_one = admin @ FunrunError::UnauthorizedAdmin,
    )]
    pub global_config: Account<'info, GlobalConfig>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure validation helper (also called from unit tests)
// ─────────────────────────────────────────────────────────────────────────────

/// Validates the parameters of `update_global_config` without mutating any
/// account state.  Separated so the logic can be unit-tested independently
/// of the Anchor runtime.
///
/// # Errors
/// - [`FunrunError::InvalidFeeConfiguration`] — if any value exceeds its
///   hard-coded ceiling or violates an invariant.
pub fn validate_config_update(
    new_creation_fee: Option<u64>,
    new_trading_fee_bps: Option<u16>,
    new_graduation_threshold: Option<u64>,
    new_graduation_dex_fee: Option<u64>,
    new_fee_recipient: Option<Pubkey>,
) -> Result<()> {
    if let Some(fee) = new_creation_fee {
        require!(
            fee <= MAX_CREATION_FEE_LAMPORTS,
            FunrunError::InvalidFeeConfiguration,
        );
    }

    if let Some(bps) = new_trading_fee_bps {
        require!(
            bps <= MAX_TOTAL_FEE_BPS,
            FunrunError::InvalidFeeConfiguration,
        );
    }

    if let Some(threshold) = new_graduation_threshold {
        // Threshold of zero would mark every curve as graduated on creation.
        require!(threshold > 0, FunrunError::InvalidFeeConfiguration);
    }

    if let Some(dex_fee) = new_graduation_dex_fee {
        // DEX fee must be strictly less than graduation threshold so that
        // at least some SOL flows into the DEX pool.
        if let Some(threshold) = new_graduation_threshold {
            require!(dex_fee < threshold, FunrunError::InvalidFeeConfiguration,);
        }
    }

    // fee_recipient = PublicKey::default() (all-zeros) is technically valid on
    // chain but would brick the sweep path.  Guard it.
    if let Some(recipient) = new_fee_recipient {
        require!(
            recipient != Pubkey::default(),
            FunrunError::InvalidFeeConfiguration,
        );
    }

    Ok(())
}

/// Enforces the invariant `graduation_dex_fee < graduation_threshold` using
/// the *effective* values — the incoming value when provided, the existing
/// on-chain value otherwise.
///
/// `validate_config_update` only catches the violation when both fields are
/// updated together; the handler uses this helper to cover single-field updates
/// by passing `unwrap_or(current_on_chain_value)` for the unchanged parameter.
///
/// # Errors
/// - [`FunrunError::InvalidFeeConfiguration`] — if `effective_dex_fee >= effective_threshold`.
pub fn validate_dex_threshold_invariant(
    effective_dex_fee: u64,
    effective_threshold: u64,
) -> Result<()> {
    require!(
        effective_dex_fee < effective_threshold,
        FunrunError::InvalidFeeConfiguration,
    );
    Ok(())
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

/// Updates one or more protocol-wide configuration parameters.
///
/// Every parameter is optional (`None` means "leave unchanged").  Only
/// `admin` may call this instruction; the Anchor `has_one` constraint
/// enforces that automatically.
///
/// # Parameters
/// - `new_creation_fee` — flat SOL charged per coin creation (lamports).
///   Ceiling: [`MAX_CREATION_FEE_LAMPORTS`].
/// - `new_trading_fee_bps` — total trading fee in basis points.
///   Ceiling: [`MAX_TOTAL_FEE_BPS`].
/// - `new_graduation_threshold` — real-SOL target that triggers DEX migration
///   (lamports).  Must be > 0.
/// - `new_graduation_dex_fee` — flat fee retained for DEX pool creation at
///   graduation (lamports).  Must be < threshold when both are provided.
/// - `new_fee_recipient` — destination for `sweep_treasury` payouts.
///   Cannot be `Pubkey::default()`.
pub(crate) fn handler(
    ctx: Context<UpdateGlobalConfig>,
    new_creation_fee: Option<u64>,
    new_trading_fee_bps: Option<u16>,
    new_graduation_threshold: Option<u64>,
    new_graduation_dex_fee: Option<u64>,
    new_fee_recipient: Option<Pubkey>,
) -> Result<()> {
    validate_config_update(
        new_creation_fee,
        new_trading_fee_bps,
        new_graduation_threshold,
        new_graduation_dex_fee,
        new_fee_recipient,
    )?;

    // Cross-validate graduation_dex_fee < graduation_threshold with effective values.
    // validate_config_update only catches this when both params are provided together;
    // here we cover the single-field-update case by falling back to existing on-chain values.
    validate_dex_threshold_invariant(
        new_graduation_dex_fee.unwrap_or(ctx.accounts.global_config.graduation_dex_fee),
        new_graduation_threshold.unwrap_or(ctx.accounts.global_config.graduation_threshold),
    )?;

    let cfg = &mut ctx.accounts.global_config;
    let mut fields_changed: Vec<&str> = Vec::new();

    if let Some(fee) = new_creation_fee {
        cfg.creation_fee_lamports = fee;
        fields_changed.push("creation_fee_lamports");
    }
    if let Some(bps) = new_trading_fee_bps {
        cfg.total_trading_fee_bps = bps;
        fields_changed.push("total_trading_fee_bps");
    }
    if let Some(threshold) = new_graduation_threshold {
        cfg.graduation_threshold = threshold;
        fields_changed.push("graduation_threshold");
    }
    if let Some(dex_fee) = new_graduation_dex_fee {
        cfg.graduation_dex_fee = dex_fee;
        fields_changed.push("graduation_dex_fee");
    }
    if let Some(recipient) = new_fee_recipient {
        cfg.fee_recipient = recipient;
        fields_changed.push("fee_recipient");
    }

    let field_label = if fields_changed.is_empty() {
        "no_op".to_string()
    } else {
        fields_changed.join(",")
    };

    msg!("update_global_config: fields_changed={}", field_label);

    emit!(GlobalConfigUpdated {
        admin: ctx.accounts.admin.key(),
        field_changed: field_label,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    // ── Creation fee validation ───────────────────────────────────────────────

    #[test]
    fn creation_fee_at_ceiling_is_valid() {
        assert!(
            validate_config_update(Some(MAX_CREATION_FEE_LAMPORTS), None, None, None, None).is_ok(),
            "creation_fee == ceiling must be accepted",
        );
    }

    #[test]
    fn creation_fee_above_ceiling_is_rejected() {
        let result =
            validate_config_update(Some(MAX_CREATION_FEE_LAMPORTS + 1), None, None, None, None);
        assert!(
            result.is_err(),
            "creation_fee {} must be rejected",
            MAX_CREATION_FEE_LAMPORTS + 1,
        );
    }

    #[test]
    fn creation_fee_zero_is_valid() {
        assert!(
            validate_config_update(Some(0), None, None, None, None).is_ok(),
            "zero creation_fee is valid (free coin creation)",
        );
    }

    // ── Trading fee BPS validation ────────────────────────────────────────────

    #[test]
    fn trading_fee_at_ceiling_is_valid() {
        assert!(
            validate_config_update(None, Some(MAX_TOTAL_FEE_BPS), None, None, None).is_ok(),
            "trading_fee_bps == ceiling must be accepted",
        );
    }

    #[test]
    fn trading_fee_above_ceiling_is_rejected() {
        let result = validate_config_update(None, Some(MAX_TOTAL_FEE_BPS + 1), None, None, None);
        assert!(
            result.is_err(),
            "trading_fee_bps {} must be rejected",
            MAX_TOTAL_FEE_BPS + 1,
        );
    }

    #[test]
    fn trading_fee_zero_bps_is_valid() {
        assert!(
            validate_config_update(None, Some(0), None, None, None).is_ok(),
            "zero trading_fee_bps is valid (fee-free trading)",
        );
    }

    // ── Graduation threshold validation ───────────────────────────────────────

    #[test]
    fn graduation_threshold_nonzero_is_valid() {
        assert!(
            validate_config_update(None, None, Some(1), None, None).is_ok(),
            "graduation_threshold of 1 must be accepted",
        );
    }

    #[test]
    fn graduation_threshold_zero_is_rejected() {
        let result = validate_config_update(None, None, Some(0), None, None);
        assert!(result.is_err(), "graduation_threshold=0 must be rejected");
    }

    #[test]
    fn graduation_threshold_large_is_valid() {
        assert!(
            validate_config_update(None, None, Some(u64::MAX), None, None).is_ok(),
            "u64::MAX graduation threshold must be accepted",
        );
    }

    // ── DEX fee vs threshold co-validation ───────────────────────────────────

    #[test]
    fn dex_fee_less_than_threshold_is_valid() {
        assert!(
            validate_config_update(None, None, Some(100), Some(99), None).is_ok(),
            "dex_fee=99 < threshold=100 must be accepted",
        );
    }

    #[test]
    fn dex_fee_equal_to_threshold_is_rejected() {
        let result = validate_config_update(None, None, Some(100), Some(100), None);
        assert!(
            result.is_err(),
            "dex_fee == threshold must be rejected (no SOL left for DEX pool)",
        );
    }

    #[test]
    fn dex_fee_greater_than_threshold_is_rejected() {
        let result = validate_config_update(None, None, Some(100), Some(101), None);
        assert!(result.is_err(), "dex_fee > threshold must be rejected",);
    }

    /// When only `new_graduation_dex_fee` is provided (no threshold update),
    /// `validate_config_update` (the pure function) skips the cross-check because
    /// it has no access to on-chain state.  The handler closes this gap by calling
    /// `validate_dex_threshold_invariant` with the effective (unwrap_or) values.
    #[test]
    fn dex_fee_alone_skips_cross_validation_in_pure_fn() {
        assert!(
            validate_config_update(None, None, None, Some(u64::MAX), None).is_ok(),
            "pure validate_config_update must pass when only dex_fee is provided",
        );
    }

    // ── validate_dex_threshold_invariant (handler-level cross-validation) ────

    #[test]
    fn dex_threshold_invariant_fee_less_than_threshold_is_valid() {
        assert!(validate_dex_threshold_invariant(6_000_000_000, 85_000_000_000).is_ok());
    }

    #[test]
    fn dex_threshold_invariant_fee_equal_to_threshold_is_rejected() {
        assert!(validate_dex_threshold_invariant(85_000_000_000, 85_000_000_000).is_err());
    }

    #[test]
    fn dex_threshold_invariant_fee_greater_than_threshold_is_rejected() {
        assert!(validate_dex_threshold_invariant(86_000_000_000, 85_000_000_000).is_err());
    }

    /// Regression: only dex_fee updated → new value exceeds existing threshold → rejected.
    /// Simulates: existing threshold = 85 SOL, new dex_fee = 90 SOL.
    #[test]
    fn only_dex_fee_update_above_existing_threshold_is_rejected() {
        let existing_threshold = 85_000_000_000u64;
        let new_dex_fee = 90_000_000_000u64;
        assert!(
            validate_dex_threshold_invariant(new_dex_fee, existing_threshold).is_err(),
            "new dex_fee > existing threshold must be rejected",
        );
    }

    /// Regression: only threshold updated → new value falls below existing dex_fee → rejected.
    /// Simulates: existing dex_fee = 6 SOL, new threshold = 5 SOL.
    #[test]
    fn only_threshold_update_below_existing_dex_fee_is_rejected() {
        let existing_dex_fee = 6_000_000_000u64;
        let new_threshold = 5_000_000_000u64;
        assert!(
            validate_dex_threshold_invariant(existing_dex_fee, new_threshold).is_err(),
            "new threshold < existing dex_fee must be rejected",
        );
    }

    /// Regression: only dex_fee updated to a valid value below existing threshold → accepted.
    #[test]
    fn only_dex_fee_update_below_existing_threshold_is_valid() {
        let existing_threshold = 85_000_000_000u64;
        let new_dex_fee = 7_000_000_000u64;
        assert!(validate_dex_threshold_invariant(new_dex_fee, existing_threshold).is_ok());
    }

    /// Regression: only threshold updated to a valid value above existing dex_fee → accepted.
    #[test]
    fn only_threshold_update_above_existing_dex_fee_is_valid() {
        let existing_dex_fee = 6_000_000_000u64;
        let new_threshold = 100_000_000_000u64;
        assert!(validate_dex_threshold_invariant(existing_dex_fee, new_threshold).is_ok());
    }

    // ── fee_recipient validation ──────────────────────────────────────────────

    #[test]
    fn default_pubkey_fee_recipient_is_rejected() {
        let result = validate_config_update(None, None, None, None, Some(Pubkey::default()));
        assert!(
            result.is_err(),
            "Pubkey::default() as fee_recipient must be rejected",
        );
    }

    #[test]
    fn valid_pubkey_fee_recipient_is_accepted() {
        let key = Pubkey::new_unique();
        assert!(
            validate_config_update(None, None, None, None, Some(key)).is_ok(),
            "a real public key as fee_recipient must be accepted",
        );
    }

    // ── None-only call (no-op) ────────────────────────────────────────────────

    #[test]
    fn all_none_params_is_valid() {
        assert!(
            validate_config_update(None, None, None, None, None).is_ok(),
            "all-None update must pass validation (no-op is allowed)",
        );
    }

    // ── Multi-field simultaneous update ──────────────────────────────────────

    #[test]
    fn simultaneous_valid_updates_pass() {
        assert!(
            validate_config_update(
                Some(50_000_000),           // 0.05 SOL creation fee
                Some(100),                  // 1% trading fee
                Some(100_000_000_000),      // 100 SOL graduation
                Some(5_000_000_000),        // 5 SOL DEX fee
                Some(Pubkey::new_unique()), // valid recipient
            )
            .is_ok(),
            "all valid simultaneous updates must pass",
        );
    }

    #[test]
    fn simultaneous_update_with_one_invalid_field_fails() {
        let result = validate_config_update(
            Some(50_000_000),            // valid
            Some(MAX_TOTAL_FEE_BPS + 1), // INVALID
            Some(100_000_000_000),       // valid
            None,
            None,
        );
        assert!(
            result.is_err(),
            "one invalid field must cause the whole update to fail",
        );
    }
}
