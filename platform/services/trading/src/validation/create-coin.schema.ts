import { z } from 'zod';

export const CreateCoinBodySchema = z.object({
  name: z.string().min(1).max(32),
  symbol: z.string().min(1).max(10),
  story: z.string().max(500).optional(),
  logo: z.string().max(2048).optional(),
  metadataUri: z.string().max(200).optional(),
  initialSol: z.number().min(0).optional(),
  creatorWallet: z.string().optional(),
});

export type CreateCoinBody = z.infer<typeof CreateCoinBodySchema>;
