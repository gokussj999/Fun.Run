import React from "react";

const MINI_TONES = {
  good: {
    background: "color-mix(in srgb, var(--primary) 14%, transparent)",
    border: "1px solid color-mix(in srgb, var(--primary) 32%, transparent)",
    color: "var(--primary)",
    boxShadow: "none",
  },
  success: {
    background: "var(--good)",
    border: "1px solid var(--good)",
    color: "var(--btnText)",
    boxShadow: "none",
  },
  danger: {
    background: "rgba(246, 70, 93, 0.12)",
    border: "1px solid rgba(246, 70, 93, 0.28)",
    color: "#F6465D",
  },
  default: {
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  },
};

function pressHandlers(disabled) {
  return {
    onMouseDown: (e) => {
      if (!disabled) e.currentTarget.style.transform = "scale(0.96)";
    },
    onMouseUp: (e) => {
      if (!disabled) e.currentTarget.style.transform = "scale(1)";
    },
    onMouseLeave: (e) => {
      if (!disabled) e.currentTarget.style.transform = "scale(1)";
    },
  };
}

export function MiniBtn({ children, onClick, disabled, tone = "default", style, className = "" }) {
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      style={{
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "10px 13px",
        borderRadius: 16,
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: ".2px",
        opacity: disabled ? 0.55 : 1,
        transition: "all .15s ease",
        ...MINI_TONES[tone] || MINI_TONES.default,
        ...style,
      }}
      {...pressHandlers(disabled)}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({ children, onClick, disabled, style, className = "" }) {
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "14px 16px",
        borderRadius: 18,
        fontSize: 14,
        fontWeight: 1000,
        letterSpacing: ".2px",
        color: "var(--btnText, #0B0E11)",
        background: "var(--primary)",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.28)",
        transition: "all .18s ease",
        transform: disabled ? "none" : "translateY(0)",
        opacity: disabled ? 0.55 : 1,
        ...style,
      }}
      {...pressHandlers(disabled)}
    >
      {children}
    </button>
  );
}
