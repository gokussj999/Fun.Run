// =========================== App.jsx (FULL FILE) — PART 1 / 5 ===========================

import IntroSplash from "./IntroSplash";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useExportWallet } from "@privy-io/react-auth/solana";

const INTRO_MS = 2600;

// ✅ apna logo yahan do (recommended):
// Option A: public folder: /public/logo.png  -> "/logo.png"
// Option B: full https url
// Option C: data:image/png;base64,...
const APP_LOGO_URL = "/logo.png";

// ✅ Backend base (Railway)
const API_BASE = "https://zooming-solace-production-c360.up.railway.app";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const STARTING_MC_USD = 6500;
const LS_THEME = "theme"; // "calm" | "neon" | "ocean" | "rose" | "royal" | "lightgreen"

// -------------------- THEME + GLOBAL CSS --------------------
function ThemeStyles() {
  return (
    <style>{`
      :root{
        --bg:#070B0E;
        --card:#0D1416;
        --card2:#0B1716;
        --border:rgba(255,255,255,.10);

        --text:#F4FFF9;
        --muted:rgba(244,255,249,.70);
        --muted2:rgba(244,255,249,.48);

        --primary:#19E6A2;
        --primary2:#8FFFD0;
        --accent2:#6AD7FF;
        --accent3:#A78BFA;

        --warn:#FFD36A;
        --danger:#FF6B6B;

        --shadow: 0 26px 90px rgba(0,0,0,.65);
        --shadow2: 0 18px 60px rgba(0,0,0,.55);

        --r:28px;

        --glowP: rgba(25,230,162,.16);
        --glowA: rgba(106,215,255,.11);
        --glowV: rgba(167,139,250,.10);

        --ease: cubic-bezier(.22,1,.36,1);
      }

      /* ===== YOUR PROFILE "no-anim" block stays (as you added) ===== */
      [data-noanim="1"],
      [data-noanim="1"] * ,
      [data-noanim="1"] *::before,
      [data-noanim="1"] *::after {
        animation: none !important;
        transition: none !important;
      }
      [data-noanim="1"] * { transform: none !important; }
      [data-noanim="1"] {
        scroll-behavior: auto !important;
        overscroll-behavior: contain !important;
        -webkit-overflow-scrolling: auto !important;
      }

      /* ===== THEME ===== */
      [data-theme="calm"]{
        --bg:#070B0E; --card:#0D1416; --card2:#0B1716;
        --primary:#19E6A2; --primary2:#8FFFD0;
        --accent2:#6AD7FF; --accent3:#A78BFA;
        --glowP: rgba(25,230,162,.14);
        --glowA: rgba(106,215,255,.10);
        --glowV: rgba(167,139,250,.09);
      }
      [data-theme="neon"]{
        --bg:#05080A; --card:#0A1211; --card2:#081412;
        --primary:#19E6A2; --primary2:#7CFFB8;
        --accent2:#6AD7FF; --accent3:#A78BFA;
        --glowP: rgba(25,230,162,.24);
        --glowA: rgba(106,215,255,.16);
        --glowV: rgba(167,139,250,.14);
      }
      [data-theme="ocean"]{
        --bg:#041014; --card:#071A1F; --card2:#06161C;
        --primary:#38F6C7; --primary2:#A1FFE1;
        --accent2:#47B7FF; --accent3:#7C83FF;
        --glowP: rgba(56,246,199,.16);
        --glowA: rgba(71,183,255,.12);
        --glowV: rgba(124,131,255,.10);
      }
      [data-theme="rose"]{
        --bg:#0D070A; --card:#160B11; --card2:#130910;
        --primary:#1EE6A1; --primary2:#FF86B1;
        --accent2:#FFB55C; --accent3:#A78BFA;
        --glowP: rgba(30,230,161,.16);
        --glowA: rgba(255,181,92,.12);
        --glowV: rgba(255,134,177,.10);
      }
      [data-theme="royal"]{
        --bg:#06061A; --card:#0B0B22; --card2:#09091D;
        --primary:#19E6A2; --primary2:#7CFFB8;
        --accent2:#A0B4FF; --accent3:#6AD7FF;
        --glowP: rgba(25,230,162,.16);
        --glowA: rgba(160,180,255,.12);
        --glowV: rgba(106,215,255,.10);
      }
      [data-theme="lightgreen"]{
        --bg:#06110A; --card:#081A10; --card2:#07150E;
        --primary:#20F5A7; --primary2:#B7FFD1;
        --accent2:#6AD7FF; --accent3:#A78BFA;
        --glowP: rgba(32,245,167,.16);
        --glowA: rgba(106,215,255,.11);
        --glowV: rgba(167,139,250,.10);
      }

      *{ box-sizing:border-box; }
      html, body { height:100%; }
      button, input, textarea { font-family:inherit; }

      input::-webkit-outer-spin-button, input::-webkit-inner-spin-button{ -webkit-appearance: none; margin: 0; }
      input[type=number]{ -moz-appearance:textfield; }

      body{
        margin:0;
        color: var(--text);
        background: var(--bg);
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;

        background:
          radial-gradient(1200px 700px at 50% -10%, rgba(255,255,255,.05), transparent 60%),
          radial-gradient(900px 520px at 15% 15%, var(--glowP), transparent 60%),
          radial-gradient(800px 480px at 85% 25%, var(--glowA), transparent 60%),
          radial-gradient(900px 540px at 50% 110%, var(--glowV), transparent 55%),
          var(--bg);
      }

      body::before,
      body::after{
        content:"";
        position:fixed;
        inset:-48px;
        pointer-events:none;
        z-index:0;
        filter: blur(26px);
        opacity:.55;
      }
      body::before{
        background:
          radial-gradient(520px 280px at 20% 20%, rgba(25,230,162,.16), transparent 70%),
          radial-gradient(560px 320px at 85% 35%, rgba(106,215,255,.12), transparent 70%),
          radial-gradient(620px 360px at 45% 90%, rgba(167,139,250,.10), transparent 70%);
        /* ✅ STOP GLOBAL WOBBLE */
        animation: none !important;
      }
      body::after{
        background:
          radial-gradient(560px 340px at 30% 80%, rgba(25,230,162,.10), transparent 70%),
          radial-gradient(600px 360px at 70% 15%, rgba(106,215,255,.08), transparent 70%),
          repeating-linear-gradient(
            0deg,
            rgba(255,255,255,.018),
            rgba(255,255,255,.018) 1px,
            rgba(0,0,0,0) 2px,
            rgba(0,0,0,0) 4px
          );
        /* ✅ STOP GLOBAL WOBBLE */
        animation: none !important;
        opacity:.35;
        mix-blend-mode: overlay;
      }

      /* Keep keyframes (harmless) but no longer used by body */
      @keyframes floatGlow{
        0%{ transform: translate3d(0,0,0) scale(1); }
        50%{ transform: translate3d(14px,-12px,0) scale(1.02); }
        100%{ transform: translate3d(0,0,0) scale(1); }
      }
      @keyframes floatGlow2{
        0%{ transform: translate3d(0,0,0) scale(1); }
        50%{ transform: translate3d(-16px,12px,0) scale(1.03); }
        100%{ transform: translate3d(0,0,0) scale(1); }
      }

      /* ✅ FULL APP: Remove motion (but IntroSplash is separate file; we are not touching it) */
      .fadeIn{ animation: none !important; }
      @keyframes fadeIn{ from{opacity:.0; transform: translateY(8px);} to{opacity:1; transform: translateY(0);} }

      /* ✅ stop card breathing */
      .breathe{ animation: none !important; }
      @keyframes breatheCard{
        0%{ transform: translateZ(0) scale(1); }
        50%{ transform: translateZ(0) scale(1.012); }
        100%{ transform: translateZ(0) scale(1); }
      }

      .noScrollbar{ scrollbar-width: none; -ms-overflow-style: none; }
      .noScrollbar::-webkit-scrollbar{ display:none; }

      .miniScroll {
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .miniScroll::-webkit-scrollbar {
        width: 0px;
        height: 0px;
      }

      /* 🔥 Hide whole page scrollbar */
      html::-webkit-scrollbar,
      body::-webkit-scrollbar {
        width: 0px;
        height: 0px;
      }
      #root::-webkit-scrollbar {
        width: 0px;
        height: 0px;
      }
      html, body {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .hScroll{ overflow-x:auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; -ms-overflow-style: none; }
      .hScroll::-webkit-scrollbar{ display:none; }

      .snapX{ scroll-snap-type: x mandatory; }
      .snapItem{ scroll-snap-align: start; }

      /* ✅ remove button hover motion */
      button{
        transition: none !important;
      }
      button:hover{ filter: none !important; }
      button:active{ transform: none !important; }

      :focus-visible{
        outline: 2px solid rgba(25,230,162,.55);
        outline-offset: 2px;
        border-radius: 14px;
      }

      ::selection{ background: rgba(25,230,162,.22); }

      /* ===== Intro / Factory Splash ===== */
      @keyframes logoSpin { to { transform: rotate(360deg); } }
      @keyframes chainMove { to { background-position: 160px 0; } }
      @keyframes coinRide {
        0%{ transform: translateX(-120px) rotate(-10deg); opacity:0; }
        12%{opacity:1;}
        100%{ transform: translateX(640px) rotate(18deg); opacity:1; }
      }
      @keyframes smoke {
        0%{ transform: translateY(18px); opacity:0; }
        20%{opacity:.35;}
        100%{ transform: translateY(-26px); opacity:0; }
      }
      @keyframes pulseGlow {
        0%,100%{ opacity:.35; transform: scale(1); }
        50%{ opacity:.65; transform: scale(1.03); }
      }

      .introOverlay{
        position: fixed;
        inset: 0;
        z-index: 999999;
        display: grid;
        place-items: center;
        background:
          radial-gradient(900px 520px at 50% 20%, rgba(25,230,162,.16), transparent 60%),
          radial-gradient(900px 520px at 20% 80%, rgba(106,215,255,.12), transparent 60%),
          radial-gradient(900px 520px at 80% 85%, rgba(167,139,250,.11), transparent 60%),
          rgba(0,0,0,.72);
        backdrop-filter: blur(16px);
      }

      .introCard{
        width: 540px;
        max-width: 92vw;
        border-radius: 28px;
        border: 1px solid rgba(255,255,255,.12);
        background:
          linear-gradient(180deg, rgba(255,255,255,.06), rgba(0,0,0,.30)),
          rgba(10,14,16,.78);
        box-shadow: 0 40px 120px rgba(0,0,0,.75);
        overflow: hidden;
        position: relative;
        padding: 18px;
      }

      .introGlow{
        position:absolute; inset:-40px;
        background:
          radial-gradient(420px 220px at 20% 30%, rgba(25,230,162,.25), transparent 60%),
          radial-gradient(420px 220px at 80% 20%, rgba(106,215,255,.18), transparent 60%),
          radial-gradient(520px 260px at 60% 85%, rgba(167,139,250,.14), transparent 60%);
        filter: blur(18px);
        animation: pulseGlow 3.2s var(--ease) infinite;
        pointer-events:none;
      }

      .logoRing{
        width: 92px; height: 92px;
        border-radius: 30px;
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(0,0,0,.22);
        display: grid;
        place-items: center;
        box-shadow:
          0 26px 80px rgba(0,0,0,.55),
          0 0 60px rgba(25,230,162,.12);
      }

      .logoSpin{
        width: 72px; height: 72px;
        border-radius: 24px;
        overflow: hidden;
        display: grid;
        place-items: center;
        animation: logoSpin 1.15s linear infinite;
        background: linear-gradient(135deg, rgba(25,230,162,.22), rgba(106,215,255,.14));
        border: 1px solid rgba(255,255,255,.10);
      }

      .logoSpin img{
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transform: rotate(0deg);
      }

      .factoryStage{
        margin-top: 14px;
        border-radius: 22px;
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(0,0,0,.22);
        padding: 14px;
        position: relative;
        overflow: hidden;
      }

      .chainRow{
        height: 16px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.10);
        background:
          repeating-linear-gradient(
            90deg,
            rgba(255,255,255,.18) 0 14px,
            rgba(0,0,0,.0) 14px 22px
          );
        background-size: 160px 16px;
        animation: chainMove .55s linear infinite;
        box-shadow: inset 0 0 0 1px rgba(0,0,0,.18);
      }

      .chainRow.second{
        margin-top: 10px;
        opacity: .85;
        animation-duration: .75s;
      }

      .conveyor{
        margin-top: 14px;
        height: 52px;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,.10);
        background:
          linear-gradient(180deg, rgba(255,255,255,.06), rgba(0,0,0,.18)),
          rgba(10,12,14,.55);
        position: relative;
        overflow: hidden;
      }

      .coin{
        position: absolute;
        top: 9px;
        width: 34px;
        height: 34px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        font-size: 18px;
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(0,0,0,.22);
        box-shadow: 0 14px 45px rgba(0,0,0,.35);
        animation: coinRide 1.9s var(--ease) infinite;
      }

      .coin.c2{ animation-delay: .22s; opacity: .95; }
      .coin.c3{ animation-delay: .44s; opacity: .90; }
      .coin.c4{ animation-delay: .66s; opacity: .86; }

      .smokePuff{
        position: absolute;
        left: 18px;
        bottom: 10px;
        width: 120px;
        height: 60px;
        background: radial-gradient(closest-side, rgba(255,255,255,.16), rgba(255,255,255,0));
        filter: blur(2px);
        opacity: 0;
        animation: smoke 1.35s var(--ease) infinite;
      }

      .introText{
        margin-top: 14px;
        display:flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .introTitle{
        font-weight: 980;
        letter-spacing: .25px;
      }

      .introSub{
        margin-top: 6px;
        color: var(--muted);
        font-size: 12px;
      }
    `}</style>
  );
}

