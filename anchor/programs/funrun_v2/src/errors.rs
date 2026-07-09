use anchor_lang::prelude::*;

#[error_code]
pub enum FunrunError {
    // ── Validation ────────────────────────────────────────────────────────────
    /// total_trading_fee_bps or creation_fee_lamports exceeds the hard-coded ceiling.
    #[msg("Fee configuration exceeds maximum allowed value")]
    InvalidFeeConfiguration,

    /// Token name exceeds MAX_NAME_LEN (32 bytes).
    #[msg("Token name exceeds 32 bytes")]
    NameTooLong,

    /// Token symbol exceeds MAX_SYMBOL_LEN (10 bytes).
    #[msg("Token symbol exceeds 10 bytes")]
    SymbolTooLong,

    /// Metadata URI exceeds MAX_URI_LEN (200 bytes).
    #[msg("Metadata URI exceeds 200 bytes")]
    UriTooLong,

    /// Creator tried to set themselves as their own creator_referrer.
    #[msg("Cannot set yourself as your own creator referrer")]
    SelfReferral,

    /// CreatorProfile already has a creator_referrer; the relationship is immutable.
    #[msg("Creator referrer is already set and cannot be changed")]
    ReferralAlreadySet,

    /// Setting this referrer would form a direct circular relationship
    /// (referrer already has this creator as their own referrer).
    #[msg("Circular referral relationship detected")]
    CircularReferral,

    /// sol_amount or token_amount passed to buy/sell is zero.
    #[msg("Trade amount must be greater than zero")]
    ZeroAmount,

    // ── Slippage ──────────────────────────────────────────────────────────────
    /// tokens_out < min_tokens_out (buy), or sol_net < min_sol_out (sell).
    #[msg("Output amount is below the minimum acceptable (slippage exceeded)")]
    SlippageExceeded,

    /// Computed AMM output is zero — trade is at the extreme edge of the curve.
    #[msg("Computed output amount is zero; trade too small")]
    InsufficientOutput,

    // ── State ─────────────────────────────────────────────────────────────────
    /// Bonding curve has graduated to DEX; bonding curve trading is closed.
    #[msg("Bonding curve has already graduated; trading is closed")]
    CurveComplete,

    /// Global pause is active; all user-facing instructions are halted.
    #[msg("The program is currently paused")]
    ProgramPaused,

    /// graduate instruction called but real_sol_reserves is below the threshold.
    #[msg("Graduation threshold has not been reached yet")]
    GraduationThresholdNotMet,

    /// The curve's `protocol_version` does not match the current `PROTOCOL_VERSION`
    /// constant; graduation is only supported for curves created with this version.
    #[msg("On-chain protocol_version is incompatible with this instruction")]
    ProtocolVersionMismatch,

    /// `real_sol_reserves` is less than `graduation_dex_fee`; there is not enough
    /// SOL in the curve to cover the Raydium pool creation fee after graduation.
    #[msg("Insufficient real SOL in the curve to cover the graduation DEX fee")]
    InsufficientSolForGraduation,

    /// The computed graduation snapshot is internally inconsistent — for example,
    /// `sol_to_dex` resolved to zero, which would create an empty DEX pool.
    #[msg("Graduation snapshot is inconsistent with current curve state")]
    GraduationSnapshotInconsistency,

    /// A sell would drain more SOL than real_sol_reserves currently holds.
    #[msg("Insufficient real SOL in bonding curve for this sell")]
    InsufficientSolInCurve,

    /// A buy would require more tokens than the token vault currently holds.
    #[msg("Insufficient tokens in vault for this buy")]
    InsufficientTokensInVault,

    /// creator_fees_accumulated or fees_claimable is zero; nothing to withdraw.
    #[msg("No fees are available to claim")]
    NothingToClaim,

    // ── Authorization ─────────────────────────────────────────────────────────
    /// Caller is not GlobalConfig.admin.
    #[msg("Caller is not the program admin")]
    UnauthorizedAdmin,

    /// Caller is not BondingCurve.creator for the requested coin.
    #[msg("Caller is not the creator of this bonding curve")]
    UnauthorizedCreator,

    /// Caller is not ReferralAccount.referrer.
    #[msg("Caller is not the referrer for this referral account")]
    UnauthorizedReferrer,

    // ── Arithmetic ────────────────────────────────────────────────────────────
    /// A checked arithmetic operation returned None (overflow or underflow).
    #[msg("Arithmetic overflow or underflow detected")]
    ArithmeticOverflow,

    /// A division by zero was attempted (degenerate curve state).
    #[msg("Division by zero in curve computation")]
    DivisionByZero,

    // ── P6.2 — Graduation account validation ─────────────────────────────────
    /// `complete_graduation` requires `BondingCurve.complete == true`; call
    /// `initiate_graduation` first.
    #[msg("Graduation has not been initiated yet; BondingCurve.complete must be true")]
    GraduationNotInitiated,

    /// The `coin_mint` passed to `complete_graduation` does not match
    /// `BondingCurve.mint`.
    #[msg("Coin mint does not match the mint recorded in the BondingCurve")]
    InvalidMint,

    /// The Raydium CPMM program account is not the expected program ID.
    #[msg("Raydium CPMM program account has an unexpected key")]
    InvalidRaydiumProgram,

    /// The WSOL mint account is not the canonical Wrapped SOL mint address.
    #[msg("WSOL mint account is not the canonical Wrapped SOL mint")]
    InvalidWsolMint,

