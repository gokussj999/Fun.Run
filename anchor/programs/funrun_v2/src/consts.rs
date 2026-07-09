//! Protocol-wide constants for FUN.RUN V2.
//! All values are immutable — only admin-governed parameters live in GlobalConfig.

// ── Virtual AMM initial reserves ─────────────────────────────────────────────
/// Virtual SOL reserve at curve genesis: 30 SOL (lamports).
pub const VIRTUAL_SOL_INITIAL: u64 = 30_000_000_000;

/// Virtual token reserve at curve genesis (raw units, 6 decimals).
/// Equals 1,073,000,191 tokens × 10^6.
pub const VIRTUAL_TOKEN_INITIAL: u64 = 1_073_000_191_000_000;

/// Invariant k = VS₀ × VT₀ — precomputed in u128 to avoid runtime overflow.
/// k ≈ 3.219 × 10²⁵
pub const K_CONSTANT: u128 = VIRTUAL_SOL_INITIAL as u128 * VIRTUAL_TOKEN_INITIAL as u128;

// ── Token supply allocations (raw units, 6 decimals) ─────────────────────────
/// Total mint supply: 1,000,000,000 tokens.
pub const TOTAL_SUPPLY_TOKENS: u64 = 1_000_000_000_000_000;

/// Tokens available for bonding curve trading: 800,000,000 tokens.
pub const BONDING_SUPPLY_TOKENS: u64 = 800_000_000_000_000;

/// Tokens reserved for DEX liquidity at graduation: 200,000,000 tokens.
pub const LP_RESERVE_TOKENS: u64 = 200_000_000_000_000;

/// SPL token decimal places.
pub const TOKEN_DECIMALS: u8 = 6;

// ── Graduation parameters ─────────────────────────────────────────────────────
/// real_sol_reserves threshold that triggers graduation: 85 SOL (lamports).
pub const GRADUATION_THRESHOLD_LAMPORTS: u64 = 85_000_000_000;

/// Flat fee charged to Treasury at graduation to cover Raydium pool creation: 6 SOL.
pub const GRADUATION_DEX_FEE_LAMPORTS: u64 = 6_000_000_000;

/// On-chain protocol version stamp written into every `BondingCurve` at creation.
/// `initiate_graduation` rejects curves whose `protocol_version` does not match
/// this constant, preventing graduation of stale or foreign curve accounts.
pub const PROTOCOL_VERSION: u8 = 2;

// ── Fee bounds (hard-coded ceilings, not admin-configurable) ──────────────────
/// Maximum total trading fee: 500 bps (5.00%).
pub const MAX_TOTAL_FEE_BPS: u16 = 500;

/// Maximum coin creation fee: 1 SOL (lamports).
pub const MAX_CREATION_FEE_LAMPORTS: u64 = 1_000_000_000;

// ── Default fee settings ──────────────────────────────────────────────────────
/// Default total trading fee: 150 bps (1.50%).
pub const DEFAULT_TOTAL_FEE_BPS: u16 = 150;

/// Default coin creation fee: 0.02 SOL (lamports).
pub const DEFAULT_CREATION_FEE_LAMPORTS: u64 = 20_000_000;

// ── Fee split ratios (hard-coded, 40/40/20 model) ─────────────────────────────
/// Creator always receives this % of total_fee (40%).
pub const CREATOR_FEE_PCT: u64 = 40;

/// Creator Referrer receives this % of total_fee when set (20%).
/// Treasury receives the remainder: 40% with referrer, 60% without.
pub const REFERRER_FEE_PCT: u64 = 20;

// ── Validation limits ─────────────────────────────────────────────────────────
pub const MAX_NAME_LEN: usize = 32;
pub const MAX_SYMBOL_LEN: usize = 10;
pub const MAX_URI_LEN: usize = 200;

// ── PDA seeds — Fun.Run protocol ─────────────────────────────────────────────
pub const GLOBAL_CONFIG_SEED: &[u8] = b"global_config";
pub const TREASURY_SEED: &[u8] = b"treasury";
pub const BONDING_CURVE_SEED: &[u8] = b"bonding_curve";
pub const CREATOR_PROFILE_SEED: &[u8] = b"creator_profile";
pub const CREATOR_REFERRAL_SEED: &[u8] = b"creator_referral";

// ── Raydium CPMM — external program identifiers ───────────────────────────────
// Network selection: build with `--features devnet` or `--features mainnet`.
// Omitting both defaults to mainnet addresses (backward-compatible).
//
// Raydium CPMM program ID is identical on devnet and mainnet.
// Only the pool-creation fee destination differs per cluster.

/// Base-58 address of the Raydium CPMM on-chain program.
/// Identical on devnet and mainnet — no feature flag needed.
pub const RAYDIUM_CPMM_PROGRAM_ID_STR: &str = "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C";

/// Canonical Wrapped SOL mint address (same on all Solana clusters).
pub const WSOL_MINT_STR: &str = "So11111111111111111111111111111111111111112";

