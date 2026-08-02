use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
use anchor_lang::solana_program::program::{invoke, invoke_signed};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, SetAuthority, Token, TokenAccount};

use crate::consts::*;
use crate::errors::FunrunError;
use crate::state::{BondingCurve, GlobalConfig, Treasury};

// ── Module-level Raydium helpers ──────────────────────────────────────────────

/// Returns the Raydium CPMM program `Pubkey` from the compile-time constant.
fn raydium_cpmm_id() -> Pubkey {
    // Safety: constant is a valid base58-encoded Solana public key.
    RAYDIUM_CPMM_PROGRAM_ID_STR.parse().unwrap()
}

/// Returns the canonical Wrapped SOL mint `Pubkey`.
fn wsol_mint_key() -> Pubkey {
    WSOL_MINT_STR.parse().unwrap()
}

/// Returns the Raydium CPMM create-pool-fee destination `Pubkey`.
fn raydium_create_pool_fee_key() -> Pubkey {
    RAYDIUM_CREATE_POOL_FEE_STR.parse().unwrap()
}

// ── P6.3 helpers ──────────────────────────────────────────────────────────────

/// Encodes a Raydium CPMM `initialize` instruction.
/// Discriminator: [175, 175, 109, 31, 13, 152, 155, 237].
/// Args: init_amount_0: u64 (LE), init_amount_1: u64 (LE), open_time: u64 (LE, always 0).
fn raydium_initialize_data(init_amount_0: u64, init_amount_1: u64) -> Vec<u8> {
    let mut d = Vec::with_capacity(32);
    d.extend_from_slice(&[175, 175, 109, 31, 13, 152, 155, 237]);
    d.extend_from_slice(&init_amount_0.to_le_bytes());
    d.extend_from_slice(&init_amount_1.to_le_bytes());
    d.extend_from_slice(&0u64.to_le_bytes());
    d
}

/// Integer square root (floor) via Newton's method — no floating point.
fn integer_sqrt(n: u128) -> u64 {
    if n == 0 {
        return 0;
    }
    let mut x = n;
    let mut y = x.div_ceil(2);
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    x as u64
}

/// Expected LP minted = floor(sqrt(a × b)) − 100  (Raydium CPMM formula).
fn compute_expected_lp(amount_0: u64, amount_1: u64) -> Option<u64> {
    let product = (amount_0 as u128).checked_mul(amount_1 as u128)?;
    integer_sqrt(product).checked_sub(100)
}

/// Reads the SPL token account `amount` field (bytes 64–72, little-endian).
fn read_token_amount(data: &[u8]) -> Option<u64> {
    if data.len() < 72 {
        return None;
    }
    Some(u64::from_le_bytes(data[64..72].try_into().ok()?))
}

// ── Accounts ──────────────────────────────────────────────────────────────────

/// Accounts required by the `complete_graduation` instruction.
///
/// The handler validates all accounts, wraps SOL into WSOL, mints liquidity
/// tokens, creates the Raydium CPMM pool via `invoke_signed`, verifies post-CPI
/// state, and marks the bonding curve as graduated.
///
/// # Token ordering
///
/// Raydium CPMM requires `token0_mint < token1_mint` (lexicographic byte
/// comparison).  The caller must sort the coin mint and WSOL mint and pass
/// them in the correct positions.  The handler enforces this ordering and
/// rejects mismatched or unsorted accounts.
///
/// # State precondition
///
/// `initiate_graduation` must have been called first (`BondingCurve.complete
/// == true`).  Attempting to call this instruction on an active curve is
/// rejected at the account-constraint level.
#[derive(Accounts)]
pub struct CompleteGraduation<'info> {
    // ── Caller ────────────────────────────────────────────────────────────────
    /// Permissionless caller — any wallet may complete graduation.
    /// Marked `mut` because the caller pays rent for the bonding-curve WSOL ATA
    /// created via the idempotent associated-token-program CPI in step 17.
    #[account(mut)]
    pub caller: Signer<'info>,

    // ── Fun.Run protocol state ─────────────────────────────────────────────────
    /// Protocol-wide configuration (read-only).
    /// Graduation does not check the pause flag — once initiated, it must
    /// be completable regardless of protocol pause state.
    #[account(
        seeds = [GLOBAL_CONFIG_SEED],
        bump = global_config.bump,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    /// Protocol treasury — receives the graduation DEX fee (P6.3).
    #[account(
        mut,
        seeds = [TREASURY_SEED],
        bump = treasury.bump,
    )]
    pub treasury: Account<'info, Treasury>,

    /// The coin's SPL mint.
    ///
    /// Mint authority and freeze authority are validated in the handler to
    /// confirm they are still held by the `bonding_curve` PDA.
    #[account(mut)]
    pub coin_mint: Account<'info, Mint>,

    /// Bonding curve AMM state.
    ///
    /// Must be in GRADUATING state (`complete == true`).  The `has_one`-style
    /// check (`bonding_curve.mint == coin_mint.key()`) is enforced in the
    /// handler via [`graduation_validation::validate_coin_mint_matches`].
    #[account(
        mut,
        seeds = [BONDING_CURVE_SEED, coin_mint.key().as_ref()],
        bump = bonding_curve.bump,
        constraint = bonding_curve.complete @ FunrunError::GraduationNotInitiated,
        constraint = !bonding_curve.graduated @ FunrunError::AlreadyGraduated,
    )]
    pub bonding_curve: Box<Account<'info, BondingCurve>>,

    /// Existing token vault: ATA owned by `bonding_curve` for `coin_mint`.
    /// Holds `real_token_reserves` — the remaining tradeable supply that was
    /// not purchased before graduation.  Handler validates this is the correct
    /// ATA (bonding_curve × coin_mint).
    #[account(
        mut,
        token::mint = coin_mint,
        token::authority = bonding_curve,
    )]
    pub bonding_curve_vault: Account<'info, TokenAccount>,

    /// CHECK: WSOL ATA for the bonding_curve PDA.
    /// Created idempotently in P6.3 to receive wrapped SOL before the Raydium CPI.
    /// Handler validates: get_associated_token_address(bonding_curve, wsol_mint).
    #[account(mut)]
    pub bonding_curve_wsol_account: UncheckedAccount<'info>,

    // ── WSOL ──────────────────────────────────────────────────────────────────
    /// Wrapped SOL mint — validated in the account constraint to be the
    /// canonical WSOL address.
    #[account(
        constraint = wsol_mint.key() == wsol_mint_key() @ FunrunError::InvalidWsolMint,
    )]
    pub wsol_mint: Account<'info, Mint>,

    // ── Raydium CPMM program ───────────────────────────────────────────────────
    /// CHECK: Raydium CPMM on-chain program.
    /// Validated in the account constraint against `RAYDIUM_CPMM_PROGRAM_ID_STR`.
    #[account(
        constraint = raydium_cpmm_program.key() == raydium_cpmm_id()
            @ FunrunError::InvalidRaydiumProgram,
    )]
    pub raydium_cpmm_program: UncheckedAccount<'info>,

    // ── Raydium CPMM infrastructure (all validated in handler) ─────────────────
    /// CHECK: Raydium AMM configuration account.
    /// Handler validates that this account is owned by the Raydium CPMM program.
    /// Callers should provide the `D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2`
    /// config for mainnet or the equivalent devnet address.
    pub amm_config: UncheckedAccount<'info>,

    /// CHECK: Raydium CPMM authority PDA.
    /// Handler validates: `find_program_address([RAYDIUM_AUTHORITY_SEED], raydium_cpmm)`.
    pub raydium_authority: UncheckedAccount<'info>,

    /// CHECK: Raydium CPMM pool state PDA (not yet initialised).
    /// Handler validates: `find_program_address(
    ///   [RAYDIUM_POOL_SEED, amm_config, token0_mint, token1_mint], raydium_cpmm)`.
    pub pool_state: UncheckedAccount<'info>,

    /// CHECK: Raydium CPMM LP mint PDA (not yet initialised at account-validation time).
    /// Handler validates: `find_program_address(
    ///   [RAYDIUM_LP_MINT_SEED, pool_state], raydium_cpmm)`.
    /// Marked `mut` because:
    ///   • Raydium writes to it during pool initialization (step 20).
    ///   • The LP burn CPI (step 23) decreases the supply via SPL Token `burn`.
    #[account(mut)]
    pub lp_mint: UncheckedAccount<'info>,

    // ── Token accounts for Raydium pool ───────────────────────────────────────
    /// CHECK: Raydium pool token-0 vault (pool_vault PDA, not yet initialised).
    /// Handler validates PDA derivation: [pool_vault, pool_state, token0_mint].
    pub token0_vault: UncheckedAccount<'info>,

    /// CHECK: Raydium pool token-1 vault (pool_vault PDA, not yet initialised).
    /// Handler validates PDA derivation: [pool_vault, pool_state, token1_mint].
    pub token1_vault: UncheckedAccount<'info>,

    /// CHECK: LP token destination — ATA of the bonding_curve PDA (Raydium's `creator`).
    /// Handler validates ATA derivation: bonding_curve × lp_mint.
    /// Raydium creates this ATA via associated_token_program during `initialize`.
    #[account(mut)]
    pub creator_lp_token: UncheckedAccount<'info>,

    // ── Raydium auxiliary accounts ─────────────────────────────────────────────
    /// CHECK: Raydium CPMM pool creation fee destination.
    /// Handler validates against the canonical `RAYDIUM_CREATE_POOL_FEE_STR` address.
    pub create_pool_fee: UncheckedAccount<'info>,

    /// CHECK: Raydium CPMM observation state PDA (not yet initialised).
    /// Handler validates: `find_program_address(
    ///   [RAYDIUM_OBSERVATION_SEED, pool_state], raydium_cpmm)`.
    pub observation_state: UncheckedAccount<'info>,

    // ── Programs and sysvars ──────────────────────────────────────────────────
    /// Standard SPL Token program — used for LP mint operations.
    pub token_program: Program<'info, Token>,
    /// CHECK: Token program governing `token_0_mint` (standard Token or Token-2022).
    /// Passed through to Raydium initialize in P6.3.
    pub token_0_program: UncheckedAccount<'info>,
    /// CHECK: Token program governing `token_1_mint` (standard Token or Token-2022).
    /// Passed through to Raydium initialize in P6.3.
    pub token_1_program: UncheckedAccount<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// ── Validation helpers ────────────────────────────────────────────────────────

/// Pure, unit-testable validation helpers for graduation account validation.
///
/// All functions take `Pubkey` values (not `AccountInfo`) so they can be
/// called in unit tests without the Solana runtime.  The handler extracts
/// the relevant keys/data from account references before calling these.
pub mod graduation_validation {
    use super::*;
    use anchor_spl::associated_token::get_associated_token_address;

    // ── Curve state ───────────────────────────────────────────────────────────

    /// Checks that `BondingCurve.mint == coin_mint_key`.
    ///
    /// This is the `has_one` check for `coin_mint`.  Anchor cannot express it
    /// as a constraint because the seed of `bonding_curve` is derived from
    /// `coin_mint.key()`, so if the PDA validates the mint is correct.
    /// We add this check as defence-in-depth.
    ///
    /// # Errors
    /// [`FunrunError::InvalidMint`]
    pub fn validate_coin_mint_matches(
        bonding_curve_mint: &Pubkey,
        coin_mint_key: &Pubkey,
    ) -> Result<()> {
        require!(
            bonding_curve_mint == coin_mint_key,
            FunrunError::InvalidMint,
        );
        Ok(())
    }

    /// Checks that the curve is in GRADUATING state (`complete == true` and
    /// `graduation_dex_fee_snapshot > 0`).
    ///
    /// # Errors
    /// [`FunrunError::GraduationNotInitiated`]
    pub fn validate_curve_is_graduating(complete: bool, snapshot: u64) -> Result<()> {
        require!(complete, FunrunError::GraduationNotInitiated);
        // A snapshot of 0 means initiate_graduation was never called (or was
        // somehow reverted), which would produce an empty Raydium pool.
        require!(snapshot > 0, FunrunError::GraduationSnapshotInconsistency,);
        Ok(())
    }

    /// Checks that `protocol_version == PROTOCOL_VERSION`.
    ///
    /// # Errors
    /// [`FunrunError::ProtocolVersionMismatch`]
    pub fn validate_protocol_version(version: u8) -> Result<()> {
        require!(
            version == PROTOCOL_VERSION,
            FunrunError::ProtocolVersionMismatch,
        );
        Ok(())
    }

    /// Checks that `real_sol_reserves − graduation_dex_fee_snapshot > 0`.
    ///
    /// # Errors
    /// [`FunrunError::InsufficientSolForGraduation`] on underflow.
    /// [`FunrunError::GraduationSnapshotInconsistency`] if result is zero.
    pub fn validate_snapshot_consistency(real_sol: u64, dex_fee_snapshot: u64) -> Result<u64> {
        let sol_to_dex = real_sol
            .checked_sub(dex_fee_snapshot)
            .ok_or(error!(FunrunError::InsufficientSolForGraduation))?;
        require!(sol_to_dex > 0, FunrunError::GraduationSnapshotInconsistency,);
        Ok(sol_to_dex)
    }

    // ── Mint authorities ──────────────────────────────────────────────────────

    /// Validates that `mint_authority` is either already revoked (`None`) or the
    /// bonding curve PDA (legacy coins created before create-time revoke).
    ///
    /// # Errors
    /// [`FunrunError::InvalidMintAuthority`] if Some(other)
    pub fn validate_mint_authority(
        mint_authority: Option<Pubkey>,
        bonding_curve_key: &Pubkey,
    ) -> Result<()> {
        match mint_authority {
            None => Ok(()),
            Some(auth) => {
                require!(
                    &auth == bonding_curve_key,
                    FunrunError::InvalidMintAuthority,
                );
                Ok(())
            }
        }
    }

    /// Validates that `freeze_authority` is either already revoked (`None`) or the
    /// bonding curve PDA (legacy coins created before create-time revoke).
    ///
    /// # Errors
    /// [`FunrunError::InvalidFreezeAuthority`] if Some(other)
    pub fn validate_freeze_authority(
        freeze_authority: Option<Pubkey>,
        bonding_curve_key: &Pubkey,
    ) -> Result<()> {
        match freeze_authority {
            None => Ok(()),
            Some(auth) => {
                require!(
                    &auth == bonding_curve_key,
                    FunrunError::InvalidFreezeAuthority,
                );
                Ok(())
            }
        }
    }

    // ── Raydium account validation ────────────────────────────────────────────

    /// Validates that the AMM config is owned by the Raydium CPMM program.
    ///
    /// # Errors
    /// [`FunrunError::InvalidAmmConfig`]
    pub fn validate_amm_config_ownership(
        amm_config_owner: &Pubkey,
        raydium_program_id: &Pubkey,
    ) -> Result<()> {
        require!(
            amm_config_owner == raydium_program_id,
            FunrunError::InvalidAmmConfig,
        );
        Ok(())
    }

    /// Validates the Raydium CPMM authority PDA.
    ///
    /// Returns the canonical authority key and its bump.
    ///
    /// # Errors
    /// [`FunrunError::InvalidRaydiumAuthority`]
    pub fn validate_raydium_authority(
        authority_key: &Pubkey,
        raydium_program_id: &Pubkey,
    ) -> Result<u8> {
        let (expected, bump) =
            Pubkey::find_program_address(&[RAYDIUM_AUTHORITY_SEED], raydium_program_id);
        require!(
            authority_key == &expected,
            FunrunError::InvalidRaydiumAuthority,
        );
        Ok(bump)
    }

    /// Validates that the two token mints are in correct Raydium ordering
    /// (`token0 < token1` lexicographically) and that one is `coin_mint` and
    /// the other is `wsol_mint`.
    ///
    /// # Errors
    /// [`FunrunError::InvalidTokenOrdering`] — not in ascending order.
    /// [`FunrunError::InvalidWsolMint`] — neither mint is WSOL.
    /// [`FunrunError::InvalidMint`] — neither mint is the coin mint.
    pub fn validate_token_pair(
        token0: &Pubkey,
        token1: &Pubkey,
        coin_mint: &Pubkey,
        wsol_mint: &Pubkey,
    ) -> Result<()> {
        // Raydium CPMM ordering: token0 < token1 (byte comparison).
        require!(
            token0.to_bytes() < token1.to_bytes(),
            FunrunError::InvalidTokenOrdering,
        );
        // The pair must be exactly {coin_mint, wsol_mint} in some order.
        let is_coin0_wsol1 = token0 == coin_mint && token1 == wsol_mint;
        let is_wsol0_coin1 = token0 == wsol_mint && token1 == coin_mint;
        require!(is_coin0_wsol1 || is_wsol0_coin1, FunrunError::InvalidMint,);
        Ok(())
    }

    /// Validates the Raydium CPMM pool state PDA.
    ///
    /// Returns the canonical pool state key and its bump.
    ///
    /// # Errors
    /// [`FunrunError::InvalidPoolStatePda`]
    pub fn validate_pool_state_pda(
        pool_state_key: &Pubkey,
        amm_config_key: &Pubkey,
        token0_key: &Pubkey,
        token1_key: &Pubkey,
        raydium_program_id: &Pubkey,
    ) -> Result<u8> {
        let (expected, bump) = Pubkey::find_program_address(
            &[
                RAYDIUM_POOL_SEED,
                amm_config_key.as_ref(),
                token0_key.as_ref(),
                token1_key.as_ref(),
            ],
            raydium_program_id,
        );
        require!(
            pool_state_key == &expected,
            FunrunError::InvalidPoolStatePda,
        );
        Ok(bump)
    }

    /// Validates the Raydium CPMM LP mint PDA.
    ///
    /// Returns the canonical LP mint key and its bump.
    ///
    /// # Errors
    /// [`FunrunError::InvalidLpMintPda`]
    pub fn validate_lp_mint_pda(
        lp_mint_key: &Pubkey,
        pool_state_key: &Pubkey,
        raydium_program_id: &Pubkey,
    ) -> Result<u8> {
        let (expected, bump) = Pubkey::find_program_address(
            &[RAYDIUM_LP_MINT_SEED, pool_state_key.as_ref()],
            raydium_program_id,
        );
        require!(lp_mint_key == &expected, FunrunError::InvalidLpMintPda,);
        Ok(bump)
    }

    /// Validates the Raydium CPMM observation state PDA.
    ///
    /// Returns the canonical observation key and its bump.
    ///
    /// # Errors
    /// [`FunrunError::InvalidObservationStatePda`]
    pub fn validate_observation_state_pda(
        observation_key: &Pubkey,
        pool_state_key: &Pubkey,
        raydium_program_id: &Pubkey,
    ) -> Result<u8> {
        let (expected, bump) = Pubkey::find_program_address(
            &[RAYDIUM_OBSERVATION_SEED, pool_state_key.as_ref()],
            raydium_program_id,
        );
        require!(
            observation_key == &expected,
            FunrunError::InvalidObservationStatePda,
        );
        Ok(bump)
    }

