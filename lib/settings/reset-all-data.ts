import "server-only";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { revalidatePipelineViews } from "@/lib/pipeline/revalidate-pipeline";
import type { ActionResult } from "@/lib/pipeline/types";
import { clearFixtureOperationalData } from "@/lib/settings/clear-fixture-data";
import {
  copilotConversations,
  copilotMessages,
  dailyBriefs,
  leads,
  pushSubscriptions,
  reviewDecisions,
  sequenceEvents,
  sequenceTasks,
  signalFeed,
  signalFeedItems,
  sourcingRuns,
  voiceNotes,
  webDiscoveries,
} from "@/lib/db/schema";

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

  try {
    // SQLite ne supporte pas TRUNCATE — utiliser DELETE FROM dans le bon ordre (FK)
    await db.delete(copilotMessages);
    await db.delete(copilotConversations);
    await db.delete(voiceNotes);
    await db.delete(pushSubscriptions);
    await db.delete(dailyBriefs);
    await db.delete(signalFeed);
    await db.delete(signalFeedItems);
    await db.delete(sequenceEvents);
    await db.delete(sequenceTasks);
    await db.delete(reviewDecisions);
    await db.delete(leads);
    await db.delete(webDiscoveries);
    await db.delete(sourcingRuns);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Échec de la réinitialisation";
    return { ok: false, error: message };
  }

  // Invalide le cache de tout l'arbre App Router (layout + toutes les pages enfants)
  revalidatePath("/", "layout");

  // Invalide aussi les pages individuelles pour couvrir les caches par segment
  revalidatePipelineViews();
  for (const path of RESET_PATHS) {
    revalidatePath(path);
  }

  return { ok: true };
}
