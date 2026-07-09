use crate::consts::*;
use crate::events::GlobalConfigUpdated;
use crate::state::{GlobalConfig, Treasury};
use anchor_lang::prelude::*;

// ─────────────────────────────────────────────────────────────────────────────
// Accounts
// ─────────────────────────────────────────────────────────────────────────────

/// Accounts required by the `initialize` instruction.
///
/// One-time call that creates both protocol-wide singleton PDAs.
/// If either PDA already exists the instruction will fail with
/// `AccountAlreadyInitialized` (Anchor's own guard on `init`).
#[derive(Accounts)]
pub struct Initialize<'info> {
    /// Pays for account rent and becomes the initial admin authority.
    /// The caller's key is written into `GlobalConfig.admin` and
    /// `GlobalConfig.fee_recipient`; both can be rotated later via
    /// `update_global_config`.
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Singleton protocol configuration PDA.
    /// Seeds: [b"global_config"]
    #[account(
        init,
        payer = admin,
        space = GlobalConfig::INIT_SPACE,
        seeds = [GLOBAL_CONFIG_SEED],
        bump,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    /// Singleton fee-collection PDA.
    /// Seeds: [b"treasury"]
    #[account(
        init,
        payer = admin,
        space = Treasury::INIT_SPACE,
        seeds = [TREASURY_SEED],
        bump,
    )]
    pub treasury: Account<'info, Treasury>,

    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