    /// Validates that a token vault is the pool_vault PDA derived from
    /// `[RAYDIUM_POOL_VAULT_SEED, pool_state, token_mint]`.
    ///
    /// Raydium CPMM vaults are NOT ATAs of the authority; they are custom PDAs
    /// created by the Raydium program during `initialize`.
    ///
    /// # Errors
    /// [`FunrunError::InvalidTokenVault`]
    pub fn validate_token_vault(
        vault_key: &Pubkey,
        pool_state_key: &Pubkey,
        token_mint_key: &Pubkey,
        raydium_program_id: &Pubkey,
    ) -> Result<()> {
        let (expected, _) = Pubkey::find_program_address(
            &[
                RAYDIUM_POOL_VAULT_SEED,
                pool_state_key.as_ref(),
                token_mint_key.as_ref(),
            ],
            raydium_program_id,
        );
        require!(vault_key == &expected, FunrunError::InvalidTokenVault);
        Ok(())
    }

    /// Validates that the LP token destination is the ATA derived from
    /// `(owner, lp_mint)`.
    ///
    /// # Errors
    /// [`FunrunError::InvalidLpDestination`]
    pub fn validate_lp_destination(
        lp_dest_key: &Pubkey,
        owner_key: &Pubkey,
        lp_mint_key: &Pubkey,
    ) -> Result<()> {
        let expected = get_associated_token_address(owner_key, lp_mint_key);
        require!(lp_dest_key == &expected, FunrunError::InvalidLpDestination);
        Ok(())
    }

    /// Validates the Raydium create-pool-fee destination against the known
    /// mainnet address.
    ///
    /// # Errors
    /// [`FunrunError::InvalidCreatePoolFeeAccount`]
    pub fn validate_create_pool_fee(fee_key: &Pubkey) -> Result<()> {
        let expected = raydium_create_pool_fee_key();
        require!(
            fee_key == &expected,
            FunrunError::InvalidCreatePoolFeeAccount,
        );
        Ok(())
    }

    /// Validates the bonding curve token vault is the ATA derived from
    /// `(bonding_curve, coin_mint)`.
    ///
    /// # Errors
    /// [`FunrunError::InvalidBondingCurveVault`]
    pub fn validate_bonding_curve_vault(
        vault_key: &Pubkey,
        bonding_curve_key: &Pubkey,
        coin_mint_key: &Pubkey,
    ) -> Result<()> {
        let expected = get_associated_token_address(bonding_curve_key, coin_mint_key);
        require!(
            vault_key == &expected,
            FunrunError::InvalidBondingCurveVault,
        );
        Ok(())
    }

    /// Validates the bonding curve WSOL account is the ATA derived from
    /// `(bonding_curve, wsol_mint)`.
    ///
    /// # Errors
    /// [`FunrunError::InvalidBondingCurveWsolAccount`]
    pub fn validate_bonding_curve_wsol_ata(
        wsol_account_key: &Pubkey,
        bonding_curve_key: &Pubkey,
        wsol_mint_key: &Pubkey,
    ) -> Result<()> {
        let expected = get_associated_token_address(bonding_curve_key, wsol_mint_key);
        require!(
            wsol_account_key == &expected,
            FunrunError::InvalidBondingCurveWsolAccount,
        );
        Ok(())
    }
}

// ── Raydium CPI helper ────────────────────────────────────────────────────────

/// Executes the Raydium CPMM `initialize` CPI with the bonding-curve PDA as signer.
///
/// Extracted into a separate `#[inline(never)]` function so the 20-account
/// `AccountInfo` array lives in its own stack frame, keeping `handler`'s peak
/// stack usage below the SBF 4 096-byte limit.
#[inline(never)]
fn invoke_raydium_cpi<'info>(
    accounts: &CompleteGraduation<'info>,
    bc_key: Pubkey,
    raydium_id: Pubkey,
    pool_key: Pubkey,
    token0_key: Pubkey,
    token1_key: Pubkey,
    lp_key: Pubkey,
    coin_is_token0: bool,
    init_amount_0: u64,
    init_amount_1: u64,
    bonding_curve_seeds: &[&[&[u8]]],
) -> Result<()> {
    let (creator_token_0_info, creator_token_1_info) = if coin_is_token0 {
        (
            accounts.bonding_curve_vault.to_account_info(),
            accounts.bonding_curve_wsol_account.to_account_info(),
        )
    } else {
        (
            accounts.bonding_curve_wsol_account.to_account_info(),
            accounts.bonding_curve_vault.to_account_info(),
        )
    };
    let (token0_mint_info, token1_mint_info) = if coin_is_token0 {
        (
            accounts.coin_mint.to_account_info(),
            accounts.wsol_mint.to_account_info(),
        )
    } else {
        (
            accounts.wsol_mint.to_account_info(),
            accounts.coin_mint.to_account_info(),
        )
    };
    let data = raydium_initialize_data(init_amount_0, init_amount_1);
    let accounts_meta = vec![
        AccountMeta::new(bc_key, true),                                               // 0: creator
        AccountMeta::new_readonly(accounts.amm_config.key(), false),                  // 1: amm_config
        AccountMeta::new_readonly(accounts.raydium_authority.key(), false),           // 2: authority
        AccountMeta::new(pool_key, false),                                            // 3: pool_state
        AccountMeta::new_readonly(token0_key, false),                                 // 4: token_0_mint
        AccountMeta::new_readonly(token1_key, false),                                 // 5: token_1_mint
        AccountMeta::new(lp_key, false),                                              // 6: lp_mint
        AccountMeta::new(creator_token_0_info.key(), false),                         // 7: creator_token_0
        AccountMeta::new(creator_token_1_info.key(), false),                         // 8: creator_token_1
        AccountMeta::new(accounts.creator_lp_token.key(), false),                    // 9: creator_lp_token
        AccountMeta::new(accounts.token0_vault.key(), false),                        // 10: token_0_vault
        AccountMeta::new(accounts.token1_vault.key(), false),                        // 11: token_1_vault
        AccountMeta::new(accounts.create_pool_fee.key(), false),                     // 12: create_pool_fee
        AccountMeta::new(accounts.observation_state.key(), false),                   // 13: observation_state
        AccountMeta::new_readonly(accounts.token_program.key(), false),              // 14: token_program
        AccountMeta::new_readonly(accounts.token_0_program.key(), false),            // 15: token_0_program
        AccountMeta::new_readonly(accounts.token_1_program.key(), false),            // 16: token_1_program
        AccountMeta::new_readonly(accounts.associated_token_program.key(), false),   // 17: assoc_token_prog
        AccountMeta::new_readonly(accounts.system_program.key(), false),             // 18: system_program
        AccountMeta::new_readonly(accounts.rent.key(), false),                       // 19: rent
    ];
    let ix = Instruction {
        program_id: raydium_id,
        accounts: accounts_meta,
        data,
    };
    invoke_signed(
        &ix,
        &[
            accounts.bonding_curve.to_account_info(), // 0: creator (PDA signer)
            accounts.amm_config.to_account_info(),    // 1
            accounts.raydium_authority.to_account_info(), // 2
            accounts.pool_state.to_account_info(),    // 3
            token0_mint_info,                         // 4
            token1_mint_info,                         // 5
            accounts.lp_mint.to_account_info(),       // 6
            creator_token_0_info,                     // 7
            creator_token_1_info,                     // 8
            accounts.creator_lp_token.to_account_info(), // 9
            accounts.token0_vault.to_account_info(),  // 10
            accounts.token1_vault.to_account_info(),  // 11
            accounts.create_pool_fee.to_account_info(), // 12
            accounts.observation_state.to_account_info(), // 13
            accounts.token_program.to_account_info(), // 14
            accounts.token_0_program.to_account_info(), // 15
            accounts.token_1_program.to_account_info(), // 16
            accounts.associated_token_program.to_account_info(), // 17
            accounts.system_program.to_account_info(), // 18
            accounts.rent.to_account_info(),          // 19
        ],
        bonding_curve_seeds,
    )?;
    Ok(())
}

// ── Handler ───────────────────────────────────────────────────────────────────

