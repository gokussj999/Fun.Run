import IntroSplash from "./IntroSplash";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { env } from "./lib/env.js";
import { tokens } from "./lib/design-tokens.js";
import {
  Badge,
  Card,
  ChartSkeleton,
  CoinListSkeleton,
  EmptyState,
  Input,
  MiniBtn,
  Modal,
  ModalBody,
  ModalHead,
  Pill,
  PrimaryButton,
  ProfileHeaderSkeleton,
  Skeleton,
  Toast,
} from "./components/ui";
import {
  AppShell,
  BackButton,
  FooterNav,
  ScreenShell,
  TopBar,
} from "./components/layout";
import { useToast } from "./hooks/useToast.js";
import { LandingPage } from "./pages/LandingPage.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { SearchPage } from "./pages/SearchPage.jsx";
import { CreateCoinPage } from "./pages/CreateCoinPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { PortfolioPage } from "./pages/PortfolioPage.jsx";
import { CreatorDashboardPage } from "./pages/CreatorDashboardPage.jsx";
import { CreatorPublicPage } from "./pages/CreatorPublicPage.jsx";
import { ReferralDashboardPage } from "./pages/ReferralDashboardPage.jsx";
import { AdminDashboardPage } from "./pages/AdminDashboardPage.jsx";
import { ThemeOption } from "./components/settings/ThemeOption.jsx";
import { CoinLogo, CoinMiniCard } from "./components/coins";
import {
  safeNum,
  fmtNum,
  fmtUsd,
  fmtSol,
  timeAgo,
  getCoin24hMovePct,
} from "./lib/coin-display.js";
import { CoinPage } from "./pages/CoinPage.jsx";
import { api } from "./services/api.js";
import * as platformApi from "./services/platform-api.js";
import { usePlatformWs } from "./hooks/usePlatformWs.js";
import { computeTradePreview } from "./lib/trade-preview.js";
import { usePrivy } from "@privy-io/react-auth";
import { useExportWallet, useWallets } from "@privy-io/react-auth/solana";


const INTRO_MS = 5000;
const APP_LOGO_URL = "/logo.png";
const API_BASE = env.apiBase;
const USE_PLATFORM = env.usePlatform;

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const STARTING_MC_USD = 6500;
const LS_THEME = "theme";
const LS_PROFILE_AVATAR = "profile_avatar_v1";

const APP_OWNER_WALLET = "HEBqdStfnZgygQVMxpq5CXjsfPPagytdZoAyY2WcC1ji";
const DEX_LAUNCH_MC_USD = 5_000_000;
const DEX_OPTIONS = [
  { id: "raydium", name: "Raydium", sub: "Most popular Solana liquidity pool option." },
  { id: "orca", name: "Orca", sub: "Clean Solana DEX with concentrated liquidity." },
  { id: "meteora", name: "Meteora", sub: "Advanced pools and dynamic liquidity tools." },
];
const FUNRUN_NATIVE_ADS = [
  "Fun.Run — Start your crypto journey today",
  "Fun.Run — Create. Launch. Grow.",
  "Fun.Run — Turn your meme into a movement",
  "Fun.Run — Discover the next viral coin",
  "Fun.Run — Launch your coin in seconds",
  "Fun.Run — Trade fast. Earn rewards.",
  "Fun.Run — Built for creators, powered by community",
  "Fun.Run — Your meme. Your coin. Your run.",
  "Fun.Run — Invite friends and earn 50% rewards",
  "Fun.Run — Where new coins begin",
];

const REFERRAL_AD_TEXT = "Fun.Run — Invite friends and earn 50% rewards";
const FUNRUN_AD_SEQUENCE = [
  REFERRAL_AD_TEXT,
  FUNRUN_NATIVE_ADS[0],
  REFERRAL_AD_TEXT,
  FUNRUN_NATIVE_ADS[1],
  REFERRAL_AD_TEXT,
  FUNRUN_NATIVE_ADS[2],
  REFERRAL_AD_TEXT,
  FUNRUN_NATIVE_ADS[3],
  REFERRAL_AD_TEXT,
  FUNRUN_NATIVE_ADS[4],
  FUNRUN_NATIVE_ADS[5],
  FUNRUN_NATIVE_ADS[6],
  FUNRUN_NATIVE_ADS[7],
  FUNRUN_NATIVE_ADS[9],
];

const PROFILE_PRESET_LOGOS = [
  "/logo.png",
  "https://api.dicebear.com/7.x/shapes/svg?seed=funrun",
  "https://api.dicebear.com/7.x/bottts/svg?seed=solana",
  "https://api.dicebear.com/7.x/icons/svg?seed=meme",
  "https://api.dicebear.com/7.x/thumbs/svg?seed=creator",
  "https://api.dicebear.com/7.x/glass/svg?seed=run",
];

function ThemeStyles() {
  return (
    <style>{`
    :root{
  --bg:#070a0f;
  --bg2:rgba(17,23,34,.82);
  --bgSoft:rgba(9,13,21,.88);

  --card:rgba(20,25,36,.78);
  --card2:rgba(17,23,34,.82);
  --card3:rgba(255,255,255,.055);
  --surface:rgba(255,255,255,.045);
  --surface2:rgba(17,23,34,.82);

  --border:rgba(148,163,184,.16);
  --borderSoft:rgba(148,163,184,.11);

  --text:${tokens.text};
  --muted:${tokens.textMuted};
  --muted2:${tokens.textSecondary};

  --primary:${tokens.primary};
  --primary2:${tokens.secondary};
  --secondary:${tokens.secondary};
  --accent:${tokens.accent};
  --accent2:${tokens.accent};
  --accent3:${tokens.danger};
  --info:${tokens.info};

  --danger:${tokens.danger};
  --warn:${tokens.warning};
  --good:${tokens.success};

  --heroGlow:${tokens.glow};
  --btnBg:${tokens.primary};
  --btnText:${tokens.btnText};
  --inputBg:rgba(3,7,18,.38);
  --inputBorder:rgba(148,163,184,.18);
  --topbarBg:rgba(9,13,21,.74);
  --navBg:rgba(9,13,21,.78);

  --shadow1:0 18px 54px rgba(0,0,0,.34);
  --shadow2:0 24px 72px rgba(0,0,0,.44);
  --shine:inset 0 1px 0 rgba(255,255,255,.08);
}

      *{ box-sizing:border-box; }
      html,body,#root{ min-height:100%; }

      body{
        margin:0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
        color:var(--text);
        background:
          radial-gradient(circle at 12% -10%, rgba(252,213,53,.1), transparent 30%),
          radial-gradient(circle at 88% 8%, rgba(59,130,246,.09), transparent 34%),
          linear-gradient(180deg, #070a0f 0%, #080b12 48%, #05070b 100%);
        background-attachment: fixed;
        -webkit-font-smoothing:antialiased;
        text-rendering:optimizeLegibility;
      }

      body::before{
        content:none;
      }

      a{ color:inherit; text-decoration:none; }

     .card{
  position:relative;
  border:1px solid var(--border);
  border-radius:20px;
  background:var(--card);
  box-shadow:var(--shadow1);
  overflow:hidden;
  padding:0;
  backdrop-filter:blur(18px) saturate(150%);
  -webkit-backdrop-filter:blur(18px) saturate(150%);
  transition:border-color .18s ease, box-shadow .18s ease, transform .18s ease, background .18s ease;
}

      .card::before{
        content:"";
        position:absolute;
        inset:0;
        pointer-events:none;
        background:
          linear-gradient(135deg, rgba(255,255,255,.09), transparent 24%),
          radial-gradient(circle at 80% 0%, rgba(252,213,53,.055), transparent 34%);
        opacity:.72;
      }

      .card:hover{
        border-color:rgba(252,213,53,.22);
        box-shadow:var(--shadow2), 0 0 0 1px rgba(255,255,255,.025) inset;
      }

      .cardBody{
        position:relative;
        z-index:1;
        padding:20px;
      }

      /* full-bleed: lets the chart break out of card padding edge-to-edge */
      .bleed{
        margin-left:-18px;
        margin-right:-18px;
        margin-bottom:-18px;
        margin-top:4px;
        width:auto;
      }

      .sectionHeader{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-bottom:12px;
      }

      .sectionTitle{
        font-size:14px;
        font-weight:1000;
        letter-spacing:-.01em;
      }

      .sectionSub{
        font-size:12px;
        color:var(--muted2);
        line-height:1.45;
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
        padding:8px 12px;
        border-radius:999px;
        border:1px solid var(--border);
        background:var(--surface2);
        font-size:12px;
        color:var(--muted);
      }

      .coinList{
        display:flex;
        flex-direction:column;
        gap:0;
      }

      .coinBtn{
  width:100%;
  text-align:left;
  background:transparent;
  border:none;
  border-bottom:1px solid var(--borderSoft);
  border-radius:0;
  padding:14px 2px;
  color:var(--text);
  cursor:pointer;
  transition:background .15s ease;
}

      .coinBtn:last-child{ border-bottom:none; }

      .coinBtn:hover{
        background:rgba(255,255,255,.03);
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
        font-weight:950;
        font-size:14px;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }

      .coinMeta{
        margin-top:4px;
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
        font-weight:1000;
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
        display:none;
      }

      .heroTitle{
        font-size:25px;
        line-height:1.02;
        font-weight:1000;
        letter-spacing:.14px;
        max-width:280px;
      }

      .heroText{
        margin-top:12px;
        color:var(--muted);
        font-size:14px;
        line-height:1.64;
        max-width:360px;
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
  padding:9px 13px;
  border-radius:15px;
  font-size:12px;
  font-weight:900;
  color:var(--muted2);
  background:var(--bg2);
  border:1px solid var(--border);
  transition:all .16s ease;
}

.tabBtn.active{
  background:var(--primary);
  color:var(--btnText);
  border-color:var(--primary);
  box-shadow:0 4px 14px rgba(0,0,0,.28);
}

      .searchBox{
        display:flex;
        gap:10px;
        align-items:center;
        padding:12px 14px;
        border-radius:14px;
        background:var(--surface2);
        border:1px solid var(--border);
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
        background:var(--border);
        margin:14px 0;
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
        min-width:230px;
        border-radius:16px;
        border:1px solid var(--border);
        background:var(--surface2);
        padding:14px;
      }

      .statsGrid{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 14px;
}

      .stat{
  padding: 14px;
  border-radius: 16px;
  background: var(--surface2);
  border: 1px solid var(--border);
  text-align: center;
}

      .statLabel{
        font-size:11px;
        color:var(--muted2);
      }

      .statValue{
        margin-top:8px;
        font-size:17px;
        font-weight:1000;
        letter-spacing:.1px;
      }

/* GLOBAL SCROLLBAR HIDE */
::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}

body {
  scrollbar-width: none;
  overflow-x: hidden;
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
        border-radius:22px;
        border:1px solid var(--border);
        background:var(--modalBg);
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
        border-bottom:1px solid var(--border);
        background:var(--modalHeadBg);
        backdrop-filter:blur(6px)
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
        border-radius:14px;
        border:1px solid var(--border);
        background:var(--surface2);
        color:var(--text);
        cursor:pointer;
        transition:all .16s ease;
      }

      .themeOption.active{
        border-color:var(--primary);
        background:rgba(252,213,53,.1);
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



      .nativeAd{
        position:relative;
        isolation:isolate;
        overflow:hidden;
        min-height:58px;
        border-radius:16px;
        border:1px solid var(--border);
        background:var(--card);
        box-shadow:var(--shadow1);
        padding:10px 12px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:14px;
      }

      .nativeAd::before,
      .nativeAd::after,
      .nativeAdOrb,
      .nativeAdCrystal{
        display:none;
      }

      .nativeAdContent{
        position:relative;
        z-index:2;
        min-width:0;
        display:flex;
        flex-direction:column;
        gap:6px;
      }

      .nativeAdKicker{
        display:flex;
        align-items:center;
        gap:7px;
        color:var(--muted);
        font-size:10px;
        font-weight:1000;
        letter-spacing:.72px;
        text-transform:uppercase;
      }

      .nativeAdText{
        position:relative;
        z-index:2;
        font-size:14px;
        font-weight:1000;
        letter-spacing:.05px;
        line-height:1.22;
        color:var(--text);
      }

      .nativeAdText strong{
        color:var(--primary);
        font-size:1.08em;
        letter-spacing:.2px;
      }

      .nativeAdSub{
        font-size:11px;
        line-height:1.35;
        color:var(--muted2);
      }

      .nativeAdTag{
        position:relative;
        z-index:2;
        flex:0 0 auto;
        font-size:11px;
        font-weight:1000;
        color:var(--btnText);
        padding:10px 12px;
        border-radius:999px;
        background:var(--primary);
        border:1px solid var(--primary);
        box-shadow:0 4px 14px rgba(0,0,0,.24);
        white-space:nowrap;
      }

      .nativeAdDots{
        display:flex;
        gap:4px;
        margin-top:2px;
      }

      .nativeAdDot{
        width:5px;
        height:5px;
        border-radius:999px;
        background:rgba(255,255,255,.18);
      }

      .nativeAdDot.active{
        width:16px;
        background:var(--primary);
      }

      @keyframes funAdShine{
        0%, 48%{ transform:translateX(-58%) rotate(2deg); opacity:0; }
        58%{ opacity:.95; }
        78%{ transform:translateX(58%) rotate(2deg); opacity:.20; }
        100%{ transform:translateX(58%) rotate(2deg); opacity:0; }
      }

    @keyframes pulseRunCoin {
  0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255,165,0,.5); }
  50% { transform: scale(1.08); box-shadow: 0 0 30px rgba(255,165,0,.8); }
}

      .ghostBtn{
        border:none;
        cursor:pointer;
        padding:10px 13px;
        border-radius:16px;
        font-size:12px;
        font-weight:900;
        color:var(--text);
        background:var(--bg2);
        border:1px solid var(--border);
        transition:all .15s ease;
      }

      @media (max-width: 640px){
        .card{
          border-radius:14px;
        }

        .cardBody{
          padding:16px;
        }

        .heroTitle{
          font-size:22px;
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
          min-height:66px;
          padding:11px;
          border-radius:18px;
        }

        .nativeAd{
          min-height:62px;
          border-radius:24px;
          padding:8px 10px;
          gap:10px;
        }

        .nativeAdText{
          font-size:14px;
          line-height:1.22;
        }

        .nativeAdSub{
          font-size:10px;
        }

        .nativeAdKicker{
          font-size:9px;
        }

        .nativeAdTag{
          font-size:10px;
          padding:9px 10px;
        }

        .nativeAdOrb{
          width:72px;
          height:72px;
          right:40px;
          opacity:.58;
        }

        .nativeAdCrystal{
          right:86px;
        }

        .modalCard{
          width:100%;
          border-radius:22px;
        }
      }
    `}</style>
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

function NativeFunRunAd({ compact = false }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((v) => (v + 1) % FUNRUN_AD_SEQUENCE.length);
    }, 15000);
    return () => clearInterval(t);
  }, []);

  const text = FUNRUN_AD_SEQUENCE[idx % FUNRUN_AD_SEQUENCE.length] || REFERRAL_AD_TEXT;
  const isReferral = text === REFERRAL_AD_TEXT;
  const displayText = isReferral ? "Fun.Run — Invite friends and earn " : text;

  return (
    <div className="nativeAd" style={compact ? { minHeight: 56, borderRadius: 18, padding: "7px 10px" } : null}>
      <div className="nativeAdOrb" />
      <div className="nativeAdCrystal" />
      <div className="nativeAdContent">
        <div className="nativeAdKicker">✦ Native Fun.Run Ad</div>
        <div className="nativeAdText">
          {isReferral ? (
            <>{displayText}<strong>50% rewards</strong></>
          ) : (
            text
          )}
        </div>
        <div className="nativeAdSub">
          {isReferral ? "Share your link, grow the community, and earn on referrals." : "Fast launch. Clean trading. Creator-first growth engine."}
        </div>
        <div className="nativeAdDots">
          {[0, 1, 2, 3].map((n) => (
            <span key={n} className={`nativeAdDot ${n === idx % 4 ? "active" : ""}`} />
          ))}
        </div>
      </div>
      <div className="nativeAdTag">{isReferral ? "50% Rewards" : "Fun.Run"}</div>
    </div>
  );
}

