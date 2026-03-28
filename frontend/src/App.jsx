import IntroSplash from "./IntroSplash";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useExportWallet } from "@privy-io/react-auth/solana";

const INTRO_MS = 2600;
const APP_LOGO_URL = "/logo.png";
const API_BASE = "https://zooming-solace-production-c360.up.railway.app";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const STARTING_MC_USD = 6500;
const LS_THEME = "theme";

function ThemeStyles() {
  return (
    <style>{`
      :root{
        --bg:#060A0D;
        --bgSoft:rgba(6,10,13,.72);
        --card:rgba(12,19,23,.78);
        --card2:rgba(11,21,25,.62);
        --border:rgba(255,255,255,.08);

        --text:#F4FFF9;
        --muted:rgba(244,255,249,.72);
        --muted2:rgba(244,255,249,.50);

        --primary:#19E6A2;
        --primary2:#8FFFD0;
        --accent2:#6AD7FF;
        --accent3:#A78BFA;

        --danger:#FF6B6B;
        --warn:#FFD36A;
        --good:#19E6A2;

        --heroGlow:rgba(25,230,162,.22);
        --pillBg:rgba(255,255,255,.04);
        --btnBg:rgba(255,255,255,.04);
        --inputBg:rgba(255,255,255,.035);
      }

      *{ box-sizing:border-box; }
      html,body,#root{ min-height:100%; }

      body{
        margin:0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
        color:var(--text);
        background:
          radial-gradient(900px 520px at 50% -10%, rgba(25,230,162,.10), transparent 58%),
          radial-gradient(700px 420px at 100% 100%, rgba(106,215,255,.08), transparent 52%),
          linear-gradient(180deg, #04080A 0%, #060A0D 100%);
        -webkit-font-smoothing:antialiased;
        text-rendering:optimizeLegibility;
      }

      body::before{
        content:"";
        position:fixed;
        inset:0;
        pointer-events:none;
        background:
          linear-gradient(to bottom, rgba(255,255,255,.015), transparent 18%),
          linear-gradient(to top, rgba(25,230,162,.03), transparent 16%);
        z-index:0;
      }

      a{ color:inherit; text-decoration:none; }

      .topbar{
        position:sticky;
        top:0;
        z-index:60;
        padding:10px 12px 0;
        background:transparent;
      }

      .topbarInner{
        width:min(100%, 540px);
        margin:0 auto;
        min-height:66px;
        padding:10px 12px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        border:1px solid rgba(255,255,255,.08);
        border-radius:22px;
        background:
          linear-gradient(180deg, rgba(10,15,18,.92), rgba(8,12,15,.86));
        box-shadow:
          0 16px 40px rgba(0,0,0,.28),
          inset 0 1px 0 rgba(255,255,255,.04);
        backdrop-filter: blur(16px);
      }

      .brand{
        display:flex;
        align-items:center;
        gap:10px;
        min-width:0;
        flex:1;
      }

      .brandLogo{
        width:42px;
        height:42px;
        border-radius:14px;
        overflow:hidden;
        flex:0 0 auto;
        border:1px solid rgba(255,255,255,.10);
        background:rgba(255,255,255,.04);
        box-shadow:0 8px 22px rgba(0,0,0,.22);
      }

      .brandLogo img{
        width:100%;
        height:100%;
        object-fit:cover;
        display:block;
      }

      .brandText{
        min-width:0;
        display:flex;
        flex-direction:column;
        gap:2px;
      }

      .brandTitle{
        font-size:15px;
        font-weight:1000;
        line-height:1;
        letter-spacing:.2px;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }

      .brandSub{
        font-size:11px;
        color:var(--muted2);
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }

      .topActions{
        display:flex;
        align-items:center;
        gap:8px;
        flex-wrap:wrap;
        justify-content:flex-end;
      }

      .appShell{
        position:relative;
        z-index:1;
        width:min(100%, 540px);
        margin:0 auto;
        padding:14px 12px 120px;
      }

      .grid{
        display:grid;
        grid-template-columns:1fr;
        gap:14px;
        align-items:start;
      }

      .leftCol, .midCol, .rightCol{
        display:grid;
        gap:14px;
      }

      .card{
        border:1px solid var(--border);
        border-radius:26px;
        background:
          linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015)),
          linear-gradient(180deg, rgba(11,17,20,.92), rgba(9,14,17,.88));
        box-shadow:
          0 20px 50px rgba(0,0,0,.24),
          inset 0 1px 0 rgba(255,255,255,.04);
        overflow:hidden;
        backdrop-filter: blur(14px);
      }

      .cardBody{
        padding:16px;
      }

      .sectionHeader{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-bottom:12px;
      }

      .sectionTitle{
        font-size:13px;
        font-weight:1000;
        letter-spacing:.18px;
      }

      .sectionSub{
        font-size:11px;
        color:var(--muted2);
      }

      .pillRow{
        display:flex;
        flex-wrap:wrap;
        gap:8px;
      }

      .pill{
        display:inline-flex;
        align-items:center;
        gap:7px;
        padding:8px 11px;
        border-radius:999px;
        border:1px solid rgba(255,255,255,.08);
        background:rgba(255,255,255,.035);
        font-size:12px;
        color:var(--muted);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.03);
      }

      .coinList{
        display:grid;
        gap:10px;
      }

      .coinBtn{
        width:100%;
        text-align:left;
        background:
          linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.02));
        border:1px solid rgba(255,255,255,.08);
        border-radius:18px;
        padding:12px;
        color:var(--text);
        cursor:pointer;
        transition:none;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.03);
      }

      .coinBtn:hover{
        border-color:rgba(25,230,162,.22);
      }

      .coinRow{
        display:flex;
        align-items:center;
        gap:12px;
        min-width:0;
      }

      .coinText{
        min-width:0;
        flex:1;
      }

      .coinName{
        font-weight:900;
        font-size:14px;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }

      .coinMeta{
        margin-top:3px;
        font-size:12px;
        color:var(--muted2);
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }

      .rightNum{
        text-align:right;
        flex:0 0 auto;
      }

      .rightNumMain{
        font-weight:900;
        font-size:13px;
      }

      .rightNumSub{
        margin-top:3px;
        font-size:11px;
        color:var(--muted2);
      }

      .hero{
        position:relative;
        overflow:hidden;
      }

      .heroGlow{
        position:absolute;
        right:-70px;
        bottom:-70px;
        width:220px;
        height:220px;
        background:radial-gradient(circle at center, rgba(25,230,162,.18), transparent 60%);
        pointer-events:none;
        filter:blur(16px);
      }

      .heroTitle{
        font-size:24px;
        line-height:1.05;
        font-weight:1000;
        letter-spacing:.15px;
        max-width:260px;
      }

      .heroText{
        margin-top:12px;
        color:var(--muted);
        font-size:14px;
        line-height:1.62;
        max-width:340px;
      }

      .heroActions{
        display:flex;
        gap:10px;
        margin-top:16px;
        flex-wrap:wrap;
      }

      .tabs{
        display:flex;
        gap:8px;
        flex-wrap:wrap;
      }

      .tabBtn{
        border:none;
        cursor:pointer;
        padding:9px 12px;
        border-radius:14px;
        font-size:12px;
        font-weight:900;
        color:var(--muted);
        background:rgba(255,255,255,.04);
        border:1px solid rgba(255,255,255,.07);
        transition:none;
      }

      .tabBtn.active{
        background:linear-gradient(135deg, rgba(25,230,162,.18), rgba(143,255,208,.12));
        color:var(--text);
        border-color:rgba(25,230,162,.26);
        box-shadow:0 10px 24px rgba(25,230,162,.10);
      }

      .searchBox{
        display:flex;
        gap:10px;
        align-items:center;
        padding:12px 14px;
        border-radius:16px;
        background:rgba(255,255,255,.03);
        border:1px solid rgba(255,255,255,.07);
      }

      .searchBox input{
        width:100%;
        background:transparent;
        border:none;
        outline:none;
        color:var(--text);
        font-size:14px;
      }

      .miniMuted{
        font-size:11px;
        color:var(--muted2);
      }

      .hr{
        height:1px;
        background:linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent);
        margin:12px 0;
      }

      .scrollY{
        max-height:480px;
        overflow:auto;
        padding-right:4px;
        scrollbar-width:none;
        -ms-overflow-style:none;
      }
      .scrollY::-webkit-scrollbar{ display:none; }

      .hScroll{
        display:flex;
        gap:10px;
        overflow:auto;
        padding-bottom:2px;
        scrollbar-width:none;
        -ms-overflow-style:none;
      }
      .hScroll::-webkit-scrollbar{ display:none; }

      .tinyCard{
        min-width:220px;
        border-radius:18px;
        border:1px solid rgba(255,255,255,.08);
        background:rgba(255,255,255,.03);
        padding:12px;
      }

      .statsGrid{
        display:grid;
        gap:10px;
        grid-template-columns: repeat(2, minmax(0,1fr));
      }

      .stat{
        border:1px solid rgba(255,255,255,.08);
        border-radius:20px;
        background:rgba(255,255,255,.03);
        padding:13px 12px;
        min-height:70px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.03);
      }

      .statLabel{
        font-size:11px;
        color:var(--muted2);
      }

      .statValue{
        margin-top:8px;
        font-size:16px;
        font-weight:1000;
      }

      .footerNav{
        position:fixed;
        left:50%;
        transform:translateX(-50%);
        bottom:12px;
        z-index:80;
        width:min(calc(100% - 24px), 500px);
        display:grid;
        grid-template-columns: repeat(5, 1fr);
        gap:8px;
        padding:10px;
        border:1px solid rgba(255,255,255,.08);
        background:rgba(8,12,15,.88);
        backdrop-filter: blur(18px);
        border-radius:24px;
        box-shadow:
          0 20px 60px rgba(0,0,0,.34),
          inset 0 1px 0 rgba(255,255,255,.04);
      }

      .footerBtn{
        border:none;
        cursor:pointer;
        border-radius:16px;
        padding:10px 6px;
        color:var(--muted);
        background:transparent;
        font-size:11px;
        font-weight:900;
        transition:none;
        min-height:56px;
      }

      .footerBtn.active{
        color:var(--text);
        background:linear-gradient(135deg, rgba(25,230,162,.16), rgba(143,255,208,.10));
        border:1px solid rgba(25,230,162,.22);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
      }

      .modalBack{
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.58);
        backdrop-filter: blur(10px);
        display:grid;
        place-items:center;
        z-index:120;
        padding:16px;
      }

      .modalCard{
        width:min(100%, 520px);
        max-height:min(86vh, 900px);
        overflow:auto;
        border-radius:26px;
        border:1px solid rgba(255,255,255,.10);
        background:linear-gradient(180deg, rgba(10,15,18,.98), rgba(8,12,15,.96));
        box-shadow:0 30px 80px rgba(0,0,0,.45);
      }

      .modalHead{
        position:sticky;
        top:0;
        z-index:2;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        padding:14px 16px;
        border-bottom:1px solid rgba(255,255,255,.08);
        background:rgba(10,15,18,.92);
        backdrop-filter:blur(14px);
      }

      .modalTitle{
        font-size:14px;
        font-weight:1000;
      }

      .modalBody{
        padding:16px;
      }

      .themeGrid{
        display:grid;
        gap:10px;
      }

      .themeOption{
        width:100%;
        text-align:left;
        padding:12px 13px;
        border-radius:16px;
        border:1px solid rgba(255,255,255,.08);
        background:rgba(255,255,255,.03);
        color:var(--text);
        cursor:pointer;
        transition:none;
      }

      .themeOption.active{
        border-color:rgba(25,230,162,.28);
        background:linear-gradient(135deg, rgba(25,230,162,.12), rgba(143,255,208,.08));
      }

      .row{
        display:flex;
        align-items:center;
        gap:10px;
      }

      .space{
        flex:1;
        min-width:0;
      }

      @media (max-width: 640px){
        .topbar{
          padding:8px 8px 0;
        }

        .topbarInner{
          width:100%;
          min-height:62px;
          padding:10px 10px;
          border-radius:18px;
        }

        .brandLogo{
          width:38px;
          height:38px;
          border-radius:12px;
        }

        .brandTitle{
          font-size:14px;
        }

        .brandSub{
          font-size:10px;
        }

        .topActions{
          gap:6px;
        }

        .appShell{
          width:100%;
          padding:12px 8px 112px;
        }

        .card{
          border-radius:22px;
        }

        .cardBody{
          padding:14px;
        }

        .heroTitle{
          font-size:21px;
          max-width:none;
        }

        .heroText{
          font-size:13px;
          line-height:1.55;
        }

        .statsGrid{
          grid-template-columns:1fr 1fr;
          gap:8px;
        }

        .stat{
          min-height:64px;
          padding:11px;
          border-radius:18px;
        }

        .footerNav{
          width:calc(100% - 16px);
          bottom:8px;
          padding:8px;
          border-radius:20px;
          gap:6px;
        }

        .footerBtn{
          min-height:52px;
          border-radius:14px;
          font-size:10px;
          padding:8px 4px;
        }

        .modalCard{
          width:100%;
          border-radius:22px;
        }
      }
    `}</style>
  );
}

