import React from "react";
import { MiniBtn } from "../ui/Button.jsx";

export function Footer({ logoUrl, onEnterApp, onScrollTo }) {
  return (
    <footer className="landingFooter">
      <div className="landingContainer">
        <div className="landingFooterGrid">
          <div>
            <div className="landingFooterBrand">
              <img src={logoUrl} alt="" />
              <div className="landingFooterBrandName">Fun.Run</div>
            </div>
            <p className="landingFooterTagline">
              The Next Generation Solana Launchpad — launch fast, trade smooth, earn rewards.
            </p>
            <div className="landingFooterCtas">
              <MiniBtn tone="good" onClick={() => onEnterApp?.("CREATE")}>
                Launch
              </MiniBtn>
              <MiniBtn onClick={() => onEnterApp?.("HOME")}>
                Open App
              </MiniBtn>
            </div>
          </div>

          <div>
            <div className="landingFooterColTitle">Product</div>
            <div className="landingFooterLinks">
              <button type="button" className="landingFooterLink" onClick={() => onScrollTo?.("trending")}>
                Trending
              </button>
              <button type="button" className="landingFooterLink" onClick={() => onScrollTo?.("features")}>
                Features
              </button>
              <button type="button" className="landingFooterLink" onClick={() => onScrollTo?.("faq")}>
                FAQ
              </button>
              <button type="button" className="landingFooterLink" onClick={() => onEnterApp?.("SEARCH")}>
                Explore Coins
              </button>
            </div>
          </div>

          <div>
            <div className="landingFooterColTitle">Creators</div>
            <div className="landingFooterLinks">
              <button type="button" className="landingFooterLink" onClick={() => onEnterApp?.("CREATE")}>
                Create Coin
              </button>
              <button type="button" className="landingFooterLink" onClick={() => onEnterApp?.("PROFILE")}>
                Profile & Rewards
              </button>
              <button type="button" className="landingFooterLink" onClick={() => onEnterApp?.("HOME")}>
                Trading App
              </button>
            </div>
          </div>
        </div>

        <div className="landingFooterBottom">
          <span>© {new Date().getFullYear()} Fun.Run. All rights reserved.</span>
          <span>Solana devnet • Protocol RC1</span>
        </div>
      </div>
    </footer>
  );
}
