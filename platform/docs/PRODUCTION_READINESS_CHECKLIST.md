# Production Readiness Checklist

Use this checklist before any mainnet launch, beta release, or production traffic enablement. Every item should have an owner, evidence link, and final sign-off before launch.

## 1. Infrastructure Checklist

- [ ] Production environments are separated from development and staging.
- [ ] All services run from immutable builds or pinned container images.
- [ ] Required environment variables are documented and set in production secrets storage.
- [ ] RPC endpoints are configured with primary and fallback providers.
- [ ] Load balancers, reverse proxies, and TLS certificates are configured.
- [ ] CORS origins are restricted to approved production domains.
- [ ] Rate limits are enabled and validated for public endpoints.
- [ ] Background workers and long-running services have process supervision.
- [ ] Autoscaling or capacity limits are documented.
- [ ] Deployment access is limited to approved operators.
- [ ] Production config has been reviewed for devnet/testnet leftovers.

## 2. Database Checklist

- [ ] Production database is provisioned with the correct region and capacity.
- [ ] Schema migrations have been reviewed and applied in staging.
- [ ] Production schema matches the expected release schema.
- [ ] Required indexes exist for hot paths.
- [ ] Database connection limits are configured per service.
- [ ] Query timeout and statement timeout settings are reviewed.
- [ ] Sensitive columns are encrypted where required.
- [ ] Audit log tables are append-only by policy.
- [ ] Data retention expectations are documented.
- [ ] Read/write access is scoped by service role.
- [ ] Manual SQL access is restricted and audited.

## 3. Redis Checklist

- [ ] Production Redis instance is provisioned with persistence policy documented.
- [ ] Redis credentials are stored in secrets management.
- [ ] Network access is restricted to approved services.
- [ ] Key prefixes are namespaced per environment.
- [ ] TTLs are configured for cache and rate-limit keys.
- [ ] Eviction policy is documented and appropriate.
- [ ] Memory alerts are configured.
- [ ] Redis failover behavior is tested or documented.
- [ ] Rate-limit behavior is verified under Redis outage conditions.
- [ ] Cache invalidation expectations are documented.

## 4. API Gateway Checklist

- [ ] Production base URL is configured in frontend and services.
- [ ] Authentication middleware is enabled for protected routes.
- [ ] Request body size limits are configured.
- [ ] Public endpoints have rate limits.
- [ ] Error responses do not expose internals.
- [ ] Request IDs or correlation IDs are emitted in logs.
- [ ] Health endpoint is available and safe for monitoring.
- [ ] CORS policy is production-only.
- [ ] Trade route ownership and behavior are signed off by the trading owner.
- [ ] Gateway timeout settings match downstream service expectations.
- [ ] API versioning strategy is documented.

## 5. Trading Service Checklist

- [ ] Trading owner has signed off on buy and sell behavior.
- [ ] Slippage handling has been verified in staging.
- [ ] Idempotency behavior has been verified for trade requests.
- [ ] Balance checks are atomic and protected against double spend.
- [ ] Fee calculation is documented and covered by release evidence.
- [ ] Creator, owner, and referral fee distribution percentages are confirmed.
- [ ] Failed trade behavior preserves user balances.
- [ ] Trade event emission is verified for buy and sell.
- [ ] Load testing has covered concurrent trades.
- [ ] Mainnet RPC limits and retry behavior are documented.
- [ ] Trading service rollback criteria are defined.

## 6. Indexer Checklist

- [ ] Indexer starts from a documented checkpoint.
- [ ] Reorg or duplicate-event handling is documented.
- [ ] Backfill process is tested in staging.
- [ ] Indexer lag metrics are available.
- [ ] Failed event handling and retry policy are documented.
- [ ] Database writes are idempotent.
- [ ] Indexer can resume after restart without data loss.
- [ ] Mainnet program IDs and mint references are verified.
- [ ] Alerting exists for stalled indexing.
- [ ] Manual replay procedure is documented.

## 7. WebSocket Checklist

- [ ] WebSocket endpoint is configured for production.
- [ ] TLS WebSocket connection works from production frontend.
- [ ] Connection authentication is enabled where required.
- [ ] Channel subscription authorization is enforced.
- [ ] Deposit events are broadcast and reflected in the frontend.
- [ ] Buy events are broadcast through the approved trade event path.
- [ ] Sell events are broadcast through the approved trade event path.
- [ ] Reward claim events are broadcast and reflected in the frontend.
- [ ] Withdraw events are broadcast and reflected in the frontend.
- [ ] Reconnect behavior is verified after network interruption.
- [ ] Duplicate event handling is safe on the frontend.
- [ ] Message payloads do not expose sensitive data.

## 8. Frontend Checklist

- [ ] Production API base URL is configured.
- [ ] Production WebSocket URL is configured.
- [ ] Privy app ID is set for production.
- [ ] Wallet login and logout flows are verified.
- [ ] Deposit address display and copy behavior are verified.
- [ ] Creator rewards dashboard shows live values.
- [ ] Referral rewards dashboard shows live values and recent activity.
- [ ] Claim success and failure states are clear.
- [ ] Withdraw modal validates address and amount.
- [ ] Wallet history displays deposits, withdrawals, status, and transaction hashes.
- [ ] Frontend updates after WebSocket events without manual refresh.
- [ ] Empty states are clear for new users.
- [ ] Mobile layout is verified for core flows.
- [ ] Production build has been generated successfully.

