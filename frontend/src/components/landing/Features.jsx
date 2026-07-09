import React from "react";

const FEATURES = [
  {
    icon: "🚀",
    title: "Launch in seconds",
    text: "Create SPL meme coins with logo, story, and instant bonding-curve liquidity — no complex setup.",
  },
  {
    icon: "📈",
    title: "Pro-grade trading UX",
    text: "Charts, live prices, and smooth buy/sell flows designed for speed on mobile and desktop.",
  },
  {
    icon: "💰",
    title: "Creator rewards",
    text: "Earn fees automatically from every trade on coins you launch — built into the protocol.",
  },
  {
    icon: "🤝",
    title: "50% affiliate program",
    text: "Share your referral link and earn platform rewards when your network trades.",
  },
  {
    icon: "🔒",
    title: "Custodial + wallet connect",
    text: "Google login with embedded Solana wallets, plus Phantom support for power users.",
  },
  {
    icon: "🌐",
    title: "Built for Solana",
    text: "Anchor program on devnet today — enterprise-grade architecture for mainnet scale.",
  },
];

export function Features() {
  return (
    <section className="landingSection" id="features">
      <div className="landingContainer">
        <h2 className="landingSectionTitle">Why Fun.Run</h2>
        <p className="landingSectionSub">
          The next generation launchpad experience — faster launches, cleaner trading, and better creator economics than legacy meme platforms.
        </p>

        <div className="landingFeaturesGrid">
          {FEATURES.map((item) => (
            <article key={item.title} className="landingFeatureCard">
              <div className="landingFeatureIcon" aria-hidden="true">
                {item.icon}
              </div>
              <div className="landingFeatureTitle">{item.title}</div>
              <p className="landingFeatureText">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
