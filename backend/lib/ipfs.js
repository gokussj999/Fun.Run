import NodeCache from "node-cache";

const PINATA_GATEWAY = String(
  process.env.PINATA_GATEWAY || "https://green-dear-opossum-265.mypinata.cloud"
).replace(/\/$/, "");

export const IPFS_GATEWAYS = [
  `${PINATA_GATEWAY}/ipfs/`,
  "https://w3s.link/ipfs/",
  "https://nftstorage.link/ipfs/",
  "https://ipfs.io/ipfs/",
];

const CID_RE = /(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z0-9]{50,}|bafy[a-z0-9]{50,})/i;
const FETCH_TIMEOUT_MS = 8000;
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

const logoBufCache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 120,
  maxKeys: 400,
  useClones: false,
});

export function extractIpfsCid(url) {
  const s = String(url || "").trim();
  if (!s || s.startsWith("data:")) return "";
  if (s.startsWith("ipfs://")) {
    return s.slice(7).replace(/^ipfs\//, "").split(/[/?#]/)[0];
  }
  const ipfsIdx = s.indexOf("/ipfs/");
  if (ipfsIdx !== -1) {
    return s.slice(ipfsIdx + 6).split(/[/?#]/)[0];
  }
  const m = s.match(CID_RE);
  return m ? m[1] : "";
}

function thumbDim(size = 96) {
  const n = Math.round(Number(size) || 96);
  return Math.max(64, Math.min(512, n));
}

export function publicIpfsUrl(urlOrCid, size = 256) {
  const raw = String(urlOrCid || "").trim();
  if (!raw || raw.startsWith("data:")) return "";
  const cid = extractIpfsCid(raw);
  if (!cid) return "";
  const dim = thumbDim(size);
  return `${IPFS_GATEWAYS[0]}${cid}?img-width=${dim}&img-height=${dim}&img-fit=cover&img-format=webp`;
}

export function storedIpfsUrl(cidOrUrl) {
  const cid = extractIpfsCid(cidOrUrl) || String(cidOrUrl || "").trim();
  if (!cid || cid.startsWith("data:")) return "";
  return `${IPFS_GATEWAYS[0]}${cid}`;
}

export function slimListLogo(logo) {
  const raw = String(logo || "");
  if (!raw) return "";
  if (raw.startsWith("data:")) return "";
  return publicIpfsUrl(raw, 128) || raw;
}

export async function fetchIpfsBuffer(cid) {
  const key = `ipfs:${cid}`;
  const cached = logoBufCache.get(key);
  if (cached) return cached;

  const urls = [
    publicIpfsUrl(cid, 256),
    ...IPFS_GATEWAYS.map((gw) => `${gw}${cid}`),
  ].filter(Boolean);

  for (const url of urls) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { Accept: "image/*,*/*;q=0.8" },
      });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (!buf.length || buf.length > MAX_LOGO_BYTES) continue;
      const headerType = String(res.headers.get("content-type") || "");
      const contentType = headerType.startsWith("image/") ? headerType.split(";")[0] : "image/webp";
      const payload = { buffer: buf, contentType };
      logoBufCache.set(key, payload);
      return payload;
    } catch {
      // try next gateway
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

export function decodeDataLogo(logo) {
  const m = String(logo || "").match(/^data:(.+?);base64,(.+)$/);
  if (!m) return null;
  const buffer = Buffer.from(m[2], "base64");
  if (!buffer.length || buffer.length > MAX_LOGO_BYTES) return null;
  return { buffer, contentType: m[1] || "image/webp" };
}

export function getCachedLogo(cacheKey) {
  return logoBufCache.get(cacheKey) || null;
}

export function setCachedLogo(cacheKey, payload) {
  logoBufCache.set(cacheKey, payload);
}
