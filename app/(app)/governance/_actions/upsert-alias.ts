"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { upsertAliasMutation } from "@/lib/governance/mutations";
import { revalidatePipelineViews } from "@/lib/pipeline/revalidate-pipeline";
import type { ActionResult } from "@/lib/pipeline/types";

const schema = z.object({
  id: z.string().optional(),
  domain: z.string().min(1).max(200),
  canonicalName: z.string().min(1).max(200),
  track: z.enum(["PE", "MA"]).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export async function upsertAlias(
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

  const result = await upsertAliasMutation(parsed.data, user.id);
  if (result.ok) revalidatePipelineViews();
  return result;
}