function shortWallet(w) {
  const s = String(w || "");
  if (!s) return "—";
  if (s.length <= 10) return s;
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
}

function pctChangeFromChart(chart, lookback = 12) {
  const arr = Array.isArray(chart)
    ? chart.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0)
    : [];

  if (arr.length < 2) return 0;

  const end = arr[arr.length - 1];
  const startIndex = Math.max(0, arr.length - 1 - lookback);
  const start = arr[startIndex] || arr[0] || end;

  if (!start || !Number.isFinite(start) || start <= 0) return 0;

  const pct = ((end - start) / start) * 100;
  const clamped = Math.max(-9999, Math.min(9999, pct));
  return Number.isFinite(clamped) ? clamped : 0;
}

function normalizeCoin(c = {}) {
  const totalSupply = Math.max(1, safeNum(c.totalSupply, 1_000_000_000));
  const curveSupply = Math.max(1, safeNum(c.curveSupply, c.curve_supply || totalSupply));
  const tokenReserve = Math.max(0, safeNum(c.tokenReserve, c.reserve_token || 0));
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
    mintAddress: String(c.mintAddress || c.mint_address || ""),
    creatorWallet: String(c.creatorWallet || c.creator_wallet || c.owner || ""),
    totalSupply,
    curveSupply,
    curveSold: Math.max(0, safeNum(c.curveSold, c.curve_sold || 0)),
    tokenReserve,
    circulating,
    volumeSol: Math.max(0, safeNum(c.volumeSol, c.volume_sol || 0)),
    priceSol: Math.max(0, safeNum(c.priceSol, c.last_price || 0)),
    priceUsd: Math.max(0, safeNum(c.priceUsd, c.price || 0)),
    lastPriceUsd: Math.max(0, safeNum(c.lastPriceUsd, c.last_price_usd || c.priceUsd || c.price || 0)),
    vTokens: Math.max(0, safeNum(c.vTokens, c.v_tokens || 0)),
    vSol: Math.max(0, safeNum(c.vSol, c.v_sol || 0)),
    mc,
    ath: Math.max(mc, safeNum(c.ath, c.ath_market_cap || mc)),
    chart,
    holders:
      c && typeof c.holders === "object" && !Array.isArray(c.holders)
        ? c.holders
        : c.prevHolders && typeof c.prevHolders === "object"
        ? c.prevHolders
        : {},
    createdAt: safeNum(c.createdAt, c.created_at ? new Date(c.created_at).getTime() : Date.now()),
    lastTradeAt: safeNum(c.lastTradeAt, c.last_trade_at || 0),
    creatorRewardsSol: Math.max(0, safeNum(c.creatorRewardsSol, c.creator_rewards || 0)),
  };
}

function getCoinPriceUsd(c) {
  const direct = safeNum(c?.priceUsd, 0);
  if (direct > 0) {
    return direct;
  }

  const mc = safeNum(c?.mc, 0);
  const total = Math.max(1, safeNum(c?.totalSupply, 1_000_000_000));
  if (mc > 0 && total > 0) return mc / total;

  const chart = Array.isArray(c?.chart) ? c.chart : [];
  return Math.max(0, safeNum(chart[chart.length - 1], 0));
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

let _liveSolPrice = 80;

function getApproxSolUsd(coin) {
  const priceUsd = safeNum(coin?.priceUsd, 0);
  const priceSol = safeNum(coin?.priceSol, 0);
  if (priceUsd > 0 && priceSol > 0) return priceUsd / Math.max(priceSol, 1e-12);
  return _liveSolPrice;
}

function getTradePriceUsd(trade, coin, fallback) {
  const direct = safeNum(trade?.priceUsd, 0);
  if (direct > 0) return direct;

  const sol = Math.max(0, safeNum(trade?.sol, 0));
  const tokens = Math.max(0, safeNum(trade?.tokens, 0));
  const solUsd = getApproxSolUsd(coin);

  if (sol > 0 && tokens > 0) {
    const pxSol = sol / Math.max(tokens, 1e-12);
    const pxUsd = pxSol * solUsd;

    if (Number.isFinite(pxUsd) && pxUsd > 0) {
      const ref = Math.max(
        0.00000001,
        safeNum(fallback, 0) || safeNum(coin?.priceUsd, 0) || safeNum(coin?.lastPriceUsd, 0) || 0.000001
      );

      const minAllowed = ref * 0.2;
      const maxAllowed = ref * 5;

      if (pxUsd >= minAllowed && pxUsd <= maxAllowed) {
        return pxUsd;
      }
    }
  }

  return Math.max(
    0.00000001,
    safeNum(fallback, 0.000001)
  );
}

function getReferralLink(addr) {
  if (!addr) return "";

  let base = "";

  try {
    base =
      (env.appUrl || window.location.origin || "")
        .replace(/\/$/, "");
  } catch {
    base = window.location.origin || "";
  }

  return `${base}/?ref=${encodeURIComponent(addr)}`;
}

function InlineAffiliateBar({ wallet, onCopy }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14,
      }}
    >
      <MiniBtn onClick={onCopy} style={{ paddingInline: 14 }}>
        Copy Link
      </MiniBtn>

      <div
        style={{
          minWidth: 0,
          flex: 1,
          padding: "10px 14px",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,.08)",
          background: "linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.025))",
          fontSize: 12,
          fontWeight: 900,
          color: "var(--text)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {wallet ? getReferralLink(wallet) : "Affiliate link unavailable"}
      </div>
    </div>
  );
}

