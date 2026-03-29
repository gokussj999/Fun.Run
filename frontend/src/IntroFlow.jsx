import React, { useEffect, useState } from "react";

export default function IntroFlow({ onDone }) {
  const [step, setStep] = useState(0); // 0 = logo, 1 = intro

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 2000); // 2s logo
    const t2 = setTimeout(() => onDone(), 5000);   // total 5s

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div style={styles.wrap}>
      {step === 0 ? <LogoScreen /> : <IntroScreen />}
    </div>
  );
}

function LogoScreen() {
  return (
    <div style={styles.center}>
      <img
        src="/logo.png" // 🔥 apna logo yahan daalo
        alt="logo"
        style={{ width: 180, height: 180 }}
      />
    </div>
  );
}

function IntroScreen() {
  return (
    <div style={styles.center}>
      <img
        src="/intro.png" // 🔥 tumhari badi wali image
        alt="intro"
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 20,
        }}
      />
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    inset: 0,
    background: "#05080f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
};