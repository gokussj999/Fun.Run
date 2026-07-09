use crate::consts::REFERRAL_ACCOUNT_SIZE;
use anchor_lang::prelude::*;

/// Tracks claimable fees for a Creator Referrer — a wallet that recruited
/// one or more creators to Fun.Run.
///
/// Seeds: [b"creator_referral", referrer.key()]
/// Created when the first creator sets this wallet as their creator_referrer.
/// Each buy/sell on any coin whose BondingCurve.creator_referrer == this wallet
/// transfers 20% of the total trading fee directly into this account's lamport
/// balance.  The referrer withdraws via `claim_referrer_fees`.
#[account]
pub struct ReferralAccount {
    /// The wallet entitled to claim fees from this account.
    pub referrer: Pubkey,

    /// Lifetime lamports claimed via `claim_referrer_fees`.
    /// Incremented by the claim amount on every successful claim.
    /// Zero at initialisation; never decremented.
    pub fees_claimed_total: u64,

    /// Unix timestamp (seconds) of the most recent `claim_referrer_fees` call.
    /// Zero if no claim has ever been made on this account.
    pub last_claim_timestamp: i64,

    /// Number of distinct creators who have set this wallet as their creator_referrer.
    pub total_creators_referred: u32,

    /// PDA bump for this account.
    pub bump: u8,

    /// Reserved space for future fields.
    pub _padding: [u8; 56],
}

impl ReferralAccount {
    pub const INIT_SPACE: usize = REFERRAL_ACCOUNT_SIZE;
}
