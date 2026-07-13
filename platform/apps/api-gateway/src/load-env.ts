import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadDotenv } from 'dotenv';

/** Absolute path of the .env file loaded at startup, if any. */
export let loadedEnvPath: string | null = null;

function resolveEnvPath(): string | null {
  const explicit = process.env['DOTENV_CONFIG_PATH'];
  if (explicit && existsSync(explicit)) {
    return explicit;
  }

  // dist/index.js → platform/.env
  const here = dirname(fileURLToPath(import.meta.url));
  const platformEnv = join(here, '../../../.env');
  if (existsSync(platformEnv)) {
    return platformEnv;
  }

  const cwdEnv = join(process.cwd(), '.env');
  if (existsSync(cwdEnv)) {
    return cwdEnv;
  }

  return null;
}

const envPath = resolveEnvPath();
if (envPath) {
  loadDotenv({ path: envPath });
  loadedEnvPath = envPath;
}
