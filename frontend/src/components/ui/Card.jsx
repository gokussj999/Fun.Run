import React from "react";

export function Card({ children, style, bleed = false, className = "" }) {
  return (
    <div className={`card ${className}`.trim()} style={style}>
      <div className={bleed ? "cardBody bleed" : "cardBody"}>{children}</div>
    </div>
  );
}
