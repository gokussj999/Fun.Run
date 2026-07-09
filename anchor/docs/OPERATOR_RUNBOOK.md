# Fun.Run V2 — Operator Runbook

**Version:** v1.0.0-rc1  
**Program ID (Devnet):** `HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP`  
**Audience:** Protocol operators, on-call engineers, deployment team  
**Date:** 2026-07-03  

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Initial Deployment (Mainnet)](#2-initial-deployment-mainnet)
3. [Program Upgrade Procedure](#3-program-upgrade-procedure)
4. [Emergency Pause](#4-emergency-pause)
5. [Treasury Operations](#5-treasury-operations)
6. [Graduation Operations](#6-graduation-operations)
7. [Fee Configuration](#7-fee-configuration)
8. [Monitoring & Alerts](#8-monitoring--alerts)
9. [Recovery Procedures](#9-recovery-procedures)
10. [Verification Commands](#10-verification-commands)

---

## 1. Prerequisites

### 1.1 Required Tools

```bash
# Solana CLI (v1.18+)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
solana --version

# Anchor CLI (v0.31.1 — must match program version)
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.31.1
avm use 0.31.1
anchor --version

# Rust + SBF toolchain
rustup update stable
cargo install cargo-build-sbf
```

### 1.2 Required Wallets

| Role | Description | Security Requirement |
|---|---|---|
| Deploy keypair | Pays for initial deployment + rent | Hardware wallet recommended |
| Admin keypair | Controls GlobalConfig (fees, pause, sweep) | Hardware wallet — COLD STORAGE |
| Upgrade authority | Can deploy new program binaries | Hardware wallet — COLD STORAGE |
| Fee recipient | Receives treasury sweeps | Multisig recommended |

### 1.3 Environment Variables

```bash
# Set Solana cluster
solana config set --url mainnet-beta
# OR for devnet:
solana config set --url devnet

# Set keypair
solana config set --keypair /path/to/deploy-keypair.json

# Verify config
solana config get
```

### 1.4 Network-Specific Addresses

| Item | Mainnet | Devnet |
|---|---|---|
| Raydium CPMM Program | `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C` | same |
| Raydium Pool Fee Account | `DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8` | `G11FVVnoEUBE4JKpFWXMiQ2Yn1g4pVu4c17dTFJDg6dN` |
| Raydium AMM Config | `D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2` | verify with Raydium docs |
| WSOL Mint | `So11111111111111111111111111111111111111112` | same |

---

## 2. Initial Deployment (Mainnet)

> **One-time procedure.** Once complete, the program is live and the protocol is active.

### Step 1 — Build the Mainnet Binary

```bash
cd anchor

# IMPORTANT: always build with --features mainnet for mainnet deployment
cargo build-sbf --features mainnet

# Verify the binary exists
ls -lh target/deploy/funrun_v2.so
# Expected size: ~614,896 bytes
```

### Step 2 — Verify Build Constants

Before deploying, confirm the binary was built with correct mainnet constants:

```bash
# Check that mainnet pool fee address is embedded
strings target/deploy/funrun_v2.so | grep "DNXgeM9E"
# Should print: DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8

# Verify Raydium CPMM program ID
strings target/deploy/funrun_v2.so | grep "CPMMoo8L"
# Should print: CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C
```

### Step 3 — Fund Deploy Wallet

```bash
# Check balance (need ~10 SOL for deployment + rent)
solana balance

# Minimum required:
# ~5 SOL for program account rent (614KB binary)
# ~0.5 SOL for GlobalConfig + Treasury PDAs
# ~1 SOL buffer for transaction fees
```

### Step 4 — Deploy the Program

```bash
# Generate a program keypair (or use existing)
solana-keygen new --outfile target/deploy/funrun_v2-keypair.json

# Get the program ID from keypair
solana-keygen pubkey target/deploy/funrun_v2-keypair.json

# Deploy
solana program deploy \
  --program-id target/deploy/funrun_v2-keypair.json \
  target/deploy/funrun_v2.so \
  --upgrade-authority /path/to/upgrade-authority-keypair.json

# Record the deployment signature
# Save: program ID, deployment tx signature, slot number
```

### Step 5 — Verify Deployment

```bash
# Confirm program exists and is executable
solana program show <PROGRAM_ID>

# Expected output:
# Program Id: <PROGRAM_ID>
# Owner: BPFLoaderUpgradeab1e11111111111111111111111
# ProgramData Address: <programdata_address>
# Authority: <upgrade_authority>
# Last Deployed In Slot: <slot>
# Data Length: 614896 (0x96030) bytes
# Balance: <lamports> SOL
```

### Step 6 — Initialize Protocol

```bash
# Using Anchor CLI
anchor run initialize --provider.cluster mainnet-beta

# OR using a custom script
# This calls the `initialize` instruction with the admin keypair as signer
# Creates: GlobalConfig PDA + Treasury PDA
```

### Step 7 — Verify Initialization

```bash
# Derive GlobalConfig PDA
# Seeds: ["global_config"], program: <PROGRAM_ID>
GLOBAL_CONFIG_PDA=$(solana find-program-derived-address \
  <PROGRAM_ID> \
  --seeds "global_config")

# Fetch and display GlobalConfig account
solana account $GLOBAL_CONFIG_PDA

# Derive Treasury PDA
# Seeds: ["treasury"], program: <PROGRAM_ID>
TREASURY_PDA=$(solana find-program-derived-address \
  <PROGRAM_ID> \
  --seeds "treasury")

solana account $TREASURY_PDA
```

### Step 8 — Post-Deployment Security Hardening

```bash
# Option A: Transfer upgrade authority to multisig
solana program set-upgrade-authority <PROGRAM_ID> \
  --new-upgrade-authority <MULTISIG_ADDRESS>

# Option B: Burn upgrade authority (IRREVERSIBLE — makes program immutable)
solana program set-upgrade-authority <PROGRAM_ID> \
  --final

# Verify upgrade authority after transfer
solana program show <PROGRAM_ID>
```

> **Warning:** Burning the upgrade authority is **irreversible**. The program can never be upgraded after this. Only do this when the protocol is fully stable and audited.

---

## 3. Program Upgrade Procedure

> **Use only if a critical bug is discovered. Requires upgrade authority.**

### Pre-Upgrade Checklist

- [ ] Bug is confirmed and root cause identified
- [ ] Fix is developed and reviewed
- [ ] New binary is tested on devnet
- [ ] Upgrade authority keypair is available and funded
- [ ] Pause the protocol before upgrading (recommended)

### Step 1 — Pause Protocol (Recommended)

```bash
# Pause trading before upgrade to prevent state inconsistency
anchor run pause-protocol --provider.cluster mainnet-beta
# OR via custom script calling pause_protocol instruction

# Verify paused
solana account <GLOBAL_CONFIG_PDA>
# Check: paused = true
```

### Step 2 — Build New Binary

```bash
cd anchor
cargo build-sbf --features mainnet

# If PROTOCOL_VERSION needs bumping (breaking change):
# Edit src/consts.rs: pub const PROTOCOL_VERSION: u8 = 3;
# This prevents graduation of old-version curves by new binary
```

### Step 3 — Deploy Upgrade

```bash
solana program deploy \
  --program-id <PROGRAM_ID> \
  target/deploy/funrun_v2.so \
  --upgrade-authority /path/to/upgrade-authority-keypair.json

# Record: upgrade tx signature, slot, new binary hash
```

### Step 4 — Verify Upgrade

```bash
# Confirm new binary is deployed
solana program show <PROGRAM_ID>
# Check: Last Deployed In Slot has changed

# Run smoke tests
anchor run smoke-test --provider.cluster mainnet-beta
```

### Step 5 — Unpause Protocol

```bash
anchor run unpause-protocol --provider.cluster mainnet-beta

# Verify unpaused
solana account <GLOBAL_CONFIG_PDA>
# Check: paused = false
```

---

## 4. Emergency Pause

> **Use when a critical vulnerability is discovered or an attack is ongoing.**

### Immediate Response (< 2 minutes)

```bash
# STEP 1: Pause the protocol immediately
# Admin keypair must be available

solana program invoke \
  --program-id <PROGRAM_ID> \
  --data "pause_protocol" \
  --signer /path/to/admin-keypair.json

# OR via Anchor:
anchor run pause-protocol --provider.cluster mainnet-beta \
  --provider.wallet /path/to/admin-keypair.json
```

### Verify Pause is Active

```bash
# Fetch GlobalConfig and check paused = true
solana account <GLOBAL_CONFIG_PDA> --output json | jq '.data'

# Test that a buy transaction fails with ProgramPaused
# (expected: transaction fails with error 6011)
```

### While Paused — What Still Works

| Instruction | Status During Pause |
|---|---|
| `buy` | BLOCKED — `ProgramPaused` error |
| `sell` | BLOCKED — `ProgramPaused` error |
| `create_coin` | BLOCKED — `ProgramPaused` error |
| `initiate_graduation` | BLOCKED — `ProgramPaused` error |
| `complete_graduation` | BLOCKED — `ProgramPaused` error |
| `claim_creator_fees` | **ALLOWED** — pause exempt |
| `claim_referrer_fees` | **ALLOWED** — pause exempt |
| `update_global_config` | **ALLOWED** — admin only |
| `sweep_treasury` | **ALLOWED** — admin only |

### Resume After Incident is Resolved

```bash
# Only unpause after the vulnerability is fixed and patch is deployed
anchor run unpause-protocol --provider.cluster mainnet-beta \
  --provider.wallet /path/to/admin-keypair.json

# Verify
solana account <GLOBAL_CONFIG_PDA> --output json | jq '.data'
# Check: paused = false
```

---

## 5. Treasury Operations

### 5.1 Check Treasury Balance

```bash
# Get Treasury PDA balance
TREASURY_PDA=<treasury_pda_address>

solana balance $TREASURY_PDA

# For a detailed breakdown including rent:
solana account $TREASURY_PDA --output json
```

### 5.2 Sweep Treasury

```bash
# Sweep all accumulated SOL (above rent-exempt minimum) to fee_recipient
# Only admin can call this

anchor run sweep-treasury --provider.cluster mainnet-beta \
  --provider.wallet /path/to/admin-keypair.json

# Expected event emitted: TreasurySweep { amount, recipient, admin, treasury_balance_after }
```

### 5.3 Change Fee Recipient

```bash
# Update fee_recipient to a new address
# Only admin can call this

anchor run update-global-config \
  --provider.cluster mainnet-beta \
  --provider.wallet /path/to/admin-keypair.json \
  --new-fee-recipient <NEW_FEE_RECIPIENT_ADDRESS>
```

### 5.4 Treasury Accumulation Sources

| Source | Amount | Frequency |
|---|---|---|
| Coin creation fee | 0.02 SOL default (configurable) | Every `create_coin` |
| Trading fee — treasury share | 40% or 60% of total_fee | Every `buy` / `sell` |
| Graduation DEX fee | 6 SOL default (configurable) | Every `complete_graduation` |

---

## 6. Graduation Operations

### 6.1 Monitor for Graduation-Eligible Curves

Watch for `GraduationInitiated` events in Solana transaction logs. An off-chain indexer should:

1. Subscribe to program logs
2. Parse `GraduationInitiated` events
3. Automatically trigger `complete_graduation` within the same or next block

```bash
# Subscribe to program logs
solana logs <PROGRAM_ID>

# Watch for: "GraduationInitiated" in output
```

### 6.2 Initiate Graduation (if not auto-triggered)

```bash
# Any wallet can call this — permissionless
# Required: bonding_curve.real_sol_reserves >= graduation_threshold

anchor run initiate-graduation \
  --provider.cluster mainnet-beta \
  --mint <COIN_MINT_ADDRESS>

# Expected event: GraduationInitiated { mint, creator, real_sol_at_initiation, sol_to_dex_snapshot, ... }
```

### 6.3 Complete Graduation

```bash
# Any wallet can call this — permissionless
# Required: bonding_curve.complete == true (set by initiate_graduation)
# IMPORTANT: Requires explicit compute budget (1,400,000 CU)

anchor run complete-graduation \
  --provider.cluster mainnet-beta \
  --mint <COIN_MINT_ADDRESS> \
  --amm-config D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2 \
  --compute-unit-limit 1400000

# Expected events:
#   GraduationCompleted { mint, creator, pool_state, lp_mint, sol_migrated, tokens_migrated, lp_minted }
#   LiquidityLocked { mint, lp_mint, lp_burned }
#   MintAuthorityRevoked { mint }
#   FreezeAuthorityRevoked { mint }
#   CoinGraduated { mint, creator, ... }
```

### 6.4 Verify Graduation Success

```bash
# Check BondingCurve graduated flag
solana account <BONDING_CURVE_PDA> --output json
# Check: graduated = true, complete = true

# Check coin mint authorities are revoked
spl-token display <COIN_MINT_ADDRESS>
# Check: Mint authority: (not set)
# Check: Freeze authority: (not set)

# Check LP token account balance is zero
spl-token balance <CREATOR_LP_TOKEN_ATA>
# Expected: 0

# Verify Raydium pool exists
solana account <POOL_STATE_PDA>
# Should be owned by Raydium CPMM program
```

### 6.5 Compute Budget for complete_graduation

`complete_graduation` **must** be sent with an explicit compute budget. Without it, the transaction fails with `ComputationalBudgetExceeded` before the Raydium CPI completes.

```typescript
// TypeScript client example
import { ComputeBudgetProgram } from "@solana/web3.js";

const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
  units: 1_400_000,  // COMPLETE_GRADUATION_CU
});

// Prepend to transaction before complete_graduation instruction
const tx = new Transaction()
  .add(computeBudgetIx)
  .add(completeGraduationIx);
```

---

## 7. Fee Configuration

### 7.1 View Current Fee Configuration

```bash
# Fetch GlobalConfig account and decode
solana account <GLOBAL_CONFIG_PDA> --output json

# Fields to check:
# - creation_fee_lamports (default: 20_000_000 = 0.02 SOL)
# - total_trading_fee_bps (default: 150 = 1.5%)
# - graduation_threshold (default: 85_000_000_000 = 85 SOL)
# - graduation_dex_fee (default: 6_000_000_000 = 6 SOL)
```

### 7.2 Update Trading Fee

```bash
# Example: change trading fee to 100 bps (1.0%)
# Hard ceiling: 500 bps (5.0%) — enforced on-chain

anchor run update-global-config \
  --provider.cluster mainnet-beta \
  --provider.wallet /path/to/admin-keypair.json \
  --new-trading-fee-bps 100

# Expected event: GlobalConfigUpdated { admin, field_changed: "total_trading_fee_bps" }
```

### 7.3 Update Creation Fee

```bash
# Example: change creation fee to 0.05 SOL
# Hard ceiling: 1 SOL = 1_000_000_000 lamports — enforced on-chain

anchor run update-global-config \
  --provider.cluster mainnet-beta \
  --provider.wallet /path/to/admin-keypair.json \
  --new-creation-fee 50000000
```

### 7.4 Fee Ceiling Reference (Hard-Coded — Cannot Be Exceeded)

| Parameter | Hard Ceiling |
|---|---|
| `total_trading_fee_bps` | 500 (5.0%) |
| `creation_fee_lamports` | 1,000,000,000 (1 SOL) |

These ceilings are enforced by the on-chain program and cannot be overridden by admin instructions.

---

## 8. Monitoring & Alerts

### 8.1 Key Events to Monitor

| Event | Alert Priority | Action |
|---|---|---|
| `GraduationInitiated` | High | Trigger `complete_graduation` within next block |
| `TreasurySweep` | Medium | Log for accounting |
| `GlobalConfigUpdated` | High | Verify expected change; alert if unexpected |
| Any instruction from unknown admin | Critical | Investigate immediately; may indicate key compromise |

### 8.2 Metrics to Track

| Metric | How to Compute | Alert Threshold |
|---|---|---|
| Treasury balance | `solana balance <TREASURY_PDA>` | > 50 SOL → sweep |
| Active curves count | Count BondingCurve accounts where `complete = false` | — |
| Graduated coins | Count BondingCurve accounts where `graduated = true` | — |
| Curves at graduation threshold | Monitor `real_sol_reserves` approaching 85 SOL | — |
| Failed graduation transactions | Watch tx logs for `PostCpiPoolStateInvalid` etc. | Any → investigate |

### 8.3 Program Log Monitoring

```bash
# Stream all program logs
solana logs <PROGRAM_ID> --commitment confirmed

# Filter for specific events (pipe through grep)
solana logs <PROGRAM_ID> | grep "GraduationInitiated"
solana logs <PROGRAM_ID> | grep "Error"
```

### 8.4 Recommended Monitoring Stack

1. **Helius / QuickNode webhooks** — subscribe to program transactions
2. **Custom indexer** — parse `TokensPurchased`, `TokensSold`, `CoinCreated` events into a database
3. **PagerDuty alert** — on `GraduationInitiated` event (time-sensitive: `complete_graduation` should follow quickly)
4. **Grafana dashboard** — treasury balance, daily volume, graduation count

---

## 9. Recovery Procedures

### 9.1 Incomplete Graduation Recovery

**Scenario:** `initiate_graduation` succeeded but `complete_graduation` failed.

**State:** `BondingCurve.complete = true`, `graduated = false`. Trading is permanently halted on this curve.

**Recovery:**
```bash
# Retry complete_graduation — it is idempotent for this state
# The bonding curve state is unchanged; retry with correct accounts

anchor run complete-graduation \
  --provider.cluster mainnet-beta \
  --mint <COIN_MINT_ADDRESS> \
  --amm-config D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2 \
  --compute-unit-limit 1400000

# Common failure reasons:
# - Wrong amm_config address → use correct Raydium mainnet config
# - Wrong token ordering (token0 >= token1) → swap token0/token1 in client
# - Insufficient compute budget → set to 1,400,000 exactly
# - Raydium pool already exists (collision) → check if pool state PDA already occupied
```

### 9.2 Wrong fee_recipient

**Scenario:** `fee_recipient` was set to a wrong address.

**Recovery:**
```bash
# Admin updates fee_recipient before next sweep
anchor run update-global-config \
  --provider.cluster mainnet-beta \
  --provider.wallet /path/to/admin-keypair.json \
  --new-fee-recipient <CORRECT_ADDRESS>

# Note: SOL already swept to the wrong address cannot be recovered on-chain
```

### 9.3 Admin Key Lost

**Scenario:** Admin keypair is lost or destroyed.

**Impact:**
- Cannot update fees
- Cannot pause protocol
- Cannot sweep treasury

**Recovery:** None on-chain. The program must be upgraded (if upgrade authority is available) to a new binary with a different admin address, or the protocol must operate without admin functions.

**Prevention:** Keep admin keypair in cold storage with at least two secure backups.

### 9.4 Upgrade Authority Key Lost

**Scenario:** Upgrade authority keypair is lost.

**Impact:** Program cannot be upgraded. This is equivalent to the program being immutable.

**Recovery:** None. The program continues operating but cannot receive bug fixes.

**Prevention:** Keep upgrade authority keypair in cold storage with at least two secure backups. Consider multisig before storing.

### 9.5 Protocol in Permanent Pause State

**Scenario:** Admin keypair is lost while protocol is paused.

**Impact:** `buy`, `sell`, `create_coin` are permanently halted. `claim_creator_fees` and `claim_referrer_fees` still work (pause-exempt).

**Recovery:** Deploy a program upgrade (if upgrade authority available) that resets the paused flag or removes the pause check.

---

## 10. Verification Commands

### 10.1 Verify Program is Live

```bash
solana program show <PROGRAM_ID>
```

### 10.2 Verify GlobalConfig

```bash
# Fetch and display GlobalConfig PDA
solana account <GLOBAL_CONFIG_PDA>

# Expected fields:
# admin: <admin_pubkey>
# fee_recipient: <fee_recipient_pubkey>
# creation_fee_lamports: 20000000
# total_trading_fee_bps: 150
# graduation_threshold: 85000000000
# graduation_dex_fee: 6000000000
# paused: false
```

### 10.3 Verify a BondingCurve State

```bash
# BondingCurve PDA = ["bonding_curve", mint_pubkey]
BONDING_CURVE_PDA=<derived_address>

solana account $BONDING_CURVE_PDA --output json
# Check: complete, graduated, real_sol_reserves, creator_fees_accumulated
```

### 10.4 Verify Treasury Balance

```bash
solana balance <TREASURY_PDA>
```

### 10.5 Verify Coin Mint Authorities (Post-Graduation)

```bash
spl-token display <COIN_MINT_ADDRESS>
# Post-graduation expected:
#   Mint authority: (not set)
#   Freeze authority: (not set)
```

### 10.6 Verify LP Tokens Are Burned

```bash
# Creator LP token ATA (owned by bonding_curve PDA)
CREATOR_LP_TOKEN_ATA=<ata_address>

spl-token balance $CREATOR_LP_TOKEN_ATA
# Expected: 0
```

### 10.7 Quick Health Check Script

```bash
#!/usr/bin/env bash
# fun-run-health-check.sh
set -e

PROGRAM_ID="HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP"
GLOBAL_CONFIG_PDA="<GLOBAL_CONFIG_PDA>"
TREASURY_PDA="<TREASURY_PDA>"

echo "=== Fun.Run V2 Health Check ==="

echo -n "Program live: "
solana program show $PROGRAM_ID --output json | jq -r '.programId' && echo "OK"

echo -n "GlobalConfig exists: "
solana account $GLOBAL_CONFIG_PDA > /dev/null 2>&1 && echo "OK" || echo "FAIL"

echo -n "Treasury exists: "
solana account $TREASURY_PDA > /dev/null 2>&1 && echo "OK" || echo "FAIL"

echo -n "Treasury balance: "
solana balance $TREASURY_PDA

echo "=== Health Check Complete ==="
```

---

## Appendix: Compute Unit Reference

| Instruction | CU Budget | Needs Explicit Budget? |
|---|---|---|
| `initialize` | 20,000 | No |
| `update_global_config` | 8,000 | No |
| `pause_protocol` | 5,000 | No |
| `unpause_protocol` | 5,000 | No |
| `sweep_treasury` | 20,000 | No |
| `set_creator_referrer` | 60,000 | No |
| `create_coin` | 200,000 | **Yes** |
| `buy` | 80,000 | No |
| `sell` | 80,000 | No |
| `claim_creator_fees` | 20,000 | No |
| `claim_referrer_fees` | 20,000 | No |
| `initiate_graduation` | 15,000 | No |
| `complete_graduation` | **1,400,000** | **Yes — critical** |

---

*End of Fun.Run V2 Operator Runbook — v1.0.0-rc1*
