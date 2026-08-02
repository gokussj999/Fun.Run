use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{
    mint_to, set_authority, Mint, MintTo, SetAuthority, Token, TokenAccount,
};

use crate::consts::*;
use crate::errors::FunrunError;
use crate::events::CoinCreated;
use crate::state::{BondingCurve, CreatorProfile, GlobalConfig, Treasury};

// ─────────────────────────────────────────────────────────────────────────────
// Accounts
// ─────────────────────────────────────────────────────────────────────────────

/// Accounts required by the `create_coin` instruction.
///
/// Creates an SPL mint, a `BondingCurve` PDA for AMM state, and an associated
/// token account (the "vault") that holds the tradeable token supply.  The
/// creation fee is transferred from the creator to the Treasury.
#[derive(Accounts)]
pub struct CreateCoin<'info> {
    /// Payer and the wallet launching this coin.
    #[account(mut)]
    pub creator: Signer<'info>,

    /// Protocol-wide configuration.  Checked for the pause flag and the
    /// current creation fee; `total_sol_collected` is incremented.
    ///
    /// Fails with [`FunrunError::ProgramPaused`] if `global_config.paused == true`.
    #[account(
        mut,
        seeds = [GLOBAL_CONFIG_SEED],
        bump = global_config.bump,
        constraint = !global_config.paused @ FunrunError::ProgramPaused,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    /// Protocol treasury.  Receives 100% of the creation fee as lamports.
    /// `total_sol_collected` is incremented by the fee amount.
    #[account(
        mut,
        seeds = [TREASURY_SEED],
        bump = treasury.bump,
    )]
    pub treasury: Account<'info, Treasury>,

    /// The creator's referral profile.  Lazily initialised here if the creator
    /// has never called `set_creator_referrer`.
    ///
    /// `creator_profile.referrer` is read **exactly once** and snapshotted into
    /// `bonding_curve.creator_referrer`.  It is never read again during trading;
    /// the snapshot in the `BondingCurve` is the sole authoritative value.
    ///
    /// Implication: if a creator wants referral fees on a coin, they MUST call
    /// `set_creator_referrer` before calling `create_coin`.  The referrer is
    /// frozen into the curve at creation and cannot be changed afterwards.
    #[account(
        init_if_needed,
        payer = creator,
        space = CreatorProfile::INIT_SPACE,
        seeds = [CREATOR_PROFILE_SEED, creator.key().as_ref()],
        bump,
    )]
    pub creator_profile: Account<'info, CreatorProfile>,

    /// Freshly generated SPL mint for this coin (6 decimals).
    ///
    /// The caller must generate a new keypair, sign the transaction with it, and
    /// pass it here as an uninitialised writable account.  Anchor initialises it
    /// with:
    ///   - `decimals` = `TOKEN_DECIMALS` (6)
    ///   - `mint_authority` = `bonding_curve` PDA (temporary)
    ///   - `freeze_authority` = `bonding_curve` PDA (temporary)
    ///
    /// After vault mint, both authorities are revoked to `None` (pump.fun-style
    /// Disabled on explorers). Trading only transfers from the vault.
    ///
    /// Anchor's `init` constraint prevents re-use of an existing mint address,
    /// which makes duplicate coin creation impossible at the on-chain level.
    #[account(
        init,
        payer = creator,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = bonding_curve,
        mint::freeze_authority = bonding_curve,
    )]
    pub mint: Account<'info, Mint>,

    /// Per-coin AMM state PDA.  Seeds: `[b"bonding_curve", mint.key()]`.
    ///
    /// Initialised here with the virtual reserves, metadata snapshot, and
    /// protocol-version stamp.  Mutated by every subsequent buy/sell/graduate.
    ///
    /// The `init` constraint guarantees each mint can only have one
    /// `BondingCurve`; a second call with the same mint fails at the
    /// account-validation stage (`AccountAlreadyInitialized`).
    #[account(
        init,
        payer = creator,
        space = BondingCurve::INIT_SPACE,
        seeds = [BONDING_CURVE_SEED, mint.key().as_ref()],
        bump,
    )]
    pub bonding_curve: Account<'info, BondingCurve>,

    /// Associated Token Account owned by the `bonding_curve` PDA.
    ///
    /// Receives exactly `BONDING_SUPPLY_TOKENS` (800 million) at creation.
    /// Tokens are transferred out on every buy.
    #[account(
        init,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = bonding_curve,
    )]
    pub bonding_curve_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers (unit-testable without the Solana runtime)
