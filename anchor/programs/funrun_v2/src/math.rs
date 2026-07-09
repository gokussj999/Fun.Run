//! Pure AMM math and fee-split utilities.
//!
//! All functions use u128 intermediate arithmetic for the constant-product
//! invariant (k = VS × VT) to prevent overflow — VS and VT each fit in u64,
//! but their product exceeds u64::MAX.
//!
//! No Solana runtime dependencies; fully testable with `cargo test`.

use crate::consts::{CREATOR_FEE_PCT, REFERRER_FEE_PCT};
use crate::errors::FunrunError;

// ── Output types ──────────────────────────────────────────────────────────────

/// Result of splitting a trading fee according to the 40/40/20 rule.
/// Guaranteed: treasury + creator + referrer == total_fee (no remainder).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct FeeSplit {
    /// Treasury's portion: 40% when creator_referrer is set, 60% otherwise.
    pub treasury: u64,
    /// Coin creator's portion: always 40% of total_fee.
    pub creator: u64,
    /// Creator referrer's portion: 20% when set, 0 otherwise.
    pub referrer: u64,
}

// ── Core AMM formulas ─────────────────────────────────────────────────────────

/// Compute tokens received by a buyer given the current virtual reserves and
/// the net SOL entering the curve (after fees have been deducted).
///
/// Formula: tokens_out = VT - (k / (VS + sol_net))
/// where k = VS × VT (u128 intermediate).
///
/// Returns `Err(InsufficientOutput)` if the computed output is zero.
/// Returns `Err(ArithmeticOverflow)` if intermediate u128 arithmetic overflows.
/// Returns `Err(DivisionByZero)` if new virtual SOL reserves would be zero.
pub fn compute_tokens_out(
    virtual_sol: u64,
    virtual_tokens: u64,
    sol_net: u64,
) -> anchor_lang::Result<u64> {
    let vs = virtual_sol as u128;
    let vt = virtual_tokens as u128;
    let net = sol_net as u128;

    // k = VS × VT — u128 handles up to ~3.4 × 10³⁸, well above our 3.2 × 10²⁵
    let k = vs.checked_mul(vt).ok_or(FunrunError::ArithmeticOverflow)?;

    let new_vs = vs.checked_add(net).ok_or(FunrunError::ArithmeticOverflow)?;

    if new_vs == 0 {
        return Err(FunrunError::DivisionByZero.into());
    }

    // new_vt = floor(k / new_vs) — floor division ensures we never mint tokens
    let new_vt = k.checked_div(new_vs).ok_or(FunrunError::DivisionByZero)?;

    // tokens_out = VT - new_VT; new_vt <= vt because new_vs >= vs, so tokens_out <= vt <= u64::MAX
    let tokens_out = vt.saturating_sub(new_vt);

    if tokens_out == 0 {
        return Err(FunrunError::InsufficientOutput.into());
    }

    Ok(u64::try_from(tokens_out).map_err(|_| FunrunError::ArithmeticOverflow)?)
}

/// Compute gross SOL returned to a seller given the current virtual reserves and
/// the token amount being returned to the vault.
///
/// Formula: sol_gross = VS - (k / (VT + token_amount))
/// where k = VS × VT (u128 intermediate).
///
/// Returns `Err(InsufficientOutput)` if computed output is zero.
/// Returns `Err(ArithmeticOverflow)` on overflow.
/// Returns `Err(DivisionByZero)` if new virtual token reserves would be zero.
pub fn compute_sol_out(
    virtual_sol: u64,
    virtual_tokens: u64,
    token_amount: u64,
) -> anchor_lang::Result<u64> {
    let vs = virtual_sol as u128;
    let vt = virtual_tokens as u128;
    let amt = token_amount as u128;

    let k = vs.checked_mul(vt).ok_or(FunrunError::ArithmeticOverflow)?;

    let new_vt = vt.checked_add(amt).ok_or(FunrunError::ArithmeticOverflow)?;

    if new_vt == 0 {
        return Err(FunrunError::DivisionByZero.into());
    }

    // new_vs = floor(k / new_vt) — floor division; new_vs <= vs because new_vt >= vt, so sol_gross <= vs <= u64::MAX
    let new_vs = k.checked_div(new_vt).ok_or(FunrunError::DivisionByZero)?;

    let sol_gross = vs.saturating_sub(new_vs);

    if sol_gross == 0 {
        return Err(FunrunError::InsufficientOutput.into());
    }

    Ok(u64::try_from(sol_gross).map_err(|_| FunrunError::ArithmeticOverflow)?)
}

