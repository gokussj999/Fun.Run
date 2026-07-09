use crate::consts::GLOBAL_CONFIG_SEED;
use crate::errors::FunrunError;
use crate::events::GlobalConfigUpdated;
use crate::state::GlobalConfig;
use anchor_lang::prelude::*;

// ─────────────────────────────────────────────────────────────────────────────
// Shared accounts struct
// ─────────────────────────────────────────────────────────────────────────────

/// Accounts required by both `pause_protocol` and `unpause_protocol`.
///
/// Both instructions require only the admin signer and the mutable
/// `GlobalConfig` PDA; the same context struct serves both.
#[derive(Accounts)]
pub struct SetPaused<'info> {
    /// Must equal `GlobalConfig.admin`; enforced by `has_one`.
    pub admin: Signer<'info>,

    /// Protocol configuration PDA whose `paused` flag is toggled.
    #[account(
        mut,
        seeds = [GLOBAL_CONFIG_SEED],
        bump = global_config.bump,
        has_one = admin @ FunrunError::UnauthorizedAdmin,
    )]
    pub global_config: Account<'info, GlobalConfig>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure helper (also used by tests)
// ─────────────────────────────────────────────────────────────────────────────

/// Applies a new `paused` value to a `GlobalConfig` reference and returns
/// the string label for the emitted event.
///
/// Extracted so callers can confirm state without needing the Solana runtime.
pub fn apply_pause_state(cfg: &mut GlobalConfig, paused: bool) -> &'static str {
    cfg.paused = paused;
    if paused {
        "paused:true"
    } else {
        "paused:false"
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────────────────────────────────────

/// Pauses the protocol globally.
///
/// While paused, all user-facing instructions (`buy`, `sell`, `create_coin`,
/// fee claims) return [`FunrunError::ProgramPaused`].  Admin instructions
/// (`update_global_config`, `sweep_treasury`, `unpause_protocol`) continue
/// to work.
///
/// The instruction is idempotent: calling it on an already-paused program
/// succeeds without error.
pub(crate) fn pause_handler(ctx: Context<SetPaused>) -> Result<()> {
    let label = apply_pause_state(&mut ctx.accounts.global_config, true);

    msg!("Protocol paused by admin={}", ctx.accounts.admin.key());

    emit!(GlobalConfigUpdated {
        admin: ctx.accounts.admin.key(),
        field_changed: label.to_string(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

/// Unpauses the protocol, resuming all user-facing instructions.
///
/// The instruction is idempotent: calling it on an already-unpaused program
/// succeeds without error.
pub(crate) fn unpause_handler(ctx: Context<SetPaused>) -> Result<()> {
    let label = apply_pause_state(&mut ctx.accounts.global_config, false);

    msg!("Protocol unpaused by admin={}", ctx.accounts.admin.key());

    emit!(GlobalConfigUpdated {
        admin: ctx.accounts.admin.key(),
        field_changed: label.to_string(),
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
    use crate::consts::*;

    /// Builds a minimal `GlobalConfig` instance for testing the pause logic
    /// without needing the Solana runtime.
    fn mock_global_config(paused: bool) -> GlobalConfig {
        GlobalConfig {
            admin: Pubkey::new_unique(),
            fee_recipient: Pubkey::new_unique(),
            creation_fee_lamports: DEFAULT_CREATION_FEE_LAMPORTS,
            total_trading_fee_bps: DEFAULT_TOTAL_FEE_BPS,
            graduation_threshold: GRADUATION_THRESHOLD_LAMPORTS,
            graduation_dex_fee: GRADUATION_DEX_FEE_LAMPORTS,
            paused,
            bump: 255,
            total_sol_collected: 0,
            total_sol_disbursed: 0,
            _padding: [0u8; 128],
        }
    }

    // ── Pause state transitions ───────────────────────────────────────────────

    #[test]
    fn pause_sets_paused_true() {
        let mut cfg = mock_global_config(false);
        apply_pause_state(&mut cfg, true);
        assert!(cfg.paused, "paused must be true after pause");
    }

    #[test]
    fn unpause_sets_paused_false() {
        let mut cfg = mock_global_config(true);
        apply_pause_state(&mut cfg, false);
        assert!(!cfg.paused, "paused must be false after unpause");
    }

    #[test]
    fn pause_is_idempotent() {
        let mut cfg = mock_global_config(true);
        apply_pause_state(&mut cfg, true);
        assert!(
            cfg.paused,
            "calling pause on already-paused protocol must succeed (idempotent)",
        );
    }

    #[test]
    fn unpause_is_idempotent() {
        let mut cfg = mock_global_config(false);
        apply_pause_state(&mut cfg, false);
        assert!(
            !cfg.paused,
            "calling unpause on an already-unpaused protocol must succeed (idempotent)",
        );
    }

    #[test]
    fn pause_unpause_round_trip() {
        let mut cfg = mock_global_config(false);
        apply_pause_state(&mut cfg, true);
        assert!(cfg.paused);
        apply_pause_state(&mut cfg, false);
        assert!(!cfg.paused);
    }

    #[test]
    fn unpause_pause_round_trip() {
        let mut cfg = mock_global_config(true);
        apply_pause_state(&mut cfg, false);
        assert!(!cfg.paused);
        apply_pause_state(&mut cfg, true);
        assert!(cfg.paused);
    }

    // ── apply_pause_state returns correct event label ─────────────────────────

    #[test]
    fn pause_returns_correct_label() {
        let mut cfg = mock_global_config(false);
        let label = apply_pause_state(&mut cfg, true);
        assert_eq!(label, "paused:true");
    }

    #[test]
    fn unpause_returns_correct_label() {
        let mut cfg = mock_global_config(true);
        let label = apply_pause_state(&mut cfg, false);
        assert_eq!(label, "paused:false");
    }

    // ── Pause does not clobber other fields ───────────────────────────────────

    #[test]
    fn pause_does_not_modify_fee_fields() {
        let mut cfg = mock_global_config(false);
        let original_fee = cfg.creation_fee_lamports;
        let original_bps = cfg.total_trading_fee_bps;
        let original_threshold = cfg.graduation_threshold;
        let original_dex_fee = cfg.graduation_dex_fee;

        apply_pause_state(&mut cfg, true);

        assert_eq!(cfg.creation_fee_lamports, original_fee);
        assert_eq!(cfg.total_trading_fee_bps, original_bps);
        assert_eq!(cfg.graduation_threshold, original_threshold);
        assert_eq!(cfg.graduation_dex_fee, original_dex_fee);
    }

    // ── Paused-state guard logic (simulates what P2+ instructions must do) ────

    /// Demonstrates the guard pattern that all user-facing instructions will
    /// use.  The guard is in the instruction handler, not in `SetPaused`
    /// itself, because admin instructions bypass it intentionally.
    #[test]
    fn paused_state_guard_blocks_user_instructions() {
        let cfg = mock_global_config(true);
        let should_block = cfg.paused;
        assert!(
            should_block,
            "a user instruction MUST check cfg.paused before proceeding",
        );
    }

    #[test]
    fn unpaused_state_allows_user_instructions() {
        let cfg = mock_global_config(false);
        let should_block = cfg.paused;
        assert!(
            !should_block,
            "user instructions must not be blocked when cfg.paused=false",
        );
    }
}
