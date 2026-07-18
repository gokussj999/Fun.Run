import { Connection, clusterApiUrl } from "@solana/web3.js";

const rpc =
  process.env.SOLANA_RPC ||
  process.env.SOLANA_PROGRAM_RPC ||
  clusterApiUrl("devnet");

const connection = new Connection(rpc, "confirmed");

export default connection;