function Card({ children, style }) {
  return (
    <div className="card" style={style}>
      <div className="cardBody">{children}</div>
    </div>
  );
}

function Pill({ children, style }) {
  return (
    <span className="pill" style={style}>
      {children}
    </span>
  );
}

function SectionHeader({ title, sub, right }) {
  return (
    <div className="sectionHeader">
      <div>
        <div className="sectionTitle">{title}</div>
        {sub ? <div className="sectionSub">{sub}</div> : null}
      </div>
      {right}
    </div>
  );
}

function MiniBtn({ children, onClick, disabled, tone = "default", style }) {
  const toneStyle =
    tone === "good"
      ? {
          background: "linear-gradient(135deg, rgba(25,230,162,.16), rgba(143,255,208,.10))",
          border: "1px solid rgba(25,230,162,.28)",
          color: "var(--text)",
        }
      : tone === "danger"
      ? {
          background: "rgba(255,107,107,.10)",
          border: "1px solid rgba(255,107,107,.24)",
          color: "#FFD1D1",
        }
      : {
          background: "rgba(255,255,255,.04)",
          border: "1px solid rgba(255,255,255,.08)",
          color: "var(--text)",
        };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "10px 12px",
        borderRadius: 14,
        fontSize: 12,
        fontWeight: 900,
        opacity: disabled ? 0.55 : 1,
        ...toneStyle,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "13px 14px",
        borderRadius: 16,
        fontSize: 14,
        fontWeight: 1000,
        color: "#07110E",
        background: "linear-gradient(135deg, var(--primary), var(--primary2))",
        boxShadow: "0 12px 30px rgba(25,230,162,.22)",
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  textarea = false,
  rows = 4,
  style,
}) {
  const baseStyle = {
    width: "100%",
    padding: "12px 13px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.03)",
    color: "var(--text)",
    outline: "none",
    fontSize: 14,
  };

  if (textarea) {
    return (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={{
          ...baseStyle,
          resize: "vertical",
          minHeight: 110,
          ...style,
        }}
      />
    );
  }

  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      style={{ ...baseStyle, ...style }}
    />
  );
}

function ScreenShell({ children }) {
  return <div className="midCol">{children}</div>;
}

function Title({ children, sub = null, right = null }) {
  return (
    <div className="sectionHeader" style={{ marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 1000, letterSpacing: ".2px" }}>
          {children}
        </div>
        {sub ? (
          <div style={{ marginTop: 5, fontSize: 12, color: "var(--muted)" }}>{sub}</div>
        ) : null}
      </div>
      {right}
    </div>
  );
}

function Toast({ text, onClose }) {
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => onClose?.(), 2200);
    return () => clearTimeout(t);
  }, [text, onClose]);

  if (!text) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 18,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        padding: "11px 14px",
        borderRadius: 14,
        border: "1px solid rgba(25,230,162,.24)",
        background: "rgba(7,11,14,.95)",
        color: "var(--text)",
        boxShadow: "0 18px 60px rgba(0,0,0,.35)",
        fontSize: 13,
        fontWeight: 900,
        maxWidth: "calc(100% - 24px)",
      }}
    >
      {text}
    </div>
  );
}

function safeNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function shortWallet(w) {
  const s = String(w || "");
  if (!s) return "—";
  if (s.length <= 10) return s;
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
}

