import React, { useEffect, useRef, useState } from "react";

const C = {
  bg: "#020d1a",
  surface: "#071426",
  border: "rgba(56,189,248,0.15)",
  accent: "#38bdf8",
  accentDim: "rgba(56,189,248,0.12)",
  accentGlow: "rgba(56,189,248,0.25)",
  text: "#e2f4fd",
  muted: "#7db8d4",
  muted2: "#3a6a84",
  green: "#34d399",
  yellow: "#fbbf24",
};

const APP_URL = "https://funrun.site";

/* ── Geometry canvas ─────────────────────────────────── */
function CrystalBg() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let t = 0;

    const rects = Array.from({ length: 7 }, (_, i) => ({
      x: 0.1 + i * 0.13,
      y: 0.05 + (i % 3) * 0.3,
      w: 120 + i * 30,
      h: 80 + i * 20,
      rot: (i * Math.PI) / 5,
      speed: 0.0003 + i * 0.00008,
    }));

    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.5 + 0.3,
      a: Math.random(),
    }));

    function draw() {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // grid
      ctx.strokeStyle = "rgba(14,165,233,0.06)";
      ctx.lineWidth = 1;
      const step = 60;
      for (let x = 0; x < W; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // stars
      stars.forEach(s => {
        const pulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.5 + s.a * 10));
        ctx.fillStyle = `rgba(56,189,248,${0.3 * pulse})`;
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // crystal rects
      rects.forEach((r, i) => {
        const angle = r.rot + t * r.speed;
        const cx = r.x * W;
        const cy = r.y * H;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        const alpha = 0.06 + 0.04 * Math.sin(t * 0.3 + i);
        ctx.strokeStyle = `rgba(56,189,248,${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-r.w / 2, -r.h / 2, r.w, r.h);
        // inner
        ctx.strokeStyle = `rgba(56,189,248,${alpha * 0.5})`;
        ctx.strokeRect(-r.w / 3, -r.h / 3, r.w * 0.67, r.h * 0.67);
        ctx.restore();
      });

      t += 0.016;
      raf = requestAnimationFrame(draw);
    }

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas ref={ref} style={{
      position: "fixed", inset: 0, width: "100%", height: "100%",
      zIndex: 0, pointerEvents: "none",
    }} />
  );
}

/* ── Small helpers ───────────────────────────────────── */
function Chip({ color = C.accent, children }) {
  return (
    <span style={{
      background: `${color}18`, color, border: `1px solid ${color}30`,
      borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 700,
      letterSpacing: 0.5, textTransform: "uppercase",
    }}>{children}</span>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 18, padding: "28px 24px",
      backdropFilter: "blur(10px)", ...style,
    }}>{children}</div>
  );
}

function PrimaryBtn({ children, href, onClick }) {
  const s = {
    display: "inline-block", background: C.accent, color: "#020d1a",
    border: "none", borderRadius: 12, padding: "14px 30px",
    fontSize: 15, fontWeight: 800, cursor: "pointer",
    textDecoration: "none", letterSpacing: 0.3,
    boxShadow: `0 4px 24px ${C.accentGlow}`,
    transition: "opacity .15s",
  };
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" style={s}>{children}</a>;
  return <button onClick={onClick} style={s}>{children}</button>;
}

function OutlineBtn({ children, href, onClick }) {
  const s = {
    display: "inline-block", background: "transparent", color: C.accent,
    border: `1.5px solid ${C.accent}`, borderRadius: 12, padding: "13px 28px",
    fontSize: 15, fontWeight: 700, cursor: "pointer",
    textDecoration: "none", letterSpacing: 0.3,
    transition: "background .15s",
  };
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" style={s}>{children}</a>;
  return <button onClick={onClick} style={s}>{children}</button>;
}

/* ── Sections ────────────────────────────────────────── */
function Hero({ onLogin }) {
  return (
    <section style={{
      minHeight: "92dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      textAlign: "center", padding: "80px 24px 60px", gap: 0, position: "relative", zIndex: 1,
    }}>
      <Chip>Solana Mainnet Live</Chip>
      <h1 style={{
        fontSize: "clamp(34px,6vw,72px)", fontWeight: 900, lineHeight: 1.1,
        color: C.text, margin: "24px 0 20px", letterSpacing: -1.5,
        maxWidth: 720,
      }}>
        The future of token launches<br />
        <span style={{ color: C.accent }}>starts here.</span>
      </h1>
      <p style={{
        color: C.muted, fontSize: "clamp(15px,2vw,19px)", maxWidth: 520,
        lineHeight: 1.6, margin: "0 0 40px",
      }}>
        Launch a Solana token in seconds. Trade on a fair bonding curve.
        Earn rewards for every referral — no middlemen.
      </p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        <PrimaryBtn onClick={onLogin}>Launch App</PrimaryBtn>
        <OutlineBtn href={APP_URL}>Install Mobile</OutlineBtn>
      </div>
      <p style={{ color: C.muted2, fontSize: 12, marginTop: 28 }}>
        No seed phrase needed. Your embedded wallet is created on first login.
      </p>
    </section>
  );
}

function StatsStrip() {
  const items = [
    { label: "Network", value: "Solana", chip: "Live", chipColor: C.green },
    { label: "Early Users", value: "5,000+", chip: null },
    { label: "RUN Total Supply", value: "10,000,000,000", chip: null },
  ];
  return (
    <section style={{
      display: "flex", justifyContent: "center", flexWrap: "wrap",
      gap: 1, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
      background: `${C.surface}cc`, position: "relative", zIndex: 1,
    }}>
      {items.map((it, i) => (
        <div key={i} style={{
          flex: "1 1 160px", padding: "28px 32px", textAlign: "center",
          borderRight: i < items.length - 1 ? `1px solid ${C.border}` : "none",
        }}>
          <div style={{ color: C.muted2, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{it.label}</div>
          <div style={{ color: C.text, fontWeight: 800, fontSize: 22 }}>
            {it.value}
            {it.chip && <> <Chip color={it.chipColor}>{it.chip}</Chip></>}
          </div>
        </div>
      ))}
    </section>
  );
}

function HowToEarn() {
  const cards = [
    {
      icon: "🚀", title: "Launch Your Coin",
      desc: "Deploy an SPL token and earn creator fees on every trade made on your coin's bonding curve.",
      tag: "Creator",
    },
    {
      icon: "🔗", title: "Invite Friends",
      desc: "Share your referral link. Earn 50% of platform fees whenever your referrals trade.",
      tag: "Referral",
    },
    {
      icon: "📈", title: "Trade Early",
      desc: "Buy in early on the bonding curve before graduation — price rises with every purchase.",
      tag: "Trader",
    },
    {
      icon: "🏆", title: "RUN Token",
      desc: "First 300k users earn a guaranteed RUN token airdrop. Every action accrues RUN balance.",
      tag: "Holder",
    },
  ];
  return (
    <section style={{ padding: "100px 24px", position: "relative", zIndex: 1 }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <Chip>Earn</Chip>
        <h2 style={{ color: C.text, fontSize: "clamp(26px,4vw,44px)", fontWeight: 800, margin: "16px 0 12px", letterSpacing: -0.5 }}>
          Four ways to earn
        </h2>
        <p style={{ color: C.muted, maxWidth: 480, margin: "0 auto", lineHeight: 1.6, fontSize: 15 }}>
          Every participant in the Fun.Run ecosystem earns — launchers, traders, holders, and referrers.
        </p>
      </div>
      <div style={{
        display: "grid", gap: 20,
        gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
        maxWidth: 960, margin: "0 auto",
      }}>
        {cards.map((c, i) => (
          <Card key={i}>
            <div style={{ fontSize: 32, marginBottom: 14 }}>{c.icon}</div>
            <Chip>{c.tag}</Chip>
            <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: "12px 0 8px" }}>{c.title}</h3>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{c.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function WhyFunRun() {
  const features = [
    {
      icon: "⚡", title: "Launch in Seconds",
      desc: "Fill a form, upload a logo, click Launch. Your SPL token is live on Solana in under a minute. No devs, no multisig.",
    },
    {
      icon: "⛓️", title: "Real On-Chain Trading",
      desc: "Every buy and sell updates the bonding curve on-chain. Prices are deterministic, transparent, and manipulation-resistant.",
    },
    {
      icon: "🔒", title: "Security by Architecture",
      desc: "Custodial wallets use AES-256 encrypted mnemonics. Reserve wallets isolate each coin's SOL. Treasury sweeps happen off-user-path.",
    },
  ];
  return (
    <section style={{
      padding: "100px 24px", background: `${C.surface}80`,
      borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
      position: "relative", zIndex: 1,
    }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <Chip>Platform</Chip>
        <h2 style={{ color: C.text, fontSize: "clamp(26px,4vw,44px)", fontWeight: 800, margin: "16px 0 0", letterSpacing: -0.5 }}>
          Why Fun.Run?
        </h2>
      </div>
      <div style={{
        display: "grid", gap: 24,
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        maxWidth: 900, margin: "0 auto",
      }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: C.accentDim, border: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            }}>{f.icon}</div>
            <div>
              <h3 style={{ color: C.text, fontSize: 17, fontWeight: 700, margin: "0 0 6px" }}>{f.title}</h3>
              <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Multichain() {
  const chains = [
    { name: "Solana", icon: "◎", status: "Live", color: C.green },
    { name: "BNB Chain", icon: "⬡", status: "Soon", color: C.yellow },
    { name: "Polygon", icon: "⬟", status: "Soon", color: "#a78bfa" },
    { name: "Ethereum", icon: "⬡", status: "Planned", color: C.muted2 },
  ];
  return (
    <section style={{ padding: "100px 24px", position: "relative", zIndex: 1 }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <Chip>Multichain</Chip>
        <h2 style={{ color: C.text, fontSize: "clamp(26px,4vw,44px)", fontWeight: 800, margin: "16px 0 12px", letterSpacing: -0.5 }}>
          Starting on Solana.<br />Built for every chain.
        </h2>
      </div>
      <div style={{
        display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", maxWidth: 800, margin: "0 auto",
      }}>
        {chains.map((ch, i) => (
          <Card key={i} style={{ flex: "1 1 160px", textAlign: "center", padding: "24px 20px" }}>
            <div style={{ fontSize: 28, marginBottom: 10, color: ch.color }}>{ch.icon}</div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{ch.name}</div>
            <Chip color={ch.color}>{ch.status}</Chip>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Roadmap() {
  const steps = [
    { q: "Now", title: "Solana Launchpad", desc: "Token creation, bonding curve trading, referral system, embedded wallets.", done: true },
    { q: "Q1 2027", title: "RUN Token Launch", desc: "Airdrop to first 300k users. RUN used for governance, fee discounts, staking.", done: false },
    { q: "2027", title: "Multichain Expansion", desc: "BNB Chain and Polygon launchpads. Cross-chain referral tracking.", done: false },
    { q: "Vision", title: "Fun.Run Exchange", desc: "Integrated DEX with cross-chain swaps. Liquidity pools governed by RUN holders.", done: false },
  ];
  return (
    <section style={{
      padding: "100px 24px", background: `${C.surface}80`,
      borderTop: `1px solid ${C.border}`, position: "relative", zIndex: 1,
    }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <Chip>Roadmap</Chip>
        <h2 style={{ color: C.text, fontSize: "clamp(26px,4vw,44px)", fontWeight: 800, margin: "16px 0 0", letterSpacing: -0.5 }}>
          Where we're going
        </h2>
      </div>
      <div style={{ maxWidth: 680, margin: "0 auto", position: "relative" }}>
        <div style={{
          position: "absolute", left: 19, top: 0, bottom: 0, width: 2,
          background: `linear-gradient(to bottom, ${C.accent}, ${C.muted2}30)`,
        }} />
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 24, marginBottom: 40, position: "relative" }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
              background: s.done ? C.accent : C.surface,
              border: `2px solid ${s.done ? C.accent : C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, zIndex: 1,
            }}>
              {s.done ? "✓" : i + 1}
            </div>
            <div style={{ paddingTop: 8 }}>
              <div style={{ color: C.muted2, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{s.q}</div>
              <h3 style={{ color: s.done ? C.accent : C.text, fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>{s.title}</h3>
              <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExchangeVision() {
  const items = [
    { icon: "↔️", title: "Cross-Chain Swaps", desc: "Swap tokens across Solana, BNB, Polygon, and Ethereum from one unified interface." },
    { icon: "💧", title: "Liquidity Pools", desc: "Provide liquidity for graduated coins. Earn trading fees proportional to your share." },
    { icon: "🗳️", title: "Governed by RUN", desc: "RUN holders vote on fee tiers, new chain integrations, and treasury allocation." },
  ];
  return (
    <section style={{ padding: "100px 24px", position: "relative", zIndex: 1 }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <Chip color="#a78bfa">Vision</Chip>
        <h2 style={{ color: C.text, fontSize: "clamp(26px,4vw,44px)", fontWeight: 800, margin: "16px 0 12px", letterSpacing: -0.5 }}>
          Fun.Run Exchange
        </h2>
        <p style={{ color: C.muted, maxWidth: 460, margin: "0 auto", fontSize: 15, lineHeight: 1.6 }}>
          After graduation, coins don't stop here. They flow into a fully governed, cross-chain exchange.
        </p>
      </div>
      <div style={{
        display: "grid", gap: 20,
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        maxWidth: 860, margin: "0 auto",
      }}>
        {items.map((it, i) => (
          <Card key={i} style={{ borderColor: "rgba(167,139,250,0.2)" }}>
            <div style={{ fontSize: 28, marginBottom: 14 }}>{it.icon}</div>
            <h3 style={{ color: C.text, fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>{it.title}</h3>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{it.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function CTA({ onLogin }) {
  return (
    <section style={{
      padding: "100px 24px", textAlign: "center",
      background: `linear-gradient(to bottom, transparent, ${C.accentDim})`,
      borderTop: `1px solid ${C.border}`, position: "relative", zIndex: 1,
    }}>
      <h2 style={{ color: C.text, fontSize: "clamp(28px,5vw,52px)", fontWeight: 900, margin: "0 0 16px", letterSpacing: -1 }}>
        Join early.<br /><span style={{ color: C.accent }}>Be remembered.</span>
      </h2>
      <p style={{ color: C.muted, fontSize: 16, maxWidth: 400, margin: "0 auto 40px", lineHeight: 1.6 }}>
        The first 300,000 users earn a guaranteed RUN token allocation. The clock is ticking.
      </p>
      <PrimaryBtn onClick={onLogin}>Start for Free</PrimaryBtn>
      <p style={{ color: C.muted2, fontSize: 12, marginTop: 20 }}>No credit card. No wallet required to start.</p>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{
      borderTop: `1px solid ${C.border}`, padding: "28px 24px",
      textAlign: "center", color: C.muted2, fontSize: 13,
      position: "relative", zIndex: 1,
      display: "flex", flexWrap: "wrap", gap: 12,
      justifyContent: "center", alignItems: "center",
    }}>
      <span style={{ fontWeight: 700, color: C.muted }}>Fun.Run</span>
      <span>·</span>
      <span>© 2026 Fun.Run. All rights reserved.</span>
      <span>·</span>
      <a href={APP_URL} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, textDecoration: "none" }}>funrun.site</a>
    </footer>
  );
}

/* ── Nav ─────────────────────────────────────────────── */
function Nav({ onLogin }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px", height: 60,
      background: scrolled ? `${C.bg}ee` : "transparent",
      backdropFilter: scrolled ? "blur(16px)" : "none",
      borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
      transition: "all .3s",
    }}>
      <div style={{ fontWeight: 900, fontSize: 20, color: C.accent, letterSpacing: -0.5 }}>
        Fun.Run
      </div>
      <button
        onClick={onLogin}
        style={{
          background: C.accentDim, color: C.accent,
          border: `1px solid ${C.accent}40`, borderRadius: 10,
          padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}
      >
        Launch App
      </button>
    </nav>
  );
}

/* ── Main export ─────────────────────────────────────── */
export default function LandingPage({ onLogin }) {
  return (
    <div style={{ background: C.bg, minHeight: "100dvh", fontFamily: "system-ui, -apple-system, sans-serif", color: C.text, overflowX: "hidden" }}>
      <CrystalBg />
      <Nav onLogin={onLogin} />
      <Hero onLogin={onLogin} />
      <StatsStrip />
      <HowToEarn />
      <WhyFunRun />
      <Multichain />
      <Roadmap />
      <ExchangeVision />
      <CTA onLogin={onLogin} />
      <Footer />
    </div>
  );
}