    /// The Raydium AMM config account is not owned by the Raydium CPMM program.
    #[msg("AMM config account is not owned by the Raydium CPMM program")]
    InvalidAmmConfig,

    /// The provided Raydium CPMM authority account does not match the PDA
    /// derived from `[RAYDIUM_AUTHORITY_SEED]` and the Raydium program.
    #[msg("Raydium CPMM authority PDA does not match expected derivation")]
    InvalidRaydiumAuthority,

    /// The provided pool state account does not match the PDA derived from
    /// `[RAYDIUM_POOL_SEED, amm_config, token0_mint, token1_mint]`.
    #[msg("Raydium pool state PDA does not match expected derivation")]
    InvalidPoolStatePda,

    /// The provided LP mint account does not match the PDA derived from
    /// `[RAYDIUM_LP_MINT_SEED, pool_state]`.
    #[msg("Raydium LP mint PDA does not match expected derivation")]
    InvalidLpMintPda,

    /// The provided observation state account does not match the PDA derived
    /// from `[RAYDIUM_OBSERVATION_SEED, pool_state]`.
    #[msg("Raydium observation state PDA does not match expected derivation")]
    InvalidObservationStatePda,

    /// A token vault account is not the expected ATA (authority × mint derivation).
    #[msg("Token vault is not the expected associated token account")]
    InvalidTokenVault,

    /// token0_mint must be numerically less than token1_mint (Raydium ordering).
    #[msg("Token mints must be in sorted order: token0 < token1")]
    InvalidTokenOrdering,

    /// The LP token destination is not the expected ATA for the LP mint and
    /// the provided owner.
    #[msg("LP token destination is not the expected associated token account")]
    InvalidLpDestination,

    /// The create-pool-fee account is not the canonical Raydium fee address.
    #[msg("Create-pool-fee account does not match the known Raydium fee address")]
    InvalidCreatePoolFeeAccount,

    /// The coin mint authority is not the bonding curve PDA, which means it
    /// has already been revoked or transferred unexpectedly.
    #[msg("Coin mint authority is not the bonding curve PDA")]
    InvalidMintAuthority,

    /// The coin freeze authority is not the bonding curve PDA, which means it
    /// has already been revoked or transferred unexpectedly.
    #[msg("Coin freeze authority is not the bonding curve PDA")]
    InvalidFreezeAuthority,

    /// The bonding curve token vault is not the expected ATA
    /// (bonding_curve × coin_mint derivation).
    #[msg("Bonding curve token vault is not the expected associated token account")]
    InvalidBondingCurveVault,

    // ── P6.3 — Graduation execution ───────────────────────────────────────────
    /// `complete_graduation` was already called; `BondingCurve.graduated == true`.
    #[msg("Bonding curve has already been graduated; complete_graduation cannot be called twice")]
    AlreadyGraduated,

    /// The bonding curve WSOL token account is not ATA of (bonding_curve × WSOL).
    #[msg("Bonding curve WSOL account is not the expected associated token account")]
    InvalidBondingCurveWsolAccount,

    /// After Raydium initialize CPI, pool state is not owned by the CPMM program.
    #[msg("Post-CPI: Raydium pool state account is not owned by the CPMM program")]
    PostCpiPoolStateInvalid,

    /// After Raydium initialize CPI, LP mint is not owned by the SPL Token program.
    #[msg("Post-CPI: LP mint account is not owned by the SPL Token program")]
    PostCpiLpMintInvalid,

    /// After Raydium initialize CPI, observation state is not owned by the CPMM program.
    #[msg("Post-CPI: observation state account is not owned by the CPMM program")]
    PostCpiObservationStateInvalid,

    /// After Raydium initialize CPI, a token vault balance does not match
    /// the expected deposited liquidity amount.
    #[msg("Post-CPI: token vault balance does not match the expected deposited amount")]
    PostCpiVaultBalanceMismatch,

    /// After Raydium initialize CPI, LP token balance does not equal
    /// floor(sqrt(amount_0 × amount_1)) − 100.
    #[msg("Post-CPI: LP tokens minted do not match the expected Raydium formula")]
    PostCpiLpAmountMismatch,

    // ── P6.4 — LP lock ────────────────────────────────────────────────────────
    /// `creator_lp_token.amount` is zero before the LP burn; expected a positive
    /// balance after the Raydium initialize CPI.
    #[msg("LP token balance is zero before burn; expected positive after pool initialization")]
    ZeroLpBalance,

    /// After the LP burn CPI, `creator_lp_token.amount` was not zero; the
    /// permanent liquidity lock did not fully execute.
    #[msg("LP token balance is non-zero after burn; permanent lock failed")]
    PostBurnLpBalanceMismatch,

    // ── P6.5 — Mint authority revocation ─────────────────────────────────────
    /// After the SPL Token `set_authority` CPI, `coin_mint.mint_authority` is
    /// not `None`; the permanent revocation did not take effect.
    #[msg("Coin mint authority is not None after revocation; permanent revocation failed")]
    MintAuthorityRevocationFailed,

    // ── P6.6 — Freeze authority revocation ───────────────────────────────────
    /// After the SPL Token `set_authority` CPI, `coin_mint.freeze_authority` is
    /// not `None`; the permanent freeze-authority revocation did not take effect.
    #[msg("Coin freeze authority is not None after revocation; permanent revocation failed")]
    FreezeAuthorityRevocationFailed,
}
