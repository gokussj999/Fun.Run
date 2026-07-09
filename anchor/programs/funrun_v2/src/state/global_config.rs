use crate::consts::GLOBAL_CONFIG_SIZE;
use anchor_lang::prelude::*;

/// Singleton PDA that governs all protocol-wide parameters.
/// Seeds: [b"global_config"]
/// One per deployed program; created by `initialize`, updated by `update_global_config`.
#[account]
pub struct GlobalConfig {
    /// The admin authority — a Squads multisig PDA in production.
    /// Only this key may call admin instructions.
    pub admin: Pubkey,

    /// External recipient for treasury sweeps (separate from the admin key).
    /// Stored here so a compromised admin key cannot redirect funds without
    /// also controlling this field via update_global_config.
    pub fee_recipient: Pubkey,

    /// Flat SOL fee charged per coin creation; 100% flows to Treasury.
    /// Default: DEFAULT_CREATION_FEE_LAMPORTS. Ceiling: MAX_CREATION_FEE_LAMPORTS.
    pub creation_fee_lamports: u64,

    /// Total trading fee in basis points applied to every buy/sell gross SOL amount.
    /// The split (40/40/20) is hard-coded; only the total rate is configurable.
    /// Default: DEFAULT_TOTAL_FEE_BPS. Ceiling: MAX_TOTAL_FEE_BPS.
    pub total_trading_fee_bps: u16,

    /// real_sol_reserves threshold that triggers graduation (lamports).
    /// Default: GRADUATION_THRESHOLD_LAMPORTS (85 SOL).
    pub graduation_threshold: u64,

    /// Flat SOL fee deducted from the curve at graduation to cover Raydium pool
    /// creation costs; remainder goes to the DEX pool.
    /// Default: GRADUATION_DEX_FEE_LAMPORTS (6 SOL).
    pub graduation_dex_fee: u64,

    /// When true, all user-facing instructions (buy, sell, create_coin, claims) fail
    /// with ProgramPaused. Admin instructions are not affected.
    pub paused: bool,

    /// PDA bump for this account.
    pub bump: u8,

    /// Running total of lamports credited to Treasury across all sources.
    /// Updated on every fee payment and creation fee collection.
    pub total_sol_collected: u64,

    /// Running total of lamports swept out of Treasury via sweep_treasury.
    pub total_sol_disbursed: u64,

    /// Reserved space for future fields without account migration.
    pub _padding: [u8; 128],
}

impl GlobalConfig {
    pub const INIT_SPACE: usize = GLOBAL_CONFIG_SIZE;
}