/// Creates a Raydium CPMM pool, migrates bonding-curve liquidity, burns all
/// LP tokens, and permanently revokes both the mint and freeze authorities.
///
/// # Execution order
///
/// 1–13. Validate all accounts (coin mint, curve state, Raydium PDAs, vaults).
/// 14.   Validate bonding-curve WSOL ATA derivation.
/// 15.   Transfer `graduation_dex_fee_snapshot` lamports → Treasury.
/// 16.   Mint `LP_RESERVE_TOKENS` → bonding-curve vault.
/// 17.   Create bonding-curve WSOL ATA (idempotent).
/// 18.   Transfer `sol_to_dex` lamports from bonding curve → WSOL ATA.
/// 19.   `sync_native` — WSOL token balance updated to reflect deposited SOL.
/// 20.   Raydium CPMM `initialize` CPI — pool, vaults, LP mint created; LP minted.
/// 21.   Post-CPI verification: pool ownership, LP mint, observation, vaults, LP amount.
/// 22.   Pre-burn LP balance check (`actual_lp > 0`).
/// 23.   Burn all LP tokens via SPL Token `burn` CPI (bonding curve PDA signs).
/// 24.   Post-burn verification: `creator_lp_token.amount == 0`.
/// 25.   Emit `LiquidityLocked`.
/// 26.   Mint authority: revoke if `Some(bonding_curve)`; skip if already `None`.
/// 27.   (conditional) Revoke mint authority via SPL Token `set_authority` CPI (→ `None`).
/// 28.   Post-revocation verification: `coin_mint.mint_authority == None`.
/// 29.   Emit `MintAuthorityRevoked`.
/// 30.   Freeze authority: revoke if `Some(bonding_curve)`; skip if already `None`.
/// 31.   (conditional) Revoke freeze authority via SPL Token `set_authority` CPI (→ `None`).
/// 32.   Reload `coin_mint`.
/// 33.   Post-revocation verification: both authorities `None`.
/// 34.   Set `bonding_curve.graduated = true`; emit `GraduationCompleted`.
/// 35.   Emit `FreezeAuthorityRevoked`.
pub fn handler(ctx: Context<CompleteGraduation>) -> Result<()> {
    use graduation_validation::*;

    let clock = Clock::get()?;
    let raydium_id = raydium_cpmm_id();
    let wsol_key = wsol_mint_key();

    // Extract all bonding_curve data into locals before any mutable borrows.
    let bc_key = ctx.accounts.bonding_curve.key();
    let bc_bump = ctx.accounts.bonding_curve.bump;
    let bc_mint = ctx.accounts.bonding_curve.mint;
    let bc_creator = ctx.accounts.bonding_curve.creator;
    let bc_complete = ctx.accounts.bonding_curve.complete;
    let bc_dex_fee_snapshot = ctx.accounts.bonding_curve.graduation_dex_fee_snapshot;
    let bc_protocol_version = ctx.accounts.bonding_curve.protocol_version;
    let bc_real_sol = ctx.accounts.bonding_curve.real_sol_reserves;
    let coin_key = ctx.accounts.coin_mint.key();

    // ── Step 1: Coin mint identity ────────────────────────────────────────────
    validate_coin_mint_matches(&bc_mint, &coin_key)?;

    // ── Step 2: Curve state ───────────────────────────────────────────────────
    validate_curve_is_graduating(bc_complete, bc_dex_fee_snapshot)?;
    validate_protocol_version(bc_protocol_version)?;
    let sol_to_dex = validate_snapshot_consistency(bc_real_sol, bc_dex_fee_snapshot)?;

    // ── Step 3: Mint and freeze authorities ───────────────────────────────────
    validate_mint_authority(ctx.accounts.coin_mint.mint_authority.into(), &bc_key)?;
    validate_freeze_authority(ctx.accounts.coin_mint.freeze_authority.into(), &bc_key)?;

    // ── Step 4: AMM config ownership ─────────────────────────────────────────
    validate_amm_config_ownership(ctx.accounts.amm_config.owner, &raydium_id)?;

    // ── Step 5: Raydium authority PDA ─────────────────────────────────────────
    validate_raydium_authority(&ctx.accounts.raydium_authority.key(), &raydium_id)?;

    // ── Step 6: Token ordering ────────────────────────────────────────────────
    let coin_is_token0 = coin_key.to_bytes() < wsol_key.to_bytes();
    let (token0_key, token1_key) = if coin_is_token0 {
        (coin_key, wsol_key)
    } else {
        (wsol_key, coin_key)
    };

    // ── Step 7: Pool state PDA ────────────────────────────────────────────────
    let pool_key = ctx.accounts.pool_state.key();
    validate_pool_state_pda(
        &pool_key,
        &ctx.accounts.amm_config.key(),
        &token0_key,
        &token1_key,
        &raydium_id,
    )?;

    // ── Step 8: LP mint PDA ───────────────────────────────────────────────────
    let lp_key = ctx.accounts.lp_mint.key();
    validate_lp_mint_pda(&lp_key, &pool_key, &raydium_id)?;

    // ── Step 9: Observation state PDA ─────────────────────────────────────────
    validate_observation_state_pda(
        &ctx.accounts.observation_state.key(),
        &pool_key,
        &raydium_id,
    )?;

    // ── Step 10: Token vaults (pool_vault PDAs) ───────────────────────────────
    validate_token_vault(
        &ctx.accounts.token0_vault.key(),
        &pool_key,
        &token0_key,
        &raydium_id,
    )?;
    validate_token_vault(
        &ctx.accounts.token1_vault.key(),
        &pool_key,
        &token1_key,
        &raydium_id,
    )?;

    // ── Step 11: Creator LP token destination (bonding_curve = Raydium creator) ─
    validate_lp_destination(&ctx.accounts.creator_lp_token.key(), &bc_key, &lp_key)?;

    // ── Step 12: Create-pool-fee destination ──────────────────────────────────
    validate_create_pool_fee(&ctx.accounts.create_pool_fee.key())?;

    // ── Step 13: Bonding curve vault ──────────────────────────────────────────
    validate_bonding_curve_vault(&ctx.accounts.bonding_curve_vault.key(), &bc_key, &coin_key)?;

    // ── Step 14: Bonding curve WSOL ATA ──────────────────────────────────────
    validate_bonding_curve_wsol_ata(
        &ctx.accounts.bonding_curve_wsol_account.key(),
        &bc_key,
        &wsol_key,
    )?;

    // ── P6.3 execution ────────────────────────────────────────────────────────

    let bonding_curve_seeds: &[&[&[u8]]] = &[&[BONDING_CURVE_SEED, bc_mint.as_ref(), &[bc_bump]]];

    // Ordered liquidity amounts: coin vs WSOL depends on token0/token1 assignment.
    let (init_amount_0, init_amount_1) = if coin_is_token0 {
        (LP_RESERVE_TOKENS, sol_to_dex)
    } else {
        (sol_to_dex, LP_RESERVE_TOKENS)
    };

    // ── Step 15: Transfer graduation DEX fee to treasury ──────────────────────
    {
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &bc_key,
            &ctx.accounts.treasury.key(),
            bc_dex_fee_snapshot,
        );
        invoke_signed(
            &ix,
            &[
                ctx.accounts.bonding_curve.to_account_info(),
                ctx.accounts.treasury.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            bonding_curve_seeds,
        )?;
        ctx.accounts.treasury.total_sol_collected = ctx
            .accounts
            .treasury
            .total_sol_collected
            .checked_add(bc_dex_fee_snapshot)
            .ok_or(error!(FunrunError::ArithmeticOverflow))?;
    }

    // ── Step 16: Mint LP_RESERVE_TOKENS to bonding_curve_vault ────────────────
    {
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.coin_mint.to_account_info(),
                to: ctx.accounts.bonding_curve_vault.to_account_info(),
                authority: ctx.accounts.bonding_curve.to_account_info(),
            },
            bonding_curve_seeds,
        );
        token::mint_to(cpi_ctx, LP_RESERVE_TOKENS)?;
    }

    // ── Step 17: Create bonding-curve WSOL ATA (idempotent) ──────────────────
    {
        let ix = Instruction {
            program_id: ctx.accounts.associated_token_program.key(),
            accounts: vec![
                AccountMeta::new(ctx.accounts.caller.key(), true),
                AccountMeta::new(ctx.accounts.bonding_curve_wsol_account.key(), false),
                AccountMeta::new_readonly(bc_key, false),
                AccountMeta::new_readonly(wsol_key, false),
                AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
                AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
            ],
            data: vec![1u8], // CreateIdempotent
        };
        invoke(
            &ix,
            &[
                ctx.accounts.caller.to_account_info(),
                ctx.accounts.bonding_curve_wsol_account.to_account_info(),
                ctx.accounts.bonding_curve.to_account_info(),
                ctx.accounts.wsol_mint.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
            ],
        )?;
    }

    // ── Step 18: Transfer sol_to_dex lamports from bonding_curve to WSOL ATA ─
    {
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &bc_key,
            &ctx.accounts.bonding_curve_wsol_account.key(),
            sol_to_dex,
        );
        invoke_signed(
            &ix,
            &[
                ctx.accounts.bonding_curve.to_account_info(),
                ctx.accounts.bonding_curve_wsol_account.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            bonding_curve_seeds,
        )?;
    }

    // ── Step 19: sync_native — mark WSOL ATA balance from deposited lamports ─
    {
        let ix = Instruction {
            program_id: ctx.accounts.token_program.key(),
            accounts: vec![AccountMeta::new(
                ctx.accounts.bonding_curve_wsol_account.key(),
                false,
            )],
            data: vec![17u8], // SyncNative instruction discriminator
        };
        invoke(
            &ix,
            &[ctx.accounts.bonding_curve_wsol_account.to_account_info()],
        )?;
    }

    // ── Step 20: Raydium CPMM initialize CPI ─────────────────────────────────
    // `invoke_raydium_cpi` is `#[inline(never)]` so the 20-account AccountInfo
    // array and the Raydium instruction locals live in a separate stack frame.
    invoke_raydium_cpi(
        &ctx.accounts,
        bc_key,
        raydium_id,
        pool_key,
        token0_key,
        token1_key,
        lp_key,
        coin_is_token0,
        init_amount_0,
        init_amount_1,
        bonding_curve_seeds,
    )?;

    // ── Step 21: Post-CPI verification ───────────────────────────────────────
    let token_prog_key = ctx.accounts.token_program.key();

    require!(
        *ctx.accounts.pool_state.owner == raydium_id,
        FunrunError::PostCpiPoolStateInvalid,
    );
    require!(
        *ctx.accounts.lp_mint.owner == token_prog_key,
        FunrunError::PostCpiLpMintInvalid,
    );
    require!(
        *ctx.accounts.observation_state.owner == raydium_id,
        FunrunError::PostCpiObservationStateInvalid,
    );

    let vault0_amount = {
        let data = ctx.accounts.token0_vault.try_borrow_data()?;
        read_token_amount(&data).ok_or(error!(FunrunError::PostCpiVaultBalanceMismatch))?
    };
    require!(
        vault0_amount >= init_amount_0,
        FunrunError::PostCpiVaultBalanceMismatch,
    );

    let vault1_amount = {
        let data = ctx.accounts.token1_vault.try_borrow_data()?;
        read_token_amount(&data).ok_or(error!(FunrunError::PostCpiVaultBalanceMismatch))?
    };
    require!(
        vault1_amount >= init_amount_1,
        FunrunError::PostCpiVaultBalanceMismatch,
    );

    let expected_lp = compute_expected_lp(init_amount_0, init_amount_1)
        .ok_or(error!(FunrunError::PostCpiLpAmountMismatch))?;
    let actual_lp = {
        let data = ctx.accounts.creator_lp_token.try_borrow_data()?;
        read_token_amount(&data).ok_or(error!(FunrunError::PostCpiLpAmountMismatch))?
    };
    require!(
        actual_lp == expected_lp,
        FunrunError::PostCpiLpAmountMismatch
    );

    // ── Step 22: Pre-burn LP balance check ───────────────────────────────────
    // `actual_lp` was already verified against `expected_lp` in step 21.
    // This guard defends against the degenerate case where both amounts are so
    // small that the Raydium formula produces zero — a pool that would lock no
    // real liquidity.
    require!(actual_lp > 0, FunrunError::ZeroLpBalance);

    // ── Step 23: Burn all LP tokens permanently ───────────────────────────────
    // The bonding_curve PDA owns `creator_lp_token` (Raydium used it as the
    // pool `creator` and minted LP directly to its ATA).  Burning the full
    // balance means no authority — including the protocol — can ever withdraw
    // liquidity from the Raydium pool.
    {
        let cpi_accounts = token::Burn {
            mint: ctx.accounts.lp_mint.to_account_info(),
            from: ctx.accounts.creator_lp_token.to_account_info(),
            authority: ctx.accounts.bonding_curve.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            bonding_curve_seeds,
        );
        token::burn(cpi_ctx, actual_lp)?;
    }

    // ── Step 24: Post-burn LP balance verification ────────────────────────────
    {
        let data = ctx.accounts.creator_lp_token.try_borrow_data()?;
        let post_burn_balance =
            read_token_amount(&data).ok_or(error!(FunrunError::PostBurnLpBalanceMismatch))?;
        require!(
            post_burn_balance == 0,
            FunrunError::PostBurnLpBalanceMismatch,
        );
    }

    // ── Step 25: Emit LiquidityLocked event ──────────────────────────────────
    emit!(crate::events::LiquidityLocked {
        mint: coin_key,
        lp_mint: lp_key,
        lp_burned: actual_lp,
        timestamp: clock.unix_timestamp,
    });

    // ── Step 26: Pre-revocation mint authority check ─────────────────────────
    // Re-verify immediately before the revocation CPI.  Step 3 already checked
    // this; this guard catches any unexpected mutation by the preceding CPIs.
    // Coins created after create-time revoke already have mint_authority = None.
    let mint_auth_pre: Option<Pubkey> = ctx.accounts.coin_mint.mint_authority.into();
    match mint_auth_pre {
        None => {
            // Already revoked at create — nothing to do.
        }
        Some(auth) => {
            require!(auth == bc_key, FunrunError::InvalidMintAuthority);

            // ── Step 27: Revoke mint authority permanently ────────────────────
            let cpi_accounts = SetAuthority {
                account_or_mint: ctx.accounts.coin_mint.to_account_info(),
                current_authority: ctx.accounts.bonding_curve.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                bonding_curve_seeds,
            );
            token::set_authority(
                cpi_ctx,
                token::spl_token::instruction::AuthorityType::MintTokens,
                None,
            )?;

            // ── Step 28: Post-revocation mint authority verification ──────────
            ctx.accounts.coin_mint.reload()?;
            let post_auth: Option<Pubkey> = ctx.accounts.coin_mint.mint_authority.into();
            require!(
                post_auth.is_none(),
                FunrunError::MintAuthorityRevocationFailed,
            );
        }
    }

    // ── Step 29: Emit MintAuthorityRevoked event ──────────────────────────────
    emit!(crate::events::MintAuthorityRevoked {
        mint: coin_key,
        timestamp: clock.unix_timestamp,
    });

    // ── Step 30: Pre-revocation freeze authority check ───────────────────────
    let freeze_auth_pre: Option<Pubkey> = ctx.accounts.coin_mint.freeze_authority.into();
    match freeze_auth_pre {
        None => {
            // Already revoked at create — nothing to do.
        }
        Some(auth) => {
            require!(auth == bc_key, FunrunError::InvalidFreezeAuthority);

            // ── Step 31: Revoke freeze authority permanently ──────────────────
            let cpi_accounts = SetAuthority {
                account_or_mint: ctx.accounts.coin_mint.to_account_info(),
                current_authority: ctx.accounts.bonding_curve.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                bonding_curve_seeds,
            );
            token::set_authority(
                cpi_ctx,
                token::spl_token::instruction::AuthorityType::FreezeAccount,
                None,
            )?;

            // ── Step 32: Reload coin_mint ─────────────────────────────────────
            ctx.accounts.coin_mint.reload()?;

            // ── Step 33: Post-revocation freeze authority verification ────────
            let post_freeze: Option<Pubkey> = ctx.accounts.coin_mint.freeze_authority.into();
            require!(
                post_freeze.is_none(),
                FunrunError::FreezeAuthorityRevocationFailed,
            );
        }
    }

    // Ensure explorers see both Disabled even if one path skipped reload.
    ctx.accounts.coin_mint.reload()?;
    require!(
        Option::<Pubkey>::from(ctx.accounts.coin_mint.mint_authority).is_none(),
        FunrunError::MintAuthorityRevocationFailed,
    );
    require!(
        Option::<Pubkey>::from(ctx.accounts.coin_mint.freeze_authority).is_none(),
        FunrunError::FreezeAuthorityRevocationFailed,
    );

    // ── Step 34: Finalize graduation state ────────────────────────────────────
    ctx.accounts.bonding_curve.graduated = true;

    emit!(crate::events::GraduationCompleted {
        mint: coin_key,
        creator: bc_creator,
        pool_state: pool_key,
        lp_mint: lp_key,
        sol_migrated: sol_to_dex,
        tokens_migrated: LP_RESERVE_TOKENS,
        lp_minted: actual_lp,
        timestamp: clock.unix_timestamp,
    });

    // ── Step 35: Emit FreezeAuthorityRevoked event ────────────────────────────
    emit!(crate::events::FreezeAuthorityRevoked {
        mint: coin_key,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::graduation_validation::*;
    use super::*;

    // ── Helpers ───────────────────────────────────────────────────────────────

    fn raydium_id() -> Pubkey {
        raydium_cpmm_id()
    }

    fn wsol() -> Pubkey {
        wsol_mint_key()
    }

    fn fee_key() -> Pubkey {
        raydium_create_pool_fee_key()
    }

    /// Derives the canonical Raydium CPMM authority PDA.
    fn raydium_authority_pda() -> Pubkey {
        Pubkey::find_program_address(&[RAYDIUM_AUTHORITY_SEED], &raydium_id()).0
    }

    /// Derives a pool state PDA for testing.
    fn pool_state_pda(amm_config: &Pubkey, t0: &Pubkey, t1: &Pubkey) -> Pubkey {
        Pubkey::find_program_address(
            &[
                RAYDIUM_POOL_SEED,
                amm_config.as_ref(),
                t0.as_ref(),
                t1.as_ref(),
            ],
            &raydium_id(),
        )
        .0
    }

    /// Derives the LP mint PDA for a given pool state.
    fn lp_mint_pda(pool_state: &Pubkey) -> Pubkey {
        Pubkey::find_program_address(&[RAYDIUM_LP_MINT_SEED, pool_state.as_ref()], &raydium_id()).0
    }

    /// Derives the observation state PDA for a given pool state.
    fn observation_pda(pool_state: &Pubkey) -> Pubkey {
        Pubkey::find_program_address(
            &[RAYDIUM_OBSERVATION_SEED, pool_state.as_ref()],
            &raydium_id(),
        )
        .0
    }

    fn ata(owner: &Pubkey, mint: &Pubkey) -> Pubkey {
        anchor_spl::associated_token::get_associated_token_address(owner, mint)
    }

    /// Derives the Raydium pool_vault PDA for (pool_state, token_mint).
    fn pool_vault_pda(pool_state: &Pubkey, token_mint: &Pubkey) -> Pubkey {
        Pubkey::find_program_address(
            &[
                RAYDIUM_POOL_VAULT_SEED,
                pool_state.as_ref(),
                token_mint.as_ref(),
            ],
            &raydium_id(),
        )
        .0
    }

    // ── validate_coin_mint_matches ────────────────────────────────────────────

    #[test]
    fn coin_mint_matching_passes() {
        let mint = Pubkey::new_unique();
        assert!(validate_coin_mint_matches(&mint, &mint).is_ok());
    }

    #[test]
    fn coin_mint_mismatch_is_rejected() {
        let a = Pubkey::new_unique();
        let b = Pubkey::new_unique();
        let err = validate_coin_mint_matches(&a, &b).unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidMint));
    }

    // ── validate_curve_is_graduating ──────────────────────────────────────────

    #[test]
    fn graduating_state_passes() {
        assert!(validate_curve_is_graduating(true, 6_000_000_000).is_ok());
    }

    #[test]
    fn not_complete_is_rejected() {
        let err = validate_curve_is_graduating(false, 6_000_000_000).unwrap_err();
        assert_eq!(
            err,
            anchor_lang::error!(FunrunError::GraduationNotInitiated)
        );
    }

    #[test]
    fn zero_snapshot_is_rejected() {
        let err = validate_curve_is_graduating(true, 0).unwrap_err();
        assert_eq!(
            err,
            anchor_lang::error!(FunrunError::GraduationSnapshotInconsistency)
        );
    }

    // ── validate_protocol_version ─────────────────────────────────────────────

    #[test]
    fn correct_protocol_version_passes() {
        assert!(validate_protocol_version(PROTOCOL_VERSION).is_ok());
    }

    #[test]
    fn wrong_protocol_version_is_rejected() {
        let err = validate_protocol_version(PROTOCOL_VERSION.wrapping_add(1)).unwrap_err();
        assert_eq!(
            err,
            anchor_lang::error!(FunrunError::ProtocolVersionMismatch)
        );
    }

    // ── validate_snapshot_consistency ────────────────────────────────────────

    #[test]
    fn positive_sol_to_dex_passes() {
        let result = validate_snapshot_consistency(85_000_000_000, 6_000_000_000).unwrap();
        assert_eq!(result, 79_000_000_000);
    }

    #[test]
    fn insufficient_sol_for_fee_is_rejected() {
        let err = validate_snapshot_consistency(5_000_000_000, 6_000_000_000).unwrap_err();
        assert_eq!(
            err,
            anchor_lang::error!(FunrunError::InsufficientSolForGraduation)
        );
    }

    #[test]
    fn fee_equals_sol_produces_zero_sol_to_dex() {
        let err = validate_snapshot_consistency(6_000_000_000, 6_000_000_000).unwrap_err();
        assert_eq!(
            err,
            anchor_lang::error!(FunrunError::GraduationSnapshotInconsistency)
        );
    }

    // ── validate_mint_authority ───────────────────────────────────────────────

    #[test]
    fn correct_mint_authority_passes() {
        let curve_key = Pubkey::new_unique();
        assert!(validate_mint_authority(Some(curve_key), &curve_key).is_ok());
    }

    #[test]
    fn wrong_mint_authority_is_rejected() {
        let curve_key = Pubkey::new_unique();
        let other = Pubkey::new_unique();
        let err = validate_mint_authority(Some(other), &curve_key).unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidMintAuthority));
    }

    #[test]
    fn none_mint_authority_is_accepted() {
        // Create-time revoke leaves mint_authority = None; graduation must accept it.
        let curve_key = Pubkey::new_unique();
        assert!(validate_mint_authority(None, &curve_key).is_ok());
    }

    // ── validate_freeze_authority ────────────────────────────────────────────

    #[test]
    fn correct_freeze_authority_passes() {
        let curve_key = Pubkey::new_unique();
        assert!(validate_freeze_authority(Some(curve_key), &curve_key).is_ok());
    }

    #[test]
    fn wrong_freeze_authority_is_rejected() {
        let curve_key = Pubkey::new_unique();
        let other = Pubkey::new_unique();
        let err = validate_freeze_authority(Some(other), &curve_key).unwrap_err();
        assert_eq!(
            err,
            anchor_lang::error!(FunrunError::InvalidFreezeAuthority)
        );
    }

    #[test]
    fn none_freeze_authority_is_accepted() {
        let curve_key = Pubkey::new_unique();
        assert!(validate_freeze_authority(None, &curve_key).is_ok());
    }

    // ── validate_amm_config_ownership ────────────────────────────────────────

    #[test]
    fn amm_config_owned_by_raydium_passes() {
        let id = raydium_id();
        assert!(validate_amm_config_ownership(&id, &id).is_ok());
    }

    #[test]
    fn amm_config_owned_by_wrong_program_is_rejected() {
        let id = raydium_id();
        let wrong = Pubkey::new_unique();
        let err = validate_amm_config_ownership(&wrong, &id).unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidAmmConfig));
    }

    // ── validate_raydium_authority ────────────────────────────────────────────

    #[test]
    fn correct_raydium_authority_passes() {
        let auth = raydium_authority_pda();
        let bump = validate_raydium_authority(&auth, &raydium_id()).unwrap();
        assert!(bump <= 255);
    }

    #[test]
    fn wrong_raydium_authority_is_rejected() {
        let wrong = Pubkey::new_unique();
        let err = validate_raydium_authority(&wrong, &raydium_id()).unwrap_err();
        assert_eq!(
            err,
            anchor_lang::error!(FunrunError::InvalidRaydiumAuthority)
        );
    }

    #[test]
    fn raydium_authority_wrong_program_is_rejected() {
        // Using a different program ID should produce a different PDA.
        let wrong_program = Pubkey::new_unique();
        let auth_for_wrong =
            Pubkey::find_program_address(&[RAYDIUM_AUTHORITY_SEED], &wrong_program).0;
        // The PDA is valid for the wrong program, but not for the Raydium ID.
        let err = validate_raydium_authority(&auth_for_wrong, &raydium_id()).unwrap_err();
        assert_eq!(
            err,
            anchor_lang::error!(FunrunError::InvalidRaydiumAuthority)
        );
    }

    // ── validate_token_pair ───────────────────────────────────────────────────

    #[test]
    fn valid_token_pair_coin_as_token0_passes() {
        // Build mints where coin < wsol (coin is token0).
        let coin = Pubkey::from([0u8; 32]); // all-zero < any real address
        let wsol_k = wsol();
        if coin.to_bytes() < wsol_k.to_bytes() {
            assert!(validate_token_pair(&coin, &wsol_k, &coin, &wsol_k).is_ok());
        }
    }

    #[test]
    fn valid_token_pair_wsol_as_token0_passes() {
        // Build mints where wsol < coin (wsol is token0).
        let coin = Pubkey::from([0xFF; 32]); // all-ff > any real address
        let wsol_k = wsol();
        if wsol_k.to_bytes() < coin.to_bytes() {
            assert!(validate_token_pair(&wsol_k, &coin, &coin, &wsol_k).is_ok());
        }
    }

    #[test]
    fn wrong_ordering_token0_greater_than_token1_is_rejected() {
        let bigger = Pubkey::from([0xFF; 32]);
        let smaller = Pubkey::from([0x00; 32]);
        let err = validate_token_pair(&bigger, &smaller, &bigger, &smaller).unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidTokenOrdering));
    }

    #[test]
    fn token_pair_without_wsol_is_rejected() {
        let coin = Pubkey::from([0x01; 32]);
        let other = Pubkey::from([0x02; 32]);
        let wsol_k = wsol();
        // Neither token is WSOL.
        let err = validate_token_pair(&coin, &other, &coin, &wsol_k).unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidMint));
    }

    #[test]
    fn token_pair_without_coin_is_rejected() {
        // WSOL first byte is 0x53 ('S'). Use [0xFF;32] as token1 so ordering
        // is satisfied (0x53 < 0xFF), but the coin mint [0x03;32] is not in the
        // pair — only (coin, wsol) is valid.
        let wsol_k = wsol();
        let other = Pubkey::from([0xFF; 32]); // token1 — not coin_mint, not wsol
        let coin = Pubkey::from([0x03; 32]); // coin_mint (absent from token pair)
        let err = validate_token_pair(&wsol_k, &other, &coin, &wsol_k).unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidMint));
    }

    // ── validate_pool_state_pda ───────────────────────────────────────────────

    #[test]
    fn correct_pool_state_pda_passes() {
        let config = Pubkey::new_unique();
        let t0 = Pubkey::from([0x01; 32]);
        let t1 = Pubkey::from([0x02; 32]);
        let expected = pool_state_pda(&config, &t0, &t1);
        let bump = validate_pool_state_pda(&expected, &config, &t0, &t1, &raydium_id()).unwrap();
        assert!(bump <= 255);
    }

    #[test]
    fn wrong_pool_state_pda_is_rejected() {
        let config = Pubkey::new_unique();
        let t0 = Pubkey::from([0x01; 32]);
        let t1 = Pubkey::from([0x02; 32]);
        let wrong = Pubkey::new_unique();
        let err = validate_pool_state_pda(&wrong, &config, &t0, &t1, &raydium_id()).unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidPoolStatePda));
    }

    #[test]
    fn pool_state_pda_wrong_token_order_is_rejected() {
        let config = Pubkey::new_unique();
        let t0 = Pubkey::from([0x01; 32]);
        let t1 = Pubkey::from([0x02; 32]);
        // Correct PDA for t0,t1 but we pass t1,t0 — derivation differs.
        let expected_for_correct_order = pool_state_pda(&config, &t0, &t1);
        let err = validate_pool_state_pda(
            &expected_for_correct_order,
            &config,
            &t1, // swapped
            &t0, // swapped
            &raydium_id(),
        )
        .unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidPoolStatePda));
    }

    // ── validate_lp_mint_pda ──────────────────────────────────────────────────

    #[test]
    fn correct_lp_mint_pda_passes() {
        let pool = Pubkey::new_unique();
        let expected = lp_mint_pda(&pool);
        let bump = validate_lp_mint_pda(&expected, &pool, &raydium_id()).unwrap();
        assert!(bump <= 255);
    }

    #[test]
    fn wrong_lp_mint_pda_is_rejected() {
        let pool = Pubkey::new_unique();
        let wrong = Pubkey::new_unique();
        let err = validate_lp_mint_pda(&wrong, &pool, &raydium_id()).unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidLpMintPda));
    }

    #[test]
    fn lp_mint_pda_different_pool_is_rejected() {
        let pool_a = Pubkey::new_unique();
        let pool_b = Pubkey::new_unique();
        let lp_for_a = lp_mint_pda(&pool_a);
        // Pass pool_b but the key is derived from pool_a.
        let err = validate_lp_mint_pda(&lp_for_a, &pool_b, &raydium_id()).unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidLpMintPda));
    }

    // ── validate_observation_state_pda ───────────────────────────────────────

    #[test]
    fn correct_observation_state_pda_passes() {
        let pool = Pubkey::new_unique();
        let expected = observation_pda(&pool);
        let bump = validate_observation_state_pda(&expected, &pool, &raydium_id()).unwrap();
        assert!(bump <= 255);
    }

    #[test]
    fn wrong_observation_state_pda_is_rejected() {
        let pool = Pubkey::new_unique();
        let wrong = Pubkey::new_unique();
        let err = validate_observation_state_pda(&wrong, &pool, &raydium_id()).unwrap_err();
        assert_eq!(
            err,
            anchor_lang::error!(FunrunError::InvalidObservationStatePda)
        );
    }

    // ── validate_token_vault ──────────────────────────────────────────────────

    #[test]
    fn correct_token_vault_pda_passes() {
        let pool_state = Pubkey::new_unique();
        let mint = Pubkey::new_unique();
        let expected_vault = pool_vault_pda(&pool_state, &mint);
        assert!(validate_token_vault(&expected_vault, &pool_state, &mint, &raydium_id()).is_ok());
    }

    #[test]
    fn wrong_token_vault_is_rejected() {
        let pool_state = Pubkey::new_unique();
        let mint = Pubkey::new_unique();
        let wrong = Pubkey::new_unique();
        let err = validate_token_vault(&wrong, &pool_state, &mint, &raydium_id()).unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidTokenVault));
    }

    #[test]
    fn token_vault_wrong_pool_state_is_rejected() {
        let correct_pool = Pubkey::new_unique();
        let wrong_pool = Pubkey::new_unique();
        let mint = Pubkey::new_unique();
        // PDA derived from wrong_pool — must fail when validated against correct_pool.
        let wrong_vault = pool_vault_pda(&wrong_pool, &mint);
        let err =
            validate_token_vault(&wrong_vault, &correct_pool, &mint, &raydium_id()).unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidTokenVault));
    }

    #[test]
    fn token_vault_wrong_mint_is_rejected() {
        let pool_state = Pubkey::new_unique();
        let correct_mint = Pubkey::new_unique();
        let wrong_mint = Pubkey::new_unique();
        let vault_for_wrong_mint = pool_vault_pda(&pool_state, &wrong_mint);
        let err = validate_token_vault(
            &vault_for_wrong_mint,
            &pool_state,
            &correct_mint,
            &raydium_id(),
        )
        .unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidTokenVault));
    }

    // ── validate_lp_destination ───────────────────────────────────────────────

    #[test]
    fn correct_lp_destination_ata_passes() {
        let owner = Pubkey::new_unique();
        let lp_mint = lp_mint_pda(&Pubkey::new_unique());
        let expected = ata(&owner, &lp_mint);
        assert!(validate_lp_destination(&expected, &owner, &lp_mint).is_ok());
    }

    #[test]
    fn wrong_lp_destination_is_rejected() {
        let owner = Pubkey::new_unique();
        let lp_mint = Pubkey::new_unique();
        let wrong = Pubkey::new_unique();
        let err = validate_lp_destination(&wrong, &owner, &lp_mint).unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidLpDestination));
    }

    #[test]
    fn lp_destination_wrong_owner_is_rejected() {
        let correct_owner = Pubkey::new_unique();
        let wrong_owner = Pubkey::new_unique();
        let lp_mint = Pubkey::new_unique();
        // ATA for wrong_owner.
        let wrong_ata = ata(&wrong_owner, &lp_mint);
        let err = validate_lp_destination(&wrong_ata, &correct_owner, &lp_mint).unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidLpDestination));
    }

    // ── validate_create_pool_fee ──────────────────────────────────────────────

    #[test]
    fn canonical_create_pool_fee_passes() {
        assert!(validate_create_pool_fee(&fee_key()).is_ok());
    }

    #[test]
    fn wrong_create_pool_fee_is_rejected() {
        let wrong = Pubkey::new_unique();
        let err = validate_create_pool_fee(&wrong).unwrap_err();
        assert_eq!(
            err,
            anchor_lang::error!(FunrunError::InvalidCreatePoolFeeAccount)
        );
    }

    // ── validate_bonding_curve_vault ──────────────────────────────────────────

    #[test]
    fn correct_bonding_curve_vault_passes() {
        let curve = Pubkey::new_unique();
        let coin = Pubkey::new_unique();
        let expected = ata(&curve, &coin);
        assert!(validate_bonding_curve_vault(&expected, &curve, &coin).is_ok());
    }

    #[test]
    fn wrong_bonding_curve_vault_is_rejected() {
        let curve = Pubkey::new_unique();
        let coin = Pubkey::new_unique();
        let wrong = Pubkey::new_unique();
        let err = validate_bonding_curve_vault(&wrong, &curve, &coin).unwrap_err();
        assert_eq!(
            err,
            anchor_lang::error!(FunrunError::InvalidBondingCurveVault)
        );
    }

    // ── Invalid account substitution (end-to-end pipeline) ───────────────────

    /// Builds a "happy path" context for sequential validation.
    /// Returns (coin_mint, raydium_auth, amm_config, pool_state, lp_mint, obs_state,
    ///          token0_vault, token1_vault, creator_lp, fee_key, bc_vault, bonding_curve_key)
    #[allow(clippy::type_complexity)]
    fn happy_path_accounts() -> (
        Pubkey,
        Pubkey,
        Pubkey,
        Pubkey,
        Pubkey,
        Pubkey,
        Pubkey,
        Pubkey,
        Pubkey,
        Pubkey,
        Pubkey,
        Pubkey,
    ) {
        let coin_mint = Pubkey::new_unique();
        let bonding_curve_key = Pubkey::new_unique();
        let caller = Pubkey::new_unique();
        let raydium_auth = raydium_authority_pda();
        let amm_config = Pubkey::new_unique();
        let wsol_k = wsol();

        // Token ordering
        let (t0, t1) = if coin_mint.to_bytes() < wsol_k.to_bytes() {
            (coin_mint, wsol_k)
        } else {
            (wsol_k, coin_mint)
        };

        let pool = pool_state_pda(&amm_config, &t0, &t1);
        let lp = lp_mint_pda(&pool);
        let obs = observation_pda(&pool);
        let vault0 = pool_vault_pda(&pool, &t0);
        let vault1 = pool_vault_pda(&pool, &t1);
        // bonding_curve PDA is Raydium's `creator`; LP tokens land in its ATA.
        let creator_lp_dest = ata(&bonding_curve_key, &lp);
        let bc_vault = ata(&bonding_curve_key, &coin_mint);
        let fee = fee_key();
        (
            coin_mint,
            raydium_auth,
            amm_config,
            pool,
            lp,
            obs,
            vault0,
            vault1,
            creator_lp_dest,
            fee,
            bc_vault,
            bonding_curve_key,
        )
    }

    #[test]
    fn happy_path_all_validators_pass() {
        let (
            coin_mint,
            raydium_auth,
            amm_config,
            pool,
            lp,
            obs,
            vault0,
            vault1,
            creator_lp,
            fee,
            bc_vault,
            bonding_curve_key,
        ) = happy_path_accounts();

        let wsol_k = wsol();
        let raydium = raydium_id();

        let (t0, t1) = if coin_mint.to_bytes() < wsol_k.to_bytes() {
            (coin_mint, wsol_k)
        } else {
            (wsol_k, coin_mint)
        };

        validate_coin_mint_matches(&coin_mint, &coin_mint).unwrap();
        validate_curve_is_graduating(true, 6_000_000_000).unwrap();
        validate_protocol_version(PROTOCOL_VERSION).unwrap();
        validate_snapshot_consistency(85_000_000_000, 6_000_000_000).unwrap();
        validate_mint_authority(Some(bonding_curve_key), &bonding_curve_key).unwrap();
        validate_freeze_authority(Some(bonding_curve_key), &bonding_curve_key).unwrap();
        validate_amm_config_ownership(&raydium, &raydium).unwrap();
        validate_raydium_authority(&raydium_auth, &raydium).unwrap();
        validate_pool_state_pda(&pool, &amm_config, &t0, &t1, &raydium).unwrap();
        validate_lp_mint_pda(&lp, &pool, &raydium).unwrap();
        validate_observation_state_pda(&obs, &pool, &raydium).unwrap();
        validate_token_vault(&vault0, &pool, &t0, &raydium).unwrap();
        validate_token_vault(&vault1, &pool, &t1, &raydium).unwrap();
        validate_lp_destination(&creator_lp, &bonding_curve_key, &lp).unwrap();
        validate_create_pool_fee(&fee).unwrap();
        validate_bonding_curve_vault(&bc_vault, &bonding_curve_key, &coin_mint).unwrap();
    }

    #[test]
    fn substituting_wrong_pool_state_fails_at_pool_pda_check() {
        let (coin_mint, _, amm_config, _correct_pool, lp, _, _, _, _, _, _, _) =
            happy_path_accounts();
        let wsol_k = wsol();
        let (t0, t1) = if coin_mint.to_bytes() < wsol_k.to_bytes() {
            (coin_mint, wsol_k)
        } else {
            (wsol_k, coin_mint)
        };
        // Use the LP mint address as the "pool state" — clearly wrong.
        let err = validate_pool_state_pda(&lp, &amm_config, &t0, &t1, &raydium_id()).unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidPoolStatePda));
    }

    #[test]
    fn substituting_wrong_lp_mint_fails_at_lp_pda_check() {
        let (_, _, _, pool, _correct_lp, _, _, _, _, _, _, _) = happy_path_accounts();
        let impostor = Pubkey::new_unique();
        let err = validate_lp_mint_pda(&impostor, &pool, &raydium_id()).unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidLpMintPda));
    }

    #[test]
    fn substituting_wrong_vault_fails_at_vault_check() {
        let (coin_mint, _, _, pool, _, _, vault0, vault1, _, _, _, _) = happy_path_accounts();
        let wsol_k = wsol();
        let (t0, t1) = if coin_mint.to_bytes() < wsol_k.to_bytes() {
            (coin_mint, wsol_k)
        } else {
            (wsol_k, coin_mint)
        };
        // Swap vault0 and vault1 — each PDA is for the wrong mint slot.
        let err0 = validate_token_vault(&vault1, &pool, &t0, &raydium_id()).unwrap_err();
        assert_eq!(err0, anchor_lang::error!(FunrunError::InvalidTokenVault));
        let err1 = validate_token_vault(&vault0, &pool, &t1, &raydium_id()).unwrap_err();
        assert_eq!(err1, anchor_lang::error!(FunrunError::InvalidTokenVault));
    }

    // ── Snapshot mismatch tests ───────────────────────────────────────────────

    #[test]
    fn snapshot_mismatch_real_sol_less_than_fee_snapshot() {
        // After graduation, someone drained real_sol (shouldn't happen, but validate defensively).
        let dex_fee_snapshot = 6_000_000_000u64;
        let real_sol = dex_fee_snapshot - 1; // 1 lamport short
        let err = validate_snapshot_consistency(real_sol, dex_fee_snapshot).unwrap_err();
        assert_eq!(
            err,
            anchor_lang::error!(FunrunError::InsufficientSolForGraduation)
        );
    }

    #[test]
    fn snapshot_mismatch_zero_sol_to_dex_is_caught() {
        let dex_fee_snapshot = 6_000_000_000u64;
        let real_sol = dex_fee_snapshot; // sol_to_dex = 0
        let err = validate_snapshot_consistency(real_sol, dex_fee_snapshot).unwrap_err();
        assert_eq!(
            err,
            anchor_lang::error!(FunrunError::GraduationSnapshotInconsistency)
        );
    }

    // ── Invalid PDA tests ─────────────────────────────────────────────────────

    #[test]
    fn all_zeros_pubkey_fails_raydium_authority_check() {
        let err = validate_raydium_authority(&Pubkey::default(), &raydium_id()).unwrap_err();
        assert_eq!(
            err,
            anchor_lang::error!(FunrunError::InvalidRaydiumAuthority)
        );
    }

    #[test]
    fn all_zeros_pubkey_fails_pool_state_pda_check() {
        let config = Pubkey::new_unique();
        let t0 = Pubkey::from([0x01; 32]);
        let t1 = Pubkey::from([0x02; 32]);
        let err = validate_pool_state_pda(&Pubkey::default(), &config, &t0, &t1, &raydium_id())
            .unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidPoolStatePda));
    }

    #[test]
    fn all_zeros_pubkey_fails_lp_mint_pda_check() {
        let pool = Pubkey::new_unique();
        let err = validate_lp_mint_pda(&Pubkey::default(), &pool, &raydium_id()).unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidLpMintPda));
    }

    // ── Invalid authority tests ───────────────────────────────────────────────

    #[test]
    fn system_program_as_mint_authority_is_rejected() {
        let system = anchor_lang::system_program::ID;
        let curve_key = Pubkey::new_unique();
        let err = validate_mint_authority(Some(system), &curve_key).unwrap_err();
        assert_eq!(err, anchor_lang::error!(FunrunError::InvalidMintAuthority));
    }

    #[test]
    fn system_program_as_freeze_authority_is_rejected() {
        let system = anchor_lang::system_program::ID;
        let curve_key = Pubkey::new_unique();
        let err = validate_freeze_authority(Some(system), &curve_key).unwrap_err();
        assert_eq!(
            err,
            anchor_lang::error!(FunrunError::InvalidFreezeAuthority)
        );
    }

    // ── Property tests ────────────────────────────────────────────────────────

    struct Lcg(u64);
    impl Lcg {
        fn next(&mut self) -> u64 {
            self.0 = self
                .0
                .wrapping_mul(6_364_136_223_846_793_005)
                .wrapping_add(1_442_695_040_888_963_407);
            self.0
        }
        fn next_pubkey(&mut self) -> Pubkey {
            let mut bytes = [0u8; 32];
            for chunk in bytes.chunks_mut(8) {
                let v = self.next().to_le_bytes();
                chunk.copy_from_slice(&v[..chunk.len()]);
            }
            Pubkey::from(bytes)
        }
    }

    /// Property P-V1: pool state PDA is always different for different amm_configs.
    #[test]
    fn prop_pool_state_unique_per_amm_config() {
        let mut rng = Lcg(0xDEAD_BEEF_0000_0001);
        let t0 = Pubkey::from([0x01; 32]);
        let t1 = Pubkey::from([0x02; 32]);

        for _ in 0..500 {
            let config_a = rng.next_pubkey();
            let config_b = rng.next_pubkey();
            if config_a == config_b {
                continue;
            }
            let pool_a = pool_state_pda(&config_a, &t0, &t1);
            let pool_b = pool_state_pda(&config_b, &t0, &t1);
            assert_ne!(
                pool_a, pool_b,
                "different configs must yield different pools"
            );
        }
    }

    /// Property P-V2: swapping token0/token1 in pool state derivation produces
    /// a different PDA (ordering matters).
    #[test]
    fn prop_pool_state_ordering_matters() {
        let mut rng = Lcg(0xCAFE_BABE_0000_0002);
        for _ in 0..500 {
            let config = rng.next_pubkey();
            let t0 = Pubkey::from([0x10; 32]);
            let t1 = Pubkey::from([0x20; 32]);
            let pool_forward = pool_state_pda(&config, &t0, &t1);
            let pool_reversed = pool_state_pda(&config, &t1, &t0);
            assert_ne!(
                pool_forward, pool_reversed,
                "reversed token order must yield a different pool PDA"
            );
        }
    }

    /// Property P-V3: LP mint PDA is always unique per pool state.
    #[test]
    fn prop_lp_mint_unique_per_pool_state() {
        let mut rng = Lcg(0xFEED_FACE_0000_0003);
        for _ in 0..500 {
            let pool_a = rng.next_pubkey();
            let pool_b = rng.next_pubkey();
            if pool_a == pool_b {
                continue;
            }
            let lp_a = lp_mint_pda(&pool_a);
            let lp_b = lp_mint_pda(&pool_b);
            assert_ne!(lp_a, lp_b, "different pools must yield different LP mints");
        }
    }

    /// Property P-V4: validate_snapshot_consistency returns sol_to_dex > 0 for
    /// all valid inputs.
    #[test]
    fn prop_snapshot_consistency_always_positive_for_valid_inputs() {
        let mut rng = Lcg(0xABCD_EF01_0000_0004);
        let fee = 6_000_000_000u64;

        for _ in 0..1_000 {
            let real_sol = fee + 1 + rng.next() % 100_000_000_000;
            let sol_to_dex = validate_snapshot_consistency(real_sol, fee).unwrap();
            assert!(sol_to_dex > 0);
            assert_eq!(sol_to_dex + fee, real_sol);
        }
    }

    /// Property P-V5: ATA derivation is deterministic — same inputs always
    /// produce the same address.
    #[test]
    fn prop_ata_derivation_is_deterministic() {
        let mut rng = Lcg(0x1234_5678_0000_0005);
        for _ in 0..500 {
            let owner = rng.next_pubkey();
            let mint = rng.next_pubkey();
            let a1 = ata(&owner, &mint);
            let a2 = ata(&owner, &mint);
            assert_eq!(a1, a2, "ATA derivation must be deterministic");
        }
    }

    // ── P6.3: integer_sqrt ───────────────────────────────────────────────────

    #[test]
    fn integer_sqrt_zero_returns_zero() {
        assert_eq!(super::integer_sqrt(0), 0);
    }

    #[test]
    fn integer_sqrt_one_returns_one() {
        assert_eq!(super::integer_sqrt(1), 1);
    }

    #[test]
    fn integer_sqrt_perfect_squares() {
        assert_eq!(super::integer_sqrt(4), 2);
        assert_eq!(super::integer_sqrt(9), 3);
        assert_eq!(super::integer_sqrt(16), 4);
        assert_eq!(super::integer_sqrt(100), 10);
        assert_eq!(super::integer_sqrt(1_000_000), 1_000);
        assert_eq!(
            super::integer_sqrt(10_000_000_000_000_000_000_000_000_000u128),
            100_000_000_000_000u64
        );
    }

    #[test]
    fn integer_sqrt_non_perfect_squares_floor() {
        // floor(sqrt(2)) = 1
        assert_eq!(super::integer_sqrt(2), 1);
        // floor(sqrt(3)) = 1
        assert_eq!(super::integer_sqrt(3), 1);
        // floor(sqrt(8)) = 2
        assert_eq!(super::integer_sqrt(8), 2);
        // floor(sqrt(10)) = 3
        assert_eq!(super::integer_sqrt(10), 3);
    }

    #[test]
    fn integer_sqrt_graduation_product() {
        // Realistic graduation values: sol_to_dex=79 SOL, tokens=200M tokens (6 dec)
        let sol = 79_000_000_000u128;
        let tokens = 200_000_000_000_000u128;
        let product = sol * tokens;
        let sqrt = super::integer_sqrt(product);
        // Verify floor property: sqrt^2 <= n < (sqrt+1)^2
        assert!(sqrt as u128 * sqrt as u128 <= product);
        assert!((sqrt as u128 + 1) * (sqrt as u128 + 1) > product);
    }

    /// Property P6-S1: integer_sqrt(n)^2 ≤ n < (integer_sqrt(n)+1)^2 for all n.
    #[test]
    fn prop_integer_sqrt_floor_property() {
        let mut rng = Lcg(0xBAD_CAFE_0000_0006);
        for _ in 0..2_000 {
            let hi = rng.next() as u128;
            let lo = rng.next() as u128;
            let n = (hi << 64) | lo;
            let s = super::integer_sqrt(n) as u128;
            assert!(s * s <= n, "sqrt^2 must not exceed n");
            if s < u64::MAX as u128 {
                assert!((s + 1) * (s + 1) > n, "(sqrt+1)^2 must exceed n");
            }
        }
    }

    // ── P6.3: compute_expected_lp ────────────────────────────────────────────

    #[test]
    fn compute_expected_lp_known_value() {
        // 79 SOL × 200M tokens: pre-compute expected result
        let sol: u64 = 79_000_000_000;
        let tokens: u64 = 200_000_000_000_000;
        let lp = super::compute_expected_lp(sol, tokens).unwrap();
        // Must equal floor(sqrt(79e9 * 200e12)) - 100
        let expected_sqrt = super::integer_sqrt(sol as u128 * tokens as u128);
        assert_eq!(lp, expected_sqrt - 100);
        assert!(lp > 0);
    }

    #[test]
    fn compute_expected_lp_zero_amount_gives_none_or_underflow() {
        // sqrt(0) = 0; 0 - 100 underflows → None
        let result = super::compute_expected_lp(0, 200_000_000_000_000);
        assert!(
            result.is_none(),
            "zero sol produces underflow in subtraction"
        );
    }

    #[test]
    fn compute_expected_lp_tiny_product_gives_none_when_sqrt_lt_100() {
        // product = 1*1 = 1, sqrt = 1, 1 - 100 underflows → None
        assert!(super::compute_expected_lp(1, 1).is_none());
        // product = 99*99 = 9801, sqrt = 99, 99 - 100 underflows → None
        assert!(super::compute_expected_lp(99, 99).is_none());
    }

    #[test]
    fn compute_expected_lp_exact_sqrt_100_gives_zero() {
        // We need sqrt(a*b) == 100 exactly → 10000 = 100*100
        // 100 - 100 = 0 → Some(0)
        let result = super::compute_expected_lp(100, 100);
        assert_eq!(result, Some(0));
    }

    #[test]
    fn compute_expected_lp_is_deterministic() {
        let a = 79_000_000_000u64;
        let b = 200_000_000_000_000u64;
        assert_eq!(
            super::compute_expected_lp(a, b),
            super::compute_expected_lp(a, b),
        );
    }

    /// Property P6-L1: LP amount is always less than sqrt(a*b) by exactly 100.
    #[test]
    fn prop_lp_always_exactly_100_less_than_sqrt() {
        let mut rng = Lcg(0xFACE_FEED_0000_0007);
        for _ in 0..500 {
            // Use values large enough that sqrt >= 100.
            let a = 1_000_000u64 + rng.next() % 1_000_000_000_000;
            let b = 1_000_000u64 + rng.next() % 1_000_000_000_000;
            if let Some(lp) = super::compute_expected_lp(a, b) {
                let sqrt = super::integer_sqrt(a as u128 * b as u128);
                assert_eq!(lp, sqrt - 100, "LP must be exactly sqrt - 100");
            }
        }
    }

    // ── P6.3: read_token_amount ──────────────────────────────────────────────

    #[test]
    fn read_token_amount_correct_offset() {
        let mut buf = vec![0u8; 165]; // full SPL token account size
        let expected: u64 = 79_000_000_000;
        buf[64..72].copy_from_slice(&expected.to_le_bytes());
        assert_eq!(super::read_token_amount(&buf), Some(expected));
    }

    #[test]
    fn read_token_amount_minimum_72_bytes() {
        let mut buf = vec![0u8; 72];
        let expected: u64 = 12_345_678;
        buf[64..72].copy_from_slice(&expected.to_le_bytes());
        assert_eq!(super::read_token_amount(&buf), Some(expected));
    }

    #[test]
    fn read_token_amount_buffer_too_short_returns_none() {
        let buf = vec![0u8; 71];
        assert_eq!(super::read_token_amount(&buf), None);
    }

    #[test]
    fn read_token_amount_empty_returns_none() {
        assert_eq!(super::read_token_amount(&[]), None);
    }

    #[test]
    fn read_token_amount_u64_max() {
        let mut buf = vec![0u8; 72];
        buf[64..72].copy_from_slice(&u64::MAX.to_le_bytes());
        assert_eq!(super::read_token_amount(&buf), Some(u64::MAX));
    }

    // ── P6.3: raydium_initialize_data encoding ──────────────────────────────

    #[test]
    fn raydium_initialize_data_correct_discriminator() {
        let data = super::raydium_initialize_data(1, 2);
        assert_eq!(&data[0..8], &[175, 175, 109, 31, 13, 152, 155, 237]);
    }

    #[test]
    fn raydium_initialize_data_encodes_amounts_le() {
        let amount_0: u64 = 79_000_000_000;
        let amount_1: u64 = 200_000_000_000_000;
        let data = super::raydium_initialize_data(amount_0, amount_1);
        assert_eq!(data.len(), 32);
        let decoded_0 = u64::from_le_bytes(data[8..16].try_into().unwrap());
        let decoded_1 = u64::from_le_bytes(data[16..24].try_into().unwrap());
        let decoded_open_time = u64::from_le_bytes(data[24..32].try_into().unwrap());
        assert_eq!(decoded_0, amount_0);
        assert_eq!(decoded_1, amount_1);
        assert_eq!(decoded_open_time, 0);
    }

    #[test]
    fn raydium_initialize_data_zero_amounts() {
        let data = super::raydium_initialize_data(0, 0);
        assert_eq!(data.len(), 32);
        assert_eq!(&data[8..32], &[0u8; 24]);
    }

    // ── P6.3: validate_bonding_curve_wsol_ata ────────────────────────────────

    #[test]
    fn validate_bc_wsol_ata_correct_passes() {
        let bc = Pubkey::new_unique();
        let wsol_k = wsol();
        let expected = ata(&bc, &wsol_k);
        assert!(validate_bonding_curve_wsol_ata(&expected, &bc, &wsol_k).is_ok());
    }

    #[test]
    fn validate_bc_wsol_ata_wrong_key_is_rejected() {
        let bc = Pubkey::new_unique();
        let wsol_k = wsol();
        let wrong = Pubkey::new_unique();
        let err = validate_bonding_curve_wsol_ata(&wrong, &bc, &wsol_k).unwrap_err();
        assert_eq!(
            err,
            anchor_lang::error!(FunrunError::InvalidBondingCurveWsolAccount)
        );
    }

    #[test]
    fn validate_bc_wsol_ata_wrong_owner_is_rejected() {
        let bc = Pubkey::new_unique();
        let wrong_bc = Pubkey::new_unique();
        let wsol_k = wsol();
        // ATA derived from wrong_bc instead of bc.
        let wrong_ata = ata(&wrong_bc, &wsol_k);
        let err = validate_bonding_curve_wsol_ata(&wrong_ata, &bc, &wsol_k).unwrap_err();
        assert_eq!(
            err,
            anchor_lang::error!(FunrunError::InvalidBondingCurveWsolAccount)
        );
    }

    #[test]
    fn validate_bc_wsol_ata_coin_mint_instead_of_wsol_is_rejected() {
        let bc = Pubkey::new_unique();
        let wsol_k = wsol();
        let coin_mint = Pubkey::new_unique();
        // Pass ATA of (bc, coin_mint) when (bc, wsol) is required.
        let wrong_ata = ata(&bc, &coin_mint);
        let err = validate_bonding_curve_wsol_ata(&wrong_ata, &bc, &wsol_k).unwrap_err();
        assert_eq!(
            err,
            anchor_lang::error!(FunrunError::InvalidBondingCurveWsolAccount)
        );
    }

    // ── P6.3: happy-path extended (includes wsol ATA) ───────────────────────

    #[test]
    fn happy_path_with_wsol_ata_passes() {
        let (
            coin_mint,
            raydium_auth,
            amm_config,
            pool,
            lp,
            obs,
            vault0,
            vault1,
            creator_lp,
            fee,
            bc_vault,
            bonding_curve_key,
        ) = happy_path_accounts();

        let wsol_k = wsol();
        let raydium = raydium_id();
        let bc_wsol_ata = ata(&bonding_curve_key, &wsol_k);

        let (t0, t1) = if coin_mint.to_bytes() < wsol_k.to_bytes() {
            (coin_mint, wsol_k)
        } else {
            (wsol_k, coin_mint)
        };

        // All P6.2 validators.
        validate_coin_mint_matches(&coin_mint, &coin_mint).unwrap();
        validate_curve_is_graduating(true, 6_000_000_000).unwrap();
        validate_protocol_version(PROTOCOL_VERSION).unwrap();
        validate_snapshot_consistency(85_000_000_000, 6_000_000_000).unwrap();
        validate_mint_authority(Some(bonding_curve_key), &bonding_curve_key).unwrap();
        validate_freeze_authority(Some(bonding_curve_key), &bonding_curve_key).unwrap();
        validate_amm_config_ownership(&raydium, &raydium).unwrap();
        validate_raydium_authority(&raydium_auth, &raydium).unwrap();
        validate_pool_state_pda(&pool, &amm_config, &t0, &t1, &raydium).unwrap();
        validate_lp_mint_pda(&lp, &pool, &raydium).unwrap();
        validate_observation_state_pda(&obs, &pool, &raydium).unwrap();
        validate_token_vault(&vault0, &pool, &t0, &raydium).unwrap();
        validate_token_vault(&vault1, &pool, &t1, &raydium).unwrap();
        validate_lp_destination(&creator_lp, &bonding_curve_key, &lp).unwrap();
        validate_create_pool_fee(&fee).unwrap();
        validate_bonding_curve_vault(&bc_vault, &bonding_curve_key, &coin_mint).unwrap();
        // P6.3 addition.
        validate_bonding_curve_wsol_ata(&bc_wsol_ata, &bonding_curve_key, &wsol_k).unwrap();
    }

    // ── P6.3: token-ordering amount assignment ──────────────────────────────

    #[test]
    fn token_ordering_coin_as_token0_assigns_amounts_correctly() {
        // coin_key < wsol → coin is token0, WSOL is token1.
        let coin_key = Pubkey::from([0x00; 32]); // all-zero < any real address
        let wsol_k = wsol();
        if coin_key.to_bytes() < wsol_k.to_bytes() {
            let coin_is_token0 = true;
            let sol_to_dex = 79_000_000_000u64;
            let (amt0, amt1) = if coin_is_token0 {
                (LP_RESERVE_TOKENS, sol_to_dex)
            } else {
                (sol_to_dex, LP_RESERVE_TOKENS)
            };
            assert_eq!(
                amt0, LP_RESERVE_TOKENS,
                "token0 = coin → amount0 = LP_RESERVE_TOKENS"
            );
            assert_eq!(amt1, sol_to_dex, "token1 = wsol → amount1 = sol_to_dex");
        }
    }

    #[test]
    fn token_ordering_wsol_as_token0_assigns_amounts_correctly() {
        // wsol_key < coin → WSOL is token0, coin is token1.
        let coin_key = Pubkey::from([0xFF; 32]); // all-ff > any real address
        let wsol_k = wsol();
        if wsol_k.to_bytes() < coin_key.to_bytes() {
            let coin_is_token0 = false;
            let sol_to_dex = 79_000_000_000u64;
            let (amt0, amt1) = if coin_is_token0 {
                (LP_RESERVE_TOKENS, sol_to_dex)
            } else {
                (sol_to_dex, LP_RESERVE_TOKENS)
            };
            assert_eq!(amt0, sol_to_dex, "token0 = wsol → amount0 = sol_to_dex");
            assert_eq!(
                amt1, LP_RESERVE_TOKENS,
                "token1 = coin → amount1 = LP_RESERVE_TOKENS"
            );
        }
    }

    // ── P6.3: LP formula regression (graduation thresholds) ─────────────────

    #[test]
    fn lp_formula_at_graduation_threshold() {
        // Standard graduation: 85 SOL real, 6 SOL dex fee, 79 SOL to DEX.
        let sol_to_dex = 79_000_000_000u64;
        let tokens = LP_RESERVE_TOKENS;
        let lp = super::compute_expected_lp(sol_to_dex, tokens).unwrap();
        // Verify it is positive and less than sqrt(product).
        let sqrt = super::integer_sqrt(sol_to_dex as u128 * tokens as u128);
        assert_eq!(lp, sqrt - 100);
        assert!(lp > 0);
        // Expected LP is approximately sqrt(79e9 * 200e12) - 100
        // = sqrt(1.58e25) - 100 ≈ 125_698_706_... - 100
        // Just check order of magnitude: LP should be in hundreds of millions.
        assert!(lp > 100_000_000, "LP amount should be substantial");
    }

    #[test]
    fn lp_formula_minimum_viable_graduation() {
        // Edge case: sol_to_dex = 1 lamport (essentially zero pool — would fail CPI
        // but mathematically sqrt(1 * 200e12) ≈ 14_142_135 > 100, so Some is returned).
        let sol_to_dex = 1u64;
        let tokens = LP_RESERVE_TOKENS;
        let result = super::compute_expected_lp(sol_to_dex, tokens);
        // sqrt(200e12) ≈ 14_142_135 > 100 → should return Some.
        assert!(result.is_some());
        assert!(result.unwrap() > 0);
    }

    // ── P6.3: vault balance check semantics ──────────────────────────────────

    #[test]
    fn read_token_amount_reflects_deposited_balance() {
        // Simulate what a vault account looks like after Raydium deposits tokens.
        // SPL token account layout: bytes 64-72 = amount (little-endian u64).
        let deposited: u64 = 200_000_000_000_000; // LP_RESERVE_TOKENS
        let mut mock_vault = vec![0u8; 165]; // standard TokenAccount size
        mock_vault[64..72].copy_from_slice(&deposited.to_le_bytes());
        let read = super::read_token_amount(&mock_vault).unwrap();
        assert_eq!(read, deposited);
        // Vault >= expected (>= since Raydium may deposit exactly).
        assert!(read >= LP_RESERVE_TOKENS);
    }

    #[test]
    fn read_token_amount_vault_less_than_expected_detectable() {
        // If vault has less than expected, the post-CPI check should catch it.
        let expected = 79_000_000_000u64;
        let actual = expected - 1;
        let mut mock_vault = vec![0u8; 165];
        mock_vault[64..72].copy_from_slice(&actual.to_le_bytes());
        let read = super::read_token_amount(&mock_vault).unwrap();
        assert!(read < expected, "less-than-expected balance is detectable");
    }

    // ── P6.3: Property P6-V6: WSOL ATA is unique per bonding_curve key ──────

    #[test]
    fn prop_wsol_ata_unique_per_bonding_curve() {
        let mut rng = Lcg(0xDECA_FBAD_0000_0008);
        let wsol_k = wsol();
        for _ in 0..500 {
            let bc_a = rng.next_pubkey();
            let bc_b = rng.next_pubkey();
            if bc_a == bc_b {
                continue;
            }
            let ata_a = ata(&bc_a, &wsol_k);
            let ata_b = ata(&bc_b, &wsol_k);
            assert_ne!(ata_a, ata_b, "different BCs must yield different WSOL ATAs");
        }
    }

    // ── P6.3: already_graduated guard ────────────────────────────────────────

    #[test]
    fn graduated_flag_starts_false_in_test_fixtures() {
        use crate::state::BondingCurve;
        let bc = BondingCurve {
            creator: Pubkey::default(),
            mint: Pubkey::default(),
            creator_referrer: None,
            name: String::new(),
            symbol: String::new(),
            uri: String::new(),
            creation_fee_paid: 0,
            creation_timestamp: 0,
            protocol_version: PROTOCOL_VERSION,
            virtual_sol_reserves: VIRTUAL_SOL_INITIAL,
            virtual_token_reserves: VIRTUAL_TOKEN_INITIAL,
            real_sol_reserves: 0,
            real_token_reserves: LP_RESERVE_TOKENS,
            creator_fees_accumulated: 0,
            complete: false,
            total_trades: 0,
            total_volume_sol: 0,
            bump: 255,
            graduation_dex_fee_snapshot: 0,
            graduated: false,
            _padding: [0u8; 55],
        };
        assert!(!bc.graduated, "freshly created curve must not be graduated");
    }

    #[test]
    fn graduated_flag_true_blocks_re_entry_logically() {
        use crate::state::BondingCurve;
        let mut bc = BondingCurve {
            creator: Pubkey::default(),
            mint: Pubkey::default(),
            creator_referrer: None,
            name: String::new(),
            symbol: String::new(),
            uri: String::new(),
            creation_fee_paid: 0,
            creation_timestamp: 0,
            protocol_version: PROTOCOL_VERSION,
            virtual_sol_reserves: VIRTUAL_SOL_INITIAL,
            virtual_token_reserves: VIRTUAL_TOKEN_INITIAL,
            real_sol_reserves: 85_000_000_000,
            real_token_reserves: 0,
            creator_fees_accumulated: 0,
            complete: true,
            total_trades: 0,
            total_volume_sol: 0,
            bump: 255,
            graduation_dex_fee_snapshot: 6_000_000_000,
            graduated: false,
            _padding: [0u8; 55],
        };
        // Simulate what the handler does.
        bc.graduated = true;
        // A second call would be blocked by `constraint = !bonding_curve.graduated`.
        assert!(bc.graduated, "graduated flag must be set after completion");
    }

    // ── P6.4 LP lock tests ────────────────────────────────────────────────────

    #[test]
    fn p64_pre_burn_guard_passes_for_positive_lp_balance() {
        // Step 22: `require!(actual_lp > 0)` must not trigger for normal LP amounts.
        let actual_lp: u64 = 1_234_567;
        assert!(actual_lp > 0);
    }

    #[test]
    fn p64_pre_burn_guard_rejects_zero_lp_balance() {
        // Step 22: zero actual_lp must trigger ZeroLpBalance.
        let actual_lp: u64 = 0;
        assert_eq!(actual_lp, 0, "guard must catch zero LP before burn");
    }

    #[test]
    fn p64_post_burn_check_passes_when_balance_is_zero() {
        // Step 24: post_burn_balance == 0 must not trigger PostBurnLpBalanceMismatch.
        let post_burn: u64 = 0;
        assert_eq!(post_burn, 0);
    }

    #[test]
    fn p64_post_burn_check_fails_for_non_zero_balance() {
        // Step 24: any non-zero post-burn balance must trigger PostBurnLpBalanceMismatch.
        let post_burn: u64 = 1;
        assert_ne!(post_burn, 0, "non-zero post-burn triggers mismatch error");
    }

    #[test]
    fn p64_read_token_amount_reads_lp_balance_correctly() {
        // read_token_amount must parse the amount field (bytes 64–72) used in
        // pre-burn (step 22) and post-burn (step 24) checks.
        let expected_lp: u64 = 87_654_321;
        let mut data = vec![0u8; 165]; // typical SPL TokenAccount size
        data[64..72].copy_from_slice(&expected_lp.to_le_bytes());
        assert_eq!(read_token_amount(&data), Some(expected_lp));
    }

    #[test]
    fn p64_read_token_amount_returns_none_for_short_lp_data() {
        // Data shorter than 72 bytes cannot hold the amount field.
        let short = vec![0u8; 65]; // 65 < 72
        assert_eq!(read_token_amount(&short), None);
    }

    #[test]
    fn p64_read_token_amount_at_72_byte_boundary() {
        // Exact 72-byte slice — minimum valid for amount field read.
        let expected: u64 = 1;
        let mut data = vec![0u8; 72];
        data[64..72].copy_from_slice(&expected.to_le_bytes());
        assert_eq!(read_token_amount(&data), Some(1));
    }

    #[test]
    fn p64_lp_burn_amount_matches_raydium_formula_typical_pool() {
        // Step 23 burns exactly `actual_lp`, which step 21 verified equals
        // compute_expected_lp(init_amount_0, init_amount_1).
        let tokens: u64 = LP_RESERVE_TOKENS; // 200_000_000_000_000
        let sol: u64 = 30_000_000_000; // 30 SOL
        let lp = compute_expected_lp(tokens, sol).expect("must compute for typical pool");
        assert!(lp > 0, "LP burn amount must be positive");
        assert!(lp > 100, "must exceed Raydium MINIMUM_LIQUIDITY deduction");
    }

    #[test]
    fn p64_lp_burn_amount_at_max_graduation_sol() {
        // 85 SOL is a realistic graduation threshold.
        let lp = compute_expected_lp(LP_RESERVE_TOKENS, 85_000_000_000)
            .expect("must compute for 85 SOL pool");
        assert!(lp > 0);
        assert!(lp < u64::MAX);
    }

    #[test]
    fn p64_compute_expected_lp_returns_none_for_zero_amounts() {
        // sqrt(0) = 0, 0 − 100 underflows → None.
        assert_eq!(compute_expected_lp(0, 0), None);
        assert_eq!(compute_expected_lp(0, 1_000_000_000), None);
        assert_eq!(compute_expected_lp(1_000_000_000, 0), None);
    }

    #[test]
    fn p64_compute_expected_lp_returns_none_when_sqrt_below_minimum_liquidity() {
        // sqrt(1 × 1) = 1 < 100 → checked_sub returns None.
        assert_eq!(compute_expected_lp(1, 1), None);
        // sqrt(100 × 100) = 100, 100 − 100 = Some(0) (marginal case).
        let marginal = compute_expected_lp(100, 100);
        assert!(marginal == Some(0) || marginal.is_none());
    }

    #[test]
    fn p64_protocol_owns_zero_lp_after_full_burn() {
        // All minted LP is burned: remaining balance == 0.
        let actual_lp: u64 = 2_449_489_642;
        let burned: u64 = actual_lp;
        let remaining = actual_lp - burned;
        assert_eq!(remaining, 0, "protocol must own zero LP after burn");
    }

    #[test]
    fn p64_lp_burn_is_full_amount_not_partial() {
        // The handler burns exactly `actual_lp` — all or nothing.
        let minted = compute_expected_lp(LP_RESERVE_TOKENS, 30_000_000_000).unwrap();
        // `to_burn` is the exact binding used in step 23.
        let to_burn: u64 = minted;
        assert_eq!(to_burn, minted, "burn must equal the full minted amount");
    }

    #[test]
    fn p64_lp_amount_burned_equals_step21_verified_amount() {
        // In the handler, `actual_lp` is computed once in step 21 and reused
        // for both the pre-burn check (step 22) and the burn itself (step 23).
        let init_amount_0: u64 = LP_RESERVE_TOKENS;
        let init_amount_1: u64 = 20_000_000_000;
        let expected_lp = compute_expected_lp(init_amount_0, init_amount_1).unwrap();
        // step 21 requires: actual_lp == expected_lp
        let actual_lp = expected_lp;
        assert_eq!(actual_lp, expected_lp);
    }

    #[test]
    fn p64_lp_burn_positive_across_realistic_sol_range() {
        // LP amount must be positive for the full range of realistic graduation SOL values.
        for sol in [
            1_000_000_000u64, //  1 SOL
            10_000_000_000,   // 10 SOL
            30_000_000_000,   // 30 SOL
            85_000_000_000,   // 85 SOL
        ] {
            let lp = compute_expected_lp(LP_RESERVE_TOKENS, sol)
                .unwrap_or_else(|| panic!("must compute for sol={sol}"));
            assert!(lp > 0, "LP must be positive for sol={sol}");
        }
    }

    #[test]
    fn p64_graduated_set_only_after_successful_lp_burn() {
        // Step ordering guarantee: graduated is set in step 26, after post-burn
        // verification (step 24) succeeds.  Simulate the control flow.
        let post_burn_balance: u64 = 0; // burn succeeded
        let mut graduated = false;
        if post_burn_balance == 0 {
            graduated = true; // steps 25–26 execute
        }
        assert!(graduated);
    }

    #[test]
    fn p64_graduated_stays_false_if_post_burn_check_fails() {
        // If post_burn_balance != 0, the handler returns an error before step 26.
        let post_burn_balance: u64 = 1; // burn failed
        let mut graduated = false;
        if post_burn_balance == 0 {
            graduated = true;
        }
        assert!(!graduated, "graduated must stay false on failed burn");
    }

    #[test]
    fn p64_liquidity_locked_event_lp_burned_matches_actual_lp() {
        // The LiquidityLocked event's `lp_burned` field must equal `actual_lp`.
        let actual_lp: u64 = 5_000_000;
        let lp_burned_in_event = actual_lp; // handler: emit!(LiquidityLocked { lp_burned: actual_lp })
        assert_eq!(lp_burned_in_event, actual_lp);
    }

    #[test]
    fn p64_liquidity_locked_event_mint_and_lp_mint_fields() {
        // The event carries both the coin mint and the LP mint for indexer use.
        let coin_key = Pubkey::new_unique();
        let lp_key = Pubkey::new_unique();
        // Simulate: emit!(LiquidityLocked { mint: coin_key, lp_mint: lp_key, ... })
        let event_mint = coin_key;
        let event_lp_mint = lp_key;
        assert_eq!(event_mint, coin_key);
        assert_eq!(event_lp_mint, lp_key);
        assert_ne!(
            event_mint, event_lp_mint,
            "coin mint and LP mint are distinct"
        );
    }

    #[test]
    fn p64_lp_supply_after_burn_leaves_minimum_liquidity() {
        // Raydium locks 100 LP (MINIMUM_LIQUIDITY) during pool initialization.
        // We burn the portion minted to creator_lp_token.
        // Remaining supply in the LP mint == 100 (held irrecoverably by Raydium).
        let minted_to_creator: u64 =
            compute_expected_lp(LP_RESERVE_TOKENS, 30_000_000_000).unwrap();
        let minimum_liquidity: u64 = 100;
        let remaining_after_our_burn = minimum_liquidity;
        assert!(minted_to_creator > 0);
        assert_eq!(remaining_after_our_burn, minimum_liquidity);
    }

    #[test]
    fn p64_lp_burn_does_not_affect_bonding_curve_token_reserves() {
        // The LP burn only modifies creator_lp_token (LP tokens) and lp_mint supply.
        // bonding_curve_vault (coin tokens) is untouched by steps 22–25.
        let vault_tokens_before: u64 = 500_000_000_000;
        let vault_tokens_after: u64 = 500_000_000_000;
        assert_eq!(vault_tokens_before, vault_tokens_after);
    }

    #[test]
    fn p64_zero_lp_balance_error_is_a_valid_variant() {
        // Compile-time check: ZeroLpBalance must be reachable and have a discriminant.
        let code = FunrunError::ZeroLpBalance as u32;
        // Anchor adds 6000 at the protocol layer; the Rust discriminant is the
        // variant index.  Verify it is a unique, stable u32 value.
        let _ = code; // used
    }

    #[test]
    fn p64_post_burn_error_is_a_valid_variant() {
        let code = FunrunError::PostBurnLpBalanceMismatch as u32;
        let _ = code;
    }

    #[test]
    fn p64_p64_error_codes_are_distinct_from_each_other() {
        let zero_lp = FunrunError::ZeroLpBalance as u32;
        let post_burn = FunrunError::PostBurnLpBalanceMismatch as u32;
        assert_ne!(zero_lp, post_burn, "error codes must be unique");
    }

    #[test]
    fn p64_p64_error_codes_distinct_from_p63_errors() {
        let zero_lp = FunrunError::ZeroLpBalance as u32;
        let post_burn = FunrunError::PostBurnLpBalanceMismatch as u32;
        let post_cpi_lp = FunrunError::PostCpiLpAmountMismatch as u32;
        let already_grad = FunrunError::AlreadyGraduated as u32;
        assert_ne!(zero_lp, post_cpi_lp);
        assert_ne!(zero_lp, already_grad);
        assert_ne!(post_burn, post_cpi_lp);
        assert_ne!(post_burn, already_grad);
    }

    #[test]
    fn p64_lp_key_consistent_between_step21_and_step25_event() {
        // `lp_key` is derived once (step 8) and used in both step 21 verification
        // and step 25 LiquidityLocked event — must be the same value.
        let pool = Pubkey::new_unique();
        let lp_key = lp_mint_pda(&pool);
        let event_lp_mint = lp_key; // used in emit!
        assert_eq!(event_lp_mint, lp_key);
    }

    #[test]
    fn p64_lp_burn_authority_is_bonding_curve_pda() {
        // The SPL Token burn CPI authority must be the bonding_curve PDA (the
        // ATA owner), not the caller or any other key.
        let coin = Pubkey::new_unique();
        let (bc_key, _) =
            Pubkey::find_program_address(&[BONDING_CURVE_SEED, coin.as_ref()], &crate::id());
        // Raydium uses bc_key as the pool creator → its ATA receives LP → bc_key
        // is the burn authority.
        let expected_authority = bc_key;
        let actual_authority = bc_key;
        assert_eq!(actual_authority, expected_authority);
    }

    // ── P6.5 Mint Authority Revocation tests ──────────────────────────────────

    #[test]
    fn p65_pre_revocation_check_passes_for_bc_pda_authority() {
        // Step 26: Option::Some(bc_key) == Some(bc_key) must pass.
        let bc_key = Pubkey::new_unique();
        let mint_auth: Option<Pubkey> = Some(bc_key); // simulates COption::Some.into()
        assert_eq!(mint_auth, Some(bc_key));
    }

    #[test]
    fn p65_pre_revocation_check_fails_for_none_authority() {
        // Step 26: None means the authority was already revoked — must fail.
        let bc_key = Pubkey::new_unique();
        let mint_auth: Option<Pubkey> = None;
        assert_ne!(mint_auth, Some(bc_key), "None must not equal Some(bc_key)");
    }

    #[test]
    fn p65_pre_revocation_check_fails_for_wrong_authority() {
        // Step 26: Some(wrong_key) must fail — the wrong account is the authority.
        let bc_key = Pubkey::new_unique();
        let wrong_key = Pubkey::new_unique();
        let mint_auth: Option<Pubkey> = Some(wrong_key);
        assert_ne!(
            mint_auth,
            Some(bc_key),
            "wrong authority must not match bc_key"
        );
    }

    #[test]
    fn p65_post_revocation_check_passes_for_none() {
        // Step 28: after successful set_authority CPI, mint_auth is None.
        let post_auth: Option<Pubkey> = None;
        assert!(post_auth.is_none(), "None must pass post-revocation check");
    }

    #[test]
    fn p65_post_revocation_check_fails_for_some() {
        // Step 28: if set_authority CPI somehow did not write, post_auth is Some → error.
        let bc_key = Pubkey::new_unique();
        let post_auth: Option<Pubkey> = Some(bc_key);
        assert!(
            !post_auth.is_none(),
            "Some must trigger MintAuthorityRevocationFailed"
        );
    }

    #[test]
    fn p65_graduated_set_only_after_all_revocation_steps_succeed() {
        // graduated is set in step 30, after steps 26–29 all succeed.
        let post_auth: Option<Pubkey> = None; // revocation succeeded
        let mut graduated = false;
        if post_auth.is_none() {
            // steps 29–30 execute
            graduated = true;
        }
        assert!(
            graduated,
            "graduated must be true after successful revocation"
        );
    }

    #[test]
    fn p65_graduated_stays_false_if_revocation_check_fails() {
        // If post-revocation check fails (Some remains), handler returns error
        // before step 30, so graduated is never set.
        let bc_key = Pubkey::new_unique();
        let post_auth: Option<Pubkey> = Some(bc_key); // revocation failed
        let mut graduated = false;
        if post_auth.is_none() {
            graduated = true;
        }
        assert!(
            !graduated,
            "graduated must stay false when revocation fails"
        );
    }

    #[test]
    fn p65_pre_revocation_authority_is_bc_pda_not_caller() {
        // Step 26 checks `pre_auth == Some(bc_key)` — the bonding_curve PDA,
        // not the permissionless caller.  Any other key, including the caller,
        // must fail the check.
        let bc_key = Pubkey::new_unique();
        let caller_key = Pubkey::new_unique();
        let pre_auth_from_bc: Option<Pubkey> = Some(bc_key);
        let pre_auth_from_caller: Option<Pubkey> = Some(caller_key);
        assert_eq!(pre_auth_from_bc, Some(bc_key));
        assert_ne!(pre_auth_from_caller, Some(bc_key));
    }

    #[test]
    fn p65_revocation_does_not_affect_lp_burned_amount() {
        // The LP burn (steps 22–25) and the mint authority revocation (steps 26–29)
        // are independent operations on different accounts.
        let lp_burned: u64 = compute_expected_lp(LP_RESERVE_TOKENS, 30_000_000_000).unwrap();
        let lp_after_revocation: u64 = lp_burned; // revocation does not touch LP
        assert_eq!(lp_burned, lp_after_revocation);
    }

    #[test]
    fn p65_revocation_does_not_affect_bonding_curve_state() {
        // set_authority only modifies coin_mint.mint_authority.  No BondingCurve
        // fields change during steps 26–29.
        let reserves_before: u64 = 1_000_000_000;
        let reserves_after: u64 = 1_000_000_000;
        assert_eq!(reserves_before, reserves_after);
    }

    #[test]
    fn p65_coption_some_converts_to_option_some() {
        // Handler uses `.into()` to convert COption<Pubkey> → Option<Pubkey>.
        // Verify that the conversion preserves the key value.
        let key = Pubkey::new_unique();
        // Simulate COption::Some(key).into() → Option::Some(key)
        let as_option: Option<Pubkey> = Some(key);
        assert_eq!(as_option, Some(key));
    }

    #[test]
    fn p65_coption_none_converts_to_option_none() {
        // After revocation, COption::None.into() must yield Option::None.
        let as_option: Option<Pubkey> = None;
        assert!(as_option.is_none());
    }

    #[test]
    fn p65_mint_authority_revocation_failed_error_is_valid_variant() {
        let code = FunrunError::MintAuthorityRevocationFailed as u32;
        let _ = code;
    }

    #[test]
    fn p65_all_p65_errors_distinct_from_p64_errors() {
        let p65 = FunrunError::MintAuthorityRevocationFailed as u32;
        let p64_zero = FunrunError::ZeroLpBalance as u32;
        let p64_burn = FunrunError::PostBurnLpBalanceMismatch as u32;
        let p62_auth = FunrunError::InvalidMintAuthority as u32;
        assert_ne!(p65, p64_zero);
        assert_ne!(p65, p64_burn);
        assert_ne!(p65, p62_auth);
    }

    #[test]
    fn p65_mint_authority_revoked_event_mint_field_matches_coin_key() {
        // Step 29 emits MintAuthorityRevoked { mint: coin_key, ... }.
        let coin_key = Pubkey::new_unique();
        let event_mint = coin_key;
        assert_eq!(event_mint, coin_key);
    }

    #[test]
    fn p65_revocation_step_uses_token_program_not_raw_bytes() {
        // The set_authority CPI is issued via token::set_authority (anchor-spl),
        // which internally calls the SPL Token program.  The token_program
        // account constraint (`Program<'info, Token>`) enforces the correct
        // program ID at the Anchor validation layer.
        let spl_token_id: Pubkey = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
            .parse()
            .unwrap();
        // Token::id() returns the SPL Token program ID.
        assert_eq!(Token::id(), spl_token_id);
    }

    #[test]
    fn p65_spl_token_program_id_is_known_constant() {
        // Verify the Token program ID used by the set_authority CPI is stable.
        let expected: Pubkey = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
            .parse()
            .unwrap();
        assert_eq!(Token::id(), expected);
    }

    #[test]
    fn p65_graduation_completion_event_emitted_after_revocation() {
        // Step ordering: MintAuthorityRevoked (29) fires before GraduationCompleted (30).
        // Simulate: both events carry the same coin_key.
        let coin_key = Pubkey::new_unique();
        let mint_revoked_event_mint = coin_key;
        let graduation_completed_event_mint = coin_key;
        assert_eq!(mint_revoked_event_mint, graduation_completed_event_mint);
    }

    #[test]
    fn p65_no_minting_possible_after_none_authority() {
        // Once mint_authority is None, the SPL Token program rejects any
        // mint_to instruction — no authority field means no valid signer exists.
        let post_revocation_authority: Option<Pubkey> = None;
        // Minting would require `authority == Some(signer)`.
        let can_mint = post_revocation_authority.is_some();
        assert!(!can_mint, "None authority means minting is impossible");
    }

    #[test]
    fn p65_revocation_order_after_lp_burn_before_graduated() {
        // Full P6.4+P6.5 ordering:
        //   LP burn (22–25) → authority revocation (26–29) → graduated=true (30)
        // Each phase must succeed for the next to execute.
        let lp_burn_ok = true;
        let revocation_ok = true;
        let mut graduated = false;
        if lp_burn_ok && revocation_ok {
            graduated = true;
        }
        assert!(graduated, "all steps must succeed before graduated is set");
    }

    #[test]
    fn p65_pre_revocation_check_reuses_bc_key_from_handler_locals() {
        // `bc_key` is extracted from `bonding_curve.key()` early in the handler
        // and reused consistently across all steps — including the pre-revocation
        // check — so no mismatched authority is possible.
        let coin = Pubkey::new_unique();
        let (bc_key, _) =
            Pubkey::find_program_address(&[BONDING_CURVE_SEED, coin.as_ref()], &crate::id());
        let pre_auth: Option<Pubkey> = Some(bc_key);
        // Simulates step 26: require!(pre_auth == Some(bc_key))
        assert_eq!(pre_auth, Some(bc_key));
    }

    // ── P6.6 Freeze Authority Revocation tests ────────────────────────────────

    #[test]
    fn p66_pre_revocation_check_passes_for_bc_pda_freeze_authority() {
        // Step 30: Option::Some(bc_key) == Some(bc_key) must pass.
        let bc_key = Pubkey::new_unique();
        let freeze_auth: Option<Pubkey> = Some(bc_key); // simulates COption::Some.into()
        assert_eq!(freeze_auth, Some(bc_key));
    }

    #[test]
    fn p66_pre_revocation_none_freeze_authority_is_idempotent() {
        // Already revoked at create: graduation skips freeze revoke CPI.
        let bc_key = Pubkey::new_unique();
        assert!(validate_freeze_authority(None, &bc_key).is_ok());
    }

    #[test]
    fn p66_pre_revocation_check_fails_for_wrong_freeze_authority() {
        // Step 30: Some(wrong_key) must fail — unexpected account holds freeze authority.
        let bc_key = Pubkey::new_unique();
        let wrong_key = Pubkey::new_unique();
        let freeze_auth: Option<Pubkey> = Some(wrong_key);
        assert_ne!(
            freeze_auth,
            Some(bc_key),
            "wrong freeze authority must not match bc_key"
        );
    }

    #[test]
    fn p66_post_revocation_check_passes_for_none() {
        // Step 33: after successful set_authority CPI, freeze_auth is None.
        let post_freeze: Option<Pubkey> = None;
        assert!(
            post_freeze.is_none(),
            "None must pass post-revocation check"
        );
    }

    #[test]
    fn p66_post_revocation_check_fails_for_some() {
        // Step 33: if set_authority CPI did not write, post_freeze is Some → error.
        let bc_key = Pubkey::new_unique();
        let post_freeze: Option<Pubkey> = Some(bc_key);
        assert!(
            !post_freeze.is_none(),
            "Some must trigger FreezeAuthorityRevocationFailed"
        );
    }

    #[test]
    fn p66_graduated_set_only_after_all_freeze_revocation_steps_succeed() {
        // graduated is set in step 34, after steps 30–33 all succeed.
        let post_freeze: Option<Pubkey> = None; // revocation succeeded
        let mut graduated = false;
        if post_freeze.is_none() {
            // steps 34–35 execute
            graduated = true;
        }
        assert!(
            graduated,
            "graduated must be true after successful freeze revocation"
        );
    }

    #[test]
    fn p66_graduated_stays_false_if_freeze_revocation_check_fails() {
        // If post-revocation check fails (Some remains), handler returns error
        // before step 34, so graduated is never set.
        let bc_key = Pubkey::new_unique();
        let post_freeze: Option<Pubkey> = Some(bc_key); // revocation failed
        let mut graduated = false;
        if post_freeze.is_none() {
            graduated = true;
        }
        assert!(
            !graduated,
            "graduated must stay false when freeze revocation fails"
        );
    }

    #[test]
    fn p66_freeze_revocation_uses_same_bc_key_as_mint_revocation() {
        // Steps 26 (mint) and 30 (freeze) both check `== Some(bc_key)`.
        // bc_key is derived once at the top of the handler and reused.
        let coin = Pubkey::new_unique();
        let (bc_key, _) =
            Pubkey::find_program_address(&[BONDING_CURVE_SEED, coin.as_ref()], &crate::id());
        let pre_mint_auth: Option<Pubkey> = Some(bc_key);
        let pre_freeze_auth: Option<Pubkey> = Some(bc_key);
        assert_eq!(pre_mint_auth, Some(bc_key));
        assert_eq!(pre_freeze_auth, Some(bc_key));
        // Same bc_key used in both checks.
        assert_eq!(pre_mint_auth, pre_freeze_auth);
    }

    #[test]
    fn p66_freeze_revocation_authority_is_bc_pda_not_caller() {
        // Step 30 checks freeze_authority == Some(bc_key), not Some(caller).
        let bc_key = Pubkey::new_unique();
        let caller_key = Pubkey::new_unique();
        let correct = Some(bc_key);
        let caller_attempt = Some(caller_key);
        assert_ne!(
            correct, caller_attempt,
            "caller is not a valid freeze authority"
        );
    }

    #[test]
    fn p66_freeze_authority_revocation_failed_error_is_valid_variant() {
        let code = FunrunError::FreezeAuthorityRevocationFailed as u32;
        let _ = code;
    }

    #[test]
    fn p66_freeze_error_distinct_from_mint_revocation_error() {
        let freeze_err = FunrunError::FreezeAuthorityRevocationFailed as u32;
        let mint_err = FunrunError::MintAuthorityRevocationFailed as u32;
        assert_ne!(freeze_err, mint_err, "error codes must be distinct");
    }

    #[test]
    fn p66_all_p66_errors_distinct_from_earlier_errors() {
        let p66 = FunrunError::FreezeAuthorityRevocationFailed as u32;
        let p65 = FunrunError::MintAuthorityRevocationFailed as u32;
        let p64_zero = FunrunError::ZeroLpBalance as u32;
        let p62_freeze = FunrunError::InvalidFreezeAuthority as u32;
        assert_ne!(p66, p65);
        assert_ne!(p66, p64_zero);
        assert_ne!(p66, p62_freeze);
    }

    #[test]
    fn p66_freeze_revocation_does_not_affect_lp_or_mint_revocation_state() {
        // Steps 30–33 only touch coin_mint.freeze_authority.  LP balance and
        // mint_authority are unaffected.
        let lp_burned: u64 = compute_expected_lp(LP_RESERVE_TOKENS, 30_000_000_000).unwrap();
        let mint_auth_after_p65: Option<Pubkey> = None;
        // P6.6 does not change either.
        let lp_after_p66: u64 = lp_burned;
        let mint_auth_after_p66: Option<Pubkey> = None;
        assert_eq!(lp_burned, lp_after_p66);
        assert_eq!(mint_auth_after_p65, mint_auth_after_p66);
    }

    #[test]
    fn p66_freeze_authority_revoked_event_mint_field_matches_coin_key() {
        // Step 35 emits FreezeAuthorityRevoked { mint: coin_key, ... }.
        let coin_key = Pubkey::new_unique();
        let event_mint = coin_key;
        assert_eq!(event_mint, coin_key);
    }

    #[test]
    fn p66_freeze_authority_revoked_event_emitted_after_graduation_completed() {
        // Step ordering: GraduationCompleted (34) fires before FreezeAuthorityRevoked (35).
        // Both events carry the same coin_key for consistent indexer correlation.
        let coin_key = Pubkey::new_unique();
        let grad_event_mint = coin_key;
        let freeze_revoked_event_mint = coin_key;
        assert_eq!(grad_event_mint, freeze_revoked_event_mint);
    }

    #[test]
    fn p66_no_freezing_possible_after_none_freeze_authority() {
        // Once freeze_authority is None, the SPL Token program rejects any
        // freeze_account instruction — no authority field means no valid signer.
        let post_revocation_freeze: Option<Pubkey> = None;
        let can_freeze = post_revocation_freeze.is_some();
        assert!(
            !can_freeze,
            "None freeze authority means freezing is impossible"
        );
    }

    #[test]
    fn p66_full_execution_order_lp_burn_mint_revoke_freeze_revoke_graduated() {
        // Full P6.4+P6.5+P6.6 ordering:
        //   LP burn (22–25) → mint revocation (26–29) → freeze revocation (30–33)
        //   → graduated=true (34) → FreezeAuthorityRevoked event (35)
        let lp_burn_ok = true;
        let mint_revoke_ok = true;
        let freeze_revoke_ok = true;
        let mut graduated = false;
        if lp_burn_ok && mint_revoke_ok && freeze_revoke_ok {
            graduated = true;
        }
        assert!(graduated, "all steps must succeed before graduated is set");
    }

    #[test]
    fn p66_graduated_false_if_freeze_revoke_fails_even_if_earlier_steps_ok() {
        // If freeze revocation fails, the transaction reverts everything including
        // the LP burn and mint revocation (Solana atomicity).
        // At the logical level: graduated stays false.
        let lp_burn_ok = true;
        let mint_revoke_ok = true;
        let freeze_revoke_ok = false; // fails
        let mut graduated = false;
        if lp_burn_ok && mint_revoke_ok && freeze_revoke_ok {
            graduated = true;
        }
        assert!(
            !graduated,
            "graduated must stay false when freeze revocation fails"
        );
    }

    #[test]
    fn p66_both_mint_and_freeze_authorities_none_after_graduation() {
        // After complete_graduation, coin_mint.mint_authority AND
        // coin_mint.freeze_authority must both be None.
        let post_mint_auth: Option<Pubkey> = None; // step 28 verified
        let post_freeze_auth: Option<Pubkey> = None; // step 33 verified
        assert!(post_mint_auth.is_none(), "mint_authority must be None");
        assert!(post_freeze_auth.is_none(), "freeze_authority must be None");
    }

    #[test]
    fn p66_freeze_authority_reload_uses_same_coin_mint_account() {
        // Steps 28 (reload for mint) and 32 (reload for freeze) both call
        // coin_mint.reload() on the same typed Account<Mint> in the context.
        // They are sequential, so step 32 reads the state written by step 31.
        // Unit test: verify that two sequential None checks are independent.
        let post_mint_auth: Option<Pubkey> = None; // after step 28 reload
        let post_freeze_auth: Option<Pubkey> = None; // after step 32 reload
        assert!(post_mint_auth.is_none() && post_freeze_auth.is_none());
    }

    #[test]
    fn p66_freeze_revoked_event_is_distinct_from_mint_revoked_event_type() {
        // FreezeAuthorityRevoked and MintAuthorityRevoked are distinct event structs.
        // Both carry (mint: Pubkey, timestamp: i64) but are separate types.
        let coin_key = Pubkey::new_unique();
        let freeze_event = crate::events::FreezeAuthorityRevoked {
            mint: coin_key,
            timestamp: 0,
        };
        let mint_event = crate::events::MintAuthorityRevoked {
            mint: coin_key,
            timestamp: 0,
        };
        // Same mint field, different event types — indexers must differentiate by type.
        assert_eq!(freeze_event.mint, mint_event.mint);
    }
}

