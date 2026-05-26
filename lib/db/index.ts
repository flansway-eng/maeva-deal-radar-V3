import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "node:path";

// Chemin absolu vers la base SQLite locale
const dbPath =
  process.env.SQLITE_DB_PATH ?? path.join(process.cwd(), "local.db");

const sqlite = new Database(dbPath);

// Active le mode WAL pour de meilleures performances en concurrence
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
