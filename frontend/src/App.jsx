import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useExportWallet } from "@privy-io/react-auth/solana";
const INTRO_MS = 2600; 


// ✅ apna logo yahan do (recommended):
// Option A: public folder: /public/logo.png  -> "/logo.png"
// Option B: full https url
// Option C: data:image/png;base64,...
const APP_LOGO_URL = "/logo.png";

const API_BASE = "https://zooming-solace-production-c360.up.railway.app";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const STARTING_MC_USD = 6500;
const LS_THEME = "theme"; // "calm" | "neon" | "ocean" | "rose" | "royal" | "lightgreen"

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
        animation: floatGlow 18s var(--ease) infinite;
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
        animation: floatGlow2 26s var(--ease) infinite;
        opacity:.35;
        mix-blend-mode: overlay;
      }

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

      @media (prefers-reduced-motion: reduce){
        *{ animation: none !important; transition: none !important; scroll-behavior: auto !important; }
        body::before, body::after{ animation:none !important; }
      }

      .fadeIn{ animation: fadeIn .22s var(--ease); }
      @keyframes fadeIn{ from{opacity:.0; transform: translateY(8px);} to{opacity:1; transform: translateY(0);} }

      .noScrollbar{ scrollbar-width: none; -ms-overflow-style: none; }
      .noScrollbar::-webkit-scrollbar{ display:none; }

      .miniScroll {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  -ms-overflow-style: none;   /* IE & Edge */
  scrollbar-width: none;      /* Firefox */
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
  scrollbar-width: none;     /* Firefox */
  -ms-overflow-style: none;  /* IE & Edge */
}
      .hScroll{ overflow-x:auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; -ms-overflow-style: none; }
      .hScroll::-webkit-scrollbar{ display:none; }

      .snapX{ scroll-snap-type: x mandatory; }
      .snapItem{ scroll-snap-align: start; }

      button{
        transition: transform .18s var(--ease), filter .18s var(--ease), box-shadow .18s var(--ease), opacity .18s var(--ease);
      }
      button:hover{ filter: brightness(1.02); }
      button:active{ transform: translateY(1px) scale(.99); }

      :focus-visible{
        outline: 2px solid rgba(25,230,162,.55);
        outline-offset: 2px;
        border-radius: 14px;
      }

      ::selection{ background: rgba(25,230,162,.22); }

      @keyframes breatheCard{
        0%{ transform: translateZ(0) scale(1); }
        50%{ transform: translateZ(0) scale(1.012); }
        100%{ transform: translateZ(0) scale(1); }
      }
      .breathe{
        animation: breatheCard 7s var(--ease) infinite;
      }

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
          width: 520,
          maxWidth: "92vw",
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
}function Title({ children, sub, right }) {
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
}
function SplashIntro({ logoUrl }) {
  return (
    <div className="introOverlay">
      <div className="introCard">
        <div className="introGlow" />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="logoRing">
              <div className="logoSpin" aria-label="App logo spinning">
                {logoUrl ? (
                  <img src={logoUrl} alt="logo" />
                ) : (
                  <div style={{ fontWeight: 950, color: "var(--text)" }}>LOGO</div>
                )}
              </div>
            </div>

            <div>
              <div className="introTitle">Cooking memes…</div>
              <div className="introSub">Chains running • coins printing • launchpad warming up</div>
            </div>
          </div>

          <Pill tone="good">LIVE</Pill>
        </div>

        <div className="factoryStage">
          <div className="smokePuff" />
          <div className="chainRow" />
          <div className="chainRow second" />

          <div className="conveyor" style={{ marginTop: 14 }}>
            <div className="coin c1" title="Doge">🐶</div>
            <div className="coin c2" title="Shiba">🐕</div>
            <div className="coin c3" title="Pepe">🐸</div>
            <div className="coin c4" title="Rocket">🚀</div>
          </div>

          <div className="introText">
            <div style={{ color: "var(--muted)", fontSize: 12 }}>
              Creator-first • Reward-driven • Smooth & Fast
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Pill>Referral 20%</Pill>
              <Pill tone="warn">Factory Mode</Pill>
            </div>
          </div>
        </div>
      </div>
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
        transition: "all .25s var(--ease)",
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
        transition: "all .22s var(--ease)",
        boxShadow: "0 14px 45px rgba(0,0,0,.35)",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 18px 60px rgba(0,0,0,.45)";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = "0 14px 45px rgba(0,0,0,.35)";
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
            transition: "all .22s var(--ease)",
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
}

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
          transition: "all .22s var(--ease)",
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
        transition: "all .25s var(--ease)",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(0px) scale(1)";
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
        transition: "all .25s var(--ease)",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(25,230,162,.12)";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = "none";
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
}function CoinLogo({ c, size = 46 }) {
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

function CoinRow({ c, onClick, right }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: 14,
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,.10)",
        background: `
          radial-gradient(280px 120px at 20% 0%, rgba(25,230,162,.10), transparent 60%),
          linear-gradient(180deg, rgba(255,255,255,.05), rgba(0,0,0,.20)),
          var(--card2)
        `,
        backdropFilter: "blur(10px)",
        color: "var(--text)",
        cursor: "pointer",
        width: "100%",
        boxShadow: "0 18px 55px rgba(0,0,0,.35)",
        transition: "all .18s var(--ease)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 26px 80px rgba(0,0,0,.55), 0 0 60px rgba(25,230,162,.10)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = "0 18px 55px rgba(0,0,0,.35)";
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <CoinLogo c={c} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div style={{ fontWeight: 950, fontSize: 15 }}>{c.symbol || "—"}</div>
            {right || <Pill>{c.status}</Pill>}
          </div>
          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>
            MC: {fmtUsd(c.mc || 0)} • VOL: {Number(c.volumeSol || 0).toFixed(2)} SOL
          </div>
        </div>
      </div>
    </button>
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
          width: 520,
          maxWidth: "92vw",
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
        transition: "all .15s var(--ease)",
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
      transition: "all .2s ease",
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
    el.scrollTo({ left: w * pageIndex, behavior: "smooth" });
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
              transition: "all .15s var(--ease)",
            }}
            title={`Page ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

async function apiGet(path) {
  const r = await fetch(`${API_BASE}${path}`);
  return r.json();
}
async function apiPost(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
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
}

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
  const live = c?.status === "LIVE";
  const baseMC = live ? Number(c?.mc || STARTING_MC_USD) : 0;
  const baseATH = live ? Number(c?.ath || baseMC || STARTING_MC_USD) : 0;
  const chart =
    Array.isArray(c?.chart) && c.chart.length
      ? c.chart
      : live
      ? [baseMC, baseMC, baseMC, baseMC, baseMC]
      : [0, 0, 0, 0, 0];

  return {
    ...c,
    mc: baseMC,
    ath: baseATH,
    chart,
    createdAt: c?.createdAt || Date.now(),
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
  return `$${Math.round(x).toLocaleString()}`;
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

        {/* LEFT: name + small sub line */}
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

        {/* RIGHT: simple number only (example: MC) */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 900 }}>
            {fmtUsd(c?.mc || 0)}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted)" }}>
            MC
          </div>
        </div>
      </div>
    </button>
  );
}
function PriceChart({ points, txMarkers, mode, onToggleMode }) {
  const W = 1000;
  const H = 380;
  const PAD = 22;

  const safePoints = Array.isArray(points) && points.length ? points : [0, 0, 0, 0, 0];

  const min = Math.min(...safePoints);
  const max = Math.max(...safePoints);
  const span = Math.max(1, max - min);

  const bg = mode === "dark" ? "#070B12" : "#FFFFFF";
  const border = mode === "dark" ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.10)";
  const text = mode === "dark" ? "rgba(255,255,255,.80)" : "rgba(0,0,0,.65)";

  const last = Number(safePoints[safePoints.length - 1] ?? 0);
  const prev = Number(safePoints[safePoints.length - 2] ?? last);
  const isUp = last >= prev;

  const stroke = isUp ? "#16C784" : "#FF4D4D";
  const glow = isUp ? "rgba(22,199,132,.55)" : "rgba(255,77,77,.55)";
  const areaTop = isUp ? "rgba(22,199,132,.20)" : "rgba(255,77,77,.16)";

  const xFor = (i) => PAD + (i * (W - PAD * 2)) / Math.max(1, safePoints.length - 1);

  const yFor = (v) => {
    const t = (Number(v) - min) / span;
    return PAD + (1 - t) * (H - PAD * 2);
  };

  let d = "";
  safePoints.forEach((v, i) => {
    const x = xFor(i);
    const y = yFor(v);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });

  const area = d + ` L ${xFor(safePoints.length - 1)} ${H - PAD} L ${xFor(0)} ${H - PAD} Z`;

  const gridLines = 5;
  const grid = Array.from({ length: gridLines }, (_, i) => PAD + (i * (H - PAD * 2)) / (gridLines - 1));

  const lx = xFor(safePoints.length - 1);
  const ly = yFor(last);

  const dots = Array.isArray(txMarkers) ? txMarkers.slice(0, 30) : [];
  const dotItems = dots.map((t, idx) => {
    const i = Math.max(0, safePoints.length - 1 - idx * 2);
    const x = xFor(i);
    const y = yFor(safePoints[i]);
    const side = String(t.side || "").toUpperCase();
    const fill = side === "SELL" ? "#FF4D4D" : "#16C784";
    const shadow = side === "SELL" ? "rgba(255,77,77,.45)" : "rgba(22,199,132,.45)";
    return { x, y, fill, shadow, id: t.id || `${idx}` };
  });

  const label = Number(last || 0) ? fmtUsd(last) : "—";
  const pct = prev && Number.isFinite(prev) && prev !== 0 ? ((last - prev) / prev) * 100 : 0;

  const gid = `areaFill_${mode}_${isUp ? "up" : "down"}`;
  const fid = `glow_${mode}_${isUp ? "up" : "down"}`;
  const pid = `pulse_${mode}_${isUp ? "up" : "down"}`;

  return (
    <div
      style={{
        borderRadius: 18,
        overflow: "hidden",
        border: `1px solid ${border}`,
        background: bg,
        boxShadow: mode === "dark" ? "0 22px 70px rgba(0,0,0,.55)" : "0 18px 55px rgba(0,0,0,.12)",
      }}
    >
      <div
        style={{
          padding: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          borderBottom: `1px solid ${border}`,
          background:
            mode === "dark"
              ? "linear-gradient(180deg, rgba(255,255,255,.06), rgba(0,0,0,.10))"
              : "linear-gradient(180deg, rgba(0,0,0,.03), rgba(0,0,0,.00))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12, color: text, fontWeight: 950 }}>
            Price: <span style={{ color: mode === "dark" ? "#fff" : "#000" }}>{label}</span>
          </div>

          <div
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: `1px solid ${isUp ? "rgba(22,199,132,.30)" : "rgba(255,77,77,.30)"}`,
              background: isUp ? "rgba(22,199,132,.10)" : "rgba(255,77,77,.10)",
              color: isUp ? "#16C784" : "#FF4D4D",
              fontWeight: 950,
              fontSize: 12,
            }}
          >
            {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
          </div>
        </div>

        <button
          onClick={onToggleMode}
          style={{
            padding: "8px 10px",
            borderRadius: 999,
            border: `1px solid ${border}`,
            background: mode === "dark" ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.04)",
            color: mode === "dark" ? "rgba(255,255,255,.85)" : "rgba(0,0,0,.75)",
            cursor: "pointer",
            fontWeight: 950,
            fontSize: 12,
          }}
          title="Toggle chart theme"
        >
          {mode === "dark" ? "Dark" : "Light"} ▾
        </button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="340" style={{ display: "block" }}>
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={areaTop} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>

          <filter id={fid} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id={pid} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={glow} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>

        {grid.map((y, i) => (
          <line
            key={i}
            x1={PAD}
            x2={W - PAD}
            y1={y}
            y2={y}
            stroke={mode === "dark" ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)"}
            strokeWidth="1"
          />
        ))}

        <path d={area} fill={`url(#${gid})`} />

        <path
          d={d}
          fill="none"
          stroke={glow}
          strokeWidth="8"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter={`url(#${fid})`}
          opacity="0.9"
        />

        <path d={d} fill="none" stroke={stroke} strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />

        {dotItems.map((p) => (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r="9" fill={p.shadow} opacity="0.55" />
            <circle cx={p.x} cy={p.y} r="6" fill={p.fill} opacity="0.95" />
          </g>
        ))}

        <g>
          <circle cx={lx} cy={ly} r="22" fill={`url(#${pid})`} opacity="0.65">
            <animate attributeName="r" values="18;24;18" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.55;0.75;0.55" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle cx={lx} cy={ly} r="7" fill={stroke} opacity="0.95" />
          <circle cx={lx} cy={ly} r="4" fill={mode === "dark" ? "#0A0F14" : "#FFFFFF"} opacity="0.9" />
        </g>
      </svg>
    </div>
  );
}

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
}export default function App() {
  const { login, authenticated, user, ready, logout, connectOrCreateWallet } = usePrivy();
  const { exportWallet } = useExportWallet();

  const [showIntro, setShowIntro] = useState(true);

useEffect(() => {
  const t = setTimeout(() => setShowIntro(false), INTRO_MS);
  return () => clearTimeout(t);
}, []);

  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem(LS_THEME) || "calm");
  const [screen, setScreen] = useState("HOME");
  const [selectedCoinId, setSelectedCoinId] = useState(null);
  const [homePage, setHomePage] = useState(0);


  const [balance, setBalance] = useState("—");
  const [loadingBal, setLoadingBal] = useState(false);

  const [coins, setCoins] = useState([]);
  const [loadingCoins, setLoadingCoins] = useState(false);

  const [searchQ, setSearchQ] = useState("");
  const [searchMode, setSearchMode] = useState("SEARCH");

  const [tokenName, setTokenName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [story, setStory] = useState("");
  const [initialSol, setInitialSol] = useState("0.01");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [logoPreview, setLogoPreview] = useState("");
  const [logoError, setLogoError] = useState("");

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

  const solAddr = useMemo(() => {
    const w = user?.linkedAccounts?.find((a) => a.type === "wallet" && a.chainType === "solana");
    return w?.address || null;
  }, [user]);

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

  async function loadCoins() {
    setLoadingCoins(true);
    try {
      const data = await apiGet("/api/coin/list");
      if (data?.ok) setCoins((data.coins || []).map(ensureCoinShape));
    } catch {}
    setLoadingCoins(false);
  }

  async function loadProfile() {
    if (!solAddr) return;
    setLoadingProfile(true);
    try {
      const j = await apiGet(`/api/profile/${solAddr}`);
      if (j?.ok) setProfile(j.profile || null);
    } catch {}
    setLoadingProfile(false);
  }

  useEffect(() => {
    if (!authenticated || !solAddr) return;
    refreshBalance();
    loadProfile();
    const t = setInterval(() => refreshBalance(), 20000);
    return () => clearInterval(t);
  }, [authenticated, solAddr]);

  useEffect(() => {
    loadCoins();
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    if (!(screen === "HOME" || screen === "LATEST")) return;
    const t = setInterval(() => loadCoins(), 8000);
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

  const topVolume = useMemo(() => {
    const live = coinsSorted.filter((c) => c.status === "LIVE");
    const arr = [...live].sort((a, b) => Number(b.volumeSol || 0) - Number(a.volumeSol || 0));
    return arr.slice(0, 12);
  }, [coinsSorted]);

  const moonshots = useMemo(() => {
    const live = coinsSorted.filter((c) => c.status === "LIVE");
    const arr = live
      .map((c) => ({ c, p: pctFromChart(c.chart) }))
      .filter((x) => x.p >= 15)
      .sort((a, b) => b.p - a.p)
      .slice(0, 12)
      .map((x) => x.c);
    return arr.length ? arr : movers.slice(0, 12);
  }, [coinsSorted, movers]);

  const searchResults = useMemo(() => {
    if (!searchQ.trim()) return [];
    return coinsSorted
      .filter((c) => `${c.name} ${c.symbol}`.toLowerCase().includes(searchQ.toLowerCase()))
      .slice(0, 25);
  }, [searchQ, coinsSorted]);

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

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function onPickLogo(file) {
    setLogoError("");
    setLogoPreview("");
    if (!file) return;
    const okType = ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type);
    if (!okType) return setLogoError("PNG/JPG/WEBP only");
    if (file.size > MAX_LOGO_BYTES) return setLogoError("Logo 5MB se chota hona chahiye");
    if (file.size < 10 * 1024) return setLogoError("Logo bohat choti (min 10KB)");
    try {
      setLogoPreview(await fileToDataUrl(file));
    } catch {
      setLogoError("Logo read failed");
    }
  }

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

  const referralFromUrl = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const ref = u.searchParams.get("ref");
      return ref ? String(ref).trim() : "";
    } catch {
      return "";
    }
  }, []);

  const myReferralLink = useMemo(() => {
    if (!solAddr) return "";
    return `${safeOrigin()}/?ref=${solAddr}`;
  }, [solAddr]);

  const [refStatus, setRefStatus] = useState("");
  async function trySetReferral() {
    if (!solAddr) return;
    if (!referralFromUrl) return;
    if (referralFromUrl === solAddr) return;

    try {
      const res = await apiPost("/api/referral/set", { wallet: solAddr, referrer: referralFromUrl });
      if (res?.ok) setRefStatus("set");
      else if (String(res?.error || "").toLowerCase().includes("immutable")) setRefStatus("already");
      else setRefStatus("invalid");
    } catch {}
  }

  useEffect(() => {
    if (!authenticated || !solAddr) return;
    trySetReferral();
  }, [authenticated, solAddr]);

  const myHoldingsList = useMemo(() => {
    const arr = Array.isArray(profile?.holdings) ? profile.holdings : [];
    return [...arr].sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
  }, [profile]);

  const myTxList = useMemo(() => {
    const arr = Array.isArray(profile?.txs) ? profile.txs : [];
    return [...arr].sort((a, b) => (b.t || 0) - (a.t || 0));
  }, [profile]);

  const myRewards = useMemo(() => profile?.rewards || { totalSol: 0, byCoin: {} }, [profile]);

  const myReferralRewardsSol = useMemo(() => {
    const d = Number(profile?.referralRewards?.totalSol || 0);
    return Number.isFinite(d) && d > 0 ? d : 0;
  }, [profile]);

  const myCreations = useMemo(() => {
    if (!solAddr) return [];
    return coinsSorted.filter((c) => String(c.creatorWallet || c.owner || "") === String(solAddr));
  }, [coinsSorted, solAddr]);

  async function doTrade(coin, side, solAmount) {
    const s = Number(solAmount);
    if (!solAddr) return showToast("Wallet not ready");
    if (!Number.isFinite(s) || s <= 0) return showToast("Amount invalid");

    const SIDE = String(side || "").toUpperCase();
    const endpoint = SIDE === "BUY" ? "/api/coin/buy" : "/api/coin/sell";

    setTradeLoading(true);
    try {
      const res = await apiPost(endpoint, { wallet: solAddr, coinId: coin.id, sol: s });

      if (!res?.ok) {
        showToast(res?.error || "Trade failed");
        return;
      }

      if (res.coin) {
        const updated = ensureCoinShape(res.coin);
        setCoins((prev) => (prev || []).map((x) => (x.id === updated.id ? updated : x)));
      }

      await loadProfile();
      showToast(`${SIDE} ${s} ✅`);
    } catch {
      showToast("Trade failed");
    }
    setTradeLoading(false);
  }

  async function oneClickWithdraw(kind) {
    if (!solAddr) return showToast("Wallet not ready");
    setOneClickW(kind);

    const body = { wallet: solAddr, to: solAddr, kind };
    const res = await apiPostTry(["/api/withdraw", "/api/withdraw/creator", "/api/withdraw/referral"], body);

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
                <div style={{ fontWeight: 950 }}>{balance} SOL</div>
              </div>
            </div>

            <div style={{ height: 10 }} />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <MiniBtn onClick={() => solAddr && copyText(solAddr)} disabled={!solAddr}>
                Copy Address
              </MiniBtn>
              {false && (
  <>
    <MiniBtn onClick={loadCoins} disabled={loadingCoins}>
      {loadingCoins ? "…" : "Refresh Coins"}
    </MiniBtn>

    <MiniBtn onClick={loadProfile} disabled={loadingProfile}>
      {loadingProfile ? "…" : "Refresh Profile"}
    </MiniBtn>
  </>
)}
            </div>
          </Card>

          <div style={{ height: 12 }} />

        

          <div style={{ height: 12 }} />

          

          <div style={{ height: 12 }} />

          <Card>
            <SectionHeader title="Top 100 Coins" right={<Pill tone="good">LIVE</Pill>} />
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
              {coins.slice(0, 100).map((c) => (
                <CoinMiniCard
                  key={c.id}
                  c={c}
                  subtitle={`Volume • ${Number(c.volumeSol || 0).toFixed(2)} SOL`}
                  tag="VOL"
                  accent="var(--primary)"
                  onOpen={() => {
                    setSelectedCoinId(c.id);
                    setScreen("COIN");
                  }}
                />
              ))}
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
              <MiniBtn tone="good" onClick={() => setScreen("CREATE")}>✦ Create coin</MiniBtn>
              <MiniBtn onClick={() => setScreen("SEARCH")}>⌕ Search</MiniBtn>
              <MiniBtn onClick={() => setScreen("PROFILE")}>👤 Profile</MiniBtn>
              <MiniBtn onClick={() => setScreen("SETTINGS")}>⚙ Settings</MiniBtn>
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
    const v =
      c?.pct24h ??
      c?.change24h ??
      c?.pump24h ??
      c?.priceChange24h ??
      0;
    return Number(v) || 0;
  };

  const filtered = (coins || []).filter((c) => {
    const q = String(searchQ || "").trim().toLowerCase();
    if (!q) return true;
    return (
      String(c.name || "").toLowerCase().includes(q) ||
      String(c.symbol || "").toLowerCase().includes(q)
    );
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
        onChange={setSearchQ}
        placeholder="type name or symbol…"
        rightIcon={<span style={{ fontWeight: 950 }}>⌕</span>}
      />

      {/* 🔘 MODE BUTTONS */}
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <MiniBtn
          onClick={() => setSearchMode("TOPVOL")}
          style={{
            flex: 1,
            opacity: searchMode === "TOPVOL" ? 1 : 0.7,
          }}
        >
          Top Volume
        </MiniBtn>

        <MiniBtn
          onClick={() => setSearchMode("TOPMOVES")}
          style={{
            flex: 1,
            opacity: searchMode === "TOPMOVES" ? 1 : 0.7,
          }}
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
        tag="VOL"
        accent="var(--primary)"
        onOpen={() => {
          setSelectedCoinId(c.id);
          setScreen("COIN");
        }}
      />
    ))}

  {searchMode === "TOPMOVES" &&
    topMoves20.map(({ c, pct }) => (
      <CoinMiniCard
        key={c.id}
        c={c}
        subtitle={`24h Move • +${pct.toFixed(2)}%`}
        tag="PUMP"
        accent="var(--primary)"
        onOpen={() => {
          setSelectedCoinId(c.id);
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

          {/* 🔥 Latest 20 Coins List */}
{(() => {
  const latestCoins = (coins || [])
    .slice()
    .sort(
      (a, b) =>
        Number(b.createdAt || b.ts || b.time || 0) -
        Number(a.createdAt || a.ts || a.time || 0)
    )
    .slice(0, 20);

  const latestFiltered = latestCoins.filter((c) => {
    const q = String(searchQ || "").trim().toLowerCase();
    if (!q) return true;
    return (
      String(c.name || "").toLowerCase().includes(q) ||
      String(c.symbol || "").toLowerCase().includes(q)
    );
  });

  return (
    <div
      style={{
        marginTop: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
maxHeight: "calc(100vh - 260px)",
overflowY: "scroll",
scrollbarWidth: "none",
msOverflowStyle: "none",
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
              setScreen("COIN");
            }}
          />
        ))
      )}
    </div>
  );
})()}

          <div style={{ height: 12 }} />

         

          <div style={{ height: 12 }} />

        
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
        const isLiveNow = c.status === "LIVE";
        const txMarkers = myTxList.filter((t) => t.coinId === c.id).slice(0, 20);
        const myHoldingForCoin = myHoldingsList.find((h) => h.coinId === c.id)?.amount || 0;

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
                  <MiniBtn onClick={() => copyText(c.id)} tone="warn">Copy ID</MiniBtn>
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
              <Pill>Supply: {Number(totalSupply || 0).toFixed(0)}</Pill>
              <Pill tone="warn">Your: {Number(myHoldingForCoin || 0).toFixed(0)}</Pill>
              <Pill tone={myPct >= 20 ? "danger" : "good"}>Share: {myPct.toFixed(2)}%</Pill>
            </div>

            <PriceChart
              points={c.chart}
              txMarkers={txMarkers}
              mode={chartMode}
              onToggleMode={() => setChartMode((m) => (m === "dark" ? "light" : "dark"))}
            />

            <div style={{ height: 12 }} />

            <Card>
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
                await doTrade(c, tradeSide, tradeSol);
                setTradeOpen(false);
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

      {/* ✅ PROFILE SCROLL WRAPPER (fix) */}
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
              <MiniBtn tone="good" disabled={!solAddr} onClick={openDeposit}>Deposit</MiniBtn>
              <MiniBtn tone="warn" disabled={!solAddr} onClick={openWithdraw}>Withdraw</MiniBtn>
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

        <Card>
          <SectionHeader title="My Holdings" right={<Pill>{holdingsEnriched.length}</Pill>} />
          {/* ✅ removed inner scroll so whole profile scrolls */}
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
                      <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>Last: {h.lastAt ? fmtTime(h.lastAt) : "—"}</div>
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
          {/* ✅ removed inner scroll so whole profile scrolls */}
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
              <Input label="Withdraw to (destination address)" value={withdrawTo} onChange={setWithdrawTo} placeholder="Paste Solana address…" />
              <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12, lineHeight: 1.5 }}>
                Manual withdraw: destination paste karo. (On-chain later)
              </div>
            </>
          )}
        </Card>
      </Modal>
    </>
  );
}