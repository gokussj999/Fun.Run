import React, { useEffect } from "react";

const TONES_DARK = {
  default: {
    bg: "rgba(30, 35, 41, 0.97)",
    border: "rgba(148, 163, 184, 0.22)",
    icon: null,
  },
  success: {
    bg: "rgba(8, 40, 28, 0.97)",
    border: "rgba(10, 155, 104, 0.35)",
    icon: "✓",
  },
  error: {
    bg: "rgba(48, 16, 22, 0.97)",
    border: "rgba(214, 61, 82, 0.35)",
    icon: "✕",
  },
  warning: {
    bg: "rgba(48, 36, 10, 0.97)",
    border: "rgba(240, 185, 11, 0.35)",
    icon: "!",
  },
};

const TONES_LIGHT = {
  default: {
    bg: "#F0F1F3",
    border: "rgba(30, 35, 41, 0.14)",
    icon: null,
  },
  success: {
    bg: "#E6F5EE",
    border: "rgba(10, 155, 104, 0.35)",
    icon: "✓",
  },
  error: {
    bg: "#F8E8EB",
    border: "rgba(214, 61, 82, 0.35)",
    icon: "✕",
  },
  warning: {
    bg: "#F8F1DE",
    border: "rgba(240, 185, 11, 0.4)",
    icon: "!",
  },
};

function isLightMode() {
  try {
    return document.documentElement.getAttribute("data-mode") === "light";
  } catch {
    return false;
  }
}

export function Toast({ text, message, type = "default", onClose, duration = 3200 }) {
  const content = message ?? text;

  useEffect(() => {
    if (!content) return;
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [content, duration, onClose]);

  if (!content) return null;

  const light = isLightMode();
  const tones = light ? TONES_LIGHT : TONES_DARK;
  const tone = tones[type] || tones.default;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`frToast ${light ? "frToast--light" : "frToast--dark"}`}
      onClick={() => onClose?.()}
      style={{
        position: "fixed",
        top: 18,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999,
        padding: "12px 16px",
        borderRadius: 14,
        border: `1px solid ${tone.border}`,
        background: tone.bg,
        color: "var(--text)",
        boxShadow: light
          ? "0 8px 28px rgba(30, 35, 41, 0.12)"
          : "0 18px 60px rgba(0,0,0,.45)",
        fontSize: 13,
        fontWeight: 900,
        maxWidth: "calc(100% - 32px)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        userSelect: "none",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        lineHeight: 1.4,
        animation: "fr-toast-in .22s ease-out",
      }}
    >
      <style>{`
        @keyframes fr-toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {tone.icon ? (
        <span style={{ fontSize: 11, opacity: 0.85, flexShrink: 0 }}>{tone.icon}</span>
      ) : null}
      <span>{content}</span>
      <span style={{ fontSize: 10, opacity: 0.45, flexShrink: 0, marginLeft: 4 }}>✕</span>
    </div>
  );
}