## 9. Security Checklist

- [ ] Secrets are not committed to source control.
- [ ] Production secrets are rotated before launch.
- [ ] Auth token verification is enabled in production.
- [ ] User-controlled wallet fields are not trusted for protected actions.
- [ ] Horizontal privilege escalation checks are verified.
- [ ] Mnemonic reveal remains disabled or has owner verification implemented.
- [ ] CORS allows only approved origins.
- [ ] CSP and security headers are enabled.
- [ ] Rate limits protect auth, trade, withdraw, claim, and mnemonic endpoints.
- [ ] Admin endpoints require strong secrets or authenticated operator access.
- [ ] Logs do not include mnemonics, private keys, auth tokens, or raw secrets.
- [ ] Dependency vulnerability scan has been reviewed.
- [ ] External service keys have least privilege.

## 10. Funds Safety Checklist

- [ ] Treasury key management process is approved.
- [ ] Treasury minimum reserve is configured.
- [ ] Withdrawal limits are configured and documented.
- [ ] Daily withdrawal caps are configured where required.
- [ ] Withdrawal idempotency is verified.
- [ ] Failed withdrawal balance restoration is verified.
- [ ] Deposit crediting is idempotent by transaction hash.
- [ ] Custodial wallet sweep behavior is documented.
- [ ] Reward claim transfers value into internal balance atomically.
- [ ] Creator reward accounting has been verified.
- [ ] Referral reward accounting has been verified.
- [ ] Owner/platform fee accounting has been verified.
- [ ] Manual reconciliation procedure exists.
- [ ] Emergency withdrawals disable switch is documented and tested.

## 11. Mainnet Deployment Checklist

- [ ] Mainnet program ID is confirmed.
- [ ] Mainnet RPC URL is configured.
- [ ] Treasury mainnet wallet is funded and verified.
- [ ] Production database is empty or intentionally seeded.
- [ ] Environment variables are reviewed by two operators.
- [ ] Domain DNS points to production infrastructure.
- [ ] TLS certificates are active.
- [ ] Frontend production build is deployed.
- [ ] API Gateway production deployment is healthy.
- [ ] Trading Service production deployment is healthy.
- [ ] Indexer production deployment is healthy.
- [ ] WebSocket production deployment is healthy.
- [ ] Smoke tests pass against production.
- [ ] Launch window and operator coverage are scheduled.

## 12. Monitoring & Alerting Checklist

- [ ] Uptime checks exist for frontend, API Gateway, WebSocket, and services.
- [ ] Error-rate alerts are configured.
- [ ] Latency alerts are configured for API and trade paths.
- [ ] Database connection and query latency alerts are configured.
- [ ] Redis memory and connection alerts are configured.
- [ ] Indexer lag alert is configured.
- [ ] WebSocket disconnect or subscription failure alert is configured.
- [ ] Deposit scan failure alert is configured.
- [ ] Withdrawal failure alert is configured.
- [ ] Balance restoration failure alert is critical severity.
- [ ] Treasury balance alert is configured.
- [ ] RPC failure and rate-limit alerts are configured.
- [ ] On-call escalation path is documented.
- [ ] Dashboard links are collected in the launch runbook.

## 13. Backup & Recovery Checklist

- [ ] Database automated backups are enabled.
- [ ] Backup retention period is documented.
- [ ] Point-in-time recovery is enabled if available.
- [ ] Restore test has been completed in a non-production environment.
- [ ] Redis recovery expectations are documented.
- [ ] Environment secrets backup and recovery process is documented.
- [ ] Deployment artifacts are recoverable.
- [ ] Audit logs are retained according to policy.
- [ ] Recovery time objective is documented.
- [ ] Recovery point objective is documented.
- [ ] Manual reconciliation process is documented for funds-related records.

## 14. Rollback Plan

- [ ] Previous frontend build is available.
- [ ] Previous backend and service builds are available.
- [ ] Database rollback strategy is documented for this release.
- [ ] Non-reversible migrations are explicitly identified.
- [ ] Feature flags or environment switches are documented.
- [ ] Withdrawals can be disabled quickly if needed.
- [ ] Trading can be paused or blocked by operator action if needed.
- [ ] WebSocket can be rolled back independently.
- [ ] Rollback owner and approval path are defined.
- [ ] Rollback smoke tests are listed.
- [ ] User communication template is prepared.
- [ ] Post-rollback reconciliation steps are documented.

## 15. Beta Testing Checklist

- [ ] Beta scope and success criteria are documented.
- [ ] Approved beta testers list is prepared.
- [ ] Test wallets are funded with controlled amounts.
- [ ] Signup and wallet creation flow is tested.
- [ ] Deposit flow is tested.
- [ ] Buy flow is tested by the trading owner.
- [ ] Sell flow is tested by the trading owner.
- [ ] Creator reward accrual is tested.
- [ ] Creator reward claim is tested.
- [ ] Referral link attribution is tested.
- [ ] Referral reward accrual is tested.
- [ ] Referral reward claim is tested.
- [ ] Withdraw flow is tested with small amounts.
- [ ] Wallet history is verified after deposit, claim, and withdraw.
- [ ] WebSocket updates are verified without page refresh.
- [ ] Mobile browser testing is completed.
- [ ] Known issues are documented before public launch.
- [ ] Beta feedback channel is monitored.
- [ ] Go/no-go decision is recorded.
