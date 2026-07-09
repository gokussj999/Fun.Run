# Fun.Run V2 — Release Candidate RC1

**Version:** v1.0.0-rc1  
**Release Date:** 2026-07-03  
**Status:** Protocol Frozen — Documentation Complete — Pending External Audit  

---

## Summary

Fun.Run V2 is a Solana on-chain meme-coin launchpad with a constant-product bonding curve AMM, a 40/40/20 fee split model, and a two-phase permissionless graduation flow to Raydium CPMM. The protocol is **feature complete** as of this release candidate. The on-chain program is frozen — no further instruction changes, PDA layout changes, or protocol economic changes will be made before mainnet launch.

---

## Program Identity

| Item | Value |
|---|---|
| **Version** | v1.0.0-rc1 |
| **Program ID (Devnet)** | `HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP` |
| **Upgrade Authority** | `BHpwVr6eimhzRoYr9q4y3BvWhnkq6WaNuBwQgR97oS5t` |
| **Framework** | Anchor 0.31.1 |
| **Solana Target** | SBF (Berkeley Packet Filter) |
| **Binary Size** | 614,896 bytes |
| **Protocol Version** | 2 (PROTOCOL_VERSION constant) |
| **PROTOCOL_VERSION guard** | Active — prevents graduation of stale curves |

---

## Protocol Constants

| Constant | Value |
|---|---|
| Virtual SOL Initial (VS₀) | 30,000,000,000 lamports (30 SOL) |
| Virtual Token Initial (VT₀) | 1,073,000,191,000,000 raw units |
| k = VS₀ × VT₀ | ≈ 3.219 × 10²⁵ |
| Total Supply | 1,000,000,000 tokens (6 decimals) |
| Bonding Supply | 800,000,000 tokens |
| LP Reserve | 200,000,000 tokens |
| Graduation Threshold | 85,000,000,000 lamports (85 SOL) |
| Graduation DEX Fee | 6,000,000,000 lamports (6 SOL) |
| Default Trading Fee | 150 bps (1.5%) |
| Max Trading Fee | 500 bps (5.0%) |
| Default Creation Fee | 20,000,000 lamports (0.02 SOL) |
| Max Creation Fee | 1,000,000,000 lamports (1 SOL) |
| Fee Split | 40% creator / 20% referrer / 40% treasury |
| Fee Split (no referrer) | 40% creator / 60% treasury |
| Initial Price | ≈ 2.8 × 10⁻⁸ SOL/token |
| Graduation Price | ≈ 4.1 × 10⁻⁷ SOL/token (≈ 14.6× appreciation) |

---

## External Program Addresses

| Program | Address | Network |
|---|---|---|
| Raydium CPMM | `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C` | All clusters |
| WSOL Mint | `So11111111111111111111111111111111111111112` | All clusters |
| Raydium Pool Fee (Mainnet) | `DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8` | Mainnet only |
| Raydium Pool Fee (Devnet) | `G11FVVnoEUBE4JKpFWXMiQ2Yn1g4pVu4c17dTFJDg6dN` | Devnet only |
| Raydium AMM Config (Mainnet) | `D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2` | Mainnet only |

---

## Instructions (13 Total)

| # | Instruction | Phase | Permissionless | CU Budget |
|---|---|---|---|---|
| 1 | `initialize` | P1 — Admin | No (deploy only) | 20,000 |
| 2 | `update_global_config` | P1 — Admin | No (admin only) | 8,000 |
| 3 | `pause_protocol` | P1 — Admin | No (admin only) | 5,000 |
| 4 | `unpause_protocol` | P1 — Admin | No (admin only) | 5,000 |
| 5 | `sweep_treasury` | P1 — Admin | No (admin only) | 20,000 |
| 6 | `set_creator_referrer` | P2 — Referral | Yes (creator signs) | 60,000 |
| 7 | `create_coin` | P3 — Creation | Yes (creator signs) | 200,000 |
| 8 | `buy` | P4 — Trading | Yes (buyer signs) | 80,000 |
| 9 | `sell` | P4 — Trading | Yes (seller signs) | 80,000 |
| 10 | `claim_creator_fees` | P5 — Fees | No (creator signs) | 20,000 |
| 11 | `claim_referrer_fees` | P5 — Fees | No (referrer signs) | 20,000 |
| 12 | `initiate_graduation` | P6 — DEX | **Yes (any wallet)** | 15,000 |
| 13 | `complete_graduation` | P6 — DEX | **Yes (any wallet)** | **1,400,000** |

