import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { env } from "./lib/env.js";

const solanaConnectors = toSolanaWalletConnectors();

const privyConfig = {
  loginMethods: ["google"],
  embeddedWallets: {
    solana: {
      createOnLogin: "users-without-wallets",
    },
  },
  solanaClusters: [{ name: "devnet", rpcUrl: env.solanaRpcUrl }],
  appearance: {
    theme: "dark",
    showWalletLoginFirst: false,
  },
  externalWallets: {
    solana: {
      connectors: solanaConnectors,
    },
  },
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PrivyProvider appId={env.privyAppId} config={privyConfig}>
      <App />
    </PrivyProvider>
  </React.StrictMode>
);
