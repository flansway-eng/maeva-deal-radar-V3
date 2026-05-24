"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { markLeadStopMutation } from "@/lib/leads/mutations";
import { revalidateLeadsViews } from "@/lib/leads/revalidate";
import type { ActionResult } from "@/lib/pipeline/types";

const schema = z.object({ leadId: z.string().min(1) });

export async function markLeadStop(
  input: z.infer<typeof schema>,
): Promise<ActionResult> {
  const { user } = await auth();
  if (!user) return { ok: false, error: "Non authentifié" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Lead invalide" };
  }

  const result = await markLeadStopMutation(parsed.data.leadId, user.id);
  if (result.ok) revalidateLeadsViews();
  return result;
}
