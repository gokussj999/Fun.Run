import React from "react";
import { tokens } from "../../lib/design-tokens.js";

const PREVIEW = {
  calm: { mode: "Dark", c: [tokens.primary, tokens.secondary, tokens.accent] },
  ocean: { mode: "Dark", c: ["#3B82F6", "#2563EB", "#60A5FA"] },
  royal: { mode: "Dark", c: ["#A78BFA", tokens.warning, "#C4B5FD"] },
  neon: { mode: "Dark", c: ["#14F195", "#059669", "#34D399"] },
  rose: { mode: "Dark", c: ["#F6465D", "#DC2626", "#FB7185"] },
  light: { mode: "Light", c: [tokens.primary, tokens.secondary, tokens.info] },
  paper: { mode: "Light", c: ["#C2410C", "#0D9488", "#B45309"] },
};

export function ThemeOption({ theme, current, setTheme, label }) {
  const active = current === theme;
  const preview = PREVIEW[theme] || PREVIEW.calm;

  return (
    <button
      type="button"
      className={`themeOption ${active ? "active" : ""}`}
      onClick={() => setTheme(theme)}
    >
      <div className="themeOptionInner">
        <div>
          <div className="themeOptionLabel">{label || theme}</div>
          <div className="themeOptionMeta">
            {preview.mode}
            {active ? " • Active" : ""}
          </div>
        </div>
        <div className="themeOptionSwatches">
          {preview.c.map((col, i) => (
            <span key={i} className="themeOptionSwatch" style={{ background: col }} />
          ))}
        </div>
      </div>
    </button>
  );
}