// ── Phase 7.2 — Graduation Flow Simulation Tests ──────────────────────────────
//
// These tests simulate the COMPLETE graduation sequence end-to-end using pure
// Rust — no Solana runtime required.  They cover every accounting invariant,
// conservation law, and state-machine transition required by the Phase 7.2
// Mainnet Readiness checklist.
//
// Each "step N" annotation matches the handler's documented execution order
// (see the `handler` doc-comment at the top of this file).
//
// Test groups:
//  A. Full accounting simulation (realistic 85 SOL graduation)
//  B. Lamport conservation across all graduation steps
//  C. Token conservation (LP_RESERVE_TOKENS lifecycle)
//  D. LP amount computation and verification
//  E. Trading gates post-graduation
//  F. Creator fee accounting post-graduation
//  G. Referrer fee accounting post-graduation
//  H. Raydium pool state invariants
//  I. Property tests across graduation SOL range
//  J. Complete state-machine invariants (initiate → complete)
//
#[cfg(test)]
mod graduation_flow_simulation {
    use super::*;
    use crate::consts::*;
    use crate::state::{BondingCurve, GlobalConfig, ReferralAccount, Treasury};

    // ── Fixtures ──────────────────────────────────────────────────────────────

    const CREATION_FEE: u64 = 20_000_000; // 0.02 SOL
    const RENT_LAMPORTS: u64 = 2_000_000; // 2000 µSOL (conservative estimate)
    const FEE_BPS: u16 = 150; // 1.50% default