function ScreenShell({ children, fullBleed = false, allowYScroll = false }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        color: "var(--text)",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        paddingBottom: 86,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div
        className={`fadeIn ${allowYScroll ? "noScrollbar" : ""}`}
        style={{
          width: "100%",
maxWidth: "100%",
          
          padding: fullBleed ? 12 : 18,
          background: `
            linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.02)),
            linear-gradient(180deg, rgba(0,0,0,.12), rgba(0,0,0,.32)),
            var(--card)
          `,
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,.10)",
          borderRadius: "var(--r)",
          boxShadow: `
            0 34px 110px rgba(0,0,0,.70),
            0 0 70px rgba(25,230,162,.08)
          `,
          maxHeight: "calc(100vh - 110px)",
          overflowY: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "var(--r)",
            pointerEvents: "none",
            background: `
              radial-gradient(420px 120px at 50% 0%, rgba(25,230,162,.12), transparent 70%),
              linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,0) 35%)
            `,
            opacity: 0.9,
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function Title({ children, sub, right }) {
  return (
    <div
      style={{
        marginBottom: 14,
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <div>
        <div style={{ fontWeight: 980, fontSize: 19, letterSpacing: 0.25, lineHeight: 1.15 }}>
          {children}
        </div>
        {sub ? (
          <div style={{ marginTop: 7, color: "var(--muted)", fontSize: 12, lineHeight: 1.45 }}>
            {sub}
          </div>
        ) : null}
      </div>
      {right}
    </div>
  );
}// =========================== App.jsx (FULL FILE) — PART 2 / 5 ===========================

function SplashIntro({ logoUrl }) {
  const coins = Array.from({ length: 10 }).map((_, i) => {
    const x = 10 + Math.random() * 80; // %
    const y = 12 + Math.random() * 70; // %
    const delay = 0.6 + Math.random() * 1.4; // seconds
    const driftX = (Math.random() * 2 - 1) * 40; // px
    const driftY = (Math.random() * 2 - 1) * 30; // px
    const spin = (Math.random() * 2 - 1) * 360; // deg
    const z = 700 + Math.random() * 600; // px

    const icons = ["🪙", "💎", "🔥", "🚀", "🐸", "🐶", "🍌", "🧠"];
    const icon = icons[Math.floor(Math.random() * icons.length)];

    return { id: i, x, y, delay, driftX, driftY, spin, z, icon };
  });

  return (
    <div className="introRoot">
      <div className="introGlow" />

      <div className="introWrap">
        {/* LEFT TEXT */}
        <div className="introLeft">
          <div className="brandPill">
            <span className="dot" />
            <span>LIVE</span>
          </div>

          <h1 className="introTitle">
            Create coins.
            <br />
            Make referrals.
            <br />
            Change your life.
          </h1>

          <p className="introSub">Creator-first • Reward-driven • Smooth & Fast</p>

          <div className="introBadges">
            <span className="badge">Referral 20%</span>
            <span className="badge badgeGold">Factory Mode</span>
          </div>
        </div>

        {/* RIGHT PHONE */}
        <div className="introRight">
          <div className="phoneStage">
            <div className="phone">
              <div className="phoneTop">
                <div className="cam" />
                <div className="speaker" />
              </div>

              <div className="screen">
                <div className="screenHeader">
                  <div className="logoBubble">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="logo"
                        style={{ width: 24, height: 24, objectFit: "contain" }}
                      />
                    ) : (
                      "🧪"
                    )}
                  </div>
                  <div className="headerText">
                    <div className="h1">Cooking memes…</div>
                    <div className="h2">chains running • coins printing • launchpad warming up</div>
                  </div>
                </div>

                <div className="progress">
                  <div className="bar">{Array.from({ length: 10 }).map((_, idx) => <span key={idx} />)}</div>
                </div>

                {/* Coins inside screen (rush OUT) */}
                <div className="coinLayer" aria-hidden="true">
                  {coins.map((c) => (
                    <div
                      key={c.id}
                      className="coin"
                      style={{
                        left: `${c.x}%`,
                        top: `${c.y}%`,
                        animationDelay: `${c.delay}s`,
                        ["--dx"]: `${c.driftX}px`,
                        ["--dy"]: `${c.driftY}px`,
                        ["--spin"]: `${c.spin}deg`,
                        ["--z"]: `${c.z}px`,
                      }}
                    >
                      <span className="coinDot" />
                    </div>
                  ))}
                </div>

                <div className="footerLine">Creator-first • Reward-driven • Smooth & Fast</div>

                <div className="footerBtns">
                  <div className="pill">Referral 20%</div>
                  <div className="pill pillGold">Factory Mode</div>
                </div>
              </div>
            </div>

            <div className="stageShadow" />
          </div>
        </div>
      </div>

      <style>{`
        .introRoot{
          position:fixed; inset:0; z-index:9999;
          display:flex; align-items:center; justify-content:center;
          background: radial-gradient(1200px 700px at 70% 40%, rgba(0,255,204,0.10), rgba(0,0,0,0.95) 60%),
                      linear-gradient(180deg, rgba(0,0,0,0.82), rgba(0,0,0,0.95));
          overflow:hidden; padding:14px;
        }
        .introGlow{
          position:absolute; inset:-40%;
          background: radial-gradient(circle at 35% 40%, rgba(255,170,0,0.10), transparent 55%),
                      radial-gradient(circle at 70% 55%, rgba(0,255,204,0.10), transparent 55%);
          filter: blur(22px);
          animation: glowMove 4s ease-in-out infinite alternate;
          opacity: .9;
        }
        @keyframes glowMove { from{ transform: translate3d(-10px,-10px,0)} to { transform: translate3d(14px,10px,0)} }

        .introWrap{
          position:relative;
          width:min(980px, 100%);
          display:grid;
          grid-template-columns: 1fr;
          gap:14px;
          align-items:center;
        }
        @media (min-width: 860px){
          .introWrap{ grid-template-columns: 1.05fr 0.95fr; gap:22px; }
        }

        .introLeft{
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 16px;
          backdrop-filter: blur(10px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.35);
        }
        .brandPill{
          display:inline-flex; align-items:center; gap:8px;
          border:1px solid rgba(0,255,204,0.30);
          background: rgba(0,255,204,0.08);
          color: rgba(210,255,245,0.95);
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          letter-spacing: .4px;
        }
        .brandPill .dot{
          width:8px; height:8px; border-radius:50%;
          background: rgba(0,255,204,0.95);
          box-shadow: 0 0 12px rgba(0,255,204,0.7);
        }
        .introTitle{
          margin:12px 0 8px;
          font-size: clamp(28px, 5vw, 44px);
          line-height: 1.05;
          font-weight: 900;
          background: linear-gradient(90deg, rgba(0,255,204,1), rgba(255,170,0,1));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .introSub{ margin: 0 0 12px; color: rgba(255,255,255,0.75); font-size: 14px; }
        .introBadges{ display:flex; gap:10px; flex-wrap:wrap; }
        .badge{
          padding: 8px 12px; border-radius: 999px; font-size: 12px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.85);
        }
        .badgeGold{
          border-color: rgba(255,170,0,0.30);
          background: rgba(255,170,0,0.10);
          color: rgba(255,220,170,0.95);
        }

        .introRight{ display:flex; justify-content:center; align-items:center; }

        .phoneStage{
          position:relative;
          width: min(360px, 92vw);
          aspect-ratio: 9 / 16;
          display:flex; align-items:center; justify-content:center;
          perspective: 1100px;
        }
        .phone{
          width: 100%; height: 100%;
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 28px 70px rgba(0,0,0,0.45);
          transform: rotateY(-10deg) rotateX(6deg);
          overflow:hidden; position:relative;
        }
        .phoneTop{
          position:absolute; top:10px; left:50%;
          transform: translateX(-50%);
          display:flex; align-items:center; gap:10px;
          opacity:.8; z-index: 5;
        }
        .cam{ width:10px; height:10px; border-radius:50%; background: rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.08); }
        .speaker{ width:44px; height:6px; border-radius:999px; background: rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.07); }

        .screen{
          position:absolute; inset:0;
          padding: 18px 14px;
          background: radial-gradient(700px 420px at 60% 20%, rgba(0,255,204,0.14), transparent 60%),
                      radial-gradient(700px 420px at 30% 70%, rgba(255,170,0,0.10), transparent 60%),
                      linear-gradient(180deg, rgba(10,14,18,0.92), rgba(6,8,10,0.97));
        }

        .screenHeader{ display:flex; gap:12px; align-items:center; margin-top: 18px; }
        .logoBubble{
          width:42px; height:42px; border-radius:14px;
          display:flex; align-items:center; justify-content:center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 0 20px rgba(0,255,204,0.08);
          font-size: 18px;
          overflow:hidden;
        }
        .headerText .h1{ color: rgba(255,255,255,0.92); font-weight: 800; font-size: 16px; }
        .headerText .h2{ color: rgba(255,255,255,0.60); font-size: 12px; margin-top:2px; }

        .progress{ margin-top: 18px; }
        .bar{
          display:flex; gap:6px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.03);
        }
        .bar span{
          flex:1; height: 16px; border-radius: 8px;
          background: rgba(255,255,255,0.06);
          overflow:hidden; position:relative;
        }
        .bar span:after{
          content:""; position:absolute; inset:-2px;
          background: linear-gradient(90deg, transparent, rgba(0,255,204,0.35), transparent);
          transform: translateX(-120%);
          animation: shimmer 1.1s ease-in-out infinite;
        }
        .bar span:nth-child(2):after{ animation-delay: .05s;}
        .bar span:nth-child(3):after{ animation-delay: .1s;}
        .bar span:nth-child(4):after{ animation-delay: .15s;}
        .bar span:nth-child(5):after{ animation-delay: .2s;}
        .bar span:nth-child(6):after{ animation-delay: .25s;}
        .bar span:nth-child(7):after{ animation-delay: .3s;}
        .bar span:nth-child(8):after{ animation-delay: .35s;}
        .bar span:nth-child(9):after{ animation-delay: .4s;}
        .bar span:nth-child(10):after{ animation-delay: .45s;}
        @keyframes shimmer { to { transform: translateX(120%); } }

        .coinLayer{
          position:absolute; inset:0;
          transform-style: preserve-3d;
          pointer-events:none;
        }
        .coin{
          position:absolute;
          font-size: 22px;
          filter: blur(7px);
          opacity: 0;
          transform: translate3d(0,0,0) translateZ(0px) scale(0.35);
          text-shadow: 0 12px 26px rgba(0,0,0,0.40);
          animation: coinRush 2.2s cubic-bezier(.2,.8,.2,1) forwards;
          will-change: transform, opacity, filter;
        }
        @keyframes coinRush{
          0%{ opacity: 0; filter: blur(9px); transform: translate3d(0,0,0) translateZ(0px) scale(0.30) rotate(0deg); }
          20%{ opacity: 1; }
          100%{
            opacity: 1; filter: blur(0px);
            transform:
              translate3d(var(--dx), var(--dy), 0)
              translateZ(var(--z))
              scale(2.25)
              rotate(var(--spin));
          }
        }

        .footerLine{
          margin-top: 18px;
          color: rgba(255,255,255,0.70);
          font-size: 12px;
        }
        .footerBtns{
          margin-top: 10px;
          display:flex; gap:10px;
        }
        .pill{
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.85);
          font-size: 12px;
        }
        .pillGold{
          border-color: rgba(255,170,0,0.30);
          background: rgba(255,170,0,0.10);
          color: rgba(255,220,170,0.95);
        }

        .stageShadow{
          position:absolute; bottom:-18px; left: 12%;
          width: 76%; height: 34px;
          background: radial-gradient(closest-side, rgba(0,0,0,0.55), transparent 70%);
          filter: blur(6px);
          opacity: .8;
          transform: rotateX(70deg);
        }

        @media (prefers-reduced-motion: reduce){
          .introGlow{ animation:none; }
          .coin{ animation-duration: .9s; }
          .bar span:after{ animation-duration: .7s; }
        }
      `}</style>
    </div>
  );
}

function Card({ children, style, breathe = true }) {
  return (
    <div
      className={breathe ? "breathe" : ""}
      style={{
        padding: 14,
        borderRadius: 22,
        border: "1px solid var(--border)",
        background: `
          linear-gradient(180deg, rgba(255,255,255,.05), rgba(0,0,0,.18)),
          var(--card2)
        `,
        boxShadow: `
          0 20px 70px rgba(0,0,0,.55),
          0 0 40px rgba(25,230,162,.05)
        `,
        transition: "none", // ✅ stop motion
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Pill({ children, tone = "muted" }) {
  const color =
    tone === "good" ? "var(--primary)" : tone === "warn" ? "var(--warn)" : tone === "danger" ? "var(--danger)" : "var(--muted)";
  const border =
    tone === "good"
      ? "rgba(25,230,162,.24)"
      : tone === "warn"
      ? "rgba(255,211,106,.24)"
      : tone === "danger"
      ? "rgba(255,107,107,.28)"
      : "rgba(255,255,255,.10)";
  const bg =
    tone === "good"
      ? "rgba(25,230,162,.08)"
      : tone === "warn"
      ? "rgba(255,211,106,.08)"
      : tone === "danger"
      ? "rgba(255,107,107,.08)"
      : "rgba(255,255,255,.05)";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 10px",
        borderRadius: 999,
        border: `1px solid ${border}`,
        background: bg,
        color,
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: 0.15,
        boxShadow: "0 10px 30px rgba(0,0,0,.25)",
      }}
    >
      {children}
    </span>
  );
}

function MiniBtn({ children, onClick, disabled, tone = "muted", style }) {
  const isGood = tone === "good";
  const isWarn = tone === "warn";
  const isDanger = tone === "danger";

  const border = isGood
    ? "rgba(25,230,162,.30)"
    : isWarn
    ? "rgba(255,211,106,.30)"
    : isDanger
    ? "rgba(255,107,107,.34)"
    : "rgba(255,255,255,.10)";

  const bg = isGood
    ? "rgba(25,230,162,.10)"
    : isWarn
    ? "rgba(255,211,106,.10)"
    : isDanger
    ? "rgba(255,107,107,.10)"
    : "rgba(255,255,255,.04)";

  const color = isGood ? "var(--primary)" : isWarn ? "var(--warn)" : isDanger ? "var(--danger)" : "var(--text)";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        border: `1px solid ${border}`,
        background: bg,
        color,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        fontWeight: 950,
        fontSize: 12,
        letterSpacing: 0.15,
        transition: "none", // ✅ stop motion
        boxShadow: "0 14px 45px rgba(0,0,0,.35)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", maxLength, hint, error, rightIcon }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          marginBottom: 7,
          color: "var(--muted)",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
        }}
      >
        <span>{label}</span>
        {hint ? <span style={{ color: "var(--muted2)" }}>{hint}</span> : null}
      </div>

      <div style={{ position: "relative" }}>
        <input
          value={value}
          maxLength={maxLength}
          type={type}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: rightIcon ? "13px 44px 13px 13px" : 13,
            borderRadius: 16,
            border: `1px solid ${error ? "rgba(255,107,107,.55)" : "rgba(255,255,255,.10)"}`,
            background: "rgba(0,0,0,.18)",
            color: "var(--text)",
            outline: "none",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,.10)",
            transition: "none", // ✅ stop motion
          }}
        />
        {rightIcon ? (
          <div
            style={{
              position: "absolute",
              right: 12,
              top: 0,
              bottom: 0,
              display: "grid",
              placeItems: "center",
              color: "var(--muted)",
            }}
          >
            {rightIcon}
          </div>
        ) : null}
      </div>

      {error ? <div style={{ marginTop: 7, color: "var(--danger)", fontSize: 12 }}>{error}</div> : null}
    </div>
  );
}// =========================== App.jsx (FULL FILE) — PART 3 / 5 ===========================

