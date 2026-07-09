import React from "react";
import { MiniBtn } from "../ui/Button.jsx";

export function LandingNav({ logoUrl, onEnterApp, onScrollTo }) {
  return (
    <header className="landingNav">
      <div className="landingContainer landingNavInner">
        <button type="button" className="landingBrand" onClick={() => onScrollTo?.("top")}>
          <img src={logoUrl} alt="" />
          <div>
            <div className="landingBrandTitle">Fun.Run</div>
            <div className="landingBrandSub">The Next Generation Solana Launchpad</div>
          </div>
        </button>

        <div className="landingNavActions">
          <MiniBtn onClick={() => onScrollTo?.("trending")}>Trending</MiniBtn>
          <MiniBtn onClick={() => onEnterApp?.("SEARCH")}>Explore</MiniBtn>
          <MiniBtn tone="good" onClick={() => onEnterApp?.("CREATE")}>
            Launch
          </MiniBtn>
        </div>
      </div>
    </header>
  );
}
