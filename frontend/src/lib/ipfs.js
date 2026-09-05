const ENV_GATEWAY = String(import.meta.env.VITE_IPFS_GATEWAY || "")
  .trim()
  .replace(/\/$/, "");

const DEFAULT_PINATA = "https://green-dear-opossum-265.mypinata.cloud";

export const IPFS_GATEWAYS = [
  `${ENV_GATEWAY || DEFAULT_PINATA}/ipfs/`,
  "https://w3s.link/ipfs/",
  "https://nftstorage.link/ipfs/",
  "https://ipfs.io/ipfs/",
];

const CID_RE = /(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z0-9]{50,}|bafy[a-z0-9]{50,})/i;

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

export function pinataOptimizedUrl(cid, size = 96) {
  const id = String(cid || "").trim();
  if (!id) return "";
  const dim = thumbDim(size);
  return `${IPFS_GATEWAYS[0]}${id}?img-width=${dim}&img-height=${dim}&img-fit=cover&img-format=webp`;
}

export function ipfsGatewayUrls(cid, size = 96) {
  const id = String(cid || "").trim();
  if (!id) return [];
  return IPFS_GATEWAYS.map((gw, i) => {
    if (i === 0 && gw.includes("mypinata.cloud")) return pinataOptimizedUrl(id, size);
    return `${gw}${id}`;
  });
}

export function publicIpfsUrl(urlOrCid, size = 96) {
  const cid = extractIpfsCid(urlOrCid);
  if (!cid) return "";
  return pinataOptimizedUrl(cid, size);
}