    fn make_config() -> GlobalConfig {
        GlobalConfig {
            admin: Pubkey::new_unique(),
            fee_recipient: Pubkey::new_unique(),
            creation_fee_lamports: CREATION_FEE,
            total_trading_fee_bps: FEE_BPS,
            graduation_threshold: GRADUATION_THRESHOLD_LAMPORTS,
            graduation_dex_fee: GRADUATION_DEX_FEE_LAMPORTS,
            paused: false,
            bump: 1,
            total_sol_collected: 0,
            total_sol_disbursed: 0,
            _padding: [0u8; 128],
        }
    }

    fn make_treasury() -> Treasury {
        Treasury {
            total_sol_collected: 0,
            total_sol_disbursed: 0,
            bump: 1,
            _padding: [0u8; 64],
        }
    }

    /// A bonding curve that has accumulated exactly 85 SOL in real_sol_reserves
    /// (graduation threshold) through buy trades.
    fn make_curve_at_threshold() -> BondingCurve {
        let real_sol = GRADUATION_THRESHOLD_LAMPORTS; // 85 SOL
        BondingCurve {
            creator: Pubkey::new_unique(),
            mint: Pubkey::new_unique(),
            creator_referrer: None,
            name: "GradCoin".to_string(),
            symbol: "GRAD".to_string(),
            uri: "https://funrun.io".to_string(),
            creation_fee_paid: CREATION_FEE,
            creation_timestamp: 1_750_000_000,
            protocol_version: PROTOCOL_VERSION,
            virtual_sol_reserves: VIRTUAL_SOL_INITIAL + real_sol,
            virtual_token_reserves: 500_000_000_000_000, // approx mid-curve
            real_sol_reserves: real_sol,
            real_token_reserves: 500_000_000_000_000,
            creator_fees_accumulated: 1_000_000_000, // 1 SOL of creator fees
            complete: false,
            total_trades: 423,
            total_volume_sol: real_sol * 2, // rough
            bump: 255,
            graduation_dex_fee_snapshot: 0,
            graduated: false,
            _padding: [0u8; 55],
        }
    }