function Textarea({ label, value, onChange, placeholder, maxLength, error }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          marginBottom: 7,
          color: "var(--muted)",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
        }}
      >
        <span>{label}</span>
        <span style={{ color: "var(--muted2)" }}>{value.length}/{maxLength}</span>
      </div>

      <textarea
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        style={{
          width: "100%",
          padding: 13,
          borderRadius: 16,
          border: `1px solid ${error ? "rgba(255,107,107,.55)" : "rgba(255,255,255,.10)"}`,
          background: "rgba(0,0,0,.18)",
          color: "var(--text)",
          outline: "none",
          resize: "none",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,.10)",
          transition: "none", // ✅ stop motion
        }}
      />

      {error ? <div style={{ marginTop: 7, color: "var(--danger)", fontSize: 12 }}>{error}</div> : null}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: 14,
        borderRadius: 18,
        border: "none",
        background: disabled ? "rgba(255,255,255,.12)" : "linear-gradient(135deg, var(--primary), var(--primary2))",
        color: disabled ? "rgba(255,255,255,.6)" : "#000",
        fontWeight: 950,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 18px 60px rgba(25,230,162,.25)",
        transition: "none", // ✅ stop motion
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, disabled, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: 14,
        borderRadius: 18,
        border: "1px solid var(--border)",
        background: "rgba(255,255,255,.03)",
        color: "var(--text)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontWeight: 900,
        transition: "none", // ✅ stop motion
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function SectionHeader({ title, right }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 10,
        marginBottom: 10,
      }}
    >
      <div style={{ fontWeight: 980, letterSpacing: 0.15 }}>{title}</div>
      {right}
    </div>
  );
}

function CoinLogo({ c, size = 46 }) {
  const src = c?.logo || "";
  const has = !!src;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.35),
        border: "1px solid var(--border)",
        background: "rgba(0,0,0,.18)",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      {has ? (
        <img src={src} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ color: "var(--muted)", fontSize: 12 }}>{(c?.symbol || "•").slice(0, 2)}</span>
      )}
    </div>
  );
}

function Modal({ open, title, children, onClose, onConfirm, confirmText = "Confirm", confirmTone = "primary" }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 99999,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fadeIn"
        style={{
          width: "100%",
maxWidth: "100%",
      
          borderRadius: 22,
          border: "1px solid var(--border)",
          background: "var(--card)",
          boxShadow: "var(--shadow)",
          padding: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 950 }}>{title}</div>
          <button
            onClick={onClose}
            style={{ border: "none", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 18 }}
          >
            ✕
          </button>
        </div>
        <div style={{ marginTop: 12 }}>{children}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <GhostButton onClick={onClose}>Close</GhostButton>
          {onConfirm ? (
            confirmTone === "danger" ? (
              <button
                onClick={onConfirm}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 18,
                  border: "1px solid rgba(255,107,107,.35)",
                  background: "rgba(255,107,107,.12)",
                  color: "var(--danger)",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                {confirmText}
              </button>
            ) : (
              <PrimaryButton onClick={onConfirm}>{confirmText}</PrimaryButton>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div
      className="fadeIn"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 86,
        display: "flex",
        justifyContent: "center",
        zIndex: 99998,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          borderRadius: 999,
          border: "1px solid var(--border)",
          background: "rgba(0,0,0,.55)",
          backdropFilter: "blur(10px)",
          color: "var(--text)",
          fontWeight: 850,
          fontSize: 12,
        }}
      >
        {msg}
      </div>
    </div>
  );
}

function NavBtn({ active, onClick, icon, text }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        height: "100%",
        background: "transparent",
        border: "none",
        color: active ? "var(--primary)" : "var(--muted)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        cursor: "pointer",
        fontSize: 18,
        position: "relative",
        transition: "none", // ✅ stop motion
      }}
    >
      {active && (
        <div
          style={{
            position: "absolute",
            top: 6,
            width: 32,
            height: 4,
            borderRadius: 999,
            background: "linear-gradient(90deg, var(--primary), var(--primary2))",
            boxShadow: "0 0 20px rgba(25,230,162,.35)",
          }}
        />
      )}
      <span style={{ fontWeight: 950 }}>{icon}</span>
      {text ? <span style={{ fontSize: 11 }}>{text}</span> : null}
    </button>
  );
}

function BottomNav({ screen, setScreen }) {
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: 60,
        background: "rgba(8,14,16,0.85)",
        borderTop: "1px solid rgba(0,255,170,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 9999,
        backdropFilter: "blur(18px)",
      }}
    >
      <NavBtn active={screen === "HOME"} onClick={() => setScreen("HOME")} icon="🏠" text="Home" />
      <NavBtn active={screen === "SEARCH"} onClick={() => setScreen("SEARCH")} icon="⌕" text="Search" />
      <div style={{ flex: 1, display: "flex", justifyContent: "center", marginTop: 12 }}>
        <button
          onClick={() => setScreen("CREATE")}
          style={{
            width: 50,
            height: 50,
            borderRadius: 16,
            border: "1px solid rgba(0,255,170,.25)",
            background: "linear-gradient(135deg, #0f2f2a, #0b1f1c)",
            boxShadow: "0 8px 20px rgba(0,255,170,.18)",
            color: "#9effd6",
            fontSize: 16,
            cursor: "pointer",
            transition: "none", // ✅ stop motion
          }}
          title="Create"
        >
          ✦
        </button>
      </div>
      <NavBtn active={screen === "LATEST"} onClick={() => setScreen("LATEST")} icon="◷" text="Latest" />
      <NavBtn active={screen === "PROFILE"} onClick={() => setScreen("PROFILE")} icon="👤" text="Profile" />
    </div>
  );
}

