import React from "react";

export function CoinLogo({ c, size = 44, radius = 14 }) {
  const src = String(c?.logo || "")
    .replace("https://gateway.pinata.cloud/ipfs/", "https://ipfs.io/ipfs/")
    .trim();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: "hidden",
        flex: `0 0 ${size}px`,
        border: "1px solid var(--border)",
        background: "var(--surface2)",
        display: "grid",
        placeItems: "center",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={c?.symbol || "coin"}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div style={{ fontSize: 12, fontWeight: 1000, color: "var(--muted)" }}>
          {String(c?.symbol || c?.name || "?").slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}
