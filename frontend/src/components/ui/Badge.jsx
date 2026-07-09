import React from "react";

export function Badge({ children, style, className = "" }) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 900,
        color: "var(--primary)",
        background: "rgba(252, 213, 53, 0.1)",
        border: "1px solid rgba(252, 213, 53, 0.22)",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
