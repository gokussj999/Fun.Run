import { PrivyClient } from '@privy-io/server-auth';

import type { Logger } from '@funrun/logger';

export interface PrivyClientOptions {
  appId: string;
  appSecret: string;
  verificationKey?: string;    // optional custom verification key
  logger: Logger;
}

let _privyClient: PrivyClient | null = null;

export function createPrivyClient(opts: PrivyClientOptions): PrivyClient {
  if (_privyClient) return _privyClient;

  const { appId, appSecret, verificationKey, logger } = opts;

  if (!appId || !appSecret) {
    throw new Error('PRIVY_APP_ID and PRIVY_APP_SECRET are required');
  }

  _privyClient = new PrivyClient(appId, appSecret);

  logger.info({ appId }, 'Privy client initialized');
  return _privyClient;
}

export function getPrivyClient(): PrivyClient {
  if (!_privyClient) {
    throw new Error('Privy client not initialized. Call createPrivyClient() at startup.');
  }
  return _privyClient;
}

export function resetPrivyClient(): void {
  _privyClient = null;
}
