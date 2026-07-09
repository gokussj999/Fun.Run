import React from "react";

export function AppShell({ children, className = "" }) {
  return <main className={`appShell ${className}`.trim()}>{children}</main>;
}
