import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FunrunV2 } from "../target/types/funrun_v2";

describe("funrun_v2", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.FunrunV2 as Program<FunrunV2>;

  it("scaffold placeholder", async () => {
    console.log("Program ID:", program.programId.toBase58());
  });
});