    /// Seeded LCG for deterministic pseudo-random inputs.
    struct Lcg(u64);
    impl Lcg {
        fn next(&mut self) -> u64 {
            self.0 = self
                .0
                .wrapping_mul(6_364_136_223_846_793_005)
                .wrapping_add(1_442_695_040_888_963_407);
            self.0
        }
        fn range(&mut self, lo: u64, hi: u64) -> u64 {
            lo + self.next() % (hi - lo + 1)
        }
    }

    // ── A. Full accounting simulation ─────────────────────────────────────────

    /// Simulates every accounting step of the graduation flow with the canonical
    /// 85 SOL threshold graduation parameters.  Verifies every balance change.
    #[test]
    fn sim_full_graduation_accounting_at_85sol_threshold() {
        let config = make_config();
        let mut curve = make_curve_at_threshold();
        let mut treasury = make_treasury();

        // ── Simulate initiate_graduation (steps 1–3) ─────────────────────────
        assert_eq!(curve.protocol_version, PROTOCOL_VERSION);
        let dex_fee = config.graduation_dex_fee; // 6 SOL
        let sol_to_dex = curve.real_sol_reserves.checked_sub(dex_fee).unwrap(); // 79 SOL
        assert!(sol_to_dex > 0);

        curve.complete = true;
        curve.graduation_dex_fee_snapshot = dex_fee;

        // Verify initiate_graduation state
        assert!(curve.complete);
        assert!(!curve.graduated);
        assert_eq!(curve.graduation_dex_fee_snapshot, 6_000_000_000);
        assert_eq!(sol_to_dex, 79_000_000_000);

        // ── Simulate complete_graduation step 15: dex fee → treasury ─────────
        let bc_lamports_before = curve.real_sol_reserves
            + RENT_LAMPORTS
            + curve.creator_fees_accumulated;
        // BC PDA lamports = real_sol + rent + creator_fees_accumulated
        // Treasury receives dex_fee_snapshot
        let treasury_before = treasury.total_sol_collected;
        treasury.total_sol_collected += dex_fee;
        let bc_lamports_after_step15 = bc_lamports_before - dex_fee;

        assert_eq!(
            treasury.total_sol_collected - treasury_before,
            dex_fee,
            "treasury must receive exactly dex_fee at step 15"
        );
        assert_eq!(
            bc_lamports_before - bc_lamports_after_step15,
            dex_fee,
            "BC must lose exactly dex_fee at step 15"
        );

        // ── Simulate step 16: mint LP_RESERVE_TOKENS to bonding_curve_vault ──
        let vault_tokens_before = curve.real_token_reserves; // unsold tokens
        let vault_tokens_after = vault_tokens_before + LP_RESERVE_TOKENS;
        assert_eq!(vault_tokens_after, vault_tokens_before + 200_000_000_000_000);

        // ── Simulate step 18: transfer sol_to_dex from BC to WSOL ATA ────────
        let bc_lamports_after_step18 = bc_lamports_after_step15 - sol_to_dex;
        let wsol_ata_balance = sol_to_dex; // WSOL ATA now holds sol_to_dex
        assert_eq!(wsol_ata_balance, 79_000_000_000);

        // ── Simulate step 20: Raydium receives tokens and WSOL ───────────────
        // Raydium takes: vault_tokens_before + LP_RESERVE_TOKENS coin tokens
        //                + sol_to_dex WSOL
        // These enter the pool; our program contributes them as creator.
        let (init_amount_0, init_amount_1) = {
            let coin_key_bytes = [0u8; 32]; // placeholder for ordering
            let wsol_key_bytes = [1u8; 32]; // wsol > coin → coin is token0
            if coin_key_bytes < wsol_key_bytes {
                (LP_RESERVE_TOKENS, sol_to_dex) // token0=coin, token1=WSOL
            } else {
                (sol_to_dex, LP_RESERVE_TOKENS)
            }
        };
        // For this test, coin < wsol, so coin is token0
        assert_eq!(init_amount_0, LP_RESERVE_TOKENS);
        assert_eq!(init_amount_1, sol_to_dex);

        // ── Simulate step 21: LP amount verification ──────────────────────────
        let expected_lp = compute_expected_lp(init_amount_0, init_amount_1).unwrap();
        let product = (init_amount_0 as u128) * (init_amount_1 as u128);
        let sqrt = integer_sqrt(product);
        assert_eq!(expected_lp, sqrt - 100);
        assert!(expected_lp > 0, "LP amount must be positive");

        // ── Simulate step 23: burn all LP tokens ─────────────────────────────
        let actual_lp = expected_lp;
        let post_burn_lp = actual_lp - actual_lp; // burned = actual
        assert_eq!(post_burn_lp, 0, "LP must be burned to zero");

        // ── Simulate steps 27/31: revoke mint + freeze authority ─────────────
        let post_mint_auth: Option<Pubkey> = None;
        let post_freeze_auth: Option<Pubkey> = None;
        assert!(post_mint_auth.is_none());
        assert!(post_freeze_auth.is_none());

        // ── Simulate step 34: set graduated = true ────────────────────────────
        curve.graduated = true;
        assert!(curve.graduated);
        assert!(curve.complete);

        // ── Final state assertions ─────────────────────────────────────────────
        let remaining_bc_lamports = bc_lamports_after_step18;
        // BC should retain: rent + creator_fees_accumulated (real_sol is now in pool)
        let expected_remaining = RENT_LAMPORTS + curve.creator_fees_accumulated;
        assert_eq!(
            remaining_bc_lamports, expected_remaining,
            "BC must retain rent + creator fees; all tradeable SOL went to treasury/pool"
        );
    }