export default function App() {
  const { login, authenticated, user, ready, logout, getAccessToken } = usePrivy();
  const { wallets } = useWallets();

  const { exportWallet } = useExportWallet();
  const wsRef = useRef(null);

  const [recentTrades, setRecentTrades] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);

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

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(max-width: 1023px)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const { toast, showToast, clearToast } = useToast();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAddr, setWithdrawAddr] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");
  // Idempotency key: retry pe same key, nayi withdrawal pe naya key.
  // useRef kyunki ye UI render trigger nahi karta — sirf request ka internal detail hai.
  const withdrawKeyRef = useRef(null);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(LS_THEME) || "calm";
    } catch {
      return "calm";
    }
  });

  const [profileAvatar, setProfileAvatar] = useState(() => {
    try {
      return localStorage.getItem(LS_PROFILE_AVATAR) || PROFILE_PRESET_LOGOS[0];
    } catch {
      return PROFILE_PRESET_LOGOS[0];
    }
  });

  const [viewMode, setViewMode] = useState(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("app") === "1") return "app";
      if ((url.searchParams.get("ref") || "").trim()) return "app";
      if (sessionStorage.getItem("enteredApp") === "1") return "app";
    } catch {}
    return "landing";
  });

  const [screen, setScreen] = useState("HOME");
  const [screenHistory, setScreenHistory] = useState(["HOME"]);
  const [selectedCoinId, setSelectedCoinId] = useState(null);
  const [creatorProfileId, setCreatorProfileId] = useState("");
  const [favoriteCoinIds, setFavoriteCoinIds] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem("favorite_coins_v1") || "[]");
  } catch {
    return [];
  }
});

function toggleFavoriteCoin(coinId) {
  if (!coinId) return;

  setFavoriteCoinIds((prev) => {
    const next = prev.includes(coinId)
      ? prev.filter((id) => id !== coinId)
      : [...prev, coinId];

    localStorage.setItem(
      "favorite_coins_v1",
      JSON.stringify(next)
    );

    return next;
  });
}

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
const [solPriceUsd, setSolPriceUsd] = useState(80);
const [unlockNow, setUnlockNow] = useState(Date.now());

useEffect(() => {
  const timer = setInterval(() => {
    setUnlockNow(Date.now());
  }, 1000);

  return () => clearInterval(timer);
}, []);

useEffect(() => {
  let cancelled = false;
  async function loadSolPrice() {
    try {
      const json = USE_PLATFORM ? await platformApi.fetchSolPrice() : await api("/sol-price");
      if (!cancelled && json?.price > 0) {
        _liveSolPrice = json.price;
        setSolPriceUsd(json.price);
      }
    } catch {}
  }
  loadSolPrice();
  const id = setInterval(loadSolPrice, 45_000);
  return () => { cancelled = true; clearInterval(id); };
}, []);

const unlockDate = new Date("2027-01-01T00:00:00Z").getTime();
const unlockDiff = Math.max(0, unlockDate - unlockNow);

const unlockDays = Math.floor(unlockDiff / (1000 * 60 * 60 * 24));
const unlockHours = Math.floor((unlockDiff / (1000 * 60 * 60)) % 24);
const unlockMinutes = Math.floor((unlockDiff / (1000 * 60)) % 60);
const unlockSeconds = Math.floor((unlockDiff / 1000) % 60);

