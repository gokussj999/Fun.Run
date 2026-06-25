import express from "express";
import crypto from "crypto";
import bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import { getProgram, getCoinStatePDA, create_coin, buy, sell, Wallet } from "../solana/program.js";

const router = express.Router();

// --- Wallet helpers (same AES-256-CBC as wallet.js) ---

function decrypt(text) {
  const [ivHex, encHex] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(process.env.ENCRYPTION_KEY),
    iv
  );
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString();
}

// encryptedMnemonic → Anchor Wallet
// Phase 1.2: mnemonic directly in body. Production mein DB se lookup hoga.
async function walletFromEncryptedMnemonic(encryptedMnemonic) {
  const mnemonic = decrypt(encryptedMnemonic);
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const derived = derivePath("m/44'/501'/0'/0'", seed.toString("hex")).key;
  const keypair = Keypair.fromSeed(derived);
  return new Wallet(keypair);
}

// --- POST /api/onchain/create-coin ---
// Body: { coinId } — encryptedMnemonic comes from server-side DB lookup (req._encryptedMnemonic)
router.post("/create-coin", async (req, res) => {
  try {
    const { coinId } = req.body;
    const encryptedMnemonic = req._encryptedMnemonic; // set by auth middleware in server.js
    if (!coinId || !encryptedMnemonic)
      return res.status(400).json({ success: false, error: "coinId required" });

    const wallet = await walletFromEncryptedMnemonic(encryptedMnemonic);
    const txHash = await create_coin(wallet, coinId);
    const coinStatePDA = getCoinStatePDA(coinId).toBase58();

    return res.json({ success: true, txHash, coinStatePDA });
  } catch (err) {
    console.error("❌ /create-coin:", err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || "create-coin failed" });
  }
});

// --- POST /api/onchain/buy ---
// Body: { coinId, solAmount } — encryptedMnemonic from server-side DB lookup
router.post("/buy", async (req, res) => {
  try {
    const { coinId, solAmount } = req.body;
    const encryptedMnemonic = req._encryptedMnemonic;
    if (!coinId || !encryptedMnemonic || solAmount == null)
      return res.status(400).json({ success: false, error: "coinId and solAmount required" });

    const wallet = await walletFromEncryptedMnemonic(encryptedMnemonic);
    const program = getProgram(wallet);
    const pda = getCoinStatePDA(coinId);

    const before = await program.account.coinState.fetch(pda);
    const txHash = await buy(wallet, coinId, solAmount);
    const after = await program.account.coinState.fetch(pda);

    const tokensReceived = after.tokenSupply.sub(before.tokenSupply).toString();
    return res.json({ success: true, txHash, tokensReceived });
  } catch (err) {
    console.error("❌ /buy:", err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || "buy failed" });
  }
});

// --- POST /api/onchain/sell ---
// Body: { coinId, tokenAmount } — encryptedMnemonic from server-side DB lookup
router.post("/sell", async (req, res) => {
  try {
    const { coinId, tokenAmount } = req.body;
    const encryptedMnemonic = req._encryptedMnemonic;
    if (!coinId || !encryptedMnemonic || tokenAmount == null)
      return res.status(400).json({ success: false, error: "coinId and tokenAmount required" });

    const wallet = await walletFromEncryptedMnemonic(encryptedMnemonic);
    const program = getProgram(wallet);
    const pda = getCoinStatePDA(coinId);

    const before = await program.account.coinState.fetch(pda);
    const txHash = await sell(wallet, coinId, tokenAmount);
    const after = await program.account.coinState.fetch(pda);

    const solReceived = before.solReserve.sub(after.solReserve).toString();
    return res.json({ success: true, txHash, solReceived });
  } catch (err) {
    console.error("❌ /sell:", err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || "sell failed" });
  }
});

// --- GET /api/onchain/coin/:coinId ---
router.get("/coin/:coinId", async (req, res) => {
  try {
    const { coinId } = req.params;

    // Read-only: throwaway keypair, koi sign nahi hoga
    const readonlyWallet = new Wallet(Keypair.generate());
    const program = getProgram(readonlyWallet);
    const pda = getCoinStatePDA(coinId);
    const state = await program.account.coinState.fetch(pda);

    return res.json({
      success: true,
      solReserve:  state.solReserve.toString(),
      tokenSupply: state.tokenSupply.toString(),
      totalSupply: state.totalSupply.toString(),
      isGraduated: state.isGraduated,
      creator:     state.creator.toBase58(),
    });
  } catch (err) {
    console.error("❌ /coin/:coinId:", err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || "fetch failed" });
  }
});

export default router;