---

## Test Statistics

| Category | Count | Status |
|---|---|---|
| Unit tests total | **544** | All passing |
| AMM math tests | 26 | Passing |
| Property-based tests | 11 | Passing |
| Graduation simulation tests | 28 | Passing |
| Deploy config tests | 5 | Passing |
| State module tests | ~51 | Passing |
| Instruction unit tests | ~423 | Passing |
| Devnet smoke tests | 17 | Passing |
| Live Raydium CPI test | 0 | Not testable on devnet |

### Graduation Simulation Coverage (28 Tests)

The `complete_graduation` handler was verified via pure-Rust simulation tests covering:

| Group | Tests | What Verified |
|---|---|---|
| A — Full Flow | 1 | All 35 steps at canonical 85 SOL values |
| B — Lamport Conservation | 2 | SOL accounting + range sweep (5–500 SOL) |
| C — Token Conservation | 2 | 200M token deposit + total supply allocation |
| D — LP Formula | 3 | LP amount, Raydium minimum lock, range property |
| E — State Machine | 5 | buy/sell blocked, monotone flags, double-call guards |
| F — Creator Fees | 3 | Fee preservation through graduation + claim + conservation |
| G — Referrer Fees | 2 | Referrer claim post-graduation + conservation |
| H — Post-CPI Assertions | 4 | Ownership, vault balances, LP supply, LP burn |
| I — Treasury | 2 | DEX fee receipt + accumulation across graduations |
| J — Final Invariants | 4 | State machine, snapshot immutability, monotonicity, all invariants |

---

## Devnet Verification

| Item | Value |
|---|---|
| Phase 7.1 Upgrade Signature | `3YSnQYK7WVWFAd2zc1kFgrird28bfNi5xmJk3F2azi3wihKpvmWbcWL7njBzDRP4FCK3GC6DssSSTyhFUwmyTd9U` |
| Devnet Program ID | `HX1TXtjJ31aCA9AQZSUFzzyBVj34qh1uHGvcNUd2oBqP` |
| Smoke Tests Passed | 17 / 17 |
| Smoke Tests Failed | 0 |
| Instructions Verified On-Chain | 12 / 13 (`complete_graduation` excluded — Raydium devnet unavailable) |

---

## Documentation Deliverables

All documentation is located in `anchor/docs/`:

| Document | Path | Description |
|---|---|---|
| Protocol Reference | `docs/PROTOCOL_REFERENCE.md` | Complete instruction ref, PDA ref, account layouts, events, errors, economics, graduation flow, upgrade policy, mainnet checklist |
| Audit Package | `docs/AUDIT_PACKAGE.md` | Architecture, trust model, 20 security invariants, 10 threat scenarios, lamport/token accounting, state machine diagrams, known limitations, test coverage, devnet evidence |
| Operator Runbook | `docs/OPERATOR_RUNBOOK.md` | Deploy, upgrade, emergency pause, treasury ops, graduation ops, fee config, monitoring, recovery, verification commands |
| Developer Guide | `docs/DEVELOPER_GUIDE.md` | Build, test, repo layout, module overview, conventions, new instruction guide, TypeScript client, extension points, troubleshooting |
| **Release Report** | `RELEASE_RC1.md` | This file |
| Version Tag | `VERSION` | `v1.0.0-rc1` |

---

## Known Limitations

| # | Limitation | Impact | Mitigation |
|---|---|---|---|
| 1 | Live Raydium CPI not tested on devnet | `complete_graduation` CPI execution unverified | 28 simulation tests + mandatory mainnet test before production |
| 2 | Single admin key — no on-chain multisig | Admin key compromise enables fee manipulation / pause | Transfer admin to multisig before mainnet |
| 3 | No admin key rotation instruction | Lost admin key = permanent loss of admin functions | Secure admin key with hardware wallet + backup |
| 4 | Multi-hop circular referrals not detected | A→B→C→A cycles allowed | Low impact — no economic harm |
| 5 | `compute_expected_lp` returns `Some(0)` at sqrt=100 | Graduation fails for tiny pools (never happens at 85 SOL) | `ZeroLpBalance` guard catches and aborts cleanly |
| 6 | Upgrade authority not yet on multisig | Single key controls program upgrades | Move to multisig before mainnet |

