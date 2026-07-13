// TypeScript IDL — typed interfaces for every on-chain instruction.
// Mirrors the public interface of anchor/programs/funrun_v2/src/lib.rs.

// ── String length limits (mirrors consts.rs) ─────────────────────────────────

export const MAX_NAME_LEN   = 32;
export const MAX_SYMBOL_LEN = 10;
export const MAX_URI_LEN    = 200;

// ── Instruction argument types ────────────────────────────────────────────────

export interface CreateCoinArgs {
  name:   string;   // max MAX_NAME_LEN bytes (UTF-8)
  symbol: string;   // max MAX_SYMBOL_LEN bytes
  uri:    string;   // max MAX_URI_LEN bytes
}

export interface BuyArgs {
  solAmount:    bigint;  // lamports (u64)
  minTokensOut: bigint;  // raw token units, 6 decimals (u64)
}

export interface SellArgs {
  tokenAmount: bigint;  // raw token units, 6 decimals (u64)
  minSolOut:   bigint;  // lamports (u64)
}

// initiate_graduation and complete_graduation carry no instruction arguments
