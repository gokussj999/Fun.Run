import { PublicKey, SystemProgram, TransactionInstruction, type AccountMeta } from '@solana/web3.js';

import { anchorDiscriminator, encodeString } from '../codec.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  findGlobalConfigPda,
  findTreasuryPda,
  findCreatorProfilePda,
  findBondingCurvePda,
  getAtaAddress,
} from '../accounts.js';
import type { CreateCoinArgs } from '../idl.js';

const DISCRIMINATOR = anchorDiscriminator('create_coin');

export interface CreateCoinOpts extends CreateCoinArgs {
  /** Transaction signer who will own the coin. */
  creator:   PublicKey;
  /** Freshly-generated mint keypair pubkey; the caller must include the keypair as an additional signer. */
  mint:      PublicKey;
  programId: PublicKey;
}

export interface CreateCoinResult {
  instruction:      TransactionInstruction;
  bondingCurvePda:  PublicKey;
  bondingCurveBump: number;
}

export function buildCreateCoinInstruction(opts: CreateCoinOpts): CreateCoinResult {
  const { creator, mint, name, symbol, uri, programId } = opts;

  const [globalConfig]   = findGlobalConfigPda(programId);
  const [treasury]       = findTreasuryPda(programId);
  const [creatorProfile] = findCreatorProfilePda(creator, programId);
  const [bondingCurve, bondingCurveBump] = findBondingCurvePda(mint, programId);
  const bondingCurveVault = getAtaAddress(mint, bondingCurve);

  const data = Buffer.concat([
    DISCRIMINATOR,
    encodeString(name),
    encodeString(symbol),
    encodeString(uri),
  ]);

  const keys: AccountMeta[] = [
    { pubkey: creator,                  isSigner: true,  isWritable: true  },
    { pubkey: globalConfig,             isSigner: false, isWritable: true  },
    { pubkey: treasury,                 isSigner: false, isWritable: true  },
    { pubkey: creatorProfile,           isSigner: false, isWritable: true  },
    { pubkey: mint,                     isSigner: true,  isWritable: true  },
    { pubkey: bondingCurve,             isSigner: false, isWritable: true  },
    { pubkey: bondingCurveVault,        isSigner: false, isWritable: true  },
    { pubkey: TOKEN_PROGRAM_ID,            isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId,     isSigner: false, isWritable: false },
  ];

  return {
    instruction: new TransactionInstruction({ keys, programId, data }),
    bondingCurvePda: bondingCurve,
    bondingCurveBump,
  };
}
