"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { correctLeadCompanyMutation } from "@/lib/leads/mutations";
import { revalidateLeadsViews } from "@/lib/leads/revalidate";
import type { ActionResult } from "@/lib/pipeline/types";

const schema = z.object({
  leadId: z.string().min(1),
  correctedName: z.string().min(1).max(200),
});

export async function correctLeadCompany(
  input: z.infer<typeof schema>,
): Promise<ActionResult> {
  const { user } = await auth();
  if (!user) return { ok: false, error: "Non authentifié" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Entrée invalide" };
  }

  const result = await correctLeadCompanyMutation(
    parsed.data.leadId,
    parsed.data.correctedName,
    user.id,
  );
  if (result.ok) revalidateLeadsViews();
  return result;
}
