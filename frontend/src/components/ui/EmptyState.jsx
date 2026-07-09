import React from "react";
import { MiniBtn } from "./Button.jsx";

export function EmptyState({
  icon = "📭",
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
  style,
}) {
  return (
    <div
      style={{
        display: "grid",
        justifyItems: "center",
        textAlign: "center",
        gap: compact ? 8 : 12,
        padding: compact ? "18px 12px" : "28px 18px",
        borderRadius: 16,
        border: "1px dashed var(--borderSoft)",
        background: "var(--bg2)",
        ...style,
      }}
    >
      <div style={{ fontSize: compact ? 24 : 30, lineHeight: 1 }}>{icon}</div>

      {title ? (
        <div
          style={{
            fontSize: compact ? 14 : 15,
            fontWeight: 1000,
            color: "var(--text)",
            letterSpacing: ".15px",
          }}
        >
          {title}
        </div>
      ) : null}

      {description ? (
        <div
          style={{
            maxWidth: 320,
            fontSize: compact ? 12 : 13,
            lineHeight: 1.55,
            color: "var(--muted2)",
          }}
        >
          {description}
        </div>
      ) : null}

      {actionLabel && onAction ? (
        <MiniBtn tone="good" onClick={onAction} style={{ marginTop: 4 }}>
          {actionLabel}
        </MiniBtn>
      ) : null}
    </div>
  );
}
