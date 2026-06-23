import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { PrivyProvider } from "@privy-io/react-auth";

const privyConfig = {
  loginMethods: ["google"],
  embeddedWallets: {
    createOnLogin: "users-without-wallets",
  },
  solanaClusters: [{ name: "devnet", rpcUrl: "https://api.devnet.solana.com" }],
  appearance: {
    theme: "dark",
    showWalletLoginFirst: false,
  },
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PrivyProvider
      appId="cmld3um1x01w8i50ct60xaywb"
      config={privyConfig}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>
);
