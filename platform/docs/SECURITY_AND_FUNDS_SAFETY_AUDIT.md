# Security and Funds Safety Audit

This document is an audit preparation template. It does not record audit results. Use each section to collect evidence, reviewer notes, risks, required fixes, and final sign-off before production or mainnet launch.

## 1. Deposit Safety

### Audit Scope

- Verify deposit address generation and assignment.
- Verify deposit detection and crediting flow.
- Verify duplicate deposit protection.
- Verify handling of unsupported tokens or wrong network deposits.
- Verify user-facing deposit history.

### Evidence To Collect

- Custodial wallet creation flow.
- Deposit scan logic.
- Deposit database schema and unique constraints.
- Sample confirmed deposit transaction.
- Sample duplicate scan attempt.
- Deposit history API response.

### Review Questions

- Is each user assigned the correct deposit wallet?
- Can a deposit transaction hash be credited more than once?
- Are deposits credited only after sufficient confirmation?
- What happens if the deposit scanner crashes mid-credit?
- What happens if an on-chain deposit is detected but database write fails?
- Are deposit amounts rounded safely?
- Are failed or pending deposits visible to operators?

### Required Sign-Off

- Engineering:
- Security:
- Operations:
- Status:

## 2. Buy Accounting Verification

### Audit Scope

- Verify buy accounting from internal balance debit through token credit.
- Verify fee calculation is applied consistently.
- Verify holdings update after buy.
- Verify transaction record creation.
- Verify buy event emission.

### Evidence To Collect

- Buy request and response sample.
- Balance before and after buy.
- Holdings before and after buy.
- Transaction row.
- Fee distribution record or profile reward deltas.
- WebSocket buy event sample.

### Review Questions

- Is user SOL/internal balance debited exactly once?
- Are received tokens calculated as expected?
- Are creator, referral, and owner rewards calculated from the correct fee basis?
- Is the transaction atomic enough to prevent partial buy state?
- What is the recovery path if event emission fails after accounting succeeds?
- Are buy failures guaranteed not to debit users?

### Required Sign-Off

- Trading Owner:
- Engineering:
- Security:
- Status:

## 3. Sell Accounting Verification

### Audit Scope

- Verify sell accounting from token debit through SOL/internal balance credit.
- Verify fee calculation is applied consistently.
- Verify holdings update after sell.
- Verify transaction record creation.
- Verify sell event emission.

### Evidence To Collect

- Sell request and response sample.
- Holdings before and after sell.
- Internal balance before and after sell.
- Transaction row.
- Fee distribution record or profile reward deltas.
- WebSocket sell event sample.

### Review Questions

- Is token balance reduced exactly once?
- Is seller credited the correct net SOL/internal balance?
- Are fees deducted from the correct gross amount?
- Can a user sell more tokens than their holdings?
- Are concurrent sell requests serialized or otherwise protected?
- Are sell failures guaranteed not to create negative holdings?

### Required Sign-Off

- Trading Owner:
- Engineering:
- Security:
- Status:

## 4. Treasury Reconciliation

### Audit Scope

- Verify treasury balance against internal user liabilities.
- Verify deposits, withdrawals, rewards, and fees reconcile.
- Verify treasury minimum reserve.
- Verify operator reconciliation process.

### Evidence To Collect

- Treasury public address.
- On-chain treasury balance.
- Sum of user internal balances.
- Sum of pending withdrawals.
- Sum of confirmed deposits and withdrawals.
- Sum of unclaimed rewards.
- Reconciliation query output.

### Review Questions

- Does treasury balance cover all user liabilities?
- Are pending withdrawals included in reconciliation?
- Are rewards included before and after claim?
- Are platform fees separated from user liabilities?
- What threshold triggers emergency action?
- Is reconciliation automated, manual, or both?

### Required Sign-Off

- Finance/Ops:
- Engineering:
- Security:
- Status:

## 5. Internal Ledger vs On-chain Verification

### Audit Scope

- Compare internal ledger state with on-chain balances and transactions.
- Verify deposit and withdrawal transaction hashes.
- Verify token mint and supply assumptions.
- Verify indexer-derived state where applicable.

### Evidence To Collect