/// Raydium CPMM pool-creation fee destination (NETWORK-SPECIFIC).
///
/// `complete_graduation` validates the caller-supplied `create_pool_fee` account
/// against this constant at step 12.  Passing the wrong network address causes
/// `FunrunError::InvalidCreatePoolFeeAddress`.
///
/// Devnet:  build with `cargo build-sbf --features devnet`
/// Mainnet: build with `cargo build-sbf --features mainnet`  (or omit flag)
///
/// The devnet address below is the known Raydium CPMM devnet fee destination.
/// Verify against the live Raydium devnet deployment before testing.
#[cfg(feature = "devnet")]
pub const RAYDIUM_CREATE_POOL_FEE_STR: &str = "G11FVVnoEUBE4JKpFWXMiQ2Yn1g4pVu4c17dTFJDg6dN"; // Raydium CPMM devnet fee destination

#[cfg(not(feature = "devnet"))]
pub const RAYDIUM_CREATE_POOL_FEE_STR: &str = "DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8"; // Raydium CPMM mainnet fee destination

// ── Raydium CPMM — PDA seeds ──────────────────────────────────────────────────
/// Seed for the Raydium CPMM authority PDA.
/// Derives: `Pubkey::find_program_address([RAYDIUM_AUTHORITY_SEED], raydium_cpmm_id)`
pub const RAYDIUM_AUTHORITY_SEED: &[u8] = b"vault_and_lp_mint_auth_seed";

/// Seed prefix for Raydium CPMM pool state PDAs.
/// Derives: `[RAYDIUM_POOL_SEED, amm_config, token0_mint, token1_mint]`
pub const RAYDIUM_POOL_SEED: &[u8] = b"pool";

/// Seed prefix for Raydium CPMM LP mint PDAs.
/// Derives: `[RAYDIUM_LP_MINT_SEED, pool_state]`
pub const RAYDIUM_LP_MINT_SEED: &[u8] = b"pool_lp_mint";

/// Seed prefix for Raydium CPMM observation state PDAs.
/// Derives: `[RAYDIUM_OBSERVATION_SEED, pool_state]`
pub const RAYDIUM_OBSERVATION_SEED: &[u8] = b"observation";

/// Seed prefix for Raydium CPMM token vault PDAs.
/// Derives: `[RAYDIUM_POOL_VAULT_SEED, pool_state, token_mint]`
pub const RAYDIUM_POOL_VAULT_SEED: &[u8] = b"pool_vault";

// ── Account space allocations (discriminator 8 + fields + 64-byte padding) ───
pub const GLOBAL_CONFIG_SIZE: usize = 8   // discriminator
    + 32  // admin: Pubkey
    + 32  // fee_recipient: Pubkey
    + 8   // creation_fee_lamports: u64
    + 2   // total_trading_fee_bps: u16
    + 8   // graduation_threshold: u64
    + 8   // graduation_dex_fee: u64
    + 1   // paused: bool
    + 1   // bump: u8
    + 8   // total_sol_collected: u64
    + 8   // total_sol_disbursed: u64
    + 128; // padding for future fields

pub const BONDING_CURVE_SIZE: usize = 8   // discriminator
    + 32  // creator: Pubkey
    + 32  // mint: Pubkey
    + 33  // creator_referrer: Option<Pubkey>  (1 tag + 32 data)
    + (4 + MAX_NAME_LEN)    // name: String  (4-byte Borsh length prefix + 32 max bytes)
    + (4 + MAX_SYMBOL_LEN)  // symbol: String  (4 prefix + 10 max bytes)
    + (4 + MAX_URI_LEN)     // uri: String  (4 prefix + 200 max bytes)
    + 8   // creation_fee_paid: u64
    + 8   // creation_timestamp: i64
    + 1   // protocol_version: u8
    + 8   // virtual_sol_reserves: u64
    + 8   // virtual_token_reserves: u64
    + 8   // real_sol_reserves: u64
    + 8   // real_token_reserves: u64
    + 8   // creator_fees_accumulated: u64
    + 1   // complete: bool
    + 8   // total_trades: u64
    + 8   // total_volume_sol: u64
    + 1   // bump: u8
    + 8   // graduation_dex_fee_snapshot: u64  (locked in at graduation time)
    + 1   // graduated: bool  (set by complete_graduation after Raydium pool creation)
    + 55; // padding (64 − 8 − 1 consumed)

pub const CREATOR_PROFILE_SIZE: usize = 8   // discriminator
    + 32  // creator: Pubkey
    + 33  // referrer: Option<Pubkey>
    + 8   // referrer_set_at: i64
    + 8   // total_creator_fees_earned: u64
    + 1   // bump: u8
    + 64; // padding

pub const REFERRAL_ACCOUNT_SIZE: usize = 8   // discriminator
    + 32  // referrer: Pubkey
    + 8   // fees_claimed_total: u64
    + 8   // last_claim_timestamp: i64
    + 4   // total_creators_referred: u32
    + 1   // bump: u8
    + 56; // padding

pub const TREASURY_SIZE: usize = 8   // discriminator
    + 8   // total_sol_collected: u64
    + 8   // total_sol_disbursed: u64
    + 1   // bump: u8
    + 64; // padding
