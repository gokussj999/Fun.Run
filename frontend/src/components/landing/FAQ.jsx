import React, { useState } from "react";

const ITEMS = [
  {
    q: "What is Fun.Run?",
    a: "Fun.Run is the next generation Solana launchpad. Creators launch tokens on a bonding curve, traders buy and sell instantly, and fees flow to creators, referrers, and the platform.",
  },
  {
    q: "How do I launch a coin?",
    a: "Open the app, sign in with Google, tap Create, add your name, symbol, logo, and optional initial buy. Your coin goes live on the bonding curve immediately.",
  },
  {
    q: "How do creator rewards work?",
    a: "A share of every trade fee on your coin is credited to your creator balance. Claim rewards from your profile when you are ready.",
  },
  {
    q: "What is the affiliate program?",
    a: "Share your referral link. When users you refer trade on Fun.Run, you earn referral rewards — up to 50% of the platform fee share.",
  },
  {
    q: "Is this on mainnet?",
    a: "The protocol is deployed on Solana devnet for testing. Mainnet launch will follow security review and production infrastructure rollout.",
  },
  {
    q: "Do I need a crypto wallet?",
    a: "No external wallet is required to start. Fun.Run creates an embedded Solana wallet on login. You can also connect Phantom for additional flexibility.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="landingSection" id="faq">
      <div className="landingContainer">
        <h2 className="landingSectionTitle">FAQ</h2>
        <p className="landingSectionSub">Quick answers for creators, traders, and affiliates getting started on Fun.Run.</p>

        <div className="landingFaqList">
          {ITEMS.map((item, index) => {
            const open = openIndex === index;

            return (
              <div key={item.q} className="landingFaqItem">
                <button
                  type="button"
                  className="landingFaqBtn"
                  aria-expanded={open}
                  onClick={() => setOpenIndex(open ? -1 : index)}
                >
                  <span>{item.q}</span>
                  <span aria-hidden="true" style={{ color: "var(--muted2)", fontSize: 18 }}>
                    {open ? "−" : "+"}
                  </span>
                </button>
                {open ? <div className="landingFaqAnswer">{item.a}</div> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
