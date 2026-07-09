use crate::consts::BONDING_CURVE_SIZE;
use anchor_lang::prelude::*;

/// Per-coin AMM state and fee accumulator.
/// Seeds: [b"bonding_curve", mint.key()]
/// Created by `create_coin`. Mutated by `buy`, `sell`, `graduate`, `claim_creator_fees`.
#[account]
pub struct BondingCurve {
    // ── Immutable identity (snapshotted at create_coin; never changed afterwards) ──
    /// Wallet that launched this coin. Receives 40% of every trade's total fee.
    pub creator: Pubkey,

    /// The SPL token mint this curve governs.
    pub mint: Pubkey,

    /// The wallet that recruited the creator to Fun.Run.
    /// Snapshotted from `CreatorProfile.referrer` exactly once at `create_coin` time.
    /// Immutable after creation.  When Some: receives 20% of every trade fee.
    /// When None: Treasury receives 60% instead of 40%.
    pub creator_referrer: Option<Pubkey>,

    /// Human-readable coin name (≤ MAX_NAME_LEN bytes). Stored verbatim from `create_coin`.
    pub name: String,

    /// Ticker symbol (≤ MAX_SYMBOL_LEN bytes). Stored verbatim from `create_coin`.
    pub symbol: String,

    /// Off-chain metadata URI (≤ MAX_URI_LEN bytes). Stored verbatim from `create_coin`.
    pub uri: String,

    /// Creation fee (lamports) paid to Treasury at launch. Immutable historical record.
    pub creation_fee_paid: u64,

    /// Unix timestamp (seconds) when this curve was initialised.
    pub creation_timestamp: i64,

    /// Protocol version stamp.  Always `2` for Fun.Run V2 on-chain program.
    pub protocol_version: u8,

    // ── AMM state (mutable on every buy / sell / graduate) ────────────────────
    /// Current virtual SOL reserve (lamports).  Starts at `VIRTUAL_SOL_INITIAL`.
    /// Increases on buy (by sol_net), decreases on sell (by sol_gross).
    pub virtual_sol_reserves: u64,

    /// Current virtual token reserve (raw units).  Starts at `VIRTUAL_TOKEN_INITIAL`.
    /// Decreases on buy, increases on sell.
    pub virtual_token_reserves: u64,

    /// Real SOL currently locked in this PDA for AMM liquidity (lamports).
    /// Triggers graduation when it reaches `GlobalConfig.graduation_threshold`.
    pub real_sol_reserves: u64,

    /// Real token units remaining in the token vault (tracked for graduation accounting).
    pub real_token_reserves: u64,

    /// Lamports owed to the creator from the 40% trading fee share.
    /// Co-located in this account's lamport balance (tracked separately from
    /// `real_sol_reserves`).  Withdrawn via `claim_creator_fees`.
    pub creator_fees_accumulated: u64,

    /// True after graduation — bonding curve trading is permanently closed.
    pub complete: bool,

    /// Total number of buy + sell trades executed on this curve.
    pub total_trades: u64,

    /// Cumulative gross SOL traded on this curve (buys + sells, in lamports).
    pub total_volume_sol: u64,

    // ── PDA metadata ──────────────────────────────────────────────────────────
    /// Canonical PDA bump for this account.
    pub bump: u8,

    // ── Graduation snapshot (written once by `initiate_graduation`) ───────────
    /// Snapshot of `GlobalConfig.graduation_dex_fee` taken at graduation time.
    /// Zero until `initiate_graduation` fires.  Immutable thereafter — prevents
    /// mid-flight admin changes from affecting the P6.2 DEX deposit calculation.
    pub graduation_dex_fee_snapshot: u64,

    /// True after `complete_graduation` successfully creates the Raydium pool.
    /// Prevents the instruction from being called twice on the same curve.
    /// Distinguishes GRADUATED (true) from GRADUATING (complete=true, graduated=false).
    pub graduated: bool,

    /// Reserved space for future protocol upgrades.
    pub _padding: [u8; 55],
}

impl BondingCurve {
    pub const INIT_SPACE: usize = BONDING_CURVE_SIZE;

    /// Minimum lamport balance this account must always hold.
    ///
    /// The bonding curve accumulates two kinds of SOL that must remain in the
    /// account: (a) `real_sol_reserves` — locked AMM liquidity, and (b)
    /// `creator_fees_accumulated` — claimable creator earnings.  Both must
    /// survive alongside the rent-exempt minimum.
    ///
    /// The buy instruction uses this to reject trades that would drain the
    /// account below the combined floor.
    pub fn minimum_lamports(&self, rent_minimum: u64) -> u64 {
        self.real_sol_reserves
            .saturating_add(self.creator_fees_accumulated)
            .saturating_add(rent_minimum)
    }

    /// Returns the net SOL that will be deposited into the Raydium CPMM pool
    /// at graduation: `real_sol_reserves − graduation_dex_fee_snapshot`.
    ///
    /// Only valid after `initiate_graduation` has fired (i.e., `complete == true`
    /// and `graduation_dex_fee_snapshot > 0`).  Returns `None` on underflow —
    /// callers in P6.2 must propagate this as `ArithmeticOverflow`.
    pub fn sol_to_dex(&self) -> Option<u64> {
        self.real_sol_reserves
            .checked_sub(self.graduation_dex_fee_snapshot)
    }
}
