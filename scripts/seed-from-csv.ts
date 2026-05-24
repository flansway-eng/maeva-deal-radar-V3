/**
 * Import idempotent depuis les exports CSV v1 (spec §17).
 *
 * Usage:
 *   DATABASE_URL=postgres://... pnpm exec tsx scripts/seed-from-csv.ts
 *
 * Déposer les fichiers dans seeds/v1/ :
 *   - maeva_clean_sequence_queue.csv → sequence_tasks
 *   - maeva_pe_ma_shortlist.csv → leads
 *   - maeva_review_queue.csv → review_decisions
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const SEEDS_DIR = join(process.cwd(), "seeds", "v1");

function loadCsv(name: string): string | null {
  const path = join(SEEDS_DIR, name);
  if (!existsSync(path)) {
    console.warn(`[skip] ${name} introuvable dans ${SEEDS_DIR}`);
    return null;
  }
  return readFileSync(path, "utf-8");
}

function parseCsvLine(line: string): string[] {
  return line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn(
      "DATABASE_URL absent — seed DB ignoré. Les fixtures en mémoire (lib/db/queries/*-fixture.ts) restent actives.",
    );
    process.exit(0);
  }

  const sql = postgres(url, { prepare: false });

  const queueCsv = loadCsv("maeva_clean_sequence_queue.csv");
  const shortlistCsv = loadCsv("maeva_pe_ma_shortlist.csv");
  const reviewCsv = loadCsv("maeva_review_queue.csv");

  if (!queueCsv && !shortlistCsv && !reviewCsv) {
    console.log(
      "Aucun CSV trouvé. Le fixture en mémoire (100 tâches) reste actif en dev.",
    );
    console.log(`Placez les exports dans: ${SEEDS_DIR}`);
    await sql.end();
    return;
  }

  // Import minimal : à étendre selon le format exact des CSV v1
  if (reviewCsv) {
    const lines = reviewCsv.split("\n").filter(Boolean);
    const header = lines[0];
    console.log(`Review queue: ${lines.length - 1} lignes (header: ${header})`);
    // TODO: mapper colonnes CSV → review_decisions (idempotent sur source)
  }

  if (shortlistCsv) {
    const lines = shortlistCsv.split("\n").filter(Boolean);
    console.log(`Shortlist: ${lines.length - 1} lignes`);
  }

  if (queueCsv) {
    const lines = queueCsv.split("\n").filter(Boolean);
    console.log(`Sequence queue: ${lines.length - 1} lignes`);
    const header = parseCsvLine(lines[0] ?? "");
    console.log("Colonnes:", header.join(", "));
  }

  console.log("Seed CSV terminé (stub — brancher mapping colonnes v1).");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
