import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(__dirname, "..", ".env"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const sql = postgres(env.DATABASE_URL, { ssl: "require", max: 1 });
const OWNER = String(env.APP_OWNER_WALLET || "CZ9bps8dTtK69bRaQc8A4hUR8ZmUbfbYbTWfvaHpqSyn").trim();

function n(v) {
  return Number(v || 0);
}

try {
  const profiles = await sql`
    select wallet, wallet_address, run_balance, sol_balance,
           creator_rewards, owner_rewards, referral_rewards, updated_at
    from profiles
    where wallet = ${OWNER} or wallet_address = ${OWNER}
       or wallet ilike ${OWNER.slice(0, 8) + "%"}
    order by updated_at desc nulls last
    limit 5
  `;
  console.log("\n=== PROFILE(S) ===");
  for (const p of profiles) {
    console.log({
      wallet: p.wallet,
      custodial: p.wallet_address,
      run_balance: n(p.run_balance),
      sol_balance_col: n(p.sol_balance),
      creator_rewards: n(p.creator_rewards),
      owner_rewards: n(p.owner_rewards),
      referral_rewards: n(p.referral_rewards),
      updated_at: p.updated_at,
    });
  }

  const wallet = profiles[0]?.wallet || OWNER;
  const custodial = profiles[0]?.wallet_address || "";

  console.log("\n=== DEPOSITS (wallet or custodial) ===");
  const deposits = await sql`
    select id, wallet, tx_hash, amount, status, created_at
    from deposits
    where wallet = ${wallet}
       or wallet = ${custodial}
       or wallet = ${OWNER}
    order by created_at desc
    limit 30
  `;
  let depSum = 0;
  for (const d of deposits) {
    depSum += n(d.amount);
    console.log({
      amount: n(d.amount),
      status: d.status,
      wallet: String(d.wallet || "").slice(0, 12),
      tx: String(d.tx_hash || "").slice(0, 16),
      at: String(d.created_at),
    });
  }
  console.log("deposit_sum_listed", depSum);

  console.log("\n=== WITHDRAWALS ===");
  const withdrawals = await sql`
    select id, amount, destination, status, tx_hash, created_at
    from withdrawals
    where wallet = ${wallet}
    order by created_at desc
    limit 20
  `;
  let wSum = 0;
  for (const w of withdrawals) {
    wSum += n(w.amount);
    console.log({
      amount: n(w.amount),
      status: w.status,
      dest: String(w.destination || "").slice(0, 12),
      at: String(w.created_at),
    });
  }
  console.log("withdraw_sum", wSum);

  console.log("\n=== TRADES (BUY/SELL) ===");
  const txs = await sql`
    select t.type, t.sol, t.tokens, t.fee, t.created_at, c.symbol, t.coin_id
    from transactions t
    left join coins c on c.id = t.coin_id
    where t.wallet = ${wallet}
      and upper(t.type) in ('BUY', 'SELL')
    order by t.created_at desc
    limit 50
  `;
  let buySol = 0;
  let sellSol = 0;
  let feeSol = 0;
  for (const t of txs) {
    const sol = n(t.sol);
    const fee = n(t.fee);
    feeSol += fee;
    if (String(t.type).toUpperCase() === "BUY") buySol += sol;
    else sellSol += sol;
    console.log({
      type: t.type,
      symbol: t.symbol,
      sol,
      fee,
      tokens: n(t.tokens),
      at: String(t.created_at),
    });
  }
  console.log({ buySol, sellSol, feeSol_on_rows: feeSol, netTradeSolOut: buySol - sellSol });

  console.log("\n=== AUDIT (money events) ===");
  const audits = await sql`
    select event_type, amount, coin_id, meta, created_at
    from audit_logs
    where wallet = ${wallet}
    order by created_at desc
    limit 40
  `;
  for (const a of audits) {
    console.log({
      event: a.event_type,
      amount: n(a.amount),
      coin: a.coin_id ? String(a.coin_id).slice(0, 8) : "",
      at: String(a.created_at),
    });
  }

  console.log("\n=== HOLDINGS ===");
  const holds = await sql`
    select h.tokens, c.symbol, c.id,
           c.reserve_sol, c.reserve_token, c.v_sol, c.v_tokens, c.market_cap
    from holdings h
    join coins c on c.id = h.coin_id
    where h.wallet = ${wallet} and h.tokens > 0
    order by h.tokens desc
  `;
  const SOL_USD = Number(env.SOL_USD || 80);
  for (const h of holds) {
    const priceSol =
      (n(h.reserve_sol) + n(h.v_sol)) / Math.max(1e-12, n(h.reserve_token) + n(h.v_tokens));
    const valueUsd = n(h.tokens) * priceSol * SOL_USD;
    console.log({
      symbol: h.symbol,
      tokens: n(h.tokens),
      valueUsd: Number(valueUsd.toFixed(4)),
      valueSolApprox: Number((valueUsd / SOL_USD).toFixed(6)),
    });
  }

  // Coin creates with initial buy
  console.log("\n=== COIN CREATES (initial buy from audit/meta) ===");
  const creates = await sql`
    select event_type, amount, meta, created_at
    from audit_logs
    where wallet = ${wallet} and event_type = 'COIN_CREATE'
    order by created_at desc
    limit 10
  `;
  for (const a of creates) {
    console.log({ amount: n(a.amount), meta: a.meta, at: String(a.created_at) });
  }

  const runBal = n(profiles[0]?.run_balance);
  console.log("\n=== RECONCILE (approx) ===");
  console.log({
    wallet,
    custodial,
    run_balance_now: runBal,
    deposits_sum_rows: depSum,
    buys_sol: buySol,
    sells_sol: sellSol,
    withdraws: wSum,
    expected_rough: depSum - buySol + sellSol - wSum,
    note: "expected_rough ignores create-initial-buy if already in BUY txs; fees are inside buy amount",
  });
} finally {
  await sql.end({ timeout: 5 });
}
