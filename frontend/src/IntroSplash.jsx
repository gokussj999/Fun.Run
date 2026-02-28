import React, { useEffect, useMemo, useState } from "react";

/**
 * IntroSplash (Mobile-first)
 * - 5s splash
 * - silent
 * - coins "rush out of phone" illusion using CSS perspective
 * - Call onDone() when finished
 */
export default function IntroSplash({ durationMs = 5000, onDone }) {
  const [leaving, setLeaving] = useState(false);

  // Generate a small set of coins (keep it light for mobile)
  const coins = useMemo(() => {
    const list = [];
    const count = 10; // keep under 12 for performance
    for (let i = 0; i < count; i++) {
      // random start positions inside phone screen
      const x = 10 + Math.random() * 80; // %
      const y = 12 + Math.random() * 70; // %
      const delay = 0.7 + Math.random() * 1.4; // seconds
      const driftX = (Math.random() * 2 - 1) * 40; // px
      const driftY = (Math.random() * 2 - 1) * 30; // px
      const spin = (Math.random() * 2 - 1) * 360; // deg
      const z = 700 + Math.random() * 600; // translateZ target

      // Choose emoji coin icons (fast, no image load)
      const icons = ["🪙", "💎", "🔥", "🚀", "🐸", "🐶", "🍌", "🧠"];
      const icon = icons[Math.floor(Math.random() * icons.length)];

      list.push({ id: i, x, y, delay, driftX, driftY, spin, z, icon });
    }
    return list;
  }, []);

  useEffect(() => {
    // Respect reduced motion (accessibility + older phones)
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
        {/* LEFT TEXT */}
        <div className="introLeft">
          <div className="brandPill">
            <span className="dot" />
            <span>LIVE</span>
          </div>

          <h1 className="introTitle">
            Create coins.
            <br />
            Make referrals.
            <br />
            Change your life.
          </h1>

          <p className="introSub">
            Creator-first • Reward-driven • Smooth & Fast
          </p>

          <div className="introBadges">
            <span className="badge">Referral 20%</span>
            <span className="badge badgeGold">Factory Mode</span>
          </div>
        </div>

        {/* RIGHT PHONE */}
        <div className="introRight">
          <div className="phoneStage">
            <div className="phone">
              <div className="phoneTop">
                <div className="cam" />
                <div className="speaker" />
              </div>

              <div className="screen">
                <div className="screenHeader">
                  <div className="logoBubble">🧪</div>
                  <div className="headerText">
                    <div className="h1">Cooking memes…</div>
                    <div className="h2">chains running • coins printing</div>
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

                {/* Coins inside screen */}
                <div className="coinLayer" aria-hidden="true">
                  {coins.map((c) => (
                    <div
                      key={c.id}
                      className="coin"
                      style={{
                        left: `${c.x}%`,
                        top: `${c.y}%`,
                        animationDelay: `${c.delay}s`,
                        ["--dx"]: `${c.driftX}px`,
                        ["--dy"]: `${c.driftY}px`,
                        ["--spin"]: `${c.spin}deg`,
                        ["--z"]: `${c.z}px`,
                      }}
                    >
                      {c.icon}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* “coins coming out” depth shadow */}
            <div className="stageShadow" />
          </div>
        </div>
      </div>

      {/* CSS */}
      <style>{`
        .introRoot{
          position:fixed; inset:0;
          z-index:9999;
          display:flex;
          align-items:center;
          justify-content:center;
          background: radial-gradient(1200px 700px at 70% 40%, rgba(0,255,204,0.10), rgba(0,0,0,0.95) 60%),
                      linear-gradient(180deg, rgba(0,0,0,0.82), rgba(0,0,0,0.95));
          overflow:hidden;
          padding:16px;
          transition: opacity .35s ease, transform .35s ease;
        }
        .introLeave{ opacity:0; transform: scale(1.02); pointer-events:none; }

        .introGlow{
          position:absolute; inset:-40%;
          background: radial-gradient(circle at 35% 40%, rgba(255,170,0,0.10), transparent 55%),
                      radial-gradient(circle at 70% 55%, rgba(0,255,204,0.10), transparent 55%);
          filter: blur(20px);
          animation: glowMove 4s ease-in-out infinite alternate;
          opacity: .9;
        }
        @keyframes glowMove { from{ transform: translate3d(-10px,-10px,0)} to { transform: translate3d(14px,10px,0)} }

        .introWrap{
          position:relative;
          width:min(980px, 100%);
          display:grid;
          grid-template-columns: 1fr;
          gap:18px;
          align-items:center;
        }

        /* Mobile-first: stack */
        @media (min-width: 860px){
          .introWrap{ grid-template-columns: 1.05fr 0.95fr; gap:24px; }
        }

        .introLeft{
          position:relative;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 18px;
          backdrop-filter: blur(10px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.35);
          overflow:hidden;
          animation: textIn .55s ease-out both;
        }
        @keyframes textIn { from{ opacity:0; transform: translateY(14px)} to { opacity:1; transform: translateY(0)} }

        .brandPill{
          display:inline-flex; align-items:center; gap:8px;
          border:1px solid rgba(0,255,204,0.30);
          background: rgba(0,255,204,0.08);
          color: rgba(210,255,245,0.95);
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          letter-spacing: .4px;
        }
        .brandPill .dot{
          width:8px; height:8px; border-radius:50%;
          background: rgba(0,255,204,0.95);
          box-shadow: 0 0 12px rgba(0,255,204,0.7);
        }

        .introTitle{
          margin:12px 0 8px;
          font-size: clamp(28px, 5vw, 44px);
          line-height: 1.05;
          font-weight: 900;
          background: linear-gradient(90deg, rgba(0,255,204,1), rgba(255,170,0,1));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 20px rgba(0,255,204,0.06);
        }
        .introSub{
          margin: 0 0 12px;
          color: rgba(255,255,255,0.75);
          font-size: 14px;
        }
        .introBadges{ display:flex; gap:10px; flex-wrap:wrap; }
        .badge{
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.85);
        }
        .badgeGold{
          border-color: rgba(255,170,0,0.30);
          background: rgba(255,170,0,0.10);
          color: rgba(255,220,170,0.95);
        }

        .introRight{
          display:flex;
          justify-content:center;
          align-items:center;
        }

        .phoneStage{
          position:relative;
          width: min(360px, 92vw);
          aspect-ratio: 9 / 16;
          display:flex;
          align-items:center;
          justify-content:center;
          perspective: 1000px;
        }

        .phone{
          width: 100%;
          height: 100%;
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 28px 70px rgba(0,0,0,0.45);
          transform: rotateY(-10deg) rotateX(6deg);
          overflow:hidden;
          position:relative;
        }

        .phoneTop{
          position:absolute; top:10px; left:50%;
          transform: translateX(-50%);
          display:flex; align-items:center; gap:10px;
          opacity:.8;
          z-index: 5;
        }
        .cam{ width:10px; height:10px; border-radius:50%; background: rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.08); }
        .speaker{ width:44px; height:6px; border-radius:999px; background: rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.07); }

        .screen{
          position:absolute; inset:0;
          padding: 18px 14px;
          background: radial-gradient(700px 420px at 60% 20%, rgba(0,255,204,0.14), transparent 60%),
                      radial-gradient(700px 420px at 30% 70%, rgba(255,170,0,0.10), transparent 60%),
                      linear-gradient(180deg, rgba(10,14,18,0.9), rgba(6,8,10,0.95));
        }

        .screenHeader{
          display:flex; gap:12px; align-items:center;
          margin-top: 18px;
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

        .progress{ margin-top: 18px; }
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

        @keyframes shimmer {
          to { transform: translateX(120%); }
        }

        .launchRow{
          margin-top: 16px;
          display:flex; align-items:center; gap:10px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.03);
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

        .coinLayer{
          position:absolute; inset:0;
          transform-style: preserve-3d;
          pointer-events:none;
        }

        .coin{
          position:absolute;
          font-size: 22px;
          filter: blur(6px);
          opacity: 0;
          transform: translate3d(0,0,0) scale(0.45);
          text-shadow: 0 10px 20px rgba(0,0,0,0.35);
          animation: coinRush 2.2s cubic-bezier(.2,.8,.2,1) forwards;
          will-change: transform, opacity, filter;
        }

        @keyframes coinRush{
          0%{
            opacity: 0;
            filter: blur(8px);
            transform: translate3d(0,0,0) translateZ(0px) scale(0.35) rotate(0deg);
          }
          20%{
            opacity: 1;
          }
          100%{
            opacity: 1;
            filter: blur(0px);
            transform:
              translate3d(var(--dx), var(--dy), 0)
              translateZ(var(--z))
              scale(2.2)
              rotate(var(--spin));
          }
        }

        .stageShadow{
          position:absolute; bottom:-18px; left: 12%;
          width: 76%; height: 34px;
          background: radial-gradient(closest-side, rgba(0,0,0,0.55), transparent 70%);
          filter: blur(6px);
          opacity: .8;
          transform: rotateX(70deg);
        }

        /* If reduced motion, make it quick and light */
        @media (prefers-reduced-motion: reduce){
          .introGlow{ animation:none; }
          .coin{ animation-duration: .9s; }
          .bar span:after{ animation-duration: .7s; }
        }
      `}</style>
    </div>
  );
}