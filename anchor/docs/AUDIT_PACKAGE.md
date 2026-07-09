# Fun.Run V2 — Security Audit Package

**Version:** v1.0.0-rc1  
**Program ID (Devnet):** `HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP`  
**Framework:** Anchor 0.31.1 / Solana SBF  
**Prepared for:** External Security Audit  
**Date:** 2026-07-03  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Trust Model & Trust Assumptions](#3-trust-model--trust-assumptions)
4. [Security Invariants](#4-security-invariants)
5. [Threat Model](#5-threat-model)
6. [Lamport & Token Accounting](#6-lamport--token-accounting)
7. [State Machine Diagrams](#7-state-machine-diagrams)
8. [Known Limitations](#8-known-limitations)
9. [Test Coverage](#9-test-coverage)
10. [Devnet Verification Evidence](#10-devnet-verification-evidence)

---

## 1. Executive Summary

Fun.Run V2 is a Solana-native meme-coin launchpad implementing a **constant-product bonding curve AMM**. Users launch SPL tokens, trade them through an on-chain virtual-reserve AMM, and earn referral fees. When a curve accumulates 85 SOL in real reserves, it graduates to a **Raydium CPMM DEX pool** with all liquidity permanently locked.

### Surface Area

| Category | Count |
|---|---|
| On-chain instructions | 13 |
| Account types (PDAs) | 5 |
| External CPIs | 9 (in complete_graduation) |
| Events | 14 |
| Error codes | 51 |
| Rust source lines | ~4,200 |
| Unit tests | 544 (all passing) |

### High-Level Risk Assessment

| Risk Category | Assessment |
|---|---|
| Arithmetic overflow | Low — u128 intermediates throughout; checked_mul/div everywhere |
| Reentrancy | Low — Solana single-threaded execution model; no cross-program callbacks |
| Authority escalation | Low — PDA-signed CPIs only; no raw keypair in program state |
| Fee theft / drain | Low — fee split is deterministic, verified by tests |
| Graduation manipulation | Medium — permissionless but heavily validated (14 account checks + 14 post-CPI checks) |
| Admin key compromise | Medium — single admin key; no multisig enforced on-chain |
| LP lock bypass | Low — LP burned atomically within complete_graduation; ZeroLpBalance guard catches edge case |

---

## 2. Architecture Overview

### 2.1 Program Structure

```
funrun_v2/
├── lib.rs                    — Anchor entrypoint; 13 instruction dispatchers
├── consts.rs                 — All protocol constants (immutable)
├── errors.rs                 — 51 typed error codes
├── events.rs                 — 14 event structs
├── math.rs                   — Pure AMM math (compute_tokens_out, compute_sol_out, split_fee)
├── state/
│   ├── bonding_curve.rs      — BondingCurve account + compute_expected_lp
│   ├── global_config.rs      — GlobalConfig account
│   ├── treasury.rs           — Treasury account
│   ├── creator_profile.rs    — CreatorProfile account
│   └── referral_account.rs   — ReferralAccount account
└── instructions/
    ├── initialize.rs
    ├── update_global_config.rs
    ├── pause.rs
    ├── sweep_treasury.rs
    ├── set_creator_referrer.rs
    ├── create_coin.rs
    ├── buy.rs
    ├── sell.rs
    ├── claim_creator_fees.rs
    ├── claim_referrer_fees.rs
    ├── initiate_graduation.rs
    └── complete_graduation.rs  — ~3,200 lines; 35-step graduation + 28 simulation tests
```

### 2.2 Account Ownership Model

```
Program (funrun_v2)
├── GlobalConfig PDA     — owned by program; writable only by admin instructions
├── Treasury PDA         — owned by program; lamports accumulated here
├── BondingCurve PDA     — owned by program; signs CPIs via PDA authority
│   ├── Token Vault ATA  — owned by BondingCurve PDA (SPL Token account)
│   └── WSOL ATA         — owned by BondingCurve PDA (created at graduation)
├── CreatorProfile PDA   — owned by program; write-once referrer field
└── ReferralAccount PDA  — owned by program; lamports = referrer fee balance
```

### 2.3 CPI Graph

```
buy / sell
  └── token_program::transfer_checked  (tokens ↔ vault)
  └── system_program::transfer         (SOL → treasury, creator_fees, referrer)

create_coin
  └── token_program::initialize_mint
  └── token_program::mint_to
  └── associated_token_program::create (vault ATA)

complete_graduation (9 CPIs)
  ├── system_program::transfer         (DEX fee → treasury)
  ├── token_program::mint_to           (LP_RESERVE_TOKENS → vault)
  ├── associated_token_program::create (WSOL ATA — idempotent)
  ├── system_program::transfer         (SOL → WSOL ATA)
  ├── token_program::sync_native       (WSOL balance sync)
  ├── raydium_cpmm::initialize         (pool creation — EXTERNAL)
  ├── token_program::burn              (LP tokens)
  ├── token_program::set_authority     (mint authority → None)
  └── token_program::set_authority     (freeze authority → None)
```

### 2.4 PDA Signer Pattern

The `BondingCurve` PDA acts as the signer for all CPIs in `complete_graduation`. The signing seeds are `["bonding_curve", mint_pubkey, bump]`. This means:

- No private key is ever stored on-chain
- The program's BPF loader controls the PDA; only the program can produce a valid PDA signature
- No external party can forge a PDA signature

---

## 3. Trust Model & Trust Assumptions

### 3.1 Trusted Parties

| Party | Key | Trust Basis |
|---|---|---|
| Protocol Admin | `GlobalConfig.admin` | On-chain keypair; assumed honest operator |
| Fee Recipient | `GlobalConfig.fee_recipient` | Set by admin; assumed to be controlled by operator |
| Upgrade Authority | `BHpwVr6eimhzRoYr9q4y3BvWhnkq6WaNuBwQgR97oS5t` | Controls program binary upgrades |

### 3.2 Untrusted Parties

All other actors — creators, traders, referrers, and graduation callers — are **untrusted**. The program enforces all invariants on-chain without relying on caller honesty.

### 3.3 External Program Trust

| Program | Address | Trust Assumption |
|---|---|---|
| SPL Token Program | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` | Trusted — canonical Solana program |
| Associated Token Program | `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe1brs` | Trusted — canonical Solana program |
| System Program | `11111111111111111111111111111111` | Trusted — native Solana program |
| Raydium CPMM | `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C` | **Assumed correct** — not audited by Fun.Run |

> **Critical:** The correctness of `complete_graduation` depends on Raydium CPMM behaving according to its documented specification. Fun.Run validates Raydium's outputs via 14 post-CPI checks but cannot verify Raydium's internal state transitions.

### 3.4 Trust Assumptions Summary

1. The Solana runtime correctly enforces account ownership and PDA derivation.
2. SPL Token program behaves correctly (mint_to, burn, set_authority, sync_native).
3. Raydium CPMM `initialize` correctly creates the pool, deposits tokens, and mints LP tokens.
4. The admin keypair is not compromised. (No on-chain multisig enforced — see Known Limitations.)
5. The upgrade authority is secured. An upgrade could bypass all on-chain invariants.

---

## 4. Security Invariants

These invariants are enforced by the program for every valid instruction execution. Violation of any invariant is a critical bug.

### 4.1 AMM Invariants

**I-1: k Monotonicity**
```
k_after = new_VS × new_VT ≤ VS × VT = k_before
```
Floor division (`checked_div` in Rust) ensures this for every buy and sell. Verified by `k_invariant_maintained_after_buy` and `k_invariant_maintained_after_sell` tests.

**I-2: Bounded Output**
- `tokens_out ≤ virtual_token_reserves` (buy cannot drain more than VT)
- `sol_gross ≤ virtual_sol_reserves` (sell cannot drain more than VS)

**I-3: Zero Output Rejection**
- Any trade that would produce 0 tokens or 0 SOL is rejected with `InsufficientOutput`.

**I-4: Real Reserve Consistency**
- `real_sol_reserves` tracks actual SOL lamports held by the BondingCurve PDA minus `creator_fees_accumulated`.
- `real_token_reserves` tracks tokens in the vault ATA.

### 4.2 Fee Invariants

**I-5: Fee Split Completeness**
```
treasury_fee + creator_fee + referrer_fee == total_fee
```
Treasury absorbs integer-division remainder. Verified by `split_always_sums_to_total_fee_with_referrer` across 31 test cases including boundary values.

**I-6: Fee Boundedness**
```
total_fee = floor(sol_amount × fee_bps / 10_000) ≤ sol_amount
```
Maximum 5% (500 bps) enforced by hard ceiling on `total_trading_fee_bps`.

**I-7: Creator Fee Isolation**
`creator_fees_accumulated` is accumulated as a field on `BondingCurve`, not as lamports in the PDA balance. It cannot be accessed by any party other than the coin's creator.

### 4.3 State Monotonicity Invariants

**I-8: `complete` is monotone**
Once `BondingCurve.complete = true` is set by `initiate_graduation`, no instruction ever sets it back to `false`. Trading is permanently halted.

**I-9: `graduated` is monotone**
Once `BondingCurve.graduated = true` is set by `complete_graduation`, no instruction ever sets it back to `false`. `complete_graduation` cannot be called twice (checked at step entry).

**I-10: Protocol Version Guard**
`initiate_graduation` rejects any curve where `protocol_version != PROTOCOL_VERSION`. This prevents graduating curves created under a different program version.

### 4.4 Authorization Invariants

**I-11: Admin-Only Instructions**
`update_global_config`, `pause_protocol`, `unpause_protocol`, `sweep_treasury` verify `ctx.accounts.admin.key() == global_config.admin`. Returns `UnauthorizedAdmin` otherwise.

**I-12: Creator-Only Fee Claim**
`claim_creator_fees` verifies `ctx.accounts.creator.key() == bonding_curve.creator`. Returns `UnauthorizedCreator` otherwise.

**I-13: Referrer-Only Fee Claim**
`claim_referrer_fees` verifies `ctx.accounts.referrer.key() == referral_account.referrer`. Returns `UnauthorizedReferrer` otherwise.

### 4.5 Graduation Invariants

**I-14: DEX Fee Snapshot Immutability**
`graduation_dex_fee_snapshot` is set exactly once in `initiate_graduation` and never modified thereafter.

**I-15: LP Permanent Lock**
After `complete_graduation`, all LP tokens are burned. `LiquidityLocked` event signals zero remaining LP balance.

**I-16: Authority Revocations are Permanent**
After `complete_graduation`, `coin_mint.mint_authority == None` and `coin_mint.freeze_authority == None`. No instruction can restore these authorities.

**I-17: Post-CPI Verification**
14 checks are performed after the Raydium `initialize` CPI (steps 21–24) to verify pool state, LP mint ownership, observation state, vault balances, and LP token amounts. Any discrepancy aborts the transaction.

### 4.6 Referral Invariants

**I-18: Referrer Relationship is Write-Once**
Once `CreatorProfile.referrer` is set, `set_creator_referrer` returns `ReferralAlreadySet`. It cannot be modified or cleared.

**I-19: No Self-Referral**
`set_creator_referrer` returns `SelfReferral` if `creator == referrer`.

**I-20: No Direct Circular Referral**
`set_creator_referrer` checks if the proposed referrer already has the caller as their own referrer, returning `CircularReferral`. (Note: only 1-hop cycles are checked; multi-hop chains are allowed.)

---

## 5. Threat Model

### 5.1 Threat: Price Manipulation via Large Buy/Sell

**Description:** An attacker attempts to manipulate the bonding curve price by executing a very large buy or sell in a single transaction.

**Mitigations:**
- Slippage guards (`min_tokens_out`, `min_sol_out`) protect individual users.
- The CPMM formula's diminishing returns make large buys increasingly expensive.
- `InsufficientTokensInVault` / `InsufficientSolInCurve` prevent draining the vault.

**Residual Risk:** MEV sandwich attacks possible within a Solana block. Off-chain slippage configuration is user responsibility.

---

### 5.2 Threat: Fake Graduation Trigger

**Description:** An attacker attempts to trigger graduation on an ineligible curve.

**Mitigations:**
- `initiate_graduation` enforces `real_sol_reserves ≥ graduation_threshold` atomically.
- `protocol_version` guard prevents graduation of foreign curve accounts.
- 5 eligibility conditions checked in order; all must pass.

**Residual Risk:** None — all conditions are enforced on-chain.

---

### 5.3 Threat: Graduation CPI Manipulation (Raydium)

**Description:** An attacker supplies crafted Raydium account PDAs to mislead `complete_graduation`.

**Mitigations:**
- 14 pre-CPI account validation checks (steps 1–14):
  - Raydium program ID verified against `RAYDIUM_CPMM_PROGRAM_ID_STR`
  - Pool state PDA re-derived and compared
  - LP mint PDA re-derived and compared
  - Observation state PDA re-derived and compared
  - Token vaults verified as correct ATAs
  - Token ordering enforced (`token0 < token1`)
  - LP destination verified as correct ATA
  - Create-pool-fee verified against hard-coded network constant
  - Coin mint authorities verified to be held by bonding_curve PDA
- 14 post-CPI checks verify the Raydium program actually did what was expected.

**Residual Risk:** Low — extensive validation on both sides of the CPI.

---

### 5.4 Threat: LP Token Retention

**Description:** Someone attempts to prevent LP tokens from being burned to retain a recoverable liquidity position.

**Mitigations:**
- LP tokens are minted to `creator_lp_token` (an ATA owned by `bonding_curve` PDA).
- Only the `bonding_curve` PDA can authorize a burn from this account.
- The burn CPI is executed atomically within `complete_graduation`.
- `ZeroLpBalance` guard catches the edge case where `sqrt(a×b) = 100` exactly (result = 0 LP).
- Post-burn check verifies `creator_lp_token.amount == 0`.

**Residual Risk:** None — burn is atomic and verified.

---

### 5.5 Threat: Admin Key Compromise

**Description:** The admin keypair is stolen. Attacker calls `update_global_config` to set extreme fees, `sweep_treasury` to drain funds, or `pause_protocol` to halt trading.

**Mitigations (on-chain):**
- Fee ceilings are hard-coded: max 5% trading fee, max 1 SOL creation fee.
- `sweep_treasury` only moves to `fee_recipient` — attacker must also control that key.
- Protocol pause only affects trading, not existing fee claims.

**Residual Risk:** Medium — no on-chain multisig. Admin key security is an operational concern. Recommended: transfer admin to a multisig before mainnet.

---

### 5.6 Threat: Reentrancy

**Description:** A malicious CPI target re-enters Fun.Run instructions.

**Mitigations:**
- Solana's execution model is single-threaded; a CPI cannot call back into the caller's instruction context.
- All state updates (reserve changes, fee accumulation) happen before outbound CPIs in trading instructions.
- Anchor's `#[account]` validation runs before handler logic.

**Residual Risk:** None — Solana architecture prevents reentrancy.

---

### 5.7 Threat: Arithmetic Overflow

**Description:** Integer overflow in AMM formulas produces incorrect token/SOL outputs.

**Mitigations:**
- `compute_tokens_out` and `compute_sol_out` use `u128` intermediate arithmetic.
- `k = VS × VT` fits in u128 for all valid u64 inputs (max ≈ 3.4 × 10³⁸ for u128).
- All arithmetic uses `checked_mul`, `checked_add`, `checked_div`; returns `ArithmeticOverflow` on failure.
- `split_fee` uses `u128` intermediate with guaranteed no overflow.
- Property tests verify no panic for adversarial inputs up to `u64::MAX`.

**Residual Risk:** None — all paths covered by checked arithmetic.

---

### 5.8 Threat: Referral Fee Siphoning

**Description:** An attacker attempts to drain another user's referral account.

**Mitigations:**
- `claim_referrer_fees` checks `ctx.accounts.referrer.key() == referral_account.referrer`.
- The referrer must sign the transaction.
- Anchor account constraints enforce account ownership.

**Residual Risk:** None.

---

### 5.9 Threat: Stale Creator Profile Referrer Snapshot

**Description:** A creator changes their referrer after coins are launched, redirecting fees from the rightful referrer.

**Mitigations:**
- `set_creator_referrer` is write-once (`ReferralAlreadySet` enforced).
- The `creator_referrer` field on `BondingCurve` is **snapshotted at `create_coin` time** and never updated. Even if the `CreatorProfile` could change, the bonding curve referrer is immutable.

**Residual Risk:** None — double protection (write-once profile + immutable snapshot).

---

### 5.10 Threat: Program Upgrade Attack

**Description:** The upgrade authority deploys a malicious program binary, bypassing all invariants.

**Mitigations (on-chain):** None — program upgrades are trust-based.

**Mitigation (operational):** Before mainnet launch, upgrade authority should be transferred to a multisig or burned. This is documented in the Mainnet Deployment Checklist.

**Residual Risk:** High if upgrade authority is not secured. Zero if upgrade authority is burned.

---

## 6. Lamport & Token Accounting

### 6.1 Buy Trade — Complete Lamport Flow

```
sol_amount (buyer input)
  │
  ├── total_fee = floor(sol_amount × fee_bps / 10_000)
  │     ├── treasury_fee  → Treasury PDA lamports      [40% or 60% of total_fee]
  │     ├── creator_fee   → BondingCurve.creator_fees_accumulated [40%]
  │     └── referrer_fee  → ReferralAccount lamports   [20% or 0%]
  │
  └── sol_net = sol_amount − total_fee
        └── → BondingCurve PDA lamports (real_sol_reserves += sol_net)

tokens_out = VT − floor(k / (VS + sol_net))
  └── transferred from BondingCurve token vault → buyer token account

Invariant: buyer pays sol_amount; receives tokens_out; fees distributed exactly
```

### 6.2 Sell Trade — Complete Lamport Flow

```
token_amount (seller input)
  └── transferred from seller token account → BondingCurve token vault

sol_gross = VS − floor(k / (VT + token_amount))

total_fee = floor(sol_gross × fee_bps / 10_000)
  ├── treasury_fee  → Treasury PDA
  ├── creator_fee   → BondingCurve.creator_fees_accumulated
  └── referrer_fee  → ReferralAccount lamports

sol_net = sol_gross − total_fee
  └── transferred from BondingCurve PDA → seller

Invariant: BondingCurve.lamports decreases by sol_gross;
           seller receives sol_net;
           fees sum to total_fee;
           sol_gross − sol_net − total_fee == 0
```

### 6.3 Graduation — Complete Lamport & Token Flow

```
Before complete_graduation:
  BondingCurve PDA lamports = real_sol_reserves + creator_fees_accumulated + rent

Step 15: DEX fee transfer
  BondingCurve PDA lamports -= graduation_dex_fee_snapshot
  Treasury PDA lamports     += graduation_dex_fee_snapshot

Step 16: Mint LP reserve tokens
  Token supply += LP_RESERVE_TOKENS (200,000,000 × 10⁶)
  Vault ATA balance += LP_RESERVE_TOKENS
  [Mint authority is still bonding_curve PDA at this point]

Step 17–19: Wrap SOL
  BondingCurve PDA lamports    -= sol_to_dex
  BondingCurve WSOL ATA tokens += sol_to_dex (via sync_native)

Step 20: Raydium initialize CPI
  BondingCurve WSOL ATA    → Raydium token vault (sol_to_dex WSOL)
  BondingCurve token vault → Raydium token vault (200M tokens)
  Raydium LP mint mints    → creator_lp_token ATA (floor(sqrt(sol×tokens)) − 100)

Step 23: LP burn
  creator_lp_token ATA balance → 0 (burned)
  LP mint supply -= lp_minted

Step 27: Mint authority revoked → None
Step 31: Freeze authority revoked → None

After complete_graduation:
  BondingCurve PDA lamports = creator_fees_accumulated + rent (only unclaimed creator fees remain)
  Token vault balance = 0
  WSOL ATA balance = 0
  Raydium pool holds: sol_to_dex WSOL + 200M tokens (permanently)
  LP tokens in existence: 100 (Raydium minimum liquidity — locked in pool forever)
  Coin mint authority: None
  Coin freeze authority: None
```

### 6.4 Conservation Laws

| Conservation Law | Formula |
|---|---|
| SOL in buy | `buyer_paid == sol_net_to_curve + treasury_fee + creator_fee + referrer_fee` |
| SOL in sell | `sol_gross_from_curve == sol_net_to_seller + treasury_fee + creator_fee + referrer_fee` |
| Token in buy | `vault_balance_before − vault_balance_after == tokens_to_buyer` |
| Token in sell | `vault_balance_after − vault_balance_before == tokens_from_seller` |
| Fee split | `treasury + creator + referrer == total_fee` |
| Graduation SOL | `real_sol_reserves == dex_fee + sol_to_dex` |
| Graduation tokens | `LP_RESERVE_TOKENS deposited into Raydium == 200,000,000,000,000` |
| LP | `lp_minted == floor(sqrt(sol_to_dex × LP_RESERVE_TOKENS)) − 100` |
| Post-graduation LP | `lp_burned == lp_minted; remaining supply == 100` |

### 6.5 LP Formula

```rust
pub fn compute_expected_lp(amount_0: u64, amount_1: u64) -> Option<u64> {
    let product = (amount_0 as u128).checked_mul(amount_1 as u128)?;
    let sqrt = integer_sqrt(product);
    sqrt.checked_sub(100)  // Raydium minimum liquidity lock
}
```

- Returns `Some(0)` when `sqrt == 100` exactly (e.g., `amount_0 = 100, amount_1 = 100`)
- Returns `None` when `sqrt < 100` (underflow — extremely small pools)
- Returns `None` when `amount_0 × amount_1` overflows u128 (impossible with u64 inputs)
- `ZeroLpBalance` error guard (step 22) catches the `Some(0)` case and aborts graduation cleanly

---

## 7. State Machine Diagrams

### 7.1 BondingCurve Lifecycle

```
                     ┌──────────────────────────────────────────────┐
                     │              create_coin                     │
                     │   creator, name, symbol, uri, creation_fee  │
                     └──────────────────┬───────────────────────────┘
                                        │
                                        ▼
                     ┌──────────────────────────────────────────────┐
                     │                ACTIVE                        │
                     │  complete = false                            │
                     │  graduated = false                           │
                     │  real_sol_reserves < graduation_threshold    │
                     │                                              │
                     │  ← buy / sell (trading open)                │
                     │  ← claim_creator_fees (always open)         │
                     └──────────────────┬───────────────────────────┘
                                        │
                          real_sol_reserves ≥ 85 SOL
                          protocol_version == 2
                          any caller (permissionless)
                                        │
                                        ▼ initiate_graduation
                     ┌──────────────────────────────────────────────┐
                     │              GRADUATING                      │
                     │  complete = true      ← LOCKED               │
                     │  graduated = false                           │
                     │  graduation_dex_fee_snapshot = locked        │
                     │                                              │
                     │  ✗ buy / sell (CurveComplete error)          │
                     │  ← claim_creator_fees (still open)          │
                     └──────────────────┬───────────────────────────┘
                                        │
                          any caller (permissionless)
                          35 steps, 9 CPIs
                                        │
                                        ▼ complete_graduation
                     ┌──────────────────────────────────────────────┐
                     │              GRADUATED                       │
                     │  complete = true                             │
                     │  graduated = true     ← LOCKED               │
                     │  mint_authority = None ← IRREVOCABLE         │
                     │  freeze_authority = None ← IRREVOCABLE       │
                     │  Raydium pool: live, liquidity locked        │
                     │                                              │
                     │  ✗ buy / sell / initiate / complete (all    │
                     │    blocked by complete or graduated flag)    │
                     │  ← claim_creator_fees (still open)          │
                     └──────────────────────────────────────────────┘
```

### 7.2 Fee Flow

```
Trade (buy or sell)
       │
       ▼
   total_fee
       │
       ├──40%──→ BondingCurve.creator_fees_accumulated
       │              │
       │              └──(claim_creator_fees)──→ creator wallet
       │
       ├──20%──→ ReferralAccount lamports  [if creator_referrer set]
       │              │
       │              └──(claim_referrer_fees)──→ referrer wallet
       │
       └──40%──→ Treasury PDA lamports     [60% if no referrer]
                      │
                      └──(sweep_treasury)──→ fee_recipient wallet
```

### 7.3 Graduation CPI Sequence

```
complete_graduation handler
  │
  ├─[Step 15]─→ system::transfer(dex_fee → treasury)
  │
  ├─[Step 16]─→ token::mint_to(200M → vault)        [bonding_curve signs]
  │
  ├─[Step 17]─→ associated_token::create(WSOL ATA)  [idempotent]
  │
  ├─[Step 18]─→ system::transfer(sol_to_dex → WSOL ATA)
  │
  ├─[Step 19]─→ token::sync_native(WSOL ATA)
  │
  ├─[Step 20]─→ raydium_cpmm::initialize(...)       [bonding_curve signs]
  │                  └─ creates pool_state PDA
  │                  └─ creates lp_mint PDA
  │                  └─ creates observation_state PDA
  │                  └─ deposits WSOL + tokens into vaults
  │                  └─ mints LP tokens to creator_lp_token
  │
  ├─[Step 21]─→ post-CPI verification (14 checks)
  │
  ├─[Step 23]─→ token::burn(all LP)                 [bonding_curve signs]
  │
  ├─[Step 24]─→ verify creator_lp_token.amount == 0
  │
  ├─[Step 27]─→ token::set_authority(mint → None)   [bonding_curve signs]
  │
  ├─[Step 31]─→ token::set_authority(freeze → None) [bonding_curve signs]
  │
  └─[Step 34]─→ bonding_curve.graduated = true; emit events
```

---

## 8. Known Limitations

### 8.1 Live Raydium CPI Not Testable on Devnet

`complete_graduation` executes a CPI into the Raydium CPMM program (`initialize`). This instruction was **not executed on devnet** because:

1. Raydium CPMM on devnet requires a live Raydium deployment with active fee accounts.
2. The devnet AMM config address could not be verified against live Raydium devnet at the time of testing.
3. The graduation flow was verified via **28 pure-Rust simulation tests** covering all accounting invariants, LP formula, state machine transitions, fee flows, and post-CPI assertions.

**Mitigation:** Live graduation must be tested on mainnet with a low-liquidity coin before production use.

### 8.2 Single Admin Key — No On-Chain Multisig

The protocol admin is a single keypair stored in `GlobalConfig.admin`. If this key is compromised:
- Fees can be set to maximum (5% trading, 1 SOL creation)
- Treasury can be drained to any `fee_recipient`
- Protocol can be paused indefinitely

**Mitigation:** Transfer admin to a multisig wallet before mainnet launch. The program does not enforce this on-chain.

### 8.3 No Admin Key Rotation

There is no `rotate_admin` instruction. If the admin key is lost, admin-only instructions become permanently inaccessible (treasury cannot be swept, fees cannot be updated, pause cannot be toggled).

**Mitigation:** Secure the admin key with hardware wallet + backup.

### 8.4 Multi-Hop Circular Referral Not Detected

`set_creator_referrer` checks only for direct circular referrals (A→B→A). Multi-hop cycles (A→B→C→A) are not detected.

**Impact:** Low — no economic harm from circular referrals; fees still flow correctly regardless of chain topology.

### 8.5 `compute_expected_lp` Returns `Some(0)` for Tiny Pools

When `floor(sqrt(sol × tokens)) == 100`, `compute_expected_lp` returns `Some(0)`. The `ZeroLpBalance` error guard at step 22 catches this and aborts graduation. This means graduation cannot complete for pools that are so small that `sqrt(sol × tokens) ≤ 100`.

**Impact:** None in practice — at the 85 SOL graduation threshold with 200M tokens, the LP value is astronomically above this edge case.

### 8.6 No Slippage Protection on Graduation

`initiate_graduation` and `complete_graduation` have no slippage parameters. The amounts deposited into Raydium are fully determined by the curve state at the time of `initiate_graduation`.

**Impact:** None — both instructions are permissionless and the deposited amounts are fixed at initiation time.

### 8.7 Raydium CPMM Minimum Liquidity Lock

Raydium's CPMM permanently locks 100 LP tokens in the pool (the `checked_sub(100)` in the LP formula). This is the Raydium protocol's own mechanism and is not controlled by Fun.Run. The 100 locked LP tokens represent the **Raydium minimum liquidity**, not a Fun.Run design choice.

---

## 9. Test Coverage

### 9.1 Test Statistics

| Module | Tests | Status |
|---|---|---|
| `math.rs` | 26 | All passing |
| `property_tests.rs` | 11 | All passing |
| `deploy_config.rs` | 5 | All passing |
| `state/bonding_curve.rs` | 18 | All passing |
| `state/global_config.rs` | 12 | All passing |
| `state/referral_account.rs` | 8 | All passing |
| `state/treasury.rs` | 6 | All passing |
| `state/creator_profile.rs` | 7 | All passing |
| `instructions/initiate_graduation.rs` | 20 | All passing |
| `instructions/complete_graduation.rs` (simulation) | 28 | All passing |
| Other instruction unit tests | ~403 | All passing |
| **Total** | **544** | **All passing** |

### 9.2 Test Categories

**AMM Math Tests (math.rs)**
- Buy output correctness at 1 SOL, 10 SOL
- Price monotonicity across sequential buys
- k invariant after buy and sell
- Zero-input rejection
- Large-input overflow protection
- Round-trip conservation (±2 lamports)
- Graduation price verification (≈ 14.6× appreciation)

**Fee Split Tests (math.rs)**
- Exact 40/40/20 split verification
- Fee completeness invariant across 31 boundary values (0, 1, 7, 100, u32::MAX, etc.)
- Without-referrer 60/40 split
- Rounding remainder absorbed by treasury
- Zero fee case
- Large fee (170 SOL) no overflow

**Property Tests (property_tests.rs)**
- Arbitrary input buy/sell no panic
- fee_split completeness for pseudo-random inputs
- k monotonicity for sequential trades
- Reserve non-negativity

**Graduation Simulation Tests (complete_graduation.rs)**

Group A — Full Flow:
- `sim_full_graduation_accounting_at_85sol_threshold`: Complete 35-step simulation with canonical values

Group B — Lamport Conservation:
- `sim_lamport_conservation_across_full_graduation`
- `prop_lampart_conservation_holds_across_sol_range`: 5 SOL to 500 SOL sweep

Group C — Token Conservation:
- `sim_token_conservation_lp_reserve_minted_and_deposited`
- `sim_total_supply_allocation_is_exact`

Group D — LP Formula:
- `sim_lp_formula_at_exact_85sol_graduation`
- `sim_lp_formula_respects_raydium_minimum_liquidity`
- `prop_lp_positive_across_graduation_sol_range`

Group E — State Machine:
- `sim_buy_blocked_when_curve_is_complete`
- `sim_sell_blocked_when_curve_is_complete`
- `sim_complete_is_trading_gate_not_graduated`
- `sim_initiate_graduation_rejected_if_already_complete`
- `sim_complete_graduation_rejected_if_already_graduated`

Group F — Creator Fees:
- `sim_creator_fees_preserved_through_graduation`
- `sim_creator_fee_claim_works_post_graduation`
- `sim_creator_fee_claim_lamport_conservation`

Group G — Referrer Fees:
- `sim_referrer_fees_claimable_post_graduation`
- `sim_referrer_fee_claim_lamport_conservation`

Group H — Post-CPI Assertions:
- `sim_post_cpi_ownership_assertions`
- `sim_vault_balances_gte_init_amounts_post_cpi`
- `sim_lp_supply_after_burn_equals_minimum_liquidity`
- `sim_creator_lp_token_zero_after_burn`

Group I — Treasury:
- `sim_treasury_receives_exact_dex_fee`
- `sim_treasury_accumulates_across_graduations`

Group J — Final Invariants:
- `sim_state_machine_complete_graduation_flow`
- `sim_dex_fee_snapshot_locked_at_initiation_time`
- `prop_graduated_flag_is_monotone_once_set`
- `sim_all_post_graduation_invariants_hold`

### 9.3 Coverage Gaps

| Gap | Reason | Mitigation |
|---|---|---|
| Live Raydium `initialize` CPI execution | Devnet Raydium not available | 28 pure-Rust simulation tests + mainnet test required |
| Integration test (full end-to-end on-chain) | `solana-program-test` not in cargo cache (offline build) | `[[test]]` binary scaffolded in Cargo.toml with `required-features = ["integration-tests"]` for future use |
| Adversarial account fuzzing | No on-chain test harness | Anchor account constraints + property tests cover this |

---

## 10. Devnet Verification Evidence

### 10.1 Deployment

| Item | Value |
|---|---|
| Program ID | `HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP` |
| Upgrade Authority | `BHpwVr6eimhzRoYr9q4y3BvWhnkq6WaNuBwQgR97oS5t` |
| Binary Size | 614,896 bytes |
| Phase 7.1 Upgrade Sig | `3YSnQYK7WVWFAd2zc1kFgrird28bfNi5xmJk3F2azi3wihKpvmWbcWL7njBzDRP4FCK3GC6DssSSTyhFUwmyTd9U` |
| Build Feature | `--features devnet` |

### 10.2 Devnet Smoke Tests (17/17 Passing)

| # | Instruction | Result | CU Used |
|---|---|---|---|
| 1 | `initialize` | Pass | 4,598 |
| 2 | `update_global_config` | Pass | 4,598 |
| 3 | `pause_protocol` | Pass | ~6,005 |
| 4 | `unpause_protocol` | Pass | ~6,005 |
| 5 | `set_creator_referrer` | Pass | — |
| 6 | `create_coin` | Pass | — |
| 7 | `buy` (no referrer) | Pass | 30,088 |
| 8 | `buy` (with referrer) | Pass | 33,696 |
| 9 | `sell` (no referrer) | Pass | 27,206 |
| 10 | `sell` (with referrer) | Pass | 30,815 |
| 11 | `claim_creator_fees` | Pass | 9,049 |
| 12 | `claim_referrer_fees` | Pass | 4,531 |
| 13 | `sweep_treasury` | Pass | 11,108 |
| 14 | `initiate_graduation` | Pass | ~15,000 |
| 15 | `buy` blocked after initiate | Pass | — |
| 16 | `sell` blocked after initiate | Pass | — |
| 17 | `complete_graduation` | Not testable on devnet | — |

### 10.3 Verified Invariants on Devnet

- Fee distribution (40/40/20) verified by matching expected lamport amounts post-trade
- `real_sol_reserves` correctly tracked across multiple buy/sell cycles
- `creator_fees_accumulated` isolated from trading reserves
- `BondingCurve.complete = true` halts trading immediately
- `graduation_dex_fee_snapshot` correctly snapshotted from GlobalConfig value
- Pause/unpause toggles affect trading without affecting fee claims

### 10.4 Build Reproducibility

```bash
# Devnet build
cd anchor
cargo build-sbf --features devnet

# Mainnet build
cargo build-sbf --features mainnet

# Unit tests (offline)
cargo test

# Output: test result: ok. 544 passed; 0 failed; 0 ignored
```

Build is fully deterministic in offline mode (`anchor/.cargo/config.toml: offline = true`). All dependencies are pinned in `Cargo.lock`.

---

*End of Fun.Run V2 Security Audit Package — v1.0.0-rc1*
