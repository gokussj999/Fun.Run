import React from "react";
import { Card } from "../ui/Card.jsx";
import { CoinHeader } from "./CoinHeader.jsx";
import { CoinStatsStrip } from "./CoinStatsStrip.jsx";
import { CoinChartSection } from "./CoinChartSection.jsx";
import { CoinDetailTabs } from "./CoinDetailTabs.jsx";
import { HoldersActivityPanel } from "./HoldersActivityPanel.jsx";
import { TradePanel } from "./TradePanel.jsx";

export function CoinDesktopLayout({
  coin,
  isFavorite,
  isCreator,
  chartRange,
  onChartRangeChange,
  chartReloadKey,
  tradeMode,
  onTradeModeChange,
  tradeAmount,
  onTradeAmountChange,
  currentWalletTokens,
  walletSolBalance,
  trading,
  onTrade,
  recentActivity,
  walletAddress,
  showFullStory,
  onToggleStory,
  onOpenCreator,
  onToggleFavorite,
  onCopyMint,
  onOpenDex,
}) {
  return (
    <div className="coinDesktopLayout">
      <Card className="coinDesktopHeaderCard">
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

      <div className="coinDesktopGrid">
        <div className="coinDesktopMain">
          <div className="coinChartCard coinDesktopChartCard">
            <Card bleed style={{ overflow: "hidden", padding: 0 }}>
              <CoinChartSection
                coin={coin}
                height={560}
                variant="hero"
                chartRange={chartRange}
                onChartRangeChange={onChartRangeChange}
                chartReloadKey={chartReloadKey}
              />
            </Card>
          </div>

          <Card className="coinDesktopDetailCard">
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
        </div>

        <aside className="coinDesktopSidebar">
          <Card className="coinDesktopTradeCard">
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

          <Card className="coinDesktopMarketCard">
            <HoldersActivityPanel coin={coin} activity={recentActivity} fallbackWallet={walletAddress} />
          </Card>
        </aside>
      </div>
    </div>
  );
}
