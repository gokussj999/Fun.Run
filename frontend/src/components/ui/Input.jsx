import React from "react";

export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  textarea = false,
  rows = 4,
  style,
  rightLabel,
  onRightLabelClick,
}) {
  const baseStyle = {
    width: "100%",
    padding: "12px 13px",
    borderRadius: 14,
    border: "1px solid var(--inputBorder)",
    background: "var(--inputBg)",
    color: "var(--text)",
    outline: "none",
    fontSize: 14,
  };

  if (textarea) {
    return (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={{
          ...baseStyle,
          resize: "vertical",
          minHeight: 110,
          ...style,
        }}
      />
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type === "number" ? "text" : type}
        inputMode={type === "number" ? "decimal" : undefined}
        style={{
          ...baseStyle,
          paddingRight: rightLabel ? 76 : undefined,
          ...style,
        }}
      />
      {rightLabel ? (
        <button
          type="button"
          onClick={onRightLabelClick}
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            border: "1px solid var(--border)",
            background: "var(--surface2)",
            color: "var(--text)",
            borderRadius: 12,
            padding: "7px 10px",
            fontSize: 11,
            fontWeight: 1000,
            cursor: "pointer",
          }}
        >
          {rightLabel}
        </button>
      ) : null}
    </div>
  );
}