const [settingsOpen, setSettingsOpen] = useState(false);
const [phantomWallet, setPhantomWallet] = useState("");
const [connectingPhantom, setConnectingPhantom] = useState(false);

  const [tokenName, setTokenName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [story, setStory] = useState("");
  const [initialSol, setInitialSol] = useState("0.01");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [creating, setCreating] = useState(false);

  const [tradeMode, setTradeMode] = useState("BUY");
  const [chartRange, setChartRange] = useState("1D");
  const [chartReloadKey, setChartReloadKey] = useState(0);
  const [tradeAmount, setTradeAmount] = useState("");
  const [trading, setTrading] = useState(false);
  const [dexModalOpen, setDexModalOpen] = useState(false);
  const [showFullStory, setShowFullStory] = useState(false);

  const coinsLoadMoreRef = useRef(null);
  const didBootRef = useRef(false);

  function clearCoinsCache() {
    try {
      Object.keys(localStorage || {}).forEach((key) => {
        if (key === "coins_cache_v1" || key.startsWith("coins_page_")) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
  }

  const solAddr = useMemo(() => {
    const isSolAddr = (a) => {
      const s = String(a || "");
      return s.length > 30 && !s.startsWith("0x");
    };

    // PRIMARY: linkedAccounts — embedded Privy Solana wallet always here after auth
    const solLinked = user?.linkedAccounts?.find(
      (a) => a?.type === "wallet" && a?.chain === "solana" && isSolAddr(a?.addr || a?.address)
    );
    if (solLinked) return String(solLinked.addr || solLinked.address).trim();

    // FALLBACK: useWallets() — external wallets (Phantom, etc.)
    const solWallet = wallets?.find(w => isSolAddr(w?.addr || w?.address || ""));
    if (solWallet) return String(solWallet.addr || solWallet.address).trim();

    // FALLBACK: phantomWallet directly connected
    if (phantomWallet && isSolAddr(phantomWallet)) return String(phantomWallet).trim();

    return "";
  }, [user, phantomWallet, wallets]);

  const isWalletConnected = useMemo(() => Boolean(solAddr), [solAddr]);
  const isAdmin = useMemo(
    () => Boolean(solAddr && String(solAddr).trim() === APP_OWNER_WALLET),
    [solAddr]
  );

  useEffect(() => {
    if (!USE_PLATFORM) {
      let ws;
      let reconnectTimer;

      function connect() {
        const wsBase = API_BASE
          ? API_BASE.replace("https://", "wss://").replace("http://", "ws://")
          : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;
        ws = new WebSocket(wsBase);
        wsRef.current = ws;

        ws.onopen = () => setWsConnected(true);

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.event === "coin:update") {
              const updated = normalizeCoin(msg.payload);
              setCoins((prev) =>
                prev.map((c) => {
                  if (c.id !== updated.id) return c;
                  return {
                    ...c,
                    ...updated,
                    holders:
                      updated.holders && Object.keys(updated.holders).length
                        ? { ...c.holders, ...updated.holders }
                        : c.holders || {},
                  };
                })
              );
            }
            if (msg.event === "trade:new") {
              setRecentTrades((prev) => [msg.payload, ...prev.slice(0, 24)]);
            }
            if (msg.event === "coin:created") {
              loadCoins(0, false);
            }
            if (msg.event === "portfolio:update" && solAddr) {
              const targetWallet = String(msg.payload?.wallet || "").trim();
              if (targetWallet && targetWallet !== solAddr) return;
              loadProfile(solAddr);
            }
            if (msg.event === "creator:update" && solAddr) {
              const targetWallet = String(msg.payload?.wallet || "").trim();
              if (targetWallet && targetWallet !== solAddr) return;
              loadProfile(solAddr);
              loadCoins(0, false);
            }
            if (msg.event === "referral:update" && solAddr) {
              const targetWallet = String(msg.payload?.wallet || "").trim();
              if (targetWallet && targetWallet !== solAddr) return;
              loadProfile(solAddr);
            }
            if (msg.event === "notification:new") {
              const targetWallet = String(msg.payload?.wallet || "").trim();
              if (targetWallet && targetWallet !== solAddr) return;
              const label = String(msg.payload?.title || msg.payload?.type || "Update");
              showToast(label);
            }
          } catch (err) {
            console.error(err);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimer = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          setWsConnected(false);
          ws.close();
        };
      }

      connect();
      return () => {
        clearTimeout(reconnectTimer);
        if (ws) ws.close();
      };
    }
    return undefined;
  }, [solAddr, showToast]);

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

  function getPhantomProvider() {
    try {
      if (typeof window === "undefined") return null;

      const phantomProvider = window?.phantom?.solana;
      if (phantomProvider?.isPhantom) return phantomProvider;

      const injectedProvider = window?.solana;
      if (injectedProvider?.isPhantom) return injectedProvider;

      if (Array.isArray(injectedProvider?.providers)) {
        return injectedProvider.providers.find((p) => p?.isPhantom) || null;
      }

      return null;
    } catch {
      return null;
    }
  }

  const connectPhantom = async () => {
    try {
      setConnectingPhantom(true);
      const provider = getPhantomProvider();
      if (!provider) {
        alert("Phantom wallet not found. Install Phantom extension/app first.");
        window.open("https://phantom.app/", "_blank");
        return;
      }

      const resp = await provider.connect();
      const address = String(resp?.publicKey?.toString?.() || provider?.publicKey?.toString?.() || "").trim();
      if (!address) throw new Error("Phantom address not found");

      setPhantomWallet(address);
      showToast(`Phantom connected: ${shortWallet(address)}`);
    } catch (err) {
      console.error("Phantom connect error:", err);
      showToast(err?.message || "Phantom connect failed");
    } finally {
      setConnectingPhantom(false);
    }
  };

  async function disconnectPhantom() {
    try {
      const provider = getPhantomProvider();
      if (provider?.isConnected) await provider?.disconnect?.();
    } catch {}
    setPhantomWallet("");
    showToast("Phantom disconnected");
  }

  // useEffect(() => {
//   const provider = getPhantomProvider();
//   if (!provider) return;

//   provider
//     .connect({ onlyIfTrusted: true })
//     .then((resp) => {
//       const addr = String(
//         resp?.publicKey?.toString?.() ||
//         provider?.publicKey?.toString?.() ||
//         ""
//       ).trim();

//       if (addr) setPhantomWallet(addr);
//     })
//     .catch(() => {});
// }, []);

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

      const cacheKey = `coins_page_${page}`;
      const cacheTTL = 2500;
      let json = null;

      if (!append) {
        try {
          const cachedRaw = localStorage.getItem(cacheKey);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            if (cached && Date.now() - Number(cached.ts || 0) < cacheTTL) {
              json = cached.data || null;
            }
          }
        } catch {}
      }

      if (!json) {
        try {
          json = USE_PLATFORM
            ? await platformApi.fetchCoinList(page, 50)
            : await api(`/coin/list?page=${page}&limit=50`);
        } catch {
          const base = String(API_BASE || "").replace(/\/$/, "");
          const res = await fetch(`${base}/coin/list?page=${page}&limit=50`, { cache: "no-store" });
          json = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(json?.error || `Request failed (${res.status})`);
          }
        }

        if (!append) {
          try {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({ ts: Date.now(), data: json })
            );
          } catch {}
        }
      }

      const rawCoins =
        Array.isArray(json?.coins) ? json.coins :
        Array.isArray(json?.items) ? json.items :
        Array.isArray(json?.data) ? json.data :
        Array.isArray(json) ? json :
        [];

      const rawHot =
        Array.isArray(json?.hot15m) ? json.hot15m :
        Array.isArray(json?.hot) ? json.hot :
        [];

      const incoming = (rawCoins || [])
        .map((c) => {
          try {
            const coin = normalizeCoin(c);
            if (!coin?.id) return null;
            return coin;
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const incomingHot = (rawHot || [])
        .map((c) => {
          try {
            return normalizeCoin(c);
          } catch {
            return null;
          }
        })
        .filter((c) => c && c.id);

      setHot15m(incomingHot);

      setCoins((prev) => {
        // Build a lookup of existing holders so loadCoins doesn't wipe them
        const prevHolders = {};
        (prev || []).forEach((c) => {
          if (c?.id && c.holders && Object.keys(c.holders).length) {
            prevHolders[String(c.id)] = c.holders;
          }
        });

        const base = append ? [...(prev || []), ...incoming] : incoming;
        const map = new Map();

        base.forEach((c) => {
          if (!c?.id) return;
          const merged = prevHolders[String(c.id)]
            ? { ...c, holders: { ...prevHolders[String(c.id)], ...(c.holders || {}) } }
            : c;
          map.set(String(c.id), merged);
        });

        return Array.from(map.values()).sort(
          (a, b) => safeNum(b.createdAt, 0) - safeNum(a.createdAt, 0)
        );
      });

      setCoinsPage(page);
      setCoinsHasMore(Boolean(json?.hasMore ?? (incoming.length >= 50)));

      if (page === 0) {
        try {
          localStorage.setItem("coins_cache_v1", JSON.stringify(incoming));
        } catch {}
      }
    } catch (e) {
      showToast(e?.message || "Failed to load coins");
    } finally {
      setLoadingCoins(false);
    }
  }

  async function loadProfile(wallet = solAddr) {
    if (!wallet) return;

    try {
      setLoadingProfile(true);
      const json = USE_PLATFORM
        ? await platformApi.fetchProfile(wallet)
        : await api(`/profile/${wallet}`);
      setProfile(json?.profile || null);

      // Inject user's token balances into coin holders map so sell validation works
      const profileHoldingsList = Array.isArray(json?.profile?.holdings) ? json.profile.holdings : [];
      if (profileHoldingsList.length > 0 && wallet) {
        setCoins((prev) =>
          (prev || []).map((c) => {
            const h = profileHoldingsList.find((hh) => String(hh.coinId) === String(c.id));
            if (!h) return c;
            return { ...c, holders: { ...(c.holders || {}), [wallet]: h.amount } };
          })
        );
      }

      if (json?.profile?.wallet_address) {
        loadBalance(json.profile.wallet_address);
      }

    } catch (e) {
      showToast(e?.message || "Failed to load profile");
    } finally {
      setLoadingProfile(false);
    }
  }

  async function loadBalance(wallet = solAddr) {
    if (!wallet) return;
    try {
      const json = USE_PLATFORM
        ? await platformApi.fetchBalance(wallet)
        : await api(`/balance/${wallet}`);
      setWalletSolBalance(Math.max(0, safeNum(json?.sol, 0)));
    } catch {
      setWalletSolBalance(0);
    }
  }

  const handleWsLegacyEvent = useMemo(
    () => (msg) => {
      if (msg.event === "coin:update") {
        const updated = normalizeCoin(msg.payload || {});
        if (!updated?.id && !updated?.mintAddress) return;
        setCoins((prev) =>
          prev.map((c) => {
            const match =
              (updated.id && String(c.id) === String(updated.id)) ||
              (updated.mintAddress && String(c.mintAddress) === String(updated.mintAddress));
            if (!match) return c;
            return {
              ...c,
              ...updated,
              holders:
                updated.holders && Object.keys(updated.holders).length
                  ? { ...c.holders, ...updated.holders }
                  : c.holders || {},
            };
          })
        );
      }
      if (msg.event === "trade:new") {
        setRecentTrades((prev) => [msg.payload, ...prev.slice(0, 24)]);
      }
      if (msg.event === "coin:created") {
        loadCoins(0, false);
      }
      if (msg.event === "portfolio:update" && solAddr) {
        const targetWallet = String(msg.payload?.wallet || "").trim();
        if (targetWallet && targetWallet !== solAddr) return;
        loadProfile(solAddr);
      }
      if (msg.event === "creator:update" && solAddr) {
        const targetWallet = String(msg.payload?.wallet || "").trim();
        if (targetWallet && targetWallet !== solAddr) return;
        loadProfile(solAddr);
        loadCoins(0, false);
      }
      if (msg.event === "referral:update" && solAddr) {
        const targetWallet = String(msg.payload?.wallet || "").trim();
        if (targetWallet && targetWallet !== solAddr) return;
        loadProfile(solAddr);
      }
      if (msg.event === "notification:new") {
        const targetWallet = String(msg.payload?.wallet || "").trim();
        if (targetWallet && targetWallet !== solAddr) return;
        const label = String(msg.payload?.title || msg.payload?.type || "Update");
        showToast(label);
      }
    },
    [solAddr, showToast]
  );

  const { connected: platformWsConnected } = usePlatformWs({
    enabled: USE_PLATFORM,
    getToken: getAccessToken,
    wallet: solAddr || null,
    activeMint: selectedCoin?.mintAddress || null,
    onLegacyEvent: handleWsLegacyEvent,
  });

  useEffect(() => {
    if (USE_PLATFORM) setWsConnected(platformWsConnected);
  }, [USE_PLATFORM, platformWsConnected]);

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
    if (!isWalletConnected || !solAddr) {
      setProfile(null);
      setWalletSolBalance(0);
      return;
    }
    loadProfile(solAddr);
    // loadBalance(solAddr); // loadProfile ab custodial wallet se balance laata hai
  }, [isWalletConnected, solAddr]);

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
    // Shared base values for dark / light surfaces so each theme only
    // needs to declare its identity colors (bg + accents).
    const dark = (o) => ({
      mode: "dark",
      bg2: tokens.bgSecondary,
      card: tokens.card,
      border: tokens.border,
      surface: o.card ?? tokens.card,
      surface2: o.bg2 ?? tokens.bgSecondary,
      borderSoft: "#23282f",
      text: tokens.text,
      muted: tokens.textMuted,
      muted2: tokens.textSecondary,
      inputBg: "rgba(255,255,255,.04)",
      inputBorder: tokens.border,
      navBg: "rgba(11,14,17,.96)",
      topbarBg: o.card ?? tokens.card,
      modalBg: o.card ?? tokens.card,
      modalHeadBg: o.bg2 ?? tokens.bgSecondary,
      btnText: tokens.btnText,
      good: tokens.success,
      warn: tokens.warning,
      ...o,
    });

    const light = (o) => ({
      mode: "light",
      bg2: "rgba(15,23,42,.07)",
      card: "rgba(255,255,255,.97)",
      surface: "rgba(255,255,255,.97)",
      surface2: "rgba(15,23,42,.07)",
      border: "rgba(15,23,42,.14)",
      borderSoft: "rgba(15,23,42,.09)",
      text: "#0B1524",
      muted: "rgba(20,30,48,.72)",
      muted2: "rgba(30,41,59,.54)",
      inputBg: "rgba(15,23,42,.055)",
      inputBorder: "rgba(15,23,42,.15)",
      navBg: "rgba(255,255,255,.96)",
      topbarBg: "rgba(255,255,255,.98)",
      modalBg: "#FFFFFF",
      modalHeadBg: "rgba(250,252,255,.98)",
      btnText: "#04130E",
      good: "#0E9F6E",
      warn: "#B45309",
      ...o,
    });

    const themes = {
      calm: dark({
        bg: tokens.bg,
        bg2: tokens.bgSecondary,
        card: tokens.card,
        border: tokens.border,
        primary: tokens.primary,
        secondary: tokens.secondary,
        accent: tokens.accent,
        danger: tokens.danger,
        glow: tokens.glow,
      }),
      ocean: dark({
        bg: "#0B1014",
        bg2: "#111820",
        card: "#172028",
        border: "#243040",
        primary: "#3B82F6",
        secondary: "#2563EB",
        accent: "#3B82F6",
        danger: tokens.danger,
        glow: "rgba(59,130,246,.12)",
        btnText: "#FFFFFF",
        navBg: "rgba(11,16,20,.96)",
      }),
      royal: dark({
        bg: "#0E0D12",
        bg2: "#15131A",
        card: "#1C1A24",
        border: "#2E2A38",
        primary: "#A78BFA",
        secondary: tokens.warning,
        accent: "#A78BFA",
        danger: tokens.danger,
        glow: "rgba(167,139,250,.12)",
        btnText: "#FFFFFF",
      }),
      neon: dark({
        bg: "#0A0E0C",
        bg2: "#101612",
        card: "#141C18",
        border: "#243028",
        primary: "#14F195",
        secondary: "#059669",
        accent: "#14F195",
        danger: tokens.danger,
        glow: "rgba(20,241,149,.1)",
        btnText: "#0B0E11",
      }),
      rose: dark({
        bg: "#100A0C",
        bg2: "#181014",
        card: "#201418",
        border: "#34242A",
        primary: "#F6465D",
        secondary: "#DC2626",
        accent: "#F6465D",
        danger: tokens.danger,
        glow: "rgba(246,70,93,.12)",
        btnText: "#FFFFFF",
      }),
      light: light({ bg: "#E8EAED", primary: tokens.primary, secondary: tokens.secondary, accent: tokens.accent, danger: tokens.danger, glow: tokens.glow, btnText: tokens.btnText }),
      paper: light({ bg: "#E2DAC8", primary: "#C2410C", secondary: "#0D9488", accent: "#B45309", danger: "#DC2626", glow: "rgba(194,65,12,.14)" }),
    };

    const t = themes[theme] || themes.calm;
    const root = document.documentElement;
    const set = (k, v) => root.style.setProperty(k, v);

    root.setAttribute("data-mode", t.mode);

    set("--bg", t.bg);
    set("--bg2", t.bg2 ?? tokens.bgSecondary);
    set("--card", t.card ?? t.surface);
    set("--surface", t.surface);
    set("--surface2", t.surface2);
    if (t.mode === "light") {
      set("--card2", "rgba(15,23,42,.06)");
      set("--card3", "rgba(15,23,42,.04)");
      set("--bgSoft", "rgba(255,255,255,.82)");
      set("--heroGlow", t.glow);
    } else {
      set("--card2", tokens.bgSecondary);
      set("--card3", "rgba(255,255,255,.03)");
      set("--bgSoft", "rgba(20,21,26,.92)");
      set("--heroGlow", t.glow);
    }
    set("--border", t.border);
    set("--borderSoft", t.borderSoft);

    set("--text", t.text);
    set("--muted", t.muted);
    set("--muted2", t.muted2);

    set("--primary", t.primary);
    set("--primary2", t.secondary);
    set("--secondary", t.secondary);
    set("--accent", t.accent);
    set("--accent2", t.accent);
    set("--accent3", t.danger);
    set("--danger", t.danger);
    set("--good", t.good);
    set("--warn", t.warn);
    set("--glow", t.glow);
    set("--btnText", t.btnText);

    set("--inputBg", t.inputBg);
    set("--inputBorder", t.inputBorder);
    set("--navBg", t.navBg);
    set("--topbarBg", t.topbarBg);
    set("--modalBg", t.modalBg);
    set("--modalHeadBg", t.modalHeadBg);

    set("--btn-primary", t.primary);
    set("--btn-secondary", t.secondary);
    set("--shadow", t.glow);

    document.body.style.background = t.bg;

    document.body.style.color = t.text;

    try {
      localStorage.setItem(LS_THEME, theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_PROFILE_AVATAR, profileAvatar);
    } catch {}
  }, [profileAvatar]);

  async function handleLogoPick(file) {
    if (!file) return;

    if (file.size > MAX_LOGO_BYTES) {
      showToast("Logo too large");
      return;
    }

    try {
      const data = await fileToDataUrl(file);
      setLogoFile(file);
      setLogoPreview(data);
    } catch {
      showToast("Logo read failed");
    }
  }

  function enterApp(targetScreen = "HOME") {
    try {
      sessionStorage.setItem("enteredApp", "1");
      const url = new URL(window.location.href);
      url.searchParams.set("app", "1");
      window.history.replaceState({}, "", url.toString());
    } catch {}
    setViewMode("app");
    if (targetScreen) goScreen(targetScreen);
  }

  function openCoinFromLanding(coin) {
    if (!coin?.id) return;
    setSelectedCoinId(coin.id);
    enterApp("COIN");
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

  function openCoin(coin) {
    if (!coin?.id) return;
    setSelectedCoinId(coin.id);
    goScreen("COIN");
  }

  function openCreatorFromCoin(coin) {
    const wallet = String(coin?.creatorWallet || "").trim();
    if (!wallet) return;
    setCreatorProfileId(wallet);
    goScreen("CREATOR");
  }

  function renderBackButton() {
    return <BackButton onClick={goBack} />;
  }

  async function handleCreateCoin() {
    if (!authenticated) { login(); return; }
    if (!solAddr) { showToast("Wallet initializing, please wait..."); return; }


    const n = tokenName.trim();
    const s = symbol.trim().toUpperCase();
    const st = story.trim();
    const init = Math.max(0, safeNum(initialSol, 0));

    if (!n || !s) {
      showToast("Name and symbol required");
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

      const json = USE_PLATFORM
        ? platformApi.normalizeCreateResponse(
            await platformApi.createCoin(payload, await getAccessToken())
          )
        : await api("/coin/create", {
            method: "POST",
            body: JSON.stringify(payload),
            timeout: 120000,
          });

      if (json?.onchain) {
        setTokenName("");
        setSymbol("");
        setStory("");
        setInitialSol("0.01");
        setLogoFile(null);
        setLogoPreview("");
        showToast(
          `Coin submitted (${String(json.signature || json.mintAddress || "").slice(0, 8)}…)`
        );
        clearCoinsCache();
        setChartReloadKey((x) => x + 1);
        await Promise.allSettled([loadProfile(solAddr), loadBalance(solAddr), loadCoins(0, false)]);
        return;
      }

      const created = normalizeCoin(json?.coin || {});
      if (!created?.id) throw new Error(json?.error || "Create failed");

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

      showToast("Coin created");
      loadCoins(0, false);
      loadProfile(solAddr);
      loadBalance(solAddr);
    } catch (e) {
      showToast(e?.message || "Create failed");
    } finally {
      setCreating(false);
    }
  }

  function patchProfileHoldingLocal(prev, coin, amount) {
    if (!prev || !coin?.id) return prev;
    const amt = Math.max(0, safeNum(amount, 0));
    const list = Array.isArray(prev.holdings) ? [...prev.holdings] : [];
    const idx = list.findIndex((h) => String(h.coinId || h.id || "") === String(coin.id));

    if (amt <= 0) {
      if (idx >= 0) list.splice(idx, 1);
      return { ...prev, holdings: list };
    }

    const row = {
      ...(idx >= 0 ? list[idx] : {}),
      coinId: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      logo: coin.logo,
      amount: amt,
      tokens: amt,
      totalSupply: Math.max(1, safeNum(coin.totalSupply, 1_000_000_000)),
      pct: (amt / Math.max(1, safeNum(coin.totalSupply, 1_000_000_000))) * 100,
      lastAt: Date.now(),
    };

    if (idx >= 0) list[idx] = row;
    else list.unshift(row);

    return { ...prev, holdings: list.sort((a, b) => safeNum(b.lastAt, 0) - safeNum(a.lastAt, 0)) };
  }

  async function handleTrade() {
    if (!authenticated) { login(); return; }
    if (!solAddr) { showToast("Wallet initializing, please wait..."); return; }


    if (!selectedCoin?.id) {
      showToast("Select a coin first");
      return;
    }

    const amount = Math.max(0, safeNum(tradeAmount, 0));
    if (amount <= 0) {
      showToast("Enter amount");
      return;
    }

    const tradePreview = computeTradePreview(selectedCoin, tradeMode, tradeAmount);
    const current = { ...selectedCoin };
    const currentHolder = Math.max(0, safeNum(current?.holders?.[solAddr], 0));

    if (tradeMode === "SELL" && amount > currentHolder) {
      showToast("Not enough tokens");
      return;
    }

    const previewTokens = Math.max(0, safeNum(tradePreview?.estTokens, 0));

    try {
      setTrading(true);

      // Capture pre-trade baseline BEFORE debitRunBalance runs on the server.
      // If profile state is null/stale, fetch live now so balance comparison works.
      let preTradeRunBalance = safeNum(profile?.runBalance, 0);
      const preTradeHolder = currentHolder;
      if (preTradeRunBalance === 0 && solAddr) {
        try {
          const snap = USE_PLATFORM
            ? await platformApi.fetchProfile(solAddr)
            : await api(`/profile/${solAddr}`);
          preTradeRunBalance = safeNum(snap?.profile?.runBalance, 0);
        } catch { /* keep 0 */ }
      }

      let json;
      if (USE_PLATFORM) {
        const token = await getAccessToken();
        const idempotencyKey = platformApi.newIdempotencyKey(tradeMode === "BUY" ? "buy" : "sell");
        json =
          tradeMode === "BUY"
            ? await platformApi.buyCoin({
                coinId: current.id,
                solAmount: amount,
                authToken: token,
                idempotencyKey,
              })
            : await platformApi.sellCoin({
                coinId: current.id,
                tokenAmount: amount,
                authToken: token,
                idempotencyKey,
              });
        json = platformApi.normalizeTradeResponse(json, tradeMode);
      } else {
        const path = tradeMode === "BUY" ? "/coin/buy" : "/coin/sell";
        const payload = {
          wallet: solAddr,
          coinId: current.id,
          ...(tradeMode === "BUY" ? { sol: amount } : { tokens: amount }),
        };
        json = await api(path, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (json?.onchain) {
        setTradeAmount("");
        clearCoinsCache();
        const sigShort = String(json.signature || "").slice(0, 8);
        const isBuy = tradeMode === "BUY";
        showToast(`${isBuy ? "Buy" : "Sell"} submitted (${sigShort}…)`);

        // Baselines captured before the buy API call (pre-debit).
        const baseHolding = preTradeHolder;
        const baseRunBalance = preTradeRunBalance;
        const pollCoinId = current.id;
        const pollAddr = solAddr;

        // All background work — nothing blocks the trade button from here
        (async () => {
          // Fire initial refresh immediately (non-blocking to the button)
          void Promise.allSettled([loadProfile(pollAddr), loadBalance(pollAddr), loadCoins(0, false)]);

          const POLL_MS = 3000;
          const MAX_POLLS = 15; // 45 s total
          for (let i = 0; i < MAX_POLLS; i++) {
            await new Promise((r) => setTimeout(r, POLL_MS));
            try {
              const snap = USE_PLATFORM
                ? await platformApi.fetchProfile(pollAddr)
                : await api(`/profile/${pollAddr}`);
              const snapHoldings = Array.isArray(snap?.profile?.holdings) ? snap.profile.holdings : [];
              const snapCoin = snapHoldings.find((h) => String(h.coinId) === String(pollCoinId));
              const snapHolding = Math.max(0, safeNum(snapCoin?.amount, 0));
              const snapBalance = safeNum(snap?.profile?.runBalance, 0);

              const holdingsChanged = isBuy
                ? snapHolding > baseHolding
                : snapHolding < baseHolding;
              const balanceChanged = isBuy
                ? snapBalance < baseRunBalance
                : snapBalance > baseRunBalance;
              const done = holdingsChanged || balanceChanged;

              if (done) {
                setProfile(snap.profile);
                // Only update coin holders display if holdings actually updated in DB
                if (holdingsChanged && Array.isArray(snap.profile?.holdings) && pollAddr) {
                  setCoins((prev) =>
                    (prev || []).map((c) => {
                      const h = snap.profile.holdings.find((hh) => String(hh.coinId) === String(c.id));
                      if (!h) return c;
                      return { ...c, holders: { ...(c.holders || {}), [pollAddr]: h.amount } };
                    })
                  );
                }
                try {
                  const coinSnap = USE_PLATFORM
                    ? await platformApi.fetchCoin(pollCoinId)
                    : await api(`/coin/${pollCoinId}`);
                  const latestCoin = normalizeCoin(coinSnap?.coin || {});
                  if (latestCoin?.id) {
                    setCoins((prev) =>
                      (prev || []).map((c) =>
                        String(c.id) === String(latestCoin.id)
                          ? { ...c, ...latestCoin, holders: { ...(c.holders || {}), ...(latestCoin.holders || {}) } }
                          : c
                      )
                    );
                  }
                } catch {}
                setChartReloadKey((k) => k + 1);
                showToast(isBuy ? "Buy successful" : "Sell successful");
                return;
              }
            } catch {}
          }
          // Timeout — tx confirmed on-chain but indexer slow
          showToast("Confirmed on-chain — refreshing…", "default", 4000);
          void Promise.allSettled([loadProfile(pollAddr), loadCoins(0, false)]);
          setChartReloadKey((k) => k + 1);
        })();

        return;
      }

      if (json?.ok === false) {
        throw new Error(json?.error || "Trade failed");
      }

      const updated = normalizeCoin(json?.coin || {});
      const tradedTokens = Math.max(0, safeNum(json?.tokens, tradeMode === "BUY" ? previewTokens : amount));
      const fallbackHolder = Math.max(
        0,
        currentHolder + (tradeMode === "BUY" ? tradedTokens : -tradedTokens)
      );
      const resolvedHolder = Math.max(
        0,
        safeNum(updated?.holders?.[solAddr], fallbackHolder)
      );

      if (updated?.id) {
        const resolvedCoin = {
          ...updated,
          holders: {
            ...(updated.holders || {}),
            [solAddr]: resolvedHolder,
          },
        };

        setCoins((prev) => {
          const rows = Array.isArray(prev) ? prev : [];
          const exists = rows.some((c) => String(c.id) === String(resolvedCoin.id));
          return exists
            ? rows.map((c) => (String(c.id) === String(resolvedCoin.id) ? resolvedCoin : c))
            : [resolvedCoin, ...rows];
        });
        setProfile((prev) => patchProfileHoldingLocal(prev, resolvedCoin, resolvedHolder));
        setSelectedCoinId(resolvedCoin.id);
      }

      setTradeAmount("");
      showToast(tradeMode === "BUY" ? "Buy successful" : "Sell successful");
      clearCoinsCache();

      try {
        const latestJson = USE_PLATFORM
          ? await platformApi.fetchCoin(current.id)
          : await api(`/coin/${current.id}`);
        const latestCoin = normalizeCoin(latestJson?.coin || updated || {});
        if (latestCoin?.id) {
          const latestHolder = Math.max(0, safeNum(latestCoin?.holders?.[solAddr], resolvedHolder));
          const latestResolved = {
            ...latestCoin,
            holders: { ...(latestCoin.holders || {}), [solAddr]: latestHolder },
          };
          setCoins((prev) => {
            const rows = Array.isArray(prev) ? prev : [];
            const exists = rows.some((c) => String(c.id) === String(latestResolved.id));
            return exists
              ? rows.map((c) => (String(c.id) === String(latestResolved.id) ? latestResolved : c))
              : [latestResolved, ...rows];
          });
          setProfile((prev) => patchProfileHoldingLocal(prev, latestResolved, latestHolder));
          setSelectedCoinId(latestResolved.id);
        }
      } catch {}

      setChartReloadKey((x) => x + 1);
      await Promise.allSettled([loadProfile(solAddr), loadBalance(solAddr), loadCoins(0, false)]);
    } catch (e) {
      setCoins((prev) =>
        (prev || []).map((c) =>
          String(c.id) === String(current.id)
            ? { ...c, holders: { ...(c.holders || {}), [solAddr]: currentHolder } }
            : c
        )
      );
      setProfile((prev) => patchProfileHoldingLocal(prev, current, currentHolder));
      showToast(e?.message || "Trade failed");
    } finally {
      setTrading(false);
    }
  }

  async function handleSetReferrer() {
    if (!isWalletConnected || !solAddr) return;

    try {
      const saved = (localStorage.getItem("ref") || "").trim();
      if (!saved || saved === solAddr) return;

      if (USE_PLATFORM) {
        const token = await getAccessToken();
        await platformApi.bindReferrer({ wallet: solAddr, referrer: saved, authToken: token });
      } else {
        await api("/referral/set", {
          method: "POST",
          body: JSON.stringify({
            wallet: solAddr,
            referrer: saved,
          }),
        });
      }
    } catch {}
  }

  useEffect(() => {
    if (!isWalletConnected || !solAddr) return;
    handleSetReferrer();
  }, [isWalletConnected, solAddr]);

  async function handleClaim(kind) {
    if (!authenticated) { login(); return; }
    if (!solAddr) { showToast("Wallet initializing, please wait..."); return; }


    try {
      const json = USE_PLATFORM
        ? await platformApi.claimRewards({
            wallet: solAddr,
            kind,
            authToken: await getAccessToken(),
          })
        : await api("/claim", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${await getAccessToken()}`,
            },
            body: JSON.stringify({
              wallet: solAddr,
              kind,
            }),
          });

      if (json?.ok) {
        const claimedAmount = safeNum(json.amountSol ?? json.amount, 0);
        showToast(`Claimed ${fmtSol(claimedAmount)} SOL`);
        loadProfile(solAddr);
        loadBalance(solAddr);
        loadCoins(0, false);
      } else {
        showToast(json?.error || "Claim failed");
      }
    } catch (e) {
      showToast(e?.message || "Claim failed");
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

  const depositHistory = Array.isArray(profile?.depositHistory)
  ? profile.depositHistory
  : [];

const withdrawHistory = Array.isArray(profile?.withdrawHistory)
  ? profile.withdrawHistory
  : [];

const walletHistory = [
  ...depositHistory.map((d) => ({
    id: d.id,
    type: "DEPOSIT",
    amount: d.amount ?? 0,
    txHash: d.tx_hash || d.txHash || "",
    status: d.status || "confirmed",
    createdAt: d.created_at || d.createdAt,
  })),
  ...withdrawHistory.map((w) => ({
    id: w.id,
    type: "WITHDRAW",
    amount: w.amount ?? 0,
    txHash: w.tx_hash || w.txHash || "",
    status: w.status || "pending",
    destination: w.destination || "",
    createdAt: w.created_at || w.createdAt,
  })),
].sort(
  (a, b) =>
    new Date(b.createdAt).getTime() -
    new Date(a.createdAt).getTime()
);

  const recentCoinActivity = useMemo(() => {
    if (!selectedCoin?.id) return [];
    return (profileTxs || [])
      .filter((tx) => String(tx.coinId || "") === String(selectedCoin.id))
      .sort((a, b) => safeNum(b.ts || b.t, 0) - safeNum(a.ts || a.t, 0))
      .slice(0, 20);
  }, [profileTxs, selectedCoin]);

  const currentCoinPriceUsd = getCoinPriceUsd(selectedCoin || {});
  const currentCoinPriceSol = Math.max(0, safeNum(selectedCoin?.priceSol, 0));
  const currentWalletTokens = Math.max(0, safeNum(selectedCoin?.holders?.[solAddr], 0));
  const isSelectedCoinCreator = Boolean(selectedCoin?.creatorWallet && solAddr && String(selectedCoin.creatorWallet).trim() === String(solAddr).trim());
  const dexLaunchReady = Boolean(selectedCoin && safeNum(selectedCoin.mc, 0) >= DEX_LAUNCH_MC_USD);

  const toUsdFromSol = (sol) => fmtUsd(Number(sol || 0) * solPriceUsd);

  const portfolioWalletUsd = Number(profile?.runBalance ?? walletSolBalance ?? 0) * solPriceUsd;

  const portfolioHoldingsUsd = profileHoldings.reduce((sum, h) => {
  const coin =
    (coins || []).find(
      (x) => String(x.id) === String(h.coinId || h.id || h.coin?.id)
    ) || {};

  const amt = Math.max(0, safeNum(h.amount, h.tokens || h.balance || 0));

  return sum + amt * getCoinPriceUsd(coin);
}, 0);

  const portfolioCreatorUsd   = Number(profile?.creatorRewardsSol  ?? 0) * solPriceUsd;
  const portfolioReferralUsd  = Number(profile?.referralRewardsSol ?? 0) * solPriceUsd;
  const portfolioOwnerUsd     = Number(profile?.ownerRewardsSol    ?? 0) * solPriceUsd;
  const totalPortfolioUsd     = portfolioWalletUsd + portfolioHoldingsUsd + portfolioCreatorUsd + portfolioReferralUsd + portfolioOwnerUsd;

  // -------------------- BACKUP PHRASE --------------------
  const [phraseOpen, setPhraseOpen] = useState(false);
  const [phraseWords, setPhraseWords] = useState([]);
  const [phraseLoading, setPhraseLoading] = useState(false);

  async function handleRevealPhrase() {
    setPhraseLoading(true);
    try {
      const json = USE_PLATFORM
        ? await platformApi.revealMnemonic({
            wallet: solAddr,
            authToken: await getAccessToken(),
          })
        : await api("/wallet/reveal-mnemonic", {
            method: "POST",
            body: JSON.stringify({ wallet: solAddr }),
          });
      if (json?.words) {
        setPhraseWords(json.words);
        setPhraseOpen(true);
      } else {
        showToast(json?.error || "Phrase not available yet");
      }
    } catch (e) {
      showToast(e?.message || "Failed to load phrase");
    }
    setPhraseLoading(false);
  }

  // -------------------- LOGIN GATE --------------------
  if (!ready) {
    return (
      <>
        <ThemeStyles />
        <div style={{
          minHeight: "100dvh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "var(--bg)", gap: 16, padding: 24,
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--primary)" }}>Fun.Run</div>
          <Skeleton width={140} height={14} style={{ margin: "0 auto" }} />
        </div>
      </>
    );
  }

  if (viewMode === "landing") {
    return (
      <>
        <ThemeStyles />
        <LandingPage
          logoUrl={APP_LOGO_URL}
          coins={coins}
          hotCoins={hot15m}
          recentTrades={recentTrades}
          loadingCoins={loadingCoins}
          solPriceUsd={solPriceUsd}
          fmtUsd={fmtUsd}
          fmtSol={fmtSol}
          fmtNum={fmtNum}
          getMovePct={getCoin24hMovePct}
          onEnterApp={enterApp}
          onOpenCoin={openCoinFromLanding}
        />
      </>
    );
  }

  if (!authenticated) {
    return (
      <>
        <ThemeStyles />
        <div style={{
          minHeight: "100dvh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "var(--bg)", gap: 24, padding: 32,
        }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: "var(--primary)", letterSpacing: -1 }}>
            Fun.Run
          </div>
          <div style={{
            color: "var(--muted)", fontSize: 15, textAlign: "center", maxWidth: 280, lineHeight: 1.5,
          }}>
            Launch tokens. Trade instantly. Earn on every move.
          </div>
          <button
            onClick={async () => { try { await login?.(); } catch (e) { console.log(e); } }}
            style={{
              background: "var(--primary)", color: "var(--btnText)", border: "none",
              borderRadius: 14, padding: "14px 36px", fontSize: 16,
              fontWeight: 700, cursor: "pointer", letterSpacing: 0.2,
              boxShadow: "0 4px 20px rgba(0,0,0,.32)",
            }}
          >
            Continue with Google
          </button>
          <div style={{ color: "var(--muted2)", fontSize: 12, textAlign: "center", maxWidth: 260 }}>
            New here? Your account and wallet are created automatically.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ThemeStyles />

      {/* ---- BACKUP PHRASE MODAL ---- */}
      {phraseOpen && (
        <Modal
          onClose={() => { setPhraseOpen(false); setPhraseWords([]); }}
          cardStyle={{ maxWidth: 340 }}
        >
          <ModalHead
            title="Recovery Phrase"
            right={
              <MiniBtn onClick={() => { setPhraseOpen(false); setPhraseWords([]); }}>
                Close
              </MiniBtn>
            }
          />
          <ModalBody>
              <div style={{ color: "var(--warn, #f59e0b)", fontSize: 12, marginBottom: 12, lineHeight: 1.5, background: "var(--card2)", borderRadius: 8, padding: "8px 10px" }}>
                ⚠️ Ye 12 words kisi ko mat dikhana. Agar kho gayi to wallet recover nahi hoga.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {phraseWords.map((w, i) => (
                  <div key={i} style={{
                    background: "var(--card2)", borderRadius: 8, padding: "6px 8px",
                    fontSize: 13, fontWeight: 600, color: "var(--text)",
                    display: "flex", gap: 6, alignItems: "center",
                  }}>
                    <span style={{ color: "var(--muted2)", fontSize: 10, minWidth: 16 }}>{i + 1}.</span>
                    {w}
                  </div>
                ))}
              </div>
              <MiniBtn
                style={{ marginTop: 14, width: "100%" }}
                onClick={async () => {
                  const ok = await copyText(phraseWords.join(" "));
                  showToast(ok ? "Phrase copied" : "Copy failed");
                }}
              >
                Copy All Words
              </MiniBtn>
          </ModalBody>
        </Modal>
      )}

      {withdrawOpen && (
        <Modal>
          <ModalHead
            title="Withdraw SOL"
            right={
              <MiniBtn onClick={() => { withdrawKeyRef.current = null; setWithdrawOpen(false); }}>
                Close
              </MiniBtn>
            }
          />
          <ModalBody>
              <Input
                value={withdrawAddr}
                onChange={(e) => setWithdrawAddr(e.target.value)}
                placeholder="Enter SOL address"
              />

              <div style={{ height: 10 }} />

              <Input
                value={withdrawAmt}
                onChange={(e) => setWithdrawAmt(e.target.value)}
                placeholder="Enter amount in SOL"
                type="number"
              />

              <div style={{ height: 14 }} />

              <PrimaryButton
                onClick={async () => {
                  try {
                    if (!withdrawAddr || !withdrawAmt) {
                      showToast("Enter address & amount");
                      return;
                    }

                    // Retry pe same key bhejo; nayi koshish pe naya key banao
                    if (!withdrawKeyRef.current) {
                      withdrawKeyRef.current = crypto.randomUUID();
                    }
                    const idempotencyKey = withdrawKeyRef.current;

                    const token = await getAccessToken();
                    const json = USE_PLATFORM
                      ? await platformApi.withdrawSol({
                          wallet: profile?.wallet,
                          destination: withdrawAddr,
                          amount: Number(withdrawAmt),
                          authToken: token,
                          idempotencyKey,
                        })
                      : await api("/withdraw", {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            wallet: profile?.wallet,
                            destination: withdrawAddr,
                            amount: Number(withdrawAmt),
                            idempotencyKey,
                          }),
                        });

                    if (json?.ok) {
                      // Success (ya already-processed duplicate) — key clear karo
                      withdrawKeyRef.current = null;
                      showToast(json.idempotent ? "Already processed" : `Sent ${withdrawAmt} SOL`);
                      setWithdrawOpen(false);
                      setWithdrawAddr("");
                      setWithdrawAmt("");
                      loadProfile(solAddr);
                      loadBalance(solAddr);
                    } else {
                      // Fail — key rakho taake retry same key se ho
                      showToast(json?.error || "Withdraw failed");
                    }
                  } catch (e) {
                    // Network error — key rakho taake retry kaam kare
                    showToast(e.message || "Withdraw failed");
                  }
                }}
              >
                Confirm Withdraw
              </PrimaryButton>
          </ModalBody>
        </Modal>
      )}

      {dexModalOpen && selectedCoin ? (
        <Modal onClose={() => setDexModalOpen(false)}>
          <ModalHead
            title="Launch to DEX"
            right={<MiniBtn onClick={() => setDexModalOpen(false)}>Close</MiniBtn>}
          />
          <ModalBody>
              <div style={{ display: "grid", gap: 12 }}>
                <div
                  style={{
                    padding: 14,
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,.10)",
                    background: "var(--card)",
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 1000 }}>{selectedCoin.name} → DEX Migration</div>
                  <div className="miniMuted" style={{ marginTop: 6 }}>
                    Required MC: {fmtUsd(DEX_LAUNCH_MC_USD)} • Current MC: {fmtUsd(selectedCoin.mc || 0)}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <Pill style={{ color: dexLaunchReady ? "var(--good)" : "var(--warn)" }}>
                      {dexLaunchReady ? "Ready for Phase 2 launch" : "Locked until $5M MC"}
                    </Pill>
                  </div>
                </div>

                {DEX_OPTIONS.map((dex) => (
                  <button
                    key={dex.id}
                    type="button"
                    onClick={() => showToast(dexLaunchReady ? `${dex.name} launch Phase 4 me aayega (devnet test ke baad)` : "DEX launch unlocks at $5M MC")}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "1px solid rgba(255,255,255,.10)",
                      borderRadius: 18,
                      padding: 14,
                      cursor: "pointer",
                      color: "var(--text)",
                      background: "linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.025))",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,.08)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 1000 }}>{dex.name}</div>
                        <div className="miniMuted" style={{ marginTop: 5 }}>{dex.sub}</div>
                      </div>
                      <Pill>{dexLaunchReady ? "Select" : "Phase 2"}</Pill>
                    </div>
                  </button>
                ))}

                <div className="miniMuted" style={{ lineHeight: 1.55 }}>
                  This is a safe placeholder for launch. Real liquidity pool creation is intentionally disabled until mainnet DEX integration is audited.
                </div>
              </div>
          </ModalBody>
        </Modal>
      ) : null}

      <Toast message={toast.text} type={toast.type} duration={toast.duration} onClose={clearToast} />

      {showIntro ? (
        <IntroSplash
          durationMs={5000}
          logoUrl={APP_LOGO_URL}
          onDone={() => setShowIntro(false)}
        />
      ) : null}

      <TopBar logoUrl={APP_LOGO_URL} onHome={() => goScreen("HOME")} />

      <AppShell className={screen === "COIN" && !isMobile ? "appShell--trading" : ""}>

        {screen === "HOME" && (
          <HomePage
            adSlot={<NativeFunRunAd />}
            onNavigate={goScreen}
            onOpenCoin={openCoin}
            coins={coins}
            hotCoins={hot15m}
            latestCoins={latestCoins}
            topVolume={topVolume}
            homeFeedMode={homeFeedMode}
            onFeedModeChange={setHomeFeedMode}
            favoriteCoinIds={favoriteCoinIds}
            onToggleFavorite={toggleFavoriteCoin}
            loadingCoins={loadingCoins}
            coinsLoadMoreRef={coinsLoadMoreRef}
          />
        )}

      {screen === "INFO" && (
  <ScreenShell>
    {renderBackButton()}

    <NativeFunRunAd compact />

    <Card>
      <Title>About Fun.Run</Title>

      <div
        style={{
          color: "var(--muted)",
          fontSize: 14,
          lineHeight: 1.7,
        }}
      >
        Fun.Run is the next generation Solana launchpad —
        built for creators and traders. Create your coin
        in seconds, earn from every trade as the creator,
        and grow your network with 50% affiliate rewards.
        Built for speed, designed for fun.
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : "repeat(2, 1fr)",
          gap: 14,
          marginTop: 20,
        }}
      >
        {[
          {
            icon: "🚀",
            title: "Launch Fast",
            text: "Create your meme coin instantly with automated launch mechanics.",
          },

          {
            icon: "💰",
            title: "Earn Rewards",
            text: "Creators earn fees automatically from every buy and sell trade.",
          },

          {
            icon: "⚡",
            title: "50% Affiliate",
            text: "Invite users with your referral link and earn platform rewards.",
          },

          {
            icon: "📈",
            title: "Trade Early",
            text: "Discover and buy new meme coins before they trend.",
          },
        ].map((item) => (
          <div
            key={item.title}
            style={{
              position: "relative",
              overflow: "hidden",
              padding: 16,
              borderRadius: 22,
              border:
                "1px solid rgba(255,255,255,.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
              boxShadow:
                "0 10px 30px rgba(0,0,0,.24)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 80,
                height: 80,
                borderRadius: "50%",
                background:
                  "rgba(120,255,214,.15)",
                filter: "blur(24px)",
              }}
            />

            <div
              style={{
                fontSize: 28,
                position: "relative",
                zIndex: 1,
              }}
            >
              {item.icon}
            </div>

            <div
              style={{
                marginTop: 10,
                fontWeight: 1000,
                fontSize: 15,
                position: "relative",
                zIndex: 1,
              }}
            >
              {item.title}
            </div>

            <div
              style={{
                marginTop: 6,
                color:
                  "rgba(238,248,255,.74)",
                fontSize: 13,
                lineHeight: 1.5,
                position: "relative",
                zIndex: 1,
              }}
            >
              {item.text}
            </div>
          </div>
        ))}
      </div>
    </Card>
  </ScreenShell>
)}

        {screen === "SEARCH" && (
          <SearchPage
            adSlot={<NativeFunRunAd compact />}
            onBack={goBack}
            onOpenCoin={openCoin}
            searchQ={searchQ}
            onSearchChange={setSearchQ}
            searchMode={searchMode}
            onSearchModeChange={setSearchMode}
            coins={coins}
            filteredCoins={filteredCoins}
            topVolume={topVolume}
            topMoves20={topMoves20}
            favoriteCoinIds={favoriteCoinIds}
            onToggleFavorite={toggleFavoriteCoin}
            loadingCoins={loadingCoins}
          />
        )}

        {screen === "CREATE" && (
          <CreateCoinPage
            adSlot={<NativeFunRunAd compact />}
            onBack={goBack}
            tokenName={tokenName}
            onTokenNameChange={setTokenName}
            symbol={symbol}
            onSymbolChange={setSymbol}
            story={story}
            onStoryChange={setStory}
            initialSol={initialSol}
            onInitialSolChange={setInitialSol}
            logoPreview={logoPreview}
            onLogoPick={handleLogoPick}
            creating={creating}
            onCreate={handleCreateCoin}
          />
        )}

        {screen === "COIN" && (
          <CoinPage
            coin={selectedCoin}
            isMobile={isMobile}
            isFavorite={favoriteCoinIds.includes(selectedCoin?.id)}
            isCreator={isSelectedCoinCreator}
            chartRange={chartRange}
            onChartRangeChange={setChartRange}
            chartReloadKey={chartReloadKey}
            tradeMode={tradeMode}
            onTradeModeChange={setTradeMode}
            tradeAmount={tradeAmount}
            onTradeAmountChange={setTradeAmount}
            currentWalletTokens={currentWalletTokens}
            walletSolBalance={walletSolBalance}
            trading={trading}
            onTrade={handleTrade}
            recentActivity={recentCoinActivity}
            walletAddress={solAddr}
            showFullStory={showFullStory}
            onToggleStory={() => setShowFullStory((v) => !v)}
            onOpenCreator={() => openCreatorFromCoin(selectedCoin)}
            onToggleFavorite={() => toggleFavoriteCoin(selectedCoin?.id)}
            onCopyMint={async () => {
              if (!selectedCoin?.mintAddress) return;
              const ok = await copyText(selectedCoin.mintAddress);
              showToast(ok ? "Mint address copied" : "Copy failed");
            }}
            onOpenDex={() => setDexModalOpen(true)}
            onExplore={() => goScreen("SEARCH")}
            onBack={goBack}
          />
        )}

        {screen === "CREATOR" && (
          <CreatorPublicPage
            adSlot={<NativeFunRunAd compact />}
            onBack={goBack}
            creatorCoin={creatorCoin}
            creatorProfileId={creatorProfileId}
            creatorCoins={creatorCoins}
            creatorRewards={creatorRewards}
            creatorHoldings={creatorHoldings}
            onOpenCoin={openCoin}
          />
        )}

        {screen === "CREATOR_DASHBOARD" && (
          <CreatorDashboardPage
            adSlot={<NativeFunRunAd compact />}
            onBack={goBack}
            authenticated={authenticated}
            onLogin={async () => {
              try {
                await login?.();
                showToast("Google login opened");
              } catch (e) {
                showToast(e?.message || "Google login failed");
              }
            }}
            loading={loadingProfile || loadingCoins}
            profile={profile}
            solAddr={solAddr}
            myCoins={myCreations}
            txs={profileTxs}
            solPriceUsd={solPriceUsd}
            creatorRewardsSol={profile?.creatorRewardsSol || creatorRewards || 0}
            onClaimCreator={() => handleClaim("CREATOR")}
            onOpenCoin={openCoin}
            onCreateCoin={() => goScreen("CREATE")}
            onGoHome={() => goScreen("HOME")}
            shortWallet={shortWallet}
          />
        )}

        

        {screen === "PROFILE" && (
          <ProfilePage
            adSlot={<NativeFunRunAd compact />}
            onBack={goBack}
            loadingProfile={loadingProfile}
            profile={profile}
            solAddr={solAddr}
            referralCount={profile?.referralCount || 0}
            onCopyAffiliateLink={async () => {
              const ok = await copyText(solAddr ? getReferralLink(solAddr) : "");
              showToast(ok ? "Affiliate link copied" : "Copy failed");
            }}
            totalPortfolioUsd={totalPortfolioUsd}
            portfolioHoldingsUsd={portfolioHoldingsUsd}
            toUsdFromSol={toUsdFromSol}
            depositAddress={profile?.depositAddress || profile?.custodialWallet || profile?.wallet_address || ""}
            onCopyDeposit={() => {
              navigator.clipboard.writeText(
                profile?.depositAddress || profile?.custodialWallet || profile?.wallet_address || ""
              );
              showToast("Deposit address copied");
            }}
            onCopyWallet={() => {
              navigator.clipboard.writeText(
                profile?.depositAddress || profile?.custodialWallet || profile?.wallet_address || ""
              );
              showToast("Wallet copied");
            }}
            onOpenWithdraw={() => setWithdrawOpen(true)}
            runTokens={profile?.runTokens ?? 0}
            runValueUsd={(profile?.runTokens ?? 0) * 0.000002}
            unlockDays={unlockDays}
            unlockHours={unlockHours}
            unlockMinutes={unlockMinutes}
            unlockSeconds={unlockSeconds}
            referralRewardsSol={profile?.referralRewardsSol || 0}
            creatorRewardsSol={profile?.creatorRewardsSol || creatorRewards || 0}
            onClaimReferral={() => handleClaim("REF")}
            onClaimCreator={() => handleClaim("CREATOR")}
            onShareAffiliate={async () => {
              const ok = await copyText(solAddr ? getReferralLink(solAddr) : "");
              showToast(ok ? "Affiliate link copied" : "Copy failed");
            }}
            theme={theme}
            myCreations={myCreations}
            profileHoldings={profileHoldings}
            profileTxs={profileTxs}
            walletHistory={walletHistory}
            coins={coins}
            onOpenCoin={openCoin}
            onCreateCoin={() => goScreen("CREATE")}
            onGoHome={() => goScreen("HOME")}
            onGoSearch={() => goScreen("SEARCH")}
            onOpenPortfolio={() => goScreen("PORTFOLIO")}
            onOpenCreatorDashboard={() => goScreen("CREATOR_DASHBOARD")}
            onOpenReferralDashboard={() => goScreen("REFERRAL")}
            onCopyTxHash={async (hash) => {
              const ok = await copyText(hash || "");
              showToast(ok ? "TX Hash copied" : "Copy failed");
            }}
            normalizeCoin={normalizeCoin}
            getCoinPriceUsd={getCoinPriceUsd}
            shortWallet={shortWallet}
          />
        )}

        {screen === "PORTFOLIO" && (
          <PortfolioPage
            adSlot={<NativeFunRunAd compact />}
            onBack={goBack}
            authenticated={authenticated}
            onLogin={async () => {
              try {
                await login?.();
                showToast("Google login opened");
              } catch (e) {
                showToast(e?.message || "Google login failed");
              }
            }}
            loading={loadingProfile}
            profile={profile}
            solAddr={solAddr}
            coins={coins}
            holdings={profileHoldings}
            txs={profileTxs}
            walletHistory={walletHistory}
            walletSolBalance={walletSolBalance}
            solPriceUsd={solPriceUsd}
            onOpenCoin={openCoin}
            onGoSearch={() => goScreen("SEARCH")}
            onGoHome={() => goScreen("HOME")}
            shortWallet={shortWallet}
          />
        )}

        {screen === "REFERRAL" && (
          <ReferralDashboardPage
            adSlot={<NativeFunRunAd compact />}
            onBack={goBack}
            authenticated={authenticated}
            onLogin={async () => {
              try {
                await login?.();
                showToast("Google login opened");
              } catch (e) {
                showToast(e?.message || "Google login failed");
              }
            }}
            loading={loadingProfile}
            profile={profile}
            solAddr={solAddr}
            referralLink={solAddr ? getReferralLink(solAddr) : ""}
            referralCount={profile?.referralCount || 0}
            referralRewardsSol={profile?.referralRewardsSol || 0}
            referralActivity={profile?.referralActivity || []}
            solPriceUsd={solPriceUsd}
            onCopyLink={async () => {
              const ok = await copyText(solAddr ? getReferralLink(solAddr) : "");
              showToast(ok ? "Affiliate link copied" : "Copy failed");
            }}
            onShareLink={async () => {
              const link = solAddr ? getReferralLink(solAddr) : "";
              if (!link) {
                showToast("Affiliate link unavailable");
                return;
              }
              try {
                if (typeof navigator !== "undefined" && navigator.share) {
                  await navigator.share({
                    title: "Join Fun.Run",
                    text: "Launch and trade meme coins on Fun.Run — join with my link",
                    url: link,
                  });
                  showToast("Share opened");
                  return;
                }
              } catch (e) {
                if (e?.name === "AbortError") return;
              }
              const ok = await copyText(link);
              showToast(ok ? "Affiliate link copied" : "Share failed");
            }}
            onClaimReferral={() => handleClaim("REF")}
            onGoHome={() => goScreen("HOME")}
            shortWallet={shortWallet}
          />
        )}

        {screen === "ADMIN" && (
          <AdminDashboardPage
            adSlot={<NativeFunRunAd compact />}
            onBack={goBack}
            authenticated={authenticated}
            isAdmin={isAdmin}
            onLogin={async () => {
              try {
                await login?.();
                showToast("Google login opened");
              } catch (e) {
                showToast(e?.message || "Google login failed");
              }
            }}
            loading={loadingCoins || loadingProfile}
            profile={profile}
            solAddr={solAddr}
            coins={coins}
            recentTrades={recentTrades}
            hotCoins={hot15m}
            coinsHasMore={coinsHasMore}
            wsConnected={wsConnected}
            solPriceUsd={solPriceUsd}
            onClaimOwner={() => handleClaim("OWNER")}
            onOpenCoin={openCoin}
            onGoHome={() => goScreen("HOME")}
            onGoSearch={() => goScreen("SEARCH")}
            shortWallet={shortWallet}
          />
        )}

        {screen === "SETTINGS" && (
          <SettingsPage
            onBack={goBack}
            theme={theme}
            onThemeChange={setTheme}
            authenticated={authenticated}
            isAdmin={isAdmin}
            onOpenAdmin={() => goScreen("ADMIN")}
            onLogin={async () => {
              try {
                await login?.();
                showToast("Google login opened");
              } catch (e) {
                showToast(e?.message || "Google login failed");
              }
            }}
            onLogout={async () => {
              try {
                await logout?.();
                showToast("Google logged out");
                goScreen("HOME");
              } catch (e) {
                showToast(e?.message || "Logout failed");
              }
            }}
            phantomWallet={phantomWallet}
            onConnectPhantom={connectPhantom}
            onDisconnectPhantom={disconnectPhantom}
            connectingPhantom={connectingPhantom}
            onCopyWallet={async () => {
              const addr = profile?.custodialWallet || profile?.depositAddress || "";
              if (!addr) {
                showToast("No deposit wallet yet");
                return;
              }
              const ok = await copyText(addr);
              showToast(ok ? "Wallet copied" : "Copy failed");
            }}
            onCopyReferral={async () => {
              if (!solAddr) {
                showToast("No wallet connected");
                return;
              }
              const ok = await copyText(getReferralLink(solAddr));
              showToast(ok ? "Referral link copied" : "Copy failed");
            }}
            onExportWallet={async () => {
              try {
                await exportWallet?.();
                showToast("Wallet export opened");
              } catch (e) {
                showToast(e?.message || "Export failed");
              }
            }}
            shortWallet={shortWallet}
          />
        )}
      </AppShell>

      <FooterNav screen={screen} onNavigate={goScreen} />

      {settingsOpen ? (
        <Modal onClose={() => setSettingsOpen(false)}>
          <ModalHead
            title="Quick Settings"
            right={<MiniBtn onClick={() => setSettingsOpen(false)}>Close</MiniBtn>}
          />
          <ModalBody>
              <div className="themeGrid">
                <div className="themeGroupLabel">Dark</div>
                <ThemeOption theme="calm" current={theme} setTheme={setTheme} label="Midnight" />
                <ThemeOption theme="ocean" current={theme} setTheme={setTheme} label="Ocean" />
                <ThemeOption theme="royal" current={theme} setTheme={setTheme} label="Royal" />
                <ThemeOption theme="neon" current={theme} setTheme={setTheme} label="Neon" />
                <ThemeOption theme="rose" current={theme} setTheme={setTheme} label="Rose" />
                <div className="themeGroupLabel">Light</div>
                <ThemeOption theme="light" current={theme} setTheme={setTheme} label="Daylight" />
                <ThemeOption theme="paper" current={theme} setTheme={setTheme} label="Paper" />
              </div>

              <div className="settingsDivider" />

              <div className="settingsActions">
                <MiniBtn
                  onClick={async () => {
                    const addr = profile?.custodialWallet || profile?.depositAddress || "";
                    if (!addr) { showToast("No deposit wallet yet"); return; }
                    const ok = await copyText(addr);
                    showToast(ok ? "Wallet copied" : "Copy failed");
                  }}
                >
                  Copy Wallet
                </MiniBtn>

                <MiniBtn
                  onClick={async () => {
                    if (!solAddr) {
                      showToast("No wallet connected");
                      return;
                    }
                    const ok = await copyText(getReferralLink(solAddr));
                    showToast(ok ? "Referral link copied" : "Copy failed");
                  }}
                >
                  Copy Referral Link
                </MiniBtn>

                {!authenticated ? (
                  <MiniBtn
                    tone="good"
                    onClick={async () => {
                      try {
                        if (ready) await login?.();
                        setSettingsOpen(false);
                      } catch (e) {
                        showToast(e?.message || "Google login failed");
                      }
                    }}
                  >
                    Google Login
                  </MiniBtn>
                ) : (
                  <MiniBtn
                    tone="danger"
                    onClick={async () => {
                      try {
                        await logout?.();
                        setSettingsOpen(false);
                        showToast("Google logged out");
                        goScreen("HOME");
                      } catch (e) {
                        showToast(e?.message || "Logout failed");
                      }
                    }}
                  >
                    Google Logout
                  </MiniBtn>
                )}

                {phantomWallet ? (
                  <MiniBtn tone="danger" onClick={disconnectPhantom}>
                    Disconnect Phantom
                  </MiniBtn>
                ) : (
                  <MiniBtn tone="good" onClick={connectPhantom} disabled={connectingPhantom}>
                    {connectingPhantom ? "Connecting" : "Connect Phantom"}
                  </MiniBtn>
                )}
              </div>
          </ModalBody>
        </Modal>
      ) : null}
    </>
  );
}
