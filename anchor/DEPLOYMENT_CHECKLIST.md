# FUN.RUN V2 — Deployment Checklist

Program ID: `HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP`

---

## Devnet Deployment

### Pre-build

- [ ] Confirm `[net] offline = false` is set (or removed) in `.cargo/config.toml` if you need to download new crates
- [ ] Verify Raydium devnet constants (see `src/consts.rs` and `src/deploy_config.rs`):
  - `RAYDIUM_CREATE_POOL_FEE_STR` (devnet) = `G11FVVnoEUBE4JKpFWXMiQ2Yn1g4pVu4c17dTFJDg6dN` — **confirm against live Raydium devnet deployment**
  - `RAYDIUM_CPMM_PROGRAM_ID_STR` = `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C` — confirm same on devnet
  - AMM config address — callers must supply; use Raydium's devnet AMM config (check Raydium docs)
- [ ] Run full test suite to verify zero regressions:
  ```sh
  cargo test
  cargo fmt --check
  cargo clippy -- -D warnings
  ```

### Build

- [ ] Build devnet program binary:
  ```sh
  cargo build-sbf --features devnet
  ```
- [ ] Record the binary hash for audit trail:
  ```sh
  sha256sum target/deploy/funrun_v2.so
  ```

### Deploy

- [ ] Set Solana CLI to devnet:
  ```sh
  solana config set --url https://api.devnet.solana.com
  ```
- [ ] Confirm deployer wallet has sufficient SOL (≥ 5 SOL for deployment rent):
  ```sh
  solana balance
  ```
- [ ] Deploy program:
  ```sh
  anchor deploy --provider.cluster devnet
  ```
  OR (if using raw `solana program deploy`):
  ```sh
  solana program deploy target/deploy/funrun_v2.so
  ```
- [ ] Verify the deployed program ID matches `HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP`

### Initialize Protocol

- [ ] Call `initialize` with the intended admin keypair:
  ```sh
  anchor run initialize --provider.cluster devnet
  ```
- [ ] Verify GlobalConfig PDA exists at expected address:
  ```sh
  solana account $(solana find-program-derived-address HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP global_config)
  ```
- [ ] Verify Treasury PDA exists
- [ ] Confirm `GlobalConfig.admin == <admin_pubkey>`
- [ ] Confirm `GlobalConfig.paused == false`
- [ ] Confirm default fees: `creation_fee = 20_000_000`, `trading_fee_bps = 150`

### Functional Smoke Tests (Devnet)

- [ ] Create a test coin (`create_coin`)
- [ ] Buy tokens with 0.1 SOL (`buy`)
- [ ] Sell half the tokens back (`sell`)
- [ ] Claim creator fees (`claim_creator_fees`)
- [ ] Verify fee splits match 40/40/20 model
- [ ] Attempt `initiate_graduation` without reaching threshold — must fail with `GraduationThresholdNotMet`

### Integration Test Suite (Devnet)

- [ ] Add dev-dependencies to `Cargo.toml` (requires internet):
  ```toml
  [dev-dependencies]
  solana-program-test = "~2.3"
  tokio = { version = "1", features = ["macros", "rt-multi-thread"] }
  ```
- [ ] Fetch dependencies:
  ```sh
  # Temporarily set offline = false in .cargo/config.toml
  cargo fetch
  ```
- [ ] Run integration tests:
  ```sh
  cargo test --features integration-tests
  ```
- [ ] All 13 integration test cases must pass

### Graduation Flow (Devnet)

- [ ] Verify Raydium CPMM is live on devnet at `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C`
- [ ] Verify devnet AMM config account exists and is owned by Raydium CPMM program
- [ ] Buy enough tokens to push `real_sol_reserves >= 85 SOL` (graduation threshold)
- [ ] Call `initiate_graduation` — must succeed, set `bonding_curve.complete = true`
- [ ] Prepare `complete_graduation` transaction:
  - **MUST** include `ComputeBudgetInstruction::set_compute_unit_limit(1_400_000)`
  - Supply all 25 Raydium CPMM accounts in correct order and positions
  - Use devnet `amm_config` and `create_pool_fee` addresses
- [ ] Call `complete_graduation` — must succeed
- [ ] Verify post-graduation state:
  - `bonding_curve.graduated == true`
  - `coin_mint.mint_authority == None`
  - `coin_mint.freeze_authority == None`
  - Raydium pool created and live
  - LP token account balance == 0 (burned)
- [ ] Attempt buy on graduated curve — must fail with `CurveComplete`

---

## Mainnet Deployment

### Security Pre-checks

- [ ] **Rotate admin to a multisig wallet** (Squads v4 or equivalent) BEFORE deployment
  - Single-key admin is acceptable for devnet only
  - On mainnet a compromised admin key can redirect Treasury sweeps and pause trading
