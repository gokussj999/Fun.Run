import React, { useEffect } from "react";

const TONES = {
  default: {
    bg: "rgba(11, 15, 25, 0.97)",
    border: "rgba(148, 163, 184, 0.18)",
    icon: null,
  },
  success: {
    bg: "rgba(8, 28, 18, 0.97)",
    border: "rgba(34, 197, 94, 0.28)",
    icon: "✓",
  },
  error: {
    bg: "rgba(36, 10, 14, 0.97)",
    border: "rgba(239, 68, 68, 0.30)",
    icon: "✕",
  },
  warning: {
    bg: "rgba(34, 24, 8, 0.97)",
    border: "rgba(245, 158, 11, 0.28)",
    icon: "!",
  },
};

export function Toast({ text, message, type = "default", onClose, duration = 3200 }) {
  const content = message ?? text;

  useEffect(() => {
    if (!content) return;
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [content, duration, onClose]);

  if (!content) return null;

  const tone = TONES[type] || TONES.default;

  return (
    <div
      role="status"
      aria-live="polite"
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
        boxShadow: "0 18px 60px rgba(0,0,0,.45)",
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
      <span style={{ fontSize: 10, opacity: 0.4, flexShrink: 0, marginLeft: 4 }}>✕</span>
    </div>
  );
}
