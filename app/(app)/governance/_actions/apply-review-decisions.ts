"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { applyReviewDecisionsMutation } from "@/lib/governance/mutations";
import { revalidatePipelineViews } from "@/lib/pipeline/revalidate-pipeline";
import type { ActionResult } from "@/lib/pipeline/types";

const itemSchema = z.object({
  reviewId: z.string().min(1),
  decision: z.enum(["KEEP", "STOP", "CORRECT"]),
  correctedCompany: z.string().max(200).optional(),
  reason: z.string().max(500).optional(),
});

const schema = z.object({
  items: z.array(itemSchema).min(1).max(50),
});

export async function applyReviewDecisions(
  input: z.infer<typeof schema>,
): Promise<ActionResult & { applied?: number }> {
  const { user } = await auth();
  if (!user) return { ok: false, error: "Non authentifié" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Entrée invalide",
    };
  }

  for (const item of parsed.data.items) {
    if (item.decision === "CORRECT" && !item.correctedCompany?.trim()) {
      return {
        ok: false,
        error: "Nom corrigé requis pour une décision CORRECT",
      };
    }
  }

  const result = await applyReviewDecisionsMutation(parsed.data.items, user.id);
  if (result.ok) revalidatePipelineViews();
  return result;
}
