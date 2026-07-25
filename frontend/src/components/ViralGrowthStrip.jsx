import React from "react";
import { MiniBtn } from "./ui/Button.jsx";

/**
 * Growth strip — share / invite / create (no external DEX).
 */
export function ViralGrowthStrip({
  variant = "home",
  onCreate,
  onInvite,
  onShare,
  className = "",
}) {
  if (variant === "coin") {
    return (
      <div className={`viralStrip viralStrip--coin ${className}`.trim()}>
        <div className="viralStripCopy">
          <div className="viralStripTitle">Pump dikhao · doston ko bulao</div>
          <div className="viralStripSub">
            Share card X/FB pe post karo. Invite pe referrer ko <b>50,000 RUN</b> milta hai.
          </div>
        </div>
        <div className="viralStripActions">
          {onShare ? (
            <MiniBtn tone="good" className="viralStripBtn" onClick={onShare}>
              Share card
            </MiniBtn>
          ) : null}
          {onInvite ? (
            <MiniBtn className="viralStripBtn" onClick={onInvite}>
              Copy invite
            </MiniBtn>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`viralStrip viralStrip--home ${className}`.trim()}>
      <div className="viralStripCopy">
        <div className="viralStripTitle">Naye users = free RUN</div>
        <div className="viralStripSub">
          Coin banao, trade karo, share card post karo. Har successful invite pe{" "}
          <b>50,000 RUN</b> — pehle 25k users ko signup airdrop bhi.
        </div>
      </div>
      <div className="viralStripActions">
        {onCreate ? (
          <MiniBtn tone="good" className="viralStripBtn" onClick={onCreate}>
            Create coin
          </MiniBtn>
        ) : null}
        {onInvite ? (
          <MiniBtn className="viralStripBtn" onClick={onInvite}>
            Copy invite link
          </MiniBtn>
        ) : null}
      </div>
    </div>
  );
}