- Internal ledger export.
- On-chain transaction samples.
- On-chain treasury balance.
- On-chain custodial wallet balances.
- Token supply query.
- Indexer checkpoint data.

### Review Questions

- Are internal deposits backed by on-chain transactions?
- Are internal withdrawals backed by on-chain transactions?
- Are failed transactions excluded from confirmed balances?
- Are pending records clearly separated?
- Are chain replays or duplicate scanner runs idempotent?
- Is there a documented mismatch resolution process?

### Required Sign-Off

- Engineering:
- Operations:
- Security:
- Status:

## 6. Withdraw Verification

### Audit Scope

- Verify withdraw authentication.
- Verify amount validation.
- Verify destination address validation.
- Verify idempotency.
- Verify pending, confirmed, and failed status transitions.
- Verify balance restoration on failure.

### Evidence To Collect

- Successful withdrawal sample.
- Duplicate idempotency key sample.
- Failed withdrawal simulation.
- Balance before and after withdrawal.
- Withdrawal database rows.
- Audit log entries.

### Review Questions

- Can only the authenticated user withdraw from their own balance?
- Is the destination a valid Solana address?
- Are withdrawal limits enforced?
- Is the same idempotency key safe to retry?
- What happens if on-chain transfer succeeds but database update fails?
- What happens if database debit succeeds but transfer fails?
- Are failed withdrawals visible to operators?

### Required Sign-Off

- Engineering:
- Security:
- Operations:
- Status:

## 7. Double Spend Protection

### Audit Scope

- Verify balance debits cannot be executed twice concurrently.
- Verify reward claims cannot be claimed twice.
- Verify withdrawals cannot be submitted twice.
- Verify trade and ledger updates are protected by database locks or equivalent safeguards.

### Evidence To Collect

- Concurrent claim test evidence.
- Concurrent withdrawal test evidence.
- Concurrent trade test evidence from trading owner.
- Database transaction logic.
- Locking strategy documentation.
- Idempotency behavior samples.

### Review Questions

- Are rows locked during balance mutation?
- Can two claim requests observe the same reward balance?
- Can two withdrawal requests spend the same internal balance?
- Are idempotency keys unique and scoped safely?
- Are failed requests retried safely?

### Required Sign-Off

- Engineering:
- Security:
- Status:

## 8. Replay Attack Protection

### Audit Scope

- Verify replay protection for deposits, withdrawals, claims, and trades.
- Verify transaction hash uniqueness.
- Verify idempotency key behavior.
- Verify authentication token replay exposure.

### Evidence To Collect

- Unique constraints for transaction hashes.
- Idempotency key constraints.
- Duplicate request samples.
- Auth token lifetime configuration.
- Logs for repeated request attempts.

### Review Questions

- Can an old deposit transaction hash be replayed for credit?
- Can a withdrawal request be replayed by reusing payloads?
- Can claim requests be replayed after rewards are zeroed?
- Are auth tokens short-lived enough for production risk?
- Are replay attempts logged or rate-limited?

### Required Sign-Off

- Security:
- Engineering:
- Status:

## 9. Race Condition Review

### Audit Scope

- Review concurrent user actions around deposits, buys, sells, claims, and withdrawals.
- Review cache invalidation and stale reads.
- Review event delivery order.
- Review worker restart behavior.

### Evidence To Collect

- Concurrency test notes.
- Database lock usage.
- Cache TTL configuration.
- Event ordering assumptions.
- Worker restart and retry behavior.

### Review Questions

- Can stale cache cause incorrect financial decisions?
- Are balance reads and writes in the same transaction where required?
- Can reward distribution race with reward claim?
- Can deposit scanner overlap with itself?
- Can WebSocket events arrive before database state is readable?
- Are retries safe after partial failures?

### Required Sign-Off

- Engineering:
- Security:
- Status:

## 10. API Authentication Review

### Audit Scope

- Verify protected endpoints require authentication.
- Verify authenticated wallet ownership is resolved server-side.
- Verify client-supplied wallet fields are not trusted for protected actions.
- Verify admin endpoints are protected.

### Evidence To Collect

