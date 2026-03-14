import React, { useEffect, useMemo, useState } from "react";

export default function IntroSplash({ durationMs = 5000, onDone, logoUrl = "/logo.png" }) {
  const [leaving, setLeaving] = useState(false);

  const mintRow = useMemo(() => {
    const icons = ["🐶", "🐸", "🪙", "💎", "🚀", "🔥", "😂", "👑", "🍌", "🧠"];
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      icon: icons[i % icons.length],
      size: 16 + ((i % 3) * 2),
      glow: i % 4 === 0,
    }));
  }, []);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const total = reduce ? 1200 : durationMs;

    const t1 = setTimeout(() => setLeaving(true), Math.max(0, total - 350));
    const t2 = setTimeout(() => {
      if (onDone) onDone();
    }, total);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [durationMs, onDone]);

  return (
    <div className={`frIntroRoot ${leaving ? "frIntroLeave" : ""}`}>
      <div className="frIntroGlow" />

      <div className="frIntroWrap">
        <div className="frIntroLeft">
          <div className="frBrandPill">
            <span className="frDot" />
            <span>LIVE</span>
          </div>

          <div className="frBrandName">Fun.Run</div>

          <h1 className="frIntroTitle">
            Create.
            <br />
            Launch.
            <br />
            Discover.
          </h1>

          <p className="frIntroSub">Creator-first meme coin launchpad</p>

          <div className="frIntroBadges">
            <span className="frBadge">Referral 20%</span>
            <span className="frBadge frBadgeGold">Factory Mode</span>
          </div>
        </div>

        <div className="frIntroRight">
          <div className="frPhoneStage">
            <div className="frPhone">
              <div className="frPhoneTop">
                <div className="frCam" />
                <div className="frSpeaker" />
              </div>

              <div className="frScreen">
                <div className="frMachineBg" />
                <div className="frScanLines" />

                <div className="frScreenHeader">
                  <div className="frLogoBubble">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="logo"
                        style={{ width: 24, height: 24, objectFit: "contain", display: "block" }}
                      />
                    ) : (
                      "🧪"
                    )}
                  </div>

                  <div className="frHeaderText">
                    <div className="frH1">Cooking memes…</div>
                    <div className="frH2">factory running • coins printing</div>
                  </div>
                </div>

                <div className="frGearRow">
                  <div className="frGear frGear1">⚙️</div>
                  <div className="frGear frGear2">⚙️</div>
                  <div className="frGear frGear3">⚙️</div>
                </div>

                <div className="frMintLine">
                  <div className="frMintLabel">
                    <span className="frPulseDot" />
                    minting line
                  </div>

                  <div className="frConveyor">
                    <div className="frTrack frTrackA" aria-hidden="true">
                      {mintRow.map((c) => (
                        <div
                          key={`a-${c.id}`}
                          className={`frMemeChip ${c.glow ? "frGlowChip" : ""}`}
                          style={{ fontSize: c.size }}
                          title="meme coin"
                        >
                          {c.icon}
                        </div>
                      ))}
                    </div>

                    <div className="frTrack frTrackB" aria-hidden="true">
                      {mintRow.map((c) => (
                        <div
                          key={`b-${c.id}`}
                          className={`frMemeChip ${c.glow ? "frGlowChip" : ""}`}
                          style={{ fontSize: c.size }}
                          title="meme coin"
                        >
                          {c.icon}
                        </div>
                      ))}
                    </div>

                    <div className="frConveyorShine" />
                  </div>
                </div>

                <div className="frProgress">
                  <div className="frBar">
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <span key={idx} />
                    ))}
                  </div>
                </div>

                <div className="frLaunchRow">
                  <div className="frRocket">🚀</div>
                  <div className="frHint">launchpad warming up</div>
                </div>

                <div className="frScreenFooter">
                  <div className="frFooterPill">Fun.Run • Creator-first launchpad</div>
                </div>
              </div>
            </div>

            <div className="frStageShadow" />
          </div>
        </div>
      </div>

      <style>{`
        .frIntroRoot{
          position:fixed;
          inset:0;
          z-index:999999;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
          padding:14px;
          background:
            radial-gradient(1200px 700px at 70% 40%, rgba(0,255,204,0.10), rgba(0,0,0,0.95) 60%),
            linear-gradient(180deg, rgba(0,0,0,0.82), rgba(0,0,0,0.95));
          transition: opacity .35s ease, transform .35s ease;
        }
        .frIntroLeave{
          opacity:0;
          transform: scale(1.02);
          pointer-events:none;
        }

        .frIntroGlow{
          position:absolute;
          inset:-40%;
          background:
            radial-gradient(circle at 35% 40%, rgba(255,170,0,0.10), transparent 55%),
            radial-gradient(circle at 70% 55%, rgba(0,255,204,0.10), transparent 55%);
          filter: blur(22px);
          animation: frGlowMove 4s ease-in-out infinite alternate;
          opacity:.9;
          pointer-events:none;
        }
        @keyframes frGlowMove{
          from{ transform: translate3d(-10px,-10px,0); }
          to{ transform: translate3d(14px,10px,0); }
        }

        .frIntroWrap{
          position:relative;
          width:min(1080px, 100%);
          display:grid;
          grid-template-columns: 1fr;
          gap:18px;
          align-items:center;
        }
        @media (min-width: 900px){
          .frIntroWrap{
            grid-template-columns: 1.05fr 0.95fr;
            gap:28px;
          }
        }

        .frIntroLeft{
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 18px;
          backdrop-filter: blur(10px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.35);
        }
      @media (max-width: 899px){
  .frIntroWrap{
    display:flex;
    flex-direction:column;
    justify-content:flex-start;
    align-items:center;
    gap:10px;

    
  }

  .frIntroLeft{
    order:1;
    width:min(360px, 92vw);
    text-align:center;
    padding:14px 14px 10px;
  }

  .frIntroRight{
    order:2;
  }

  .frPhoneStage{
    width:min(360px, 92vw);
  }
}

        .frBrandPill{
          display:inline-flex;
          align-items:center;
          gap:8px;
          border:1px solid rgba(0,255,204,0.30);
          background: rgba(0,255,204,0.08);
          color: rgba(210,255,245,0.95);
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          letter-spacing: .4px;
        }
        .frDot{
          width:8px;
          height:8px;
          border-radius:50%;
          background: rgba(0,255,204,0.95);
          box-shadow: 0 0 12px rgba(0,255,204,0.7);
        }

        .frBrandName{
          margin-top:14px;
          color: rgba(255,255,255,0.98);
          font-size: clamp(22px, 4vw, 34px);
          font-weight: 950;
          letter-spacing: .2px;
        }

        .frIntroTitle{
          margin:10px 0 8px;
          font-size: clamp(30px, 6vw, 54px);
          line-height: 1.02;
          font-weight: 950;
          background: linear-gradient(90deg, rgba(0,255,204,1), rgba(255,170,0,1));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .frIntroSub{
          margin: 0 0 14px;
          color: rgba(255,255,255,0.75);
          font-size: 14px;
        }

        .frIntroBadges{
          display:flex;
          gap:10px;
          flex-wrap:wrap;
        }
        @media (max-width: 899px){
          .frIntroBadges{
            justify-content:center;
          }
        }

        .frBadge{
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.85);
        }
        .frBadgeGold{
          border-color: rgba(255,170,0,0.30);
          background: rgba(255,170,0,0.10);
          color: rgba(255,220,170,0.95);
        }

        .frIntroRight{
          display:flex;
          justify-content:center;
          align-items:center;
        }

        .frPhoneStage{
          position:relative;
          width:min(380px, 94vw);
          aspect-ratio: 9 / 16;
          display:flex;
          align-items:center;
          justify-content:center;
          perspective: 1100px;
        }

        .frPhone{
          width:100%;
          height:100%;
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 28px 70px rgba(0,0,0,0.45);
          overflow:hidden;
          position:relative;
          transform: rotateY(-8deg) rotateX(5deg);
        }
        @media (max-width: 899px){
          .frPhone{
            transform:none;
          }
        }

        .frPhoneTop{
          position:absolute;
          top:10px;
          left:50%;
          transform: translateX(-50%);
          display:flex;
          align-items:center;
          gap:10px;
          opacity:.8;
          z-index:5;
        }
        .frCam{
          width:10px;
          height:10px;
          border-radius:50%;
          background: rgba(0,0,0,0.6);
          border:1px solid rgba(255,255,255,0.08);
        }
        .frSpeaker{
          width:44px;
          height:6px;
          border-radius:999px;
          background: rgba(0,0,0,0.5);
          border:1px solid rgba(255,255,255,0.07);
        }

        .frScreen{
          position:absolute;
          inset:0;
          padding: 18px 14px;
          background:
            radial-gradient(700px 420px at 60% 20%, rgba(0,255,204,0.14), transparent 60%),
            radial-gradient(700px 420px at 30% 70%, rgba(255,170,0,0.10), transparent 60%),
            linear-gradient(180deg, rgba(10,14,18,0.92), rgba(6,8,10,0.97));
        }

        .frMachineBg{
          position:absolute;
          inset:-40px;
          background:
            radial-gradient(600px 360px at 20% 30%, rgba(0,255,204,0.10), transparent 55%),
            radial-gradient(600px 360px at 80% 70%, rgba(255,170,0,0.08), transparent 55%);
          opacity:.75;
          animation: frBgDrift 3.6s ease-in-out infinite alternate;
          pointer-events:none;
        }
        @keyframes frBgDrift{
          from{ transform: translate3d(-8px,-6px,0); }
          to{ transform: translate3d(10px,8px,0); }
        }

        .frScanLines{
          position:absolute;
          inset:0;
          background: repeating-linear-gradient(
            180deg,
            rgba(255,255,255,0.03) 0px,
            rgba(255,255,255,0.03) 1px,
            transparent 2px,
            transparent 6px
          );
          opacity:.09;
          mix-blend-mode: overlay;
          pointer-events:none;
        }

        .frScreenHeader{
          position:relative;
          display:flex;
          gap:12px;
          align-items:center;
          margin-top:18px;
          z-index:2;
        }

        .frLogoBubble{
          width:42px;
          height:42px;
          border-radius:14px;
          display:flex;
          align-items:center;
          justify-content:center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 0 20px rgba(0,255,204,0.08);
          overflow:hidden;
          flex-shrink:0;
        }

        .frHeaderText .frH1{
          color: rgba(255,255,255,0.92);
          font-weight: 800;
          font-size: 16px;
        }
        .frHeaderText .frH2{
          color: rgba(255,255,255,0.60);
          font-size: 12px;
          margin-top:2px;
        }

        .frGearRow{
          display:flex;
          justify-content:center;
          align-items:center;
          gap:10px;
          margin-top:14px;
          margin-bottom:8px;
          position:relative;
          z-index:2;
        }

        .frGear{
          display:flex;
          align-items:center;
          justify-content:center;
          filter: drop-shadow(0 0 10px rgba(255,255,255,0.08));
          opacity:.95;
          animation: frGearSpin 4s linear infinite;
        }
        .frGear1{ font-size:24px; }
        .frGear2{ font-size:32px; animation-duration: 5.4s; }
        .frGear3{ font-size:22px; animation-duration: 3.2s; }

        @keyframes frGearSpin{
          from{ transform: rotate(0deg); }
          to{ transform: rotate(360deg); }
        }

        .frMintLine{
          position:relative;
          margin-top: 8px;
          z-index:2;
        }

        .frMintLabel{
          display:flex;
          align-items:center;
          gap:8px;
          width:fit-content;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(0,255,204,0.18);
          background: rgba(0,255,204,0.07);
          color: rgba(210,255,245,0.92);
          font-size: 12px;
          letter-spacing: .25px;
          margin-bottom: 8px;
        }

        .frPulseDot{
          width:7px;
          height:7px;
          border-radius:50%;
          background: rgba(0,255,204,0.95);
          box-shadow: 0 0 12px rgba(0,255,204,0.65);
          animation: frPulse 1.1s ease-in-out infinite;
        }
        @keyframes frPulse{
          0%,100%{ transform: scale(1); opacity:.9; }
          50%{ transform: scale(1.35); opacity:1; }
        }

        .frConveyor{
          position:relative;
          height:46px;
          border-radius:16px;
          border: 1px solid rgba(255,255,255,0.10);
          background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
          overflow:hidden;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
        }

        .frConveyor:before{
          content:"";
          position:absolute;
          inset:0;
          background:
            radial-gradient(120px 60px at 18% 50%, rgba(0,255,204,0.10), transparent 60%),
            radial-gradient(120px 60px at 82% 50%, rgba(255,170,0,0.08), transparent 60%);
          opacity:.9;
          pointer-events:none;
        }

        .frTrack{
          position:absolute;
          top:50%;
          transform: translateY(-50%);
          display:flex;
          align-items:center;
          gap:12px;
          padding:0 12px;
          white-space:nowrap;
          will-change: transform;
        }

        .frTrackA{ animation: frConveyorMove 5.4s linear infinite; }
        .frTrackB{ animation: frConveyorMove2 5.4s linear infinite; }

        @keyframes frConveyorMove{
          from{ transform: translate3d(0, -50%, 0); }
          to{ transform: translate3d(-50%, -50%, 0); }
        }
        @keyframes frConveyorMove2{
          from{ transform: translate3d(50%, -50%, 0); }
          to{ transform: translate3d(0, -50%, 0); }
        }

        .frMemeChip{
          width:28px;
          height:28px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:999px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.18);
          box-shadow: 0 10px 18px rgba(0,0,0,0.25);
          opacity:.92;
          position:relative;
        }

        .frMemeChip:after{
          content:"";
          position:absolute;
          inset:0;
          border-radius:999px;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.20), transparent 60%);
          pointer-events:none;
        }

        .frGlowChip{
          box-shadow:
            0 10px 18px rgba(0,0,0,0.25),
            0 0 18px rgba(0,255,204,0.18);
        }

        .frConveyorShine{
          position:absolute;
          inset:-30% -10%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent);
          transform: translateX(-40%);
          animation: frShine 1.6s ease-in-out infinite;
          pointer-events:none;
          opacity:.6;
        }
        @keyframes frShine{
          0%{ transform: translateX(-40%); }
          100%{ transform: translateX(40%); }
        }

        .frProgress{
          margin-top:14px;
          position:relative;
          z-index:2;
        }

        .frBar{
          display:flex;
          gap:6px;
          padding:12px;
          border-radius:16px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.03);
        }

        .frBar span{
          flex:1;
          height:16px;
          border-radius:8px;
          background: rgba(255,255,255,0.06);
          overflow:hidden;
          position:relative;
        }

        .frBar span:after{
          content:"";
          position:absolute;
          inset:-2px;
          background: linear-gradient(90deg, transparent, rgba(0,255,204,0.35), transparent);
          transform: translateX(-120%);
          animation: frShimmer 1.1s ease-in-out infinite;
        }
        .frBar span:nth-child(2):after{ animation-delay:.05s; }
        .frBar span:nth-child(3):after{ animation-delay:.1s; }
        .frBar span:nth-child(4):after{ animation-delay:.15s; }
        .frBar span:nth-child(5):after{ animation-delay:.2s; }
        .frBar span:nth-child(6):after{ animation-delay:.25s; }
        .frBar span:nth-child(7):after{ animation-delay:.3s; }
        .frBar span:nth-child(8):after{ animation-delay:.35s; }
        .frBar span:nth-child(9):after{ animation-delay:.4s; }
        .frBar span:nth-child(10):after{ animation-delay:.45s; }

        @keyframes frShimmer{
          to{ transform: translateX(120%); }
        }

        .frLaunchRow{
          margin-top:14px;
          display:flex;
          align-items:center;
          gap:10px;
          padding:12px;
          border-radius:16px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.03);
          position:relative;
          z-index:2;
        }

        .frRocket{
          width:34px;
          height:34px;
          border-radius:12px;
          display:flex;
          align-items:center;
          justify-content:center;
          background: rgba(255,170,0,0.10);
          border: 1px solid rgba(255,170,0,0.18);
          box-shadow: 0 0 20px rgba(255,170,0,0.10);
        }

        .frHint{
          color: rgba(255,255,255,0.68);
          font-size: 12px;
        }

        .frScreenFooter{
          position:absolute;
          left:0;
          right:0;
          bottom:18px;
          display:flex;
          justify-content:center;
          z-index:2;
          pointer-events:none;
        }

        .frFooterPill{
          padding: 10px 14px;
          border-radius: 999px;
          font-size: 13px;
          color: rgba(255,255,255,0.86);
          letter-spacing: .2px;
          border: 1px solid rgba(255,255,255,0.12);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.05));
          backdrop-filter: blur(12px);
          box-shadow:
            0 18px 40px rgba(0,0,0,0.35),
            inset 0 1px 0 rgba(255,255,255,0.10);
          max-width: calc(100% - 28px);
          text-align:center;
          white-space: nowrap;
          overflow:hidden;
          text-overflow: ellipsis;
        }

        .frStageShadow{
          position:absolute;
          bottom:-18px;
          left:12%;
          width:76%;
          height:34px;
          background: radial-gradient(closest-side, rgba(0,0,0,0.55), transparent 70%);
          filter: blur(6px);
          opacity:.8;
          transform: rotateX(70deg);
        }

        @media (max-width: 899px){
          .frIntroGlow{ animation:none; }

          .frIntroWrap{
            gap:14px;
          }

          .frPhoneStage{
            width:min(360px, 92vw);
          }

          .frScreen{
            padding:16px 12px;
          }

          .frScreenHeader{
            margin-top:14px;
          }

          .frBrandName{
            margin-top:12px;
          }

          .frIntroTitle{
            font-size: clamp(28px, 9vw, 42px);
          }

          .frIntroSub{
            font-size:13px;
          }

          .frFooterPill{
            font-size:12px;
          }
        }

        @media (prefers-reduced-motion: reduce){
          .frIntroGlow,
          .frMachineBg,
          .frGear,
          .frTrackA,
          .frTrackB,
          .frConveyorShine{
            animation:none !important;
          }
          .frBar span:after{
            animation-duration:.7s;
          }
        }
      `}</style>
    </div>
  );
}