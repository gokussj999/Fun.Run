import React, { useEffect, useMemo, useState } from "react";
import { extractIpfsCid, ipfsGatewayUrls } from "../../lib/ipfs.js";
import { getApiBase } from "../../services/api.js";

function logoCandidates(c, size = 44) {
  const logo = String(c?.logo || "").trim();
  const id = String(c?.id || "").trim();
  const cid = extractIpfsCid(logo);
  const thumb = Math.min(256, Math.max(96, Math.round(Number(size) || 44) * 2));
  const out = [];
  const seen = new Set();
  const push = (url) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push(url);
  };

  if (cid) {
    ipfsGatewayUrls(cid, thumb).forEach(push);
  } else if (logo && !logo.startsWith("data:")) {
    push(logo);
  }

  const base = String(getApiBase() || "").replace(/\/$/, "");
  if (id && base && (cid || logo.startsWith("data:") || c?.hasLogo)) {
    push(`${base}/coin/${encodeURIComponent(id)}/logo`);
  }

  if (logo.startsWith("data:") && (logo.length < 120_000 || !id)) {
    push(logo);
  }

  return out;
}

export const CoinLogo = React.memo(function CoinLogo({
  c,
  size = 44,
  radius = 14,
  priority = false,
}) {
  const candidates = useMemo(
    () => logoCandidates(c, size),
    [c?.logo, c?.id, c?.hasLogo, size]
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [c?.logo, c?.id]);

  const src = candidates[index] || "";
  const initials = String(c?.symbol || c?.name || "?").slice(0, 2).toUpperCase();

  return (
    <div
      className="coinLogo"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flex: `0 0 ${size}px`,
      }}
    >
      <span className="coinLogoFallback">{initials}</span>
      {src ? (
        <img
          src={src}
          alt={c?.symbol || "coin"}
          width={size}
          height={size}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          onError={() => setIndex((i) => i + 1)}
        />
      ) : null}
    </div>
  );
});
