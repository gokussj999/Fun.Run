use anchor_lang::prelude::*;

// ── Coin lifecycle ────────────────────────────────────────────────────────────

#[event]
pub struct CoinCreated {
    pub mint: Pubkey,
    pub creator: Pubkey,
    /// Snapshotted from CreatorProfile at creation time; immutable from this point.
    pub creator_referrer: Option<Pubkey>,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub virtual_sol_reserves: u64,
    pub virtual_token_reserves: u64,
    /// Lamports charged for coin creation (100% → Treasury).
    pub creation_fee_paid: u64,
    pub timestamp: i64,
}

#[event]
pub struct CoinGraduated {
    pub mint: Pubkey,
    pub creator: Pubkey,
    pub real_sol_at_graduation: u64,
    /// SOL deposited into the Raydium CPMM pool (after graduation_dex_fee).
    pub sol_to_dex: u64,
    /// Tokens deposited into the Raydium CPMM pool.
    pub tokens_to_dex: u64,
    pub dex_pool: Pubkey,
    pub total_trades: u64,
    pub total_volume_sol: u64,
    pub timestamp: i64,
}

/// Emitted by `complete_graduation` after the Raydium CPMM pool has been
/// created, liquidity deposited, and the bonding curve marked GRADUATED.
#[event]
pub struct GraduationCompleted {
    pub mint: Pubkey,
    pub creator: Pubkey,
    /// Raydium CPMM pool state account created by the initialize CPI.
    pub pool_state: Pubkey,
    /// Raydium LP mint PDA created during the initialize CPI.
    pub lp_mint: Pubkey,
    /// SOL (lamports) deposited into the Raydium pool (= real_sol_reserves − dex_fee).
    pub sol_migrated: u64,
    /// Coin tokens (raw units) deposited into the Raydium pool (= LP_RESERVE_TOKENS).
    pub tokens_migrated: u64,
    /// LP tokens minted to the bonding_curve PDA = floor(sqrt(sol × tokens)) − 100.
    pub lp_minted: u64,
    pub timestamp: i64,
}

/// Emitted by `initiate_graduation` when a bonding curve transitions from
/// ELIGIBLE to GRADUATING (i.e., `complete` is set to `true`).
///
/// Note: `CoinGraduated` is the *final* graduation event emitted in P6.2 once
/// the Raydium CPMM pool has been created and the DEX pool address is known.
/// This event fires earlier — at the state-machine freeze point — so off-chain
/// indexers can track the two-phase graduation process.
#[event]
pub struct GraduationInitiated {
    pub mint: Pubkey,
    pub creator: Pubkey,
    /// `real_sol_reserves` at the moment of freeze (before any DEX-fee deduction).
    pub real_sol_at_initiation: u64,
    /// `real_sol_reserves − graduation_dex_fee_snapshot` — SOL destined for the
    /// Raydium CPMM pool (computed and locked in at initiation time).
    pub sol_to_dex_snapshot: u64,
    /// Snapshot of `GlobalConfig.graduation_dex_fee` taken at initiation time.
    /// Immutable from this point onward, even if admin updates the global config.
    pub graduation_dex_fee_snapshot: u64,
    pub total_trades: u64,
    pub total_volume_sol: u64,
    pub timestamp: i64,
}

// ── Trading ───────────────────────────────────────────────────────────────────

#[event]
pub struct TokensPurchased {
    pub mint: Pubkey,
    pub buyer: Pubkey,
    pub sol_amount: u64,
    pub sol_net: u64,
    pub tokens_out: u64,
    /// Treasury's share of the total trading fee (40% with referrer, 60% without).
    pub treasury_fee: u64,
    /// Creator's share of the total trading fee (always 40%).
    pub creator_fee: u64,
    /// Creator Referrer's share (20% if set, 0 if no creator_referrer on BondingCurve).
    pub creator_referrer_fee: u64,
    pub creator_referrer: Option<Pubkey>,
    pub virtual_sol_reserves: u64,
    pub virtual_token_reserves: u64,
    pub real_sol_reserves: u64,
    pub timestamp: i64,
}

#[event]
pub struct TokensSold {
    pub mint: Pubkey,
    pub seller: Pubkey,
    pub token_amount: u64,
    pub sol_gross: u64,
    pub sol_net: u64,
    pub treasury_fee: u64,
    pub creator_fee: u64,
    pub creator_referrer_fee: u64,
    pub creator_referrer: Option<Pubkey>,
    pub virtual_sol_reserves: u64,
    pub virtual_token_reserves: u64,
    pub real_sol_reserves: u64,
    pub timestamp: i64,
}

// ── Fee claims ────────────────────────────────────────────────────────────────

#[event]
pub struct CreatorFeesClaimed {
    pub mint: Pubkey,
    pub creator: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct CreatorReferrerFeesClaimed {
    pub creator_referrer: Pubkey,
    pub amount: u64,
    /// Lifetime lamports claimed by this referrer after this claim completes.
    pub fees_claimed_total: u64,
    pub timestamp: i64,
}

/// Emitted by `complete_graduation` (step 35) after the freeze authority is
/// permanently revoked, ensuring the coin can never be frozen.
#[event]
pub struct FreezeAuthorityRevoked {
    pub mint: Pubkey,
    pub timestamp: i64,
}

/// Emitted by `complete_graduation` after the coin mint authority is permanently
/// revoked, ensuring no additional tokens can ever be minted.
#[event]
pub struct MintAuthorityRevoked {
    pub mint: Pubkey,
    pub timestamp: i64,
}

/// Emitted by `complete_graduation` after all LP tokens minted by the Raydium
/// CPMM initialize CPI are permanently burned from the bonding-curve's LP ATA.
///
/// Once this event fires, the protocol holds no recoverable LP position and
/// the underlying Raydium pool liquidity is permanently locked.
#[event]
pub struct LiquidityLocked {
    pub mint: Pubkey,
    pub lp_mint: Pubkey,
    /// Total LP tokens burned — equals the full amount minted by Raydium.
    pub lp_burned: u64,
    pub timestamp: i64,
}

// ── Referral ──────────────────────────────────────────────────────────────────

#[event]
pub struct CreatorReferrerSet {
    pub creator: Pubkey,
    pub creator_referrer: Pubkey,
    pub timestamp: i64,
}

// ── Admin ─────────────────────────────────────────────────────────────────────

#[event]
pub struct GlobalConfigUpdated {
    pub admin: Pubkey,
    /// Human-readable label for which field changed (for off-chain indexers).
    pub field_changed: String,
    pub timestamp: i64,
}

#[event]
pub struct TreasurySweep {
    pub amount: u64,
    pub recipient: Pubkey,
    pub admin: Pubkey,
    pub treasury_balance_after: u64,
    pub timestamp: i64,
}
