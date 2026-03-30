import React, { useEffect, useMemo, useState } from "react";

export default function IntroSplash({
  durationMs = 5000,
  onDone,
  logoUrl = "/logo.png",
}) {
  const [step, setStep] = useState(0); // 0 = logo, 1 = intro
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
    const logoTime = reduce ? 500 : 2000;

    const t0 = setTimeout(() => setStep(1), logoTime);
    const t1 = setTimeout(() => setLeaving(true), Math.max(0, total - 350));
    const t2 = setTimeout(() => {
      if (onDone) onDone();
    }, total);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [durationMs, onDone]);

  return (
    <>
      <div className={`frIntroRoot ${leaving ? "frIntroLeave" : ""}`}>
        <div className="frIntroGlow" />

        {step === 0 ? (
          <div className="frLogoStage">
            <img
              src={logoUrl}
              alt="logo"
              className="frMainLogo"
            />
          </div>
        ) : (
          <div className="frHeroShell">
            <div className="frHeroBg" />
            <div className="frHeroScan" />

            <div className="frHeroContent">
              <div className="frHeroTop">
                <div className="frBrandPill">
                  <span className="frDot" />
                  <span>LIVE</span>
                </div>
              </div>

              <div className="frHeroMain">
                <div className="frHeroLeft">
                  <div className="frBrandName">Fun.Run</div>

                  <h1 className="frIntroTitle">
                    Create. Launch.
                    <br />
                    Discover.
                  </h1>

                  <p className="frIntroSub">Creator-first meme coin launchpad</p>

                  <div className="frIntroBadges">
                    <span className="frBadge">Referral 20%</span>
                    <span className="frBadge frBadgeGold">Factory Mode</span>
                  </div>
                </div>

                <div className="frHeroRight">
                  <div className="frMachinePanel">
                    <div className="frScreenHeader">
                      <div className="frLogoBubble">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt="logo"
                            style={{
                              width: 26,
                              height: 26,
                              objectFit: "contain",
                              display: "block",
                            }}
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
                  </div>
                </div>
              </div>

              <div className="frBottomPillWrap">
                <div className="frFooterPill">Fun.Run • Creator-first launchpad</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .frIntroRoot{
          position: fixed;
          inset: 0;
          z-index: 999999;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          min-height: 100vh;
          height: 100vh;
          overflow: hidden;
          padding: 14px;
          background:
            radial-gradient(1200px 700px at 70% 40%, rgba(0,255,204,0.10), rgba(0,0,0,0.95) 60%),
            linear-gradient(180deg, rgba(0,0,0,0.82), rgba(0,0,0,0.95));
          transition: opacity .35s ease, transform .35s ease;
        }

        .frIntroLeave{
          opacity: 0;
          transform: scale(1.02);
          pointer-events: none;
        }

        .frLogoStage{
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
          background:
            radial-gradient(circle at center, rgba(0,255,204,0.08), transparent 32%),
            radial-gradient(circle at center, #091018, #000 72%);
        }

        .frMainLogo{
  width: min(380px, 80vw);
  height: min(380px, 80vw);
  object-fit: contain;
  display: block;
  filter:
    drop-shadow(0 0 18px rgba(0,255,204,0.28))
    drop-shadow(0 0 40px rgba(0,255,204,0.22))
    drop-shadow(0 0 70px rgba(255,0,180,0.18));
  animation: frLogoFloat 1.8s ease-in-out infinite alternate;
}

        @keyframes frLogoFloat{
          from{ transform: translateY(-4px) scale(1); }
          to{ transform: translateY(4px) scale(1.03); }
        }

        .frIntroGlow{
          position: absolute;
          inset: -40%;
          background:
            radial-gradient(circle at 35% 40%, rgba(255,170,0,0.10), transparent 55%),
            radial-gradient(circle at 70% 55%, rgba(0,255,204,0.10), transparent 55%);
          filter: blur(22px);
          animation: frGlowMove 4s ease-in-out infinite alternate;
          opacity: .9;
          pointer-events: none;
        }

        @keyframes frGlowMove{
          from{ transform: translate3d(-10px,-10px,0); }
          to{ transform: translate3d(14px,10px,0); }
        }

        .frHeroShell{
          position: relative;
          width: min(1120px, 100%);
          min-height: 100vh;
          border-radius: 32px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.10);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
          box-shadow:
            0 30px 80px rgba(0,0,0,0.45),
            inset 0 1px 0 rgba(255,255,255,0.06);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .frHeroBg{
          position: absolute;
          inset: -60px;
          background:
            radial-gradient(700px 420px at 18% 35%, rgba(0,255,204,0.13), transparent 60%),
            radial-gradient(700px 420px at 82% 72%, rgba(255,170,0,0.11), transparent 60%),
            radial-gradient(500px 280px at 55% 18%, rgba(0,255,204,0.08), transparent 60%);
          opacity: .95;
          animation: frBgDrift 4s ease-in-out infinite alternate;
          pointer-events: none;
        }

        @keyframes frBgDrift{
          from{ transform: translate3d(-8px,-6px,0); }
          to{ transform: translate3d(10px,8px,0); }
        }

        .frHeroScan{
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            180deg,
            rgba(255,255,255,0.025) 0px,
            rgba(255,255,255,0.025) 1px,
            transparent 2px,
            transparent 6px
          );
          opacity: .08;
          mix-blend-mode: overlay;
          pointer-events: none;
        }

        .frHeroContent{
          position: relative;
          z-index: 2;
          height: 100%;
          min-height: min(720px, 92vh);
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          padding: 20px 22px 28px;
        }

        .frHeroTop{
          display: flex;
          justify-content: flex-start;
          margin-bottom: 14px;
        }

        .frBrandPill{
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(0,255,204,0.30);
          background: rgba(0,255,204,0.08);
          color: rgba(210,255,245,0.95);
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          letter-spacing: .4px;
        }

        .frDot{
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(0,255,204,0.95);
          box-shadow: 0 0 12px rgba(0,255,204,0.7);
        }

        .frHeroMain{
          flex: 1;
          display: grid;
          grid-template-columns: 1.08fr 0.92fr;
          gap: 20px;
          align-items: flex-start;
        }

        .frHeroLeft{
          padding: 10px 6px 10px 2px;
        }

        .frBrandName{
          margin-top: 8px;
          color: rgba(255,255,255,0.98);
          font-size: clamp(26px, 4vw, 40px);
          font-weight: 950;
          letter-spacing: .2px;
        }

        .frIntroTitle{
          margin: 10px 0 8px;
          font-size: clamp(34px, 5.3vw, 64px);
          line-height: 1.02;
          font-weight: 800;
          letter-spacing: -0.8px;
          background: linear-gradient(
            90deg,
            rgba(0,255,204,1),
            rgba(160,255,110,1) 58%,
            rgba(255,170,0,1)
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
        }

        .frIntroSub{
          margin: 0 0 18px;
          color: rgba(255,255,255,0.76);
          font-size: 18px;
        }

        .frIntroBadges{
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
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

        .frHeroRight{
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .frMachinePanel{
          position: relative;
          width: 100%;
          max-width: 460px;
          min-height: 360px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          border-radius: 26px;
          padding: 18px;
          border: 1px solid rgba(255,255,255,0.10);
          background:
            linear-gradient(180deg, rgba(12,18,20,0.82), rgba(7,10,12,0.90));
          box-shadow:
            0 24px 60px rgba(0,0,0,0.30),
            inset 0 1px 0 rgba(255,255,255,0.06);
          overflow: hidden;
        }

        .frMachinePanel::before{
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(180px 90px at 20% 22%, rgba(0,255,204,0.10), transparent 60%),
            radial-gradient(180px 90px at 82% 78%, rgba(255,170,0,0.08), transparent 60%);
          pointer-events: none;
        }

        .frScreenHeader{
          position: relative;
          display: flex;
          gap: 12px;
          align-items: center;
          z-index: 2;
        }

        .frLogoBubble{
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 0 20px rgba(0,255,204,0.08);
          overflow: hidden;
          flex-shrink: 0;
        }

        .frHeaderText .frH1{
          color: rgba(255,255,255,0.94);
          font-weight: 850;
          font-size: 18px;
        }

        .frHeaderText .frH2{
          color: rgba(255,255,255,0.60);
          font-size: 12px;
          margin-top: 2px;
        }

        .frGearRow{
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin-top: 16px;
          margin-bottom: 10px;
          position: relative;
          z-index: 2;
        }

        .frGear{
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 0 10px rgba(255,255,255,0.08));
          opacity: .96;
          animation: frGearSpin 4s linear infinite;
        }

        .frGear1{ font-size: 24px; }
        .frGear2{ font-size: 34px; animation-duration: 5.4s; }
        .frGear3{ font-size: 24px; animation-duration: 3.2s; }

        @keyframes frGearSpin{
          from{ transform: rotate(0deg); }
          to{ transform: rotate(360deg); }
        }

        .frMintLine{
          position: relative;
          margin-top: 8px;
          z-index: 2;
        }

        .frMintLabel{
          display: flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
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
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(0,255,204,0.95);
          box-shadow: 0 0 12px rgba(0,255,204,0.65);
          animation: frPulse 1.1s ease-in-out infinite;
        }

        @keyframes frPulse{
          0%,100%{ transform: scale(1); opacity: .9; }
          50%{ transform: scale(1.35); opacity: 1; }
        }

        .frConveyor{
          position: relative;
          height: 54px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.10);
          background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
          overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
        }

        .frConveyor:before{
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(120px 60px at 18% 50%, rgba(0,255,204,0.10), transparent 60%),
            radial-gradient(120px 60px at 82% 50%, rgba(255,170,0,0.08), transparent 60%);
          opacity: .9;
          pointer-events: none;
        }

        .frTrack{
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 12px;
          white-space: nowrap;
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
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.18);
          box-shadow: 0 10px 18px rgba(0,0,0,0.25);
          opacity: .92;
          position: relative;
        }

        .frMemeChip:after{
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.20), transparent 60%);
          pointer-events: none;
        }

        .frGlowChip{
          box-shadow:
            0 10px 18px rgba(0,0,0,0.25),
            0 0 18px rgba(0,255,204,0.18);
        }

        .frConveyorShine{
          position: absolute;
          inset: -30% -10%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent);
          transform: translateX(-40%);
          animation: frShine 1.6s ease-in-out infinite;
          pointer-events: none;
          opacity: .6;
        }

        @keyframes frShine{
          0%{ transform: translateX(-40%); }
          100%{ transform: translateX(40%); }
        }

        .frProgress{
          margin-top: 14px;
          position: relative;
          z-index: 2;
        }

        .frBar{
          display: flex;
          gap: 6px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.03);
        }

        .frBar span{
          flex: 1;
          height: 16px;
          border-radius: 8px;
          background: rgba(255,255,255,0.06);
          overflow: hidden;
          position: relative;
        }

        .frBar span:after{
          content: "";
          position: absolute;
          inset: -2px;
          background: linear-gradient(90deg, transparent, rgba(0,255,204,0.35), transparent);
          transform: translateX(-120%);
          animation: frShimmer 1.1s ease-in-out infinite;
        }

        .frBar span:nth-child(2):after{ animation-delay: .05s; }
        .frBar span:nth-child(3):after{ animation-delay: .1s; }
        .frBar span:nth-child(4):after{ animation-delay: .15s; }
        .frBar span:nth-child(5):after{ animation-delay: .2s; }
        .frBar span:nth-child(6):after{ animation-delay: .25s; }
        .frBar span:nth-child(7):after{ animation-delay: .3s; }
        .frBar span:nth-child(8):after{ animation-delay: .35s; }
        .frBar span:nth-child(9):after{ animation-delay: .4s; }
        .frBar span:nth-child(10):after{ animation-delay: .45s; }

        @keyframes frShimmer{
          to{ transform: translateX(120%); }
        }

        .frLaunchRow{
          margin-top: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.03);
          position: relative;
          z-index: 2;
        }

        .frRocket{
          width: 34px;
          height: 34px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,170,0,0.10);
          border: 1px solid rgba(255,170,0,0.18);
          box-shadow: 0 0 20px rgba(255,170,0,0.10);
        }

        .frHint{
          color: rgba(255,255,255,0.68);
          font-size: 12px;
        }

        .frBottomPillWrap{
          display: flex;
          justify-content: center;
          margin-top: 18px;
        }

        .frFooterPill{
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 10px 14px;
          border-radius: 999px;
          font-size: 13px;
          color: rgba(255,255,255,0.86);
          letter-spacing: .2px;
          border: 1px solid rgba(255,255,255,0.12);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.05));
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow:
            0 18px 40px rgba(0,0,0,0.35),
            inset 0 1px 0 rgba(255,255,255,0.10);
          max-width: calc(100% - 28px);
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 899px){
          .frIntroRoot{
            align-items: flex-start;
            overflow-y: auto;
            padding: 10px;
          }

          .frIntroGlow{
            animation: none;
          }

          .frMainLogo{
            width: min(170px, 52vw);
            height: min(170px, 52vw);
          }

          .frHeroShell{
            width: 100%;
            min-height: auto;
            border-radius: 24px;
          }

          .frHeroContent{
            min-height: auto;
            padding: 12px 12px 14px;
          }

          .frHeroTop{
            margin-bottom: 6px;
            justify-content: center;
          }

          .frHeroMain{
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .frHeroLeft{
            text-align: center;
            padding: 0;
            margin-top: -2px;
          }

          .frBrandName{
            margin-top: 4px;
            font-size: 24px;
          }

          .frIntroTitle{
            margin: 6px 0 6px;
            font-size: clamp(28px, 8.2vw, 40px);
            line-height: 1.04;
            font-weight: 800;
            letter-spacing: -0.6px;
          }

          .frIntroSub{
            margin: 0 0 10px;
            font-size: 13px;
          }

          .frIntroBadges{
            justify-content: center;
            gap: 8px;
          }

          .frBadge{
            font-size: 11px;
            padding: 6px 10px;
          }

          .frHeroRight{
            width: 100%;
            margin-top: -2px;
          }

          .frMachinePanel{
            max-width: none;
            width: 100%;
            min-height: 540px;
            border-radius: 22px;
            padding: 16px 14px 18px;
            transform: translateY(-8px) scale(1.04);
            transform-origin: top center;
          }

          .frHeaderText .frH1{
            font-size: 16px;
          }

          .frHeaderText .frH2{
            font-size: 11px;
          }

          .frGearRow{
            margin-top: 8px;
            margin-bottom: 6px;
          }

          .frGear1{ font-size: 22px; }
          .frGear2{ font-size: 30px; }
          .frGear3{ font-size: 22px; }

          .frMintLine{
            margin-top: 4px;
          }

          .frConveyor{
            height: 48px;
            border-radius: 14px;
          }

          .frTrack{
            gap: 10px;
            padding: 0 10px;
          }

          .frMemeChip{
            width: 25px;
            height: 25px;
          }

          .frProgress{
            margin-top: 10px;
          }

          .frBar{
            padding: 10px;
            gap: 5px;
          }

          .frBar span{
            height: 13px;
          }

          .frLaunchRow{
            margin-top: 10px;
            padding: 10px;
          }

          .frRocket{
            width: 30px;
            height: 30px;
          }

          .frBottomPillWrap{
            margin-top: 10px;
          }

          .frFooterPill{
            font-size: 12px;
            padding: 9px 12px;
          }
        }

        @media (prefers-reduced-motion: reduce){
          .frIntroGlow,
          .frHeroBg,
          .frGear,
          .frTrackA,
          .frTrackB,
          .frConveyorShine,
          .frMainLogo{
            animation: none !important;
          }

          .frBar span:after{
            animation-duration: .7s;
          }
        }
      `}</style>
    </>
  );
}