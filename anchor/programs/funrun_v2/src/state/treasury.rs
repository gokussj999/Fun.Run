use crate::consts::TREASURY_SIZE;
use anchor_lang::prelude::*;

/// Protocol fee sink — a singleton PDA that accumulates lamports from:
///   - Coin creation fees (100% of creation_fee_lamports per coin)
///   - Trading fees treasury share (40% with referrer, 60% without)
///   - Graduation fees (6 SOL flat per graduation)
///
/// Seeds: [b"treasury"]
/// No private key; only the program may add lamports.
/// Only the admin may drain it via sweep_treasury → fee_recipient.
#[account]
pub struct Treasury {
    /// Cumulative SOL received from all protocol fee sources (lamports).
    pub total_sol_collected: u64,

    /// Cumulative SOL swept to fee_recipient via sweep_treasury (lamports).
    pub total_sol_disbursed: u64,

    /// PDA bump for this account.
    pub bump: u8,

    /// Reserved space for future fields.
    pub _padding: [u8; 64],
}

impl Treasury {
    pub const INIT_SPACE: usize = TREASURY_SIZE;
}
