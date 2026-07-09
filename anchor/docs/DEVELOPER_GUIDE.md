# Fun.Run V2 — Developer Guide

**Version:** v1.0.0-rc1  
**Program ID (Devnet):** `HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP`  
**Audience:** Smart contract developers, integration engineers, contributors  
**Date:** 2026-07-03  

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Repository Layout](#2-repository-layout)
3. [Build System](#3-build-system)
4. [Running Tests](#4-running-tests)
5. [Module Overview](#5-module-overview)
6. [Code Conventions](#6-code-conventions)
7. [Adding a New Instruction](#7-adding-a-new-instruction)
8. [Client Integration](#8-client-integration)
9. [Extension Points](#9-extension-points)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Quick Start

```bash
# Clone and enter the anchor workspace
cd pump-mini/anchor

# Install Rust + SBF toolchain (one-time)
rustup update stable
cargo install cargo-build-sbf

# Build (offline mode — all deps in Cargo.lock)
cargo build-sbf --features devnet

# Run all unit tests
cargo test

# Expected output:
# test result: ok. 544 passed; 0 failed; 0 ignored
```

---

## 2. Repository Layout

```
pump-mini/
├── anchor/                         ← Solana program workspace
│   ├── Cargo.toml                  ← Workspace manifest
│   ├── Cargo.lock                  ← Pinned dependency versions
│   ├── VERSION                     ← Protocol version tag (v1.0.0-rc1)
│   ├── DEPLOYMENT_CHECKLIST.md     ← Pre-mainnet checklist
│   ├── .cargo/
│   │   └── config.toml             ← offline = true (no network fetches)
│   ├── docs/
│   │   ├── PROTOCOL_REFERENCE.md   ← Complete protocol reference
│   │   ├── AUDIT_PACKAGE.md        ← Security audit documentation
│   │   ├── OPERATOR_RUNBOOK.md     ← Operations runbook
│   │   └── DEVELOPER_GUIDE.md      ← This file
│   └── programs/
│       └── funrun_v2/
│           ├── Cargo.toml          ← Program crate manifest
│           ├── src/
│           │   ├── lib.rs          ← Anchor entrypoint; 13 instructions
│           │   ├── consts.rs       ← All protocol constants
│           │   ├── errors.rs       ← 51 typed error codes
│           │   ├── events.rs       ← 14 event structs
│           │   ├── math.rs         ← Pure AMM math + tests
│           │   ├── deploy_config.rs← CU budgets + network addresses
│           │   ├── property_tests.rs← Property-based tests
│           │   ├── state/
│           │   │   ├── mod.rs
│           │   │   ├── bonding_curve.rs
│           │   │   ├── global_config.rs
│           │   │   ├── treasury.rs
│           │   │   ├── creator_profile.rs
│           │   │   └── referral_account.rs
│           │   └── instructions/
│           │       ├── mod.rs
│           │       ├── initialize.rs
│           │       ├── update_global_config.rs
│           │       ├── pause.rs
│           │       ├── sweep_treasury.rs
│           │       ├── set_creator_referrer.rs
│           │       ├── create_coin.rs
│           │       ├── buy.rs
│           │       ├── sell.rs
│           │       ├── claim_creator_fees.rs
│           │       ├── claim_referrer_fees.rs
│           │       ├── initiate_graduation.rs
│           │       └── complete_graduation.rs  ← ~3,200 lines
│           └── tests/
│               └── integration.rs  ← Scaffolded; requires integration-tests feature
├── backend/                        ← Node.js Express backend
├── frontend/                       ← React + Vite frontend
└── RELEASE_RC1.md                  ← Release report
```

---

## 3. Build System

### 3.1 Feature Flags

The program uses Cargo feature flags to select network-specific addresses:

| Feature | Use case | Key difference |
|---|---|---|
| `--features devnet` | Devnet testing | Raydium pool fee: `G11FVVno...` |
| `--features mainnet` | Mainnet deployment | Raydium pool fee: `DNXgeM9E...` |
| *(no feature)* | Same as mainnet | Backward-compatible default |

```bash
# Devnet build
cargo build-sbf --features devnet

# Mainnet build
cargo build-sbf --features mainnet

# Output binary location
ls target/deploy/funrun_v2.so
```

### 3.2 Offline Mode

The workspace is configured for **fully offline builds** (`anchor/.cargo/config.toml: offline = true`). All dependencies are pinned in `Cargo.lock` and cached locally.

```toml
# anchor/.cargo/config.toml
[net]
offline = true
```

**Do not change this to `offline = false`** without a specific reason — doing so allows cargo to attempt network fetches, which can break the build in restricted environments.

### 3.3 Key Dependencies

```toml
[dependencies]
anchor-lang = { version = "0.31.1", features = ["init-if-needed"] }
anchor-spl  = { version = "0.31.1", features = ["token", "associated_token"] }
```

No other runtime dependencies. The program is intentionally lean.

### 3.4 Integration Test Feature (Future)

A scaffolded integration test binary exists at `tests/integration.rs`. It is gated behind the `integration-tests` feature to keep `cargo test` fast and offline:

```bash
# To enable integration tests (requires network + solana-program-test):
# 1. Add to [dev-dependencies] in programs/funrun_v2/Cargo.toml:
#    solana-program-test = "~2.3"
#    tokio = { version = "1", features = ["macros", "rt-multi-thread"] }
# 2. Set offline = false in .cargo/config.toml
# 3. Run: cargo fetch
# 4. Run: cargo test --features integration-tests
```

---

## 4. Running Tests

### 4.1 All Unit Tests

```bash
cd anchor
cargo test

# Expected:
# test result: ok. 544 passed; 0 failed; 0 ignored; 0 measured
```

### 4.2 Specific Test Module

```bash
# Run only math tests
cargo test --package funrun_v2 math

# Run only graduation simulation tests
cargo test --package funrun_v2 graduation_flow_simulation

# Run only property tests
cargo test --package funrun_v2 property_tests

# Run a single test by name
cargo test sim_full_graduation_accounting_at_85sol_threshold
```

### 4.3 Verbose Output

```bash
# Show println! output and test names
cargo test -- --nocapture

# Show test execution time
cargo test -- --test-threads=1 --nocapture
```

### 4.4 Test Distribution

| Module | Tests | What is covered |
|---|---|---|
| `math.rs` | 26 | AMM formulas, fee split, k invariant, round-trip, overflow |
| `property_tests.rs` | 11 | Pseudo-random inputs, no-panic guarantees |
| `deploy_config.rs` | 5 | CU budget validation, network address sanity |
| `state/bonding_curve.rs` | 18 | compute_expected_lp, account layout |
| `state/global_config.rs` | 12 | Config validation |
| `state/referral_account.rs` | 8 | Referral account logic |
| `state/treasury.rs` | 6 | Treasury account logic |
| `state/creator_profile.rs` | 7 | Profile account logic |
| `instructions/initiate_graduation.rs` | 20 | Eligibility checks, state transitions |
| `instructions/complete_graduation.rs` | 28 | Full graduation simulation (groups A–J) |
| Other instruction tests | ~403 | Per-instruction validation logic |
| **Total** | **544** | **All passing** |

---

## 5. Module Overview

### 5.1 `lib.rs` — Anchor Entrypoint

Defines the `#[program]` module with all 13 instruction dispatchers. Each dispatcher is a thin wrapper that calls the handler in its respective instruction module. Contains the `declare_id!()` macro with the on-chain program ID.

**Do not add business logic here.** Keep it as a dispatcher only.

### 5.2 `consts.rs` — Protocol Constants

All protocol-wide immutable values live here. Constants are grouped by category:

```
Virtual AMM reserves (VS₀, VT₀, k)
Token supply allocations (TOTAL, BONDING, LP_RESERVE)
Graduation parameters (threshold, dex_fee, PROTOCOL_VERSION)
Fee bounds (MAX_TOTAL_FEE_BPS, MAX_CREATION_FEE_LAMPORTS)
Default fee settings
Fee split ratios (CREATOR_FEE_PCT, REFERRER_FEE_PCT)
Validation limits (MAX_NAME_LEN, MAX_SYMBOL_LEN, MAX_URI_LEN)
PDA seeds
Raydium CPMM addresses + PDA seeds (with cfg feature flags)
Account size constants
```

**Never hard-code a constant inline in an instruction.** All numeric values must reference a constant from this file.

### 5.3 `errors.rs` — Error Codes

51 typed error codes grouped by phase:

- Validation (name, symbol, URI, fee config)
- Slippage (SlippageExceeded, InsufficientOutput)
- State (CurveComplete, ProgramPaused, graduation guards)
- Authorization (admin, creator, referrer)
- Arithmetic (overflow, division by zero)
- Graduation account validation P6.2 (14 errors)
- Graduation execution P6.3–P6.6 (9 errors)

**All errors must be typed.** Never use `require!(condition)` without a specific error variant.

### 5.4 `events.rs` — Events

14 event structs, emitted via `emit!()`. Events are the primary interface for off-chain indexers. Every state-changing instruction emits at least one event.

**Every new instruction must emit at least one event.**

### 5.5 `math.rs` — Pure AMM Math

Three public functions with no Solana runtime dependencies:

```rust
pub fn compute_tokens_out(virtual_sol: u64, virtual_tokens: u64, sol_net: u64) -> Result<u64>
pub fn compute_sol_out(virtual_sol: u64, virtual_tokens: u64, token_amount: u64) -> Result<u64>
pub fn compute_total_fee(sol_amount: u64, fee_bps: u16) -> u64
pub fn split_fee(total_fee: u64, has_referrer: bool) -> FeeSplit
```

All use `u128` intermediate arithmetic. Tests live in the same file (standard Rust `#[cfg(test)]` module).

**This module is a pure library — no Anchor types, no account access, no CPIs.**

### 5.6 `deploy_config.rs` — Compute Unit Budgets

Documents CU budgets for each instruction. Also documents network-specific addresses. Contains compile-time tests that verify budgets are within Solana limits.

### 5.7 `state/` — Account Structs

Each file defines one account type:

```rust
#[account]
pub struct BondingCurve {
    pub creator: Pubkey,
    pub mint: Pubkey,
    // ... all fields
}

impl BondingCurve {
    pub fn compute_expected_lp(...) -> Option<u64> { ... }
}
```

Account sizes are pre-computed in `consts.rs` and verified at compile time via the `#[account(space = BONDING_CURVE_SIZE)]` constraint.

### 5.8 `instructions/` — Instruction Handlers

Each instruction has its own file with:
1. `#[derive(Accounts)]` struct — account validation constraints
2. `pub fn handler(ctx, args) -> Result<()>` — business logic
3. Optional `#[cfg(test)]` module for unit tests

**Pattern:**
```rust
pub fn handler(ctx: Context<InstructionName>, arg: Type) -> Result<()> {
    // 1. Validate business logic (beyond Anchor account constraints)
    // 2. Compute outputs
    // 3. Update state
    // 4. Execute CPIs
    // 5. Emit event
    Ok(())
}
```

### 5.9 `property_tests.rs` — Property-Based Tests

Seeded LCG generates pseudo-random inputs for cross-module invariant tests. No external dependency (no `proptest` crate) — pure Rust.

---

## 6. Code Conventions

### 6.1 Error Handling

```rust
// Always use typed errors — never generic require!
require!(condition, FunrunError::SpecificError);

// For arithmetic — use checked operations
let result = a.checked_mul(b).ok_or(FunrunError::ArithmeticOverflow)?;

// For u128 intermediates in AMM math
let k = (virtual_sol as u128)
    .checked_mul(virtual_tokens as u128)
    .ok_or(FunrunError::ArithmeticOverflow)?;
```

### 6.2 Fee Distribution Pattern

```rust
// Always compute fee split before any transfers
let total_fee = compute_total_fee(sol_amount, config.total_trading_fee_bps);
let split = split_fee(total_fee, bonding_curve.creator_referrer.is_some());

// Transfer treasury share
**treasury.to_account_info().lamports.borrow_mut() += split.treasury;
**ctx.accounts.payer.lamports.borrow_mut() -= split.treasury;

// Accumulate creator share (NOT a transfer — field update)
bonding_curve.creator_fees_accumulated += split.creator;

// Transfer referrer share (if applicable)
if split.referrer > 0 {
    **referral_account.to_account_info().lamports.borrow_mut() += split.referrer;
    **ctx.accounts.payer.lamports.borrow_mut() -= split.referrer;
}
```

### 6.3 PDA Signing

```rust
// In complete_graduation — BondingCurve PDA signs all CPIs
let bonding_curve_seeds = &[
    BONDING_CURVE_SEED,
    bonding_curve.mint.as_ref(),
    &[bonding_curve.bump],
];
let signer_seeds = &[&bonding_curve_seeds[..]];

// CPI with signer
token::mint_to(
    CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::MintTo { ... },
        signer_seeds,
    ),
    amount,
)?;
```

### 6.4 Constants — Never Inline

```rust
// WRONG
let threshold = 85_000_000_000u64;

// RIGHT
use crate::consts::GRADUATION_THRESHOLD_LAMPORTS;
let threshold = GRADUATION_THRESHOLD_LAMPORTS;
```

### 6.5 Account Size — Always from consts.rs

```rust
// In Accounts struct
#[account(
    init,
    payer = creator,
    space = BONDING_CURVE_SIZE,  // from consts.rs
    seeds = [BONDING_CURVE_SEED, mint.key().as_ref()],
    bump,
)]
pub bonding_curve: Account<'info, BondingCurve>,
```

### 6.6 Post-CPI Verification Pattern

After any CPI that modifies external state, reload the account and verify:

```rust
// After set_authority CPI
ctx.accounts.coin_mint.reload()?;
require!(
    ctx.accounts.coin_mint.mint_authority == COption::None,
    FunrunError::MintAuthorityRevocationFailed
);
```

### 6.7 Comments Policy

- **No what-comments** — code names explain what.
- **Why-comments** — when a non-obvious invariant, constraint, or workaround is present.
- **Phase markers** — use `// ── P6.3 — Graduation execution ─────` style for grouping in large files.
- **Step markers** — in `complete_graduation.rs`, each step is labelled `// Step 15: ...` to match the protocol spec.

---

## 7. Adding a New Instruction

Follow this checklist when adding a new instruction to the protocol.

### Step 1 — Define the Error Codes

Add new error variants to `errors.rs` in the appropriate group:

```rust
/// Description of when this error fires.
#[msg("Human-readable error message")]
MyNewError,
```

### Step 2 — Define the Event

Add a new event struct to `events.rs`:

```rust
#[event]
pub struct MyNewEvent {
    pub relevant_field: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}
```

### Step 3 — Create the Instruction File

Create `src/instructions/my_new_instruction.rs`:

```rust
use anchor_lang::prelude::*;
use crate::consts::*;
use crate::errors::FunrunError;
use crate::events::MyNewEvent;
use crate::state::*;

#[derive(Accounts)]
pub struct MyNewInstruction<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_CONFIG_SEED],
        bump = global_config.bump,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(mut)]
    pub caller: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<MyNewInstruction>) -> Result<()> {
    let config = &ctx.accounts.global_config;

    // 1. Validate (pause check if user-facing)
    require!(!config.paused, FunrunError::ProgramPaused);

    // 2. Business logic

    // 3. State update

    // 4. Emit event
    emit!(MyNewEvent {
        relevant_field: ctx.accounts.caller.key(),
        amount: 0,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn my_new_instruction_basic_case() {
        // test logic
    }
}
```

### Step 4 — Register in `instructions/mod.rs`

```rust
pub mod my_new_instruction;
pub use my_new_instruction::*;
```

### Step 5 — Add to `lib.rs`

```rust
pub fn my_new_instruction(ctx: Context<MyNewInstruction>) -> Result<()> {
    instructions::my_new_instruction::handler(ctx)
}
```

### Step 6 — Add CU Budget to `deploy_config.rs`

```rust
pub const MY_NEW_INSTRUCTION_CU: u32 = 20_000;
```

### Step 7 — Add to deploy_config.rs Test

```rust
// In instructions_within_default_budget_are_below_200k test
compute_budget::MY_NEW_INSTRUCTION_CU,
```

### Step 8 — Write Tests

Minimum required tests:
- Happy path
- Authorization failure (if applicable)
- Pause check (if user-facing)
- Edge cases

### Step 9 — Update Account Size (if new account added)

If the instruction creates a new account type, add its size constant to `consts.rs`:

```rust
pub const MY_NEW_ACCOUNT_SIZE: usize = 8  // discriminator
    + 32  // field1: Pubkey
    + 8   // field2: u64
    + 64; // padding
```

---

## 8. Client Integration

### 8.1 TypeScript / JavaScript (Anchor IDL)

```typescript
import { Program, AnchorProvider, web3 } from "@coral-xyz/anchor";
import { FunrunV2 } from "./target/types/funrun_v2";
import idl from "./target/idl/funrun_v2.json";

const provider = AnchorProvider.env();
const program = new Program<FunrunV2>(idl as any, provider);

// Derive GlobalConfig PDA
const [globalConfig] = web3.PublicKey.findProgramAddressSync(
  [Buffer.from("global_config")],
  program.programId
);

// Derive Treasury PDA
const [treasury] = web3.PublicKey.findProgramAddressSync(
  [Buffer.from("treasury")],
  program.programId
);

// Derive BondingCurve PDA
const [bondingCurve] = web3.PublicKey.findProgramAddressSync(
  [Buffer.from("bonding_curve"), mintPubkey.toBuffer()],
  program.programId
);
```

### 8.2 Buy Example

```typescript
import { ComputeBudgetProgram, Transaction } from "@solana/web3.js";

const solAmount = new BN(1_000_000_000); // 1 SOL
const minTokensOut = new BN(0);          // set to actual slippage tolerance

await program.methods
  .buy(solAmount, minTokensOut)
  .accounts({
    globalConfig,
    treasury,
    bondingCurve,
    bondingCurveTokenAccount: vaultAta,
    buyerTokenAccount: buyerAta,
    buyer: provider.wallet.publicKey,
    referralAccount: creatorReferrerPda ?? SystemProgram.programId, // optional
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 8.3 Complete Graduation Example

```typescript
import { ComputeBudgetProgram } from "@solana/web3.js";

// IMPORTANT: must prepend compute budget instruction
const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
  units: 1_400_000,
});

const tx = await program.methods
  .completeGraduation()
  .accounts({
    globalConfig,
    treasury,
    bondingCurve,
    coinMint: mint,
    bondingCurveTokenAccount: vaultAta,
    bondingCurveWsolAccount: wsolAta,
    raydiumCpmmProgram: RAYDIUM_CPMM_PROGRAM_ID,
    raydiumAuthority: raydiumAuthorityPda,
    ammConfig: AMM_CONFIG_MAINNET,
    poolState: poolStatePda,
    lpMint: lpMintPda,
    creatorLpToken: creatorLpAta,
    token0Mint: token0,  // lower by address
    token1Mint: token1,  // higher by address
    token0Vault: token0VaultPda,
    token1Vault: token1VaultPda,
    createPoolFee: CREATE_POOL_FEE_MAINNET,
    observationState: observationPda,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .preInstructions([computeBudgetIx])
  .rpc();
```

### 8.4 PDA Derivation Reference

```typescript
const PROGRAM_ID = new PublicKey("HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP");
const RAYDIUM_CPMM = new PublicKey("CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C");

// Protocol PDAs
const [globalConfig]  = PublicKey.findProgramAddressSync([Buffer.from("global_config")], PROGRAM_ID);
const [treasury]      = PublicKey.findProgramAddressSync([Buffer.from("treasury")], PROGRAM_ID);
const [bondingCurve]  = PublicKey.findProgramAddressSync([Buffer.from("bonding_curve"), mint.toBuffer()], PROGRAM_ID);
const [creatorProfile]= PublicKey.findProgramAddressSync([Buffer.from("creator_profile"), creator.toBuffer()], PROGRAM_ID);
const [referralAcct]  = PublicKey.findProgramAddressSync([Buffer.from("creator_referral"), referrer.toBuffer()], PROGRAM_ID);

// Raydium PDAs
const [raydiumAuth]   = PublicKey.findProgramAddressSync([Buffer.from("vault_and_lp_mint_auth_seed")], RAYDIUM_CPMM);
const [poolState]     = PublicKey.findProgramAddressSync([Buffer.from("pool"), ammConfig.toBuffer(), token0.toBuffer(), token1.toBuffer()], RAYDIUM_CPMM);
const [lpMint]        = PublicKey.findProgramAddressSync([Buffer.from("pool_lp_mint"), poolState.toBuffer()], RAYDIUM_CPMM);
const [observation]   = PublicKey.findProgramAddressSync([Buffer.from("observation"), poolState.toBuffer()], RAYDIUM_CPMM);
const [token0Vault]   = PublicKey.findProgramAddressSync([Buffer.from("pool_vault"), poolState.toBuffer(), token0.toBuffer()], RAYDIUM_CPMM);
const [token1Vault]   = PublicKey.findProgramAddressSync([Buffer.from("pool_vault"), poolState.toBuffer(), token1.toBuffer()], RAYDIUM_CPMM);

// Token ordering for Raydium (token0 < token1 numerically)
const [token0, token1] = [mintA, mintB].sort((a, b) =>
  a.toBuffer().compare(b.toBuffer())
);
```

### 8.5 Listening to Events

```typescript
// Subscribe to all program events
program.addEventListener("tokensPurchased", (event, slot) => {
  console.log(`Buy: ${event.tokensOut} tokens for ${event.solAmount} lamports`);
  console.log(`Fees: treasury=${event.treasuryFee}, creator=${event.creatorFee}`);
});

program.addEventListener("graduationInitiated", (event, slot) => {
  console.log(`Graduation initiated: mint=${event.mint}`);
  // Trigger complete_graduation immediately
  triggerCompleteGraduation(event.mint);
});

program.addEventListener("liquidityLocked", (event, slot) => {
  console.log(`LP burned: ${event.lpBurned} LP tokens for mint=${event.mint}`);
});
```

---

## 9. Extension Points

The protocol is **frozen for breaking changes** at v1.0.0-rc1. However, the following extension points exist for non-breaking additions:

### 9.1 Account Padding Fields

Every account struct has a `_padding` field of 55–128 bytes. New fields can be added at the end of these structs (before the padding) in a future program upgrade without changing account sizes or breaking existing data.

```rust
// Example: adding a new field to BondingCurve
pub struct BondingCurve {
    // ... existing fields ...
    pub graduated: bool,         // existing
    pub new_field: u64,          // NEW — added before padding
    pub _padding: [u8; 47],      // reduced from 55 to 47 (55 - 8 = 47)
}
```

**Constraint:** New fields must fit within the existing padding. If more space is needed, a new program deployment with reallocation is required.

### 9.2 `update_global_config` Parameters

Admin-configurable parameters (fees, graduation threshold) can be adjusted without a program upgrade. See the Protocol Reference for valid ranges.

### 9.3 Adding Off-Chain Indexers

The event system (`emit!()`) is the canonical integration point for off-chain services. All state changes produce events. New off-chain features (analytics, notifications, auto-graduation) should subscribe to program events rather than polling account state.

### 9.4 Integration Test Harness

The `tests/integration.rs` binary is scaffolded for future use with `solana-program-test`. When network access is available, add the required dev-dependencies and write integration tests against a local validator.

---

## 10. Troubleshooting

### Build Fails: `error: no registry configured`

```
# Cause: cargo tried to fetch a missing dependency
# Fix: verify all deps are in local cache; do NOT change offline = true
cargo build-sbf --features devnet --offline
```

### Test Fails: `called Result::unwrap() on Err`

```bash
# Run with nocapture to see the error
cargo test failing_test_name -- --nocapture
```

### `InsufficientOutput` on Small Trades

The AMM floor-division returns 0 for very small trades. This is expected:
- Buy: `sol_net` is too small to move the curve by even 1 token unit
- Sell: `token_amount` is too small to return even 1 lamport

**Fix (client-side):** Set a minimum trade size of at least 1,000 lamports for buys, and at least 1,000 raw token units for sells.

### `SlippageExceeded` on Trades

The AMM price moved between your simulation and the on-chain execution (another trade occurred in between).

**Fix (client-side):** Re-simulate with fresh reserve values, increase slippage tolerance, or use a lower `min_tokens_out` / `min_sol_out`.

### `complete_graduation` Fails with `ComputationalBudgetExceeded`

You did not include the compute budget instruction.

```typescript
// Always prepend this to complete_graduation transactions
const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 });
```

### `InvalidTokenOrdering` on complete_graduation

Raydium requires `token0_mint < token1_mint` (numeric byte comparison).

```typescript
// Always sort before passing to complete_graduation
const [token0, token1] = [coinMint, wsolMint].sort((a, b) =>
  Buffer.from(a.toBytes()).compare(Buffer.from(b.toBytes()))
);
```

### `PostCpiLpAmountMismatch` on complete_graduation

The LP amount minted by Raydium does not match `floor(sqrt(sol × tokens)) − 100`. This can happen if:
1. The wrong `sol_to_dex` or token amounts were passed to Raydium.
2. The `amm_config` has a different fee structure than expected.
3. The Raydium pool already existed (duplicate pool).

**Fix:** Verify all amounts match the `graduation_dex_fee_snapshot` and `LP_RESERVE_TOKENS` constants.

---

*End of Fun.Run V2 Developer Guide — v1.0.0-rc1*
