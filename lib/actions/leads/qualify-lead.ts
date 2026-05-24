"use server";

import { qualifyLead } from "@/lib/ai/qualify-lead";
import { auth } from "@/lib/auth";
import type { LeadQualificationData } from "@/lib/db/schema";

export async function qualifyLeadAction(
  leadId: string,
): Promise<
  { ok: true; data: LeadQualificationData } | { ok: false; error: string }
> {
  const { user } = await auth();
  if (!user) return { ok: false, error: "Non authentifié" };

  const result = await qualifyLead(leadId);
  if ("error" in result) {
    return { ok: false, error: result.error };
  }

  return { ok: true, data: result };
}
