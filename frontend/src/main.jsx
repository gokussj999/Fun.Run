import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { env } from "./lib/env.js";

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
});

const rpcHttp = env.solanaRpcUrl || "https://api.mainnet-beta.solana.com";
const rpcWs = rpcHttp.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");

const privyConfig = {
  loginMethods: ["google", "wallet"],
  embeddedWallets: {
    solana: {
      createOnLogin: "users-without-wallets",
    },
  },
  solana: {
    rpcs: {
      "solana:mainnet": {
        rpc: createSolanaRpc(rpcHttp),
        rpcSubscriptions: createSolanaRpcSubscriptions(rpcWs),
      },
    },
  },
  appearance: {
    theme: "dark",
    showWalletLoginFirst: false,
    walletChainType: "solana-only",
    walletList: ["phantom", "solflare", "backpack", "detected_solana_wallets"],
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
