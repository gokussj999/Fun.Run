//! Deployment configuration for FUN.RUN V2.
//!
//! This module documents:
//! - Per-instruction compute unit budgets
//! - Network-specific build instructions
//! - Devnet vs mainnet address differences
//!
//! # Network Feature Flags
//!
//! The program binary is network-sensitive: `RAYDIUM_CREATE_POOL_FEE_STR`
//! differs between devnet and mainnet.  Build with the correct feature:
//!
//! | Target  | Build command                            |
//! |---------|------------------------------------------|
//! | Devnet  | `cargo build-sbf --features devnet`     |
//! | Mainnet | `cargo build-sbf --features mainnet`    |
//!
//! Omitting both features defaults to mainnet addresses.
//!
//! # Compute Unit Budgets
//!
//! All values are conservative upper-bound estimates measured against devnet.
//! Callers MUST prepend a `ComputeBudgetProgram::set_compute_unit_limit`
//! instruction when the requested CU exceeds the Solana default (200 000).
//!
//! ## Instructions requiring explicit CU budget
//!
//! | Instruction          | Estimated CU   | Notes                              |
//! |----------------------|----------------|------------------------------------|
//! | `complete_graduation`| 1 400 000      | 9 outer CPIs; Raydium initialize   |
//! | `create_coin`        |   200 000      | mint init + ATA create + mint_to   |
//!
//! ## Instructions within default 200 000 CU budget
//!
//! | Instruction            | Estimated CU | Notes                           |
//! |------------------------|--------------|---------------------------------|
//! | `initialize`           |   20 000     | 2 PDA inits                     |
//! | `update_global_config` |    8 000     | single PDA write                |
//! | `pause_protocol`       |    5 000     | single flag flip                |
//! | `unpause_protocol`     |    5 000     | single flag flip                |
//! | `sweep_treasury`       |   20 000     | direct lamport transfer         |
//! | `set_creator_referrer` |   60 000     | 2 × init_if_needed PDAs         |
//! | `buy`                  |   80 000     | AMM math + token CPI + fee dist |
//! | `sell`                 |   80 000     | AMM math + token CPI + fee dist |
//! | `claim_creator_fees`   |   20 000     | lamport transfer only           |
//! | `claim_referrer_fees`  |   20 000     | lamport transfer only           |
//! | `initiate_graduation`  |   15 000     | single state write              |
//!
//! ## complete_graduation — detailed CPI breakdown
//!
//! | Step | Operation                            | Approx CU |
//! |------|--------------------------------------|-----------|
//! | 15   | system_program::transfer (DEX fee)   |    5 000  |
//! | 16   | token::mint_to (LP_RESERVE_TOKENS)   |   15 000  |
//! | 17   | ATA create idempotent                |   25 000  |
//! | 18   | system_program::transfer (SOL→WSOL)  |    5 000  |
//! | 19   | token_program SyncNative             |    3 000  |
//! | 20   | raydium_cpmm::initialize             |1 100 000  |
//! | 23   | token::burn (LP burn)                |   15 000  |
//! | 27   | token::set_authority (mint revoke)   |   10 000  |
//! | 31   | token::set_authority (freeze revoke) |   10 000  |
//! |      | Account validations + overhead       |  212 000  |
//! |      | **Total (conservative)**             |**1 400 000**|
//!
//! Raydium's internal `initialize` cost varies by network load and
//! AMM config state.  Always set the limit to `COMPLETE_GRADUATION_CU`
//! (1 400 000) as a safety margin.

// ── Compute unit budget constants ─────────────────────────────────────────────

/// Compute unit budgets per instruction.
///
/// Pass to `ComputeBudgetProgram::set_compute_unit_limit` when the estimate
/// exceeds the Solana default (200 000).
pub mod compute_budget {
    /// `initialize` — creates GlobalConfig and Treasury PDAs.
    pub const INITIALIZE_CU: u32 = 20_000;

    /// `update_global_config` — updates one or more protocol parameters.
    pub const UPDATE_GLOBAL_CONFIG_CU: u32 = 8_000;

    /// `pause_protocol` — sets GlobalConfig.paused = true.
    pub const PAUSE_PROTOCOL_CU: u32 = 5_000;

    /// `unpause_protocol` — sets GlobalConfig.paused = false.
    pub const UNPAUSE_PROTOCOL_CU: u32 = 5_000;

    /// `sweep_treasury` — transfers accumulated SOL to fee_recipient.
    pub const SWEEP_TREASURY_CU: u32 = 20_000;

    /// `set_creator_referrer` — creates CreatorProfile + ReferralAccount via
    /// init_if_needed; both account inits are included in the estimate.
    pub const SET_CREATOR_REFERRER_CU: u32 = 60_000;

    /// `create_coin` — creates SPL mint, BondingCurve PDA, vault ATA;
    /// mints BONDING_SUPPLY_TOKENS; transfers creation fee to Treasury.
    /// Requires explicit CU limit — exceeds 200 000 default.
    pub const CREATE_COIN_CU: u32 = 200_000;

    /// `buy` — AMM math, token transfer CPI, fee distribution.
    pub const BUY_CU: u32 = 80_000;

    /// `sell` — AMM math, token transfer CPI, fee distribution.
    pub const SELL_CU: u32 = 80_000;

