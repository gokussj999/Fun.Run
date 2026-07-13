// Mirrors anchor/programs/funrun_v2/src/consts.rs — PDA seed byte arrays

export const GLOBAL_CONFIG_SEED    = Buffer.from('global_config');
export const TREASURY_SEED         = Buffer.from('treasury');
export const BONDING_CURVE_SEED    = Buffer.from('bonding_curve');
export const CREATOR_PROFILE_SEED  = Buffer.from('creator_profile');
export const CREATOR_REFERRAL_SEED = Buffer.from('creator_referral');

// Raydium CPMM seeds
export const RAYDIUM_AUTHORITY_SEED   = Buffer.from('vault_and_lp_mint_auth_seed');
export const RAYDIUM_POOL_SEED        = Buffer.from('pool');
export const RAYDIUM_LP_MINT_SEED     = Buffer.from('pool_lp_mint');
export const RAYDIUM_OBSERVATION_SEED = Buffer.from('observation');
export const RAYDIUM_POOL_VAULT_SEED  = Buffer.from('pool_vault');
