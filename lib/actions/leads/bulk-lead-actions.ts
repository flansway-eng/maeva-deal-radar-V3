"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  markLeadsKeepBulkMutation,
  markLeadsStopBulkMutation,
} from "@/lib/leads/mutations";
import { revalidateLeadsViews } from "@/lib/leads/revalidate";
import type { ActionResult } from "@/lib/pipeline/types";

const bulkSchema = z.object({
  leadIds: z.array(z.string().min(1)).min(1),
});

export async function bulkMarkLeadsKeep(
  input: z.infer<typeof bulkSchema>,
): Promise<ActionResult & { applied?: number }> {
  const { user } = await auth();
  if (!user) return { ok: false, error: "Non authentifié" };

  const parsed = bulkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Sélection invalide" };

  const result = await markLeadsKeepBulkMutation(parsed.data.leadIds, user.id);
  if (result.ok) revalidateLeadsViews();
  return result;
}

export async function bulkMarkLeadsStop(
  input: z.infer<typeof bulkSchema>,
): Promise<ActionResult & { applied?: number }> {
  const { user } = await auth();
  if (!user) return { ok: false, error: "Non authentifié" };

  const parsed = bulkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Sélection invalide" };

  const result = await markLeadsStopBulkMutation(parsed.data.leadIds, user.id);
  if (result.ok) revalidateLeadsViews();
  return result;
}