- Auth middleware behavior.
- Privy token verification configuration.
- Protected route list.
- Admin route access control.
- Unauthorized request samples.
- Cross-wallet access attempt samples.

### Review Questions

- Can a user request another user's profile?
- Can a user claim or withdraw for another wallet?
- Are auth failures generic and safe?
- Are admin secrets strong and rotated?
- Are auth errors logged without leaking tokens?

### Required Sign-Off

- Security:
- Engineering:
- Status:

## 11. Wallet Encryption Review

### Audit Scope

- Verify custodial mnemonic generation.
- Verify encryption algorithm and key length.
- Verify encrypted mnemonic storage.
- Verify decryption access paths.
- Verify mnemonic reveal behavior.

### Evidence To Collect

- Wallet creation code path.
- Encryption configuration.
- Encrypted database sample.
- Decryption call sites.
- Mnemonic reveal endpoint behavior.
- Secret storage policy.

### Review Questions

- Are mnemonics encrypted before storage?
- Is the encryption key production-grade and stored securely?
- Is IV handling correct?
- Are plaintext mnemonics ever logged?
- Can support, admin, or user endpoints expose mnemonics?
- Is mnemonic reveal disabled or fully ownership-protected?

### Required Sign-Off

- Security:
- Engineering:
- Status:

## 12. Key Management

### Audit Scope

- Review treasury private key handling.
- Review encryption key handling.
- Review API keys and RPC keys.
- Review operator access.
- Review rotation process.

### Evidence To Collect

- Secret inventory.
- Secret storage provider.
- Access control list.
- Rotation runbook.
- Key usage map.
- Emergency revoke process.

### Review Questions

- Who can access production private keys?
- Are keys available only to services that require them?
- Is there a documented rotation process?
- Can compromised API keys be revoked quickly?
- Are local `.env` files excluded from commits?
- Is production access audited?

### Required Sign-Off

- Security:
- Operations:
- Engineering:
- Status:

## 13. Treasury Multisig

### Audit Scope

- Verify whether treasury control is single-key or multisig.
- Verify signer set and threshold.
- Verify emergency procedures.
- Verify transaction approval process.

### Evidence To Collect

- Treasury wallet type.
- Multisig address, if enabled.
- Signer list.
- Threshold configuration.
- Test transaction evidence.
- Emergency signer replacement process.

### Review Questions

- Is treasury protected by multisig before mainnet funds are meaningful?
- Are signers independent and secure?
- Is the threshold appropriate?
- Is there a recovery process if a signer is unavailable?
- Are treasury actions logged and reviewed?

### Required Sign-Off

- Security:
- Operations:
- Leadership:
- Status:

## 14. Audit Logs

### Audit Scope

- Verify financial events are written to audit logs.
- Verify audit logs are append-only by policy.
- Verify failures are logged.
- Verify logs do not expose secrets.

### Evidence To Collect

- Audit log schema.
- Sample deposit, buy, sell, claim, and withdraw audit rows.
- Failed withdrawal audit sample.
- Log retention configuration.
- Operator access policy.

### Review Questions

- Are all financial state changes auditable?
- Are failed financial operations auditable?
- Are audit logs immutable enough for operational needs?
- Can audit logs be correlated with request IDs?
- Do logs avoid mnemonics, private keys, and tokens?

### Required Sign-Off

- Security:
- Operations:
- Engineering:
- Status:

## 15. Backups

### Audit Scope

- Verify database backups.
- Verify audit log retention.
- Verify secrets backup and recovery.
- Verify restore testing.

### Evidence To Collect

- Backup schedule.
- Backup retention policy.
- Latest restore test.
- Point-in-time recovery setting.
- Secrets recovery procedure.
- Backup access control.

### Review Questions

- Can the database be restored to a known good point?
- How much data can be lost under current RPO?
- How long does restore take under current RTO?
- Are backups encrypted?
- Who can access backups?
- Are restore drills scheduled?

### Required Sign-Off

- Operations:
- Security:
- Engineering:
- Status:

## 16. Disaster Recovery

### Audit Scope

- Review service outage response.
- Review database loss response.
- Review Redis loss response.
- Review RPC outage response.
- Review treasury compromise response.
- Review incident communication.

### Evidence To Collect

