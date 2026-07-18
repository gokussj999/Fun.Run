const DEFAULT_API_BASE = "";
const DEFAULT_PRIVY_APP_ID = "cmld3um1x01w8i50ct60xaywb";
const DEFAULT_SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const DEFAULT_WS_URL = "ws://localhost:3001/ws";

export const env = {
  apiBase: import.meta.env.VITE_API_BASE || DEFAULT_API_BASE,
  wsUrl: import.meta.env.VITE_WS_URL || DEFAULT_WS_URL,
  privyAppId: import.meta.env.VITE_PRIVY_APP_ID || DEFAULT_PRIVY_APP_ID,
  appUrl: import.meta.env.VITE_APP_URL || "",
  solanaRpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || DEFAULT_SOLANA_RPC,
  /** When false, falls back to legacy REST paths (pre-Sprint 6). */
  usePlatform: import.meta.env.VITE_USE_PLATFORM === "1",
};

/** SPL token decimals (funrun_v2 RC1). */
export const TOKEN_DECIMALS = 6;

export function toLamports(sol) {
  return String(Math.max(0, Math.floor(Number(sol || 0) * 1_000_000_000)));
}

export function toTokenRaw(tokens) {
  return String(Math.max(0, Math.floor(Number(tokens || 0) * 10 ** TOKEN_DECIMALS)));
}
