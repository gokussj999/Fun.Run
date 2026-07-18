import React from "react";

const MINI_TONES = {
  good: {
    background: "color-mix(in srgb, var(--primary) 14%, transparent)",
    border: "1px solid color-mix(in srgb, var(--primary) 32%, transparent)",
    color: "var(--primary)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.08)",
  },
  success: {
    background: "var(--fr-buy, #0a9b68)",
    border: "1px solid var(--fr-buy, #0a9b68)",
    color: "var(--fr-buy-text, #03180f)",
    boxShadow: "0 8px 20px rgba(10,155,104,.2)",
  },
  danger: {
    background: "var(--fr-sell, #d63d52)",
    border: "1px solid var(--fr-sell, #d63d52)",
    color: "#fff",
    boxShadow: "0 8px 20px rgba(214,61,82,.2)",
  },
  default: {
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
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
        borderRadius: 14,
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: ".2px",
        opacity: disabled ? 0.55 : 1,
        transition: "transform .14s ease, border-color .16s ease, background .16s ease, box-shadow .16s ease, opacity .16s ease",
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
        borderRadius: 16,
        fontSize: 14,
        fontWeight: 1000,
        letterSpacing: ".2px",
        color: "var(--btnText, #0B0E11)",
        background: "linear-gradient(180deg, var(--primary), var(--primary2))",
        boxShadow: "0 14px 30px rgba(252, 213, 53, 0.2), inset 0 1px 0 rgba(255,255,255,.24)",
        transition: "transform .16s ease, filter .16s ease, box-shadow .16s ease, opacity .16s ease",
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
