import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Secure configuration fallback for local tests or non-production environment
const getConnectionString = () => {
  if (connectionString) return connectionString;
  // TODO(security): Ensure raw database URL is not hardcoded here
  console.warn("DATABASE_URL is missing. Using local test connection string.");
  return "postgres://postgres:postgres@localhost:5432/postgres";
};

const finalConnectionString = getConnectionString();

export const client = postgres(finalConnectionString, { prepare: false });
export const db = drizzle(client, { schema });