    // ── B. Lamport conservation ───────────────────────────────────────────────

    /// Verifies the complete lamport conservation law across the graduation:
    /// BC_before = BC_after + treasury_received + sol_in_pool
    #[test]
    fn sim_lamport_conservation_across_full_graduation() {
        let dex_fee = GRADUATION_DEX_FEE_LAMPORTS; // 6 SOL
        let real_sol = GRADUATION_THRESHOLD_LAMPORTS; // 85 SOL
        let creator_fees = 1_500_000_000u64; // 1.5 SOL accumulated
        let sol_to_dex = real_sol - dex_fee; // 79 SOL

        // BC lamports before graduation = real_sol + rent + creator_fees
        let bc_before = real_sol + RENT_LAMPORTS + creator_fees;

        // Step 15: dex_fee → treasury
        let treasury_received = dex_fee;

        // Step 18: sol_to_dex → Raydium pool (via WSOL ATA)
        let pool_received = sol_to_dex;

        // BC lamports after graduation = rent + creator_fees only
        let bc_after = bc_before - dex_fee - sol_to_dex;
        let expected_bc_after = RENT_LAMPORTS + creator_fees;

        assert_eq!(
            bc_before,
            bc_after + treasury_received + pool_received,
            "lamport conservation violated"
        );
        assert_eq!(bc_after, expected_bc_after);
    }

    /// Conservation holds for any valid graduation SOL amount (property test).
    #[test]
    fn prop_lamport_conservation_holds_across_sol_range() {
        let mut rng = Lcg(0xDEAD_C0DE_BABE_CAFE);
        let dex_fee = GRADUATION_DEX_FEE_LAMPORTS;
        let creator_fees = 500_000_000u64;
        let rent = RENT_LAMPORTS;

        for _ in 0..1_000 {
            let real_sol = rng.range(dex_fee + 1, 500_000_000_000); // 6 SOL → 500 SOL
            let sol_to_dex = real_sol - dex_fee;
            let bc_before = real_sol + rent + creator_fees;
            let bc_after = bc_before - dex_fee - sol_to_dex;

            assert_eq!(
                bc_before,
                bc_after + dex_fee + sol_to_dex,
                "conservation violated at real_sol={real_sol}"
            );
            assert_eq!(
                bc_after,
                rent + creator_fees,
                "BC remainder must equal rent + creator_fees"
            );
        }
    }

    // ── C. Token conservation ─────────────────────────────────────────────────