- Disaster recovery runbook.
- Incident severity matrix.
- On-call contacts.
- RPC failover plan.
- Database restore plan.
- Treasury emergency plan.
- User communication templates.

### Review Questions

- What is the first action if withdrawals fail?
- What is the first action if treasury key is suspected compromised?
- What is the first action if database writes fail?
- What is the first action if indexer stalls?
- Can risky functionality be paused quickly?
- Who approves production emergency actions?

### Required Sign-Off

- Operations:
- Security:
- Leadership:
- Status:

## 17. Monitoring

### Audit Scope

- Verify monitoring coverage for funds-critical systems.
- Verify alert thresholds.
- Verify dashboards.
- Verify operator response.

### Evidence To Collect

- Dashboard links.
- Alert configuration.
- Synthetic test configuration.
- On-call escalation route.
- Recent alert test.
- Log query examples.

### Review Questions

- Are withdrawal failures alerting immediately?
- Are deposit scanner failures alerting?
- Are treasury balance thresholds alerting?
- Are database failures alerting?
- Are WebSocket failures alerting?
- Are RPC failures and rate limits alerting?
- Are alerts actionable and routed to humans?

### Required Sign-Off

- Operations:
- Engineering:
- Security:
- Status:

## 18. Rate Limiting

### Audit Scope

- Review rate limits on public and protected endpoints.
- Review Redis-backed rate-limit behavior.
- Review abuse scenarios.
- Review user experience under rate limits.

### Evidence To Collect

- Endpoint rate-limit table.
- Redis store configuration.
- Rate-limit exceeded response samples.
- Load or abuse test samples.
- Bypass or allowlist policy, if any.

### Review Questions

- Are trade, withdraw, claim, create, and mnemonic endpoints rate-limited?
- Are unauthenticated endpoints protected from scraping or flood?
- Are limits scoped by IP, wallet, user, or combined identity?
- What happens if Redis is unavailable?
- Are error messages safe and useful?

### Required Sign-Off

- Security:
- Engineering:
- Operations:
- Status:

## 19. Load Testing

### Audit Scope

- Verify system behavior under expected and peak load.
- Verify concurrent financial operations.
- Verify WebSocket fanout.
- Verify database and Redis capacity.
- Verify RPC behavior under load.

### Evidence To Collect

- Load test plan.
- Test environment configuration.
- Concurrent trade test results from trading owner.
- Concurrent claim and withdrawal test results.
- WebSocket connection test results.
- Database metrics during test.
- Redis metrics during test.
- RPC error rates during test.

### Review Questions

- What is the expected beta traffic level?
- What is the expected public launch traffic level?
- Where is the first bottleneck?
- Do financial invariants hold under concurrency?
- Do rate limits protect the system without blocking normal users?
- Does WebSocket reconnect behavior create thundering herd risk?

### Required Sign-Off

- Engineering:
- Operations:
- Trading Owner:
- Status:

## 20. Final Go/No-Go Checklist

### Required Evidence

- [ ] Deposit safety reviewed.
- [ ] Buy accounting reviewed by trading owner.
- [ ] Sell accounting reviewed by trading owner.
- [ ] Treasury reconciliation reviewed.
- [ ] Internal ledger vs on-chain verification reviewed.
- [ ] Withdraw verification reviewed.
- [ ] Double spend protection reviewed.
- [ ] Replay protection reviewed.
- [ ] Race condition review completed.
- [ ] API authentication reviewed.
- [ ] Wallet encryption reviewed.
- [ ] Key management reviewed.
- [ ] Treasury multisig decision recorded.
- [ ] Audit logs reviewed.
- [ ] Backups reviewed.
- [ ] Disaster recovery reviewed.
- [ ] Monitoring reviewed.
- [ ] Rate limiting reviewed.
- [ ] Load testing reviewed.
- [ ] Critical findings are resolved.
- [ ] High findings have owner-approved launch exceptions or are resolved.
- [ ] Production rollback plan is ready.
- [ ] Operator coverage is scheduled.
- [ ] Final launch decision is recorded.

### Final Decision

- Go / No-Go:
- Decision Owner:
- Date:
- Conditions:
- Follow-up Items:
