import React from "react";
import { ScreenShell, BackButton } from "../components/layout";
import { PageHeader } from "../components/layout/PageHeader.jsx";
import { Card } from "../components/ui/Card.jsx";
import { MiniBtn } from "../components/ui/Button.jsx";
import { ThemeOption } from "../components/settings/ThemeOption.jsx";

const DARK_THEMES = [
  { id: "calm", label: "Midnight" },
  { id: "ocean", label: "Ocean" },
  { id: "royal", label: "Royal" },
  { id: "neon", label: "Neon" },
  { id: "rose", label: "Rose" },
];

const LIGHT_THEMES = [
  { id: "light", label: "Daylight" },
  { id: "paper", label: "Paper" },
];

export function SettingsPage({
  onBack,
  theme,
  onThemeChange,
  authenticated = false,
  isAdmin = false,
  onOpenAdmin,
  onLogin,
  onLogout,
  phantomWallet = "",
  onConnectPhantom,
  onDisconnectPhantom,
  connectingPhantom = false,
  onCopyWallet,
  onCopyReferral,
  onExportWallet,
  shortWallet,
}) {
  return (
    <ScreenShell>
      <BackButton onClick={onBack} />

      <Card className="settingsCard">
        <PageHeader title="Settings" />

        <div className="settingsSection">
          <div>
            <div className="settingsSectionLabel">Theme</div>
            <div className="themeGrid">
              <div className="themeGroupLabel">Dark</div>
              {DARK_THEMES.map((item) => (
                <ThemeOption
                  key={item.id}
                  theme={item.id}
                  current={theme}
                  setTheme={onThemeChange}
                  label={item.label}
                />
              ))}
              <div className="themeGroupLabel">Light</div>
              {LIGHT_THEMES.map((item) => (
                <ThemeOption
                  key={item.id}
                  theme={item.id}
                  current={theme}
                  setTheme={onThemeChange}
                  label={item.label}
                />
              ))}
            </div>
          </div>

          <div className="settingsDivider" />

          <div>
            <div className="settingsSectionLabel">Grow Fun.Run</div>
            <p className="settingsAccountHint">
              Invite link share karo — har bind pe referrer ko 50,000 RUN. Google logout ki zaroorat nahi; Phantom yahan link ho sakta hai.
            </p>
            <div className="settingsActions">
              <MiniBtn tone="good" onClick={onCopyReferral}>
                Copy invite link (50k RUN)
              </MiniBtn>
            </div>
          </div>

          <div className="settingsDivider" />

          <div>
            <div className="settingsSectionLabel">Account</div>
            <div className="settingsActions">
              {!authenticated ? (
                <>
                  <MiniBtn tone="good" onClick={onLogin}>
                    Google Login
                  </MiniBtn>
                  <MiniBtn tone="good" onClick={onConnectPhantom} disabled={connectingPhantom}>
                    {connectingPhantom ? "Opening Phantom…" : "Continue with Phantom"}
                  </MiniBtn>
                </>
              ) : null}

              {authenticated && !phantomWallet ? (
                <MiniBtn tone="good" onClick={onConnectPhantom} disabled={connectingPhantom}>
                  {connectingPhantom ? "Connecting…" : "Connect Phantom"}
                </MiniBtn>
              ) : null}

              {phantomWallet ? (
                <MiniBtn tone="good">
                  Phantom linked · {shortWallet?.(phantomWallet) || phantomWallet}
                </MiniBtn>
              ) : null}

              <MiniBtn onClick={onCopyWallet}>Copy Wallet Address</MiniBtn>
              <MiniBtn onClick={onCopyReferral}>Copy Referral Link</MiniBtn>
              <MiniBtn onClick={onExportWallet}>Export Wallet</MiniBtn>

              {isAdmin && onOpenAdmin ? (
                <MiniBtn tone="good" onClick={onOpenAdmin}>
                  Admin Console
                </MiniBtn>
              ) : null}

              {phantomWallet ? (
                <MiniBtn tone="danger" onClick={onDisconnectPhantom}>
                  Disconnect Phantom
                </MiniBtn>
              ) : null}

              {authenticated ? (
                <MiniBtn tone="danger" onClick={onLogout}>
                  Google Logout
                </MiniBtn>
              ) : null}
            </div>
          </div>
        </div>
      </Card>
    </ScreenShell>
  );
}
