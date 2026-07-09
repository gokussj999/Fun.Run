import React from "react";

export function Pill({ children, style, className = "" }) {
  return (
    <span className={`pill ${className}`.trim()} style={style}>
      {children}
    </span>
  );
}