---

## Security Invariants (Summary)

20 on-chain invariants enforced by the program:

- **I-1 to I-4:** AMM — k monotonicity, bounded output, zero output rejection, reserve consistency
- **I-5 to I-7:** Fees — split completeness, fee boundedness, creator fee isolation
- **I-8 to I-10:** State monotonicity — `complete`, `graduated`, protocol version guard
- **I-11 to I-13:** Authorization — admin, creator, referrer
- **I-14 to I-17:** Graduation — DEX fee snapshot immutability, LP permanent lock, authority revocations, post-CPI verification
- **I-18 to I-20:** Referral — write-once relationship, no self-referral, no direct circular referral

---

## Build Reproducibility

```bash
# All builds are fully offline (anchor/.cargo/config.toml: offline = true)

# Devnet binary
cd anchor && cargo build-sbf --features devnet

# Mainnet binary
cd anchor && cargo build-sbf --features mainnet

# Unit tests
cd anchor && cargo test
# test result: ok. 544 passed; 0 failed; 0 ignored
```

All dependencies are pinned in `Cargo.lock`. Builds are deterministic.

---

## Launch Procedure (Mainnet)

### Before Launch

- [ ] External security audit complete with no critical / high findings unresolved
- [ ] `complete_graduation` live-tested on mainnet with a low-liquidity test coin
- [ ] Admin keypair moved to hardware wallet
- [ ] Upgrade authority moved to multisig (or burned for full immutability)
- [ ] Fee recipient set to cold multisig wallet
- [ ] Off-chain graduation monitor deployed and tested
- [ ] Emergency pause procedure rehearsed with admin keypair
- [ ] Mainnet Deployment Checklist in `docs/OPERATOR_RUNBOOK.md` completed in full

### Launch Sequence

1. Build mainnet binary: `cargo build-sbf --features mainnet`
2. Verify binary constants (Raydium fee address, CPMM program ID)
3. Deploy program with upgrade authority keypair
4. Call `initialize` to create GlobalConfig + Treasury
5. Verify GlobalConfig and Treasury PDAs on-chain
6. Set `fee_recipient` to production multisig wallet
7. Transfer upgrade authority to multisig
8. Run post-deployment smoke tests
9. Enable frontend to point at mainnet program

### Post-Launch

- Monitor for `GraduationInitiated` events — trigger `complete_graduation` within same slot
- Sweep treasury weekly or when balance exceeds operational threshold
- Monitor for unexpected `GlobalConfigUpdated` events (possible admin key compromise indicator)

---

## Phase History

| Phase | Description | Status |
|---|---|---|
| P0 | Scaffold, workspace setup | Complete |
| P1 | Administration (initialize, config, pause, sweep) | Complete |
| P2 | Creator identity & referral | Complete |
| P3 | Coin creation | Complete |
| P4 | Trading (buy / sell) with CPMM AMM | Complete |
| P5 | Fee claims (creator + referrer) | Complete |
| P6.1 | `initiate_graduation` — state freeze + snapshot | Complete |
| P6.2 | `complete_graduation` — Raydium CPI + LP burn | Complete |
| P6.3 | Post-CPI verification (14 checks) | Complete |
| P6.4 | LP permanent lock + burn verification | Complete |
| P6.5 | Mint authority revocation | Complete |
| P6.6 | Freeze authority revocation | Complete |
| P7.1 | Stack overflow fix (Boxing + inline(never)) | Complete |
| P7.2 | Mainnet-fork graduation verification (28 simulation tests) | Complete |
| **RC1** | **Protocol freeze + full documentation** | **Complete** |

---

## Contacts & Resources

| Resource | Location |
|---|---|
| Protocol Reference | `anchor/docs/PROTOCOL_REFERENCE.md` |
| Audit Package | `anchor/docs/AUDIT_PACKAGE.md` |
| Operator Runbook | `anchor/docs/OPERATOR_RUNBOOK.md` |
| Developer Guide | `anchor/docs/DEVELOPER_GUIDE.md` |
| Deployment Checklist | `anchor/DEPLOYMENT_CHECKLIST.md` |
| Source Code | `anchor/programs/funrun_v2/src/` |
| Version Tag | `anchor/VERSION` |

---

*Fun.Run V2 — v1.0.0-rc1 — Protocol Frozen — Ready for External Audit*
