const DEFAULT_API_BASE = "https://funrun-production.up.railway.app";
const DEFAULT_PRIVY_APP_ID = "cmld3um1x01w8i50ct60xaywb";
const DEFAULT_SOLANA_RPC = "https://api.devnet.solana.com";

export const env = {
  apiBase: import.meta.env.VITE_API_BASE || DEFAULT_API_BASE,
  privyAppId: import.meta.env.VITE_PRIVY_APP_ID || DEFAULT_PRIVY_APP_ID,
  appUrl: import.meta.env.VITE_APP_URL || "",
  solanaRpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || DEFAULT_SOLANA_RPC,
};