function Pager({ pages, pageIndex, setPageIndex }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.clientWidth;
    // ✅ stop smooth scroll motion
    el.scrollTo({ left: w * pageIndex, behavior: "auto" });
  }, [pageIndex]);

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const idx = Math.round(el.scrollLeft / w);
    if (idx !== pageIndex) setPageIndex(idx);
  }

  return (
    <div>
      <div ref={ref} onScroll={onScroll} className="hScroll snapX" style={{ display: "flex", gap: 0, width: "100%" }}>
        {pages.map((p, i) => (
          <div key={i} className="snapItem" style={{ width: "100%", flex: "0 0 100%" }}>
            {p}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10 }}>
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => setPageIndex(i)}
            style={{
              width: i === pageIndex ? 22 : 8,
              height: 8,
              borderRadius: 999,
              border: "none",
              background: i === pageIndex ? "var(--primary)" : "rgba(255,255,255,.14)",
              cursor: "pointer",
              transition: "none", // ✅ stop motion
            }}
            title={`Page ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// -------------------- API HELPERS (with timeout) --------------------
async function apiGet(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  try {
    const base = String(API_BASE || "").replace(/\/$/, "");
    const p = String(path || "");
    const withTs = p;

    const r = await fetch(`${base}${withTs}`, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
      },
    });

    const j = await r.json().catch(() => ({}));
    return j;
  } catch (e) {
    if (e?.name === "AbortError") return { ok: false, error: "Request timeout (12s)" };
    return { ok: false, error: e?.message || "Network error" };
  } finally {
    clearTimeout(timer);
  }
}
async function fileToCompressedDataUrl(file, maxSize = 512, quality = 0.75) {
  const { img, url } = await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = reject;
    img.src = url;
  });

  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  const scale = Math.min(1, maxSize / Math.max(w, h));
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, tw, th);

  URL.revokeObjectURL(url);

  let out = canvas.toDataURL("image/webp", quality);
  if (!out || out.length < 20) out = canvas.toDataURL("image/jpeg", quality);

  if (out.length > 250000) {
    out = canvas.toDataURL("image/webp", 0.6);
    if (!out || out.length < 20) out = canvas.toDataURL("image/jpeg", 0.6);
  }

  return out;
}
async function apiPost(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000); // 60s

  try {
    const r = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await r.json().catch(() => ({}));
    return data;
  } catch (e) {
    if (e?.name === "AbortError") {
      return { ok: false, error: "Request timeout (60s). Backend/RPC slow." };
    }
    return { ok: false, error: e?.message || "Network error" };
  } finally {
    clearTimeout(timer);
  }
}

async function apiPostTry(paths, body) {
  let last = null;
  for (const p of paths) {
    try {
      const res = await apiPost(p, body);
      last = res;
      if (res?.ok) return res;
    } catch (e) {
      last = { ok: false, error: String(e?.message || e) };
    }
  }
  return last || { ok: false, error: "No endpoint responded" };
}// =========================== App.jsx (FULL FILE) — PART 4 / 5 ===========================

function isValidSymbol(s) {
  const v = (s || "").trim();
  if (v.length < 2 || v.length > 10) return false;
  return /^[A-Z0-9]+$/.test(v);
}
function isValidName(s) {
  const v = (s || "").trim();
  return v.length >= 2 && v.length <= 32;
}
function isValidStory(s) {
  const v = (s || "").trim();
  return v.length >= 20 && v.length <= 300;
}

function ensureCoinShape(c) {
  const live = String(c?.status || "").toUpperCase() === "LIVE";

  const mcRaw = Number(c?.mc || 0);
  const mc = live ? (mcRaw > 0 ? mcRaw : STARTING_MC_USD) : 0;

  const athRaw = Number(c?.ath || 0);
  const ath = live ? Math.max(athRaw || 0, mc) : 0;

  const rawChart = Array.isArray(c?.chart) ? c.chart.map((n) => Number(n || 0)) : [];
  const validChart = rawChart.filter((n) => Number.isFinite(n) && n > 0);

  const chart =
    live
      ? (validChart.length ? validChart : [mc, mc, mc, mc, mc])
      : [0, 0, 0, 0, 0];

  return {
    ...c,
    status: live ? "LIVE" : String(c?.status || "DRAFT"),
    mc,
    ath,
    chart,
    createdAt: Number(c?.createdAt || Date.now()),
    volumeSol: Number(c?.volumeSol || 0),
    creatorRewardsSol: Number(c?.creatorRewardsSol || 0),
    totalSupply: Number(c?.totalSupply || 0),
  };
}

function fmtTime(t) {
  const d = new Date(t);
  return d.toLocaleString();
}
function shortWallet(w) {
  const s = String(w || "");
  if (s.length <= 12) return s;
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}
function fmtUsd(n) {
  const x = Number(n || 0);

  if (x >= 1000) return `$${Math.round(x).toLocaleString()}`;
  if (x >= 1) return `$${x.toFixed(2)}`;
  if (x >= 0.01) return `$${x.toFixed(4)}`;
  if (x >= 0.0001) return `$${x.toFixed(6)}`;

  return `$${x.toExponential(2)}`;
}

function safeOrigin() {
  try {
    return window.location.origin;
  } catch {
    return "http://localhost:5173";
  }
}
function pctFromChart(chart) {
  const arr = Array.isArray(chart) ? chart : [];
  if (arr.length < 2) return 0;
  const a = Number(arr[arr.length - 2] || 0);
  const b = Number(arr[arr.length - 1] || 0);
  if (!a) return 0;
  return ((b - a) / a) * 100;
}

function CoinMiniCard({ c, subtitle, onOpen }) {
  return (
    <button
      onClick={onOpen}
      style={{
        width: "100%",
        textAlign: "left",
        padding: 12,
        borderRadius: 16,
        border: "1px solid var(--border)",
        background: "var(--card2)",
        color: "var(--text)",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <CoinLogo c={c} size={44} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 900,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {c?.name || c?.symbol || "—"}
          </div>

          <div
            style={{
              marginTop: 4,
              color: "var(--muted)",
              fontSize: 12,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {subtitle || ""}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 900 }}>{fmtUsd(c?.mc || 0)}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted)" }}>MC</div>
        </div>
      </div>
    </button>
  );
}

function PriceChart({ points, txMarkers, mode, onToggleMode }) {
  const W = 1000;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 520;
  const H = isMobile ? 240 : 380;
  const PAD = isMobile ? 16 : 22;

  const text = mode === "dark" ? "rgba(255,255,255,.72)" : "rgba(0,0,0,.62)";

  function fmtUsdLocal(n) {
    const x = Number(n || 0);

    if (!Number.isFinite(x) || x <= 0) return "$0";
    if (x >= 1000) return `$${Math.round(x).toLocaleString()}`;
    if (x >= 1) return `$${x.toFixed(2)}`;
    if (x >= 0.01) return `$${x.toFixed(4)}`;
    if (x >= 0.0001) return `$${x.toFixed(6)}`;
    return `$${x.toExponential(2)}`;
  }

  // points can be:
  // [1,2,3]
  // [{price:...}, {value:...}, {close:...}, {mc:...}]
  const raw = Array.isArray(points) ? points : [];

  const safePoints = raw
    .map((p) => {
      if (typeof p === "number") return p;
      if (p && typeof p === "object") {
        return Number(
          p.price ??
            p.value ??
            p.close ??
            p.last ??
            p.marketCap ??
            p.mc ??
            p.y ??
            0
        );
      }
      return Number(p || 0);
    })
    .filter((n) => Number.isFinite(n) && n >= 0);

  const series = safePoints.length ? safePoints : [0, 0, 0, 0, 0];

  const last = Number(series[series.length - 1] ?? 0);
const prev = Number(series[series.length - 2] ?? last);
const first = Number(series[0] ?? last);

const safeLast = Math.max(0, Number(last) || 0);
const safePrev = Math.max(0, Number(prev) || 0);
const safeFirst = Math.max(0, Number(first) || safeLast);

// % ko previous tick se nahi, visible chart ke first point se nikalo
const pct =
  safeFirst > 0 && Number.isFinite(safeFirst)
    ? ((safeLast - safeFirst) / safeFirst) * 100
    : 0;

const isUp = pct >= 0;

  const stroke = isUp
    ? mode === "dark"
      ? "#8BFFB7"
      : "#16A34A"
    : mode === "dark"
    ? "#FF7A7A"
    : "#DC2626";

  const glow = isUp
    ? mode === "dark"
      ? "rgba(139,255,183,.30)"
      : "rgba(34,197,94,.22)"
    : mode === "dark"
    ? "rgba(255,122,122,.28)"
    : "rgba(220,38,38,.18)";

  const areaTop = isUp
    ? mode === "dark"
      ? "rgba(139,255,183,.24)"
      : "rgba(34,197,94,.16)"
    : mode === "dark"
    ? "rgba(255,122,122,.18)"
    : "rgba(220,38,38,.12)";

  const label = safeLast > 0 ? fmtUsdLocal(safeLast) : "—";

  const minRaw = Math.min(...series);
  const maxRaw = Math.max(...series);

  // IMPORTANT: flat chart se bachne ke liye dynamic zoom
  const baseRange = maxRaw - minRaw;
 const ref = Math.max(Math.abs(maxRaw), Math.abs(minRaw), 0.0000000001);
  const visualPad = Math.max(baseRange * 0.18, ref * 0.01);
  const min = minRaw - visualPad;
  const max = maxRaw + visualPad;
  const span = Math.max(0.0000000001, max - min);

  const xAt = (i) =>
    PAD + (i * (W - PAD * 2)) / Math.max(1, series.length - 1);

  const yAt = (v) =>
    H - PAD - ((v - min) / span) * (H - PAD * 2);

  const coords = series.map((v, i) => ({
    x: xAt(i),
    y: yAt(v),
    v,
    i,
  }));

  console.log("PriceChart points raw:", points);
console.log("PriceChart series:", series);

  function buildSmoothPath(list) {
    if (!list.length) return "";
    if (list.length === 1) return `M ${list[0].x} ${list[0].y}`;

    let path = `M ${list[0].x} ${list[0].y}`;

    for (let i = 0; i < list.length - 1; i++) {
      const p0 = list[i - 1] || list[i];
      const p1 = list[i];
      const p2 = list[i + 1];
      const p3 = list[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  }

  const d = buildSmoothPath(coords);

  const area = coords.length
    ? `${d} L ${coords[coords.length - 1].x} ${H - PAD} L ${coords[0].x} ${H - PAD} Z`
    : "";

  const lx = coords.length ? coords[coords.length - 1].x : W - PAD;
  const ly = coords.length ? coords[coords.length - 1].y : H / 2;

  const gid = `areaFill_${mode}_${isUp ? "up" : "down"}`;
  const fid = `glow_${mode}_${isUp ? "up" : "down"}`;
  const pid = `pulse_${mode}_${isUp ? "up" : "down"}`;

  const grid = [0.2, 0.4, 0.6, 0.8].map((r) => PAD + (H - PAD * 2) * r);

  const dotItems = (Array.isArray(txMarkers) ? txMarkers : [])
    .map((m, idx) => {
      const rawIndex = Number(m?.index ?? m?.i ?? m?.pointIndex ?? idx);
      if (!Number.isFinite(rawIndex) || !coords.length) return null;

      const index = Math.max(0, Math.min(coords.length - 1, rawIndex));
      const p = coords[index];
      if (!p) return null;

      const buyish = String(m?.side || m?.type || "")
        .toLowerCase()
        .includes("buy");

      return {
        id: m?.id || `dot-${idx}-${index}`,
        x: p.x,
        y: p.y,
        fill: buyish
          ? mode === "dark"
            ? "#A7FFC8"
            : "#16A34A"
          : mode === "dark"
          ? "#FFB0B0"
          : "#DC2626",
        shadow: buyish
          ? "rgba(34,197,94,.18)"
          : "rgba(220,38,38,.16)",
      };
    })
    .filter(Boolean)
    .slice(-8);

  return (
    <div
      style={{
        borderRadius: 22,
        border:
          mode === "dark"
            ? "1px solid rgba(255,255,255,.08)"
            : "1px solid rgba(0,0,0,.08)",
        background:
          mode === "dark"
            ? "linear-gradient(180deg, #0B1016 0%, #0A0F14 100%)"
            : "linear-gradient(180deg, #FFFFFF 0%, #F6F8FA 100%)",
        boxShadow:
          mode === "dark"
            ? "0 12px 40px rgba(0,0,0,.28)"
            : "0 10px 30px rgba(0,0,0,.08)",
        padding: isMobile ? 12 : 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12, color: text, fontWeight: 950 }}>
            Price:{" "}
            <span style={{ color: mode === "dark" ? "#fff" : "#000" }}>
              {label}
            </span>
          </div>

          <div
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: `1px solid ${
                isUp ? "rgba(22,199,132,.30)" : "rgba(255,77,77,.30)"
              }`,
              background: isUp
                ? "rgba(22,199,132,.10)"
                : "rgba(255,77,77,.10)",
              color: isUp ? "#16C784" : "#FF4D4D",
              fontWeight: 950,
              fontSize: 12,
            }}
          >
            {isUp ? "▲" : "▼"}{" "}
            {Number.isFinite(pct) ? Math.abs(pct).toFixed(2) : "0.00"}%
          </div>
        </div>

        {typeof onToggleMode === "function" ? (
          <button
            onClick={onToggleMode}
            style={{
              border:
                mode === "dark"
                  ? "1px solid rgba(255,255,255,.10)"
                  : "1px solid rgba(0,0,0,.08)",
              background:
                mode === "dark"
                  ? "rgba(255,255,255,.04)"
                  : "rgba(0,0,0,.03)",
              color: mode === "dark" ? "#fff" : "#000",
              borderRadius: 999,
              padding: "7px 12px",
              fontWeight: 900,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {mode === "dark" ? "Light" : "Dark"}
          </button>
        ) : null}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={isMobile ? "240" : "340"}
        style={{
          display: "block",
          overflow: "visible",
          borderRadius: 18,
        }}
      >
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={areaTop} />
            <stop offset="55%" stopColor={areaTop} stopOpacity="0.45" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>

          <filter id={fid} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id={pid} cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor={
                isUp ? "rgba(124,255,184,.95)" : "rgba(255,122,122,.90)"
              }
            />
            <stop
              offset="45%"
              stopColor={
                isUp ? "rgba(124,255,184,.35)" : "rgba(255,122,122,.30)"
              }
            />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>

        {grid.map((y, i) => (
          <line
            key={`grid-${i}`}
            x1={PAD}
            x2={W - PAD}
            y1={y}
            y2={y}
            stroke={
              mode === "dark"
                ? "rgba(255,255,255,.045)"
                : "rgba(0,0,0,.05)"
            }
            strokeWidth="1"
          />
        ))}

        <path d={area} fill={`url(#${gid})`} />

        <path
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter={`url(#${fid})`}
          opacity="0.35"
        />

        <path
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {dotItems.map((p) => (
          <g key={p.id} opacity="0.9">
            <circle cx={p.x} cy={p.y} r="8" fill={p.shadow} />
            <circle cx={p.x} cy={p.y} r="3.5" fill={p.fill} />
          </g>
        ))}

        <line
          x1={PAD}
          x2={W - PAD}
          y1={ly}
          y2={ly}
          stroke={
            isUp ? "rgba(124,255,184,.28)" : "rgba(255,122,122,.22)"
          }
          strokeWidth="1"
          strokeDasharray="4 6"
        />

        <g>
          <circle cx={lx} cy={ly} r="26" fill={`url(#${pid})`} opacity="0.9" />
          <circle cx={lx} cy={ly} r="8" fill={stroke} />
          <circle
            cx={lx}
            cy={ly}
            r="4.2"
            fill={mode === "dark" ? "#081017" : "#FFFFFF"}
          />
        </g>

        <g
          transform={`translate(${Math.min(W - 92, lx + 10)}, ${Math.max(
            24,
            ly - 16
          )})`}
        >
          <rect
            x="0"
            y="0"
            rx="10"
            ry="10"
            width="82"
            height="24"
            fill={isUp ? "#86EFAC" : "#FCA5A5"}
          />
          <text
            x="41"
            y="16"
            textAnchor="middle"
            fontSize="11"
            fontWeight="800"
            fill="#0B0F14"
            style={{ letterSpacing: ".2px" }}
          >
            {label}
          </text>
        </g>
      </svg>
    </div>
  );
}

// =========================== App.jsx (FULL FILE) — PART 5 / 5 ===========================
// ✅ Paste this PART 5 by REPLACING your current PART 5 completely.
// ✅ This PART 5 is COMPLETE (no “rest of screens paste later” wali kami nahi hogi).

function ThemeOption({ theme, current, setTheme, label }) {
  const active = current === theme;
  return (
    <button
      onClick={() => setTheme(theme)}
      style={{
        width: "100%",
        padding: 12,
        borderRadius: 18,
        border: active ? "2px solid var(--primary)" : "1px solid var(--border)",
        background: "rgba(255,255,255,.03)",
        color: "var(--text)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
        fontWeight: 900,
      }}
    >
      <span>{label}</span>
      <span style={{ color: "var(--muted)" }}>{active ? "Selected" : "Tap"}</span>
    </button>
  );
}

function NetLogo({ chain }) {
  const c = String(chain || "").toLowerCase();
  const common = { width: 24, height: 24, viewBox: "0 0 24 24" };

  if (c === "solana") {
    return (
      <svg {...common} aria-label="Solana">
        <defs>
          <linearGradient id="solg2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#14F195" />
            <stop offset="1" stopColor="#9945FF" />
          </linearGradient>
        </defs>
        <path
          d="M6.2 7.1c.3-.3.7-.5 1.1-.5h12.2c.2 0 .3.3.1.4l-2 2c-.3.3-.7.5-1.1.5H4.3c-.2 0-.3-.3-.1-.4l2-2z"
          fill="url(#solg2)"
        />
        <path
          d="M6.2 11.3c.3-.3.7-.5 1.1-.5h12.2c.2 0 .3.3.1.4l-2 2c-.3.3-.7.5-1.1.5H4.3c-.2 0-.3-.3-.1-.4l2-2z"
          fill="url(#solg2)"
          opacity="0.9"
        />
        <path
          d="M6.2 15.5c.3-.3.7-.5 1.1-.5h12.2c.2 0 .3.3.1.4l-2 2c-.3.3-.7.5-1.1.5H4.3c-.2 0-.3-.3-.1-.4l2-2z"
          fill="url(#solg2)"
          opacity="0.8"
        />
      </svg>
    );
  }

  if (c === "bnb") {
    return (
      <svg {...common} aria-label="BNB">
        <path
          d="M12 2.6l3.8 3.8L12 10.2 8.2 6.4 12 2.6zm0 6.9l2.5 2.5L12 14.5 9.5 12 12 9.5zm6.1-3.1l3.8 3.8-3.8 3.8-3.8-3.8 3.8-3.8zM5.9 6.4l3.8 3.8-3.8 3.8L2.1 10.2 5.9 6.4zM12 13.8l3.8 3.8L12 21.4 8.2 17.6 12 13.8z"
          fill="#F0B90B"
        />
      </svg>
    );
  }

  return (
    <svg {...common} aria-label="Polygon">
      <path
        d="M16.6 8.1c-1.1-.6-2.5-.6-3.6 0l-2.2 1.3-1.5-.9c-1.1-.6-2.5-.6-3.6 0-1.1.6-1.8 1.8-1.8 3v2.6c0 1.3.7 2.4 1.8 3 1.1.6 2.5.6 3.6 0l2.2-1.3 1.5.9c1.1.6 2.5.6 3.6 0 1.1-.6 1.8-1.8 1.8-3v-2.6c0-1.3-.7-2.4-1.8-3zm-7.3 10.1c-.5.3-1.1.3-1.6 0-.5-.3-.8-.8-.8-1.4v-2.6c0-.6.3-1.1.8-1.4.5-.3 1.1-.3 1.6 0l1.2.7v5.3l-1.2-.6zm10-1.4c0 .6-.3 1.1-.8 1.4-.5.3-1.1.3-1.6 0l-1.2-.7V12l1.2-.7c.5-.3 1.1-.3 1.6 0 .5.3.8.8.8 1.4v2.6z"
        fill="#8247E5"
      />
    </svg>
  );
}

export default function App() {
  const { login, authenticated, user, ready, logout, connectOrCreateWallet } = usePrivy();
  const { exportWallet } = useExportWallet();

  const [showIntro, setShowIntro] = useState(() => {
    try {
      return sessionStorage.getItem("introSeen") !== "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!showIntro) return;

    const t = setTimeout(() => {
      try {
        sessionStorage.setItem("introSeen", "1");
      } catch {}
      setShowIntro(false);
    }, 5000);

    return () => clearTimeout(t);
  }, [showIntro]);

  // ✅ capture ?ref= in URL (store once)
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const ref = (url.searchParams.get("ref") || "").trim();
      if (ref) {
        localStorage.setItem("ref", ref);
        url.searchParams.delete("ref");
        window.history.replaceState({}, "", url.toString());
      }
    } catch {}
  }, []);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 520;

  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem(LS_THEME) || "calm");
  const [screen, setScreen] = useState("HOME");
  const [selectedCoinId, setSelectedCoinId] = useState(null);
  const [creatorProfileId, setCreatorProfileId] = useState("");
  const [homePage, setHomePage] = useState(0);

  const [balance, setBalance] = useState("—");
  const [loadingBal, setLoadingBal] = useState(false);

  const [coins, setCoins] = useState([]);
  const [loadingCoins, setLoadingCoins] = useState(false);
  const [coinsPage, setCoinsPage] = useState(0);