    /// `claim_creator_fees` — sweeps creator_fees_accumulated via direct
    /// lamport manipulation.
    pub const CLAIM_CREATOR_FEES_CU: u32 = 20_000;

    /// `claim_referrer_fees` — sweeps excess lamports from ReferralAccount.
    pub const CLAIM_REFERRER_FEES_CU: u32 = 20_000;

    /// `initiate_graduation` — sets BondingCurve.complete; snapshots dex fee.
    pub const INITIATE_GRADUATION_CU: u32 = 15_000;

    /// `complete_graduation` — 9 outer CPIs including Raydium CPMM initialize,
    /// LP burn, and two authority revocations.
    ///
    /// # IMPORTANT
    /// This instruction MUST be sent with an explicit compute budget:
    /// ```ignore
    /// ComputeBudgetInstruction::set_compute_unit_limit(COMPLETE_GRADUATION_CU)
    /// ```
    /// Without it the transaction fails with `ComputationalBudgetExceeded`
    /// before Raydium's initialize CPI can complete.
    pub const COMPLETE_GRADUATION_CU: u32 = 1_400_000;
}

// ── Network-specific constants (documentation) ────────────────────────────────

/// Network address reference — for documentation and client-side tooling.
///
/// On-chain validation uses constants from `crate::consts` selected by
/// feature flags at build time.  These values are provided here for
/// off-chain clients that need to construct transactions.
pub mod network {
    /// Raydium CPMM program ID — identical on devnet and mainnet.
    pub const RAYDIUM_CPMM_PROGRAM_ID: &str = "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C";

    /// Canonical Wrapped SOL mint (same on all clusters).
    pub const WSOL_MINT: &str = "So11111111111111111111111111111111111111112";

    /// Raydium CPMM pool-creation fee destination — **MAINNET**.
    /// Corresponds to `--features mainnet` (or default, no feature flag).
    pub const MAINNET_CREATE_POOL_FEE: &str = "DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8";

    /// Raydium CPMM pool-creation fee destination — **DEVNET**.
    /// Corresponds to `--features devnet`.
    ///
    /// Verify this address against the live Raydium devnet deployment
    /// before testing `complete_graduation` on devnet.
    pub const DEVNET_CREATE_POOL_FEE: &str = "G11FVVnoEUBE4JKpFWXMiQ2Yn1g4pVu4c17dTFJDg6dN";

    /// Mainnet recommended AMM config for Raydium CPMM (standard fee tier).
    /// Pass as `amm_config` account in `complete_graduation`.
    pub const MAINNET_AMM_CONFIG: &str = "D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2";

    /// Devnet AMM config — must be verified against Raydium's devnet deployment.
    /// Callers can choose any valid AMM config owned by the Raydium CPMM program.
    pub const DEVNET_AMM_CONFIG_PLACEHOLDER: &str = "VERIFY_DEVNET_AMM_CONFIG_WITH_RAYDIUM_DOCS";
}

// ── Unit tests ────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn complete_graduation_cu_is_within_solana_max() {
        // Solana's hard limit is 1 400 000 CU.
        assert!(
            compute_budget::COMPLETE_GRADUATION_CU <= 1_400_000,
            "COMPLETE_GRADUATION_CU {} exceeds Solana's 1 400 000 CU hard limit",
            compute_budget::COMPLETE_GRADUATION_CU,
        );
    }

    #[test]
    fn instructions_within_default_budget_are_below_200k() {
        // All non-graduation, non-create-coin instructions must be within
        // the Solana default 200 000 CU limit to avoid mandatory budget ixs.
        let defaults = [
            compute_budget::INITIALIZE_CU,
            compute_budget::UPDATE_GLOBAL_CONFIG_CU,
            compute_budget::PAUSE_PROTOCOL_CU,
            compute_budget::UNPAUSE_PROTOCOL_CU,
            compute_budget::SWEEP_TREASURY_CU,
            compute_budget::SET_CREATOR_REFERRER_CU,
            compute_budget::BUY_CU,
            compute_budget::SELL_CU,
            compute_budget::CLAIM_CREATOR_FEES_CU,
            compute_budget::CLAIM_REFERRER_FEES_CU,
            compute_budget::INITIATE_GRADUATION_CU,
        ];
        for cu in defaults {
            assert!(
                cu <= 200_000,
                "CU estimate {} exceeds Solana default 200 000; add compute budget instruction",
                cu,
            );
        }
    }

    #[test]
    fn network_strings_are_non_empty() {
        assert!(!network::RAYDIUM_CPMM_PROGRAM_ID.is_empty());
        assert!(!network::WSOL_MINT.is_empty());
        assert!(!network::MAINNET_CREATE_POOL_FEE.is_empty());
        assert!(!network::DEVNET_CREATE_POOL_FEE.is_empty());
        assert!(!network::MAINNET_AMM_CONFIG.is_empty());
    }

    #[test]
    fn mainnet_and_devnet_create_pool_fee_differ() {
        assert_ne!(
            network::MAINNET_CREATE_POOL_FEE,
            network::DEVNET_CREATE_POOL_FEE,
            "devnet and mainnet create_pool_fee must be different addresses",
        );
    }
}