function fmtNum(n, digits = 2) {
  const x = Number(n || 0);
  if (!Number.isFinite(x)) return "0";
  return x.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function fmtUsd(n) {
  const x = Number(n || 0);
  if (!Number.isFinite(x) || x <= 0) return "$0";
  if (x >= 1_000_000_000) return `$${(x / 1_000_000_000).toFixed(2)}B`;
  if (x >= 1_000_000) return `$${(x / 1_000_000).toFixed(2)}M`;
  if (x >= 1_000) return `$${(x / 1_000).toFixed(2)}K`;
  if (x >= 1) return `$${x.toFixed(2)}`;
  if (x >= 0.01) return `$${x.toFixed(4)}`;
  if (x >= 0.0001) return `$${x.toFixed(6)}`;
  if (x >= 0.000001) return `$${x.toFixed(8)}`;
  return `$${x.toFixed(10)}`;
}

function fmtSol(n) {
  const x = Number(n || 0);
  if (!Number.isFinite(x) || x <= 0) return "0";
  if (x >= 1000) return fmtNum(x, 0);
  if (x >= 1) return fmtNum(x, 3);
  if (x >= 0.01) return fmtNum(x, 4);
  return fmtNum(x, 6);
}

function pctChangeFromChart(chart, lookback = 12) {
  const arr = Array.isArray(chart)
    ? chart.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0)
    : [];

  if (arr.length < 2) return 0;

  const end = arr[arr.length - 1];
  const startIndex = Math.max(0, arr.length - 1 - lookback);
  const start = arr[startIndex] || arr[0] || end;

  if (!start || !Number.isFinite(start)) return 0;

  const pct = ((end - start) / start) * 100;
  const clamped = Math.max(-500, Math.min(500, pct));
  return Number.isFinite(clamped) ? clamped : 0;
}

function normalizeCoin(c = {}) {
  const totalSupply = Math.max(1, safeNum(c.totalSupply, 1_000_000_000));
  const tokenReserve = Math.max(0, safeNum(c.tokenReserve, 0));
  const circulating = Math.max(0, totalSupply - tokenReserve);
  const mc =
    safeNum(c.mc, 0) ||
    safeNum(c.marketCapUsd, 0) ||
    safeNum(c.market_cap, 0) ||
    STARTING_MC_USD;

  const chart =
    Array.isArray(c.chart) && c.chart.length
      ? c.chart.map((x) => safeNum(x, 0)).filter((x) => x >= 0)
      : [mc, mc, mc, mc, mc];

  return {
    ...c,
    id: String(c.id || ""),
    name: String(c.name || ""),
    symbol: String(c.symbol || "").toUpperCase(),
    story: String(c.story || ""),
    logo: String(c.logo || ""),
    creatorWallet: String(c.creatorWallet || c.creator_wallet || c.owner || ""),
    totalSupply,
    tokenReserve,
    circulating,
    volumeSol: Math.max(0, safeNum(c.volumeSol, c.volume_sol || 0)),
    priceSol: Math.max(0, safeNum(c.priceSol, c.last_price || 0)),
    priceUsd: Math.max(0, safeNum(c.priceUsd, 0)),
    mc,
    ath: Math.max(mc, safeNum(c.ath, c.ath_market_cap || mc)),
    chart,
    holders: c && typeof c.holders === "object" && !Array.isArray(c.holders) ? c.holders : {},
    createdAt: safeNum(c.createdAt, c.created_at ? new Date(c.created_at).getTime() : Date.now()),
    lastTradeAt: safeNum(c.lastTradeAt, c.last_trade_at || 0),
    creatorRewardsSol: Math.max(0, safeNum(c.creatorRewardsSol, c.creator_rewards || 0)),
  };
}

function getCoinPriceUsd(c) {
  const direct = safeNum(c?.priceUsd, 0);
  if (direct > 0) return direct;

  const mc = safeNum(c?.mc, 0);
  const total = Math.max(1, safeNum(c?.totalSupply, 1_000_000_000));
  if (mc > 0 && total > 0) return mc / total;

  const chart = Array.isArray(c?.chart) ? c.chart : [];
  return Math.max(0, safeNum(chart[chart.length - 1], 0));
}

function coinSubtitle(c) {
  const pct = pctChangeFromChart(c?.chart || []);
  const sign = pct > 0 ? "+" : "";
  return `MC ${fmtUsd(c?.mc || 0)} • ${sign}${pct.toFixed(2)}%`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(String(text || ""));
    return true;
  } catch {
    return false;
  }
}