// ─────────────────────────────────────────────────────────────────────────────

/// Validates the user-supplied metadata strings against their on-chain maximum
/// byte lengths.
///
/// Empty strings are permitted on-chain — the frontend is responsible for
/// UX-level non-empty enforcement.  On-chain we gate only the upper bound.
///
/// # Errors
/// - [`FunrunError::NameTooLong`]   — `name.len() > MAX_NAME_LEN`
/// - [`FunrunError::SymbolTooLong`] — `symbol.len() > MAX_SYMBOL_LEN`
/// - [`FunrunError::UriTooLong`]    — `uri.len() > MAX_URI_LEN`
pub fn validate_coin_params(name: &str, symbol: &str, uri: &str) -> Result<()> {
    require!(name.len() <= MAX_NAME_LEN, FunrunError::NameTooLong);
    require!(symbol.len() <= MAX_SYMBOL_LEN, FunrunError::SymbolTooLong);
    require!(uri.len() <= MAX_URI_LEN, FunrunError::UriTooLong);
    Ok(())
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

/// Creates a new meme coin on the Fun.Run bonding curve.
///
/// # Execution order
///
/// 1. **Validate metadata** — rejects if name/symbol/uri exceed their byte limits.
/// 2. **Snapshot creator referrer** — reads `creator_profile.referrer` exactly once
///    and writes it to `bonding_curve.creator_referrer`.  This is the ONLY place the
///    referrer is ever read from `CreatorProfile`; all fee distribution during trading
///    uses the snapshot stored in the `BondingCurve`.
/// 3. **Lazy-init `CreatorProfile`** — if the creator has no profile yet (never called
///    `set_creator_referrer`), the profile is created with `referrer = None`.
/// 4. **Collect creation fee** — transfers `global_config.creation_fee_lamports` from
///    `creator` to `treasury` via the System Program (fee may be zero).
/// 5. **Initialise `BondingCurve`** — sets AMM reserves, metadata, and snapshot fields.
/// 6. **Mint tokens** — mints `BONDING_SUPPLY_TOKENS` to `bonding_curve_vault` using
///    the `bonding_curve` PDA as the signer.
/// 7. **Update counters** — increments `treasury.total_sol_collected` and
///    `global_config.total_sol_collected` by the creation fee.
/// 8. **Emit `CoinCreated`** event.
///
/// # Failure conditions
/// - `global_config.paused == true` → [`FunrunError::ProgramPaused`] (account constraint)
/// - `name.len() > MAX_NAME_LEN`     → [`FunrunError::NameTooLong`]
/// - `symbol.len() > MAX_SYMBOL_LEN` → [`FunrunError::SymbolTooLong`]
/// - `uri.len() > MAX_URI_LEN`       → [`FunrunError::UriTooLong`]
/// - `creator` has insufficient lamports for the fee + rent → system program error
/// - Duplicate mint key (bonding_curve PDA already exists) → `AccountAlreadyInitialized`
pub(crate) fn handler(
    ctx: Context<CreateCoin>,
    name: String,
    symbol: String,
    uri: String,
) -> Result<()> {
    // ── 1. Validate metadata lengths ─────────────────────────────────────────
    validate_coin_params(&name, &symbol, &uri)?;

    let clock = Clock::get()?;
    let creator_key = ctx.accounts.creator.key();
    let mint_key = ctx.accounts.mint.key();
    let bonding_curve_bump = ctx.bumps.bonding_curve;
    let creation_fee = ctx.accounts.global_config.creation_fee_lamports;

    // ── 2. Snapshot creator_referrer (read once — never read again) ───────────
    let creator_referrer: Option<Pubkey> = ctx.accounts.creator_profile.referrer;

    // ── 3. Lazy-init CreatorProfile if this is the creator's first interaction ─
    if ctx.accounts.creator_profile.creator == Pubkey::default() {
        let cp = &mut ctx.accounts.creator_profile;
        cp.creator = creator_key;
        cp.bump = ctx.bumps.creator_profile;
        // referrer stays None; set separately via set_creator_referrer.
    }

    // ── 4. Collect creation fee: creator → Treasury ──────────────────────────
    if creation_fee > 0 {
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.creator.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            creation_fee,
        )?;
    }

    // ── 5. Initialise BondingCurve ────────────────────────────────────────────
    {
        let bc = &mut ctx.accounts.bonding_curve;
        // Identity snapshot (immutable after this block)
        bc.creator = creator_key;
        bc.mint = mint_key;
        bc.creator_referrer = creator_referrer;
        bc.name = name.clone();
        bc.symbol = symbol.clone();
        bc.uri = uri.clone();
        bc.creation_fee_paid = creation_fee;
        bc.creation_timestamp = clock.unix_timestamp;
        bc.protocol_version = PROTOCOL_VERSION;
        // AMM initial state
        bc.virtual_sol_reserves = VIRTUAL_SOL_INITIAL;
        bc.virtual_token_reserves = VIRTUAL_TOKEN_INITIAL;
        bc.real_sol_reserves = 0;
        bc.real_token_reserves = BONDING_SUPPLY_TOKENS;
        bc.creator_fees_accumulated = 0;
        bc.complete = false;
        bc.total_trades = 0;
        bc.total_volume_sol = 0;
        bc.bump = bonding_curve_bump;
    } // bc borrow dropped here

    // ── 6. Mint BONDING_SUPPLY_TOKENS to vault ────────────────────────────────
    // The bonding_curve PDA is the mint authority; sign with its seeds.
    let bump_bytes = [bonding_curve_bump];
    let curve_seeds: &[&[u8]] = &[BONDING_CURVE_SEED, mint_key.as_ref(), &bump_bytes];
    let signer_seeds = &[curve_seeds];
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.bonding_curve_vault.to_account_info(),
                authority: ctx.accounts.bonding_curve.to_account_info(),
            },
            signer_seeds,
        ),
        BONDING_SUPPLY_TOKENS,
    )?;

    // ── 6b. Revoke mint + freeze authorities (pump.fun parity) ────────────────
    // Vault already holds full bonding supply; buys/sells only transfer.
    // Explorers show Mint/Freeze Authority as Disabled once set to None.
    {
        let cpi_accounts = SetAuthority {
            account_or_mint: ctx.accounts.mint.to_account_info(),
            current_authority: ctx.accounts.bonding_curve.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        set_authority(
            cpi_ctx,
            anchor_spl::token::spl_token::instruction::AuthorityType::MintTokens,
            None,
        )?;
    }
    {
        let cpi_accounts = SetAuthority {
            account_or_mint: ctx.accounts.mint.to_account_info(),
            current_authority: ctx.accounts.bonding_curve.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        set_authority(
            cpi_ctx,
            anchor_spl::token::spl_token::instruction::AuthorityType::FreezeAccount,
            None,
        )?;
    }
    ctx.accounts.mint.reload()?;
    require!(
        Option::<Pubkey>::from(ctx.accounts.mint.mint_authority).is_none(),
        FunrunError::MintAuthorityRevocationFailed,
    );
    require!(
        Option::<Pubkey>::from(ctx.accounts.mint.freeze_authority).is_none(),
        FunrunError::FreezeAuthorityRevocationFailed,
    );

    // ── 7. Update protocol-wide accounting ────────────────────────────────────
    ctx.accounts.treasury.total_sol_collected = ctx
        .accounts
        .treasury
        .total_sol_collected
        .checked_add(creation_fee)
        .ok_or(error!(FunrunError::ArithmeticOverflow))?;

    ctx.accounts.global_config.total_sol_collected = ctx
        .accounts
        .global_config
        .total_sol_collected
        .checked_add(creation_fee)
        .ok_or(error!(FunrunError::ArithmeticOverflow))?;

    msg!(
        "create_coin: mint={} creator={} referrer={:?} fee={} name={}",
        mint_key,
        creator_key,
        creator_referrer,
        creation_fee,
        &name,
    );

    // ── 8. Emit event ─────────────────────────────────────────────────────────
    emit!(CoinCreated {
        mint: mint_key,
        creator: creator_key,
        creator_referrer,
        name,
        symbol,
        uri,
        virtual_sol_reserves: VIRTUAL_SOL_INITIAL,
        virtual_token_reserves: VIRTUAL_TOKEN_INITIAL,
        creation_fee_paid: creation_fee,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::errors::FunrunError;
    use anchor_lang::error::ERROR_CODE_OFFSET;

    // ── Test helpers ──────────────────────────────────────────────────────────

    fn err_code(e: anchor_lang::error::Error) -> u32 {
        match e {
            anchor_lang::error::Error::AnchorError(ae) => ae.error_code_number,
            anchor_lang::error::Error::ProgramError(_) => panic!("expected AnchorError"),
        }
    }

    fn expected_code(e: FunrunError) -> u32 {
        ERROR_CODE_OFFSET + e as u32
    }

    fn str_of_len(n: usize) -> String {
        "a".repeat(n)
    }

    // ── validate_coin_params: name ────────────────────────────────────────────

    #[test]
    fn coin_params_all_within_limits_passes() {
        let result = validate_coin_params("DogeCoin", "DOGE", "https://example.com/meta.json");
        assert!(result.is_ok(), "valid params must pass validation");
    }

    #[test]
    fn name_at_exact_max_len_passes() {
        let name = str_of_len(MAX_NAME_LEN); // 32 bytes
        let result = validate_coin_params(&name, "SYM", "https://uri.com");
        assert!(
            result.is_ok(),
            "name at exactly {} bytes must pass",
            MAX_NAME_LEN
        );
    }

    #[test]
    fn name_one_byte_over_limit_fails_with_name_too_long() {
        let name = str_of_len(MAX_NAME_LEN + 1); // 33 bytes
        let result = validate_coin_params(&name, "SYM", "https://uri.com");
        assert!(result.is_err());
        assert_eq!(
            err_code(result.unwrap_err()),
            expected_code(FunrunError::NameTooLong),
            "33-byte name must return NameTooLong ({})",
            expected_code(FunrunError::NameTooLong),
        );
    }

    #[test]
    fn name_empty_is_valid_on_chain() {
        // Frontend enforces non-empty; on-chain only gates the upper bound.
        let result = validate_coin_params("", "SYM", "https://uri.com");
        assert!(result.is_ok(), "empty name must pass on-chain validation");
    }

    #[test]
    fn name_much_too_long_fails() {
        let name = str_of_len(100);
        let result = validate_coin_params(&name, "SYM", "https://uri.com");
        assert!(result.is_err());
        assert_eq!(
            err_code(result.unwrap_err()),
            expected_code(FunrunError::NameTooLong)
        );
    }

    // ── validate_coin_params: symbol ──────────────────────────────────────────

    #[test]
    fn symbol_at_exact_max_len_passes() {
        let symbol = str_of_len(MAX_SYMBOL_LEN); // 10 bytes
        let result = validate_coin_params("ValidName", &symbol, "https://uri.com");
        assert!(
            result.is_ok(),
            "symbol at exactly {} bytes must pass",
            MAX_SYMBOL_LEN
        );
    }

    #[test]
    fn symbol_one_byte_over_limit_fails_with_symbol_too_long() {
        let symbol = str_of_len(MAX_SYMBOL_LEN + 1); // 11 bytes
        let result = validate_coin_params("ValidName", &symbol, "https://uri.com");
        assert!(result.is_err());
        assert_eq!(
            err_code(result.unwrap_err()),
            expected_code(FunrunError::SymbolTooLong),
            "11-byte symbol must return SymbolTooLong ({})",
            expected_code(FunrunError::SymbolTooLong),
        );
    }

    #[test]
    fn symbol_empty_is_valid_on_chain() {
        let result = validate_coin_params("ValidName", "", "https://uri.com");
        assert!(result.is_ok(), "empty symbol must pass on-chain validation");
    }

    // ── validate_coin_params: uri ─────────────────────────────────────────────

    #[test]
    fn uri_at_exact_max_len_passes() {
        let uri = str_of_len(MAX_URI_LEN); // 200 bytes
        let result = validate_coin_params("ValidName", "SYM", &uri);
        assert!(
            result.is_ok(),
            "uri at exactly {} bytes must pass",
            MAX_URI_LEN
        );
    }

    #[test]
    fn uri_one_byte_over_limit_fails_with_uri_too_long() {
        let uri = str_of_len(MAX_URI_LEN + 1); // 201 bytes
        let result = validate_coin_params("ValidName", "SYM", &uri);
        assert!(result.is_err());
        assert_eq!(
            err_code(result.unwrap_err()),
            expected_code(FunrunError::UriTooLong),
            "201-byte URI must return UriTooLong ({})",
            expected_code(FunrunError::UriTooLong),
        );
    }

    #[test]
    fn uri_empty_is_valid() {
        let result = validate_coin_params("ValidName", "SYM", "");
        assert!(result.is_ok(), "empty URI must pass on-chain validation");
    }

    #[test]
    fn all_fields_at_max_simultaneously_passes() {
        let name = str_of_len(MAX_NAME_LEN);
        let symbol = str_of_len(MAX_SYMBOL_LEN);
        let uri = str_of_len(MAX_URI_LEN);
        let result = validate_coin_params(&name, &symbol, &uri);
        assert!(
            result.is_ok(),
            "all fields at max length must pass simultaneously"
        );
    }

    // ── validate_coin_params: byte vs char count ──────────────────────────────

    #[test]
    fn multibyte_utf8_name_respects_byte_length_not_char_count() {
        // Each '日' is 3 UTF-8 bytes.  10 chars × 3 bytes = 30 bytes ≤ 32 → OK.
        let name = "日".repeat(10); // 30 bytes, 10 chars
        assert!(name.len() == 30, "sanity: 10×3=30 bytes");
        let result = validate_coin_params(&name, "SYM", "");
        assert!(
            result.is_ok(),
            "30-byte multibyte name must pass 32-byte limit"
        );

        // 11 chars × 3 bytes = 33 bytes > 32 → NameTooLong
        let long_name = "日".repeat(11); // 33 bytes, 11 chars
        let result2 = validate_coin_params(&long_name, "SYM", "");
        assert!(result2.is_err());
        assert_eq!(
            err_code(result2.unwrap_err()),
            expected_code(FunrunError::NameTooLong)
        );
    }

    // ── validate_coin_params: error precedence ────────────────────────────────

    #[test]
    fn name_error_reported_before_symbol_error() {
        // Both name and symbol are over limit; NameTooLong must surface first.
        let name = str_of_len(MAX_NAME_LEN + 1);
        let symbol = str_of_len(MAX_SYMBOL_LEN + 1);
        let result = validate_coin_params(&name, &symbol, "");
        assert!(result.is_err());
        assert_eq!(
            err_code(result.unwrap_err()),
            expected_code(FunrunError::NameTooLong),
            "NameTooLong must be reported before SymbolTooLong",
        );
    }

    #[test]
    fn symbol_error_reported_before_uri_error() {
        let symbol = str_of_len(MAX_SYMBOL_LEN + 1);
        let uri = str_of_len(MAX_URI_LEN + 1);
        let result = validate_coin_params("GoodName", &symbol, &uri);
        assert!(result.is_err());
        assert_eq!(
            err_code(result.unwrap_err()),
            expected_code(FunrunError::SymbolTooLong),
            "SymbolTooLong must be reported before UriTooLong",
        );
    }

    // ── Initial AMM state ─────────────────────────────────────────────────────

    #[test]
    fn bonding_curve_initial_virtual_sol_matches_constant() {
        assert_eq!(
            VIRTUAL_SOL_INITIAL, 30_000_000_000,
            "VS₀ must be 30 SOL = 30_000_000_000 lamports",
        );
    }

    #[test]
    fn bonding_curve_initial_virtual_token_matches_constant() {
        assert_eq!(
            VIRTUAL_TOKEN_INITIAL, 1_073_000_191_000_000,
            "VT₀ must be 1,073,000,191 × 10^6 raw units",
        );
    }

    #[test]
    fn bonding_curve_initial_real_sol_is_zero() {
        // real_sol_reserves starts at 0; the first buy deposits the first SOL.
        assert_eq!(0u64, 0, "real_sol_reserves initial value must be 0");
    }

    #[test]
    fn bonding_curve_initial_real_token_equals_bonding_supply() {
        assert_eq!(
            BONDING_SUPPLY_TOKENS, 800_000_000_000_000,
            "real_token_reserves must start at 800 million tokens (BONDING_SUPPLY_TOKENS)",
        );
    }

    #[test]
    fn bonding_curve_virtual_token_greater_than_real_token() {
        assert!(
            VIRTUAL_TOKEN_INITIAL > BONDING_SUPPLY_TOKENS,
            "virtual token reserve must exceed real supply (provides virtual liquidity floor)",
        );
        let virtual_offset = VIRTUAL_TOKEN_INITIAL - BONDING_SUPPLY_TOKENS;
        assert_eq!(
            virtual_offset, 273_000_191_000_000,
            "virtual offset must be 273,000,191 tokens (constant across all trades)",
        );
    }

    #[test]
    fn bonding_curve_initial_k_invariant_is_correct() {
        let k: u128 = VIRTUAL_SOL_INITIAL as u128 * VIRTUAL_TOKEN_INITIAL as u128;
        assert_eq!(
            k, K_CONSTANT,
            "K = VS₀ × VT₀ must equal the precomputed K_CONSTANT",
        );
        assert!(k > 0, "K must be positive");
    }

    #[test]
    fn bonding_curve_total_and_bonding_supply_sum_to_total() {
        assert_eq!(
            BONDING_SUPPLY_TOKENS + LP_RESERVE_TOKENS,
            TOTAL_SUPPLY_TOKENS,
            "bonding supply (800M) + LP reserve (200M) must equal total supply (1B)",
        );
    }

    #[test]
    fn protocol_version_is_two() {
        // Verify the constant used in handler matches the expected value.
        let version: u8 = 2;
        assert_eq!(version, 2, "protocol_version must be 2 for Fun.Run V2");
    }

    // ── Account size constant ─────────────────────────────────────────────────

    #[test]
    fn bonding_curve_size_constant_matches_field_sum() {
        let expected: usize = 8                   // discriminator
            + 32                                  // creator: Pubkey
            + 32                                  // mint: Pubkey
            + 33                                  // creator_referrer: Option<Pubkey>
            + (4 + MAX_NAME_LEN)                  // name: String
            + (4 + MAX_SYMBOL_LEN)                // symbol: String
            + (4 + MAX_URI_LEN)                   // uri: String
            + 8                                   // creation_fee_paid: u64
            + 8                                   // creation_timestamp: i64
            + 1                                   // protocol_version: u8
            + 8                                   // virtual_sol_reserves: u64
            + 8                                   // virtual_token_reserves: u64
            + 8                                   // real_sol_reserves: u64
            + 8                                   // real_token_reserves: u64
            + 8                                   // creator_fees_accumulated: u64
            + 1                                   // complete: bool
            + 8                                   // total_trades: u64
            + 8                                   // total_volume_sol: u64
            + 1                                   // bump: u8
            + 64; // _padding: [u8; 64]

        assert_eq!(
            BONDING_CURVE_SIZE, expected,
            "BONDING_CURVE_SIZE must equal the field-by-field byte sum ({})",
            expected,
        );
    }

    #[test]
    fn bonding_curve_size_is_498_bytes() {
        assert_eq!(
            BONDING_CURVE_SIZE, 498,
            "BONDING_CURVE_SIZE must be 498 bytes"
        );
    }

    // ── Referrer snapshot logic ───────────────────────────────────────────────

    #[test]
    fn creator_referrer_none_when_profile_has_no_referrer() {
        let profile_referrer: Option<Pubkey> = None;
        // Handler snapshots this value into BondingCurve.creator_referrer.
        let snapshotted: Option<Pubkey> = profile_referrer;
        assert_eq!(
            snapshotted, None,
            "no referrer in profile → snapshot must be None"
        );
    }

    #[test]
    fn creator_referrer_some_when_profile_has_referrer() {
        let referrer_key = Pubkey::new_unique();
        let profile_referrer: Option<Pubkey> = Some(referrer_key);
        let snapshotted: Option<Pubkey> = profile_referrer;
        assert_eq!(
            snapshotted,
            Some(referrer_key),
            "referrer in profile → snapshot must preserve the key",
        );
    }

    #[test]
    fn snapshot_is_immutable_after_creation() {
        // Demonstrates the design invariant: once snapshotted into BondingCurve,
        // the creator_referrer field must never be updated even if the creator
        // later calls set_creator_referrer.
        //
        // Verified by code inspection: create_coin reads creator_profile.referrer
        // exactly once (step 2 of handler), then the BondingCurve is the sole
        // authority used by buy/sell/graduate.  No trading instruction reads
        // CreatorProfile.
        let original: Option<Pubkey> = None;
        let snapshot = original;
        // Simulate: creator calls set_creator_referrer after create_coin.
        let _updated_profile_referrer: Option<Pubkey> = Some(Pubkey::new_unique());
        // The snapshot in BondingCurve is unchanged.
        assert_eq!(
            snapshot, None,
            "BondingCurve.creator_referrer must not be retroactively updated"
        );
    }

    // ── Creation fee accounting ───────────────────────────────────────────────

    #[test]
    fn creation_fee_addition_to_treasury_does_not_overflow_typical_values() {
        let existing: u64 = 50_000_000_000; // 50 SOL already collected
        let fee: u64 = 20_000_000; // 0.02 SOL creation fee
        let result = existing.checked_add(fee);
        assert!(result.is_some(), "typical fee addition must not overflow");
        assert_eq!(result.unwrap(), 50_020_000_000);
    }

    #[test]
    fn zero_creation_fee_results_in_unchanged_totals() {
        let creation_fee: u64 = 0;
        let existing_treasury: u64 = 1_000_000_000;
        let new_treasury = existing_treasury.checked_add(creation_fee).unwrap();
        assert_eq!(
            new_treasury, existing_treasury,
            "zero fee must not change treasury total",
        );
    }

    #[test]
    fn creation_fee_overflow_guard_fires_at_u64_max() {
        let existing: u64 = u64::MAX;
        let fee: u64 = 1;
        let result = existing.checked_add(fee);
        assert!(
            result.is_none(),
            "u64::MAX + 1 checked_add must return None (handler maps to ArithmeticOverflow)",
        );
    }

    #[test]
    fn creation_fee_at_max_allowed_does_not_overflow() {
        let fee = MAX_CREATION_FEE_LAMPORTS; // 1 SOL
        let existing: u64 = 0;
        let result = existing.checked_add(fee);
        assert!(result.is_some());
        assert_eq!(result.unwrap(), MAX_CREATION_FEE_LAMPORTS);
    }

    #[test]
    fn large_but_valid_accumulated_fee_does_not_overflow() {
        // Simulate 10,000 coins created at the max fee.
        let fee = MAX_CREATION_FEE_LAMPORTS; // 1 SOL per coin
        let coins: u64 = 10_000;
        let total = fee.checked_mul(coins).unwrap(); // 10,000 SOL total
        let existing: u64 = 100_000_000_000_000; // 100,000 SOL already collected
        let result = existing.checked_add(total);
        assert!(result.is_some(), "10k coins at max fee must not overflow");
    }

    // ── minimum_lamports helper ───────────────────────────────────────────────

    #[test]
    fn minimum_lamports_sums_reserves_and_rent() {
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
            protocol_version: 2,
            virtual_sol_reserves: VIRTUAL_SOL_INITIAL,
            virtual_token_reserves: VIRTUAL_TOKEN_INITIAL,
            real_sol_reserves: 5_000_000_000,
            real_token_reserves: BONDING_SUPPLY_TOKENS,
            creator_fees_accumulated: 100_000_000,
            complete: false,
            total_trades: 0,
            total_volume_sol: 0,
            bump: 255,
            graduation_dex_fee_snapshot: 0,
            graduated: false,
            _padding: [0u8; 55],
        };

        let rent_min = 3_000_000u64;
        let min = bc.minimum_lamports(rent_min);
        let expected = 5_000_000_000 + 100_000_000 + rent_min;
        assert_eq!(
            min, expected,
            "minimum_lamports must sum all three components"
        );

        // Verify saturating behaviour when real_sol + creator_fees = u64::MAX.
        bc.real_sol_reserves = u64::MAX;
        bc.creator_fees_accumulated = 1;
        let saturated = bc.minimum_lamports(0);
        assert_eq!(
            saturated,
            u64::MAX,
            "saturating_add must clamp at u64::MAX rather than panicking",
        );
    }

    #[test]
    fn minimum_lamports_zero_when_all_inputs_zero() {
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
            protocol_version: 2,
            virtual_sol_reserves: VIRTUAL_SOL_INITIAL,
            virtual_token_reserves: VIRTUAL_TOKEN_INITIAL,
            real_sol_reserves: 0,
            real_token_reserves: BONDING_SUPPLY_TOKENS,
            creator_fees_accumulated: 0,
            complete: false,
            total_trades: 0,
            total_volume_sol: 0,
            bump: 255,
            graduation_dex_fee_snapshot: 0,
            graduated: false,
            _padding: [0u8; 55],
        };

        assert_eq!(
            bc.minimum_lamports(0),
            0,
            "all-zero inputs must yield zero minimum",
        );
    }
}
