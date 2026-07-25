import React, { useEffect, useState } from "react";
import { ScreenShell, BackButton } from "../components/layout";
import { Card } from "../components/ui/Card.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import {
  CoinHeader,
  CoinStatsStrip,
  CoinDesktopLayout,
  CoinChartSection,
  CoinOverviewPanel,
  HoldersActivityPanel,
  TradePanel,
} from "../components/coin";
import { useMobileLayout } from "../hooks/useMobileLayout.js";

const MOBILE_TABS = [
  { id: "OVERVIEW", label: "Chart" },
  { id: "TRADE", label: "Trade" },
  { id: "MARKET", label: "Activity" },
];

function useMobileChartHeight(isMobile) {
  const [height, setHeight] = useState(isMobile ? 320 : 500);

  useEffect(() => {
    if (!isMobile) {
      setHeight(500);
      return;
    }

    const calc = () => {
      const vh = window.innerHeight || 640;
      setHeight(Math.min(460, Math.max(300, Math.round(vh * 0.44))));
    };

    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [isMobile]);

  return height;
}

export function CoinPage({
  coin,
  isMobile: isMobileProp = false,
  isFavorite = false,
  isCreator = false,
  chartRange,
  onChartRangeChange,
  chartReloadKey = 0,
  tradeMode,
  onTradeModeChange,
  tradeAmount,
  onTradeAmountChange,
  currentWalletTokens = 0,
  walletSolBalance = 0,
  trading = false,
  onTrade,
  recentActivity = [],
  walletAddress = "",
  showFullStory = false,
  onToggleStory,
  onOpenCreator,
  onToggleFavorite,
  onCopyMint,
  onOpenDex,
  onExplore,
  onBack,
}) {
  const layoutMobile = useMobileLayout();
  const isMobile = isMobileProp || layoutMobile;
  const [mobileTab, setMobileTab] = useState("OVERVIEW");
  const chartHeight = useMobileChartHeight(isMobile);

  if (!coin) {
    return (
      <ScreenShell>
        {onBack ? <BackButton onClick={onBack} /> : null}
        <Card>
          <EmptyState
            icon="📊"
            title="No coin selected"
            description="Pick a coin from Home or Search to view the chart and trade."
            actionLabel="Explore Coins"
            onAction={onExplore}
            compact
          />
        </Card>
      </ScreenShell>
    );
  }

  function openTrade(mode) {
    onTradeModeChange?.(mode);
    setMobileTab("TRADE");
  }

  const mobileOverview = (
    <>
      <Card className="coinMobileHeaderCard">
        <CoinHeader
          coin={coin}
          isFavorite={isFavorite}
          isCreator={isCreator}
          isMobile
          hideStats
          onOpenCreator={onOpenCreator}
          onToggleFavorite={onToggleFavorite}
          onCopyMint={onCopyMint}
          onOpenDex={onOpenDex}
        />
      </Card>

      <CoinStatsStrip coin={coin} variant="key" />

      <div className="coinChartCard coinMobileChartCard">
        <Card bleed style={{ overflow: "visible", padding: 0 }}>
          <CoinChartSection
            coin={coin}
            height={chartHeight}
            compact
            chartRange={chartRange}
            onChartRangeChange={onChartRangeChange}
            chartReloadKey={chartReloadKey}
          />
        </Card>
      </div>

      <Card className="coinMobileInfoCard">
        <CoinOverviewPanel
          coin={coin}
          mobile
          showFullStory={showFullStory}
          onToggleStory={onToggleStory}
          onCopyMint={onCopyMint}
          onOpenCreator={onOpenCreator}
        />
      </Card>
    </>
  );

  const mobileTrade = (
    <Card className="coinMobileTradeCard">
      <TradePanel
        coin={coin}
        tradeMode={tradeMode}
        onTradeModeChange={onTradeModeChange}
        tradeAmount={tradeAmount}
        onTradeAmountChange={onTradeAmountChange}
        currentWalletTokens={currentWalletTokens}
        walletSolBalance={walletSolBalance}
        trading={trading}
        onTrade={onTrade}
      />
    </Card>
  );

  const mobileMarket = (
    <Card className="coinMobileMarketCard">
      <HoldersActivityPanel coin={coin} activity={recentActivity} fallbackWallet={walletAddress} />
    </Card>
  );

  return (
    <ScreenShell className={!isMobile ? "coinScreenShell" : "coinScreenShell coinScreenShell--mobile"}>
      {onBack ? <BackButton onClick={onBack} /> : null}
      <div className={`coinPageRoot ${!isMobile ? "coinPageRoot--desktop" : "coinPageRoot--mobile"}`}>
        {isMobile ? (
          <>
            <div className="coinMobileTabs" role="tablist" aria-label="Coin sections">
              {MOBILE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`coin-mobile-tab-${tab.id}`}
                  aria-selected={mobileTab === tab.id}
                  aria-controls={`coin-mobile-panel-${tab.id}`}
                  className={`coinMobileTab ${mobileTab === tab.id ? "active" : ""}`}
                  onClick={() => setMobileTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {mobileTab === "OVERVIEW" ? (
              <div
                className="coinMobilePanel coinMobilePanel--overview"
                role="tabpanel"
                id="coin-mobile-panel-OVERVIEW"
                aria-labelledby="coin-mobile-tab-OVERVIEW"
              >
                {mobileOverview}
              </div>
            ) : null}
            {mobileTab === "TRADE" ? (
              <div
                className="coinMobilePanel coinMobilePanel--trade"
                role="tabpanel"
                id="coin-mobile-panel-TRADE"
                aria-labelledby="coin-mobile-tab-TRADE"
              >
                {mobileTrade}
              </div>
            ) : null}
            {mobileTab === "MARKET" ? (
              <div
                className="coinMobilePanel coinMobilePanel--market"
                role="tabpanel"
                id="coin-mobile-panel-MARKET"
                aria-labelledby="coin-mobile-tab-MARKET"
              >
                {mobileMarket}
              </div>
            ) : null}

            {mobileTab === "OVERVIEW" ? (
              <div className="coinMobileTradeBar" role="group" aria-label="Quick trade">
                <button
                  type="button"
                  className="coinMobileTradeBarBtn coinMobileTradeBarBtn--buy"
                  onClick={() => openTrade("BUY")}
                >
                  Buy {coin.symbol}
                </button>
                <button
                  type="button"
                  className="coinMobileTradeBarBtn coinMobileTradeBarBtn--sell"
                  onClick={() => openTrade("SELL")}
                >
                  Sell
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="coinDesktopOnly">
            <CoinDesktopLayout
              coin={coin}
              isFavorite={isFavorite}
              isCreator={isCreator}
              chartRange={chartRange}
              onChartRangeChange={onChartRangeChange}
              chartReloadKey={chartReloadKey}
              tradeMode={tradeMode}
              onTradeModeChange={onTradeModeChange}
              tradeAmount={tradeAmount}
              onTradeAmountChange={onTradeAmountChange}
              currentWalletTokens={currentWalletTokens}
              walletSolBalance={walletSolBalance}
              trading={trading}
              onTrade={onTrade}
              recentActivity={recentActivity}
              walletAddress={walletAddress}
              showFullStory={showFullStory}
              onToggleStory={onToggleStory}
              onOpenCreator={onOpenCreator}
              onToggleFavorite={onToggleFavorite}
              onCopyMint={onCopyMint}
              onOpenDex={onOpenDex}
            />
          </div>
        )}
      </div>
    </ScreenShell>
  );
}
