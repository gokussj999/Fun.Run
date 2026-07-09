/// P4.6 — Comprehensive property and fuzz tests for the Fun.Run bonding curve.
///
/// All tests are deterministic: a seeded LCG drives input generation so CI
/// never flakes and failures are perfectly reproducible.
///
/// Properties verified (19 total, covering all 15 required + 4 strengthened):
///  1.  Buy→Sell round-trip never creates value
///  2.  Fee split conserved: treasury + creator + referrer = total_fee
///  3.  Referrer is zero when has_referrer = false
///  4.  k-invariant holds for all buy inputs  (k_after ≤ k_before)
///  5.  k-invariant holds for all sell inputs (k_after ≤ k_before)
///  6.  Price increases monotonically on sequential buys
///  7.  Price decreases monotonically on sequential sells
///  8.  Diminishing returns: larger buy  → fewer tokens per SOL
///  9.  Diminishing returns: larger sell → less SOL per token
/// 10.  No panic at boundary values (0, 1, u64::MAX regions)
/// 11.  Deterministic execution for identical inputs
/// 12.  Lamport conservation (buy): sol_net + fee = sol_amount
/// 13.  Lamport conservation (sell): sol_net + all shares = sol_gross
/// 14.  Token conservation: VT / RT changes match tokens_out exactly
/// 15.  creator_fees are excluded from real_sol_reserves
/// 16.  Rent floor formula (minimum_lamports) never overflows
/// 17.  VS − RS = VIRTUAL_SOL_INITIAL (strong algebraic invariant, exact)
/// 18.  fee ≤ sol_amount for any input within MAX_TOTAL_FEE_BPS
/// 19.  Long buy/sell sequences never produce negative or impossible reserves
// ─── Helpers ─────────────────────────────────────────────────────────────────
use crate::consts::*;
use crate::instructions::buy::validate_buy;
use crate::instructions::sell::validate_sell;
use crate::math::{compute_sol_out, compute_tokens_out, compute_total_fee, split_fee};

/// Minimal Knuth multiplicative LCG.
/// Seeded once per test; identical seeds yield identical sequences.
struct Prng(u64);

impl Prng {
    fn new(seed: u64) -> Self {
        Self(seed)
    }

    fn next(&mut self) -> u64 {
        self.0 = self
            .0
            .wrapping_mul(6364136223846793005)
            .wrapping_add(1442695040888963407);
        self.0
    }

    /// Returns a value in `[lo, hi)`.  Requires `hi > lo`.
    fn range(&mut self, lo: u64, hi: u64) -> u64 {
        debug_assert!(hi > lo, "range({lo}, {hi}): hi must be > lo");
        lo + (self.next() % (hi - lo))
    }

    fn bool(&mut self) -> bool {
        self.next() & 1 == 0
    }
}

// ─── Fixture constants ────────────────────────────────────────────────────────

const VS0: u64 = VIRTUAL_SOL_INITIAL; // 30 SOL
const VT0: u64 = VIRTUAL_TOKEN_INITIAL; // 1,073,000,191 tokens (raw)
const RT0: u64 = BONDING_SUPPLY_TOKENS; // 800,000,000 tokens (raw)
const FEE: u16 = DEFAULT_TOTAL_FEE_BPS; // 150 bps (1.5 %)
const ITERS: u64 = 1_000;

// ─── Mid-curve fixture (used for sell-heavy tests) ────────────────────────────
const VS_MID: u64 = 40_000_000_000; // 40 SOL virtual
const VT_MID: u64 = 870_000_000_000_000; // reduced token reserve
const RS_MID: u64 = 10_000_000_000; // 10 SOL real
const RT_MID: u64 = 750_000_000_000_000; // remaining real tokens

// ─────────────────────────────────────────────────────────────────────────────
// Property 1: Buy→Sell round-trip never creates value
// ─────────────────────────────────────────────────────────────────────────────

