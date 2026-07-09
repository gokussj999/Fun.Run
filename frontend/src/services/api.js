import { env } from "../lib/env.js";

const API_BASE = env.apiBase;

export async function api(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout || 30000);
  const base = String(API_BASE || "").replace(/\/$/, "");
  const url = base ? `${base}${path}` : path;

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
      throw new Error(json?.error || `Request failed (${res.status})`);
    }

    return json || {};
  } catch (e) {
    if (e?.name === "AbortError") throw new Error("Request timeout");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export function getApiBase() {
  return String(API_BASE || "").replace(/\/$/, "");
}
