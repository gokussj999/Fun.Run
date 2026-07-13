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
    padding: "13px 14px",
    borderRadius: 16,
    border: "1px solid var(--inputBorder)",
    background: "var(--inputBg)",
    color: "var(--text)",
    outline: "none",
    fontSize: 15,
    fontWeight: 700,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
    transition: "border-color .16s ease, box-shadow .16s ease, background .16s ease",
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
    <div className="frInputWrap" style={{ position: "relative" }}>
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
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
          }}
        >
          {rightLabel}
        </button>
      ) : null}
    </div>
  );
}
