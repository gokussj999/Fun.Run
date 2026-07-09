# Fun.Run V2 — Protocol Reference

**Version:** v1.0.0-rc1  
**Program ID (Devnet):** `HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP`  
**Network:** Solana (SBF / BPF)  
**Framework:** Anchor 0.31.1  
**Date:** 2026-07-03  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Economic Model](#2-economic-model)
3. [Fee Model](#3-fee-model)
4. [State Machine](#4-state-machine)
5. [PDA Reference](#5-pda-reference)
6. [Account Layouts](#6-account-layouts)
7. [Instruction Reference](#7-instruction-reference)
8. [Events Reference](#8-events-reference)
9. [Error Codes](#9-error-codes)
10. [Graduation Flow](#10-graduation-flow)
11. [Security Assumptions](#11-security-assumptions)
12. [Upgrade Policy](#12-upgrade-policy)
13. [Mainnet Deployment Checklist](#13-mainnet-deployment-checklist)

---

## 1. Overview

Fun.Run V2 is a Solana on-chain meme-coin launchpad. Any user can launch an SPL token whose price is governed by a **constant-product automated market maker (CPMM)** bonding curve. When cumulative real SOL in the curve reaches the **graduation threshold (85 SOL)**, the curve is permanently closed and its liquidity is migrated to a **Raydium CPMM DEX pool** in a two-phase, permissionless graduation process. All LP tokens minted during pool creation are immediately burned, making the DEX liquidity permanently locked.

### Key Properties

| Property | Value |
|---|---|
| AMM Type | Constant-Product (k = VS × VT) |
| Token Decimals | 6 |
| Bonding Supply | 800,000,000 tokens (800M) |
| LP Reserve | 200,000,000 tokens (200M) |
| Total Supply | 1,000,000,000 tokens (1B) |
| Graduation Threshold | 85 SOL |
| DEX Fee at Graduation | 6 SOL |
| Default Trading Fee | 1.50% (150 bps) |
| Default Creation Fee | 0.02 SOL |
| Protocol Version | 2 |

---

## 2. Economic Model

### 2.1 Virtual AMM Reserves

Each bonding curve starts with **virtual** reserves that set the initial price without requiring any real SOL or tokens to back them:

```
VS₀ = 30,000,000,000 lamports  (30 SOL virtual)
VT₀ = 1,073,000,191,000,000   (≈1.073B tokens virtual)
k   = VS₀ × VT₀ ≈ 3.219 × 10²⁵
```

Virtual reserves are never transferred on-chain; they exist only as fields in the `BondingCurve` account state. Real reserves (`real_sol_reserves`, `real_token_reserves`) track actual SOL and tokens held.

### 2.2 Price Formula

**Buy** — tokens out for `sol_net` lamports entering the curve:

```
tokens_out = VT − floor(k / (VS + sol_net))
```

**Sell** — gross SOL out for `token_amount` tokens entering the vault:

```
sol_gross = VS − floor(k / (VT + token_amount))
```

Both formulas use **u128 intermediate arithmetic** to prevent overflow (k ≈ 3.2 × 10²⁵ exceeds u64::MAX). Floor division ensures `k_after ≤ k_before` — the AMM never creates value from rounding.

### 2.3 Price Behavior

| State | Virtual SOL | Virtual Tokens | Price (SOL/token) |
|---|---|---|---|
| Genesis | 30 SOL | 1,073,000,191 tokens | ≈ 2.8 × 10⁻⁸ |
| Graduation (85 SOL real) | ≈ 115 SOL | ≈ 279,913,093 tokens | ≈ 4.1 × 10⁻⁷ |
| Appreciation | — | — | ≈ 14.6× |

### 2.4 Token Allocation

```
Total Supply: 1,000,000,000 tokens
├── Bonding Curve Supply: 800,000,000 tokens  (minted to vault at create_coin)
└── LP Reserve:           200,000,000 tokens  (minted at complete_graduation)
```

The 200M LP reserve tokens are minted directly to the curve vault at graduation time, then deposited into Raydium alongside the real SOL. No tokens exist outside the on-chain accounts at any point.

### 2.5 Graduation Economics (at 85 SOL threshold)

```
real_sol_reserves       = 85,000,000,000 lamports
graduation_dex_fee      =  6,000,000,000 lamports  → Treasury
sol_to_dex              = 79,000,000,000 lamports  → Raydium pool
tokens_to_dex           = 200,000,000,000,000 raw  → Raydium pool
LP minted               = floor(sqrt(79e9 × 200e12)) − 100
LP burned               = all (permanent lock)
```

---

## 3. Fee Model

### 3.1 Trading Fees

Every buy and sell charges a fee computed on the **gross SOL amount**:

```
total_fee = floor(sol_amount × fee_bps / 10_000)
```

**Split (with creator referrer set):**

| Recipient | Share | Amount |
|---|---|---|
| Creator | 40% | `floor(total_fee × 40 / 100)` |
| Creator Referrer | 20% | `floor(total_fee × 20 / 100)` |
| Treasury | 40% | `total_fee − creator − referrer` |

**Split (no creator referrer):**

| Recipient | Share | Amount |
|---|---|---|
| Creator | 40% | `floor(total_fee × 40 / 100)` |
| Treasury | 60% | `total_fee − creator` |

Treasury absorbs all integer-division rounding. The invariant `treasury + creator + referrer == total_fee` is guaranteed for all inputs.

### 3.2 Fee Bounds (Hard-Coded)

| Parameter | Default | Maximum |
|---|---|---|
| `total_trading_fee_bps` | 150 (1.5%) | 500 (5.0%) |
| `creation_fee_lamports` | 20,000,000 (0.02 SOL) | 1,000,000,000 (1 SOL) |

Admin may update fee parameters via `update_global_config`, but these hard ceilings are enforced on-chain and cannot be overridden.

### 3.3 Creation Fee

Charged once at `create_coin`. 100% goes to Treasury. Range: 0 to `MAX_CREATION_FEE_LAMPORTS`.

### 3.4 Graduation DEX Fee

A flat 6 SOL fee is deducted from `real_sol_reserves` at `complete_graduation` (step 15) and transferred to Treasury. This fee is **snapshotted** at `initiate_graduation` time into `BondingCurve.graduation_dex_fee_snapshot`, so a subsequent `update_global_config` cannot change the amount.

### 3.5 Fee Claim Instructions

| Fee Type | Instruction | Source | Pause Exempt |
|---|---|---|---|
| Creator trading fees | `claim_creator_fees` | `BondingCurve.creator_fees_accumulated` | Yes |
| Referrer trading fees | `claim_referrer_fees` | `ReferralAccount` lamport balance | Yes |

Both claim instructions are intentionally **not gated on `GlobalConfig.paused`** — they only withdraw previously earned funds and do not modify trading state.

---

## 4. State Machine

### 4.1 BondingCurve States

```
                  create_coin
                      │
                      ▼
              ┌───────────────┐
              │    ACTIVE     │  complete=false, graduated=false
              │  (trading on) │
              └───────┬───────┘
                      │ real_sol_reserves ≥ 85 SOL
                      │ initiate_graduation (permissionless)
                      ▼
              ┌───────────────┐
              │  GRADUATING   │  complete=true, graduated=false
              │(trading off)  │
              └───────┬───────┘
                      │ complete_graduation (permissionless)
                      ▼
              ┌───────────────┐
              │  GRADUATED    │  complete=true, graduated=true
              │  (DEX pool)   │
              └───────────────┘
```

### 4.2 State Transitions

| From | To | Instruction | Condition |
|---|---|---|---|
| ACTIVE | GRADUATING | `initiate_graduation` | `real_sol_reserves ≥ graduation_threshold` AND `protocol_version == PROTOCOL_VERSION` |
| GRADUATING | GRADUATED | `complete_graduation` | `complete == true` AND `graduated == false` |

`complete` and `graduated` are **monotone** — once set to `true`, they are never reset to `false`. This is enforced by the instruction-level guards.

### 4.3 Protocol Pause

The admin can call `pause_protocol` to set `GlobalConfig.paused = true`. While paused:
- `buy`, `sell`, `create_coin`, `initiate_graduation`, `complete_graduation` all fail with `ProgramPaused`.
- `claim_creator_fees` and `claim_referrer_fees` remain available (pause-exempt).
- Admin instructions (`update_global_config`, `sweep_treasury`) remain available.

`unpause_protocol` restores normal operation. Both are idempotent.

---

## 5. PDA Reference

All PDAs are derived with `find_program_address` using the seeds listed below and the Fun.Run V2 program ID.

### 5.1 Protocol Singletons

| Account | Seeds | Notes |
|---|---|---|
| `GlobalConfig` | `["global_config"]` | Created once by `initialize` |
| `Treasury` | `["treasury"]` | Created once by `initialize` |

### 5.2 Per-Coin Accounts

| Account | Seeds | Notes |
|---|---|---|
| `BondingCurve` | `["bonding_curve", mint_pubkey]` | One per token mint |
| Bonding Curve Token Vault | ATA(bonding_curve, coin_mint) | SPL ATA — not a PDA |
| Bonding Curve WSOL ATA | ATA(bonding_curve, WSOL_MINT) | Created at `complete_graduation` step 17 |

### 5.3 Per-User Accounts

| Account | Seeds | Notes |
|---|---|---|
| `CreatorProfile` | `["creator_profile", creator_pubkey]` | Created lazily by `set_creator_referrer` |
| `ReferralAccount` | `["creator_referral", referrer_pubkey]` | Created lazily by `set_creator_referrer` |

### 5.4 Raydium CPMM PDAs (derived at graduation)

| Account | Seeds | Program |
|---|---|---|
| Authority | `["vault_and_lp_mint_auth_seed"]` | Raydium CPMM |
| Pool State | `["pool", amm_config, token0_mint, token1_mint]` | Raydium CPMM |
| LP Mint | `["pool_lp_mint", pool_state]` | Raydium CPMM |
| Observation State | `["observation", pool_state]` | Raydium CPMM |
| Token0 Vault | `["pool_vault", pool_state, token0_mint]` | Raydium CPMM |
| Token1 Vault | `["pool_vault", pool_state, token1_mint]` | Raydium CPMM |

**Token ordering:** Raydium requires `token0_mint < token1_mint` (numeric comparison). The bonding curve instruction validates this ordering and returns `InvalidTokenOrdering` if it is violated.

---

## 6. Account Layouts

All account sizes include an 8-byte Anchor discriminator prefix and a trailing padding region for future non-breaking field additions.

### 6.1 GlobalConfig

**Size:** 246 bytes  
**PDA:** `["global_config"]`

| Field | Type | Size | Description |
|---|---|---|---|
| discriminator | `[u8; 8]` | 8 | Anchor account discriminator |
| admin | `Pubkey` | 32 | Protocol admin; can call admin instructions |
| fee_recipient | `Pubkey` | 32 | Destination for treasury sweeps |
| creation_fee_lamports | `u64` | 8 | Current coin creation fee |
| total_trading_fee_bps | `u16` | 2 | Current trading fee in basis points |
| graduation_threshold | `u64` | 8 | real_sol_reserves threshold for graduation |
| graduation_dex_fee | `u64` | 8 | Flat DEX pool creation fee at graduation |
| paused | `bool` | 1 | Protocol pause flag |
| bump | `u8` | 1 | PDA bump seed |
| total_sol_collected | `u64` | 8 | Lifetime SOL collected by protocol |
| total_sol_disbursed | `u64` | 8 | Lifetime SOL disbursed by protocol |
| _padding | `[u8; 128]` | 128 | Reserved for future fields |

### 6.2 BondingCurve

**Size:** 448 bytes  
**PDA:** `["bonding_curve", mint_pubkey]`

| Field | Type | Size | Description |
|---|---|---|---|
| discriminator | `[u8; 8]` | 8 | Anchor account discriminator |
| creator | `Pubkey` | 32 | Wallet that called `create_coin` |
| mint | `Pubkey` | 32 | SPL mint address for this coin |
| creator_referrer | `Option<Pubkey>` | 33 | Snapshotted referrer at creation time (1 tag + 32 data) |
| name | `String` | 36 | Token name (4-byte Borsh prefix + max 32 bytes) |
| symbol | `String` | 14 | Token symbol (4-byte Borsh prefix + max 10 bytes) |
| uri | `String` | 204 | Metadata URI (4-byte Borsh prefix + max 200 bytes) |
| creation_fee_paid | `u64` | 8 | Creation fee paid at launch |
| creation_timestamp | `i64` | 8 | Unix timestamp of `create_coin` |
| protocol_version | `u8` | 1 | Must equal `PROTOCOL_VERSION` (2) |
| virtual_sol_reserves | `u64` | 8 | VS — virtual SOL reserve |
| virtual_token_reserves | `u64` | 8 | VT — virtual token reserve |
| real_sol_reserves | `u64` | 8 | Actual SOL in curve vault |
| real_token_reserves | `u64` | 8 | Actual tokens remaining in curve vault |
| creator_fees_accumulated | `u64` | 8 | Unclaimed creator fee SOL |
| complete | `bool` | 1 | True after `initiate_graduation` |
| total_trades | `u64` | 8 | Cumulative trade count |
| total_volume_sol | `u64` | 8 | Cumulative gross SOL volume |
| bump | `u8` | 1 | PDA bump seed |
| graduation_dex_fee_snapshot | `u64` | 8 | DEX fee locked at initiation time |
| graduated | `bool` | 1 | True after `complete_graduation` |
| _padding | `[u8; 55]` | 55 | Reserved for future fields |

### 6.3 CreatorProfile

**Size:** 154 bytes  
**PDA:** `["creator_profile", creator_pubkey]`

| Field | Type | Size | Description |
|---|---|---|---|
| discriminator | `[u8; 8]` | 8 | Anchor account discriminator |
| creator | `Pubkey` | 32 | Owner of this profile |
| referrer | `Option<Pubkey>` | 33 | This creator's own referrer (write-once) |
| referrer_set_at | `i64` | 8 | Timestamp when referrer was set |
| total_creator_fees_earned | `u64` | 8 | Lifetime creator fees earned across all coins |
| bump | `u8` | 1 | PDA bump seed |
| _padding | `[u8; 64]` | 64 | Reserved for future fields |

### 6.4 ReferralAccount

**Size:** 117 bytes  
**PDA:** `["creator_referral", referrer_pubkey]`

| Field | Type | Size | Description |
|---|---|---|---|
| discriminator | `[u8; 8]` | 8 | Anchor account discriminator |
| referrer | `Pubkey` | 32 | Owner (referrer) of this account |
| fees_claimed_total | `u64` | 8 | Lifetime lamports claimed |
| last_claim_timestamp | `i64` | 8 | Timestamp of most recent claim |
| total_creators_referred | `u32` | 4 | Number of creators who set this referrer |
| bump | `u8` | 1 | PDA bump seed |
| _padding | `[u8; 56]` | 56 | Reserved for future fields |

> **Note:** Referrer fees accumulate as raw lamports in the `ReferralAccount` account balance (not a struct field). The claimable amount is `account.lamports − rent_exempt_minimum`.

### 6.5 Treasury

**Size:** 89 bytes  
**PDA:** `["treasury"]`

| Field | Type | Size | Description |
|---|---|---|---|
| discriminator | `[u8; 8]` | 8 | Anchor account discriminator |
| total_sol_collected | `u64` | 8 | Lifetime SOL collected |
| total_sol_disbursed | `u64` | 8 | Lifetime SOL swept to fee_recipient |
| bump | `u8` | 1 | PDA bump seed |
| _padding | `[u8; 64]` | 64 | Reserved for future fields |

---

## 7. Instruction Reference

The program exposes **13 instructions** grouped into 6 phases.

---

### P1 — Administration

#### `initialize`

Creates the `GlobalConfig` and `Treasury` singleton PDAs. Must be called exactly once after deployment. The transaction signer becomes the initial `admin` and `fee_recipient`.

**Accounts:**

| # | Account | Writable | Signer | Description |
|---|---|---|---|---|
| 0 | `global_config` | ✓ | — | PDA `["global_config"]` — init |
| 1 | `treasury` | ✓ | — | PDA `["treasury"]` — init |
| 2 | `admin` | ✓ | ✓ | Pays for PDA rent; becomes protocol admin |
| 3 | `system_program` | — | — | `11111111111111111111111111111111` |

**Parameters:** none  
**Errors:** none beyond standard Anchor account validation  
**CU Budget:** 20,000

---

#### `update_global_config`

Updates one or more protocol-wide configuration parameters. All parameters are optional (`None` values are left unchanged). Only the current `admin` may call this instruction.

**Accounts:**

| # | Account | Writable | Signer | Description |
|---|---|---|---|---|
| 0 | `global_config` | ✓ | — | Protocol config PDA |
| 1 | `admin` | — | ✓ | Must equal `GlobalConfig.admin` |

**Parameters:**

| Parameter | Type | Validation |
|---|---|---|
| `new_creation_fee` | `Option<u64>` | ≤ `MAX_CREATION_FEE_LAMPORTS` (1 SOL) |
| `new_trading_fee_bps` | `Option<u16>` | ≤ `MAX_TOTAL_FEE_BPS` (500) |
| `new_graduation_threshold` | `Option<u64>` | any u64 |
| `new_graduation_dex_fee` | `Option<u64>` | any u64 |
| `new_fee_recipient` | `Option<Pubkey>` | any valid pubkey |

**Errors:** `UnauthorizedAdmin`, `InvalidFeeConfiguration`  
**Emits:** `GlobalConfigUpdated`  
**CU Budget:** 8,000

---

#### `pause_protocol`

Sets `GlobalConfig.paused = true`. All user-facing instructions fail with `ProgramPaused` until `unpause_protocol` is called. Admin instructions are not affected. Idempotent.

**Accounts:**

| # | Account | Writable | Signer | Description |
|---|---|---|---|---|
| 0 | `global_config` | ✓ | — | Protocol config PDA |
| 1 | `admin` | — | ✓ | Must equal `GlobalConfig.admin` |

**Parameters:** none  
**Errors:** `UnauthorizedAdmin`  
**CU Budget:** 5,000

---

#### `unpause_protocol`

Sets `GlobalConfig.paused = false`. Idempotent.

**Accounts:** same as `pause_protocol`  
**Parameters:** none  
**Errors:** `UnauthorizedAdmin`  
**CU Budget:** 5,000

---

#### `sweep_treasury`

Transfers all accumulated SOL from the Treasury PDA to `GlobalConfig.fee_recipient`, leaving the rent-exempt minimum. Only the current `admin` may call this instruction.

**Accounts:**

| # | Account | Writable | Signer | Description |
|---|---|---|---|---|
| 0 | `global_config` | — | — | Protocol config PDA (read fee_recipient) |
| 1 | `treasury` | ✓ | — | Treasury PDA — lamports drained |
| 2 | `fee_recipient` | ✓ | — | Must equal `GlobalConfig.fee_recipient` |
| 3 | `admin` | — | ✓ | Must equal `GlobalConfig.admin` |
| 4 | `system_program` | — | — | `11111111111111111111111111111111` |

**Parameters:** none  
**Errors:** `UnauthorizedAdmin`  
**Emits:** `TreasurySweep`  
**CU Budget:** 20,000

---

### P2 — Creator Identity & Referral

#### `set_creator_referrer`

Sets the caller's permanent creator referrer. The relationship is **write-once and immutable**. The referrer is snapshotted into every `BondingCurve` the creator subsequently mints.

**Accounts:**

| # | Account | Writable | Signer | Description |
|---|---|---|---|---|
| 0 | `creator_profile` | ✓ | — | PDA `["creator_profile", creator]` — init_if_needed |
| 1 | `referral_account` | ✓ | — | PDA `["creator_referral", referrer]` — init_if_needed |
| 2 | `referrer_profile` | — | — | PDA `["creator_profile", referrer]` — must exist |
| 3 | `creator` | ✓ | ✓ | The caller setting their referrer |
| 4 | `referrer` | — | — | The referrer being set |
| 5 | `system_program` | — | — | |

**Parameters:** none  
**Errors:** `SelfReferral`, `ReferralAlreadySet`, `CircularReferral`  
**Emits:** `CreatorReferrerSet`  
**CU Budget:** 60,000

---

### P3 — Coin Creation

#### `create_coin`

Launches a new meme coin on the bonding curve. Creates an SPL mint (6 decimals), initialises the `BondingCurve` PDA with virtual AMM reserves and a permanent creator-referrer snapshot, mints `BONDING_SUPPLY_TOKENS` (800M) to the curve vault, and collects the creation fee (100% → Treasury).

**Accounts:**

| # | Account | Writable | Signer | Description |
|---|---|---|---|---|
| 0 | `global_config` | — | — | Protocol config (fee, pause flag) |
| 1 | `treasury` | ✓ | — | Receives creation fee |
| 2 | `bonding_curve` | ✓ | — | PDA `["bonding_curve", mint]` — init |
| 3 | `mint` | ✓ | ✓ | New SPL mint keypair |
| 4 | `bonding_curve_token_account` | ✓ | — | ATA(bonding_curve, mint) — init |
| 5 | `creator` | ✓ | ✓ | Pays rent; becomes coin creator |
| 6 | `creator_profile` | — | — | PDA `["creator_profile", creator]` — optional (if exists, referrer is snapshotted) |
| 7 | `token_program` | — | — | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` |
| 8 | `associated_token_program` | — | — | |
| 9 | `system_program` | — | — | |

**Parameters:**

| Parameter | Type | Max Length | Validation |
|---|---|---|---|
| `name` | `String` | 32 bytes | Non-empty; UTF-8 |
| `symbol` | `String` | 10 bytes | Non-empty; UTF-8 |
| `uri` | `String` | 200 bytes | Non-empty; UTF-8 |

**Errors:** `ProgramPaused`, `NameTooLong`, `SymbolTooLong`, `UriTooLong`  
**Emits:** `CoinCreated`  
**CU Budget:** 200,000 (requires explicit `ComputeBudget` instruction)

---

### P4 — Trading

#### `buy`

Buys tokens from the bonding curve with SOL.

**Formula:** `tokens_out = VT − floor(k / (VS + sol_net))` where `sol_net = sol_amount − total_fee`.

**Accounts:**

| # | Account | Writable | Signer | Description |
|---|---|---|---|---|
| 0 | `global_config` | — | — | Fee bps, pause flag |
| 1 | `treasury` | ✓ | — | Receives treasury fee share |
| 2 | `bonding_curve` | ✓ | — | AMM state (reserves, creator_fees) |
| 3 | `bonding_curve_token_account` | ✓ | — | Source of tokens for buyer |
| 4 | `buyer_token_account` | ✓ | — | ATA(buyer, mint) — receives tokens |
| 5 | `buyer` | ✓ | ✓ | Sends SOL; receives tokens |
| 6 | `referral_account` | ✓ | — | Optional — referrer's PDA (if creator_referrer set on curve) |
| 7 | `token_program` | — | — | |
| 8 | `system_program` | — | — | |

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `sol_amount` | `u64` | Gross SOL to spend (lamports) |
| `min_tokens_out` | `u64` | Minimum acceptable tokens (slippage guard) |

**Errors:** `ProgramPaused`, `CurveComplete`, `ZeroAmount`, `InsufficientOutput`, `SlippageExceeded`, `InsufficientTokensInVault`  
**Emits:** `TokensPurchased`  
**CU Budget:** 80,000

---

#### `sell`

Sells tokens back to the bonding curve for SOL.

**Formula:** `sol_gross = VS − floor(k / (VT + token_amount))`, then `sol_net = sol_gross − total_fee`.

**Accounts:**

| # | Account | Writable | Signer | Description |
|---|---|---|---|---|
| 0 | `global_config` | — | — | Fee bps, pause flag |
| 1 | `treasury` | ✓ | — | Receives treasury fee share |
| 2 | `bonding_curve` | ✓ | — | AMM state |
| 3 | `bonding_curve_token_account` | ✓ | — | Receives tokens from seller |
| 4 | `seller_token_account` | ✓ | — | Source of tokens |
| 5 | `seller` | ✓ | ✓ | Receives SOL net |
| 6 | `referral_account` | ✓ | — | Optional referrer PDA |
| 7 | `token_program` | — | — | |
| 8 | `system_program` | — | — | |

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `token_amount` | `u64` | Raw token units to sell |
| `min_sol_out` | `u64` | Minimum acceptable SOL net (slippage guard) |

**Errors:** `ProgramPaused`, `CurveComplete`, `ZeroAmount`, `InsufficientOutput`, `SlippageExceeded`, `InsufficientSolInCurve`  
**Emits:** `TokensSold`  
**CU Budget:** 80,000

---

### P5 — Fee Claims

#### `claim_creator_fees`

Claims all SOL accumulated in `BondingCurve.creator_fees_accumulated`. Valid at any point in the coin lifecycle — before and after graduation. Zero-balance claims succeed.

**Accounts:**

| # | Account | Writable | Signer | Description |
|---|---|---|---|---|
| 0 | `bonding_curve` | ✓ | — | Source of creator_fees_accumulated |
| 1 | `creator` | ✓ | ✓ | Must equal `BondingCurve.creator`; receives SOL |
| 2 | `system_program` | — | — | |

**Parameters:** none  
**Errors:** `UnauthorizedCreator`  
**Emits:** `CreatorFeesClaimed`  
**CU Budget:** 20,000  
**Pause Exempt:** Yes

---

#### `claim_referrer_fees`

Claims all SOL accumulated in the `ReferralAccount` lamport balance (above rent-exempt minimum). Zero-balance claims succeed.

**Accounts:**

| # | Account | Writable | Signer | Description |
|---|---|---|---|---|
| 0 | `referral_account` | ✓ | — | Source of referrer fees (lamport balance) |
| 1 | `referrer` | ✓ | ✓ | Must equal `ReferralAccount.referrer`; receives SOL |
| 2 | `system_program` | — | — | |

**Parameters:** none  
**Errors:** `UnauthorizedReferrer`  
**Emits:** `CreatorReferrerFeesClaimed`  
**CU Budget:** 20,000  
**Pause Exempt:** Yes

---

### P6 — DEX Graduation

#### `initiate_graduation`

First phase of graduation. Sets `BondingCurve.complete = true` (halting all trading), snapshots `graduation_dex_fee_snapshot` from the current `GlobalConfig`, and records `sol_to_dex_snapshot`. **Permissionless** — any wallet may call this once eligibility conditions are met.

**Accounts:**

| # | Account | Writable | Signer | Description |
|---|---|---|---|---|
| 0 | `global_config` | — | — | Pause flag, graduation parameters |
| 1 | `bonding_curve` | ✓ | — | State is updated (complete, snapshot) |
| 2 | `caller` | ✓ | ✓ | Any signer (permissionless) |
| 3 | `system_program` | — | — | |

**Parameters:** none

**Eligibility Requirements (all enforced atomically):**
1. Protocol is not paused
2. `BondingCurve.complete == false`
3. `BondingCurve.real_sol_reserves ≥ GlobalConfig.graduation_threshold`
4. `BondingCurve.protocol_version == PROTOCOL_VERSION`
5. `real_sol_reserves − graduation_dex_fee > 0`

**Errors:** `ProgramPaused`, `CurveComplete`, `GraduationThresholdNotMet`, `ProtocolVersionMismatch`, `InsufficientSolForGraduation`, `GraduationSnapshotInconsistency`  
**Emits:** `GraduationInitiated`  
**CU Budget:** 15,000

---

#### `complete_graduation`

Second and final phase of graduation. Executes the full 35-step Raydium CPMM pool creation, LP token burn, and authority revocations. **Permissionless** — any wallet may call this once `initiate_graduation` has been called.

**Accounts (20 total):**

| # | Account | Writable | Signer | Description |
|---|---|---|---|---|
| 0 | `global_config` | — | — | Protocol config |
| 1 | `treasury` | ✓ | — | Receives graduation DEX fee |
| 2 | `bonding_curve` | ✓ | — | AMM state (signs all CPIs) |
| 3 | `coin_mint` | ✓ | — | Token mint (authorities revoked) |
| 4 | `bonding_curve_token_account` | ✓ | — | Source of LP_RESERVE_TOKENS |
| 5 | `bonding_curve_wsol_account` | ✓ | — | ATA(bonding_curve, WSOL) — created here |
| 6 | `raydium_cpmm_program` | — | — | `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C` |
| 7 | `raydium_authority` | — | — | Raydium authority PDA |
| 8 | `amm_config` | — | — | Raydium AMM config (fee tier) |
| 9 | `pool_state` | ✓ | — | Raydium pool state PDA (created) |
| 10 | `lp_mint` | ✓ | — | Raydium LP mint PDA (created) |
| 11 | `creator_lp_token` | ✓ | — | ATA(bonding_curve, lp_mint) — receives then burns LP |
| 12 | `token0_mint` | — | — | Lower mint by address (coin or WSOL) |
| 13 | `token1_mint` | — | — | Higher mint by address |
| 14 | `token0_vault` | ✓ | — | Raydium token0 vault PDA |
| 15 | `token1_vault` | ✓ | — | Raydium token1 vault PDA |
| 16 | `create_pool_fee` | ✓ | — | Raydium fee destination (network-specific) |
| 17 | `observation_state` | ✓ | — | Raydium observation state PDA |
| 18 | `token_program` | — | — | SPL Token |
| 19 | `associated_token_program` | — | — | |
| 20 | `system_program` | — | — | |

**Parameters:** none

**Execution Steps (35 total):**

| Step | Action |
|---|---|
| 1–14 | Validate all accounts: mint match, Raydium program, WSOL mint, AMM config owner, PDAs, vaults, ordering, LP destination, fee account, authorities, vault |
| 15 | Transfer `graduation_dex_fee_snapshot` lamports from bonding_curve PDA to Treasury |
| 16 | Mint `LP_RESERVE_TOKENS` (200M) to bonding_curve_token_account |
| 17 | Create bonding_curve WSOL ATA (idempotent) |
| 18 | Transfer `sol_to_dex` lamports from bonding_curve PDA to WSOL ATA |
| 19 | `sync_native` — update WSOL token balance to reflect deposited lamports |
| 20 | CPI `raydium_cpmm::initialize` with bonding_curve PDA as signer |
| 21 | Post-CPI verify: pool ownership, LP mint owner, observation owner, vault balances, LP amount |
| 22 | Pre-burn LP balance check (`actual_lp > 0`) |
| 23 | Burn all LP tokens via SPL Token `burn` CPI |
| 24 | Post-burn verify: `creator_lp_token.amount == 0` |
| 25 | Emit `LiquidityLocked` |
| 26 | Pre-revocation check: `coin_mint.mint_authority == Some(bonding_curve)` |
| 27 | Revoke coin mint authority → `None` via `set_authority` CPI |
| 28 | Reload `coin_mint`; verify `mint_authority == None` |
| 29 | Emit `MintAuthorityRevoked` |
| 30 | Pre-revocation check: `coin_mint.freeze_authority == Some(bonding_curve)` |
| 31 | Revoke freeze authority → `None` via `set_authority` CPI |
| 32 | Reload `coin_mint`; verify `freeze_authority == None` |
| 33 | Post-revocation verify: `freeze_authority == None` |
| 34 | Set `bonding_curve.graduated = true`; emit `GraduationCompleted` |
| 35 | Emit `FreezeAuthorityRevoked` |

**Errors:** `GraduationNotInitiated`, `AlreadyGraduated`, `InvalidMint`, `InvalidRaydiumProgram`, `InvalidWsolMint`, `InvalidAmmConfig`, `InvalidRaydiumAuthority`, `InvalidPoolStatePda`, `InvalidLpMintPda`, `InvalidObservationStatePda`, `InvalidTokenVault`, `InvalidTokenOrdering`, `InvalidLpDestination`, `InvalidCreatePoolFeeAccount`, `InvalidMintAuthority`, `InvalidFreezeAuthority`, `InvalidBondingCurveVault`, `InvalidBondingCurveWsolAccount`, `PostCpiPoolStateInvalid`, `PostCpiLpMintInvalid`, `PostCpiObservationStateInvalid`, `PostCpiVaultBalanceMismatch`, `PostCpiLpAmountMismatch`, `ZeroLpBalance`, `PostBurnLpBalanceMismatch`, `MintAuthorityRevocationFailed`, `FreezeAuthorityRevocationFailed`  
**Emits:** `GraduationCompleted`, `LiquidityLocked`, `MintAuthorityRevoked`, `FreezeAuthorityRevoked`, `CoinGraduated`  
**CU Budget:** 1,400,000 (MUST use explicit `ComputeBudget` instruction)

---

## 8. Events Reference

All events are emitted via Anchor's `emit!()` macro and indexed in the Solana transaction logs.

| Event | Instruction | Description |
|---|---|---|
| `CoinCreated` | `create_coin` | New bonding curve launched |
| `TokensPurchased` | `buy` | Tokens bought from curve |
| `TokensSold` | `sell` | Tokens sold back to curve |
| `CreatorReferrerSet` | `set_creator_referrer` | Creator referrer relationship established |
| `CreatorFeesClaimed` | `claim_creator_fees` | Creator withdraws accumulated fees |
| `CreatorReferrerFeesClaimed` | `claim_referrer_fees` | Referrer withdraws accumulated fees |
| `GraduationInitiated` | `initiate_graduation` | Curve frozen; DEX fee snapshotted |
| `GraduationCompleted` | `complete_graduation` | Raydium pool created; curve fully graduated |
| `LiquidityLocked` | `complete_graduation` | All LP tokens burned permanently |
| `MintAuthorityRevoked` | `complete_graduation` | Coin mint authority set to None |
| `FreezeAuthorityRevoked` | `complete_graduation` | Coin freeze authority set to None |
| `CoinGraduated` | `complete_graduation` | Final graduation summary event |
| `GlobalConfigUpdated` | `update_global_config` | Admin changed a protocol parameter |
| `TreasurySweep` | `sweep_treasury` | Admin swept treasury to fee_recipient |

### Key Event Fields

**`TokensPurchased` / `TokensSold`** include: `mint`, `buyer/seller`, `sol_amount`, `sol_net`, `tokens_out/token_amount`, `treasury_fee`, `creator_fee`, `creator_referrer_fee`, `creator_referrer`, `virtual_sol_reserves`, `virtual_token_reserves`, `real_sol_reserves`, `timestamp`.

**`GraduationCompleted`** includes: `mint`, `creator`, `pool_state`, `lp_mint`, `sol_migrated`, `tokens_migrated`, `lp_minted`, `timestamp`.

---

## 9. Error Codes

### Validation Errors

| Code | Name | Condition |
|---|---|---|
| 6000 | `InvalidFeeConfiguration` | Fee exceeds hard-coded ceiling |
| 6001 | `NameTooLong` | Token name > 32 bytes |
| 6002 | `SymbolTooLong` | Token symbol > 10 bytes |
| 6003 | `UriTooLong` | Metadata URI > 200 bytes |
| 6004 | `SelfReferral` | Creator set themselves as referrer |
| 6005 | `ReferralAlreadySet` | Referrer already set (immutable) |
| 6006 | `CircularReferral` | Direct circular referral detected |
| 6007 | `ZeroAmount` | Trade amount is zero |

### Slippage Errors

| Code | Name | Condition |
|---|---|---|
| 6008 | `SlippageExceeded` | Output below `min_tokens_out` or `min_sol_out` |
| 6009 | `InsufficientOutput` | AMM output rounds to zero |

### State Errors

| Code | Name | Condition |
|---|---|---|
| 6010 | `CurveComplete` | Trading attempted on a complete/graduated curve |
| 6011 | `ProgramPaused` | Protocol is paused |
| 6012 | `GraduationThresholdNotMet` | real_sol_reserves < threshold |
| 6013 | `ProtocolVersionMismatch` | Curve's protocol_version ≠ PROTOCOL_VERSION |
| 6014 | `InsufficientSolForGraduation` | real_sol_reserves < graduation_dex_fee |
| 6015 | `GraduationSnapshotInconsistency` | sol_to_dex resolved to zero |
| 6016 | `InsufficientSolInCurve` | Sell drains more SOL than curve holds |
| 6017 | `InsufficientTokensInVault` | Buy requires more tokens than vault holds |
| 6018 | `NothingToClaim` | Zero fees available (currently unused — zero claims succeed) |

### Authorization Errors

| Code | Name | Condition |
|---|---|---|
| 6019 | `UnauthorizedAdmin` | Caller ≠ `GlobalConfig.admin` |
| 6020 | `UnauthorizedCreator` | Caller ≠ `BondingCurve.creator` |
| 6021 | `UnauthorizedReferrer` | Caller ≠ `ReferralAccount.referrer` |

### Arithmetic Errors

| Code | Name | Condition |
|---|---|---|
| 6022 | `ArithmeticOverflow` | Checked arithmetic returned None |
| 6023 | `DivisionByZero` | Degenerate curve state |

### Graduation Account Validation (P6.2)

| Code | Name | Condition |
|---|---|---|
| 6024 | `GraduationNotInitiated` | `complete == false` — call `initiate_graduation` first |
| 6025 | `InvalidMint` | coin_mint ≠ BondingCurve.mint |
| 6026 | `InvalidRaydiumProgram` | Wrong Raydium program account |
| 6027 | `InvalidWsolMint` | Not canonical WSOL mint |
| 6028 | `InvalidAmmConfig` | AMM config not owned by Raydium CPMM |
| 6029 | `InvalidRaydiumAuthority` | Raydium authority PDA mismatch |
| 6030 | `InvalidPoolStatePda` | Pool state PDA mismatch |
| 6031 | `InvalidLpMintPda` | LP mint PDA mismatch |
| 6032 | `InvalidObservationStatePda` | Observation state PDA mismatch |
| 6033 | `InvalidTokenVault` | Vault is not expected ATA |
| 6034 | `InvalidTokenOrdering` | token0_mint ≥ token1_mint |
| 6035 | `InvalidLpDestination` | LP destination is not expected ATA |
| 6036 | `InvalidCreatePoolFeeAccount` | Fee account ≠ known Raydium fee address |
| 6037 | `InvalidMintAuthority` | coin_mint.mint_authority ≠ bonding_curve |
| 6038 | `InvalidFreezeAuthority` | coin_mint.freeze_authority ≠ bonding_curve |
| 6039 | `InvalidBondingCurveVault` | Bonding curve vault is not expected ATA |

### Graduation Execution (P6.3–P6.6)

| Code | Name | Condition |
|---|---|---|
| 6040 | `AlreadyGraduated` | `graduated == true` — cannot call twice |
| 6041 | `InvalidBondingCurveWsolAccount` | WSOL ATA mismatch |
| 6042 | `PostCpiPoolStateInvalid` | Post-CPI: pool state not owned by Raydium |
| 6043 | `PostCpiLpMintInvalid` | Post-CPI: LP mint not owned by Token program |
| 6044 | `PostCpiObservationStateInvalid` | Post-CPI: observation state not owned by Raydium |
| 6045 | `PostCpiVaultBalanceMismatch` | Post-CPI: vault balance ≠ expected |
| 6046 | `PostCpiLpAmountMismatch` | Post-CPI: LP minted ≠ floor(sqrt(a×b)) − 100 |
| 6047 | `ZeroLpBalance` | LP balance is 0 before burn (edge case: sqrt = 100) |
| 6048 | `PostBurnLpBalanceMismatch` | LP balance > 0 after burn |
| 6049 | `MintAuthorityRevocationFailed` | Mint authority ≠ None after revoke |
| 6050 | `FreezeAuthorityRevocationFailed` | Freeze authority ≠ None after revoke |

---

## 10. Graduation Flow

The graduation process is split into two permissionless instructions to keep each transaction within Solana's account size and compute limits.

### Phase 1: `initiate_graduation`

**Trigger:** Any wallet calls this once `real_sol_reserves ≥ 85 SOL`.

**Actions:**
1. Validate eligibility (5 checks — all atomic)
2. Set `BondingCurve.complete = true` → trading permanently halted
3. Snapshot `BondingCurve.graduation_dex_fee_snapshot` from current `GlobalConfig.graduation_dex_fee`
4. Compute `sol_to_dex_snapshot = real_sol_reserves − graduation_dex_fee_snapshot`
5. Emit `GraduationInitiated`

**Result:** Curve is in GRADUATING state. No SOL or tokens moved.

### Phase 2: `complete_graduation`

**Trigger:** Any wallet calls this after Phase 1.

**Actions (abbreviated):**
1. Steps 1–14: Validate all 20 accounts
2. Step 15: Transfer DEX fee (6 SOL) to Treasury
3. Step 16: Mint 200M LP reserve tokens to curve vault
4. Steps 17–19: Wrap SOL into WSOL token account
5. Step 20: CPI Raydium CPMM `initialize` — creates pool, deposits both tokens, mints LP tokens
6. Step 21: Verify post-CPI state (pool, LP mint, observation, vault balances, LP amount)
7. Steps 22–24: Burn all LP tokens permanently
8. Steps 25–28: Revoke coin mint authority → `None`
9. Steps 29–33: Revoke freeze authority → `None`
10. Step 34: Set `graduated = true`, emit `GraduationCompleted`

**Result:** Curve is in GRADUATED state. Raydium pool is live. Liquidity is permanently locked. Token supply is fixed forever.

### Accounting at 85 SOL (canonical graduation)

```
Input:
  real_sol_reserves       = 85,000,000,000 lamports
  LP_RESERVE_TOKENS       = 200,000,000,000,000 raw units

Output:
  → Treasury              =  6,000,000,000 lamports (DEX fee)
  → Raydium pool (SOL)    = 79,000,000,000 lamports
  → Raydium pool (tokens) = 200,000,000,000,000 raw units
  → LP minted             = floor(sqrt(79e9 × 200e12)) − 100
  → LP burned             = all LP minted (permanent lock)
  → Coin mint authority   = None (irrevocable)
  → Coin freeze authority = None (irrevocable)
```

---

## 11. Security Assumptions

### Trust Model

| Actor | Trust Level | What They Can Do |
|---|---|---|
| Protocol Admin | High — trusted | Update fees, pause/unpause, sweep treasury |
| Coin Creator | Low — untrusted | Create coins, claim their own fees |
| Trader | Untrusted | Buy and sell on existing curves |
| Referrer | Untrusted | Set as referrer; claim accumulated fees |
| Graduation Caller | Untrusted (permissionless) | Trigger graduation — no privileged action |

### Key Invariants

1. **k monotonicity** — k cannot increase after any trade: `k_after ≤ k_before` (floor division).
2. **Creator fees are isolated** — `creator_fees_accumulated` is a separate field; it does not affect AMM reserves.
3. **LP is permanently burned** — `LiquidityLocked` event signals that zero LP tokens remain with any party.
4. **Mint authority is irrevocable** — after graduation, no new tokens can ever be minted.
5. **Freeze authority is irrevocable** — after graduation, no token account can ever be frozen.
6. **DEX fee snapshot is immutable** — `graduation_dex_fee_snapshot` is set once at `initiate_graduation` and never updated.
7. **Referrer relationship is write-once** — creator referrer cannot be changed or removed after being set.
8. **Protocol version guard** — only curves with `protocol_version == PROTOCOL_VERSION` can graduate.
9. **Fee split completeness** — `treasury + creator + referrer == total_fee` for every trade; no lamport is unallocated.
10. **State monotonicity** — `complete` and `graduated` are never reset to `false`.

### Known Limitations

- `complete_graduation` requires a **live Raydium CPMM deployment** on the target network. It cannot be executed on devnet without a working Raydium CPMM instance.
- The Raydium `initialize` CPI is **opaque** — its internal state transitions are not verified beyond the post-CPI checks in steps 21–24.
- The program has **no admin key rotation** mechanism. If the admin keypair is lost, treasury cannot be swept.

---

## 12. Upgrade Policy

### Protocol Freeze

As of v1.0.0-rc1, the **on-chain program is frozen for protocol changes**. The following are prohibited without a new program deployment and version bump:

- Changing bonding curve economics (VS₀, VT₀, k)
- Modifying fee split ratios (40/40/20)
- Changing PDA seed derivations
- Changing account layouts in incompatible ways
- Modifying the graduation flow

### Non-Breaking Changes Allowed via `update_global_config`

Admin can adjust the following without a program upgrade:
- `total_trading_fee_bps` (within 0–500 bps)
- `creation_fee_lamports` (within 0–1 SOL)
- `graduation_threshold`
- `graduation_dex_fee`
- `fee_recipient`

### Program Upgrades

The program is deployed with an **upgrade authority** (`BHpwVr6eimhzRoYr9q4y3BvWhnkq6WaNuBwQgR97oS5t`). Before mainnet launch, the upgrade authority should be transferred to a **multisig** or burned, depending on the protocol's immutability requirements.

### PROTOCOL_VERSION Guard

The `PROTOCOL_VERSION` constant (currently `2`) is stamped into every `BondingCurve` at creation time. The `initiate_graduation` instruction rejects curves whose `protocol_version` field does not match the current constant. This prevents graduating curves created by an older program version that may have different accounting assumptions.

---

## 13. Mainnet Deployment Checklist

### Pre-Deployment

- [ ] Build binary with `--features mainnet`:  
  `cargo build-sbf --features mainnet`
- [ ] Verify `RAYDIUM_CREATE_POOL_FEE_STR` = `DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8`
- [ ] Verify program ID in `declare_id!()` matches target keypair
- [ ] Verify Raydium CPMM program ID = `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C`
- [ ] Confirm mainnet AMM config address with Raydium documentation
- [ ] Confirm upgrade authority wallet is funded and secured

### Deployment

- [ ] Deploy program binary:  
  `anchor deploy --provider.cluster mainnet-beta`
- [ ] Record deployed program ID and transaction signature
- [ ] Call `initialize` to create GlobalConfig and Treasury:  
  `anchor run initialize`
- [ ] Verify GlobalConfig PDA exists with correct parameters
- [ ] Verify Treasury PDA exists

### Post-Deployment Verification

- [ ] Call `create_coin` with a test token — verify event emitted
- [ ] Call `buy` — verify reserves updated, fees distributed
- [ ] Call `sell` — verify SOL returned, reserves updated
- [ ] Call `claim_creator_fees` — verify lamport transfer
- [ ] Call `sweep_treasury` — verify fee_recipient receives SOL
- [ ] Verify `pause_protocol` halts trades; `unpause_protocol` restores them

### Security Hardening

- [ ] Transfer upgrade authority to multisig or burn it (for full immutability)
- [ ] Set `fee_recipient` to a cold multisig wallet
- [ ] Document emergency pause procedure for on-call operators
- [ ] Set up off-chain monitoring for `GraduationInitiated` events to trigger `complete_graduation` within one block finality window

### Raydium Integration

- [ ] Verify Raydium CPMM is live on mainnet
- [ ] Confirm correct `amm_config` address for target fee tier
- [ ] Test `complete_graduation` on mainnet with a low-liquidity test coin before production use
- [ ] Verify LP tokens are burned (balance = 0) after graduation

---

*End of Fun.Run V2 Protocol Reference — v1.0.0-rc1*
