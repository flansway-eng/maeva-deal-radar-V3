/**
 * Vérifie que les tables SQLite principales existent dans local.db.
 * Usage: node scripts/verify-db-tables.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const DB_PATH = path.join(process.cwd(), "local.db");

if (!fs.existsSync(DB_PATH)) {
  console.error(`✗ local.db introuvable à ${DB_PATH}`);
  console.error("→ Exécutez : pnpm db:migrate");
  process.exit(1);
}

const Database = require("better-sqlite3");
const db = new Database(DB_PATH, { readonly: true });

const EXPECTED = [
  "web_discoveries",
  "sourcing_runs",
  "leads",
  "sequence_tasks",
  "sequence_events",
  "signal_feed",
  "signal_feed_items",
  "daily_briefs",
  "company_aliases",
  "review_decisions",
  "copilot_conversations",
  "copilot_messages",
  "voice_notes",
  "push_subscriptions",
];

const existing = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table'")
  .all()
  .map((r) => r.name);

let ok = 0;
for (const table of EXPECTED) {
  if (existing.includes(table)) {
    console.log(`✓ ${table}`);
    ok++;
  } else {
    console.log(`✗ ${table} — MANQUANTE`);
  }
}

db.close();
console.log(`\n${ok}/${EXPECTED.length} tables présentes dans local.db`);
process.exit(ok === EXPECTED.length ? 0 : 1);