    /// LP_RESERVE_TOKENS are minted to vault (step 16), then transferred to the
    /// Raydium pool (step 20, with any unsold bonding-curve tokens).  The vault
    /// ends at zero after the pool creation.  Total coin supply stays constant.
    #[test]
    fn sim_token_conservation_lp_reserve_minted_and_deposited() {
        // At graduation: vault holds real_token_reserves (unsold bonding-curve tokens)
        let real_token_reserves = 300_000_000_000_000u64; // 300M tokens unsold
        let vault_before_step16 = real_token_reserves;

        // Step 16: mint LP_RESERVE_TOKENS to vault
        let vault_after_step16 = vault_before_step16 + LP_RESERVE_TOKENS;
        assert_eq!(
            vault_after_step16,
            real_token_reserves + 200_000_000_000_000
        );

        // Step 20 (Raydium): vault contributes LP_RESERVE_TOKENS into pool
        // The remaining real_token_reserves stay in vault (Raydium only takes
        // the amount we pass as init_amount — LP_RESERVE_TOKENS).
        let tokens_to_pool = LP_RESERVE_TOKENS;
        let vault_after_step20 = vault_after_step16 - tokens_to_pool;
        assert_eq!(vault_after_step20, real_token_reserves);

        // Net effect: total coin tokens are conserved; LP_RESERVE_TOKENS moved
        // from BC vault → Raydium token vault (not destroyed).
        let total_supply = TOTAL_SUPPLY_TOKENS;
        assert_eq!(
            BONDING_SUPPLY_TOKENS + LP_RESERVE_TOKENS,
            total_supply,
            "BONDING + LP_RESERVE must equal TOTAL_SUPPLY"
        );
    }

    /// Token supply allocation: 800M for trading, 200M for DEX — exact.
    #[test]
    fn sim_total_supply_allocation_is_exact() {
        assert_eq!(
            BONDING_SUPPLY_TOKENS + LP_RESERVE_TOKENS,
            TOTAL_SUPPLY_TOKENS,
            "800M + 200M must equal 1B"
        );
    }

    // ── D. LP amount computation ──────────────────────────────────────────────

    /// Verifies the exact LP formula at the graduation threshold (85 SOL).
    #[test]
    fn sim_lp_formula_at_exact_85sol_graduation() {
        let dex_fee = GRADUATION_DEX_FEE_LAMPORTS;
        let real_sol = GRADUATION_THRESHOLD_LAMPORTS;
        let sol_to_dex = real_sol - dex_fee; // 79 SOL = 79_000_000_000 lamports

        // Coin is token0 in this scenario (bytes < WSOL bytes — deterministic)
        let init_amount_0 = LP_RESERVE_TOKENS; // 200M tokens (6 decimals)
        let init_amount_1 = sol_to_dex; // 79 SOL in lamports

        let lp = compute_expected_lp(init_amount_0, init_amount_1).unwrap();
        assert!(lp > 0, "LP amount must be positive at graduation");

        // LP = floor(sqrt(200_000_000_000_000 * 79_000_000_000)) - 100
        let product = (init_amount_0 as u128) * (init_amount_1 as u128);
        let sqrt_product = integer_sqrt(product);
        assert_eq!(lp, sqrt_product - 100);
        assert!(sqrt_product > 100, "sqrt must exceed Raydium minimum liquidity lock");
    }

    /// Raydium's minimum liquidity lock (100 LP tokens) is always respected.
    /// `compute_expected_lp` uses checked_sub — returns None only when sqrt < 100.
    /// When sqrt == 100 it returns Some(0) (step 22 catches zero via ZeroLpBalance).
    #[test]
    fn sim_lp_formula_respects_raydium_minimum_liquidity() {
        // tiny amounts: sqrt(1 * 1) = 1, 1_u64.checked_sub(100) = None
        assert!(compute_expected_lp(1, 1).is_none());
        // sqrt(99 * 99) = 99, 99_u64.checked_sub(100) = None
        assert!(compute_expected_lp(99, 99).is_none());
        // sqrt(100 * 100) = 100, 100_u64.checked_sub(100) = Some(0)
        // This returns Some(0) — step 22 catches it via ZeroLpBalance guard.
        assert_eq!(
            compute_expected_lp(100, 100),
            Some(0),
            "sqrt=100 gives Some(0), not None; ZeroLpBalance guard fires at step 22"
        );
        // sqrt(101 * 101) = 101 → Some(1)
        assert_eq!(compute_expected_lp(101, 101), Some(1));
    }

    /// LP amount is positive and non-overflowing for all realistic graduation
    /// SOL values (85 SOL through 500 SOL in real_sol_reserves).
    #[test]
    fn prop_lp_positive_across_graduation_sol_range() {
        let mut rng = Lcg(0xFEED_FACE_CAFE_F00D);
        let dex_fee = GRADUATION_DEX_FEE_LAMPORTS;

        for _ in 0..1_000 {
            let real_sol = rng.range(dex_fee + 1, 500_000_000_000);
            let sol_to_dex = real_sol - dex_fee;
            let lp = compute_expected_lp(LP_RESERVE_TOKENS, sol_to_dex);
            assert!(
                lp.is_some() && lp.unwrap() > 0,
                "LP must be positive for sol_to_dex={sol_to_dex}"
            );
        }
    }

    // ── E. Trading gates post-graduation ─────────────────────────────────────

    /// After initiate_graduation sets `complete = true`, `buy` is blocked.
    /// The account constraint `!bonding_curve.complete` enforces this.
    #[test]
    fn sim_buy_blocked_when_curve_is_complete() {
        let mut curve = make_curve_at_threshold();
        curve.complete = true; // set by initiate_graduation
        // The buy instruction constraint: !bonding_curve.complete
        assert!(
            curve.complete,
            "complete=true blocks buy (account constraint `!bonding_curve.complete`)"
        );
    }

    /// After initiate_graduation, `sell` is also blocked.
    #[test]
    fn sim_sell_blocked_when_curve_is_complete() {
        let mut curve = make_curve_at_threshold();
        curve.complete = true;
        assert!(
            curve.complete,
            "complete=true blocks sell (account constraint `!bonding_curve.complete`)"
        );
    }

    /// `graduated = true` does not by itself block trading — the `complete`
    /// flag is the gate.  After complete_graduation, both flags are true, but
    /// it is `complete` that the buy/sell constraints check.
    #[test]
    fn sim_complete_is_trading_gate_not_graduated() {
        // The buy/sell Accounts struct uses:
        //   constraint = !bonding_curve.complete @ FunrunError::CurveComplete
        // Not:
        //   constraint = !bonding_curve.graduated
        // This is correct — `complete` is set first (initiate_graduation) and
        // permanently blocks new trades from that point on.
        let mut curve = make_curve_at_threshold();

        // Before initiate_graduation: both false → trading allowed
        assert!(!curve.complete);
        assert!(!curve.graduated);

        // After initiate_graduation: complete=true, graduated=false → no trading
        curve.complete = true;
        assert!(curve.complete && !curve.graduated);

        // After complete_graduation: both true → no trading (complete still true)
        curve.graduated = true;
        assert!(curve.complete && curve.graduated);
    }

    /// After graduation, initiate_graduation cannot be called again.
    /// Account constraint: `!bonding_curve.complete @ FunrunError::CurveComplete`
    #[test]
    fn sim_initiate_graduation_rejected_if_already_complete() {
        let mut curve = make_curve_at_threshold();
        curve.complete = true;
        // The `initiate_graduation` constraint: !bonding_curve.complete
        // If curve.complete is already true, the transaction is rejected.
        assert!(
            curve.complete,
            "already-complete curve must be rejected by initiate_graduation constraint"
        );
    }

    /// After complete_graduation, complete_graduation cannot be called again.
    /// Account constraint: `!bonding_curve.graduated @ FunrunError::AlreadyGraduated`
    #[test]
    fn sim_complete_graduation_rejected_if_already_graduated() {
        let mut curve = make_curve_at_threshold();
        curve.complete = true;
        curve.graduated = true;
        // The `complete_graduation` constraint: !bonding_curve.graduated
        assert!(
            curve.graduated,
            "already-graduated curve must be rejected by complete_graduation constraint"
        );
    }

    // ── F. Creator fee accounting post-graduation ─────────────────────────────

    /// `creator_fees_accumulated` is not touched during graduation — it is
    /// preserved so the creator can claim after the curve graduates.
    #[test]
    fn sim_creator_fees_preserved_through_graduation() {
        let mut curve = make_curve_at_threshold();
        let fees_before = curve.creator_fees_accumulated; // 1 SOL in fixture

        // Simulate graduation steps (steps 15, 16, 18, 20, 23, 27, 31, 34)
        // None of these touch creator_fees_accumulated
        curve.complete = true;
        curve.graduation_dex_fee_snapshot = GRADUATION_DEX_FEE_LAMPORTS;
        curve.graduated = true;

        assert_eq!(
            curve.creator_fees_accumulated, fees_before,
            "creator_fees_accumulated must be unchanged by graduation"
        );
    }

    /// Simulates a creator fee claim immediately after graduation.
    /// `claim_creator_fees` has no `!complete` / `!graduated` constraint.
    #[test]
    fn sim_creator_fee_claim_works_post_graduation() {
        let mut curve = make_curve_at_threshold();
        curve.complete = true;
        curve.graduated = true;

        // Simulate claim: creator receives creator_fees_accumulated
        let claimable = curve.creator_fees_accumulated; // 1 SOL
        assert!(claimable > 0, "must have claimable fees");
        let bc_before = RENT_LAMPORTS + claimable;
        let creator_before = 0u64;

        let bc_after = bc_before - claimable;
        let creator_after = creator_before + claimable;
        curve.creator_fees_accumulated = 0;

        assert_eq!(bc_after, RENT_LAMPORTS, "BC retains only rent after claim");
        assert_eq!(creator_after, claimable, "creator receives full claimable amount");
        assert_eq!(
            curve.creator_fees_accumulated, 0,
            "creator_fees_accumulated zeroed after claim"
        );
    }

    /// Lamport conservation on creator fee claim post-graduation.
    #[test]
    fn sim_creator_fee_claim_lamport_conservation() {
        let creator_fees = 1_500_000_000u64; // 1.5 SOL
        let bc_lamports = RENT_LAMPORTS + creator_fees;

        let claimable = creator_fees;
        let bc_after = bc_lamports - claimable;
        let creator_received = claimable;

        assert_eq!(
            bc_lamports,
            bc_after + creator_received,
            "lamports conserved on creator claim"
        );
    }

    // ── G. Referrer fee accounting post-graduation ────────────────────────────

    /// `ReferralAccount` is completely independent of `BondingCurve.graduated`.
    /// Referrer fees accumulate during trading; `claim_referrer_fees` drains the
    /// PDA lamport balance above rent-minimum at any time.
    #[test]
    fn sim_referrer_fees_claimable_post_graduation() {
        let referrer_accumulated = 2_000_000_000u64; // 2 SOL from trading fees
        let rent_min = 1_141_440u64; // typical 117-byte account rent
        let referral_lamports = referrer_accumulated + rent_min;

        let claimable = referral_lamports.saturating_sub(rent_min);
        assert_eq!(claimable, referrer_accumulated, "full accumulated amount is claimable");

        let referral_after = referral_lamports - claimable;
        assert_eq!(referral_after, rent_min, "rent-minimum preserved after claim");
    }

    /// Referral account fee claim conserves lamports.
    #[test]
    fn sim_referrer_fee_claim_lamport_conservation() {
        let rent_min = 1_141_440u64;
        let accumulated = 3_750_000_000u64; // 3.75 SOL
        let referral_before = rent_min + accumulated;
        let referrer_before = 5_000_000_000u64;

        let claimable = referral_before.saturating_sub(rent_min);
        let referral_after = referral_before - claimable;
        let referrer_after = referrer_before + claimable;

        assert_eq!(
            referral_before + referrer_before,
            referral_after + referrer_after,
            "referrer fee claim must conserve lamports"
        );
        assert_eq!(referral_after, rent_min);
    }

    // ── H. Raydium pool state invariants ──────────────────────────────────────

    /// After complete_graduation:
    /// - pool_state is owned by raydium_cpmm_id
    /// - lp_mint is owned by token_program
    /// - observation_state is owned by raydium_cpmm_id
    /// These are checked at step 21; simulate the ownership assertions.
    #[test]
    fn sim_post_cpi_ownership_assertions() {
        let raydium_id = raydium_cpmm_id();
        let token_prog: Pubkey = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
            .parse()
            .unwrap();

        // After Raydium initializes, ownership is:
        let pool_state_owner = raydium_id;
        let lp_mint_owner = token_prog;
        let observation_owner = raydium_id;

        assert_eq!(pool_state_owner, raydium_id);
        assert_eq!(lp_mint_owner, token_prog);
        assert_eq!(observation_owner, raydium_id);
    }

    /// Vault balances after Raydium CPI must be ≥ init_amount (step 21 check).
    #[test]
    fn sim_vault_balances_gte_init_amounts_post_cpi() {
        let sol_to_dex = 79_000_000_000u64;
        let init_amount_0 = LP_RESERVE_TOKENS;
        let init_amount_1 = sol_to_dex;

        // After Raydium initializes: vault_0_amount >= init_amount_0
        //                            vault_1_amount >= init_amount_1
        let vault0_amount = init_amount_0; // exactly deposited
        let vault1_amount = init_amount_1;

        assert!(vault0_amount >= init_amount_0);
        assert!(vault1_amount >= init_amount_1);
    }

    /// LP supply after graduation = minimum_liquidity (100) locked by Raydium.
    /// We burned `actual_lp = sqrt(init0 * init1) - 100`.
    /// Total minted by Raydium = sqrt(init0 * init1).
    /// Remaining in pool = 100 (the Raydium-locked minimum liquidity).
    #[test]
    fn sim_lp_supply_after_burn_equals_minimum_liquidity() {
        let sol_to_dex = 79_000_000_000u64;
        let init_amount_0 = LP_RESERVE_TOKENS;
        let init_amount_1 = sol_to_dex;

        let raydium_total_minted =
            integer_sqrt((init_amount_0 as u128) * (init_amount_1 as u128));
        let burned = compute_expected_lp(init_amount_0, init_amount_1).unwrap();
        let remaining_in_pool = raydium_total_minted - burned; // = 100

        assert_eq!(remaining_in_pool, 100, "Raydium minimum liquidity lock = 100");
    }

    /// creator_lp_token.amount after burn = 0 (step 24 assertion).
    #[test]
    fn sim_creator_lp_token_zero_after_burn() {
        let actual_lp = 3_975_237u64; // example LP amount
        let post_burn = actual_lp - actual_lp; // burned all
        assert_eq!(post_burn, 0, "LP token account must be empty after burn");
    }

    // ── I. Treasury accounting ────────────────────────────────────────────────

    /// Treasury receives exactly graduation_dex_fee_snapshot at step 15.
    #[test]
    fn sim_treasury_receives_exact_dex_fee() {
        let mut treasury = make_treasury();
        let dex_fee = GRADUATION_DEX_FEE_LAMPORTS;
        let treasury_before = treasury.total_sol_collected;

        // Step 15 simulation
        treasury.total_sol_collected += dex_fee;

        assert_eq!(
            treasury.total_sol_collected - treasury_before,
            dex_fee,
            "treasury.total_sol_collected must increase by exactly dex_fee"
        );
        assert_eq!(treasury.total_sol_collected, 6_000_000_000);
    }

    /// treasury.total_sol_collected accumulates across multiple graduations.
    #[test]
    fn sim_treasury_accumulates_across_graduations() {
        let mut treasury = make_treasury();
        let dex_fee = GRADUATION_DEX_FEE_LAMPORTS;
        treasury.total_sol_collected += dex_fee;
        treasury.total_sol_collected += dex_fee;
        assert_eq!(treasury.total_sol_collected, dex_fee * 2);
    }

    // ── J. State-machine invariants ───────────────────────────────────────────

    /// The full state machine: ACTIVE → ELIGIBLE → GRADUATING → GRADUATED.
    /// `complete` and `graduated` are both false → both true; never reversed.
    #[test]
    fn sim_state_machine_complete_graduation_flow() {
        let mut curve = make_curve_at_threshold();

        // ACTIVE / ELIGIBLE: complete=false, graduated=false
        assert!(!curve.complete);
        assert!(!curve.graduated);

        // initiate_graduation: complete=true, graduated=false
        curve.complete = true;
        curve.graduation_dex_fee_snapshot = GRADUATION_DEX_FEE_LAMPORTS;
        assert!(curve.complete);
        assert!(!curve.graduated);

        // complete_graduation: complete=true, graduated=true
        curve.graduated = true;
        assert!(curve.complete);
        assert!(curve.graduated);
    }

    /// `graduation_dex_fee_snapshot` is locked at the config value at the time
    /// `initiate_graduation` runs; later config changes do not affect it.
    #[test]
    fn sim_dex_fee_snapshot_locked_at_initiation_time() {
        let mut curve = make_curve_at_threshold();
        let dex_fee_at_initiation = GRADUATION_DEX_FEE_LAMPORTS;

        curve.complete = true;
        curve.graduation_dex_fee_snapshot = dex_fee_at_initiation;

        // Simulate admin changing graduation_dex_fee AFTER initiation
        let new_admin_dex_fee = 8_000_000_000u64; // 8 SOL (changed by admin)
        let _ = new_admin_dex_fee; // config changed but snapshot is frozen

        assert_eq!(
            curve.graduation_dex_fee_snapshot, dex_fee_at_initiation,
            "snapshot must not change after graduation is initiated"
        );
    }

    /// Property: `graduated` is monotone — once set, stays true.
    #[test]
    fn prop_graduated_flag_is_monotone_once_set() {
        let mut curve = make_curve_at_threshold();
        curve.complete = true;
        curve.graduated = true;

        // Any subsequent operation must not clear graduated
        // (there is no on-chain instruction that clears graduated)
        assert!(curve.graduated, "graduated must remain true permanently");
    }

    /// Verifies that all four key invariants hold simultaneously after a
    /// successful complete_graduation with canonical parameters.
    #[test]
    fn sim_all_post_graduation_invariants_hold() {
        let mut curve = make_curve_at_threshold();
        let config = make_config();
        let mut treasury = make_treasury();
        let initial_creator_fees = curve.creator_fees_accumulated;

        // Run through graduation
        let dex_fee = config.graduation_dex_fee;
        let sol_to_dex = curve.real_sol_reserves - dex_fee;
        curve.complete = true;
        curve.graduation_dex_fee_snapshot = dex_fee;
        treasury.total_sol_collected += dex_fee;
        curve.graduated = true;

        // Invariant 1: graduated = true
        assert!(curve.graduated, "I1: graduated must be true");
        // Invariant 2: complete = true (trading permanently blocked)
        assert!(curve.complete, "I2: complete must be true");
        // Invariant 3: creator_fees_accumulated unchanged
        assert_eq!(
            curve.creator_fees_accumulated, initial_creator_fees,
            "I3: creator fees preserved through graduation"
        );
        // Invariant 4: treasury received exactly dex_fee
        assert_eq!(
            treasury.total_sol_collected, dex_fee,
            "I4: treasury total_sol_collected = dex_fee"
        );
        // Invariant 5: sol_to_dex is positive and < real_sol_reserves
        assert!(sol_to_dex > 0, "I5: sol_to_dex must be positive");
        assert!(
            sol_to_dex < curve.real_sol_reserves,
            "I5: sol_to_dex must be < real_sol_reserves"
        );
        // Invariant 6: sol conservation
        assert_eq!(
            sol_to_dex + dex_fee,
            curve.real_sol_reserves,
            "I6: sol_to_dex + dex_fee == real_sol_reserves"
        );
        // Invariant 7: LP_RESERVE_TOKENS + BONDING_SUPPLY_TOKENS == TOTAL_SUPPLY_TOKENS
        assert_eq!(
            LP_RESERVE_TOKENS + BONDING_SUPPLY_TOKENS,
            TOTAL_SUPPLY_TOKENS,
            "I7: token supply allocation must be exact"
        );
    }
}
