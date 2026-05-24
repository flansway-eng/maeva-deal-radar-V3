"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { stopCompanyMutation } from "@/lib/pipeline/mutations";
import { revalidatePipelineViews } from "@/lib/pipeline/revalidate-pipeline";
import type { ActionResult } from "@/lib/pipeline/types";

const schema = z.object({
  company: z.string().min(1).max(200),
  reason: z.string().min(1).max(500),
});

export async function stopCompany(
  input: z.infer<typeof schema>,
): Promise<ActionResult> {
  const { user } = await auth();
  if (!user) return { ok: false, error: "Non authentifié" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Entrée invalide",
    };
  }

  const result = await stopCompanyMutation({
    company: parsed.data.company,
    actorId: user.id,
    reason: parsed.data.reason,
  });

  if (result.ok) revalidatePipelineViews();
  return result;
}
