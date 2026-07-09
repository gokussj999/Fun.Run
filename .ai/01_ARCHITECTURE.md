# System Architecture

## High Level

FUN.RUN consists of four major layers:

1. Solana Program (Anchor)
2. Backend API
3. Frontend
4. PostgreSQL Database

---

## Solana Program

Status:
- Production Ready
- RC1 Complete
- Devnet Deployed
- Frozen

Responsibilities:
- Coin Creation
- AMM Trading
- Fee Distribution
- Graduation
- Raydium Migration

This layer must NOT be modified unless explicitly requested.

---

## Backend

Responsibilities:
- Authentication
- Blockchain Indexer
- Trading Service
- Wallet Service
- Coin Service
- Portfolio Service
- Admin APIs
- WebSocket Gateway

The backend communicates with both the Solana program and the frontend.

---

## Frontend

Responsibilities:
- Landing Page
- Trading Interface
- Coin Details
- Portfolio
- Creator Dashboard
- Referral Dashboard
- Admin Dashboard

Frontend must never contain business logic.
Business logic belongs in the backend.

---

## Database

Database stores:

- Users
- Coins
- Trades
- Transactions
- Holdings
- Creator Earnings
- Referral Earnings

---

## Development Principle

Frontend → Backend → Solana

Never bypass this architecture.