import React, { useEffect, useMemo, useState } from "react";

/**
 * IntroSplash (Mobile-first)
 * ✅ Factory feel: "machine/conveyor" inside phone
 * ✅ Meme coins mint in ONE LINE and move like conveyor (no flying to user)
 * ✅ Bottom text inside phone screen (glass)
 * - 5s splash
 * - silent
 * - Call onDone() when finished
 */
export default function IntroSplash({ durationMs = 8000, onDone }) {
  const [leaving, setLeaving] = useState(false);

  // ONE LINE "meme coins" (emoji placeholders for now, can swap with real logos later)
  const mintRow = useMemo(() => {
    const icons = ["🐶", "🐸", "🪙", "💎", "🚀", "🔥", "😂", "😈", "👑", "💀", "🧠", "🦴"];
    // repeat to make a long conveyor loop
    const list = [];
    for (let i = 0; i < 24; i++) {
      const icon = icons[i % icons.length];
      // slight variety in size/brightness but still "clean"
      const size = 16 + ((i % 3) * 2); // 16/18/20
      const glow = i % 4 === 0 ? 1 : 0;
      list.push({ id: i, icon, size, glow });
    }
    return list;
  }, []);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const total = reduce ? 1200 : durationMs;

    const t1 = setTimeout(() => setLeaving(true), Math.max(0, total - 350));
    const t2 = setTimeout(() => onDone && onDone(), total);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [durationMs, onDone]);

  return (
    <div className={`introRoot ${leaving ? "introLeave" : ""}`}>
      <div className="introGlow" />

      <div className="introWrap">
        <div className="introCenter">
          <div className="phoneStage">
            <div className="phone">
              <div className="phoneTop">
                <div className="cam" />
                <div className="speaker" />
              </div>

              <div className="screen">
                {/* subtle machine background (moving) */}
                <div className="machineBg" aria-hidden="true" />
                <div className="scanLines" aria-hidden="true" />

                <div className="screenHeader">
                  <div className="logoBubble">🧪</div>
                  <div className="headerText">
                    <div className="h1">Cooking memes…</div>
                    <div className="h2">chains running • coins printing</div>
                  </div>
                </div>

                {/* FACTORY / CONVEYOR: single line coins minting */}
                <div className="mintLine">
                  <div className="mintLabel">
                    <span className="pulseDot" />
                    minting line
                  </div>

                  <div className="conveyor">
                    {/* two tracks for seamless loop */}
                    <div className="track trackA" aria-hidden="true">
                      {mintRow.map((c) => (
                        <div
                          key={`a-${c.id}`}
                          className={`memeChip ${c.glow ? "glow" : ""}`}
                          style={{ fontSize: c.size }}
                          title="meme coin"
                        >
                          {c.icon}
                        </div>
                      ))}
                    </div>
                    <div className="track trackB" aria-hidden="true">
                      {mintRow.map((c) => (
                        <div
                          key={`b-${c.id}`}
                          className={`memeChip ${c.glow ? "glow" : ""}`}
                          style={{ fontSize: c.size }}
                          title="meme coin"
                        >
                          {c.icon}
                        </div>
                      ))}
                    </div>

                    {/* conveyor edges shine */}
                    <div className="conveyorShine" aria-hidden="true" />
                  </div>
                </div>

                <div className="progress">
                  <div className="bar">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <div className="launchRow">
                  <div className="rocket">🚀</div>
                  <div className="hint">launchpad warming up</div>
                </div>

                {/* Bottom text INSIDE phone screen */}
                <div className="screenFooter">
                  <div className="footerPill">
                    enjoy you time with memes and fun.run
                  </div>
                </div>
              </div>
            </div>

            <div className="stageShadow" />
          </div>
        </div>
      </div>

      <style>{`
        .introRoot{
          position:fixed; inset:0;
          z-index:9999;
          display:flex;
          align-items:center;
          justify-content:center;
          background:
            radial-gradient(1200px 700px at 70% 40%, rgba(0,255,204,0.10), rgba(0,0,0,0.95) 60%),
            linear-gradient(180deg, rgba(0,0,0,0.82), rgba(0,0,0,0.95));
          overflow:hidden;
          padding:16px;
          transition: opacity .35s ease, transform .35s ease;
        }
        .introLeave{ opacity:0; transform: scale(1.02); pointer-events:none; }

        .introGlow{
          position:absolute; inset:-40%;
          background:
            radial-gradient(circle at 35% 40%, rgba(255,170,0,0.10), transparent 55%),
            radial-gradient(circle at 70% 55%, rgba(0,255,204,0.10), transparent 55%);
          filter: blur(20px);
          animation: glowMove 4s ease-in-out infinite alternate;
          opacity: .9;
          pointer-events:none;
        }
        @keyframes glowMove {
          from{ transform: translate3d(-10px,-10px,0)}
          to { transform: translate3d(14px,10px,0)}
        }

        .introWrap{
          position:relative;
          width:min(980px, 100%);
          display:flex;
          justify-content:center;
          align-items:center;
        }

        .introCenter{
          display:flex;
          flex-direction:column;
          align-items:center;
          width:100%;
        }

        .phoneStage{
          position:relative;
          width: min(420px, 96vw);
          aspect-ratio: 9 / 16;
          display:flex;
          align-items:center;
          justify-content:center;
          perspective: 1200px;
        }

        .phone{
          width: 100%;
          height: 100%;
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 28px 70px rgba(0,0,0,0.45);
          transform: none;
          overflow:hidden;
          position:relative;
          z-index: 20;
          animation: phoneIn .55s ease-out both;
        }
        @keyframes phoneIn{
          from{ opacity:0; transform: translateY(16px) scale(.98); }
          to{ opacity:1; transform: translateY(0) scale(1); }
        }

        .phoneTop{
          position:absolute; top:10px; left:50%;
          transform: translateX(-50%);
          display:flex; align-items:center; gap:10px;
          opacity:.8;
          z-index: 25;
        }
        .cam{
          width:10px; height:10px; border-radius:50%;
          background: rgba(0,0,0,0.6);
          border:1px solid rgba(255,255,255,0.08);
        }
        .speaker{
          width:44px; height:6px; border-radius:999px;
          background: rgba(0,0,0,0.5);
          border:1px solid rgba(255,255,255,0.07);
        }

        .screen{
          position:absolute; inset:0;
          padding: 18px 14px;
          background:
            radial-gradient(700px 420px at 60% 20%, rgba(0,255,204,0.14), transparent 60%),
            radial-gradient(700px 420px at 30% 70%, rgba(255,170,0,0.10), transparent 60%),
            linear-gradient(180deg, rgba(10,14,18,0.9), rgba(6,8,10,0.95));
        }

        /* Machine background movement */
        .machineBg{
          position:absolute; inset:-40px;
          background:
            radial-gradient(600px 360px at 20% 30%, rgba(0,255,204,0.10), transparent 55%),
            radial-gradient(600px 360px at 80% 70%, rgba(255,170,0,0.08), transparent 55%),
            linear-gradient(120deg, rgba(255,255,255,0.02), rgba(0,0,0,0) 40%, rgba(255,255,255,0.02) 70%, rgba(0,0,0,0));
          opacity: .75;
          filter: blur(0px);
          animation: bgDrift 3.6s ease-in-out infinite alternate;
          pointer-events:none;
        }
        @keyframes bgDrift{
          from{ transform: translate3d(-8px,-6px,0); }
          to{ transform: translate3d(10px,8px,0); }
        }

        /* Subtle scan lines */
        .scanLines{
          position:absolute; inset:0;
          background: repeating-linear-gradient(
            180deg,
            rgba(255,255,255,0.03) 0px,
            rgba(255,255,255,0.03) 1px,
            transparent 2px,
            transparent 6px
          );
          opacity: .09;
          mix-blend-mode: overlay;
          pointer-events:none;
        }

        .screenHeader{
          position:relative;
          display:flex; gap:12px; align-items:center;
          margin-top: 18px;
          z-index: 2;
        }
        .logoBubble{
          width:42px; height:42px; border-radius:14px;
          display:flex; align-items:center; justify-content:center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 0 20px rgba(0,255,204,0.08);
          font-size: 18px;
        }
        .headerText .h1{ color: rgba(255,255,255,0.92); font-weight: 800; font-size: 16px; }
        .headerText .h2{ color: rgba(255,255,255,0.60); font-size: 12px; margin-top:2px; }

        /* Mint line (factory conveyor) */
        .mintLine{
          position:relative;
          margin-top: 14px;
          z-index: 2;
        }

        .mintLabel{
          display:flex; align-items:center; gap:8px;
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
        .pulseDot{
          width:7px; height:7px; border-radius:50%;
          background: rgba(0,255,204,0.95);
          box-shadow: 0 0 12px rgba(0,255,204,0.65);
          animation: pulse 1.1s ease-in-out infinite;
        }
        @keyframes pulse{
          0%,100%{ transform: scale(1); opacity: .9; }
          50%{ transform: scale(1.35); opacity: 1; }
        }

        .conveyor{
          position:relative;
          height: 46px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.10);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
          overflow:hidden; /* IMPORTANT: keep inside phone */
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
        }

        .conveyor:before{
          content:"";
          position:absolute; inset:0;
          background:
            radial-gradient(120px 60px at 18% 50%, rgba(0,255,204,0.10), transparent 60%),
            radial-gradient(120px 60px at 82% 50%, rgba(255,170,0,0.08), transparent 60%);
          opacity: .9;
          pointer-events:none;
        }

        .track{
          position:absolute;
          top: 50%;
          transform: translateY(-50%);
          display:flex;
          align-items:center;
          gap: 12px;
          padding: 0 12px;
          white-space: nowrap;
          will-change: transform;
        }

        .trackA{ animation: conveyorMove 5.2s linear infinite; }
        .trackB{ animation: conveyorMove2 5.2s linear infinite; }

        @keyframes conveyorMove{
          from{ transform: translate3d(0, -50%, 0); }
          to{ transform: translate3d(-50%, -50%, 0); }
        }
        @keyframes conveyorMove2{
          from{ transform: translate3d(50%, -50%, 0); }
          to{ transform: translate3d(0, -50%, 0); }
        }

        .memeChip{
          width: 28px;
          height: 28px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.18);
          box-shadow: 0 10px 18px rgba(0,0,0,0.25);
          opacity: .92;
          transform: translateZ(0);
          position:relative;
          filter: saturate(1.1);
        }
        .memeChip:after{
          content:"";
          position:absolute; inset:0;
          border-radius:999px;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.20), transparent 60%);
          pointer-events:none;
        }
        .memeChip.glow{
          box-shadow:
            0 10px 18px rgba(0,0,0,0.25),
            0 0 18px rgba(0,255,204,0.18);
        }

        .conveyorShine{
          position:absolute; inset:-30% -10%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent);
          transform: translateX(-40%);
          animation: shine 1.6s ease-in-out infinite;
          pointer-events:none;
          opacity: .6;
        }
        @keyframes shine{
          0%{ transform: translateX(-40%); }
          100%{ transform: translateX(40%); }
        }

        .progress{ margin-top: 14px; position:relative; z-index:2; }
        .bar{
          display:flex; gap:6px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.03);
        }
        .bar span{
          flex:1;
          height: 16px;
          border-radius: 8px;
          background: rgba(255,255,255,0.06);
          overflow:hidden;
          position:relative;
        }
        .bar span:after{
          content:"";
          position:absolute; inset:-2px;
          background: linear-gradient(90deg, transparent, rgba(0,255,204,0.35), transparent);
          transform: translateX(-120%);
          animation: shimmer 1.1s ease-in-out infinite;
        }
        .bar span:nth-child(2):after{ animation-delay: .05s;}
        .bar span:nth-child(3):after{ animation-delay: .1s;}
        .bar span:nth-child(4):after{ animation-delay: .15s;}
        .bar span:nth-child(5):after{ animation-delay: .2s;}
        .bar span:nth-child(6):after{ animation-delay: .25s;}
        .bar span:nth-child(7):after{ animation-delay: .3s;}
        .bar span:nth-child(8):after{ animation-delay: .35s;}
        .bar span:nth-child(9):after{ animation-delay: .4s;}
        .bar span:nth-child(10):after{ animation-delay: .45s;}
        @keyframes shimmer { to { transform: translateX(120%); } }

        .launchRow{
          margin-top: 14px;
          display:flex; align-items:center; gap:10px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.03);
          position:relative;
          z-index:2;
        }
        .rocket{
          width:34px; height:34px;
          border-radius: 12px;
          display:flex; align-items:center; justify-content:center;
          background: rgba(255,170,0,0.10);
          border: 1px solid rgba(255,170,0,0.18);
          box-shadow: 0 0 20px rgba(255,170,0,0.10);
        }
        .hint{ color: rgba(255,255,255,0.68); font-size: 12px; }

        .screenFooter{
          position:absolute;
          left: 0; right: 0;
          bottom: 18px;
          display:flex;
          justify-content:center;
          pointer-events:none;
          z-index: 2;
        }
        .footerPill{
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
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .stageShadow{
          position:absolute; bottom:-18px; left: 12%;
          width: 76%; height: 34px;
          background: radial-gradient(closest-side, rgba(0,0,0,0.55), transparent 70%);
          filter: blur(6px);
          opacity: .8;
          transform: rotateX(70deg);
          z-index: 10;
        }

        @media (prefers-reduced-motion: reduce){
          .introGlow{ animation:none; }
          .machineBg{ animation:none; }
          .trackA, .trackB{ animation-duration: 9s; }
          .bar span:after{ animation-duration: .7s; }
          .conveyorShine{ animation:none; }
        }

        @media (max-width: 859px){
          .introGlow{ animation:none; }
        }
      `}</style>
    </div>
  );
}