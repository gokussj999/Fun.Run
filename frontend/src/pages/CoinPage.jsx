import React, { useState } from "react";
import { ScreenShell, BackButton } from "../components/layout";
import { Card } from "../components/ui/Card.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import {
  CoinHeader,
  CoinStatsStrip,
  CoinDesktopLayout,
  CoinChartSection,
  CoinDetailTabs,
  HoldersActivityPanel,
  TradePanel,
} from "../components/coin";

const MOBILE_TABS = [
  { id: "OVERVIEW", label: "Overview" },
  { id: "TRADE", label: "Trade" },
  { id: "MARKET", label: "Market" },
];

export function CoinPage({
  coin,
  isMobile = false,
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
  const [mobileTab, setMobileTab] = useState("OVERVIEW");

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

  const chartHeight = isMobile ? 320 : 500;

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

      <Card className="coinMobileStatsCard">
        <CoinStatsStrip coin={coin} />
      </Card>

      <div className="coinChartCard coinMobileChartCard">
        <Card bleed style={{ overflow: "hidden", padding: 0 }}>
          <CoinChartSection
            coin={coin}
            height={chartHeight}
            chartRange={chartRange}
            onChartRangeChange={onChartRangeChange}
            chartReloadKey={chartReloadKey}
          />
        </Card>
      </div>

      <Card>
        <CoinDetailTabs
          coin={coin}
          activity={recentActivity}
          fallbackWallet={walletAddress}
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
    <Card>
      <HoldersActivityPanel coin={coin} activity={recentActivity} fallbackWallet={walletAddress} />
    </Card>
  );

  const tabletOverview = (
    <>
      <Card>
        <CoinHeader
          coin={coin}
          isFavorite={isFavorite}
          isCreator={isCreator}
          isMobile={false}
          hideStats
          onOpenCreator={onOpenCreator}
          onToggleFavorite={onToggleFavorite}
          onCopyMint={onCopyMint}
          onOpenDex={onOpenDex}
        />
      </Card>
      <Card className="coinDesktopStatsCard">
        <CoinStatsStrip coin={coin} />
      </Card>
      <div className="coinChartCard">
        <Card bleed style={{ overflow: "hidden", padding: 0 }}>
          <CoinChartSection
            coin={coin}
            height={chartHeight}
            chartRange={chartRange}
            onChartRangeChange={onChartRangeChange}
            chartReloadKey={chartReloadKey}
          />
        </Card>
      </div>
      <Card>
        <CoinDetailTabs
          coin={coin}
          activity={recentActivity}
          fallbackWallet={walletAddress}
          showFullStory={showFullStory}
          onToggleStory={onToggleStory}
          onCopyMint={onCopyMint}
          onOpenCreator={onOpenCreator}
        />
      </Card>
    </>
  );

  const tabletTrade = (
    <Card>
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

  const tabletMarket = (
    <Card>
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
                className="coinMobilePanel"
                role="tabpanel"
                id="coin-mobile-panel-OVERVIEW"
                aria-labelledby="coin-mobile-tab-OVERVIEW"
              >
                {mobileOverview}
              </div>
            ) : null}
            {mobileTab === "TRADE" ? (
              <div
                className="coinMobilePanel"
                role="tabpanel"
                id="coin-mobile-panel-TRADE"
                aria-labelledby="coin-mobile-tab-TRADE"
              >
                {mobileTrade}
              </div>
            ) : null}
            {mobileTab === "MARKET" ? (
              <div
                className="coinMobilePanel"
                role="tabpanel"
                id="coin-mobile-panel-MARKET"
                aria-labelledby="coin-mobile-tab-MARKET"
              >
                {mobileMarket}
              </div>
            ) : null}
          </>
        ) : (
          <>
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
            <div className="coinTabletStack">
              {tabletOverview}
              {tabletTrade}
              {tabletMarket}
            </div>
          </>
        )}
      </div>
    </ScreenShell>
  );
}
