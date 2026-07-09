import React from "react";

export function ScreenShell({ children, className = "" }) {
  return <div className={`fr-screenShell midCol ${className}`.trim()}>{children}</div>;
}