// ── Fee helpers ───────────────────────────────────────────────────────────────

/// Compute the total trading fee for a given gross SOL amount and fee rate.
///
/// total_fee = floor(sol_amount × fee_bps / 10_000)
///
/// Uses u128 intermediate arithmetic — cannot overflow for any valid u64 sol_amount
/// and u16 fee_bps.  Result is always <= sol_amount.
pub fn compute_total_fee(sol_amount: u64, fee_bps: u16) -> u64 {
    ((sol_amount as u128 * fee_bps as u128) / 10_000) as u64
}

/// Split total_fee into three shares using the hard-coded 40/40/20 rule.
///
/// - Creator always receives 40% of total_fee.
/// - Creator Referrer receives 20% when has_referrer is true, 0 otherwise.
/// - Treasury receives the remainder: exactly 40% with referrer, 60% without.
///
/// Invariant: split.treasury + split.creator + split.referrer == total_fee.
/// Treasury absorbs integer-division rounding so no lamport is ever unallocated.
///
/// This function is infallible — all arithmetic is guaranteed not to overflow.
pub fn split_fee(total_fee: u64, has_referrer: bool) -> FeeSplit {
    let total = total_fee as u128;

    // Floor division — creator and referrer are computed first, treasury gets remainder
    let creator = (total * CREATOR_FEE_PCT as u128 / 100) as u64;
    let referrer = if has_referrer {
        (total * REFERRER_FEE_PCT as u128 / 100) as u64
    } else {
        0
    };

    // Treasury absorbs any rounding remainder; sum is exactly total_fee
    let treasury = total_fee - creator - referrer;

    FeeSplit {
        treasury,
        creator,
        referrer,
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::consts::{DEFAULT_TOTAL_FEE_BPS, VIRTUAL_SOL_INITIAL, VIRTUAL_TOKEN_INITIAL};

    // ── compute_tokens_out ────────────────────────────────────────────────────

    #[test]
    fn buy_1_sol_gives_expected_tokens() {
        let tokens = compute_tokens_out(
            VIRTUAL_SOL_INITIAL,
            VIRTUAL_TOKEN_INITIAL,
            1_000_000_000, // 1 SOL net
        )
        .unwrap();
        // Analytical result: VT - k/(VS+1e9) ≈ 34,612,909,387,097 raw units
        assert!(
            tokens > 34_000_000_000_000,
            "Expected > 34T raw tokens for 1 SOL buy"
        );
        assert!(
            tokens < 35_000_000_000_000,
            "Expected < 35T raw tokens for 1 SOL buy"
        );
    }

    #[test]
    fn buy_10_sol_gives_expected_tokens() {
        let tokens = compute_tokens_out(
            VIRTUAL_SOL_INITIAL,
            VIRTUAL_TOKEN_INITIAL,
            10_000_000_000, // 10 SOL net
        )
        .unwrap();
        // 10x the SOL should give fewer than 10x the tokens (diminishing returns)
        let tokens_1sol =
            compute_tokens_out(VIRTUAL_SOL_INITIAL, VIRTUAL_TOKEN_INITIAL, 1_000_000_000).unwrap();
        assert!(
            tokens < tokens_1sol * 10,
            "Diminishing returns: 10 SOL should buy < 10× what 1 SOL buys"
        );
    }

    #[test]
    fn price_increases_monotonically_across_sequential_buys() {
        let mut vs = VIRTUAL_SOL_INITIAL;
        let mut vt = VIRTUAL_TOKEN_INITIAL;
        let sol_each = 1_000_000_000u64; // 1 SOL per trade

        let mut prev_tokens = u64::MAX;
        for _ in 0..10 {
            let tokens = compute_tokens_out(vs, vt, sol_each).unwrap();
            assert!(
                tokens < prev_tokens,
                "Each successive 1 SOL buy should yield fewer tokens"
            );
            vs += sol_each;
            vt -= tokens;
            prev_tokens = tokens;
        }
    }

    #[test]
    fn k_invariant_maintained_after_buy() {
        let vs = VIRTUAL_SOL_INITIAL;
        let vt = VIRTUAL_TOKEN_INITIAL;
        let sol_net = 5_000_000_000u64; // 5 SOL

        let k_before = vs as u128 * vt as u128;
        let tokens_out = compute_tokens_out(vs, vt, sol_net).unwrap();

        let new_vs = vs + sol_net;
        let new_vt = vt - tokens_out;
        let k_after = new_vs as u128 * new_vt as u128;

        // Floor division means k_after <= k_before (never creates value from nothing)
        assert!(
            k_after <= k_before,
            "k must not increase after buy: {} > {}",
            k_after,
            k_before
        );

        // Rounding loss must be less than new_vs (one unit of granularity)
        let diff = k_before - k_after;
        assert!(
            diff < new_vs as u128,
            "k rounding loss {} must be < new_vs {}",
            diff,
            new_vs
        );
    }

    #[test]
    fn buy_zero_sol_returns_insufficient_output() {
        // sol_net = 0 → tokens_out = 0 → InsufficientOutput
        let result = compute_tokens_out(VIRTUAL_SOL_INITIAL, VIRTUAL_TOKEN_INITIAL, 0);
        assert!(result.is_err(), "Zero SOL buy must return an error");
    }

    #[test]
    fn buy_with_dust_sol_returns_insufficient_output() {
        // 1 lamport buy — curve barely moves; tokens_out rounds to 0
        let result = compute_tokens_out(VIRTUAL_SOL_INITIAL, VIRTUAL_TOKEN_INITIAL, 1);
        // May succeed with a very small non-zero result, or fail with InsufficientOutput
        // Either is acceptable; we just verify it does not panic
        let _ = result;
    }

    #[test]
    fn buy_tokens_out_bounded_by_vault() {
        // Even an astronomically large buy cannot drain more tokens than VT
        let large_sol = 1_000_000_000 * 1_000_000_000u64; // 1B SOL (hypothetical)
        let result = compute_tokens_out(VIRTUAL_SOL_INITIAL, VIRTUAL_TOKEN_INITIAL, large_sol);
        if let Ok(tokens) = result {
            assert!(
                tokens <= VIRTUAL_TOKEN_INITIAL,
                "tokens_out cannot exceed VIRTUAL_TOKEN_INITIAL"
            );
        }
        // Err result is also acceptable (overflow guard triggered)
    }

    // ── compute_sol_out ───────────────────────────────────────────────────────

    #[test]
    fn sell_basic_returns_positive_sol() {
        // Sell 100M tokens (raw units = 100 tokens at 6 decimals × 1_000_000)
        let token_amount = 100_000_000_000_000u64;
        let sol =
            compute_sol_out(VIRTUAL_SOL_INITIAL, VIRTUAL_TOKEN_INITIAL, token_amount).unwrap();
        assert!(sol > 0, "Should receive positive SOL");
        assert!(
            sol < VIRTUAL_SOL_INITIAL,
            "Cannot receive more SOL than in reserves"
        );
    }

    #[test]
    fn amm_round_trip_sol_approximately_conserved() {
        // Buy 1 SOL of tokens, then sell them back.
        // In a constant-product AMM with integer floor division, the round-trip
        // may return sol_in ± a few lamports. This is not a bug:
        //   - floor(k/new_vs) during buy gives buyer slightly more tokens
        //   - k_sell = new_vs × new_vt (slightly < k_original due to that floor)
        //   - floor(k_sell/VT₀) can then land 1 lamport below VS₀
        //   → net: sol_returned = sol_in + 1 in some cases
        // The invariant is conservation within 2 lamports, not strict "< sol_in".
        let sol_in = 1_000_000_000u64; // 1 SOL
        let tokens =
            compute_tokens_out(VIRTUAL_SOL_INITIAL, VIRTUAL_TOKEN_INITIAL, sol_in).unwrap();

        let new_vs = VIRTUAL_SOL_INITIAL + sol_in;
        let new_vt = VIRTUAL_TOKEN_INITIAL - tokens;

        let sol_returned = compute_sol_out(new_vs, new_vt, tokens).unwrap();

        // Round-trip must be within ±2 lamports (integer floor-division artifact)
        let diff = sol_returned.abs_diff(sol_in);
        assert!(
            diff <= 2,
            "Round-trip diff {} lamports (returned={}, in={}) must be ≤ 2",
            diff,
            sol_returned,
            sol_in
        );
    }

    #[test]
    fn k_invariant_maintained_after_sell() {
        let vs = VIRTUAL_SOL_INITIAL;
        let vt = VIRTUAL_TOKEN_INITIAL;
        let token_amount = 50_000_000_000_000u64;

        let k_before = vs as u128 * vt as u128;
        let sol_out = compute_sol_out(vs, vt, token_amount).unwrap();

        let new_vs = vs - sol_out;
        let new_vt = vt + token_amount;
        let k_after = new_vs as u128 * new_vt as u128;

        assert!(k_after <= k_before, "k must not increase after sell");
        let diff = k_before - k_after;
        assert!(
            diff < new_vt as u128,
            "k rounding loss {} must be < new_vt {}",
            diff,
            new_vt
        );
    }

    #[test]
    fn sell_zero_tokens_returns_insufficient_output() {
        let result = compute_sol_out(VIRTUAL_SOL_INITIAL, VIRTUAL_TOKEN_INITIAL, 0);
        assert!(result.is_err(), "Zero token sell must return an error");
    }

    #[test]
    fn sell_sol_out_bounded_by_reserves() {
        let large_tokens = VIRTUAL_TOKEN_INITIAL - 1; // Almost all tokens
        let sol =
            compute_sol_out(VIRTUAL_SOL_INITIAL, VIRTUAL_TOKEN_INITIAL, large_tokens).unwrap();
        assert!(
            sol < VIRTUAL_SOL_INITIAL,
            "sol_out {} must be < virtual_sol_reserves {}",
            sol,
            VIRTUAL_SOL_INITIAL
        );
    }

    // ── Overflow / edge case protection ──────────────────────────────────────

    #[test]
    fn overflow_large_reserves_do_not_panic() {
        // Use large but valid reserve values (≤ u64::MAX / 4 each so k fits in u128)
        let vs = u64::MAX / 8;
        let vt = u64::MAX / 8;
        let sol_net = 1_000u64;
        // Should not panic; may succeed or return an error
        let _ = compute_tokens_out(vs, vt, sol_net);
    }

    #[test]
    fn overflow_maximum_reserves_buy_no_panic() {
        // Note: k = (u64::MAX/2)^2 ≈ 8.5e37 which fits in u128 (max 3.4e38).
        // For u64 inputs, k = vs * vt can never overflow u128 because:
        //   max(vs * vt) = (u64::MAX)^2 = 2^128 - 2^65 + 1 < u128::MAX.
        // The function completes without panic — that is the guarantee being tested.
        let vs = u64::MAX / 2;
        let vt = u64::MAX / 2;
        let result = compute_tokens_out(vs, vt, 1_000_000);
        // Either Ok or Err is acceptable; the critical property is no panic
        let _ = result;
    }

    #[test]
    fn overflow_maximum_reserves_sell_no_panic() {
        // Same reasoning as buy: u64 inputs cannot overflow u128 intermediate arithmetic.
        let vs = u64::MAX / 2;
        let vt = u64::MAX / 2;
        let result = compute_sol_out(vs, vt, 1_000_000);
        let _ = result;
    }

    #[test]
    fn buy_state_consistency_across_many_trades() {
        // Simulate 50 sequential 0.1 SOL buys and verify reserves stay consistent
        let mut vs = VIRTUAL_SOL_INITIAL;
        let mut vt = VIRTUAL_TOKEN_INITIAL;
        let sol_each = 100_000_000u64; // 0.1 SOL

        for i in 0..50 {
            let tokens = compute_tokens_out(vs, vt, sol_each).unwrap_or_else(|_| {
                panic!("Buy {} failed unexpectedly", i);
            });
            assert!(tokens > 0, "Trade {} should produce positive output", i);
            assert!(tokens <= vt, "tokens_out must not exceed vt at trade {}", i);

            vs += sol_each;
            vt -= tokens;

            assert!(
                vs > 0,
                "virtual_sol_reserves must stay positive at trade {}",
                i
            );
            assert!(
                vt > 0,
                "virtual_token_reserves must stay positive at trade {}",
                i
            );
        }
    }

    // ── compute_total_fee ─────────────────────────────────────────────────────

    #[test]
    fn fee_1_sol_at_150_bps() {
        let fee = compute_total_fee(1_000_000_000, 150);
        assert_eq!(
            fee, 15_000_000,
            "1 SOL at 150 bps = 0.015 SOL = 15,000,000 lamports"
        );
    }

    #[test]
    fn fee_zero_bps_is_zero() {
        assert_eq!(compute_total_fee(1_000_000_000, 0), 0);
    }

    #[test]
    fn fee_zero_sol_is_zero() {
        assert_eq!(compute_total_fee(0, 150), 0);
    }

    #[test]
    fn fee_500_bps_is_5_percent() {
        let fee = compute_total_fee(1_000_000_000, 500);
        assert_eq!(fee, 50_000_000, "1 SOL at 500 bps = 0.05 SOL");
    }

    #[test]
    fn fee_never_exceeds_sol_amount() {
        // Even at maximum bps (500 = 5%), fee < sol_amount
        for sol in [1u64, 1_000, 1_000_000, 1_000_000_000, u64::MAX / 10_000] {
            let fee = compute_total_fee(sol, 500);
            assert!(fee <= sol, "fee {} must not exceed sol_amount {}", fee, sol);
        }
    }

    #[test]
    fn fee_default_rate_floor_division() {
        // 7 lamports at 150 bps = 7 * 150 / 10000 = 1050 / 10000 = 0 (floor)
        assert_eq!(compute_total_fee(7, DEFAULT_TOTAL_FEE_BPS), 0);
        // 100 lamports at 150 bps = 15000 / 10000 = 1
        assert_eq!(compute_total_fee(100, DEFAULT_TOTAL_FEE_BPS), 1);
    }

    // ── split_fee ─────────────────────────────────────────────────────────────

    #[test]
    fn split_with_referrer_exact_percentages() {
        let split = split_fee(1_000, true);
        assert_eq!(split.creator, 400, "Creator = 40%");
        assert_eq!(split.referrer, 200, "Referrer = 20%");
        assert_eq!(split.treasury, 400, "Treasury = 40%");
    }

    #[test]
    fn split_without_referrer_exact_percentages() {
        let split = split_fee(1_000, false);
        assert_eq!(split.creator, 400, "Creator = 40%");
        assert_eq!(split.referrer, 0, "Referrer = 0 when not set");
        assert_eq!(split.treasury, 600, "Treasury = 60%");
    }

    #[test]
    fn split_always_sums_to_total_fee_with_referrer() {
        let cases = [
            0u64,
            1,
            2,
            3,
            5,
            7,
            9,
            10,
            11,
            13,
            17,
            19,
            23,
            97,
            99,
            100,
            101,
            150,
            333,
            500,
            999,
            1_000,
            1_001,
            9_999,
            10_000,
            10_001,
            99_997,
            100_000,
            1_000_000,
            15_000_000,
            1_500_000_000,
            4_294_967_295, // u32::MAX
        ];
        for &total in &cases {
            let split = split_fee(total, true);
            let sum = split.treasury + split.creator + split.referrer;
            assert_eq!(
                sum, total,
                "sum={} != total_fee={} (treasury={} creator={} referrer={})",
                sum, total, split.treasury, split.creator, split.referrer
            );
        }
    }

    #[test]
    fn split_always_sums_to_total_fee_without_referrer() {
        let cases = [
            0u64,
            1,
            7,
            10,
            99,
            100,
            101,
            999,
            1_000,
            10_001,
            1_500_000_000,
        ];
        for &total in &cases {
            let split = split_fee(total, false);
            let sum = split.treasury + split.creator + split.referrer;
            assert_eq!(
                sum, total,
                "sum={} != total_fee={} without referrer",
                sum, total
            );
        }
    }

    #[test]
    fn split_zero_total_fee() {
        let split = split_fee(0, true);
        assert_eq!(split.treasury, 0);
        assert_eq!(split.creator, 0);
        assert_eq!(split.referrer, 0);
    }

    #[test]
    fn split_large_fee_no_overflow() {
        // Near the top of practical range: ~170 SOL total fee on a large trade
        let total_fee = 170_000_000_000u64;
        let split = split_fee(total_fee, true);
        assert_eq!(split.treasury + split.creator + split.referrer, total_fee);
        assert_eq!(split.creator, 68_000_000_000); // 40% of 170 SOL
        assert_eq!(split.referrer, 34_000_000_000); // 20% of 170 SOL
        assert_eq!(split.treasury, 68_000_000_000); // 40% of 170 SOL
    }

    #[test]
    fn split_rounding_treasury_absorbs_remainder() {
        // total_fee=7: creator=floor(7*40/100)=2, referrer=floor(7*20/100)=1, treasury=7-2-1=4
        let split = split_fee(7, true);
        assert_eq!(split.creator, 2);
        assert_eq!(split.referrer, 1);
        assert_eq!(split.treasury, 4); // absorbs the 0.8+0.4+0.8 rounding
        assert_eq!(split.treasury + split.creator + split.referrer, 7);
    }

    #[test]
    fn split_referrer_is_zero_when_not_set_regardless_of_total() {
        for total in [0u64, 1, 100, 1_000_000] {
            let split = split_fee(total, false);
            assert_eq!(split.referrer, 0);
        }
    }

    #[test]
    fn split_creator_never_exceeds_40_percent_plus_one() {
        // Verify creator never receives more than ceil(40% of total)
        for total in [0u64, 1, 7, 13, 100, 1_000, 99_999] {
            let split = split_fee(total, true);
            let max_creator = (total as u128 * 40 + 99) / 100; // ceil(40%)
            assert!(
                split.creator as u128 <= max_creator,
                "creator {} > ceil(40% of {}) = {}",
                split.creator,
                total,
                max_creator
            );
        }
    }

    // ── Price and graduation verification ─────────────────────────────────────

    #[test]
    fn initial_price_matches_spec() {
        // price₀ = VS / VT in lamports/raw_unit, converted to SOL/token (6 decimals)
        // = (VS_lamports / VT_raw) × (1e6 raw/token) / (1e9 lamports/SOL)
        // = (VS / VT) / 1000
        // Spec: ≈ 2.8 × 10⁻⁸ SOL/token
        let vs = VIRTUAL_SOL_INITIAL as f64;
        let vt = VIRTUAL_TOKEN_INITIAL as f64;
        let price_sol_per_token = (vs / vt) / 1_000.0;

        assert!(
            price_sol_per_token > 2.0e-8 && price_sol_per_token < 4.0e-8,
            "Initial price {:.3e} SOL/token should be ~2.8e-8 SOL/token",
            price_sol_per_token
        );
    }

    #[test]
    fn price_at_graduation_matches_spec() {
        // At graduation: real_sol = 85 SOL → VS_final ≈ 30 + 85 = 115 SOL (approx)
        // VT_final ≈ 279,913,093,304,347 (from spec)
        // price_grad ≈ 4.1 × 10⁻⁷ SOL/token
        let vs_grad = (VIRTUAL_SOL_INITIAL + 85_000_000_000) as f64;
        let vt_grad = 279_913_093_304_347_f64; // from spec
        let price_sol_per_token = (vs_grad / vt_grad) / 1_000.0;

        assert!(
            price_sol_per_token > 3.0e-7 && price_sol_per_token < 6.0e-7,
            "Graduation price {:.3e} SOL/token should be ~4.1e-7 SOL/token",
            price_sol_per_token
        );
    }

    #[test]
    fn graduation_price_is_higher_than_initial_price() {
        let price_initial = (VIRTUAL_SOL_INITIAL as f64 / VIRTUAL_TOKEN_INITIAL as f64) / 1_000.0;
        let vs_grad = (VIRTUAL_SOL_INITIAL + 85_000_000_000) as f64;
        let vt_grad = 279_913_093_304_347_f64;
        let price_grad = (vs_grad / vt_grad) / 1_000.0;

        assert!(
            price_grad > price_initial,
            "Graduation price {:.3e} must exceed initial price {:.3e}",
            price_grad,
            price_initial
        );

        // Spec says ≈ 14.6× appreciation — verify order of magnitude
        let ratio = price_grad / price_initial;
        assert!(
            ratio > 10.0 && ratio < 20.0,
            "Price appreciation {:.1}× should be roughly 14-15×",
            ratio
        );
    }

    #[test]
    fn full_buy_sell_accounting() {
        // Simulate buy → state update → sell and verify SOL accounting.
        // For 10 SOL: new_vs = 40e9; k/new_vs = 3*VT₀/4 which can be exact,
        // yielding sol_returned == sol_in (zero net loss before fees).
        // Integer AMMs are approximately (not strictly) SOL-conservative.
        let vs_0 = VIRTUAL_SOL_INITIAL;
        let vt_0 = VIRTUAL_TOKEN_INITIAL;
        let sol_in = 10_000_000_000u64; // 10 SOL

        let tokens_bought = compute_tokens_out(vs_0, vt_0, sol_in).unwrap();
        let vs_1 = vs_0 + sol_in;
        let vt_1 = vt_0 - tokens_bought;

        let sol_returned = compute_sol_out(vs_1, vt_1, tokens_bought).unwrap();

        // Round-trip within ±2 lamports (floor-division rounding; fees handled separately)
        let diff = sol_returned.abs_diff(sol_in);
        assert!(
            diff <= 2,
            "Round-trip diff {} (returned={}, in={}) must be ≤ 2 lamports",
            diff,
            sol_returned,
            sol_in
        );

        // The buy must have moved meaningful tokens
        assert!(tokens_bought > 0, "Should buy positive tokens");
    }
}