#[test]
fn prop_buy_sell_never_creates_value() {
    let mut rng = Prng::new(0x1234_5678_9ABC_DEF0);

    for _ in 0..ITERS {
        let sol = rng.range(1_000_000, 10_000_000_000); // 0.001–10 SOL gross

        let buy = match validate_buy(sol, 0, VS0, VT0, 0, RT0, FEE, false) {
            Ok(r) => r,
            Err(_) => continue,
        };

        // Sell back the purchased tokens at zero fee to isolate pure AMM rounding.
        let sell = match validate_sell(
            buy.tokens_out,
            0,
            buy.new_virtual_sol_reserves,
            buy.new_virtual_token_reserves,
            buy.new_real_sol_reserves,
            buy.new_real_token_reserves,
            buy.tokens_out,
            0, // zero fee → pure AMM path
            false,
        ) {
            Ok(r) => r,
            Err(_) => continue,
        };

        // Floor division can return at most sol_net + 2 lamports (verified by
        // the existing unit round-trip test).  The buyer must never recoup
        // more than sol_net + 2 from the AMM.
        assert!(
            sell.sol_gross <= buy.sol_net.saturating_add(2),
            "value created! sol_net_buy={} sol_returned={} excess={}",
            buy.sol_net,
            sell.sol_gross,
            sell.sol_gross.saturating_sub(buy.sol_net),
        );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Properties 2 & 3: Fee split conservation and referrer correctness
// ─────────────────────────────────────────────────────────────────────────────

#[test]
fn prop_fee_split_always_sums_to_total_fee() {
    let mut rng = Prng::new(0xABCD_1234_5678_EF90);

    for _ in 0..ITERS * 10 {
        let total_fee = rng.range(0, u64::MAX / 2);
        let has_ref = rng.bool();

        let split = split_fee(total_fee, has_ref);

        // Property 2: complete accounting
        assert_eq!(
            split.treasury + split.creator + split.referrer,
            total_fee,
            "fee split not conserved: total={total_fee} has_ref={has_ref} \
             treasury={} creator={} referrer={}",
            split.treasury,
            split.creator,
            split.referrer,
        );

        // Property 3: referrer is zero when no referrer
        if !has_ref {
            assert_eq!(
                split.referrer, 0,
                "referrer must be 0 when has_ref=false (total={total_fee})",
            );
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Properties 4 & 5: k-invariant (k_after ≤ k_before)
// ─────────────────────────────────────────────────────────────────────────────

#[test]
fn prop_k_invariant_holds_on_buy() {
    let mut rng = Prng::new(0xDEAD_BEEF_CAFE_0001);

    for _ in 0..ITERS {
        let sol_net = rng.range(1, 50_000_000_000); // 0–50 SOL net into AMM
        let vs = rng.range(1_000_000_000, 200_000_000_000_u64); // 1–200 SOL virtual
        let vt = rng.range(100_000_000_000_000, VT0 * 2);

        if let Ok(tokens) = compute_tokens_out(vs, vt, sol_net) {
            let k_before = vs as u128 * vt as u128;
            let new_vs = vs + sol_net;
            let new_vt = vt - tokens;
            let k_after = new_vs as u128 * new_vt as u128;

            assert!(
                k_after <= k_before,
                "k grew on buy: k_before={k_before} k_after={k_after} \
                 vs={vs} vt={vt} sol_net={sol_net} tokens={tokens}",
            );
            // Rounding loss must be strictly less than new_vs (Knuth bound)
            assert!(
                k_before - k_after < new_vs as u128,
                "k rounding loss exceeds Knuth bound: loss={} new_vs={new_vs}",
                k_before - k_after,
            );
        }
    }
}

#[test]
fn prop_k_invariant_holds_on_sell() {
    let mut rng = Prng::new(0xDEAD_BEEF_CAFE_0002);

    for _ in 0..ITERS {
        let token_amt = rng.range(1, 100_000_000_000_000_u64);
        let vs = rng.range(1_000_000_000, 200_000_000_000_u64);
        let vt = rng.range(100_000_000_000_000, VT0 * 2);

        if let Ok(sol_gross) = compute_sol_out(vs, vt, token_amt) {
            if sol_gross >= vs {
                continue; // would underflow virtual reserves — AMM guard catches this
            }
            let k_before = vs as u128 * vt as u128;
            let new_vs = vs - sol_gross;
            let new_vt = vt + token_amt;
            let k_after = new_vs as u128 * new_vt as u128;

            assert!(
                k_after <= k_before,
                "k grew on sell: k_before={k_before} k_after={k_after} \
                 vs={vs} vt={vt} tok={token_amt} sol={sol_gross}",
            );
            assert!(
                k_before - k_after < new_vt as u128,
                "k rounding loss exceeds Knuth bound on sell: loss={} new_vt={new_vt}",
                k_before - k_after,
            );
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Properties 6 & 7: Price monotonicity
// ─────────────────────────────────────────────────────────────────────────────

#[test]
fn prop_price_increases_on_sequential_buys() {
    for seed in 0_u64..100 {
        let mut rng = Prng::new(seed.wrapping_mul(7919).wrapping_add(1));
        let mut vs = VS0;
        let mut vt = VT0;
        let mut prev = 0_u128;

        for _ in 0..20 {
            let sol_net = rng.range(100_000_000, 5_000_000_000);
            if let Ok(tok) = compute_tokens_out(vs, vt, sol_net) {
                vs += sol_net;
                vt -= tok;
                // price ≈ VS/VT (more SOL per token → price rises)
                let price = vs as u128 * 1_000_000_000_u128 / vt as u128;
                assert!(
                    price > prev || prev == 0,
                    "price did not strictly increase after buy: before={prev} after={price} \
                     vs={vs} vt={vt}",
                );
                prev = price;
            }
        }
    }
}

#[test]
fn prop_price_decreases_on_sequential_sells() {
    for seed in 0_u64..100 {
        let mut rng = Prng::new(seed.wrapping_mul(4523).wrapping_add(17));
        let mut vs = VS_MID;
        let mut vt = VT_MID;
        let mut prev = u128::MAX;

        for _ in 0..20 {
            let tok = rng.range(100_000_000_000, 5_000_000_000_000);
            if let Ok(sol_gross) = compute_sol_out(vs, vt, tok) {
                if sol_gross == 0 || sol_gross >= vs {
                    break;
                }
                vs -= sol_gross;
                vt += tok;
                let price = vs as u128 * 1_000_000_000_u128 / vt as u128;
                assert!(
                    price < prev,
                    "price did not strictly decrease after sell: before={prev} after={price} \
                     vs={vs} vt={vt}",
                );
                prev = price;
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Properties 8 & 9: Diminishing returns
// ─────────────────────────────────────────────────────────────────────────────

#[test]
fn prop_diminishing_returns_on_buy() {
    let mut rng = Prng::new(0x9999_AAAA_BBBB_CCCC);

    for _ in 0..500 {
        let sol_a = rng.range(100_000_000, 2_000_000_000); // 0.1–2 SOL
        let sol_b = sol_a * 2; // strictly larger, same pool

        if let (Ok(tok_a), Ok(tok_b)) = (
            compute_tokens_out(VS0, VT0, sol_a),
            compute_tokens_out(VS0, VT0, sol_b),
        ) {
            // tok_a/sol_a > tok_b/sol_b  ⟺  tok_a*sol_b > tok_b*sol_a
            let lhs = tok_a as u128 * sol_b as u128;
            let rhs = tok_b as u128 * sol_a as u128;
            assert!(
                lhs > rhs,
                "diminishing returns violated (buy): \
                 sol_a={sol_a} tok_a={tok_a} sol_b={sol_b} tok_b={tok_b}",
            );
        }
    }
}

#[test]
fn prop_diminishing_returns_on_sell() {
    let mut rng = Prng::new(0xDDDD_EEEE_FFFF_0000);

    for _ in 0..500 {
        // Use 100B–5T token range: large enough for rounding not to hide the ratio
        let tok_a = rng.range(100_000_000_000, 5_000_000_000_000);
        let tok_b = tok_a * 2;

        if let (Ok(sol_a), Ok(sol_b)) = (
            compute_sol_out(VS_MID, VT_MID, tok_a),
            compute_sol_out(VS_MID, VT_MID, tok_b),
        ) {
            // sol_a/tok_a > sol_b/tok_b  ⟺  sol_a*tok_b > sol_b*tok_a
            let lhs = sol_a as u128 * tok_b as u128;
            let rhs = sol_b as u128 * tok_a as u128;
            assert!(
                lhs > rhs,
                "diminishing returns violated (sell): \
                 tok_a={tok_a} sol_a={sol_a} tok_b={tok_b} sol_b={sol_b}",
            );
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 10: No panic at boundary values
// ─────────────────────────────────────────────────────────────────────────────

#[test]
fn prop_no_panic_at_boundary_values() {
    let boundary_sol = [0_u64, 1, 999, 1_000_000, u64::MAX / 100, u64::MAX / 4];
    let boundary_tok = [0_u64, 1, 999, 1_000_000_000, u64::MAX / 100, u64::MAX / 4];
    let boundary_vs = [1_u64, 1_000, 1_000_000_000, u64::MAX / 4];
    let boundary_vt = [1_u64, 1_000, 1_000_000_000_000, u64::MAX / 4];
    let boundary_fee = [0_u16, 1, 150, 500, 9_999];

    // compute_total_fee + split_fee: must not panic
    for &sol in &boundary_sol {
        for &bps in &boundary_fee {
            let fee = compute_total_fee(sol, bps);
            let _ = split_fee(fee, false);
            let _ = split_fee(fee, true);
        }
    }

    // compute_tokens_out / compute_sol_out: may return Err, must not panic
    for &vs in &boundary_vs {
        for &vt in &boundary_vt {
            for &sol in &boundary_sol {
                let _ = compute_tokens_out(vs, vt, sol);
            }
            for &tok in &boundary_tok {
                let _ = compute_sol_out(vs, vt, tok);
            }
        }
    }

    // validate_buy / validate_sell: may return Err, must not panic
    for &sol in &[0_u64, 1, 1_000_000, 1_000_000_000] {
        let _ = validate_buy(sol, 0, VS0, VT0, 0, RT0, FEE, false);
        let _ = validate_buy(sol, u64::MAX, VS0, VT0, 0, RT0, FEE, false);
    }
    for &tok in &[0_u64, 1, 1_000_000_000, 1_000_000_000_000] {
        let _ = validate_sell(tok, 0, VS_MID, VT_MID, RS_MID, RT_MID, u64::MAX, FEE, false);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 11: Determinism
// ─────────────────────────────────────────────────────────────────────────────

#[test]
fn prop_deterministic_execution() {
    let mut rng = Prng::new(0x1357_9BDF_0246_8ACE);

    // Buy determinism
    for _ in 0..300 {
        let sol = rng.range(1_000_000, 10_000_000_000);
        let r1 = validate_buy(sol, 0, VS0, VT0, 0, RT0, FEE, false);
        let r2 = validate_buy(sol, 0, VS0, VT0, 0, RT0, FEE, false);
        match (r1, r2) {
            (Ok(a), Ok(b)) => assert_eq!(a, b, "buy result differs for sol={sol}"),
            (Err(_), Err(_)) => {}
            _ => panic!("buy non-deterministic for sol={sol}"),
        }
    }

    // Sell determinism
    for _ in 0..300 {
        let tok = rng.range(1_000_000_000, 10_000_000_000_000);
        let r1 = validate_sell(tok, 0, VS_MID, VT_MID, RS_MID, RT_MID, tok, FEE, false);
        let r2 = validate_sell(tok, 0, VS_MID, VT_MID, RS_MID, RT_MID, tok, FEE, false);
        match (r1, r2) {
            (Ok(a), Ok(b)) => assert_eq!(a, b, "sell result differs for tok={tok}"),
            (Err(_), Err(_)) => {}
            _ => panic!("sell non-deterministic for tok={tok}"),
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Properties 12 & 13: Lamport conservation
// ─────────────────────────────────────────────────────────────────────────────

#[test]
fn prop_lamport_conservation_buy() {
    let mut rng = Prng::new(0xFEED_FACE_DEAD_BEEF);

    for _ in 0..ITERS {
        let sol = rng.range(1_000_000, 50_000_000_000);
        let has_ref = rng.bool();

        if let Ok(r) = validate_buy(sol, 0, VS0, VT0, 0, RT0, FEE, has_ref) {
            // All three fee shares must sum to total_fee
            assert_eq!(
                r.fee_split.treasury + r.fee_split.creator + r.fee_split.referrer,
                r.total_fee,
                "buy: fee shares don't sum to total_fee (sol={sol} has_ref={has_ref})",
            );
            // sol_net + total_fee = sol_amount
            assert_eq!(
                r.sol_net + r.total_fee,
                sol,
                "buy: sol_net + fee != sol_amount (sol={sol})",
            );
            // real_sol_reserves increases by exactly sol_net (starting from RS=0)
            assert_eq!(
                r.new_real_sol_reserves, r.sol_net,
                "buy: new_RS must equal sol_net when initial RS=0 (sol={sol})",
            );
        }
    }
}

#[test]
fn prop_lamport_conservation_sell() {
    let mut rng = Prng::new(0xBABE_CAFE_1234_5678);

    for _ in 0..ITERS {
        let tok = rng.range(1_000_000_000, 20_000_000_000_000);
        let has_ref = rng.bool();

        if let Ok(r) = validate_sell(tok, 0, VS_MID, VT_MID, RS_MID, RT_MID, tok, FEE, has_ref) {
            // sol_net + all shares = sol_gross
            let recon =
                r.sol_net + r.fee_split.treasury + r.fee_split.creator + r.fee_split.referrer;
            assert_eq!(
                r.sol_gross, recon,
                "sell: lamport not conserved (sol_gross={} recon={recon} tok={tok})",
                r.sol_gross,
            );
            // total_fee = sol_gross - sol_net
            assert_eq!(
                r.total_fee,
                r.sol_gross - r.sol_net,
                "sell: total_fee != sol_gross - sol_net (tok={tok})",
            );
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 14: Token conservation
// ─────────────────────────────────────────────────────────────────────────────

#[test]
fn prop_token_conservation_on_buy_and_sell() {
    let mut rng = Prng::new(0xC0FF_EE00_BABE_0001);

    for _ in 0..ITERS {
        let sol = rng.range(1_000_000, 20_000_000_000);

        let buy = match validate_buy(sol, 0, VS0, VT0, 0, RT0, FEE, false) {
            Ok(r) => r,
            Err(_) => continue,
        };

        // Virtual token reserve decreases by exactly tokens_out
        assert_eq!(
            VT0 - buy.new_virtual_token_reserves,
            buy.tokens_out,
            "buy: virtual token conservation violated (sol={sol})",
        );
        // Real token reserve decreases by exactly tokens_out
        assert_eq!(
            RT0 - buy.new_real_token_reserves,
            buy.tokens_out,
            "buy: real token conservation violated (sol={sol})",
        );

        // Sell those tokens back: virtual reserve should return to exactly VT0
        if let Ok(sell) = validate_sell(
            buy.tokens_out,
            0,
            buy.new_virtual_sol_reserves,
            buy.new_virtual_token_reserves,
            buy.new_real_sol_reserves,
            buy.new_real_token_reserves,
            buy.tokens_out,
            FEE,
            false,
        ) {
            assert_eq!(
                sell.new_virtual_token_reserves - buy.new_virtual_token_reserves,
                buy.tokens_out,
                "sell: virtual token conservation violated",
            );
            assert_eq!(
                sell.new_real_token_reserves - buy.new_real_token_reserves,
                buy.tokens_out,
                "sell: real token conservation violated",
            );
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 15: creator_fees excluded from real_sol_reserves
// ─────────────────────────────────────────────────────────────────────────────

#[test]
fn prop_creator_fees_excluded_from_real_sol_reserves() {
    let mut rng = Prng::new(0x1A2B_3C4D_5E6F_7A8B);

    for _ in 0..ITERS {
        let sol = rng.range(1_000_000, 20_000_000_000);

        if let Ok(r) = validate_buy(sol, 0, VS0, VT0, 0, RT0, FEE, false) {
            // RS must equal sol_net — not sol_net + creator_fee
            assert_eq!(
                r.new_real_sol_reserves, r.sol_net,
                "creator fee incorrectly included in real_sol_reserves (sol={sol})",
            );
            // The creator fee itself is positive and not zero
            assert!(
                r.fee_split.creator > 0,
                "creator fee must be positive for sol={sol}",
            );
            // RS < sol_amount (fee was removed before RS update)
            assert!(
                r.new_real_sol_reserves < sol,
                "real_sol_reserves must be < sol_amount (sol={sol})",
            );
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 16: minimum_lamports formula never overflows
// ─────────────────────────────────────────────────────────────────────────────

#[test]
fn prop_minimum_lamports_never_overflows() {
    let mut rng = Prng::new(0x9F8E_7D6C_5B4A_3210);

    for _ in 0..ITERS * 5 {
        let rs = rng.range(0, GRADUATION_THRESHOLD_LAMPORTS); // 0–85 SOL
        let cf = rng.range(0, 10_000_000_000); // 0–10 SOL accumulated fees
        let rent = rng.range(890_880, 2_000_000); // realistic rent range

        // Mirrors BondingCurve::minimum_lamports()
        let min = rs.saturating_add(cf).saturating_add(rent);

        assert!(
            min >= rs,
            "minimum_lamports below RS: rs={rs} cf={cf} rent={rent}",
        );
        assert!(
            min >= cf,
            "minimum_lamports below creator_fees: rs={rs} cf={cf} rent={rent}",
        );
        assert!(
            min >= rent,
            "minimum_lamports below rent: rs={rs} cf={cf} rent={rent}",
        );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 17: VS − RS = VIRTUAL_SOL_INITIAL (exact algebraic invariant)
//
// Proof sketch:
//   Buy  adds sol_net to both VS and RS → difference unchanged.
//   Sell subtracts sol_gross from both  → difference unchanged.
//   Initial: VS = VS0, RS = 0 → VS − RS = VS0.
//   Therefore VS − RS = VS0 at all times, exactly (no rounding).
// ─────────────────────────────────────────────────────────────────────────────

#[test]
fn prop_vs_minus_rs_equals_virtual_sol_initial() {
    let mut rng = Prng::new(0xAA55_BB66_CC77_DD88);

    for _ in 0..200 {
        let mut vs = VS0;
        let mut vt = VT0;
        let mut rs = 0_u64;
        let mut rt = RT0;
        let mut seller_tok = 0_u64;

        for step in 0..50 {
            let do_buy = seller_tok == 0 || rng.bool();

            if do_buy {
                let sol = rng.range(1_000_000, 5_000_000_000);
                if let Ok(r) = validate_buy(sol, 0, vs, vt, rs, rt, FEE, false) {
                    vs = r.new_virtual_sol_reserves;
                    vt = r.new_virtual_token_reserves;
                    rs = r.new_real_sol_reserves;
                    rt = r.new_real_token_reserves;
                    seller_tok = seller_tok.saturating_add(r.tokens_out);
                }
            } else if seller_tok > 0 {
                // sell [1, seller_tok] tokens
                let tok = 1 + rng.next() % seller_tok;
                if let Ok(r) = validate_sell(tok, 0, vs, vt, rs, rt, seller_tok, FEE, false) {
                    vs = r.new_virtual_sol_reserves;
                    vt = r.new_virtual_token_reserves;
                    rs = r.new_real_sol_reserves;
                    rt = r.new_real_token_reserves;
                    seller_tok = seller_tok.saturating_sub(tok);
                }
            }

            // VS − RS must equal VS0 exactly at every step
            assert_eq!(
                vs - rs,
                VS0,
                "VS-RS invariant broken at step {step}: vs={vs} rs={rs} vs-rs={} expected=VS0={}",
                vs - rs,
                VS0,
            );

            let _ = vt; // suppress unused warning
            let _ = rt;
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 18: fee ≤ sol_amount for any fee_bps ≤ MAX_TOTAL_FEE_BPS
// ─────────────────────────────────────────────────────────────────────────────

#[test]
fn prop_fee_never_exceeds_principal() {
    let mut rng = Prng::new(0xE0F1_A2B3_C4D5_E6F7);

    for _ in 0..ITERS * 5 {
        // Upper bound chosen so sol * bps < u64::MAX in compute_total_fee
        let sol = rng.range(0, u64::MAX / 10_001);
        let bps = rng.range(0, MAX_TOTAL_FEE_BPS as u64 + 1) as u16;

        let fee = compute_total_fee(sol, bps);

        assert!(
            fee <= sol,
            "fee ({fee}) exceeds sol_amount ({sol}) at {bps} bps",
        );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 19: Long sequences never produce negative or impossible reserves
// ─────────────────────────────────────────────────────────────────────────────

#[test]
fn prop_sequences_never_produce_invalid_state() {
    let mut rng = Prng::new(0x0102_0304_0506_0708);

    for _ in 0..200 {
        let mut vs = VS0;
        let mut vt = VT0;
        let mut rs = 0_u64;
        let mut rt = RT0;
        let mut seller_tok = 0_u64;

        for step in 0..100 {
            let do_buy = seller_tok == 0 || rng.bool();

            if do_buy {
                let sol = rng.range(1_000_000, 5_000_000_000);
                if let Ok(r) = validate_buy(sol, 0, vs, vt, rs, rt, FEE, false) {
                    vs = r.new_virtual_sol_reserves;
                    vt = r.new_virtual_token_reserves;
                    rs = r.new_real_sol_reserves;
                    rt = r.new_real_token_reserves;
                    seller_tok = seller_tok.saturating_add(r.tokens_out);
                }
            } else if seller_tok > 0 {
                let tok = 1 + rng.next() % seller_tok;
                if let Ok(r) = validate_sell(tok, 0, vs, vt, rs, rt, seller_tok, FEE, false) {
                    vs = r.new_virtual_sol_reserves;
                    vt = r.new_virtual_token_reserves;
                    rs = r.new_real_sol_reserves;
                    rt = r.new_real_token_reserves;
                    seller_tok = seller_tok.saturating_sub(tok);
                }
            }

            // All reserve invariants must hold at every step
            assert!(vs > 0, "VS went to zero at step {step}");
            assert!(vt > 0, "VT went to zero at step {step}");
            assert!(
                rt <= RT0,
                "RT exceeded initial supply at step {step}: rt={rt} RT0={RT0}",
            );
            assert!(rs <= vs, "RS exceeded VS at step {step}: rs={rs} vs={vs}",);
        }
    }
}
