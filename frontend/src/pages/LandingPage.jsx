import React, { useMemo } from "react";
import {
  FAQ,
  Features,
  Footer,
  Hero,
  LandingNav,
  LiveTrades,
  TrendingSection,
} from "../components/landing";

export function LandingPage({
  logoUrl,
  coins = [],
  hotCoins = [],
  recentTrades = [],
  loadingCoins = false,
  solPriceUsd = 0,
  fmtUsd,
  fmtSol,
  fmtNum,
  getMovePct,
  onEnterApp,
  onOpenCoin,
}) {
  const trending = useMemo(() => {
    const hot = (hotCoins || []).filter((c) => c?.id);
    if (hot.length) return hot;
    return [...(coins || [])]
      .sort((a, b) => Number(b?.volumeSol || 0) - Number(a?.volumeSol || 0))
      .slice(0, 8);
  }, [coins, hotCoins]);

  const stats = useMemo(() => {
    const totalCoins = (coins || []).length;
    const totalVolumeSol = (coins || []).reduce((sum, c) => sum + Number(c?.volumeSol || 0), 0);
    const totalVolumeUsd = totalVolumeSol * Number(solPriceUsd || 0);
    const activeTraders = new Set(
      (recentTrades || [])
        .map((t) => String(t?.wallet || t?.user || t?.trader || "").trim())
        .filter(Boolean)
    ).size;

    return [
      { label: "Coins launched", value: fmtNum?.(totalCoins, 0) || String(totalCoins) },
      { label: "24h volume", value: fmtUsd?.(totalVolumeUsd) || "$0" },
      { label: "Live trades", value: fmtNum?.(recentTrades?.length || 0, 0) || "0" },
      { label: "Active traders", value: fmtNum?.(activeTraders, 0) || "0" },
    ];
  }, [coins, recentTrades, solPriceUsd, fmtUsd, fmtNum]);

  function scrollTo(id) {
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="landingRoot">
      <LandingNav logoUrl={logoUrl} onEnterApp={onEnterApp} onScrollTo={scrollTo} />

      <Hero onEnterApp={onEnterApp} stats={stats} />

      <TrendingSection
        coins={trending}
        loading={loadingCoins}
        fmtUsd={fmtUsd}
        getMovePct={getMovePct}
        onOpenCoin={onOpenCoin}
        onEnterApp={onEnterApp}
      />

      <LiveTrades trades={recentTrades} fmtSol={fmtSol} onEnterApp={onEnterApp} />

      <Features />

      <FAQ />

      <Footer logoUrl={logoUrl} onEnterApp={onEnterApp} onScrollTo={scrollTo} />
    </div>
  );
}
