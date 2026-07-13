import { env, toLamports, toTokenRaw } from "../lib/env.js";

const API_PREFIX = "/api/v1";

function buildUrl(path, query) {
  const base = String(env.apiBase || "").replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const q = query ? `?${new URLSearchParams(query).toString()}` : "";
  return base ? `${base}${p}${q}` : `${p}${q}`;
}

export async function platformFetch(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout || 30000);
  const url = buildUrl(path, options.query);

  try {
    const res = await fetch(url, {
      cache: "no-store",
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    let json = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    if (!res.ok) {
      const msg =
        json?.error?.message ||
        json?.message ||
        json?.error ||
        `Request failed (${res.status})`;
      throw new Error(typeof msg === "string" ? msg : `Request failed (${res.status})`);
    }

    return json || {};
  } catch (e) {
    if (e?.name === "AbortError") throw new Error("Request timeout");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export function newIdempotencyKey(prefix = "fr") {
  return `${prefix}-${crypto.randomUUID()}`;
}

// ── Market ────────────────────────────────────────────────────────────────────

export async function fetchSolPrice() {
  return platformFetch(`${API_PREFIX}/market/sol-price`);
}

export async function fetchCoinList(page = 0, limit = 50) {
  return platformFetch(`${API_PREFIX}/market/coins`, {
    query: { page: String(page), limit: String(limit) },
  });
}

export async function fetchCoin(coinId) {
  return platformFetch(`${API_PREFIX}/market/coins/${coinId}`);
}

export async function fetchCandles(coinId, tf = "1m", limit = 120) {
  return platformFetch(`${API_PREFIX}/market/coins/${coinId}/candles`, {
    query: { tf, limit: String(limit) },
  });
}

export async function fetchTradeQuote(coinId, direction, amountIn, slippageBps = 500) {
  return platformFetch(`${API_PREFIX}/trade/quote`, {
    query: {
      coinId,
      direction,
      amountIn: String(amountIn),
      slippageBps: String(slippageBps),
    },
  });
}

// ── Profile & wallet ──────────────────────────────────────────────────────────

export async function fetchProfile(wallet) {
  return platformFetch(`${API_PREFIX}/profile/${wallet}`);
}

export async function fetchBalance(wallet) {
  return platformFetch(`${API_PREFIX}/wallet/${wallet}/balance`);
}

// ── Mutations (require auth token) ────────────────────────────────────────────

export async function createCoin(payload, authToken) {
  return platformFetch(`${API_PREFIX}/coins`, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` },
    body: JSON.stringify(payload),
    timeout: 120000,
  });
}

export async function buyCoin({ coinId, solAmount, slippageBps = 500, authToken, idempotencyKey }) {
  return platformFetch(`${API_PREFIX}/trade/buy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Idempotency-Key": idempotencyKey || newIdempotencyKey("buy"),
    },
    body: JSON.stringify({
      coinId,
      solAmountLamports: toLamports(solAmount),
      minTokensOut: "0",
      slippageBps,
    }),
  });
}

export async function sellCoin({ coinId, tokenAmount, slippageBps = 500, authToken, idempotencyKey }) {
  return platformFetch(`${API_PREFIX}/trade/sell`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Idempotency-Key": idempotencyKey || newIdempotencyKey("sell"),
    },
    body: JSON.stringify({
      coinId,
      tokenAmountRaw: toTokenRaw(tokenAmount),
      minSolOut: "0",
      slippageBps,
    }),
  });
}

export async function withdrawSol({ wallet, destination, amount, authToken, idempotencyKey }) {
  return platformFetch(`${API_PREFIX}/wallet/withdraw`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Idempotency-Key": idempotencyKey || newIdempotencyKey("withdraw"),
    },
    body: JSON.stringify({ wallet, destination, amount: Number(amount), idempotencyKey }),
  });
}

export async function claimRewards({ wallet, kind, authToken }) {
  return platformFetch(`${API_PREFIX}/rewards/claim`, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ wallet, kind }),
  });
}

export async function bindReferrer({ wallet, referrer, authToken }) {
  return platformFetch(`${API_PREFIX}/referral/bind`, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ wallet, referrer }),
  });
}

export async function revealMnemonic({ wallet, authToken }) {
  return platformFetch(`${API_PREFIX}/wallet/reveal-mnemonic`, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ wallet }),
  });
}

/** Map platform on-chain create response for UI compatibility. */
export function normalizeCreateResponse(json) {
  if (json?.mode === "onchain") {
    return {
      ok: true,
      onchain: true,
      signature: json.signature,
      mintAddress: json.mintAddress,
      status: json.status,
      txId: json.txId,
    };
  }
  return {
    ok: true,
    onchain: false,
    coin: json.coin,
    ...json,
  };
}

/** Map platform on-chain trade response to legacy-ish shape for UI compatibility. */
export function normalizeTradeResponse(json, tradeMode) {
  if (json?.mode === "onchain") {
    return {
      ok: true,
      onchain: true,
      signature: json.signature,
      status: json.status,
      txId: json.txId,
      coinId: json.coinId,
      tradeType: json.tradeType || tradeMode,
    };
  }
  return {
    ok: true,
    onchain: false,
    coin: json.coin,
    tokens: json.tokenAmount ? Number(json.tokenAmount) / 10 ** 6 : undefined,
    ...json,
  };
}
