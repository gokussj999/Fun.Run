/** Shared expectations for baseline migration smoke tests (Task 4). */

export const EXPECTED_TABLES = [
  'profiles',
  'coins',
  'holdings',
  'transactions',
  'candles',
  'referral_accounts',
  'treasury_events',
  'audit_logs',
  'indexer_state',
  'pending_txs',
  'push_subscriptions',
];

export const EXPECTED_ENUMS = [
  'UserRole',
  'CoinStatus',
  'TradeType',
  'Timeframe',
  'AuditAction',
  'TxStatus',
];

export const EXPECTED_FOREIGN_KEYS = [
  'coins_creator_wallet_fkey',
  'holdings_wallet_address_fkey',
  'holdings_coin_id_fkey',
  'transactions_coin_id_fkey',
  'transactions_wallet_address_fkey',
  'candles_coin_id_fkey',
];

export const EXPECTED_INDEXES = [
  'profiles_wallet_address_key',
  'profiles_privy_user_id_key',
  'coins_mint_address_key',
  'holdings_wallet_address_coin_id_key',
  'transactions_tx_signature_key',
  'candles_coin_id_timeframe_open_time_key',
  'pending_txs_idempotency_key_key',
  'pending_txs_signature_key',
  'push_subscriptions_wallet_address_token_key',
];

export const EXPECTED_MIGRATION = '20260709000000_baseline';
export const MIN_INDEX_COUNT = 33;
