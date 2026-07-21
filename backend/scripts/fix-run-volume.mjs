import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");
const envText = fs.readFileSync(envPath, "utf8");
const dbUrl = envText
  .split(/\r?\n/)
  .map((l) => l.trim())
  .find((l) => l.startsWith("DATABASE_URL="))
  ?.slice("DATABASE_URL=".length)
  ?.replace(/^["']|["']$/g, "");

if (!dbUrl) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = postgres(dbUrl, { ssl: "require", max: 1 });
const RUN = "7cc0f755e5a5475ca8345a062d5c2475";
const apply = process.argv.includes("--apply");

try {
  const [coin] = await sql`
    select id, symbol, volume_sol
    from coins
    where id = ${RUN}
  `;
  const [tx] = await sql`
    select
      coalesce(sum(sol), 0)::float8 as real_volume,
      count(*)::int as n
    from transactions
    where coin_id = ${RUN}
      and upper(type) in ('BUY', 'SELL')
  `;

  const stored = Number(coin?.volume_sol || 0);
  const real = Number(tx?.real_volume || 0);
  console.log({
    symbol: coin?.symbol,
    storedVolumeSol: stored,
    realTxVolumeSol: real,
    ratio: real > 0 ? stored / real : null,
    txCount: tx?.n,
    apply,
  });

  if (apply) {
    await sql`
      update coins
      set volume_sol = ${real}
      where id = ${RUN}
    `;
    console.log("updated volume_sol ->", real);
  } else {
    console.log("dry-run only (pass --apply to write)");
  }
} finally {
  await sql.end({ timeout: 5 });
}
