"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getLeadById } from "@/lib/db/queries/leads";
import {
  markLeadsKeepBulkMutation,
  markLeadsStopBulkMutation,
} from "@/lib/leads/mutations";
import { revalidateLeadsViews } from "@/lib/leads/revalidate";
import type { ActionResult } from "@/lib/pipeline/types";
import {
  createSequenceTasksForLead,
  sequenceExistsForLead,
} from "@/lib/sequences/create-sequence-tasks";
import { generateSequenceMessages } from "@/lib/sequences/generate-sequence-messages";

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

export async function bulkGenerateSequence(
  input: z.infer<typeof bulkSchema>,
): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  const { user } = await auth();
  if (!user) return { ok: false, error: "Non authentifié" };

  const parsed = bulkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Sélection invalide" };

  let totalCreated = 0;

  for (const leadId of parsed.data.leadIds) {
    const lead = await getLeadById(leadId);
    if (!lead) continue;
    if (lead.reviewStatus !== "KEEP") continue;
    if (await sequenceExistsForLead(lead.id)) continue;

    const messages = await generateSequenceMessages(lead);
    const created = await createSequenceTasksForLead(lead, messages);
    totalCreated += created;
  }

  revalidateLeadsViews();
  revalidatePath("/messages");

  return { ok: true, created: totalCreated };
}
