/**
 * Active pgvector avant drizzle-kit push (requis pour colonnes vector(1536)).
 * Usage: node scripts/ensure-pgvector.mjs
 */
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    console.error(".env introuvable");
    process.exit(1);
  }
  const vars = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq)] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const env = loadEnv();
const url = env.DIRECT_URL || env.DATABASE_URL;
if (!url) {
  console.error("DIRECT_URL ou DATABASE_URL requis dans .env");
  process.exit(1);
}

const sql = postgres(url, { max: 1, ssl: "require" });

try {
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  console.log("✓ Extension pgvector activée");
} catch (err) {
  console.error(
    "Échec activation pgvector:",
    err instanceof Error ? err.message : err,
  );
  console.error(
    "→ Supabase Dashboard → Database → Extensions → activer « vector »",
  );
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