const [coinsHasMore, setCoinsHasMore] = useState(true);
const coinsLoadMoreRef = useRef(null);

useEffect(() => {
  if (screen !== "HOME") return;
  if (!coinsHasMore) return;
  if (loadingCoins) return;

  const el = coinsLoadMoreRef.current;
  if (!el) return;

  const obs = new IntersectionObserver(
    (entries) => {
      const first = entries[0];
      if (!first?.isIntersecting) return;
      if (loadCoinsInFlight) return;
      console.log("LOAD COINS PAGE:", coinsPage);
      loadCoins(coinsPage + 1, true);
    },
    {
      root: null,
      rootMargin: "200px",
      threshold: 0.1,
    }
  );

  obs.observe(el);
  return () => obs.disconnect();
}, [screen, coinsPage, coinsHasMore, loadingCoins]);

  const [searchQ, setSearchQ] = useState("");
  const [searchMode, setSearchMode] = useState("SEARCH");

  const [tokenName, setTokenName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [story, setStory] = useState("");
  const [initialSol, setInitialSol] = useState("0.01");
  const [totalSupply, setTotalSupply] = useState("1000000000");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [logoPreview, setLogoPreview] = useState("");
  const [logoError, setLogoError] = useState("");

  const onPickLogo = async (file) => {
    if (!file) return;

    try {
      const b64 = await fileToCompressedDataUrl(file, 512, 0.75);
      setLogoPreview(b64);
      setLogoError("");
    } catch (e) {
      setLogoError("Invalid image");
    }
  };

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [chartMode, setChartMode] = useState("light");
  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeSide, setTradeSide] = useState("BUY");
  const [tradeSol, setTradeSol] = useState("0.05");
  const [tradeLoading, setTradeLoading] = useState(false);

  const [dwOpen, setDwOpen] = useState(false);
  const [dwMode, setDwMode] = useState("DEPOSIT");
  const [withdrawTo, setWithdrawTo] = useState("");
  const [oneClickW, setOneClickW] = useState("");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 1500);
  }

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(LS_THEME, theme);
  }, [theme]);

  const solAddr =
    user?.linkedAccounts?.find((a) => a.type === "wallet" && a.chainType === "solana")?.address || "";

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied ✅");
      return true;
    } catch {
      showToast("Copy failed");
      return false;
    }
  }

  async function refreshBalance(addr = solAddr) {
    if (!addr) return;
    const address =
      typeof addr === "string"
        ? addr
        : addr?.address || addr?.publicKey?.toBase58?.() || addr?.publicKey || "";
    if (!address) return;

    setLoadingBal(true);
    try {
      const data = await apiGet(`/api/balance/${encodeURIComponent(address)}`);
      const sol =
        Number.isFinite(Number(data?.sol))
          ? Number(data.sol)
          : Number.isFinite(Number(data?.balance))
          ? Number(data.balance)
          : Number.isFinite(Number(data?.lamports))
          ? Number(data.lamports) / 1_000_000_000
          : 0;
      setBalance(sol.toFixed(4));
    } catch {
      setBalance("—");
    }
    setLoadingBal(false);
  }

let loadCoinsInFlight = false;

async function loadCoins(page = 0, append = false) {
  if (loadCoinsInFlight) return;

  loadCoinsInFlight = true;
  setLoadingCoins(true);

  try {
    // page 0 par cache foran dikhao
    if (page === 0 && !append) {
      try {
        const cachedRaw = localStorage.getItem("coins_cache_v1");
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (Array.isArray(cached) && cached.length) {
            setCoins(cached.map(ensureCoinShape));
          }
        }
      } catch {}
    }

    const data = await apiGet(`/api/coin/list?page=${page}`);
    console.log("API DATA:", data);

    if (data?.ok) {
      const nextCoins = (data.coins || []).map(ensureCoinShape);

      if (append) {
        setCoins((prev) => {
          const map = new Map();
          [...prev, ...nextCoins].forEach((c) => map.set(c.id, c));
          return Array.from(map.values());
        });
      } else {
        console.log("NEXT COINS:", nextCoins);
        setCoins(nextCoins);

        try {
          localStorage.setItem("coins_cache_v1", JSON.stringify(nextCoins));
        } catch {}
      }

      setCoinsPage(page);
      setCoinsHasMore(nextCoins.length === 100);
    }
  } catch {
  } finally {
    setLoadingCoins(false);
    loadCoinsInFlight = false;
  }
}                                                                                                       

  async function loadProfile() {
  if (!solAddr) return;
  setLoadingProfile(true);
  try {
    const j = await apiGet(`/api/profile/${solAddr}`);
    if (j?.ok) {
      setProfile({
        ...(j.profile || {}),
        myCreations: Array.isArray(j.myCreations) ? j.myCreations : [],
        lastTx: Array.isArray(j.lastTx) ? j.lastTx : [],
      });
    }
  } catch {}
  setLoadingProfile(false);
}

  useEffect(() => {
    if (!authenticated || !solAddr) return;

     loadProfile();

    const t = setTimeout(() => {
      refreshBalance();
    }, 600);

    return () => clearTimeout(t);
  }, [authenticated, solAddr]);

 
