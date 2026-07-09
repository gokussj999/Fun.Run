import React from "react";
import { MiniBtn, PrimaryButton } from "../ui/Button.jsx";
import { Badge } from "../ui/Badge.jsx";

export function Hero({ onEnterApp, stats }) {
  return (
    <section className="landingHero" id="top">
      <div className="landingHeroGlow" aria-hidden="true" />
      <div className="landingContainer landingHeroGrid">
        <div>
          <div className="landingHeroBadge">
            <span className="landingLiveDot" aria-hidden="true" />
            Live on Solana Devnet
          </div>

          <h1 className="landingHeroTitle">
            Launch memes. <span>Trade like a pro.</span>
          </h1>

          <p className="landingHeroText">
            Fun.Run is the next generation Solana launchpad for creators and traders — instant bonding-curve
            trading, creator rewards, and 50% affiliate earnings in one smooth experience.
          </p>

          <div className="landingHeroCtas">
            <MiniBtn tone="good" onClick={() => onEnterApp?.("CREATE")} style={{ padding: "12px 18px", fontSize: 13 }}>
              Launch a Coin
            </MiniBtn>
            <MiniBtn onClick={() => onEnterApp?.("SEARCH")} style={{ padding: "12px 18px", fontSize: 13 }}>
              Explore Markets
            </MiniBtn>
            <MiniBtn onClick={() => onEnterApp?.("HOME")} style={{ padding: "12px 18px", fontSize: 13 }}>
              Open App
            </MiniBtn>
          </div>
        </div>

        <div className="landingHeroPanel">
          <div className="landingHeroPanelHead">
            <div className="landingHeroPanelTitle">Platform pulse</div>
            <Badge tone="success">Live</Badge>
          </div>

          <div className="landingStatsGrid">
            {stats.map((item) => (
              <div key={item.label} className="landingStatCard">
                <div className="landingStatValue">{item.value}</div>
                <div className="landingStatLabel">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="landingHeroPanelCta">
            <PrimaryButton onClick={() => onEnterApp?.("HOME")}>Start Trading</PrimaryButton>
          </div>
        </div>
      </div>
    </section>
  );
}
