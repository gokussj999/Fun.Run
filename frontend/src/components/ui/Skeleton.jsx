import React from "react";

const SHIMMER_CSS = `
@keyframes fr-skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.fr-skeleton {
  background: linear-gradient(
    90deg,
    rgba(148, 163, 184, 0.07) 0%,
    rgba(252, 213, 53, 0.11) 48%,
    rgba(148, 163, 184, 0.07) 100%
  );
  background-size: 200% 100%;
  animation: fr-skeleton-shimmer 1.35s ease-in-out infinite;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
}

@media (prefers-reduced-motion: reduce) {
  .fr-skeleton {
    animation: none;
  }
}
`;

let skeletonStylesInjected = false;

function ensureSkeletonStyles() {
  if (skeletonStylesInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = SHIMMER_CSS;
  document.head.appendChild(style);
  skeletonStylesInjected = true;
}

export function Skeleton({ width = "100%", height = 14, circle = false, style, className = "" }) {
  ensureSkeletonStyles();

  return (
    <div
      className={`fr-skeleton ${className}`.trim()}
      style={{
        width,
        height,
        borderRadius: circle ? "50%" : 12,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export function CoinRowSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 2px",
        borderBottom: "1px solid var(--borderSoft)",
      }}
    >
      <Skeleton width={44} height={44} circle />
      <div style={{ flex: 1, display: "grid", gap: 8 }}>
        <Skeleton width="58%" height={14} />
        <Skeleton width="42%" height={11} />
      </div>
      <div style={{ display: "grid", gap: 8, width: 72 }}>
        <Skeleton width="100%" height={14} />
        <Skeleton width="72%" height={11} style={{ marginLeft: "auto" }} />
      </div>
    </div>
  );
}

export function CoinListSkeleton({ count = 5 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <CoinRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 280 }) {
  return (
    <div
      style={{
        width: "100%",
        height,
        borderRadius: 0,
        overflow: "hidden",
        background: "rgba(17,24,39,.55)",
        borderTop: "1px solid var(--borderSoft)",
        padding: 16,
        display: "grid",
        alignContent: "end",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: "72%" }}>
        {[42, 68, 54, 88, 62, 96, 74, 58, 82, 66, 90, 52].map((h, i) => (
          <Skeleton
            key={i}
            width={12}
            height={`${h}%`}
            style={{ borderRadius: 6, alignSelf: "end" }}
          />
        ))}
      </div>
      <Skeleton width="36%" height={12} />
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Skeleton width={72} height={72} circle />
        <div style={{ flex: 1, display: "grid", gap: 10 }}>
          <Skeleton width="48%" height={18} />
          <Skeleton width="64%" height={12} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Skeleton height={66} />
        <Skeleton height={66} />
      </div>
    </div>
  );
}

export function StatCardSkeleton({ count = 2 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: count > 1 ? "repeat(2, 1fr)" : "1fr",
        gap: 10,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={66} />
      ))}
    </div>
  );
}