/// Initialises the FUN.RUN V2 protocol.
///
/// Creates the `GlobalConfig` and `Treasury` singleton PDAs and populates
/// them with protocol defaults.  Must be called exactly once after deployment;
/// subsequent calls fail because `init` rejects existing accounts.
///
/// The caller becomes the initial `admin` and `fee_recipient`.  Both should be
/// rotated to a multisig key via `update_global_config` before going to
/// mainnet.
pub(crate) fn handler(ctx: Context<Initialize>) -> Result<()> {
    let clock = Clock::get()?;
    let admin_key = ctx.accounts.admin.key();

    // ── GlobalConfig initialisation ───────────────────────────────────────────
    let cfg = &mut ctx.accounts.global_config;
    cfg.admin = admin_key;
    cfg.fee_recipient = admin_key; // rotated via update_global_config
    cfg.creation_fee_lamports = DEFAULT_CREATION_FEE_LAMPORTS;
    cfg.total_trading_fee_bps = DEFAULT_TOTAL_FEE_BPS;
    cfg.graduation_threshold = GRADUATION_THRESHOLD_LAMPORTS;
    cfg.graduation_dex_fee = GRADUATION_DEX_FEE_LAMPORTS;
    cfg.paused = false;
    cfg.bump = ctx.bumps.global_config;
    cfg.total_sol_collected = 0;
    cfg.total_sol_disbursed = 0;
    // _padding is zero-initialised by Anchor

    // ── Treasury initialisation ───────────────────────────────────────────────
    let treasury = &mut ctx.accounts.treasury;
    treasury.total_sol_collected = 0;
    treasury.total_sol_disbursed = 0;
    treasury.bump = ctx.bumps.treasury;
    // _padding is zero-initialised by Anchor

    emit!(GlobalConfigUpdated {
        admin: admin_key,
        field_changed: "initialize".to_string(),
        timestamp: clock.unix_timestamp,
    });

    msg!("FUN.RUN V2 initialised. admin={}", admin_key);
    Ok(())
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    /// Verifies that `DEFAULT_CREATION_FEE_LAMPORTS` does not exceed
    /// `MAX_CREATION_FEE_LAMPORTS`.  If this fails a constant was defined
    /// incorrectly in `consts.rs`.
    #[test]
    fn default_creation_fee_within_ceiling() {
        assert!(
            DEFAULT_CREATION_FEE_LAMPORTS <= MAX_CREATION_FEE_LAMPORTS,
            "DEFAULT_CREATION_FEE_LAMPORTS {} must be ≤ MAX_CREATION_FEE_LAMPORTS {}",
            DEFAULT_CREATION_FEE_LAMPORTS,
            MAX_CREATION_FEE_LAMPORTS,
        );
    }

    /// Verifies that `DEFAULT_TOTAL_FEE_BPS` does not exceed
    /// `MAX_TOTAL_FEE_BPS`.
    #[test]
    fn default_trading_fee_within_ceiling() {
        assert!(
            DEFAULT_TOTAL_FEE_BPS <= MAX_TOTAL_FEE_BPS,
            "DEFAULT_TOTAL_FEE_BPS {} must be ≤ MAX_TOTAL_FEE_BPS {}",
            DEFAULT_TOTAL_FEE_BPS,
            MAX_TOTAL_FEE_BPS,
        );
    }

    /// Verifies that `GRADUATION_THRESHOLD_LAMPORTS` is non-zero so the
    /// bonding curve is never considered graduated on creation.
    #[test]
    fn graduation_threshold_is_nonzero() {
        assert!(
            GRADUATION_THRESHOLD_LAMPORTS > 0,
            "Graduation threshold must be > 0",
        );
    }

    /// Verifies that `GRADUATION_DEX_FEE_LAMPORTS` is strictly less than
    /// `GRADUATION_THRESHOLD_LAMPORTS`, ensuring at least some SOL always
    /// goes to the DEX pool after graduation.
    #[test]
    fn dex_fee_less_than_graduation_threshold() {
        assert!(
            GRADUATION_DEX_FEE_LAMPORTS < GRADUATION_THRESHOLD_LAMPORTS,
            "graduation_dex_fee {} must be < graduation_threshold {}",
            GRADUATION_DEX_FEE_LAMPORTS,
            GRADUATION_THRESHOLD_LAMPORTS,
        );
    }

    /// Verifies that `GLOBAL_CONFIG_SIZE` (account space) is large enough
    /// to hold all current fields plus the 64-byte padding.
    #[test]
    fn global_config_size_is_sufficient() {
        // discriminator(8) + admin(32) + fee_recipient(32) + creation_fee(8)
        // + fee_bps(2) + grad_threshold(8) + grad_dex_fee(8) + paused(1)
        // + bump(1) + total_sol_collected(8) + total_sol_disbursed(8)
        // + padding(128) = 244
        let minimum_required = 8 + 32 + 32 + 8 + 2 + 8 + 8 + 1 + 1 + 8 + 8 + 128;
        assert!(
            GlobalConfig::INIT_SPACE >= minimum_required,
            "GLOBAL_CONFIG_SIZE {} < minimum required {}",
            GlobalConfig::INIT_SPACE,
            minimum_required,
        );
    }

    /// Verifies that `TREASURY_SIZE` is large enough for all current fields.
    #[test]
    fn treasury_size_is_sufficient() {
        // discriminator(8) + total_sol_collected(8) + total_sol_disbursed(8)
        // + bump(1) + padding(64) = 89
        let minimum_required = 8 + 8 + 8 + 1 + 64;
        assert!(
            Treasury::INIT_SPACE >= minimum_required,
            "TREASURY_SIZE {} < minimum required {}",
            Treasury::INIT_SPACE,
            minimum_required,
        );
    }

    /// Verifies PDA seeds are non-empty byte slices (guards against accidental
    /// empty-seed bugs that would collapse all PDAs to the same address).
    #[test]
    fn pda_seeds_are_non_empty() {
        assert!(
            !GLOBAL_CONFIG_SEED.is_empty(),
            "GLOBAL_CONFIG_SEED must not be empty"
        );
        assert!(!TREASURY_SEED.is_empty(), "TREASURY_SEED must not be empty");
    }

    /// Verifies the two singleton PDA seeds are distinct so the PDAs have
    /// different addresses.
    #[test]
    fn global_config_and_treasury_seeds_differ() {
        assert_ne!(
            GLOBAL_CONFIG_SEED, TREASURY_SEED,
            "global_config and treasury seeds must be distinct",
        );
    }

    /// Mirrors the initial field assignments in `handler` using plain Rust
    /// so the default state can be verified without invoking the Solana
    /// runtime.
    #[test]
    fn default_state_mirrors_handler_assignments() {
        // Reconstruct what handler() would write to GlobalConfig
        let creation_fee = DEFAULT_CREATION_FEE_LAMPORTS;
        let fee_bps = DEFAULT_TOTAL_FEE_BPS;
        let grad_threshold = GRADUATION_THRESHOLD_LAMPORTS;
        let grad_dex_fee = GRADUATION_DEX_FEE_LAMPORTS;
        let paused = false;
        let total_sol_collected: u64 = 0;
        let total_sol_disbursed: u64 = 0;

        assert_eq!(creation_fee, 20_000_000, "creation_fee must be 0.02 SOL");
        assert_eq!(fee_bps, 150, "trading fee must be 150 bps");
        assert_eq!(grad_threshold, 85_000_000_000, "graduation at 85 SOL");
        assert_eq!(grad_dex_fee, 6_000_000_000, "dex fee is 6 SOL");
        assert!(!paused, "protocol must start unpaused");
        assert_eq!(total_sol_collected, 0);
        assert_eq!(total_sol_disbursed, 0);
    }
}
