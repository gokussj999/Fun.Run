use crate::consts::CREATOR_PROFILE_SIZE;
use anchor_lang::prelude::*;

/// Per-creator identity record linking a creator to their recruiter.
/// Seeds: [b"creator_profile", creator.key()]
/// Created lazily on first coin creation or explicit set_creator_referrer call.
#[account]
pub struct CreatorProfile {
    /// The creator wallet this profile belongs to.
    pub creator: Pubkey,

    /// The wallet that recruited this creator to Fun.Run.
    /// Set once via set_creator_referrer (or implicitly during create_coin).
    /// Immutable after first assignment. Snapshotted into each BondingCurve at creation.
    pub referrer: Option<Pubkey>,

    /// Unix timestamp (seconds) when referrer was first set. Zero if not set.
    pub referrer_set_at: i64,

    /// Cumulative SOL earned by this creator across all their coins.
    /// Updated when creator claims fees from any BondingCurve.
    pub total_creator_fees_earned: u64,

    /// PDA bump for this account.
    pub bump: u8,

    /// Reserved space for future fields.
    pub _padding: [u8; 64],
}

impl CreatorProfile {
    pub const INIT_SPACE: usize = CREATOR_PROFILE_SIZE;

    /// True if this creator has a referrer set and it cannot be changed.
    pub fn has_referrer(&self) -> bool {
        self.referrer.is_some()
    }
}