- [ ] Set `fee_recipient` to the multisig Treasury address (not a hot wallet)
- [ ] Final audit sign-off: confirm P6.7 audit findings are addressed (all Medium+ resolved)
- [ ] Review `deploy_config.rs` CU estimates — run devnet measurements and update if actual CU differs by > 20%

### Pre-build

- [ ] All devnet smoke tests and integration tests pass
- [ ] `graduation_dex_fee < graduation_threshold` invariant verified (default: 6 SOL < 85 SOL ✓)
- [ ] `admin != Pubkey::default()` — never use zero key as admin
- [ ] Verify Raydium mainnet `create_pool_fee` = `DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8`
- [ ] Verify Raydium mainnet AMM config = `D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2`

### Build

- [ ] Build mainnet binary:
  ```sh
  cargo build-sbf --features mainnet
  ```
  (Or omit `--features mainnet` since mainnet is the default.)
- [ ] Record SHA-256 of `target/deploy/funrun_v2.so` — share with auditor for binary verification
- [ ] Confirm program ID in the binary matches `HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP`:
  ```sh
  solana-keygen pubkey target/deploy/funrun_v2-keypair.json
  ```

### Deploy (via Upgrade Authority / Multisig)

- [ ] Set Solana CLI to mainnet-beta:
  ```sh
  solana config set --url https://api.mainnet-beta.solana.com
  ```
- [ ] Confirm upgrade authority is the multisig (not a hot wallet)
- [ ] Deploy through multisig upgrade authority:
  ```sh
  solana program deploy \
    --upgrade-authority <MULTISIG_ADDRESS> \
    target/deploy/funrun_v2.so
  ```
- [ ] Get program data account and confirm owner = BPFLoaderUpgradeable

### Initialize Protocol (Mainnet)

- [ ] Call `initialize` with the **multisig** as admin (not a hot wallet)
- [ ] Verify GlobalConfig and Treasury PDAs
- [ ] Immediately call `update_global_config` to set:
  - `fee_recipient` → multisig Treasury address
  - Confirm creation fee, trading fee bps match intended values
- [ ] Test `sweep_treasury` with a tiny amount to confirm fee routing
- [ ] Confirm `paused == false`

### Shadow Testing (Before Public Launch)

- [ ] Create one test coin with a small amount (0.001 SOL creation fee)
- [ ] Execute small buy + sell round-trip; verify fee splits on-chain
- [ ] Claim creator fees; verify correct lamport amount received
- [ ] Confirm Treasury balance increases as expected

### Go-Live

- [ ] Remove any test access controls or feature flags not intended for production
- [ ] Announce program ID publicly; post on-chain verification steps for users
- [ ] Monitor Treasury PDA balance; confirm first `sweep_treasury` works via multisig

### Post-Launch Monitoring

- [ ] Watch `bonding_curve.complete` flags for coins approaching graduation threshold
- [ ] When a coin reaches 85 SOL, notify the team to prepare `complete_graduation` transaction:
  - Build transaction with `ComputeBudgetInstruction::set_compute_unit_limit(1_400_000)`
  - Verify all Raydium CPMM account PDAs before submitting
- [ ] After each graduation, verify `mint_authority == None` and `freeze_authority == None` on-chain
- [ ] Periodically run `sweep_treasury` via multisig to move accumulated fees to cold storage

---

## Compute Budget Reference

| Instruction          | Required CU  | Needs explicit budget? |
|----------------------|--------------|------------------------|
| `initialize`         |   20 000     | No (< 200k default)    |
| `update_global_config`|   8 000     | No                     |
| `pause_protocol`     |    5 000     | No                     |
| `unpause_protocol`   |    5 000     | No                     |
| `sweep_treasury`     |   20 000     | No                     |
| `set_creator_referrer`|  60 000     | No                     |
| `create_coin`        |  200 000     | **Yes** (at limit)     |
| `buy`                |   80 000     | No                     |
| `sell`               |   80 000     | No                     |
| `claim_creator_fees` |   20 000     | No                     |
| `claim_referrer_fees`|   20 000     | No                     |
| `initiate_graduation`|   15 000     | No                     |
| `complete_graduation`| **1 400 000**| **Yes — mandatory**    |

For `complete_graduation`, always prepend:
```typescript
ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 })
```

---

## Network Address Quick Reference

| Constant                | Devnet                                       | Mainnet                                      |
|-------------------------|----------------------------------------------|----------------------------------------------|
| Raydium CPMM Program    | `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C` | `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C` |
| WSOL Mint               | `So11111111111111111111111111111111111111112`    | `So11111111111111111111111111111111111111112`    |
| create_pool_fee         | `G11FVVnoEUBE4JKpFWXMiQ2Yn1g4pVu4c17dTFJDg6dN` ⚠️ | `DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8` |
| AMM Config (default)    | verify with Raydium devnet docs              | `D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2` |

⚠️ Devnet `create_pool_fee` address must be verified against the live Raydium devnet deployment before running `complete_graduation`.
