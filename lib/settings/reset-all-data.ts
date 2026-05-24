import "server-only";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { revalidatePipelineViews } from "@/lib/pipeline/revalidate-pipeline";
import type { ActionResult } from "@/lib/pipeline/types";
import { clearFixtureOperationalData } from "@/lib/settings/clear-fixture-data";

const RESET_PATHS = [
  "/",
  "/pipeline",
  "/today",
  "/journal",
  "/messages",
  "/governance",
  "/governance/review",
  "/governance/normalize",
  "/governance/quality-audit",
  "/sourcing",
  "/leads",
  "/exports",
  "/settings",
] as const;

export async function resetAllDataMutation(): Promise<ActionResult> {
  clearFixtureOperationalData();

  if (process.env.DATABASE_URL) {
    try {
      await db.execute(sql`
        TRUNCATE sequence_events, sequence_tasks, review_decisions, leads, web_discoveries, sourcing_runs
        RESTART IDENTITY CASCADE
      `);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Échec de la réinitialisation";
      return { ok: false, error: message };
    }
  }

  revalidatePipelineViews();
  for (const path of RESET_PATHS) {
    revalidatePath(path);
  }

  return { ok: true };
}
