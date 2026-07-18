import React, { useRef } from "react";
import { ScreenShell, BackButton } from "../components/layout";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Input } from "../components/ui/Input.jsx";
import { PrimaryButton } from "../components/ui/Button.jsx";
import { CoinLogo } from "../components/coins";

export function CreateCoinPage({
  adSlot,
  onBack,
  tokenName,
  onTokenNameChange,
  symbol,
  onSymbolChange,
  story,
  onStoryChange,
  initialSol,
  onInitialSolChange,
  logoPreview,
  onLogoPick,
  creating = false,
  onCreate,
}) {
  const logoInputRef = useRef(null);

  return (
    <ScreenShell>
      <BackButton onClick={onBack} />

      {adSlot}

      <Card className="createCoinCard">
        <PageHeader title="Create Coin" />

        <div className="createCoinForm">
          <div className="createCoinField">
            <Input value={tokenName} onChange={(e) => onTokenNameChange?.(e.target.value)} placeholder="Token name" />
          </div>

          <div className="createCoinField">
            <Input
              value={symbol}
              onChange={(e) => onSymbolChange?.(e.target.value.toUpperCase())}
              placeholder="Symbol"
            />
          </div>

          <div className="createCoinField">
            <Input
              value={story}
              onChange={(e) => onStoryChange?.(e.target.value)}
              placeholder="Story / description"
              textarea
              rows={5}
            />
          </div>

          <div className="createCoinField">
            <Input
              value={initialSol}
              onChange={(e) => onInitialSolChange?.(e.target.value)}
              placeholder="Initial buy (SOL)"
              type="number"
            />
          </div>

          <div className="createCoinLogoPanel">
            <div className="createCoinLogoLabel">Logo</div>
            <input
              ref={logoInputRef}
              className="createCoinLogoInputNative"
              type="file"
              accept="image/*"
              onChange={(e) => {
                onLogoPick?.(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="createCoinLogoBtn"
              onClick={() => logoInputRef.current?.click()}
            >
              {logoPreview ? "Change Logo" : "Upload Logo"}
            </button>
            {logoPreview ? (
              <div className="createCoinLogoPreview">
                <CoinLogo c={{ logo: logoPreview, symbol }} size={80} radius={18} />
              </div>
            ) : (
              <div className="createCoinLogoHint">PNG / JPG · max 5MB</div>
            )}
          </div>

          <PrimaryButton className="createCoinSubmit" disabled={creating} onClick={onCreate}>
            {creating ? "Creating..." : "Create Coin"}
          </PrimaryButton>
        </div>
      </Card>
    </ScreenShell>
  );
}