useEffect(() => {
  if (!authenticated) return;
  if (!(screen === "HOME" || screen === "LATEST")) return;

  loadCoins();

const t = setInterval(() => {
  loadCoins();
}, 12000);

  return () => clearInterval(t);
}, [screen, authenticated]);

  const coinsSorted = useMemo(() => {
    const arr = [...coins];
    arr.sort((a, b) => {
      const al = a.status === "LIVE" ? 1 : 0;
      const bl = b.status === "LIVE" ? 1 : 0;
      if (al !== bl) return bl - al;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return arr;
  }, [coins]);

  const selectedCoin = coins.find((c) => c.id === selectedCoinId) || null;

  const movers = useMemo(() => {
    const live = coinsSorted.filter((c) => c.status === "LIVE");
    const scored = live.map((c) => ({ c, p: pctFromChart(c.chart) }));
    scored.sort((a, b) => Math.abs(b.p) - Math.abs(a.p));
    return scored.slice(0, 12).map((x) => x.c);
  }, [coinsSorted]);

  const myReferralLink = useMemo(() => {
    if (!solAddr) return "";
    return `${safeOrigin()}/?ref=${solAddr}`;
  }, [solAddr]);

  const referralFromStore = useMemo(() => {
    try {
      return String(localStorage.getItem("ref") || "").trim();
    } catch {
      return "";
    }
  }, []);

  const [refStatus, setRefStatus] = useState("");

  async function trySetReferral() {
    if (!solAddr) return;
    if (!referralFromStore) return;
    if (referralFromStore === solAddr) return;

    try {
      const res = await apiPost("/api/referral/set", { wallet: solAddr, referrer: referralFromStore });
      if (res?.ok) setRefStatus("set");
      else if (String(res?.error || "").toLowerCase().includes("immutable")) setRefStatus("already");
      else setRefStatus("invalid");
    } catch {}
  }

  useEffect(() => {
    if (!authenticated || !solAddr) return;
    trySetReferral();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, solAddr]);
  useEffect(() => {
  if (screen !== "HOME") return;
  loadCoins(0, false);
}, [screen]);

  const myHoldingsList = useMemo(() => {
    const arr = Array.isArray(profile?.holdings) ? profile.holdings : [];
    return [...arr].sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
  }, [profile]);

  const myTxList = useMemo(() => {
    const arr = Array.isArray(profile?.txs) ? profile.txs : [];
    return [...arr].sort((a, b) => (b.t || 0) - (a.t || 0));
  }, [profile]);

  // ✅ REWARDS FIX (robust fields)
  const myRewards = useMemo(() => {
    const r = profile?.rewards || profile?.creatorRewards || {};
    const totalSol = Number(r?.totalSol ?? r?.total ?? r?.sol ?? profile?.creatorRewardsSol ?? 0) || 0;
    const byCoin = r?.byCoin && typeof r.byCoin === "object" ? r.byCoin : {};
    return { totalSol, byCoin };
  }, [profile]);

  const myReferralRewardsSol = useMemo(() => {
    const rr = profile?.referralRewards || profile?.refRewards || {};
    const d = Number(rr?.totalSol ?? rr?.total ?? rr?.sol ?? profile?.referralRewardsSol ?? 0) || 0;
    return Number.isFinite(d) && d > 0 ? d : 0;
  }, [profile]);

 const myCreations = useMemo(() => {
  const fromProfile = Array.isArray(profile?.myCreations) ? profile.myCreations : [];
  if (fromProfile.length) return fromProfile.map(ensureCoinShape);

  if (!solAddr) return [];

  const w = String(solAddr).trim();

  return coinsSorted.filter((c) => {
    const cw = String(c.creatorWallet || c.creator_wallet || c.owner || "").trim();
    return cw === w;
  });
}, [profile, coinsSorted, solAddr]);

  const symbolUpper = (symbol || "").toUpperCase().replace(/\s+/g, "");

  const nameOk = isValidName(tokenName);
  const symOk = isValidSymbol(symbolUpper);
  const storyOk = isValidStory(story);
  const nSol = Number(initialSol);
  const paidOk = Number.isFinite(nSol) && (nSol === 0 || nSol >= 0.01);

  const logoOk = !!logoPreview && !logoError;
  const canCreate = nameOk && symOk && storyOk && paidOk && logoOk;

  const nameErr = !tokenName ? "" : nameOk ? "" : "Name 2–32 chars";
  const symErr = !symbolUpper ? "" : symOk ? "" : "Symbol 2–10 (A-Z/0-9)";
  const storyErr = !story ? "" : storyOk ? "" : "Story 20–300 chars";
  const solErr = paidOk ? "" : "Paid create min 0.01 SOL. Free = 0";

  async function openPrivyBackup() {
    try {
      await connectOrCreateWallet?.();
    } catch {}
    try {
      await exportWallet(solAddr ? { address: solAddr } : undefined);
    } catch {
      showToast("Backup modal open nahi hua");
    }
  }

  async function doTrade(coin, side, solAmount) {
    const s = Number(solAmount);
    if (!solAddr) return showToast("Wallet not ready");
    if (!Number.isFinite(s) || s <= 0) return showToast("Amount invalid");

    const SIDE = String(side || "").toUpperCase();
    const endpoint = SIDE === "BUY" ? "/api/coin/buy" : "/api/coin/sell";

    setTradeLoading(true);
    try {
      const res = await apiPost(endpoint, {
        wallet: solAddr,
        coinId: coin.id,
        sol: s,
      });

      if (!res?.ok) {
        showToast(res?.error || "Trade failed");
        return;
      }

      if (res.coin) {
        const updated = ensureCoinShape(res.coin);
        setCoins((prev) => (prev || []).map((x) => (x.id === updated.id ? updated : x)));
      }

      await loadProfile();
      await refreshBalance();
      showToast(`${SIDE} ${s} ✅`);
    } catch (e) {
      showToast(e?.message || "Network error");
    } finally {
      setTradeLoading(false);
    }
  }

  async function oneClickWithdraw(kind) {
    if (!solAddr) return showToast("Wallet not ready");
    setOneClickW(kind);

    const routes = ["/api/withdraw", "/api/withdraw/creator", "/api/withdraw/referral"];
    const kindModern = kind === "REF" ? "REFERRAL" : kind === "CREATOR" ? "CREATOR" : kind;

    let res = await apiPostTry(routes, { wallet: solAddr, to: solAddr, kind: kindModern });
    if (!res?.ok) {
      res = await apiPostTry(routes, { wallet: solAddr, to: solAddr, kind });
    }

    if (res?.ok) {
      showToast("Withdraw ✅ (sent to main wallet)");
      await loadProfile();
      await refreshBalance();
    } else {
      showToast(res?.error || "Withdraw failed");
    }

    setOneClickW("");
  }

  function openDeposit() {
    if (!solAddr) return showToast("Wallet not ready");
    setDwMode("DEPOSIT");
    setDwOpen(true);
    copyText(solAddr);
  }

  function openWithdraw() {
    if (!solAddr) return showToast("Wallet not ready");
    setDwMode("WITHDRAW");
    setWithdrawTo("");
    setDwOpen(true);
  }

  // -------------------- UI CONTENT --------------------
  let content = null;

  if (!ready) {
    content = (
      <ScreenShell>
        <Title sub="Please wait…">Loading</Title>
        <div style={{ color: "var(--muted)" }}>Privy initializing…</div>
      </ScreenShell>
    );
  } else if (!authenticated) {
    content = (
      <ScreenShell>
        <Title sub="Continue with Google">Login</Title>
        <PrimaryButton onClick={login}>Continue with Google</PrimaryButton>
      </ScreenShell>
    );
  } else {
    if (screen === "HOME") {
      const page1 = (
        <div>
          <Title sub={null} right={<MiniBtn onClick={() => setScreen("PROFILE")}>Profile</MiniBtn>}>
            Home
          </Title>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>Wallet</div>
                <div style={{ fontWeight: 950 }}>{shortWallet(solAddr)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>Balance</div>
                <div style={{ fontWeight: 950 }}>{loadingBal ? "…" : `${balance} SOL`}</div>
              </div>
            </div>

            <div style={{ height: 10 }} />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <MiniBtn onClick={() => solAddr && copyText(solAddr)} disabled={!solAddr}>
                Copy Address
              </MiniBtn>
              <MiniBtn onClick={openDeposit} disabled={!solAddr} tone="good">
                Deposit
              </MiniBtn>
            </div>
          </Card>

          <div style={{ height: 12 }} />

         
              <Card>
            <SectionHeader title={`Top ${coins.length} Coins`} right={<Pill tone="good">LIVE</Pill>} />
            <div
              className="miniScroll"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                maxHeight: "calc(100vh - 220px)",
                overflowY: "auto",
                overflowX: "hidden",
                paddingRight: 6,
                }}
            >


            
              {(coins || []).map((c) => (
                <CoinMiniCard
                  key={c.id}
                  c={c}
                  subtitle={`Volume • ${Number(c.volumeSol || 0).toFixed(2)} SOL`}
                  onOpen={() => {
                    setSelectedCoinId(c.id);

try {
  localStorage.setItem("last_open_coin", JSON.stringify(c));
} catch {}
                    setScreen("COIN");
                  }}
                />
              ))}

              <div
  ref={coinsLoadMoreRef}
  style={{
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    color: "var(--muted)",
    fontSize: 12,
  }}
>
  {loadingCoins ? "Loading..." : coinsHasMore ? "Scroll for more" : "No more coins"}
</div>

              <div
  ref={coinsLoadMoreRef}
  style={{
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    color: "var(--muted)",
    fontSize: 12,
  }}
>
  {loadingCoins ? "Loading..." : coinsHasMore ? "Scroll for more" : "No more coins"}
</div>

<div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
  {coinsHasMore ? (
    <MiniBtn
      onClick={() => loadCoins(coinsPage + 1, true)}
      disabled={loadingCoins}
      tone="good"
    >
      {loadingCoins ? "Loading..." : "More"}
    </MiniBtn>
  ) : (
    <div style={{ color: "var(--muted)", fontSize: 12 }}>No more coins</div>
  )}
</div>

            </div>
          </Card>
        </div>
      );

      const page2 = (
        <div>
          <Title sub={null} right={<MiniBtn onClick={() => setScreen("LATEST")}>Open Latest</MiniBtn>}>
            Highlights
          </Title>

          <Card>
            <SectionHeader title="Quick actions" />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <MiniBtn tone="good" onClick={() => setScreen("CREATE")}>
                ✦ Create coin
              </MiniBtn>
              <MiniBtn onClick={() => setScreen("SEARCH")}>⌕ Search</MiniBtn>
              <MiniBtn onClick={() => setScreen("PROFILE")}>👤 Profile</MiniBtn>
              <MiniBtn onClick={() => setScreen("SETTINGS")}>⚙ Settings</MiniBtn>
            </div>
          </Card>

          <div style={{ height: 12 }} />

          <Card>
            <SectionHeader title="Movers" right={<Pill>{movers.length}</Pill>} />
            <div className="hScroll" style={{ display: "flex", gap: 10, paddingBottom: 6 }}>
              {movers.length === 0 ? (
                <div style={{ color: "var(--muted)", fontSize: 12 }}>No live movers yet.</div>
              ) : (
                movers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCoinId(c.id);

try {
  localStorage.setItem("last_open_coin", JSON.stringify(c));
} catch {}
                      setScreen("COIN");
                    }}
                    style={{
                      minWidth: 240,
                      width: 240,
                      padding: 12,
                      borderRadius: 18,
                      border: "1px solid var(--border)",
                      background: "linear-gradient(180deg, rgba(255,255,255,.03), rgba(0,0,0,.14)), var(--card2)",
                      color: "var(--text)",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <CoinLogo c={c} size={44} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 950 }}>{c.symbol || "—"}</div>
                        <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 12 }}>
                          {fmtUsd(c.mc || 0)} • {Number(c.volumeSol || 0).toFixed(2)} SOL
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      );

      content = (
        <ScreenShell>
          <Pager pages={[page1, page2]} pageIndex={homePage} setPageIndex={setHomePage} />
        </ScreenShell>
      );
    }

    if (screen === "SEARCH") {
      const getPct24h = (c) => {
        const prev = Number(c?.price24hAgo ?? c?.prevPrice ?? 0);
        const cur = Number(c?.price ?? 0);
        if (!prev || prev <= 0) return 0;
        return ((cur - prev) / prev) * 100;
      };

      const filtered = (coins || []).filter((c) => {
        const q = String(searchQ || "").trim().toLowerCase();
        if (!q) return true;
        return String(c.name || "").toLowerCase().includes(q) || String(c.symbol || "").toLowerCase().includes(q);
      });

      const topVol20 = (coins || [])
        .slice()
        .sort((a, b) => Number(b.volumeSol || 0) - Number(a.volumeSol || 0))
        .slice(0, 20);

      const topMoves20 = (coins || [])
        .slice()
        .map((c) => ({ c, pct: getPct24h(c) }))
        .filter((x) => x.pct >= 10)
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 20);

      content = (
        <ScreenShell>
          <Title sub={null}>Search</Title>

          <Input
            label="Search for a coin"
            value={searchQ}
            onChange={(v) => {
              setSearchQ(v);
              if (searchMode !== "SEARCH") setSearchMode("SEARCH");
            }}
            placeholder="type name or symbol…"
            rightIcon={<span style={{ fontWeight: 950 }}>⌕</span>}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <MiniBtn onClick={() => setSearchMode("SEARCH")} style={{ flex: 1, opacity: searchMode === "SEARCH" ? 1 : 0.7 }}>
              Search
            </MiniBtn>
            <MiniBtn onClick={() => setSearchMode("TOPVOL")} style={{ flex: 1, opacity: searchMode === "TOPVOL" ? 1 : 0.7 }}>
              Top Volume
            </MiniBtn>
            <MiniBtn
              onClick={() => setSearchMode("TOPMOVES")}
              style={{ flex: 1, opacity: searchMode === "TOPMOVES" ? 1 : 0.7 }}
            >
              Top Moves 24h
            </MiniBtn>
          </div>

          <div
            className="miniScroll"
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              maxHeight: "calc(100vh - 260px)",
              overflowY: "auto",
              overflowX: "hidden",
              paddingRight: 6,
              paddingBottom: 90,
            }}
          >
            {searchMode === "SEARCH" &&
              filtered.map((c) => (
                <CoinMiniCard
                  key={c.id}
                  c={c}
                  onOpen={() => {
                    setSelectedCoinId(c.id);

try {
  localStorage.setItem("last_open_coin", JSON.stringify(c));
} catch {}
                    setScreen("COIN");
                  }}
                />
              ))}

            {searchMode === "TOPVOL" &&
              topVol20.map((c) => (
                <CoinMiniCard
                  key={c.id}
                  c={c}
                  subtitle={`Volume • ${Number(c.volumeSol || 0).toFixed(2)} SOL`}
                  onOpen={() => {
                    setSelectedCoinId(c.id);

try {
  localStorage.setItem("last_open_coin", JSON.stringify(c));
} catch {}
                    setScreen("COIN");
                  }}
                />
              ))}

            {searchMode === "TOPMOVES" &&
              topMoves20.map(({ c, pct }) => (
                <CoinMiniCard
                  key={c.id}
                  c={c}
                  subtitle={`24h Move • ${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`}
                  onOpen={() => {
                    setSelectedCoinId(c.id);

try {
  localStorage.setItem("last_open_coin", JSON.stringify(c));
} catch {}
                    setScreen("COIN");
                  }}
                />
              ))}
          </div>
        </ScreenShell>
      );
    }

    if (screen === "LATEST") {
      content = (
        <ScreenShell>
          <Title sub={null} right={<MiniBtn onClick={loadCoins} disabled={loadingCoins}>{loadingCoins ? "…" : "Refresh"}</MiniBtn>}>
            Latest
          </Title>

          <div style={{ margin: "10px 0 14px" }}>
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search name / symbol..."
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,.10)",
                background: "rgba(0,0,0,.18)",
                color: "var(--text)",
                outline: "none",
              }}
            />
          </div>

          {(() => {
            const latestCoins = (coins || [])
              .slice()
              .sort((a, b) => Number(b.createdAt || b.ts || b.time || 0) - Number(a.createdAt || a.ts || a.time || 0))
              .slice(0, 20);

            const latestFiltered = latestCoins.filter((c) => {
              const q = String(searchQ || "").trim().toLowerCase();
              if (!q) return true;
              return String(c.name || "").toLowerCase().includes(q) || String(c.symbol || "").toLowerCase().includes(q);
            });

            return (
              <div
                className="miniScroll"
                style={{
                  marginTop: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  maxHeight: "calc(100vh - 260px)",
                  overflowY: "auto",
                  paddingBottom: 110,
                }}
              >
                {latestFiltered.length === 0 ? (
                  <div style={{ opacity: 0.7 }}>No coins found.</div>
                ) : (
                  latestFiltered.map((c) => (
                    <CoinMiniCard
                      key={c.id}
                      c={c}
                      onOpen={() => {
                        setSelectedCoinId(c.id);

try {
  localStorage.setItem("last_open_coin", JSON.stringify(c));
} catch {}
                        setScreen("COIN");
                      }}
                    />
                  ))
                )}
              </div>
            );
          })()}
        </ScreenShell>
      );
    }

    if (screen === "CREATOR") {
  const creatorId = creatorProfileId || "";
  const creatorCoins = (coins || []).filter((x) => x.creatorWallet === creatorId);

 const creatorRewards = creatorCoins.reduce(
  (sum, coin) =>
    sum + Number(coin?.creatorRewardsSol || coin?.creatorRewardAccrued || coin?.creatorRewards || 0),
  0
);

  const creatorHoldings = creatorCoins
    .map((coin) => {
      const amt = Number(coin?.holders?.[creatorId] || 0);
      const supply = Number(coin?.totalSupply || 0);
      const pct = supply > 0 ? (amt / supply) * 100 : 0;
      return { coin, amt, pct };
    })
    .filter((x) => x.amt > 0);

  content = (
    <ScreenShell>
      <Title
        sub={
          <span style={{ color: "var(--muted2)" }}>
            Coin Creator Profile
          </span>
        }
        right={
          <MiniBtn onClick={() => setScreen("COIN")}>
            Back
          </MiniBtn>
        }
      >
        <span style={{ fontWeight: 950 }}>{shortWallet(creatorId)}</span>
      </Title>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <Pill>{shortWallet(creatorId)}</Pill>
        <Pill tone="warn">Coins: {creatorCoins.length}</Pill>
        <Pill tone="good">Creator Reward: {Number(creatorRewards || 0).toFixed(6)} SOL</Pill>
      </div>

      <Card>
        <SectionHeader title="Created Coins" right={<Pill>{creatorCoins.length}</Pill>} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {creatorCoins.length === 0 ? (
            <div style={{ color: "var(--muted2)", fontSize: 13 }}>No created coins yet.</div>
          ) : (
            creatorCoins.map((coin) => (
              <button
                key={coin.id}
                onClick={() => {
                  setSelectedCoinId(coin.id);
                  setScreen("COIN");
                }}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "var(--card2)",
                  color: "var(--text)",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 900 }}>{coin.symbol || "—"}</div>
                    <div style={{ fontSize: 12, color: "var(--muted2)" }}>
                      {coin.name || "Unnamed coin"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900 }}>{fmtUsd(Number(coin.mc || 0))}</div>
                    <div style={{ fontSize: 12, color: "var(--muted2)" }}>MC</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <div style={{ height: 12 }} />

      <Card>
        <SectionHeader title="Creator Holdings" right={<Pill>{creatorHoldings.length}</Pill>} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {creatorHoldings.length === 0 ? (
            <div style={{ color: "var(--muted2)", fontSize: 13 }}>No holdings found.</div>
          ) : (
            creatorHoldings.map(({ coin, amt, pct }) => (
              <button
                key={coin.id}
                onClick={() => {
                  setSelectedCoinId(coin.id);
                  setScreen("COIN");
                }}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "var(--card2)",
                  color: "var(--text)",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 900 }}>{coin.symbol || "—"}</div>
                    <div style={{ fontSize: 12, color: "var(--muted2)" }}>
                      {Number(amt || 0).toFixed(2)} held
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900 }}>{pct.toFixed(2)}%</div>
                    <div style={{ fontSize: 12, color: "var(--muted2)" }}>of supply</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>
    </ScreenShell>
  );
}



    if (screen === "COIN") {
      if (!selectedCoin) {
        content = (
          <ScreenShell>
            <Title sub="Pick from Home">No coin selected</Title>
            <GhostButton onClick={() => setScreen("HOME")}>Go Home</GhostButton>
          </ScreenShell>
        );
      } else {
        const c = selectedCoin;
        const creatorId = c.creatorWallet || "";
const creatorCoins = (coins || []).filter((x) => x.creatorWallet === creatorId);
const creatorHoldingEntries = Object.entries((creatorCoins || []).reduce((acc, coin) => {
  const amt = Number(coin?.holders?.[creatorId] || 0);
  if (amt > 0) acc[coin.id] = { coin, amt };
  return acc;
}, {}));
        const isLiveNow = c.status === "LIVE";
        const txMarkers = myTxList.filter((t) => t.coinId === c.id).slice(0, 20);
        const myHoldingForCoin = c?.holders?.[solAddr] || 0;

        const totalSupply = Number(c.totalSupply || 0);
        const myPct = totalSupply > 0 ? (Number(myHoldingForCoin || 0) / totalSupply) * 100 : 0;

        content = (
          <ScreenShell fullBleed>
            <Title
              sub={
                <span style={{ color: "var(--muted2)" }}>
                  Coin: <b style={{ color: "var(--text)" }}>{shortWallet(c.id)}</b>
                </span>
              }
              right={
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <MiniBtn onClick={() => setScreen("HOME")}>Back</MiniBtn>
                  <MiniBtn onClick={() => copyText(c.id)} tone="warn">
                    Copy ID
                  </MiniBtn>
                </div>
              }
            >
              <span style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
                <CoinLogo c={c} size={30} />
                <span style={{ fontWeight: 950 }}>{c.symbol || "—"}</span>
              </span>
            </Title>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
              <Pill>Status: {c.status}</Pill>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Pill>MC: {fmtUsd(c.mc || 0)}</Pill>
                <Pill>ATH: {fmtUsd(c.ath || 0)}</Pill>
              </div>
            </div>

   <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
  <Pill tone="warn">Your: {Number(myHoldingForCoin || 0).toFixed(0)}</Pill>
</div> 

<Card>
  <SectionHeader title="Coin Creator" />

  <div
    onClick={() => {
      setCreatorProfileId(c.creatorWallet);
      setScreen("CREATOR");
    }}
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 12,
      borderRadius: 14,
      border: "1px solid var(--border)",
      background: "var(--card2)",
      cursor: "pointer",
    }}
  >
    <div>
      <div style={{ fontWeight: 900 }}>
        {shortWallet(c.creatorWallet)}
      </div>
      <div style={{ fontSize: 12, color: "var(--muted2)" }}>
        Coin Creator
      </div>
    </div>

    <MiniBtn tone="primary">
      View Profile
    </MiniBtn>
  </div>
</Card>

            <PriceChart
              points={c.chart}
              txMarkers={txMarkers}
              mode={chartMode}
              onToggleMode={() => setChartMode((m) => (m === "dark" ? "light" : "dark"))}
            />

            <div style={{ height: 12 }} />

            <Card
              style={
                isMobile
                  ? {
                      position: "fixed",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      borderRadius: "20px 20px 0 0",
                      zIndex: 1000,
                      paddingBottom: 10,
                    }
                  : {}
              }
            >
              <div style={{ fontWeight: 950, marginBottom: 8 }}>Trade</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <MiniBtn
                  onClick={() => {
                    setTradeSide("BUY");
                    setTradeSol("0.05");
                    setTradeOpen(true);
                  }}
                  tone="good"
                >
                  Buy
                </MiniBtn>
                <MiniBtn
                  disabled={!isLiveNow}
                  onClick={() => {
                    setTradeSide("SELL");
                    setTradeSol("0.05");
                    setTradeOpen(true);
                  }}
                  tone="danger"
                >
                  Sell
                </MiniBtn>
                <Pill>On-chain SOL: {balance} SOL</Pill>
                <Pill>Your tokens: {Number(myHoldingForCoin).toFixed(0)}</Pill>
              </div>
            </Card>

            <Modal
              open={tradeOpen}
              title={`${tradeSide === "BUY" ? "Buy" : "Sell"} ${c.symbol || ""}`}
              onClose={() => (tradeLoading ? null : setTradeOpen(false))}
              onConfirm={async () => {
                if (tradeLoading) return;
                setTradeOpen(false);
                await doTrade(c, tradeSide, tradeSol);
              }}
              confirmText={tradeLoading ? "..." : tradeSide === "BUY" ? "Confirm Buy" : "Confirm Sell"}
              confirmTone={tradeSide === "BUY" ? "primary" : "danger"}
            >
              <Input label="Amount (SOL)" value={tradeSol} onChange={setTradeSol} placeholder="e.g. 0.05" type="number" />
            </Modal>

            <div style={{ height: 10 }} />
            <GhostButton onClick={() => setScreen("HOME")}>Back</GhostButton>
          </ScreenShell>
        );
      }
    }

    if (screen === "CREATE") {
      content = (
        <ScreenShell>
          <Title sub={null}>Create Coin</Title>

          <Input label="Coin name" hint="2–32" value={tokenName} onChange={setTokenName} placeholder="" maxLength={32} error={nameErr} />
          <Input label="Symbol" hint="A-Z/0-9" value={symbolUpper} onChange={setSymbol} placeholder="" maxLength={10} error={symErr} />
          <Input label="Initial SOL" hint="0 or 0.01+" value={initialSol} onChange={setInitialSol} placeholder="0 or 0.01+" type="number" error={solErr} />

          <Card>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                  background: "rgba(0,0,0,.18)",
                  overflow: "hidden",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>Logo</span>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>Logo (≤ 5MB)</div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => onPickLogo(e.target.files?.[0])}
                  style={{ width: "100%", color: "var(--muted)" }}
                />
                <div style={{ marginTop: 6, color: logoError ? "var(--danger)" : "var(--muted)", fontSize: 12 }}>
                  {logoError ? logoError : logoPreview ? "Selected ✅" : "Required"}
                </div>
              </div>
            </div>
          </Card>

          <div style={{ height: 12 }} />

          <Textarea label="Your coin story" value={story} onChange={setStory} placeholder="20+ chars story..." maxLength={300} error={storyErr} />

          <PrimaryButton disabled={!canCreate} onClick={() => setConfirmOpen(true)}>
            Review & Create
          </PrimaryButton>

          <div style={{ height: 10 }} />
          <GhostButton onClick={() => setScreen("HOME")}>Back</GhostButton>

          <Modal
            open={confirmOpen}
            title="Confirm coin"
            onClose={() => setConfirmOpen(false)}
            onConfirm={async () => {
              setConfirmOpen(false);
              if (!solAddr) return showToast("Wallet not ready");

              const payload = {
                name: tokenName.trim(),
                symbol: symbolUpper.trim(),
                story: story.trim(),
                logo: logoPreview,
                initialSol: Number(initialSol || 0),
                totalSupply: Number(totalSupply || 1000000000),
                creatorWallet: solAddr,
              };

              const res = await apiPost("/api/coin/create", payload);
              if (!res?.ok) return showToast(res?.error || "Create failed");

              const created = ensureCoinShape(res.coin);
              setCoins((p) => [created, ...(p || [])]);

              setTokenName("");
              setSymbol("");
              setStory("");
              setInitialSol("0.01");
              setLogoPreview("");
              setLogoError("");

              setSelectedCoinId(created.id);
              setScreen("COIN");
              showToast("Coin created ✅");
              loadProfile();
            }}
            confirmText="Create"
          >
            <Card>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 54, height: 54, borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden", background: "rgba(0,0,0,.18)" }}>
                  {logoPreview ? <img src={logoPreview} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 950 }}>{tokenName || "—"}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>{symbolUpper || "—"}</div>
                </div>
                <Pill>{Number(initialSol) >= 0.01 ? "LIVE" : "DRAFT"}</Pill>
              </div>
            </Card>
          </Modal>
        </ScreenShell>
      );
    }

    if (screen === "PROFILE") {
      const holdingsEnriched = myHoldingsList
        .map((h) => {
          const coin = coinsSorted.find((c) => c.id === h.coinId);
          const supply = Number(coin?.totalSupply || 0);
          const amt = Number(h.amount || 0);
          const pct = supply > 0 ? (amt / supply) * 100 : 0;
          return { ...h, coin, supply, amt, pct };
        })
        .filter((x) => x.amt > 0.0000001);

      const txEnriched = myTxList.slice(0, 40).map((t) => {
        const coin = coinsSorted.find((c) => c.id === t.coinId);
        return { ...t, coin };
      });

      content = (
        <ScreenShell>
          <Title sub={null} right={<MiniBtn onClick={() => setScreen("SETTINGS")}>⚙ Settings</MiniBtn>}>
            Profile
          </Title>

          <div
            className="miniScroll"
            style={{
              marginTop: 14,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              maxHeight: "calc(100vh - 150px)",
              overflowY: "auto",
              overflowX: "hidden",
              paddingRight: 6,
              paddingBottom: 120,
              WebkitOverflowScrolling: "touch",
            }}
          >
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>Address</div>
                  <div style={{ fontWeight: 950 }}>{shortWallet(solAddr)}</div>
                </div>
                <MiniBtn disabled={!solAddr} onClick={() => solAddr && copyText(solAddr)}>
                  Copy
                </MiniBtn>
              </div>

              <div style={{ height: 10 }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>Balance</div>
                  <div style={{ fontWeight: 950 }}>{balance} SOL</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <MiniBtn tone="good" disabled={!solAddr} onClick={openDeposit}>
                    Deposit
                  </MiniBtn>
                  <MiniBtn tone="warn" disabled={!solAddr} onClick={openWithdraw}>
                    Withdraw
                  </MiniBtn>
                </div>
              </div>

              <div style={{ height: 12 }} />

              <div style={{ padding: 12, borderRadius: 16, border: "1px solid var(--border)", background: "rgba(255,255,255,.03)" }}>
                <div style={{ fontWeight: 950, marginBottom: 10 }}>Networks</div>

                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <NetLogo chain="solana" />
                      <div style={{ fontWeight: 900 }}>Solana</div>
                    </div>
                    <Pill tone="good">Active</Pill>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, opacity: 0.9 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <NetLogo chain="bnb" />
                      <div style={{ fontWeight: 900 }}>BNB</div>
                    </div>
                    <Pill>Coming soon</Pill>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, opacity: 0.9 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <NetLogo chain="polygon" />
                      <div style={{ fontWeight: 900 }}>Polygon</div>
                    </div>
                    <Pill>Coming soon</Pill>
                  </div>
                </div>
              </div>

              <div style={{ height: 12 }} />

              <div style={{ padding: 12, borderRadius: 16, border: "1px solid var(--border)", background: "rgba(255,255,255,.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 950 }}>Referral</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
                      {myReferralLink ? `${myReferralLink.slice(0, 24)}…` : "Wallet loading…"}
                    </div>
                    <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Pill tone="warn">Referral commission: 20%</Pill>
                      {refStatus ? (
                        <Pill>
                          {refStatus === "set" ? "Referral applied ✅" : refStatus === "already" ? "Referral locked" : "Referral invalid"}
                        </Pill>
                      ) : null}
                    </div>
                  </div>
                  <MiniBtn disabled={!myReferralLink} onClick={() => myReferralLink && copyText(myReferralLink)}>
                    Copy
                  </MiniBtn>
                </div>
              </div>
            </Card>

            <Card>
              <SectionHeader title="Referral Reward" right={<Pill tone="warn">20%</Pill>} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ fontWeight: 950 }}>{Number(myReferralRewardsSol || 0).toFixed(6)} SOL</div>
                <MiniBtn tone="good" disabled={oneClickW !== "" || Number(myReferralRewardsSol || 0) <= 0} onClick={() => oneClickWithdraw("REF")}>
                  {oneClickW === "REF" ? "Withdrawing…" : "Withdraw"}
                </MiniBtn>
              </div>
            </Card>

            <Card>
              <SectionHeader title="Creator Reward" right={<Pill>Coins: {Object.keys(myRewards.byCoin || {}).length}</Pill>} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ fontWeight: 950 }}>{Number(myRewards.totalSol || 0).toFixed(6)} SOL</div>
                <MiniBtn tone="good" disabled={oneClickW !== "" || Number(myRewards.totalSol || 0) <= 0} onClick={() => oneClickWithdraw("CREATOR")}>
                  {oneClickW === "CREATOR" ? "Withdrawing…" : "Withdraw"}
                </MiniBtn>
              </div>
            </Card>

            <Card>
              <SectionHeader title="My Creations" right={<Pill>{myCreations.length}</Pill>} />
              <div className="hScroll" style={{ display: "flex", gap: 10, paddingBottom: 6 }}>
                {myCreations.length === 0 ? (
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>No coins yet.</div>
                ) : (
                  myCreations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCoinId(c.id);

try {
  localStorage.setItem("last_open_coin", JSON.stringify(c));
} catch {}
                        setScreen("COIN");
                      }}
                      style={{
                        minWidth: 240,
                        width: 240,
                        padding: 12,
                        borderRadius: 18,
                        border: "1px solid var(--border)",
                        background: "linear-gradient(180deg, rgba(255,255,255,.03), rgba(0,0,0,.14)), var(--card2)",
                        color: "var(--text)",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <CoinLogo c={c} size={44} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 950 }}>{c.symbol || "—"}</div>
                          <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 12 }}>
                            {fmtUsd(c.mc || 0)} • {Number(c.volumeSol || 0).toFixed(2)} SOL
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>

            <Card data-noanim="1">
              <SectionHeader title="My Holdings" right={<Pill>{holdingsEnriched.length}</Pill>} />
              <div style={{ display: "grid", gap: 10 }}>
                {holdingsEnriched.length === 0 ? (
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>No holdings yet.</div>
                ) : (
                  holdingsEnriched.map((h) => (
                    <div
                      key={h.coinId}
                      style={{
                        padding: 12,
                        borderRadius: 18,
                        border: "1px solid var(--border)",
                        background: "linear-gradient(180deg, rgba(255,255,255,.03), rgba(0,0,0,.14)), var(--card2)",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <CoinLogo c={h.coin || { symbol: "?" }} size={38} />
                        <div>
                          <div style={{ fontWeight: 950, lineHeight: 1.1 }}>{h.coin?.symbol || "—"}</div>
                          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>
                            Last: {h.lastAt ? fmtTime(h.lastAt) : "—"}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 950 }}>{Number(h.amt || 0).toFixed(2)}</div>
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>
                          {h.supply > 0 ? `${h.pct.toFixed(2)}% of supply` : "supply —"}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <MiniBtn
                            onClick={() => {
                              setSelectedCoinId(h.coinId);
                              setScreen("COIN");
                            }}
                            tone="warn"
                            style={{ padding: "8px 10px", borderRadius: 12 }}
                          >
                            Open
                          </MiniBtn>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <SectionHeader title="Last Transactions" right={<Pill>{txEnriched.length}</Pill>} />
              <div
                className="miniScroll"
                style={{
                  maxHeight: 320,
                  overflowY: "auto",
                  overflowX: "hidden",
                  paddingRight: 6,
                  display: "grid",
                  gap: 10,
                  paddingBottom: 10,
                }}
              >
                {txEnriched.length === 0 ? (
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>No transactions yet.</div>
                ) : (
                  txEnriched.map((t) => {
                    const side = String(t.side || "").toUpperCase();
                    const coin = t.coin || { symbol: "?" };
                    return (
                      <div
                        key={t.id || `${t.coinId}-${t.t}`}
                        style={{
                          padding: 12,
                          borderRadius: 18,
                          border: "1px solid var(--border)",
                          background: "linear-gradient(180deg, rgba(255,255,255,.03), rgba(0,0,0,.14)), var(--card2)",
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <CoinLogo c={coin} size={38} />
                          <div>
                            <div style={{ fontWeight: 950 }}>{coin.symbol || "TX"}</div>
                            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>{t.t ? fmtTime(t.t) : "—"}</div>
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <Pill tone={side === "SELL" ? "danger" : side === "BUY" ? "good" : "warn"}>{side || "TX"}</Pill>
                          <div style={{ marginTop: 8, fontWeight: 950 }}>{Number(t.sol || 0).toFixed(4)} SOL</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            <GhostButton onClick={logout}>Logout</GhostButton>
          </div>
        </ScreenShell>
      );
    }

    if (screen === "SETTINGS") {
      content = (
        <ScreenShell>
          <Title sub={null} right={<MiniBtn onClick={() => setScreen("PROFILE")}>Back</MiniBtn>}>
            Settings
          </Title>

          <Card>
            <div style={{ fontWeight: 950, marginBottom: 8 }}>Theme</div>
            <div style={{ display: "grid", gap: 10 }}>
              <ThemeOption theme="calm" current={theme} setTheme={setTheme} label="Calm (Default)" />
              <ThemeOption theme="neon" current={theme} setTheme={setTheme} label="Neon" />
              <ThemeOption theme="ocean" current={theme} setTheme={setTheme} label="Ocean" />
              <ThemeOption theme="rose" current={theme} setTheme={setTheme} label="Rose" />
              <ThemeOption theme="royal" current={theme} setTheme={setTheme} label="Royal" />
              <ThemeOption theme="lightgreen" current={theme} setTheme={setTheme} label="Light Green" />
            </div>
          </Card>

          <div style={{ height: 12 }} />

          <Card>
            <div style={{ fontWeight: 950, marginBottom: 8 }}>Wallet Backup</div>
            <div style={{ color: "var(--warn)", fontSize: 12, lineHeight: 1.5 }}>
              ⚠️ Warning: Apni private key / recovery phrase kisi ko mat dena. Backup sirf apne paas safe rakho.
            </div>
            <div style={{ height: 10 }} />
            <MiniBtn onClick={openPrivyBackup}>Open Backup</MiniBtn>
          </Card>

          <div style={{ height: 12 }} />
          <GhostButton onClick={logout}>Logout</GhostButton>
        </ScreenShell>
      );
    }
  }

  return (
    <>
      <ThemeStyles />

      {/* ✅ Show intro overlay (auto hides after 5s) */}
      {showIntro ? <SplashIntro logoUrl={APP_LOGO_URL} /> : null}

      {content}
      {ready && authenticated ? <BottomNav screen={screen} setScreen={setScreen} /> : null}
      <Toast msg={toast} />

      <Modal
        open={dwOpen}
        title={dwMode === "DEPOSIT" ? "Solana Deposit Address" : "Solana Withdraw"}
        onClose={() => setDwOpen(false)}
        onConfirm={async () => {
          if (dwMode === "DEPOSIT") {
            if (!solAddr) return;
            await copyText(solAddr);
            return;
          }

          const to = String(withdrawTo || "").trim();
          if (to.length < 20) return showToast("Paste valid address");

          const res = await apiPostTry(["/api/withdraw", "/api/withdraw/manual", "/api/transfer", "/api/payout"], {
            wallet: solAddr,
            to,
            kind: "MANUAL",
          });

          if (res?.ok) {
            showToast("Withdraw confirmed ✅");
            setDwOpen(false);
            await loadProfile();
            await refreshBalance();
          } else {
            showToast(res?.error || "Withdraw failed");
          }
        }}
        confirmText={dwMode === "DEPOSIT" ? "Copy address" : "Confirm"}
      >
        <Card breathe={false}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>Network</div>
              <div style={{ fontWeight: 950, display: "flex", gap: 10, alignItems: "center" }}>
                <NetLogo chain="solana" /> Solana
              </div>
            </div>
            <Pill tone="good">{dwMode === "DEPOSIT" ? "Deposit" : "Withdraw"}</Pill>
          </div>

          <div style={{ height: 12 }} />

          {dwMode === "DEPOSIT" ? (
            <>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>Address</div>
              <div
                style={{
                  marginTop: 6,
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "rgba(0,0,0,.18)",
                  fontSize: 12,
                  wordBreak: "break-all",
                }}
              >
                {solAddr || "—"}
              </div>

              <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 12, lineHeight: 1.5 }}>
                Is address par SOL send karo. (Auto-copy ho chuka hai.)
              </div>
            </>
          ) : (
            <>
              <Input
                label="Withdraw to (destination address)"
                value={withdrawTo}
                onChange={setWithdrawTo}
                placeholder="Paste Solana address…"
              />
              <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12, lineHeight: 1.5 }}>
                Manual withdraw: destination paste karo.
              </div>
            </>
          )}
        </Card>
      </Modal>
    </>
  );
}