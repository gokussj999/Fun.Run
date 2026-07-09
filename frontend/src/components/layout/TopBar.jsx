import React from "react";

export function TopBar({
  logoUrl,
  title = "Fun.Run",
  subtitle = "The Next Generation Solana Launchpad",
  onHome,
}) {
  return (
    <header className="topbar">
      <div className="topbarInner">
        <button
          type="button"
          className="brand"
          onClick={onHome}
          style={{
            cursor: "pointer",
            border: "none",
            background: "transparent",
            padding: 0,
            textAlign: "left",
          }}
          aria-label="Go to home"
        >
          <div className="brandLogo">
            <img src={logoUrl} alt="" />
          </div>
          <div className="brandText">
            <div className="brandTitle">{title}</div>
            <div className="brandSub">{subtitle}</div>
          </div>
        </button>
      </div>
    </header>
  );
}