async function fileToDataUrl(file) {
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function getReferralLink(addr) {
  if (!addr || typeof window === "undefined") return "";
  const u = new URL(window.location.href);
  u.searchParams.set("ref", addr);
  return u.toString();
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }

  return json || {};
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0a7 7 0 0114 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-4.5v-6h-5v6H5a1 1 0 01-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 21a8 8 0 10-16 0m8-10a4 4 0 100-8a4 4 0 000 8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CogIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 15.5A3.5 3.5 0 1012 8.5a3.5 3.5 0 000 7zm7.4-3.5a7.7 7.7 0 00-.08-1l2.04-1.59l-2-3.46l-2.46.76a7.85 7.85 0 00-1.73-1L14.8 2h-4l-.37 2.71c-.62.24-1.21.58-1.73 1l-2.46-.76l-2 3.46L6.28 11c-.05.33-.08.66-.08 1s.03.67.08 1l-2.04 1.59l2 3.46l2.46-.76c.52.42 1.11.76 1.73 1L10.8 22h4l.37-2.71c.62-.24 1.21-.58 1.73-1l2.46.76l2-3.46L19.32 13c.05-.33.08-.66.08-1z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 7a2 2 0 012-2h12a2 2 0 012 2v1H5a2 2 0 00-2 2V7zm0 4a2 2 0 012-2h16v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-6zm14 3a1.5 1.5 0 100-3a1.5 1.5 0 000 3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CoinLogo({ c, size = 44, radius = 14 }) {
  const src = String(c?.logo || "").trim();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: "hidden",
        flex: `0 0 ${size}px`,
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(255,255,255,.04)",
        display: "grid",
        placeItems: "center",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={c?.symbol || "coin"}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div style={{ fontSize: 12, fontWeight: 1000, color: "var(--muted)" }}>
          {String(c?.symbol || c?.name || "?").slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function ThemeOption({ theme, current, setTheme, label }) {
  const active = current === theme;

  return (
    <button
      className={`themeOption ${active ? "active" : ""}`}
      onClick={() => {
        setTheme(theme);
        try {
          localStorage.setItem(LS_THEME, theme);
        } catch {}
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 1000, fontSize: 13 }}>{label}</div>
          <div style={{ marginTop: 4, fontSize: 11, color: "var(--muted2)" }}>{theme}</div>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 999, background: "var(--primary)", border: "1px solid rgba(255,255,255,.12)" }} />
          <span style={{ width: 14, height: 14, borderRadius: 999, background: "var(--accent2)", border: "1px solid rgba(255,255,255,.12)" }} />
          <span style={{ width: 14, height: 14, borderRadius: 999, background: "var(--accent3)", border: "1px solid rgba(255,255,255,.12)" }} />
        </div>
      </div>
    </button>
  );
}

function CoinMiniCard({ c, subtitle, onOpen }) {
  return (
    <button className="coinBtn" onClick={onOpen}>
      <div className="coinRow">
        <CoinLogo c={c} size={46} radius={16} />

        <div className="coinText">
          <div className="coinName">{c?.name || c?.symbol || "—"}</div>
          <div className="coinMeta">{subtitle || coinSubtitle(c)}</div>
        </div>

        <div className="rightNum">
          <div className="rightNumMain">{fmtUsd(c?.mc || 0)}</div>
          <div className="rightNumSub">MC</div>
        </div>
      </div>
    </button>
  );
}






export default function App() {
  const { login, authenticated, user, ready, logout } = usePrivy();
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
    }, INTRO_MS);
    return () => clearTimeout(t);
  }, [showIntro]);

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
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(LS_THEME) || "calm";
    } catch {
      return "calm";
    }
  });

  const [screen, setScreen] = useState("HOME");
  const [screenHistory, setScreenHistory] = useState(["HOME"]);
  const [selectedCoinId, setSelectedCoinId] = useState(null);
  const [creatorProfileId, setCreatorProfileId] = useState("");

  const [coins, setCoins] = useState([]);
  const [loadingCoins, setLoadingCoins] = useState(false);
  const [coinsPage, setCoinsPage] = useState(0);
  const [coinsHasMore, setCoinsHasMore] = useState(true);
  const [hot15m, setHot15m] = useState([]);
  const [homeFeedMode, setHomeFeedMode] = useState("ALL");

  const [searchQ, setSearchQ] = useState("");
  const [searchMode, setSearchMode] = useState("SEARCH");

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [walletSolBalance, setWalletSolBalance] = useState(0);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [tokenName, setTokenName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [story, setStory] = useState("");
  const [initialSol, setInitialSol] = useState("0.01");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [creating, setCreating] = useState(false);

  const [tradeMode, setTradeMode] = useState("BUY");
  const [tradeAmount, setTradeAmount] = useState("");
  const [trading, setTrading] = useState(false);

  const coinsLoadMoreRef = useRef(null);
  const didBootRef = useRef(false);

  const solAddr = useMemo(() => {
    const linked =
      user?.linkedAccounts?.find((a) => a?.type === "wallet" && a?.chainType === "solana") ||
      user?.linkedAccounts?.find((a) => a?.type === "wallet");

    return linked?.address || user?.wallet?.address || user?.address || "";
  }, [user]);

  const selectedCoin = useMemo(() => {
    return (coins || []).find((c) => String(c.id) === String(selectedCoinId)) || null;
  }, [coins, selectedCoinId]);

  const myCreations = useMemo(() => {
    if (!solAddr) return [];
    return (coins || [])
      .filter((c) => String(c.creatorWallet || "").trim() === String(solAddr).trim())
      .sort((a, b) => safeNum(b.createdAt, 0) - safeNum(a.createdAt, 0));
  }, [coins, solAddr]);

  const topVolume = useMemo(() => {
    return (coins || [])
      .slice()
      .sort((a, b) => safeNum(b.volumeSol, 0) - safeNum(a.volumeSol, 0))
      .slice(0, 20);
  }, [coins]);

  const topMoves20 = useMemo(() => {
    return (coins || [])
      .map((c) => ({ c, pct: pctChangeFromChart(c?.chart || []) }))
      .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
      .slice(0, 20);
  }, [coins]);

  const filteredCoins = useMemo(() => {
    const q = String(searchQ || "").trim().toLowerCase();
    if (!q) return coins || [];

    return (coins || []).filter((c) => {
      return (
        String(c?.name || "").toLowerCase().includes(q) ||
        String(c?.symbol || "").toLowerCase().includes(q) ||
        String(c?.creatorWallet || "").toLowerCase().includes(q)
      );
    });
  }, [coins, searchQ]);

  const latestCoins = useMemo(() => {
    return (coins || [])
      .slice()
      .sort((a, b) => safeNum(b.createdAt, 0) - safeNum(a.createdAt, 0))
      .slice(0, 20);
  }, [coins]);

  const topMovers4h = useMemo(() => {
    const cutoff = Date.now() - 4 * 60 * 60 * 1000;
    return [...(coins || [])]
      .filter((c) => Number(c?.lastTradeAt || 0) >= cutoff)
      .sort((a, b) => Number(b?.volumeSol || 0) - Number(a?.volumeSol || 0));
  }, [coins]);

  async function loadCoins(page = 0, append = false) {
    try {
      setLoadingCoins(true);

      const json = await api(`/api/coin/list?page=${page}`);
      const incoming = Array.isArray(json?.coins) ? json.coins.map(normalizeCoin) : [];
      const incomingHot = Array.isArray(json?.hot15m) ? json.hot15m.map(normalizeCoin) : [];

      setHot15m(incomingHot);

      setCoins((prev) => {
        if (!append) return incoming;

        const map = new Map();
        [...(prev || []), ...incoming].forEach((c) => {
          if (c?.id) map.set(String(c.id), c);
        });

        return Array.from(map.values()).sort(
          (a, b) => safeNum(b.createdAt, 0) - safeNum(a.createdAt, 0)
        );
      });

      setCoinsPage(page);
      setCoinsHasMore(incoming.length >= 100);

      if (page === 0) {
        try {
          localStorage.setItem("coins_cache_v1", JSON.stringify(incoming));
        } catch {}
      }
    } catch (e) {
      setToast(e?.message || "Failed to load coins");
    } finally {
      setLoadingCoins(false);
    }
  }

  async function loadProfile(wallet = solAddr) {
    if (!wallet) return;

    try {
      setLoadingProfile(true);
      const json = await api(`/api/profile/${wallet}`);
      setProfile(json?.profile || null);
    } catch (e) {
      setToast(e?.message || "Failed to load profile");
    } finally {
      setLoadingProfile(false);
    }
  }

  async function loadBalance(wallet = solAddr) {
    if (!wallet) return;
    try {
      const json = await api(`/api/balance/${wallet}`);
      setWalletSolBalance(Math.max(0, safeNum(json?.sol, 0)));
    } catch {
      setWalletSolBalance(0);
    }
  }

  useEffect(() => {
    if (didBootRef.current) return;
    didBootRef.current = true;

    try {
      const cached = JSON.parse(localStorage.getItem("coins_cache_v1") || "[]");
      if (Array.isArray(cached) && cached.length) {
        setCoins(cached.map(normalizeCoin));
      }
    } catch {}

    loadCoins(0, false);
  }, []);

  useEffect(() => {
    if (!authenticated || !solAddr) {
      setProfile(null);
      setWalletSolBalance(0);
      return;
    }
    loadProfile(solAddr);
    loadBalance(solAddr);
  }, [authenticated, solAddr]);

  useEffect(() => {
    if (screen !== "HOME") return;
    const el = coinsLoadMoreRef.current;
    if (!el || !coinsHasMore || loadingCoins) return;

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && !loadingCoins && coinsHasMore) {
          loadCoins(coinsPage + 1, true);
        }
      },
      { root: null, rootMargin: "200px", threshold: 0.01 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [screen, coinsPage, coinsHasMore, loadingCoins]);

  useEffect(() => {
    const themes = {
      calm: {
        "--bg": "#060A0D",
        "--bgSoft": "rgba(6,10,13,.72)",
        "--card": "rgba(12,19,23,.78)",
        "--card2": "rgba(11,21,25,.62)",
        "--border": "rgba(255,255,255,.08)",
        "--text": "#F4FFF9",
        "--muted": "rgba(244,255,249,.72)",
        "--muted2": "rgba(244,255,249,.50)",
        "--primary": "#19E6A2",
        "--primary2": "#8FFFD0",
        "--accent2": "#6AD7FF",
        "--accent3": "#A78BFA",
        "--heroGlow": "rgba(25,230,162,.22)",
      },
      neon: {
        "--bg": "#09070F",
        "--bgSoft": "rgba(9,7,15,.72)",
        "--card": "rgba(18,15,26,.80)",
        "--card2": "rgba(14,11,22,.64)",
        "--border": "rgba(255,255,255,.08)",
        "--text": "#FAF7FF",
        "--muted": "rgba(250,247,255,.72)",
        "--muted2": "rgba(250,247,255,.48)",
        "--primary": "#C084FC",
        "--primary2": "#E879F9",
        "--accent2": "#22D3EE",
        "--accent3": "#818CF8",
        "--heroGlow": "rgba(192,132,252,.24)",
      },
      ocean: {
        "--bg": "#071017",
        "--bgSoft": "rgba(7,16,23,.72)",
        "--card": "rgba(11,24,34,.80)",
        "--card2": "rgba(10,22,32,.64)",
        "--border": "rgba(255,255,255,.08)",
        "--text": "#F3FCFF",
        "--muted": "rgba(243,252,255,.72)",
        "--muted2": "rgba(243,252,255,.46)",
        "--primary": "#38BDF8",
        "--primary2": "#67E8F9",
        "--accent2": "#22C55E",
        "--accent3": "#A78BFA",
        "--heroGlow": "rgba(56,189,248,.24)",
      },
      rose: {
        "--bg": "#12080C",
        "--bgSoft": "rgba(18,8,12,.72)",
        "--card": "rgba(26,16,20,.80)",
        "--card2": "rgba(22,13,17,.64)",
        "--border": "rgba(255,255,255,.08)",
        "--text": "#FFF7FA",
        "--muted": "rgba(255,247,250,.72)",
        "--muted2": "rgba(255,247,250,.46)",
        "--primary": "#FB7185",
        "--primary2": "#FDA4AF",
        "--accent2": "#F472B6",
        "--accent3": "#C084FC",
        "--heroGlow": "rgba(251,113,133,.24)",
      },
      royal: {
        "--bg": "#0A0C16",
        "--bgSoft": "rgba(10,12,22,.72)",
        "--card": "rgba(17,20,38,.80)",
        "--card2": "rgba(13,17,32,.64)",
        "--border": "rgba(255,255,255,.08)",
        "--text": "#F7F8FF",
        "--muted": "rgba(247,248,255,.72)",
        "--muted2": "rgba(247,248,255,.46)",
        "--primary": "#818CF8",
        "--primary2": "#A5B4FC",
        "--accent2": "#22D3EE",
        "--accent3": "#C084FC",
        "--heroGlow": "rgba(129,140,248,.24)",
      },
    };

    const t = themes[theme] || themes.calm;
    Object.entries(t).forEach(([k, v]) => {
      document.documentElement.style.setProperty(k, v);
    });

    document.body.style.background = `
      radial-gradient(1200px 700px at 15% -10%, ${t["--heroGlow"]}, transparent 55%),
      radial-gradient(900px 600px at 110% 0%, ${t["--accent2"]}22, transparent 45%),
      linear-gradient(180deg, ${t["--bg"]} 0%, ${t["--bg"]} 100%)
    `;
    document.body.style.color = t["--text"];

    try {
      localStorage.setItem(LS_THEME, theme);
    } catch {}
  }, [theme]);

  async function handleLogoPick(file) {
    if (!file) return;

    if (file.size > MAX_LOGO_BYTES) {
      setToast("Logo too large");
      return;
    }

    try {
      const data = await fileToDataUrl(file);
      setLogoFile(file);
      setLogoPreview(data);
    } catch {
      setToast("Logo read failed");
    }
  }

  function goScreen(next) {
    setScreenHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last === next) return prev;
      return [...prev, next];
    });
    setScreen(next);
  }

  function goBack() {
    setScreenHistory((prev) => {
      if (prev.length <= 1) {
        setScreen("HOME");
        return ["HOME"];
      }
      const nextHistory = prev.slice(0, -1);
      const prevScreen = nextHistory[nextHistory.length - 1] || "HOME";
      setScreen(prevScreen);
      return nextHistory;
    });
  }









    async function handleCreateCoin() {
    if (!authenticated || !solAddr) {
      setToast("Connect wallet first");
      return;
    }

    const n = tokenName.trim();
    const s = symbol.trim().toUpperCase();
    const st = story.trim();
    const init = Math.max(0, safeNum(initialSol, 0));

    if (!n || !s) {
      setToast("Name and symbol required");
      return;
    }

    try {
      setCreating(true);

      const payload = {
        name: n,
        symbol: s,
        story: st,
        logo: logoPreview,
        initialSol: init,
        creatorWallet: solAddr,
      };

      const json = await api("/api/coin/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const created = normalizeCoin(json?.coin || {});
      if (!created?.id) throw new Error("Create failed");

      setCoins((prev) => [
        created,
        ...(prev || []).filter((x) => String(x.id) !== String(created.id)),
      ]);
      setSelectedCoinId(created.id);
      goScreen("COIN");

      setTokenName("");
      setSymbol("");
      setStory("");
      setInitialSol("0.01");
      setLogoFile(null);
      setLogoPreview("");

      setToast("Coin created");
      loadCoins(0, false);
      loadProfile(solAddr);
      loadBalance(solAddr);
    } catch (e) {
      setToast(e?.message || "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function handleTrade() {
    if (!authenticated || !solAddr) {
      setToast("Connect wallet first");
      return;
    }
    if (!selectedCoin?.id) {
      setToast("Select a coin first");
      return;
    }

    const amount = Math.max(0, safeNum(tradeAmount, 0));
    if (amount <= 0) {
      setToast("Enter amount");
      return;
    }

    try {
      setTrading(true);

      const path = tradeMode === "BUY" ? "/api/coin/buy" : "/api/coin/sell";
      const payload = {
        wallet: solAddr,
        coinId: selectedCoin.id,
        sol: amount,
      };

      const json = await api(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const updated = normalizeCoin(json?.coin || {});
      if (updated?.id) {
        setCoins((prev) =>
          (prev || []).map((c) => (String(c.id) === String(updated.id) ? updated : c))
        );
        setSelectedCoinId(updated.id);
      }

      setTradeAmount("");
      setToast(tradeMode === "BUY" ? "Buy successful" : "Sell successful");

      await loadCoins(0, false);
      await loadProfile(solAddr);
      await loadBalance(solAddr);
    } catch (e) {
      setToast(e?.message || "Trade failed");
    } finally {
      setTrading(false);
    }
  }

  async function handleSetReferrer() {
    if (!authenticated || !solAddr) return;

    try {
      const saved = (localStorage.getItem("ref") || "").trim();
      if (!saved || saved === solAddr) return;

      await api("/api/referral/set", {
        method: "POST",
        body: JSON.stringify({
          wallet: solAddr,
          referrer: saved,
        }),
      });
    } catch {}
  }

  useEffect(() => {
    if (!authenticated || !solAddr) return;
    handleSetReferrer();
  }, [authenticated, solAddr]);

  async function handleWithdraw(kind) {
    if (!authenticated || !solAddr) {
      setToast("Connect wallet first");
      return;
    }

    try {
      const json = await api("/api/withdraw", {
        method: "POST",
        body: JSON.stringify({
          wallet: solAddr,
          kind,
        }),
      });

      if (json?.ok) {
        setToast(`Withdraw ready: ${fmtSol(json.amountSol)} SOL`);
        loadProfile(solAddr);
        loadBalance(solAddr);
        loadCoins(0, false);
      } else {
        setToast(json?.error || "Withdraw failed");
      }
    } catch (e) {
      setToast(e?.message || "Withdraw failed");
    }
  }

  const creatorCoin = selectedCoin || null;
  const creatorCoins = useMemo(() => {
    const cid = creatorProfileId || creatorCoin?.creatorWallet || "";
    return (coins || []).filter((x) => String(x.creatorWallet || "") === String(cid));
  }, [coins, creatorProfileId, creatorCoin]);

  const creatorRewards = useMemo(() => {
    return creatorCoins.reduce((sum, coin) => sum + Number(coin?.creatorRewardsSol || 0), 0);
  }, [creatorCoins]);

  const creatorHoldings = useMemo(() => {
    const cid = creatorProfileId || creatorCoin?.creatorWallet || "";
    if (!cid) return [];

    return creatorCoins
      .map((coin) => {
        const amt = Math.max(0, safeNum(coin?.holders?.[cid], 0));
        const pct = coin?.totalSupply ? (amt / coin.totalSupply) * 100 : 0;
        return { coin, amt, pct };
      })
      .filter((x) => x.amt > 0)
      .sort((a, b) => b.amt - a.amt);
  }, [creatorCoins, creatorProfileId, creatorCoin]);

  const profileHoldings = Array.isArray(profile?.holdings) ? profile.holdings : [];
  const profileTxs = Array.isArray(profile?.txs) ? profile.txs : [];

  function PriceChart({ coin, height = 280 }) {
    const rawPoints =
      Array.isArray(coin?.chart) && coin.chart.length
        ? coin.chart.map((n) => Math.max(0, safeNum(n, 0)))
        : [0, 0, 0, 0, 0];

    const basePoints =
      rawPoints.length >= 2 ? rawPoints.slice(-60) : [0, 0, 0, 0, 0];

    const points = basePoints.map((p, i, arr) => {
      const isLastZone = i >= arr.length - 3;
      if (isLastZone) return p;

      const prev = arr[i - 1] ?? p;
      const next = arr[i + 1] ?? p;
      return (prev + p + next) / 3;
    });

    const w = 1000;
    const h = height;
    const pad = 18;

    const maxRaw = Math.max(...points, 1e-12);
    const minRaw = Math.min(...points, maxRaw);
    const spread = Math.max(maxRaw - minRaw, 1e-12);

    const center = (maxRaw + minRaw) / 2;
    const visualRange = Math.max(spread * 2.4, center * 0.12, 1e-12);

    const min = Math.max(0, center - visualRange / 2);
    const max = center + visualRange / 2;
    const range = Math.max(max - min, 1e-12);

    const coords = points.map((p, i) => {
      const x = pad + (i * (w - pad * 2)) / Math.max(1, points.length - 1);
      const y = h - pad - ((p - min) / range) * (h - pad * 2);
      return [x, y];
    });

    const d = coords
      .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt[0].toFixed(2)} ${pt[1].toFixed(2)}`)
      .join(" ");

    const area = `${d} L ${coords[coords.length - 1][0]} ${h - pad} L ${coords[0][0]} ${h - pad} Z`;
    const label = fmtUsd(points[points.length - 1] || 0);
    const pct = pctChangeFromChart(points);

    return (
      <div
        style={{
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,.08)",
          background: "linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015))",
          padding: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted2)", fontWeight: 900 }}>Price</div>
            <div style={{ marginTop: 4, fontSize: 20, fontWeight: 1000 }}>{label}</div>
          </div>

          <Pill
            style={{
              color: pct >= 0 ? "var(--good)" : "var(--danger)",
              borderColor: pct >= 0 ? "rgba(25,230,162,.20)" : "rgba(255,107,107,.20)",
              background: pct >= 0 ? "rgba(25,230,162,.08)" : "rgba(255,107,107,.08)",
            }}
          >
            {pct >= 0 ? "+" : ""}
            {pct.toFixed(2)}%
          </Pill>
        </div>

        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={height} preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={pct >= 0 ? "rgba(25,230,162,.38)" : "rgba(255,107,107,.30)"} />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>

          <path d={area} fill="url(#areaFill)" />
          <path
            d={d}
            fill="none"
            stroke={pct >= 0 ? "var(--primary)" : "var(--danger)"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  function openCoin(c) {
    if (!c?.id) return;
    setSelectedCoinId(c.id);
    goScreen("COIN");
  }

  function openCreatorFromCoin(c) {
    const cw = String(c?.creatorWallet || "").trim();
    if (!cw) return;
    setCreatorProfileId(cw);
    goScreen("CREATOR");
  }

  const toUsdFromSol = (sol) => fmtUsd(Number(sol || 0) * 80);

  function renderBackButton() {
    if (screen === "HOME") return null;

    return (
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={goBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 14,
            border: "1px solid var(--border)",
            background: "var(--btnBg)",
            color: "var(--text)",
            cursor: "pointer",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 10px 30px rgba(0,0,0,.22)",
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>←</span>
          <span style={{ fontWeight: 900 }}>Back</span>
        </button>
      </div>
    );
  }







    return (
    <>
      <ThemeStyles />
      <Toast text={toast} onClose={() => setToast("")} />

      {showIntro ? <IntroSplash logoUrl={APP_LOGO_URL} /> : null}

      <div className="topbar">
        <div className="topbarInner">
          <div
            className="brand"
            style={{ cursor: "pointer" }}
            onClick={() => {
              goScreen("HOME");
            }}
          >
            <div className="brandLogo">
              <img src={APP_LOGO_URL} alt="Fun.Run" />
            </div>

            <div className="brandText">
              <div className="brandTitle">Fun.Run</div>
              <div className="brandSub">Creator-first meme coin launchpad</div>
            </div>
          </div>

          <div className="topActions">
            {!authenticated ? (
              <MiniBtn
                tone="good"
                onClick={async () => {
                  try {
                    if (ready) await login();
                  } catch (e) {
                    setToast(e?.message || "Login failed");
                  }
                }}
              >
                Connect
              </MiniBtn>
            ) : (
              <>
                <Pill>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <WalletIcon />
                    {shortWallet(solAddr)}
                  </span>
                </Pill>

                <MiniBtn
                  onClick={async () => {
                    try {
                      await copyText(solAddr);
                      setToast("Address copied");
                    } catch {
                      setToast("Copy failed");
                    }
                  }}
                >
                  Copy
                </MiniBtn>

                <MiniBtn
                  onClick={async () => {
                    try {
                      await exportWallet();
                      setToast("Wallet backup exported");
                    } catch (e) {
                      setToast(e?.message || "Export failed");
                    }
                  }}
                >
                  Export
                </MiniBtn>

                <MiniBtn
                  onClick={async () => {
                    try {
                      await logout();
                    } catch {}
                  }}
                >
                  Logout
                </MiniBtn>
              </>
            )}

            <MiniBtn onClick={() => setSettingsOpen(true)}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <CogIcon />
                Settings
              </span>
            </MiniBtn>
          </div>
        </div>
      </div>

      <div className="appShell">
        {screen === "HOME" && (
          <div className="grid">
            <div className="leftCol">
              <Card>
                <div className="heroGlow" />
                <Title sub="Creator-first meme coin launchpad">Fun.Run</Title>

                <div className="heroTitle">Fast. Clean. Smooth.</div>
                <div className="heroText">
                  Launch coins, trade instantly, track rewards, and grow your creator profile.
                </div>

                <div className="pillRow" style={{ marginTop: 14 }}>
                  <Pill>SOL Balance: {fmtSol(walletSolBalance)}</Pill>
                  <Pill>Coins: {fmtNum(coins.length, 0)}</Pill>
                  <Pill>Hot: {fmtNum(hot15m.length, 0)}</Pill>
                </div>

                <div className="heroActions">
                  <MiniBtn tone="good" onClick={() => goScreen("CREATE")}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <PlusIcon /> Create Coin
                    </span>
                  </MiniBtn>

                  <MiniBtn onClick={() => goScreen("SEARCH")}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <SearchIcon /> Explore
                    </span>
                  </MiniBtn>
                </div>
              </Card>
            </div>

            <ScreenShell>
              <Card>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <SectionHeader
                    title={
                      homeFeedMode === "TOP_MOVERS"
                        ? "Top Movers"
                        : homeFeedMode === "LATEST"
                        ? "Latest"
                        : "All Coins"
                    }
                    sub={
                      homeFeedMode === "TOP_MOVERS"
                        ? "Top 50 by volume in last 4 hours"
                        : homeFeedMode === "LATEST"
                        ? "Latest 50 created coins"
                        : "All users coins"
                    }
                  />

                  <div className="tabs">
                    <button
                      className={`tabBtn ${homeFeedMode === "ALL" ? "active" : ""}`}
                      onClick={() => setHomeFeedMode("ALL")}
                    >
                      All Coins
                    </button>

                    <button
                      className={`tabBtn ${homeFeedMode === "TOP_MOVERS" ? "active" : ""}`}
                      onClick={() => setHomeFeedMode("TOP_MOVERS")}
                    >
                      Top Movers
                    </button>

                    <button
                      className={`tabBtn ${homeFeedMode === "LATEST" ? "active" : ""}`}
                      onClick={() => setHomeFeedMode("LATEST")}
                    >
                      Latest
                    </button>
                  </div>
                </div>

                <div className="coinList">
                  {(homeFeedMode === "TOP_MOVERS"
                    ? topMovers4h.slice(0, 50)
                    : homeFeedMode === "LATEST"
                    ? latestCoins.slice(0, 50)
                    : coins
                  ).map((c) => (
                    <CoinMiniCard
                      key={c.id}
                      c={c}
                      subtitle={
                        homeFeedMode === "TOP_MOVERS"
                          ? `4h Volume • ${toUsdFromSol(c.volumeSol || 0)}`
                          : homeFeedMode === "LATEST"
                          ? `Created • ${new Date(c.createdAt || Date.now()).toLocaleString()}`
                          : `Volume • ${toUsdFromSol(c.volumeSol || 0)}`
                      }
                      onOpen={() => openCoin(c)}
                    />
                  ))}
                </div>

                <div
                  ref={coinsLoadMoreRef}
                  style={{
                    height: 24,
                    display: homeFeedMode === "ALL" ? "flex" : "none",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 10,
                    color: "var(--muted)",
                    fontSize: 12,
                  }}
                >
                  {loadingCoins ? "Loading..." : coinsHasMore ? "Scroll for more" : "No more coins"}
                </div>
              </Card>
            </ScreenShell>
          </div>
        )}

        {screen === "SEARCH" && (
          <ScreenShell>
            {renderBackButton()}

            <Card>
              <Title sub="Search, top volume, top moves">Search</Title>

              <div className="tabs" style={{ marginBottom: 12 }}>
                {["SEARCH", "TOP_VOLUME", "TOP_MOVES"].map((m) => (
                  <button
                    key={m}
                    className={`tabBtn ${searchMode === m ? "active" : ""}`}
                    onClick={() => setSearchMode(m)}
                  >
                    {m === "SEARCH" ? "Search" : m === "TOP_VOLUME" ? "Top Volume" : "Top Moves 24h"}
                  </button>
                ))}
              </div>

              {searchMode === "SEARCH" && (
                <>
                  <div className="searchBox">
                    <SearchIcon />
                    <input
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                      placeholder="Search by name, symbol, or creator wallet"
                    />
                  </div>

                  <div className="hr" />

                  <div className="coinList">
                    {filteredCoins.map((c) => (
                      <CoinMiniCard
                        key={c.id}
                        c={c}
                        subtitle={coinSubtitle(c)}
                        onOpen={() => openCoin(c)}
                      />
                    ))}
                  </div>
                </>
              )}

              {searchMode === "TOP_VOLUME" && (
                <div className="coinList">
                  {topVolume.map((c) => (
                    <CoinMiniCard
                      key={c.id}
                      c={c}
                      subtitle={`Volume • ${toUsdFromSol(c.volumeSol || 0)}`}
                      onOpen={() => openCoin(c)}
                    />
                  ))}
                </div>
              )}

              {searchMode === "TOP_MOVES" && (
                <div className="coinList">
                  {topMoves20.map(({ c, pct }) => (
                    <CoinMiniCard
                      key={c.id}
                      c={c}
                      subtitle={`${pct >= 0 ? "+" : ""}${pct.toFixed(2)}% • MC ${fmtUsd(c.mc || 0)}`}
                      onOpen={() => openCoin(c)}
                    />
                  ))}
                </div>
              )}
            </Card>
          </ScreenShell>
        )}

        {screen === "CREATE" && (
          <ScreenShell>
            {renderBackButton()}

            <Card>
              <Title sub="Create a new coin">Create Coin</Title>

              <div style={{ display: "grid", gap: 12 }}>
                <Input
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="Coin name"
                />

                <Input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="Symbol"
                />

                <Input
                  textarea
                  rows={4}
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Story / description"
                />

                <Input
                  type="number"
                  value={initialSol}
                  onChange={(e) => setInitialSol(e.target.value)}
                  placeholder="Initial buy in SOL"
                />

                <div
                  style={{
                    border: "1px dashed rgba(255,255,255,.12)",
                    borderRadius: 18,
                    padding: 14,
                    background: "rgba(255,255,255,.02)",
                  }}
                >
                  <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 10 }}>
                    Logo
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoPick(e.target.files?.[0])}
                  />

                  {logoPreview ? (
                    <div style={{ marginTop: 12 }}>
                      <CoinLogo c={{ logo: logoPreview, symbol }} size={80} radius={18} />
                    </div>
                  ) : null}
                </div>

                <PrimaryButton disabled={creating} onClick={handleCreateCoin}>
                  {creating ? "Creating..." : "Create Coin"}
                </PrimaryButton>
              </div>
            </Card>
          </ScreenShell>
        )}

        {screen === "COIN" && (
          <ScreenShell>
            {renderBackButton()}

            {!selectedCoin ? (
              <Card>
                <div className="miniMuted">Select a coin first.</div>
              </Card>
            ) : (
              <>
                <Card>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                    <CoinLogo c={selectedCoin} size={72} radius={20} />

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 24, fontWeight: 1000, lineHeight: 1.05 }}>
                        {selectedCoin.name}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)" }}>
                        {selectedCoin.symbol}
                      </div>

                      <div className="pillRow" style={{ marginTop: 12 }}>
                        <Pill>MC {fmtUsd(selectedCoin.mc || 0)}</Pill>
                        <Pill>ATH {fmtUsd(selectedCoin.ath || 0)}</Pill>
                        <Pill>Volume {toUsdFromSol(selectedCoin.volumeSol || 0)}</Pill>
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 8, width: isMobile ? "100%" : 180 }}>
                      <MiniBtn onClick={() => openCreatorFromCoin(selectedCoin)}>Creator Profile</MiniBtn>
                      <MiniBtn
                        onClick={async () => {
                          const ok = await copyText(selectedCoin?.creatorWallet || "");
                          setToast(ok ? "Creator wallet copied" : "Copy failed");
                        }}
                      >
                        Copy Creator
                      </MiniBtn>
                    </div>
                  </div>

                  {selectedCoin.story ? (
                    <div style={{ marginTop: 14, color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
                      {selectedCoin.story}
                    </div>
                  ) : null}

                  <div className="hr" />
                  <PriceChart key={selectedCoin?.chart?.length} coin={selectedCoin} height={isMobile ? 240 : 320} />

                  <div className="statsGrid" style={{ marginTop: 12 }}>
                    <div className="stat">
                      <div className="statLabel">Your Tokens</div>
                      <div className="statValue">
                        {fmtNum((selectedCoin?.holders && selectedCoin.holders[solAddr]) || 0, 4)}
                      </div>
                    </div>

                    <div className="stat">
                      <div className="statLabel">Coin Reward</div>
                      <div className="statValue">
                        {toUsdFromSol(selectedCoin?.creatorRewardsSol || 0)}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <SectionHeader title="Trade" sub="Buy / sell with SOL only" />

                  <div className="tabs" style={{ marginBottom: 12 }}>
                    {["BUY", "SELL"].map((m) => (
                      <button
                        key={m}
                        className={`tabBtn ${tradeMode === m ? "active" : ""}`}
                        onClick={() => setTradeMode(m)}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <Input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    placeholder={tradeMode === "BUY" ? "Enter SOL amount to buy" : "Enter SOL amount to sell"}
                  />

                  <div className="pillRow" style={{ marginTop: 12 }}>
                    <MiniBtn onClick={() => setTradeAmount("0.01")}>0.01</MiniBtn>
                    <MiniBtn onClick={() => setTradeAmount("0.1")}>0.1</MiniBtn>
                    <MiniBtn onClick={() => setTradeAmount("1")}>1</MiniBtn>
                    <MiniBtn onClick={() => setTradeAmount("10")}>10</MiniBtn>
                  </div>

                  <PrimaryButton style={{ marginTop: 14 }} disabled={trading} onClick={handleTrade}>
                    {trading ? "Processing..." : tradeMode === "BUY" ? "Buy" : "Sell"}
                  </PrimaryButton>
                </Card>
              </>
            )}
          </ScreenShell>
        )}

        {screen === "PROFILE" && (
          <ScreenShell>
            {renderBackButton()}

            <Card>
              <Title
                sub={authenticated ? shortWallet(solAddr) : "Connect wallet to view profile"}
                right={
                  authenticated ? (
                    <div className="pillRow">
                      <MiniBtn onClick={() => handleWithdraw("REF")}>Withdraw Affiliate</MiniBtn>
                      <MiniBtn onClick={() => handleWithdraw("CREATOR")}>Withdraw Creator</MiniBtn>
                    </div>
                  ) : null
                }
              >
                Profile
              </Title>

              {!authenticated ? (
                <div className="miniMuted">Wallet not connected.</div>
              ) : (
                <>
                  <div className="pillRow" style={{ marginBottom: 14 }}>
                    <Pill>SOL Balance: {fmtSol(walletSolBalance)}</Pill>
                    <Pill>Affiliate Rewards: {toUsdFromSol(profile?.referralRewards?.totalSol || 0)}</Pill>
                    <Pill>Creator Rewards: {toUsdFromSol(profile?.rewards?.totalSol || 0)}</Pill>
                    <Pill>Affiliates: {fmtNum(profile?.referralCount || 0, 0)}</Pill>
                  </div>

                  <SectionHeader
                    title="Affiliate Link"
                    right={
                      <MiniBtn
                        onClick={async () => {
                          const link = getReferralLink(solAddr);
                          const ok = await copyText(link);
                          setToast(ok ? "Affiliate link copied" : "Copy failed");
                        }}
                      >
                        Copy
                      </MiniBtn>
                    }
                  />
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,.08)",
                      background: "rgba(255,255,255,.03)",
                      fontSize: 12,
                      color: "var(--muted)",
                      wordBreak: "break-all",
                    }}
                  >
                    {getReferralLink(solAddr) || "—"}
                  </div>

                  <div className="hr" />

                  <SectionHeader title="My Creations" right={<Pill>{myCreations.length}</Pill>} />
                  <div className="scrollY" style={{ display: "grid", gap: 10 }}>
                    {myCreations.length === 0 ? (
                      <div className="miniMuted">No created coins.</div>
                    ) : (
                      myCreations.map((coin) => (
                        <button
                          key={coin.id}
                          onClick={() => openCoin(coin)}
                          style={{
                            width: "100%",
                            padding: 12,
                            borderRadius: 14,
                            border: "1px solid var(--border)",
                            background: "var(--card)",
                            color: "var(--text)",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <CoinLogo c={coin} size={44} radius={14} />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: 1000, fontSize: 13 }}>{coin.name}</div>
                              <div style={{ marginTop: 4, fontSize: 11, color: "var(--muted2)" }}>
                                {coin.symbol} • MC {fmtUsd(coin.mc || 0)}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="hr" />

                  <SectionHeader title="My Holdings" right={<Pill>{profileHoldings.length}</Pill>} />
                  <div className="scrollY" style={{ display: "grid", gap: 10 }}>
                    {profileHoldings.length === 0 ? (
                      <div className="miniMuted">No holdings found.</div>
                    ) : (
                      profileHoldings.map((h) => {
                        const c = (coins || []).find((x) => String(x.id) === String(h.coinId));
                        return (
                          <button
                            key={h.coinId}
                            onClick={() => {
                              if (c) openCoin(c);
                            }}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: 12,
                              borderRadius: 16,
                              border: "1px solid rgba(255,255,255,.08)",
                              background: "rgba(255,255,255,.03)",
                              color: "var(--text)",
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <CoinLogo
                                c={c || { symbol: h.symbol, name: h.name, logo: h.logo }}
                                size={44}
                                radius={14}
                              />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 1000, fontSize: 13 }}>
                                  {h.name || h.symbol || "—"}
                                </div>
                                <div style={{ marginTop: 4, fontSize: 11, color: "var(--muted2)" }}>
                                  {fmtNum(h.amount || 0, 4)} tokens • {safeNum(h.pct, 0).toFixed(4)}%
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="hr" />

                  <SectionHeader title="Last Transactions" right={<Pill>{profileTxs.length}</Pill>} />
                  <div className="scrollY" style={{ display: "grid", gap: 10 }}>
                    {profileTxs.length === 0 ? (
                      <div className="miniMuted">No transactions found.</div>
                    ) : (
                      profileTxs.map((tx) => {
                        const c = (coins || []).find((x) => String(x.id) === String(tx.coinId));
                        return (
                          <div
                            key={tx.id}
                            style={{
                              padding: 12,
                              borderRadius: 16,
                              border: "1px solid rgba(255,255,255,.08)",
                              background: "rgba(255,255,255,.03)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 10,
                              }}
                            >
                              <div style={{ fontSize: 13, fontWeight: 1000 }}>
                                {tx.side} • {c?.symbol || "COIN"}
                              </div>
                              <Pill>{new Date(tx.t || Date.now()).toLocaleString()}</Pill>
                            </div>

                            <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
                              SOL: {fmtSol(tx.sol || 0)} • Tokens: {fmtNum(tx.tokens || 0, 4)} • Fee: {fmtSol(tx.fee || 0)}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </Card>
          </ScreenShell>
        )}

        {screen === "CREATOR" && (
          <ScreenShell>
            {renderBackButton()}

            <Card>
              <Title sub={shortWallet(creatorProfileId || creatorCoin?.creatorWallet || "")}>
                Creator Profile
              </Title>

              <div className="pillRow" style={{ marginBottom: 14 }}>
                <Pill>Coins Created: {fmtNum(creatorCoins.length, 0)}</Pill>
                <Pill>Lifetime Reward: {toUsdFromSol(creatorRewards || 0)}</Pill>
              </div>

              <SectionHeader title="Coins Created" right={<Pill>{creatorCoins.length}</Pill>} />
              <div className="hScroll" style={{ marginBottom: 14 }}>
                {creatorCoins.length === 0 ? (
                  <div className="miniMuted">No created coins.</div>
                ) : (
                  creatorCoins.map((coin) => (
                    <button
                      key={coin.id}
                      className="tinyCard"
                      onClick={() => openCoin(coin)}
                      style={{ textAlign: "left", color: "var(--text)", cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <CoinLogo c={coin} size={42} radius={14} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 1000, fontSize: 13 }}>{coin.name}</div>
                          <div style={{ marginTop: 3, fontSize: 11, color: "var(--muted2)" }}>
                            {coin.symbol}
                          </div>
                        </div>
                      </div>

                      <div className="pillRow" style={{ marginTop: 12 }}>
                        <Pill>MC {fmtUsd(coin.mc || 0)}</Pill>
                        <Pill>Reward {toUsdFromSol(coin.creatorRewardsSol || 0)}</Pill>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <SectionHeader title="Creator Holdings" right={<Pill>{creatorHoldings.length}</Pill>} />
              <div
                className="creatorScroll"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  maxHeight: 320,
                  overflowY: "auto",
                  paddingRight: 4,
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {creatorHoldings.length === 0 ? (
                  <div style={{ color: "var(--muted2)", fontSize: 13 }}>No holdings found.</div>
                ) : (
                  creatorHoldings.map(({ coin, amt, pct }) => (
                    <button
                      key={coin.id}
                      onClick={() => {
                        setSelectedCoinId(coin.id);
                        goScreen("COIN");
                      }}
                      style={{
                        width: "100%",
                        padding: 12,
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,.08)",
                        background: "rgba(255,255,255,.03)",
                        color: "var(--text)",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <CoinLogo c={coin} size={44} radius={14} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 1000, fontSize: 13 }}>{coin.name}</div>
                          <div style={{ marginTop: 4, fontSize: 11, color: "var(--muted2)" }}>
                            {fmtNum(amt, 4)} tokens • {safeNum(pct, 0).toFixed(4)}%
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>
          </ScreenShell>
        )}
      </div>

      <div className="footerNav">
        <button className={`footerBtn ${screen === "HOME" ? "active" : ""}`} onClick={() => goScreen("HOME")}>
          <div style={{ display: "grid", gap: 5, justifyItems: "center" }}>
            <HomeIcon />
            <span>Home</span>
          </div>
        </button>

        <button className={`footerBtn ${screen === "SEARCH" ? "active" : ""}`} onClick={() => goScreen("SEARCH")}>
          <div style={{ display: "grid", gap: 5, justifyItems: "center" }}>
            <SearchIcon />
            <span>Search</span>
          </div>
        </button>

        <button className={`footerBtn ${screen === "CREATE" ? "active" : ""}`} onClick={() => goScreen("CREATE")}>
          <div style={{ display: "grid", gap: 5, justifyItems: "center" }}>
            <PlusIcon />
            <span>Create</span>
          </div>
        </button>

        <button className={`footerBtn ${screen === "PROFILE" ? "active" : ""}`} onClick={() => goScreen("PROFILE")}>
          <div style={{ display: "grid", gap: 5, justifyItems: "center" }}>
            <UserIcon />
            <span>Profile</span>
          </div>
        </button>

        <button className="footerBtn" onClick={() => setSettingsOpen(true)}>
          <div style={{ display: "grid", gap: 5, justifyItems: "center" }}>
            <CogIcon />
            <span>Settings</span>
          </div>
        </button>
      </div>

      {settingsOpen ? (
        <div className="modalBack" onClick={() => setSettingsOpen(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div className="modalTitle">Settings</div>
              <MiniBtn onClick={() => setSettingsOpen(false)}>Close</MiniBtn>
            </div>

            <div className="modalBody">
              <Card style={{ background: "transparent", boxShadow: "none", border: "none" }}>
                <SectionHeader title="Theme" sub="Choose your app style" />
                <div className="themeGrid">
                  <ThemeOption theme="calm" current={theme} setTheme={setTheme} label="Calm (Default)" />
                  <ThemeOption theme="neon" current={theme} setTheme={setTheme} label="Neon" />
                  <ThemeOption theme="ocean" current={theme} setTheme={setTheme} label="Ocean" />
                  <ThemeOption theme="rose" current={theme} setTheme={setTheme} label="Rose" />
                  <ThemeOption theme="royal" current={theme} setTheme={setTheme} label="Royal" />
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}