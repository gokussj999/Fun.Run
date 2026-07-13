#!/usr/bin/env node
/**
 * Configure PRIVY_TOKEN_COOKIE in platform/.env without printing the value.
 * Usage: node scripts/set-privy-token-cookie.mjs < token.txt
 *    or: echo <value> | node scripts/set-privy-token-cookie.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ENV_FILE = join(here, '../.env');
const TMP_FILE = join(here, '.privy-token-cookie.tmp');
const COOKIES_FILE = join(here, '.e2e-cookies.json');

function upsertEnv(token) {
  const line = `PRIVY_TOKEN_COOKIE=${token}`;
  const content = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';
  const updated = /^PRIVY_TOKEN_COOKIE=/m.test(content)
    ? content.replace(/^PRIVY_TOKEN_COOKIE=.*/m, line)
    : `${content.trimEnd()}\n${line}\n`;
  writeFileSync(ENV_FILE, updated, 'utf8');
}

async function readToken() {
  const arg = process.argv[2]?.trim();
  if (arg && arg.length > 20) return arg;
  if (existsSync(TMP_FILE)) {
    const tmp = readFileSync(TMP_FILE, 'utf8').trim();
    if (tmp.length > 20) return tmp;
  }
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const stdin = Buffer.concat(chunks).toString('utf8').trim();
  return stdin.length > 20 ? stdin : '';
}

const token = await readToken();
if (!token) {
  console.error('No PRIVY_TOKEN_COOKIE value provided.');
  process.exit(1);
}

upsertEnv(token);
writeFileSync(COOKIES_FILE, JSON.stringify([{ name: 'privy-token', value: token }]));
console.log('PRIVY_TOKEN_COOKIE configured for E2E');
